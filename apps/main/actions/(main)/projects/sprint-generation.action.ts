'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    users,
    projectsV2,
    projectV2Sprints,
    projectV2Tasks,
    withTransaction
} from "@repo/db";
import { eq, and } from "drizzle-orm";
import { startBackgroundJob } from '@/actions/(main)/workers/jobs.action'

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUser() {
    const session = await getSession(headers());
    if (!session?.user?.email) throw new Error('Not authenticated')
    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));
    if (!user) throw new Error('User not found')
    return user
}

// ============================================================================
// Types
// ============================================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

interface GeneratedTask {
    title: string
    description: string[]
    successCriteria: string[]
    hints: string[]
    estimatedMinutes: number
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    category: string | null
    estimatedTime: string | null
    checkpoints: string[]
    relatedPages: string[]
    dependencies: string[]
    badges: string[]
    tags: string[]
    terminalCommand: string | null
    orderIndex: number
}

interface GeneratedSprint {
    name: string
    goal: string
    duration: string
    tasks: GeneratedTask[]
}

// ============================================================================
// Sprint Generation Actions
// ============================================================================

/**
 * Start sprint generation on the worker.
 *
 * This was a multi-thousand-token completion running inline: a whole sprint with
 * three to six fully specified tasks, on a request that Cloudflare kills first.
 * It now runs on a Durable Object alarm and the sheet polls the job.
 *
 * The generated sprint comes back as the job result and stays a preview - it is
 * only written to the project when the user accepts it via `addSprintToProject`,
 * exactly as before.
 */
export async function startSprintGeneration(
    projectId: string,
    sprintDescription: string
): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
        await getCurrentUser()

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.id, projectId),
            columns: { id: true },
        })
        if (!project) return { success: false, error: 'Project not found' }

        return await startBackgroundJob('sprint_generation', { projectId, sprintDescription })
    } catch (error) {
        console.error('Error starting sprint generation:', error)
        return { success: false, error: 'Failed to start sprint generation' }
    }
}

/**
 * Add a generated sprint to the project
 */
export async function addSprintToProject(
    projectId: string,
    sprintData: GeneratedSprint,
    autoAccept: boolean = false
): Promise<ActionResult<{ sprintId: string, isPersonal: boolean }>> {
    try {
        const user = await getCurrentUser()

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.id, projectId),
            with: {
                sprints: {
                    orderBy: (sprints, { desc }) => [desc(sprints.orderIndex)],
                    limit: 1,
                }
            }
        });

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const isCreator = project.createdBy === user.id
        const nextSprintNumber = (project.sprints[0]?.sprintNumber || 0) + 1
        const nextOrderIndex = (project.sprints[0]?.orderIndex || 0) + 1

        if (isCreator || autoAccept) {
            const [sprint] = await db.insert(projectV2Sprints).values({
                projectId,
                sprintNumber: nextSprintNumber,
                name: sprintData.name,
                goal: sprintData.goal,
                duration: sprintData.duration,
                orderIndex: nextOrderIndex,
                createdBy: user.id,
                isApproved: true,
            }).returning();

            if (sprintData.tasks.length > 0) {
                await db.insert(projectV2Tasks).values(
                    sprintData.tasks.map((task, idx) => ({
                        sprintId: sprint!.id,
                        projectV2Id: projectId,
                        title: task.title,
                        description: task.description,
                        hints: task.hints,
                        estimatedMinutes: task.estimatedMinutes,
                        difficulty: task.difficulty,
                        orderIndex: idx,
                        category: task.category,
                        estimatedTime: task.estimatedTime,
                        checkpoints: task.checkpoints,
                        relatedPages: task.relatedPages,
                        dependencies: task.dependencies,
                        badges: task.badges,
                        tags: task.tags,
                        terminalCommand: task.terminalCommand,
                        criteria: task.successCriteria
                    }))
                );
            }

            revalidatePath(`/projects/${project.slug}`)

            return { success: true, data: { sprintId: sprint!.id, isPersonal: false } }
        } else {
            const [sprint] = await db.insert(projectV2Sprints).values({
                projectId,
                sprintNumber: nextSprintNumber,
                name: sprintData.name,
                goal: sprintData.goal,
                duration: sprintData.duration,
                orderIndex: nextOrderIndex,
                createdBy: user.id,
                isApproved: false,
                isPersonal: true,
            }).returning();

            if (sprintData.tasks.length > 0) {
                await db.insert(projectV2Tasks).values(
                    sprintData.tasks.map((task, idx) => ({
                        sprintId: sprint!.id,
                        projectV2Id: projectId,
                        title: task.title,
                        description: task.description,
                        hints: task.hints,
                        estimatedMinutes: task.estimatedMinutes,
                        difficulty: task.difficulty,
                        orderIndex: idx,
                        category: task.category,
                        estimatedTime: task.estimatedTime,
                        checkpoints: task.checkpoints,
                        relatedPages: task.relatedPages,
                        dependencies: task.dependencies,
                        badges: task.badges,
                        tags: task.tags,
                        terminalCommand: task.terminalCommand,
                        criteria: task.successCriteria
                    }))
                );
            }

            revalidatePath(`/projects/${project.slug}`)

            return { success: true, data: { sprintId: sprint!.id, isPersonal: true } }
        }
    } catch (error) {
        console.error('Error adding sprint to project:', error)
        return { success: false, error: 'Failed to add sprint' }
    }
}

