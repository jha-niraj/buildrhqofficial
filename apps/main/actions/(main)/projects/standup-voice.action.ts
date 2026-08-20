'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import {
    db, projectV2StandupConfigs, projectV2StandupEntries, projectsV2, users, creditTransactions,
    withTransaction
} from '@repo/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { startBackgroundJob } from '@/actions/(main)/workers/jobs.action'

interface StandupSessionVariables {
    user_name: string
    project_name: string
    project_id: string
    current_date: string
    time_of_day: 'morning' | 'afternoon' | 'evening'
    previous_standup?: {
        date: string
        completed_tasks: string[]
        planned_tasks: string[]
    }
}


/**
 * Create a new standup session for a project
 */
export async function createStandupSession(projectId: string, projectSlug: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const userId = session.user.id

        const [[user], project] = await Promise.all([
            db
                .select({ id: users.id, name: users.name, credits: users.credits })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1),
            db.query.projectsV2.findFirst({
                where: eq(projectsV2.id, projectId),
                with: {
                    standupConfigs: {
                        where: (configs, { eq }) => eq(configs.userId, userId)
                    }
                }
            })
        ])

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const creditsRequired = 5
        if (user.credits < creditsRequired) {
            return {
                success: false,
                error: 'Insufficient credits',
                required: creditsRequired,
                available: user.credits
            }
        }

        let standupConfig = project.standupConfigs[0]
        if (!standupConfig) {
            const now = new Date()
            const weekEnd = new Date(now)
            weekEnd.setDate(weekEnd.getDate() + 7)

            const [created] = await db
                .insert(projectV2StandupConfigs)
                .values({
                    userId,
                    projectId: project.id,
                    daysPerWeek: 5,
                    standupTime: '09:00',
                    durationMinutes: 10,
                    selectedDays: [1, 2, 3, 4, 5],
                    creditsPerDay: 5,
                    weeklyCredits: 25,
                    isActive: true,
                    currentWeekStart: now,
                    currentWeekEnd: weekEnd
                })
                .returning()

            if (!created) throw new Error("Failed to create standup config")
            standupConfig = created
        }

        const previousEntry = await db.query.projectV2StandupEntries.findFirst({
            where: and(
                eq(projectV2StandupEntries.configId, standupConfig.id),
                eq(projectV2StandupEntries.status, 'SUBMITTED')
            ),
            orderBy: [desc(projectV2StandupEntries.submittedAt)]
        })

        const now = new Date()
        const hour = now.getHours()
        let timeOfDay: 'morning' | 'afternoon' | 'evening'
        if (hour < 12) timeOfDay = 'morning'
        else if (hour < 17) timeOfDay = 'afternoon'
        else timeOfDay = 'evening'

        const variables: StandupSessionVariables = {
            user_name: user.name?.split(' ')[0] || 'there',
            project_name: project.title,
            project_id: project.id,
            current_date: now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time_of_day: timeOfDay,
            ...(previousEntry && {
                previous_standup: {
                    date: previousEntry.submittedAt?.toLocaleDateString() || '',
                    completed_tasks: previousEntry.whatDidYesterday ? [previousEntry.whatDidYesterday] : [],
                    planned_tasks: previousEntry.whatDoingToday ? [previousEntry.whatDoingToday] : []
                }
            })
        }

        const result = await withTransaction(async (tx) => {
            const [standupEntry] = await tx
                .insert(projectV2StandupEntries)
                .values({
                    configId: standupConfig.id,
                    scheduledFor: now,
                    status: 'SCHEDULED'
                })
                .returning()

            // Guarded in SQL, not by the balance read above: two concurrent requests
                // both pass a read-then-write check and both debit. Zero rows updated
                // means the balance moved under us, and throwing rolls the whole
                // transaction back - so nothing is created that was not paid for.
            const debited = await tx
                .update(users)
                .set({ credits: sql`${users.credits} - ${creditsRequired}` })
                .where(and(eq(users.id, userId), sql`${users.credits} >= ${creditsRequired}`))
                .returning({ credits: users.credits })
            if (debited.length === 0) throw new Error("Insufficient credits")

            await tx.insert(creditTransactions).values({
                userId,
                amount: -creditsRequired,
                type: 'SPEND',
                description: `Daily Standup: ${project.title}`,
                currency: 'INR'
            })

            return standupEntry
        })

        revalidatePath(`/projects/${projectSlug}`)

        const agentId = process.env.NEXT_PUBLIC_STANDUP_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_MOCKVOICE || ''

        if (!result) throw new Error("Failed to create standup entry")

        return {
            success: true,
            sessionId: result.id,
            agentId,
            variables
        }

    } catch (error) {
        console.error('Error creating standup session:', error)
        return {
            success: false,
            error: 'Failed to create standup session'
        }
    }
}

