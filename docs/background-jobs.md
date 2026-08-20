# Background jobs - what moved to the worker, and how to review it

Written up so this is reviewable later rather than living in one chat. Companion
docs: `DEPLOYMENT.md` (how to ship it), `apps/worker/README.md` (how to add a job).

## Why any of this exists

A Cloudflare Worker request has a hard budget. A 30-60 second LLM completion is
killed long before it finishes - and in this product, usually **after** the user
has been charged. That is the whole reason for the worker: work that cannot finish
inside a request runs on a Durable Object with an Alarm instead, writing progress
to `background_job`, and the app polls.

The rule, now in `CLAUDE.md`: **if it calls an LLM, or sleeps waiting on someone
else's API, it does not belong in a server action.**

## The rename

`apps/generationworker` became `apps/worker`. The deployed script went from
`shipithq-generation` to `shipithq-worker`.

`shipithq-generation` is a **different Worker script** with its own Durable Object
namespaces. Cutover order matters and is easy to get wrong:

1. deploy `apps/worker`
2. deploy `apps/main` and `apps/uni` (they bind to it by name)
3. let in-flight jobs on the old script drain - minutes, not hours
4. only then delete `shipithq-generation` in the dashboard

Deleting it first orphans Durable Objects that users are actively polling.

## Architecture

```
server action                      worker (Durable Object)
─────────────                      ───────────────────────
reserve credits (holdId = jobId)
insert background_job (waiting)  →  POST /api/v1/jobs { type, jobId, input }
                                    ctx.storage.setAlarm(now)  ← returns immediately
return { jobId }                         ↓
                                    alarm() runs the real work
client polls the job             ←  writes status/progress/result to background_job
settle or release the hold on
the first terminal status
```

Two invariants worth defending in review:

- **Credits are decided in the app, never in the worker.** `lib/credits/hold.ts`
  is the only place a charge or a refund happens, so there is one place to audit.
  The one exception is `project_generation`, which still debits inside the
  pipeline - see "Known inconsistencies" below.
- **Job input is a pointer, not a payload.** Minutes can pass before the alarm
  fires. Every job re-reads current data rather than acting on a stale snapshot.

## What `JobDurableObject` handles so no job has to

`apps/worker/src/jobs/base.ts`. All of these were things the two original jobs
either duplicated or got wrong:

| | |
|---|---|
| Duplicate-run guard | Two dispatches of one jobId hit the same object; the second is refused. With credits held, a second run is a second charge |
| Catch, never rethrow | A thrown alarm is auto-retried by the platform, which would run the whole job again |
| Bounded retries | `RetryableError` reschedules via another alarm, twice, with backoff. Everything else fails immediately, because it would fail identically |
| Stale-run recovery | **This was a live bug.** A DO evicted mid-alarm left the job `active` forever and the credit hold never released. The re-fired alarm now detects the stale run and fails it, so the app refunds |
| Storage sweep | A later alarm deletes finished job storage |
| Best-effort status writes | A failed progress write never aborts a run the user paid for |

## Jobs

| type | class | blocks on |
|---|---|---|
| `project_generation` | `ProjectGeneration` | blueprint completion + the rows it implies |
| `verification_generation` | `VerificationGeneration` | OpenAI Assistants run, polled up to 90s |
| `sprint_generation` | `SprintGeneration` | multi-thousand-token completion |
| `project_quiz` | `ProjectQuiz` | 20 questions on `gpt-4-turbo-preview` |
| `standup_voice` | `StandupVoice` | ElevenLabs transcript + extraction |
| `mock_conversation` | `MockConversation` | ElevenLabs transcript |
| `mock_feedback` | `MockFeedback` | scored report over a full transcript |

## Still inline, on purpose

Per `srs/core-modules/projects/02-worker-migration.md`:

- `project_assessment` - blocked on whether assessments survive the narrowing
- `project_mock` - blocked on the overlap with the standalone `mock` module
- `task_details` - the SRS says migrate on measurement, not on principle

The resume and cover-letter LLM calls are also still inline and are the next
obvious candidates - see `docs/resume-system.md`.

## Three bugs fixed on the way

None of these were the task; all three were dead code paths that could never have
worked, found by reading the call sites.

1. **The code editor's Run button.** Posted to `/api/v1/run` and polled
   `/api/v1/execution/:id`. `shipitworker` has neither - it has one synchronous
   `POST /api/v1/execute`. Every Run 404'd, then "timed out" after ten seconds of
   polling nothing.
2. **uni's project generation.** Posted the payload bare and read a `jobId` out of
   the response, but the worker requires `{ jobId, input }` and has never minted
   ids. So: 400, then a row keyed on `undefined`.
3. **uni's progress poller.** Fetched `NEXT_PUBLIC_WORKER_URL/api/v1/job/:id` from
   the browser - unauthenticated, on a route that does not exist, on the *code
   executor's* URL rather than the job worker's.

## Known inconsistencies to resolve later

- **`project_generation` debits credits inside the pipeline**, not through a hold.
  Every other paid job holds and settles. Until that is unified, a failed project
  generation does not refund the way a failed quiz does. Worth fixing, but it
  means touching the pipeline's write ordering.
- **`PLATFORM_TEMPLATES`** in `apps/main/types/resume-draft.ts` carries indigo
  (`#6366f1`), pink (`#ec4899`) and emerald (`#10b981`), which `CLAUDE.md` rules
  out. Pre-existing, unrelated to this work, but it is the palette rule being
  broken in a file that ships to users.
- **`lib/credits/hold.ts`** writes an em dash into its refund ledger description,
  which `CLAUDE.md` also rules out. Left alone deliberately: changing it changes
  the text of rows already being written.

## Review checklist

A migration is done when all of these hold. Numbers 2 and 4 are the ones people
skip, and they are the entire point of moving the work.

1. The flow completes end to end through the worker with a real payload.
2. **Killing the browser tab mid-job does not affect completion.**
3. A forced failure refunds the credits exactly once.
4. **A DO eviction mid-alarm does not duplicate the job** (exercise the guard).
5. Model output is unchanged from before the migration - same prompt, same model,
   comparable result on the same input.
6. `tsc --noEmit` clean in `apps/main`, `apps/uni`, `apps/worker`, `packages/db`.

## Cost shape (Workers Paid)

Containers - `apps/shipitworker` only - bill for **instance awake time, not per
request**. Two knobs:

- `sleepAfter = "3m"` in `src/executor-container.ts` - longer keeps runs warm and
  costs more
- `max_instances: 5` in `wrangler.jsonc` - the concurrency ceiling; past it,
  requests queue

A quiet day is cheap. A class of 200 students all pressing Run at once is not. If
practice traffic is spiky, drop `sleepAfter` to `1m` and measure before raising
`max_instances`.

Durable Objects - `apps/worker` - bill on requests plus wall-clock duration of
active time. The alarms here are long (a 90-second Assistants poll is 90 seconds
of active DO time), so job count matters more than job size. The `singleFlight`
option on `startBackgroundJob` exists partly for this.
