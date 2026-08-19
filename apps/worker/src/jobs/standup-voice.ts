import { eq, sql } from "drizzle-orm"
import type { RunnableJobType } from "../env"
import { schema } from "../db"
import { chatJSON } from "../openai"
import { waitForConversation, ConversationFailedError, type ConversationDetails } from "../elevenlabs"
import { JobDurableObject, RetryableError, type ProgressFn, type StoredJob } from "./base"

const { projectV2StandupEntries, projectV2StandupConfigs } = schema

/**
 * Standup processing, moved off
 * `standup-voice.action.ts:processStandupConversation`.
 *
 * Two long things back to back: up to thirty seconds waiting for ElevenLabs to
 * finish the transcript, then a completion that extracts the standup items from
 * it. The user was staring at a "Processing standup" dialog for the whole of it
 * on a request that Cloudflare would eventually kill.
 *
 * The extraction prompt, model and temperature are VERBATIM from the inline
 * version.
 */

interface StandupInput {
	/** `project_v2_standup_entry.id` - the row created when the call started. */
	entryId: string
	conversationId: string
}

interface ExtractedItems {
	completedTasks: string[]
	plannedTasks: string[]
	blockers: string[]
}

export class StandupVoice extends JobDurableObject<StandupInput> {
	protected readonly jobType: RunnableJobType = "standup_voice"
	protected override get initialPhaseLabel() {
		return "Waiting for the recording"
	}

	protected async run(job: StoredJob<StandupInput>, progress: ProgressFn): Promise<unknown> {
		const { entryId, conversationId } = job.input
		const apiKey = this.env.ELEVENLABS_API_KEY
		if (!apiKey) throw new Error("Voice processing is not configured")

		let conversation: ConversationDetails
		try {
			conversation = await waitForConversation(apiKey, conversationId, async (attempt, max) => {
				// 10 -> 45% across the wait, so the bar moves while ElevenLabs
				// is the one taking the time.
				await progress(10 + Math.round((attempt / max) * 35), "Waiting for the recording")
			})
		} catch (error: unknown) {
			if (error instanceof RetryableError && (await this.isFinalAttempt())) {
				// Out of attempts, but the standup itself still happened. Save it
				// without a transcript rather than losing the entry entirely -
				// this is what the inline version did on timeout, and the streak
				// the user is keeping matters more than the summary.
				await this.db()
					.update(projectV2StandupEntries)
					.set({ status: "SUBMITTED", submittedAt: new Date(), recordingUrl: conversationId })
					.where(eq(projectV2StandupEntries.id, entryId))
				return { entryId, transcriptAvailable: false }
			}
			if (error instanceof ConversationFailedError) {
				await this.db()
					.update(projectV2StandupEntries)
					.set({ status: "SUBMITTED", submittedAt: new Date(), recordingUrl: conversationId })
					.where(eq(projectV2StandupEntries.id, entryId))
			}
			throw error
		}

		await progress(60, "Reading your update")

		const transcriptText = conversation.transcript
			.map((t) => `[${t.role.toUpperCase()}] (${t.time_in_call_secs}s): ${t.message}`)
			.join("\n\n")
		const duration = conversation.metadata.call_duration_secs

		const extracted = await this.extractItems(transcriptText)

		await progress(85, "Saving your standup")

		const db = this.db()
		await db
			.update(projectV2StandupEntries)
			.set({
				status: "SUBMITTED",
				submittedAt: new Date(),
				durationSeconds: Math.round(duration),
				recordingUrl: conversationId,
				whatDidYesterday: extracted.completedTasks.join("; "),
				whatDoingToday: extracted.plannedTasks.join("; "),
				anyBlockers: extracted.blockers.join("; "),
				aiSummary: conversation.analysis?.transcript_summary || null,
				aiSuggestions: [],
			})
			.where(eq(projectV2StandupEntries.id, entryId))

		const [entry] = await db
			.select({ configId: projectV2StandupEntries.configId })
			.from(projectV2StandupEntries)
			.where(eq(projectV2StandupEntries.id, entryId))
			.limit(1)

		if (entry?.configId) {
			await db
				.update(projectV2StandupConfigs)
				.set({
					completedStandups: sql`${projectV2StandupConfigs.completedStandups} + 1`,
					totalStandups: sql`${projectV2StandupConfigs.totalStandups} + 1`,
				})
				.where(eq(projectV2StandupConfigs.id, entry.configId))
		}

		return {
			entryId,
			transcriptAvailable: true,
			duration,
			summary: conversation.analysis?.transcript_summary ?? null,
			extracted,
		}
	}

	/**
	 * Prompt, model and temperature verbatim from the inline version.
	 *
	 * Failure here returns empty arrays rather than throwing, exactly as before:
	 * a standup with no extracted items is still a standup, and failing the job
	 * would throw away a transcript that was expensive to get.
	 */
	private async extractItems(transcript: string): Promise<ExtractedItems> {
		try {
			const raw = await chatJSON({
				apiKey: this.env.OPENAI_API_KEY,
				model: "gpt-4o-mini",
				temperature: 0.3,
				system:
					"You are an assistant that extracts structured information from standup meeting transcripts. Extract the tasks that were completed (yesterday), tasks planned (for today), and any blockers mentioned.",
				user: `Extract the standup items from this transcript:\n\n${transcript}\n\nProvide your response in this JSON format:
{
  "completedTasks": ["task 1", "task 2"],
  "plannedTasks": ["task 1", "task 2"],
  "blockers": ["blocker 1", "blocker 2"]
}

If no items are found for a category, return an empty array.`,
			})
			const parsed = JSON.parse(raw) as Partial<ExtractedItems>
			return {
				completedTasks: parsed.completedTasks ?? [],
				plannedTasks: parsed.plannedTasks ?? [],
				blockers: parsed.blockers ?? [],
			}
		} catch {
			return { completedTasks: [], plannedTasks: [], blockers: [] }
		}
	}
}
