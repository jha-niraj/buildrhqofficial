'use server'

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { db, users, mockInterviewVoice, mockVoiceSession, creditTransactions } from "@repo/db"
import { eq, and, inArray, count } from "drizzle-orm"
import { revalidatePath } from 'next/cache'
import { resolveUserResume } from "@/lib/resume/primary"

interface CreateSessionInput {
    mockId: string
    mockType: 'predefined' | 'custom'
    includesResume?: boolean
    /** When set, charge this amount instead of mock.creditsRequired (e.g. half for retake) */
    retakeCredits?: number
}

interface SessionVariables {
    username: string
    position: string
    level: string
    description: string
    knowledge_base: string
    resume_content?: string | null
}

export async function createMockVoiceSession(input: CreateSessionInput) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const agentId = process.env.NEXT_PUBLIC_MOCK_VOICE_AI_ASSISTANT
        if (!agentId) {
            return { success: false, error: 'Voice interview service is not configured. Please contact support.' }
        }

        const userId = session.user.id

        const [user, mock] = await Promise.all([
            db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: {
                    id: true,
                    name: true,
                    username: true,
                    credits: true,
                    resumeText: true,
                    hasResume: true,
                },
            }),
            db.query.mockInterviewVoice.findFirst({
                where: eq(mockInterviewVoice.id, input.mockId),
                columns: {
                    id: true,
                    title: true,
                    description: true,
                    level: true,
                    category: true,
                    knowledgeBase: true,
                    creditsRequired: true,
                    includesResume: true,
                    duration: true,
                },
            }),
        ])

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        if (!mock) {
            return { success: false, error: 'Mock interview not found' }
        }

        const creditsToCharge = input.retakeCredits ?? mock.creditsRequired

        if (user.credits < creditsToCharge) {
            return {
                success: false,
                error: 'Insufficient credits',
                required: creditsToCharge,
                available: user.credits
            }
        }

        // Resolved through `lib/resume/primary.ts` rather than read straight off
        // `users.resumeText`. That column only ever holds text extracted from an
        // uploaded PDF, so an interviewer was quizzing the candidate on a file they
        // may have uploaded months ago while their curated resume in the builder
        // said something else. The resolver prefers the primary resume and falls
        // back to the PDF, so this keeps working for users who only ever uploaded.
        const resumeContent = input.includesResume
            ? (await resolveUserResume(userId)).text || null
            : null

        const variables: SessionVariables = {
            username: user.name?.split(' ')[0] || user.username || 'there',
            position: mock.title,
            level: mock.level,
            description: mock.description,
            knowledge_base: mock.knowledgeBase,
            resume_content: resumeContent,
        }

        // Create session and deduct credits
        const [newSession] = await db
            .insert(mockVoiceSession)
            .values({
                mockId: input.mockId,
                userId,
                status: 'SCHEDULED',
                agentId,
                variables: variables as any,
                creditsUsed: creditsToCharge,
                scheduledFor: new Date(),
            })
            .returning({ id: mockVoiceSession.id, variables: mockVoiceSession.variables, agentId: mockVoiceSession.agentId })

        if (!newSession) throw new Error("Failed to create session")

        // Deduct credits
        await db
            .update(users)
            .set({ credits: user.credits - creditsToCharge })
            .where(eq(users.id, userId))

        // Record credit transaction
        await db.insert(creditTransactions).values({
            userId,
            amount: -creditsToCharge,
            type: 'SPEND',
            description: input.retakeCredits
                ? `Mock Voice Retake: ${mock.title}`
                : `Mock Voice Interview: ${mock.title}`,
            currency: 'INR',
        })

        revalidatePath('/mockinterview')

        return {
            success: true,
            sessionId: newSession.id,
            agentId: newSession.agentId,
            variables: newSession.variables as unknown as SessionVariables,
        }

    } catch (error) {
        console.error('Error creating mock voice session:', error)
        return {
            success: false,
            error: 'Failed to create session. Please try again.'
        }
    }
}

