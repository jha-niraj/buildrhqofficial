# Projects — worker migration

Moving every long-running operation off the request path and onto a Durable
Object + Alarm, following the pattern already proven by
`apps/worker/src/jobs/project-generation.ts`.

**AI generation must stay intact.** Prompts, model IDs, temperatures and output
schemas move verbatim. A migration that also changes the prompt cannot be
verified, because there is no way to tell a migration bug from a prompt change.

## Status

| task | state |
|---|---|
| `SHARED-1` `type` column | done |
| `SHARED-2` polling hook | done - `apps/main/hooks/use-background-job.ts` (`useBackgroundJob` and `awaitBackgroundJob`) |
| `SHARED-3` credit hold | done - `apps/main/lib/credits/hold.ts` |
| `PRJ-W1` sprint generation | done - `apps/worker/src/jobs/sprint-generation.ts` |
| `PRJ-W2` project assessments | **not started** - still blocked on whether assessments survive the narrowing |
| `PRJ-W3` project mock | **not started** - still blocked on the overlap decision with the standalone `mock` module |
| `PRJ-W4` quiz generation | done - `apps/worker/src/jobs/project-quiz.ts` |
| `PRJ-W5` task details | **not started** - deliberately, per "migrate on measurement" below |
| `PRJ-W6` standup voice | done - `apps/worker/src/jobs/standup-voice.ts`, and simpler than planned: see below |

`PRJ-W6` did not need R2. The implementation never uploaded audio - ElevenLabs
holds the recording and exposes the transcript through its conversations API, so
the job polls for the transcript and runs the extraction. No blob ever crosses
the job boundary, so steps 1, 2 and 4 of the plan below do not apply.

The generic parts of every migration now live in one place:
`startBackgroundJob` / `getBackgroundJobStatus` in
`actions/(main)/workers/jobs.action.ts`, and `JobDurableObject` in
`apps/worker/src/jobs/base.ts`. A new job type is four small edits - see
`apps/worker/README.md`.

## What is already correct — do not rebuild it

Project generation is done and is the template:

| piece | file |
|---|---|
| Durable Object + alarm | `apps/worker/src/jobs/project-generation.ts` |
| Pipeline | `apps/worker/src/pipeline.ts` |
| HMAC token issue | `actions/(main)/workers/projectsworker.action.ts:21` |
| Job insert before dispatch | same file, `startProjectGeneration` |
| UI polling | `components/projects/project-generate-sheet.tsx:103` |

Two details in the DO that must be preserved in every new job type:

- **Duplicate-run guard** (`project-generator.ts:44`) — alarms can re-fire if the
  DO is evicted mid-run. Without the guard you get two pipelines and two debits.
- **Catch, do not rethrow** (`:65`) — a rethrow makes the platform auto-retry the
  alarm, which duplicates the job.

---

## SHARED-1 — `background_job` needs a `type` column

**Blocks every task below.**

`packages/db/src/schema/worker.ts:17` — the table has `jobId`, `status`,
`progress`, `input`, `result`, `error`, `userId`. There is **no job type**.

Today that is survivable because project generation is the only writer. The
moment a second job type writes to it, nothing can tell them apart — not the
status poller, not the admin view, not a retry.

### Do

1. Add `type: text("type").notNull()` with an index on `(userId, type, status)`.
2. Generate the migration with `pnpm db:generate`, report what it contains, then
   `pnpm db:migrate`. Never `db:push`.
3. Backfill existing rows to `'project_generation'`.
4. Add a `JobType` union in one place and have both the worker and the app import
   it, so a typo cannot silently create an unpollable job.

---

## PRJ-W1 — Sprint generation → worker

`sprint-generation.action.ts` (450 lines, 1 LLM call).

Generating a sprint plan for a whole project is a multi-thousand-token completion
— firmly over the inline budget.

### Do

1. Add a `sprint_generation` DO to `apps/worker` (or a sibling class in
   the same worker — same binding, separate namespace).
2. Move the prompt **verbatim**. Record the model ID and temperature in the task
   PR so the before/after is checkable.
3. `startSprintGeneration()` in the app: check credits via the hold helper
   (`SHARED-3`), insert `background_job` with `type: 'sprint_generation'`, call
   the worker, return `jobId`.