/**
 * Hand the finished call to the worker.
 *
 * This used to poll ElevenLabs inline - thirty one-second waits for the
 * transcript, then a completion to extract the standup items, all on a request
 * Cloudflare would kill first. Now it inserts a job and returns; the Durable
 * Object waits, extracts and writes the entry, and the sheet polls the job.
 *
 * No credits are held here: the standup was charged for when the session was
 * created, and the entry row exists either way. A failed job costs the summary,
 * not the standup.
 */
export async function processStandupConversation(sessionId: string, conversationId: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
}> {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // Scoped to the caller: an entry id alone must not let anyone attach a
    // transcript to somebody else's standup.
    const [entry] = await db
        .select({ id: projectV2StandupEntries.id })
        .from(projectV2StandupEntries)
        .innerJoin(projectV2StandupConfigs, eq(projectV2StandupEntries.configId, projectV2StandupConfigs.id))
        .where(and(eq(projectV2StandupEntries.id, sessionId), eq(projectV2StandupConfigs.userId, session.user.id)))
        .limit(1)
    if (!entry) return { success: false, error: 'Standup not found' }

    return startBackgroundJob('standup_voice', { entryId: sessionId, conversationId })
}

/**
 * Get standup history for a project
 */
export async function getStandupHistory(projectId: string, limit: number = 10) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const [standupConfig] = await db
            .select({ id: projectV2StandupConfigs.id })
            .from(projectV2StandupConfigs)
            .where(
                and(
                    eq(projectV2StandupConfigs.userId, session.user.id),
                    eq(projectV2StandupConfigs.projectId, projectId)
                )
            )
            .limit(1)

        if (!standupConfig) {
            return { success: true, standups: [] }
        }

        const standups = await db
            .select()
            .from(projectV2StandupEntries)
            .where(
                and(
                    eq(projectV2StandupEntries.configId, standupConfig.id),
                    eq(projectV2StandupEntries.status, 'SUBMITTED')
                )
            )
            .orderBy(desc(projectV2StandupEntries.submittedAt))
            .limit(limit)

        return {
            success: true,
            standups: standups.map(s => ({
                id: s.id,
                date: s.submittedAt?.toLocaleDateString() || '',
                completedTasks: s.whatDidYesterday ? [s.whatDidYesterday] : [],
                plannedTasks: s.whatDoingToday ? [s.whatDoingToday] : [],
                blockers: s.anyBlockers ? [s.anyBlockers] : [],
                duration: s.durationSeconds
            }))
        }

    } catch (error) {
        console.error('Error fetching standup history:', error)
        return { success: false, error: 'Failed to fetch history' }
    }
}

/**
 * Get previous standup for context
 */
export async function getPreviousStandup(projectId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const [standupConfig] = await db
            .select({ id: projectV2StandupConfigs.id })
            .from(projectV2StandupConfigs)
            .where(
                and(
                    eq(projectV2StandupConfigs.userId, session.user.id),
                    eq(projectV2StandupConfigs.projectId, projectId)
                )
            )
            .limit(1)

        if (!standupConfig) {
            return { success: true, standup: null }
        }

        const [standup] = await db
            .select()
            .from(projectV2StandupEntries)
            .where(
                and(
                    eq(projectV2StandupEntries.configId, standupConfig.id),
                    eq(projectV2StandupEntries.status, 'SUBMITTED')
                )
            )
            .orderBy(desc(projectV2StandupEntries.submittedAt))
            .limit(1)

        if (!standup) {
            return { success: true, standup: null }
        }

        return {
            success: true,
            standup: {
                date: standup.submittedAt?.toLocaleDateString() || standup.scheduledFor.toLocaleDateString(),
                completedTasks: standup.whatDidYesterday ? [standup.whatDidYesterday] : [],
                plannedTasks: standup.whatDoingToday ? [standup.whatDoingToday] : []
            }
        }

    } catch (error) {
        console.error('Error fetching previous standup:', error)
        return { success: false, error: 'Failed to fetch previous standup' }
    }
}