/**
 * Accept a personal sprint
 */
export async function acceptPersonalSprint(
    sprintId: string
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        const sprint = await db.query.projectV2Sprints.findFirst({
            where: eq(projectV2Sprints.id, sprintId),
            with: { project: true }
        });

        if (!sprint) {
            return { success: false, error: 'Sprint not found' }
        }

        if (sprint.createdBy !== user.id) {
            return { success: false, error: 'You can only accept your own sprints' }
        }

        await db.update(projectV2Sprints).set({ isApproved: true }).where(eq(projectV2Sprints.id, sprintId));

        revalidatePath(`/projects/${sprint.project.slug}`)

        return { success: true }
    } catch (error) {
        console.error('Error accepting sprint:', error)
        return { success: false, error: 'Failed to accept sprint' }
    }
}

/**
 * Reject/delete a personal sprint
 */
export async function rejectPersonalSprint(
    sprintId: string
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        const sprint = await db.query.projectV2Sprints.findFirst({
            where: eq(projectV2Sprints.id, sprintId),
            with: { project: true }
        });

        if (!sprint) {
            return { success: false, error: 'Sprint not found' }
        }

        if (sprint.createdBy !== user.id) {
            return { success: false, error: 'You can only reject your own sprints' }
        }

        await withTransaction(async (tx) => {
            await tx.delete(projectV2Tasks).where(eq(projectV2Tasks.sprintId, sprintId));
            await tx.delete(projectV2Sprints).where(eq(projectV2Sprints.id, sprintId));
        });

        revalidatePath(`/projects/${sprint.project.slug}`)

        return { success: true }
    } catch (error) {
        console.error('Error rejecting sprint:', error)
        return { success: false, error: 'Failed to reject sprint' }
    }
}

/**
 * Get user's sprints for a project
 */
export async function getUserSprintsForProject(
    projectId: string
): Promise<ActionResult<{
    approvedSprints: Array<{
        id: string
        sprintNumber: number
        name: string
        goal: string
        duration: string
        tasksCount: number
    }>
    personalSprints: Array<{
        id: string
        sprintNumber: number
        name: string
        goal: string
        duration: string
        tasksCount: number
        isApproved: boolean
    }>
}>> {
    try {
        const user = await getCurrentUser()

        const approvedSprints = await db.query.projectV2Sprints.findMany({
            where: and(
                eq(projectV2Sprints.projectId, projectId),
                eq(projectV2Sprints.isApproved, true),
                eq(projectV2Sprints.isPersonal, false)
            ),
            with: { tasks: true },
            orderBy: (sprints, { asc }) => [asc(sprints.orderIndex)]
        });

        const personalSprints = await db.query.projectV2Sprints.findMany({
            where: and(
                eq(projectV2Sprints.projectId, projectId),
                eq(projectV2Sprints.createdBy, user.id),
                eq(projectV2Sprints.isPersonal, true)
            ),
            with: { tasks: true },
            orderBy: (sprints, { asc }) => [asc(sprints.orderIndex)]
        });

        return {
            success: true,
            data: {
                approvedSprints: approvedSprints.map((s) => ({
                    id: s.id,
                    sprintNumber: s.sprintNumber,
                    name: s.name,
                    goal: s.goal,
                    duration: s.duration,
                    tasksCount: s.tasks.length
                })),
                personalSprints: personalSprints.map((s) => ({
                    id: s.id,
                    sprintNumber: s.sprintNumber,
                    name: s.name,
                    goal: s.goal,
                    duration: s.duration,
                    tasksCount: s.tasks.length,
                    isApproved: s.isApproved
                }))
            }
        }
    } catch (error) {
        console.error('Error getting user sprints:', error)
        return { success: false, error: 'Failed to get sprints' }
    }
}
