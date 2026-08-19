import { RetryableError } from "./jobs/base"

/**
 * ElevenLabs conversation polling.
 *
 * A voice conversation is not finished when the call ends: ElevenLabs keeps
 * processing for anywhere from a few seconds to half a minute before the
 * transcript exists. Both callers of this used to sleep-poll it inside a server
 * action - thirty one-second waits on the request path, which Cloudflare kills
 * long before the transcript is ready, losing the interview the user just sat
 * through.
 *
 * Here that same poll is fine: it runs inside a Durable Object alarm, where
 * nothing is holding a request open.
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
		call_duration_secs: number
		termination_reason?: string
		error?: { reason?: string }
	}
	has_audio: boolean
	analysis?: {
		call_successful: string
		transcript_summary: string
		evaluation_criteria_results?: Record<string, unknown>
	}
}

/** The inline version's budget, unchanged: 30 attempts, 1s apart. */
const MAX_ATTEMPTS = 30
const INTERVAL_MS = 1000

export class ConversationFailedError extends Error {}

/**
 * Poll until the conversation is `done`.
 *
 * Throws `ConversationFailedError` if ElevenLabs reports the call itself failed
 * (there is no transcript coming, so retrying is pointless), and a plain error
 * if it never finished in time.
 */
export async function waitForConversation(
	apiKey: string,
	conversationId: string,
	onAttempt?: (attempt: number, max: number) => Promise<void>,
): Promise<ConversationDetails> {
	let attempts = 0
	let latest: ConversationDetails | null = null

	while (attempts < MAX_ATTEMPTS) {
		const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
			method: "GET",
			headers: { "xi-api-key": apiKey },
		})

		if (res.ok) {
			latest = (await res.json()) as ConversationDetails

			if (latest.status === "done") return latest
			if (latest.status === "failed") {
				const reason = latest.metadata?.termination_reason ?? latest.metadata?.error?.reason ?? "Unknown reason"
				throw new ConversationFailedError(`Interview session ended unexpectedly: ${reason}`)
			}
		} else if (res.status >= 500 || res.status === 429) {
			// ElevenLabs is having a moment; the conversation is still there.
			if (attempts === MAX_ATTEMPTS - 1) {
				throw new RetryableError(`ElevenLabs is unavailable (${res.status})`)
			}
		}

		await new Promise((r) => setTimeout(r, INTERVAL_MS))
		attempts++
		if (onAttempt) await onAttempt(attempts, MAX_ATTEMPTS)
	}

	// Still processing after the budget. Worth another alarm rather than a
	// failure - the transcript usually does land, just late.
	throw new RetryableError(
		latest ? `Transcript not ready yet (status: ${latest.status})` : "Transcript not ready yet",
	)
}
