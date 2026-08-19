# worker - ShipItHQ background jobs

Every long-running operation in the product runs here, as a Cloudflare Durable
Object that schedules an **Alarm** and does the work off the request path.
Nothing in this worker does real work inside a `fetch` handler; a fetch only ever
accepts a job.

The rule it exists to enforce: **if it calls an LLM, or sleeps waiting on
somebody else's API, it does not belong in a server action.** A Worker request
has a hard budget, and a 60-second completion is killed long before it finishes -
usually after the user has already been charged.

## The shape

```
server action                      worker (Durable Object)
─────────────                      ───────────────────────
reserve credits (holdId = jobId)
insert background_job (waiting)  →  POST /api/v1/jobs  { type, jobId, input }
                                    ctx.storage.setAlarm(now)   ← returns immediately
return { jobId }                         ↓
                                    alarm() runs the real work
client polls the job             ←  writes status/progress/result to background_job
settle or release the hold on
the first terminal status
```

Credits are decided in the app (`lib/credits/hold.ts`), never in the worker, so
there is one place in the product where a charge or a refund can happen.

## Jobs

| type | class | what it waits on |
|---|---|---|
| `project_generation` | `ProjectGeneration` | one large blueprint completion, then the project/sprints/tasks it implies |
| `verification_generation` | `VerificationGeneration` | OpenAI Assistants run, polled up to 90s |
| `sprint_generation` | `SprintGeneration` | one multi-thousand-token completion |
| `project_quiz` | `ProjectQuiz` | 20 questions on `gpt-4-turbo-preview` |
| `standup_voice` | `StandupVoice` | ElevenLabs transcript, then an extraction completion |
| `mock_conversation` | `MockConversation` | ElevenLabs transcript |
| `mock_feedback` | `MockFeedback` | a scored report over the whole transcript |

## Adding a job type

Four edits, all four or none:

1. add the type to `JOB_TYPES` in `packages/db/src/schema/worker.ts` (text
   column, so no migration)
2. add a class in `src/jobs/` extending `JobDurableObject` - implement `run()`
   and nothing else
3. add it to `JOB_BINDINGS` in `src/env.ts` and export it from `src/jobs/index.ts`
4. add the binding **and** a migration tag in `wrangler.jsonc`

Then dispatch from the app with `startBackgroundJob(type, input, { cost })`.

`input` must be a **pointer** (ids), never a payload: minutes can pass before the
alarm fires, and every job re-reads current data rather than acting on a snapshot
that is already stale.

## What `JobDurableObject` handles for you

- **Duplicate-run guard.** Two dispatches of the same jobId land on the same
  object; the second is refused. With credits held against the job, a second run
  is a second charge.
- **Catch, never rethrow.** A thrown alarm is auto-retried by the platform, which
  would run the whole job again.
- **Bounded retries.** Throw `RetryableError` for failures where nothing was
  decided yet (a 5xx from an upstream API); it is retried twice with backoff via
  another alarm. Everything else fails immediately, because it would fail
  identically on a retry.
- **Stale-run recovery.** A DO evicted mid-alarm never resumes. The re-fired
  alarm sees the run has gone stale and fails the job, so the app refunds -
  instead of the job sitting at `active` forever.
- **Storage sweep.** A finished job's DO storage is deleted by a later alarm.
- **Best-effort status writes.** A failed progress write never aborts a run the
  user has paid for.

## Routes

| | |
|---|---|
| `POST /api/v1/jobs` | dispatch. Body `{ type, jobId, input }`, `Bearer` a token signed with `action: "start_job"` and this `jobId` |
| `GET /api/v1/jobs/:jobId?type=…` | live phase straight from the DO. The app normally polls `background_job` instead |
| `POST /api/v1/generateproject` | legacy alias, still used by apps/uni |
| `POST /api/v1/generateverification` | legacy alias |
| `GET /health` | |

## Local development

```bash
cp .env.example .dev.vars     # wrangler reads .dev.vars for `wrangler dev`
pnpm dev                      # serves on :8787
```

`apps/main` falls back to `http://localhost:8787` when there is no service
binding, which is always the case under `next dev`.

## Deploying

```bash
pnpm release      # build + wrangler deploy --secrets-file .env.production
```

Use `release`, not `deploy` - `pnpm deploy` is a built-in pnpm command that
shadows the script. See `DEPLOYMENT.md` at the repo root for the ordering
against `apps/main` and `apps/uni`, which bind to this worker by name.
