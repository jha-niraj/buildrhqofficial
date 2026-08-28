/**
 * The one place `apps/main` reads an ElevenLabs conversation.
 *
 * There were two: `mockvoice/conversation.action.ts` and
 * `projects/projectv2-mock.action.ts`, both fetching the same endpoint with
 * their own headers and their own error handling. The fork had drifted, and it
 * had drifted in the direction that loses data - see plan/mock-consolidation/,
 * task MC-1. Three defects it carried and this file fixes:
 *
 * 1. **A failed fetch was swallowed.** The fork wrapped the read in
 *    `if (response.ok) { ... }` with no else, so a failure left `transcript` as
 *    `[]` and `duration` as `0` and execution continued into a write that marked
 *    the session COMPLETED. The interview happened; the record said it had no
 *    words in it, and the AI feedback was then generated from that emptiness.
 *
 * 2. **The duration came from a field that does not exist.** The fork read
 *    `metadata?.duration` and divided by 1000. ElevenLabs returns
 *    `metadata.call_duration_secs`, already in seconds. `?.duration` is
 *    `undefined`, so `|| 0` took over and every session recorded a duration of
 *    zero. The `/1000` records a belief that the value was milliseconds.
 *
 * 3. **No `cache: 'no-store'`.** Next.js caches `fetch` by default, and a
 *    conversation still being finalised must not come back from a cache.
 *
 * NOTE THE ABSENCE OF `"use server"`. In such a module every exported async
 * function becomes a callable endpoint, and this one carries an API key.
 * Authentication stays in the server actions that call it.
 */

export interface ConversationDetails {
    agent_id: string
    conversation_id: string
    status: "initiated" | "in-progress" | "processing" | "done" | "failed"
    transcript: Array<{
        role: string
        time_in_call_secs: number
        message: string
    }>
    metadata: {
        start_time_unix_secs: number
        /** SECONDS, not milliseconds. This is the field the fork got wrong. */
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
 * A discriminated union, not `{ success: boolean; data?: ... }`.
 *
 * A widened `boolean` stops TypeScript narrowing, so `if (r.success) r.data`
 * fails to compile and callers reach for `!` instead. That exact failure showed
 * up when the cover-letter extractor was moved in IP-4.
 */
export type ConversationResult =
    | { success: true; data: ConversationDetails }
    | { success: false; error: string }

/**
 * The ElevenLabs key, under either of the two names this repo uses.
 *
 * `ELEVENLABS_API_KEY` is the real one: it is what `.env` actually defines, what
 * apps/worker reads for the mock and standup jobs that work, and it outnumbers
 * the alternative 21 uses to 8. `ELEVENLABS_AI_KEY` appears in three files -
 * `projectv2-mock.action.ts`, `practice/voice.action.ts` and
 * `lib/elevenlabs-speech.ts` - and is set NOWHERE, so all three were permanently
 * "not configured": the project mock completion returned that error on every
 * call, and `isElevenLabsConfigured()` returned false forever.
 *
 * Both example env files list both names, which is how the misspelling outlived
 * the mistake. Rather than assert that a second key was never wanted, this reads
 * the working name first and falls back, so an environment set up either way
 * keeps running.
 */
export function elevenLabsKey(): string | undefined {
    return process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_AI_KEY
}

export async function fetchConversation(conversationId: string): Promise<ConversationResult> {
    const key = elevenLabsKey()
    // Checked here rather than asserted with `!` at the header, so a missing key
    // is a clear message instead of an authentication failure from ElevenLabs
    // that reads like the conversation does not exist.
    if (!key) {
        return { success: false, error: "ElevenLabs is not configured on this environment." }
    }

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
            {
                method: "GET",
                headers: { "xi-api-key": key },
                // A conversation that is still being finalised must not be served
                // from Next.js's default fetch cache.
                cache: "no-store",
            },
        )

        if (!response.ok) {
            return {
                success: false,
                error: `ElevenLabs returned ${response.status} for conversation ${conversationId}`,
            }
        }

        return { success: true, data: (await response.json()) as ConversationDetails }
    } catch (error: unknown) {
        console.error("Error fetching ElevenLabs conversation:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Could not reach ElevenLabs",
        }
    }
}

/** Call duration in SECONDS. Both session tables store seconds. */
export function conversationDurationSecs(data: ConversationDetails): number {
    return Math.max(0, Math.floor(data.metadata?.call_duration_secs ?? 0))
}
