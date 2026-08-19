import { and, eq } from "drizzle-orm"
import type { RunnableJobType } from "../env"
import { schema } from "../db"
import { chatJSON } from "../openai"
import { JobDurableObject, type ProgressFn, type StoredJob } from "./base"

const { mockVoiceSession } = schema

/**
 * Mock interview feedback, moved off `conversation.action.ts:generateAIFeedback`.
 *
 * One `gpt-4.1` completion over a whole interview transcript, producing a scored
 * multi-section report. Long inputs and long outputs - the results page used to
 * fire it on mount and hold the request open for it.
 *
 * Prompt, model and output schema are VERBATIM from the inline version.
 */

interface MockFeedbackInput {
	sessionId: string
}

export class MockFeedback extends JobDurableObject<MockFeedbackInput> {
	protected readonly jobType: RunnableJobType = "mock_feedback"
	protected override get initialPhaseLabel() {
		return "Reading the transcript"
	}

	protected async run(job: StoredJob<MockFeedbackInput>, progress: ProgressFn): Promise<unknown> {
		const db = this.db()

		const mockSession = await db.query.mockVoiceSession.findFirst({
			where: and(eq(mockVoiceSession.id, job.input.sessionId), eq(mockVoiceSession.userId, job.userId)),
			with: { mock: true },
		})
		if (!mockSession) throw new Error("Session not found")
		if (!mockSession.transcript) throw new Error("Session or transcript not found")

		// Already scored: a second tab, or a reload, must not pay for the same
		// report twice.
		if (mockSession.aiAnalysis) {
			return { sessionId: job.input.sessionId, analysis: mockSession.aiAnalysis, alreadyExisted: true }
		}

		await progress(30, "Scoring your interview")

		const content = await chatJSON({
			apiKey: this.env.OPENAI_API_KEY,
			model: "gpt-4.1",
			system: `You are an expert interview coach and hiring manager. Analyze mock interview transcripts with fairness and constructiveness.
                        - Consider the role level (${mockSession.mock.level}) and category (${mockSession.mock.category})
                        - Score fairly: 1-100 scale. 70-85 = solid performance, 85+ = strong, 50-69 = needs improvement, <50 = significant gaps
                        - Be specific: reference actual quotes or moments from the transcript when giving feedback
                        - Balance praise with actionable improvement areas
                        - Format your response as valid JSON only, no additional text`,
			user: `Analyze this mock interview for "${mockSession.mock.title}" (${mockSession.mock.level} level) and provide structured feedback.

                        TRANSCRIPT:
                        ${mockSession.transcript}

                        Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
                        {
                            "overallScore": <number 1-100>,
                            "communication": { "score": <number 1-100>, "feedback": "<2-3 sentences on clarity, articulation, structure>" },
                            "technical": { "score": <number 1-100>, "feedback": "<2-3 sentences on technical depth, accuracy, relevance>" },
                            "problemSolving": { "score": <number 1-100>, "feedback": "<2-3 sentences on approach, logic, examples>" },
                            "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
                            "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"],
                            "detailedFeedback": "<2-3 paragraph comprehensive summary: how the interview went, key moments, overall assessment, and top priorities for improvement>"
                        }`,
		})

		let analysis: Record<string, unknown>
		try {
			analysis = JSON.parse(content) as Record<string, unknown>
		} catch {
			throw new Error("The model returned malformed feedback")
		}

		await progress(90, "Saving your report")

		await db
			.update(mockVoiceSession)
			.set({ aiAnalysis: analysis })
			.where(eq(mockVoiceSession.id, job.input.sessionId))

		return { sessionId: job.input.sessionId, analysis, alreadyExisted: false }
	}
}
