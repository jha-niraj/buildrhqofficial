import { and, eq, sql } from "drizzle-orm"
import type { RunnableJobType } from "../env"
import { schema } from "../db"
import { waitForConversation, ConversationFailedError } from "../elevenlabs"
import { JobDurableObject, type ProgressFn, type StoredJob } from "./base"

const { mockVoiceSession, mockInterviewVoice } = schema

/**
 * Mock interview transcript processing, moved off
 * `conversation.action.ts:processConversationCompletion`.
 *
 * Same shape as the standup job: wait for ElevenLabs to finish the transcript,
 * then persist it. Different in one way that matters - there is no useful
 * degraded outcome here. A mock interview without its transcript cannot be
 * scored, so a timeout fails the job and the results page says so, rather than
 * showing an empty report.
 */

interface MockConversationInput {
	sessionId: string
	conversationId: string
}

export class MockConversation extends JobDurableObject<MockConversationInput> {
	protected readonly jobType: RunnableJobType = "mock_conversation"
	protected override get initialPhaseLabel() {
		return "Waiting for the recording"
	}

	protected async run(job: StoredJob<MockConversationInput>, progress: ProgressFn): Promise<unknown> {
		const { sessionId, conversationId } = job.input
		const apiKey = this.env.ELEVENLABS_API_KEY
		if (!apiKey) throw new Error("Voice processing is not configured")

		const db = this.db()

		let conversation
		try {
			conversation = await waitForConversation(apiKey, conversationId, async (attempt, max) => {
				await progress(10 + Math.round((attempt / max) * 50), "Waiting for the recording")
			})
		} catch (error: unknown) {
			if (error instanceof ConversationFailedError) {
				await db
					.update(mockVoiceSession)
					.set({ status: "FAILED" })
					.where(eq(mockVoiceSession.id, sessionId))
					.catch(() => {
						// Best-effort: the job still reports the real error.
					})
			}
			throw error
		}

		await progress(75, "Saving the transcript")

		const transcriptText = conversation.transcript
			.map((t) => `[${t.role.toUpperCase()}] (${t.time_in_call_secs}s): ${t.message}`)
			.join("\n\n")
		const duration = conversation.metadata.call_duration_secs

		// Scoped to the owner: the job carries the userId from the signed token,
		// so a session id alone cannot be used to write over someone else's row.
		await db
			.update(mockVoiceSession)
			.set({
				conversationId,
				status: "COMPLETED",
				completedAt: new Date(),
				duration,
				transcript: transcriptText,
				metadata: conversation.metadata as object,
			})
			.where(and(eq(mockVoiceSession.id, sessionId), eq(mockVoiceSession.userId, job.userId)))

		const sessionRow = await db.query.mockVoiceSession.findFirst({
			where: eq(mockVoiceSession.id, sessionId),
			columns: { mockId: true },
		})

		if (sessionRow) {
			await db
				.update(mockInterviewVoice)
				.set({
					totalSessions: sql`${mockInterviewVoice.totalSessions} + 1`,
					popularity: sql`${mockInterviewVoice.popularity} + 1`,
				})
				.where(eq(mockInterviewVoice.id, sessionRow.mockId))
		}

		return {
			sessionId,
			duration,
			summary: conversation.analysis?.transcript_summary ?? null,
		}
	}
}
