import type { JobType } from "@repo/db/schema"

/**
 * The job types this worker actually runs, mapped to the Durable Object binding
 * that owns them.
 *
 * `JobType` comes from @repo/db and is the vocabulary the whole product shares;
 * this map is the subset that has a Durable Object behind it today. Keeping the
 * two separate is deliberate - a job type the app can name but the worker cannot
 * run must fail loudly at dispatch, not sit at `waiting` forever.
 *
 * Adding a job type: add the class in `src/jobs/`, add it here, then add the
 * matching binding AND migration entry in `wrangler.jsonc`. All three or none.
 */
export const JOB_BINDINGS = {
	project_generation: "PROJECT_GENERATION",
	verification_generation: "VERIFICATION_GENERATION",
	sprint_generation: "SPRINT_GENERATION",
	project_quiz: "PROJECT_QUIZ",
	standup_voice: "STANDUP_VOICE",
	mock_conversation: "MOCK_CONVERSATION",
	mock_feedback: "MOCK_FEEDBACK",
} as const satisfies Partial<Record<JobType, string>>

export type RunnableJobType = keyof typeof JOB_BINDINGS
export type JobBindingName = (typeof JOB_BINDINGS)[RunnableJobType]

export function isRunnableJobType(value: unknown): value is RunnableJobType {
	return typeof value === "string" && value in JOB_BINDINGS
}

export type Env = {
	[K in JobBindingName]: DurableObjectNamespace
} & {
	DATABASE_URL: string
	OPENAI_API_KEY: string
	/** OpenAI Assistant used for Pathfinder verification generation. */
	PATHFINDER_ASSISTANT_ID?: string
	/** ElevenLabs, for the voice jobs (mock interview + standup transcripts). */
	ELEVENLABS_API_KEY?: string
	WORKER_SECRET: string
	NODE_ENV?: string
}
