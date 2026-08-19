import type { RunnableJobType } from "../env"
import { JobDurableObject, type ProgressFn, type StoredJob } from "./base"
import { runGeneration, type GenerationInput } from "../pipeline"

/**
 * Project generation - the original job, and the template the rest follow.
 *
 * A 1-1.5 minute pipeline: one large blueprint completion, then the project,
 * sprints, tasks and progress rows it implies. Far past what a request can hold
 * open, and the reason this worker exists at all.
 */
export class ProjectGeneration extends JobDurableObject<GenerationInput> {
	protected readonly jobType: RunnableJobType = "project_generation"
	protected override get initialPhaseLabel() {
		return "Starting generation"
	}

	protected async run(job: StoredJob<GenerationInput>, progress: ProgressFn): Promise<unknown> {
		return runGeneration(this.db(), this.env.OPENAI_API_KEY, job.input, job.userId, progress)
	}
}