export async function updateSessionStatus(sessionId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        await db
            .update(mockVoiceSession)
            .set({
                status,
                startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
            })
            .where(
                and(
                    eq(mockVoiceSession.id, sessionId),
                    eq(mockVoiceSession.userId, session.user.id)
                )
            )

        return { success: true }
    } catch (error) {
        console.error('Error updating session status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function saveConversationData(
    sessionId: string,
    conversationId: string,
    startedAt?: Date
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        await db
            .update(mockVoiceSession)
            .set({
                conversationId,
                status: 'IN_PROGRESS',
                startedAt: startedAt || new Date(),
            })
            .where(
                and(
                    eq(mockVoiceSession.id, sessionId),
                    eq(mockVoiceSession.userId, session.user.id)
                )
            )

        return { success: true }
    } catch (error) {
        console.error('Error saving conversation data:', error)
        return { success: false, error: 'Failed to save conversation data' }
    }
}

export async function getSessionDetails(sessionId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const mockSession = await db.query.mockVoiceSession.findFirst({
            where: and(
                eq(mockVoiceSession.id, sessionId),
                eq(mockVoiceSession.userId, session.user.id)
            ),
            with: { mock: true },
        })

        if (!mockSession) {
            return { success: false, error: 'Session not found' }
        }

        return { success: true, session: mockSession }
    } catch (error) {
        console.error('Error getting session details:', error)
        return { success: false, error: 'Failed to get session details' }
    }
}

export async function getMockSessionInfo(mockId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const [sessionCountRow, mock] = await Promise.all([
            db
                .select({ cnt: count() })
                .from(mockVoiceSession)
                .where(
                    and(
                        eq(mockVoiceSession.mockId, mockId),
                        eq(mockVoiceSession.userId, session.user.id),
                        inArray(mockVoiceSession.status, ['COMPLETED', 'IN_PROGRESS', 'SCHEDULED'])
                    )
                )
                .then(([r]) => r),
            db.query.mockInterviewVoice.findFirst({
                where: eq(mockInterviewVoice.id, mockId),
                columns: { createdById: true, creditsRequired: true },
            }),
        ])

        if (!mock) {
            return { success: false, error: 'Mock not found' }
        }

        const sessionCount = Number(sessionCountRow?.cnt ?? 0)
        const isCreator = mock.createdById === session.user.id
        const freeSessionsRemaining = isCreator ? Math.max(0, 3 - sessionCount) : 0
        const needsPayment = isCreator ? sessionCount >= 3 : true
        const creditsToCharge = needsPayment
            ? isCreator
                ? Math.ceil(mock.creditsRequired / 2)
                : mock.creditsRequired
            : 0

        return {
            success: true,
            data: {
                sessionCount,
                isCreator,
                freeSessionsRemaining,
                needsPayment,
                creditsToCharge,
                fullPrice: mock.creditsRequired,
            },
        }
    } catch (error) {
        console.error('Error getting mock session info:', error)
        return { success: false, error: 'Failed to get session info' }
    }
}

export async function getElevenLabsToken(agentId?: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const resolvedAgentId = agentId || process.env.NEXT_PUBLIC_MOCK_VOICE_AI_ASSISTANT
        if (!resolvedAgentId) {
            return { success: false, error: 'Voice interview agent is not configured. Please contact support.' }
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${resolvedAgentId}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY as string,
                },
                cache: 'no-store',
            }
        )

        if (!response.ok) {
            console.error('Failed to get conversation token:', response.statusText)
            return { success: false, error: 'Failed to get conversation token' }
        }

        const data = await response.json()
        return { success: true, token: data.token }
    } catch (error) {
        console.error('Error getting elevenlabs token:', error)
        return { success: false, error: 'Failed to get elevenlabs token' }
    }
}
