'use server'

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { db, mockVoiceSession } from "@repo/db"
import { and, eq } from "drizzle-orm"
import { startBackgroundJob } from "@/actions/(main)/workers/jobs.action"

// ─────────────────────────────────────────────────────────────────────────────
// Mock interview post-processing.
//
// Both halves used to run inline. Processing the conversation slept up to 30
// seconds waiting for ElevenLabs to produce the transcript; generating the
// feedback then sent that whole transcript to gpt-4.1 and waited for a scored
// multi-section report. Neither survives a request on Cloudflare, and losing
// either one loses an interview the user had already sat through.
//
// Both are now background jobs. The client starts one and polls it.
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationDetails {
    agent_id: string
    conversation_id: string
    status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed'
    transcript: Array<{
        role: string
        time_in_call_secs: number
        message: string
    }>
    metadata: {
        start_time_unix_secs: number
        call_duration_secs: number
    }
    has_audio: boolean
    analysis?: {
        call_successful: string
        transcript_summary: string
        evaluation_criteria_results?: Record<string, unknown>
    }
}

/**
 * One read of a conversation, for callers that want the current state rather
 * than to wait for it. The waiting lives in the worker.
 */
export async function getConversationDetails(conversationId: string): Promise<{
    success: boolean
    data?: ConversationDetails
    error?: string
}> {
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                },
                cache: 'no-store'
            }
        )

        if (!response.ok) {
            throw new Error(`Failed to fetch conversation: ${response.statusText}`)
        }

        return { success: true, data: (await response.json()) as ConversationDetails }
    } catch (error) {
        console.error('Error fetching conversation details:', error)
        return { success: false, error: 'Failed to fetch conversation details' }
    }
}

/**
 * Start the job that waits for the transcript and saves it.
 *
 * Returns a jobId; the interview screen polls it and routes to the results page
 * when it completes.
 */
export async function processConversationCompletion(sessionId: string, conversationId: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
}> {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // Scoped to the caller: a session id alone must not let anyone write a
    // transcript onto somebody else's interview.
    const owned = await db.query.mockVoiceSession.findFirst({
        where: and(eq(mockVoiceSession.id, sessionId), eq(mockVoiceSession.userId, session.user.id)),
        columns: { id: true },
    })
    if (!owned) return { success: false, error: 'Session not found' }

    return startBackgroundJob('mock_conversation', { sessionId, conversationId })
}

/**
 * Start the job that scores the interview.
 *
 * `singleFlight` is on because the results page fires this on mount: a reload,
 * or a second tab, must join the running job rather than start a second scoring
 * run over the same transcript.
 */
export async function generateAIFeedback(sessionId: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
}> {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const mockSession = await db.query.mockVoiceSession.findFirst({
        where: and(eq(mockVoiceSession.id, sessionId), eq(mockVoiceSession.userId, session.user.id)),
        columns: { id: true, transcript: true },
    })
    if (!mockSession || !mockSession.transcript) {
        return { success: false, error: 'Session or transcript not found' }
    }

    return startBackgroundJob('mock_feedback', { sessionId }, { singleFlight: true })
}