4. UI polls via the shared hook (`SHARED-2`) and shows real progress, not a
   spinner.
5. On `failed`, refund (`PRJ-B1`).

**Blocked by:** `SHARED-1`, `SHARED-3`.

---

## PRJ-W2 — Project assessments → worker

`projectassessments.action.ts` (1,120 lines, 3 LLM calls) — the largest action
file in the module.

Three sequential completions on one request path. This is the most likely
timeout in `projects`.

### Do

1. Read the file first and map the three calls: what each asks for, whether they
   are sequential or independent, and what the DB writes between them are. The
   migration shape depends on that answer — three independent calls should fan
   out inside one alarm; a chain must stay ordered.
2. Move as a single job (`type: 'project_assessment'`) with per-call progress, so
   the UI can show *which* stage is running.
3. Prompts verbatim.
4. Refund on failure — with three calls, partial failure is the common case, so
   decide explicitly: refund in full, or pro-rate by completed stage. Write the
   decision in the task.

**Blocked by:** `SHARED-1`, `SHARED-3`.
**Open question:** whether assessments survive the narrowing at all — see
`00-state-of-play.md`. Do not migrate this until that is answered.

---

## PRJ-W3 — Project mock interview → worker

`projectv2-mock.action.ts` (528 lines, 3 LLM calls).

### Do

1. **Resolve the overlap first.** The standalone `mock` module (4,006 lines) does
   the same job. Migrating both means maintaining two mock-interview
   implementations on the worker as well as in the app.
2. Once resolved, migrate the surviving one as `type: 'project_mock'`.
3. Prompts verbatim.

**Blocked by:** the overlap decision, then `SHARED-1`, `SHARED-3`.

---

## PRJ-W4 — Quiz generation → worker

`projectv2-quiz.action.ts` (400 lines, 1 LLM call).

Smallest of the migrations and self-contained — **good first one to do** once
`SHARED-1` lands, to prove the pattern generalises beyond project generation.

### Do

1. `type: 'project_quiz'`, single completion, prompt verbatim.
2. Use it to build `SHARED-2` (the polling hook) against a real second consumer,
   rather than designing the hook against one example.

**Blocked by:** `SHARED-1`.

---

## PRJ-W5 — Task detail expansion → worker

`task-details.action.ts` (365 lines, 1 LLM call).

### Do

Likely the fastest call in the module. Measure before migrating — if it reliably
completes in a couple of seconds it can stay inline with an explicit timeout
(`PRJ-B5`) and be revisited later. **Do not migrate on principle; migrate on
measurement.**

---

## PRJ-W6 — Standup voice → worker (special case)

`standup-voice.action.ts` (478 lines, 2 LLM calls, one of them Whisper).

Different from the rest: it uploads **audio**. A Durable Object alarm cannot read
a request body that arrived on an earlier request, so the audio has to be in R2
before the job starts.

### Do

1. Upload audio to R2 from the client (or via a direct-upload URL).
2. Pass the R2 key — never the blob — in the job input.
3. Worker fetches from R2, transcribes, then runs the summarisation call.
4. Set a lifecycle rule on the audio so recordings are not kept indefinitely.

**Blocked by:** `SHARED-1`. Do this one **last** — it is the only migration that
needs new storage plumbing.

---

## SHARED-2 — One polling hook

`project-generate-sheet.tsx:103` hand-rolls its polling. Five more flows above
need exactly the same thing.

### Do

Build `useBackgroundJob(jobId)` returning `{ status, progress, result, error }`,
with backoff, an abort on unmount, and a terminal-state stop. Build it while
doing `PRJ-W4` so it is shaped by two real consumers, not one.

---

## Verification for every migration

A migration is done when all of these hold:

1. The flow completes end-to-end through the worker with a real payload.
2. Killing the browser tab mid-job does not affect completion — that is the
   entire point of moving it.
3. A forced failure refunds the credits exactly once.
4. A DO eviction mid-alarm does not duplicate the job (exercise the guard).
5. Model output is unchanged from before the migration — same prompt, same model,
   comparable result on the same input.
6. `tsc --noEmit` clean in `apps/main` and the worker.
