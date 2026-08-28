# Pathfinder - worker migration

## Status - reconciled against the code 2026-08-27

The header below said "12 inline LLM calls across 5 files, **none of them on a
worker**". That has not been true for some time. Corrected rather than deleted,
because a reader who trusted it would rebuild `PF-W1`, which is done.

| task | state |
|---|---|
| `SHARED-1` `type` column | **done** - `packages/db/src/schema/worker.ts:100` |
| `SHARED-2` polling hook | **done** - `apps/main/hooks/use-background-job.ts` |
| `SHARED-3` credit hold | **done** - `apps/main/lib/credits/hold.ts` |
| `PF-W1` verification generation | **done** - dispatches `verification_generation` from `actions/(main)/workers/verificationworker.action.ts:45`; `verification.action.ts` has zero inline model calls |
| `PF-W2` sub-goal generation | **built 2026-08-27** - `apps/worker/src/jobs/subgoal-generation.ts`. Registered in all five places, typechecks, worker live. **Not yet run end to end** - see the outcome at the end of this file |
| `PF-W3` voice transcription | **not started** - `voice_transcription` declared, unimplemented |
| `PF-W4` goal creation | **done 2026-08-27, PROVEN end to end** - `apps/worker/src/jobs/goal-creation.ts`. See the outcome below |
| `PF-W5` resource generation | **void 2026-08-27 - there is nothing to migrate.** `resources.action.ts` is dead code: zero importers of the module path anywhere in the repo. See below |
| `PF-W6` studio link | **not started** - `studio-link.action.ts`, 1 inline call |

So: **6 inline calls across 4 files**, not 12 across 5, and the heaviest one is
already off the request path.

The "Blocked by `SHARED-1`" line under each task below is satisfied everywhere -
that column shipped. Read the task bodies for the design; ignore their blocking
lines.

**The roadmap is also encoded in the type union.** `JOB_TYPES` in
`packages/db/src/schema/worker.ts` declares 20 types; `JOB_BINDINGS` in
`apps/worker/src/env.ts` binds 13. The seven declared-but-unrunnable ones are
exactly this backlog plus projects':

    project_assessment  project_mock  task_details
    subgoal_generation  goal_creation  resource_generation  voice_transcription

Nothing dispatches any of them today, so this is an unfinished plan rather than a
live bug - `jobStub` throws loudly on an unbound type rather than leaving a job
at `waiting` forever.

---

This module has the heaviest AI load in the product and, before `PF-W1`, had the
least offloading.

**AI generation must stay intact.** Prompts, model IDs, temperatures and output
schemas move verbatim. `subgoals.action.ts` pins `gpt-4o-mini` at `:348` and
`:644`; `whisper-1` at `:766`. Those exact values move across unchanged.

Pattern and non-negotiables: see `../README.md` and
`../projects/02-worker-migration.md`. Reference implementation is
`apps/worker/src/jobs/project-generation.ts`.

**Blocked by `SHARED-1`** (a `type` column on `background_job`) — every task
below writes job rows and cannot be told apart without it.

---

## PF-W1 — Verification generation → worker

**Do this first. It is the highest-value migration in the product.**

`verification.action.ts:132` — four LLM calls inline, credits debited up front,
no failure refund. Fixes `PF-B1` and `PF-B2` together.

### Do

1. Add a `verification_generator` Durable Object.
2. Map the four calls before writing anything: what each produces (quiz? coding
   problems? mock questions? project rubric?), and whether they are independent.
   Independent calls fan out inside one alarm; a chain stays ordered. **This
   determines the whole design — do not guess it.**
3. Job input carries `goalId` and `userId` only. The DO re-reads the goal and its
   14 sessions itself — do not serialise that payload through the job row.
4. Progress per section, so the UI can say "generating coding challenges (3 of
   4)" rather than spinning.
5. Credits via the hold helper (`SHARED-3`): reserve on dispatch, settle on
   success, release on failure.
6. Preserve the duplicate-run guard and catch-don't-rethrow from
   `project-generator.ts:44,65`. With credits involved, a duplicate alarm is a
   double charge.
7. Keep the performance refund at `:621` in the app — it runs after submission,
   not during generation, and does not belong in the worker.

**Blocked by:** `SHARED-1`, `SHARED-3`. **Fixes:** `PF-B1`, `PF-B2`.

---

## PF-W2 — Sub-goal generation → worker

`subgoals.action.ts` (808 lines, 4 LLM calls) — the largest action file in the
module. Two of the four are confirmed `gpt-4o-mini` completions (`:347`, `:643`);
one is Whisper (`:766`, see `PF-W3`).

Generating a goal's sub-goal plan is the second-heaviest AI operation here and
runs when a user creates a goal — the first thing they ever do in the module. A
timeout at that moment is a user who never comes back.

### Do

1. `type: 'subgoal_generation'`.
2. Both prompts verbatim, `gpt-4o-mini` pinned.
3. Progress per sub-goal so a long plan shows movement.
4. On failure, the goal must not be left half-planned — either the whole plan
   commits or none of it. Use `withTransaction` for the commit.

**Blocked by:** `SHARED-1`.

---

## PF-W3 — Voice transcription → worker (special case)

`subgoals.action.ts:755` `transcribeVoiceRecording(audioBlob: Blob)`, `whisper-1`
at `:766`.

Same constraint as `PRJ-W6`: a Durable Object alarm cannot read a blob that
arrived on an earlier request.

### Do

1. Upload audio to R2 first; pass the **R2 key**, never the blob.
2. Worker fetches, transcribes with `whisper-1`, writes the transcript.
3. R2 lifecycle rule so recordings expire.
4. Coordinate with `PRJ-W6` — both modules need identical audio plumbing. Build
   it once, in one place, and have both call it.

**Blocked by:** `SHARED-1`. Do **after** `PF-W1` and `PF-W2`.

---

## PF-W4 — Goal creation AI → worker

`goals.action.ts` (714 lines, 2 LLM calls).

### Do

Measure first. If these are short enrichment calls (a title, a summary) they may
be fine inline with an explicit timeout (`PF-B2` mitigation). If they generate
the goal outline, they belong on the worker with `PF-W2` — quite possibly as one
job, since creating a goal and planning it is a single user intent.

**Check whether `PF-W2` and `PF-W4` are actually one flow before building two.**

---

## PF-W5 — Resource generation → worker

`resources.action.ts` (303 lines, 1 LLM call). Generates learning resources for a
goal.

Lower priority: likely shorter, and a failure here degrades rather than blocks —
a goal without generated resources is still usable. Migrate after the above, or
leave inline with a timeout if measurement says it is fast.

---

## PF-W6 — Studio link → worker

`studio-link.action.ts` (265 lines, 1 LLM call).

**Do not migrate until the scope question is answered** — see
`00-state-of-play.md`. If studio is out of scope for the narrowed product this is
wasted work.

---

## Ordering

```
SHARED-1 (background_job.type)
    │
    ├─→ PF-W1  verification        ← highest value; fixes PF-B1 + PF-B2
    │      └─ needs SHARED-3 (credit hold)
    │
    ├─→ PF-W2  sub-goals           ← first-run experience
    │      └─ check against PF-W4 first: one flow or two?
    │
    ├─→ PF-W4  goal creation       ← measure before migrating
    │
    ├─→ PF-W3  voice               ← after R2 plumbing, shared with PRJ-W6
    │
    ├─→ PF-W5  resources           ← optional, measure first
    └─→ PF-W6  studio link         ← blocked on a scope decision
```

## Verification for every migration

As `../projects/02-worker-migration.md`, plus one specific to this module:

**Closing the tab mid-verification must not lose the goal's progress.** A user
who has spent three weeks on a goal and closes a laptop during verification is
the worst possible failure case here, and is exactly what this migration exists
to prevent.

---

# PF-W1 — DONE (2026-08-02)

Shipped. What exists now:

| piece | file |
|---|---|
| Durable Object | `apps/worker/src/jobs/verification-generation.ts` |
| Worker route | `apps/worker/src/index.ts` → `POST /api/v1/generateverification` |
| Binding + migration | `wrangler.jsonc` → `VERIFICATION_GENERATOR`, migration tag `v2` |
| App dispatch/poll | `actions/(main)/workers/verificationworker.action.ts` |
| UI | `pathfinder/[slug]/verify/_components/verification-page-client.tsx` |

The inline path turned out to be worse than this document assumed: not four
discrete LLM calls but an OpenAI **Assistants** run polled up to 90 times at 1s
intervals — up to 90 seconds of blocking sleep in a server action. Prompt,
assistant id and the 90×1s polling budget all moved verbatim.

Credits settle/release when the app observes a terminal job status, not in the
worker, so every credit decision stays in `lib/credits/hold.ts`.

## Deployed and proven — 2026-08-02

- [x] Worker deployed: `shipithq-generation`, version `ae68c958`, at
      `https://shipithq-generation.shunyatechofficial.workers.dev`. No generation
      worker had ever been deployed under any name, so this was a first deploy,
      not a duplicate of the pre-rebrand one.
- [x] All four secrets set (`DATABASE_URL`, `OPENAI_API_KEY`, `WORKER_SECRET`,
      `PATHFINDER_ASSISTANT_ID`) — a fresh worker has none.
- [x] Migration tag `v2` applied; both DO classes bind.
- [x] `/health` 200; unauthenticated and bad-token POSTs both 401.
- [x] **Survives client disconnect.** Dispatched a job, stopped polling entirely
      at 45s (job was `active` at 42%), came back later: `completed` at 100% with
      22 quiz questions, 4 coding questions, a mock interview row created and the
      plan written to `pathfinderVerifications.generatedPlan`. The old inline
      version could not have done this.
- [x] `generateVerificationContent` removed (213 lines) now the new path is
      proven; a pointer comment remains in its place.

## Still worth doing

- [ ] Forced-failure run through `startVerificationGeneration` end-to-end, to see
      the refund fire from the app poller. The credit hold itself is proven
      (8/8 assertions incl. no-double-charge / no-double-refund), and the
      dispatch-failure path refunds inline — but the *worker-failed → poller
      releases* branch has not been exercised against a real failed job.
- [x] Superseded: the app now reaches the worker over a **service binding**
      (`GENERATION_WORKER` in `apps/main/wrangler.jsonc`) rather than a public
      URL, so there is no `GENERATION_WORKER_URL` to keep in sync. Both dispatch
      sites go through `lib/workers/generation-worker.ts`, which uses the binding
      on Workers and falls back to HTTP for `next dev`.

## Blocked on a deployment decision

The app itself has never been meaningfully deployed:

- `shipithq-main` — does not exist
- `buildrhq-main` — exists but has **zero secrets**, i.e. an abandoned shell from
  an early deploy attempt, not a working deployment

So the service binding is configured and typed but cannot take effect until
`apps/main` is deployed under its current name. That is a larger job than this
migration — a full OpenNext build, all the app secrets, the
`shipithq-next-cache` R2 bucket, and moving any routes off the old name — and it
needs Niraj's call on the naming before anything is created.

---

## PF-W5 is void - the code it migrates is dead

Found 2026-08-27 while starting this migration. Recorded rather than quietly
skipped, because the task above reads like real work and the next person would
also start it.

`apps/main/actions/(main)/pathfinder/resources.action.ts` (303 lines) has **zero
importers**. Its only function export, `generateSubGoalResources`, is never
called - the symbol appears exactly twice in the entire repo, and both are inside
its own file (the definition and its own `console.error`).

**Why it looks alive, and the trap involved.** Three things make this file read
as in-use, and all three are misleading:

1. **A sibling with the same filename.** `actions/(main)/projects/resources.action.ts`
   IS live and imported in three places. A search for `resources.action` finds
   those and looks like coverage.
2. **A duplicated type name.** `SubGoalResources` appears to have 8 consumers.
   Every one of them imports it from `app/store/pathfinderStore`, which declares
   its **own** copy. The declaration in `resources.action.ts` has no consumers.
   Same for `Flashcard`.
3. It is 303 lines of complete, plausible implementation - an Exa fetch and an
   OpenAI call running in parallel, with token accounting wired to
   `logPathfinderUsage`. Nothing about reading it suggests it is unreachable.

This is the third time this repo has been bitten by judging a file by symbol name
rather than import path - `RES-8` recorded it for `resume-scrape.action.ts`,
`CLN-2`/`ADM-25` for `resume-template.action.ts`, and now this. **Check the
import specifier, not the symbol.**

**Worth knowing beyond the deletion:** the pathfinder resources feature was never
wired up. The two tabs that would show it -
`pathfinder-videos-tab.tsx` and `pathfinder-flashcards-tab.tsx` - read
`aiResources` out of the Zustand store, and nothing populates it from this
generator. So "generate learning resources for a sub-goal" is not a feature that
runs slowly on the request path; it is a feature that does not run.

That is a product question, not a migration one: either wire the generator up
(as a worker job, per this document) or delete it. Listed for Niraj in
`plan/cleanup/candidates.md` as Group G rather than decided here.

---

## PF-W2 outcome, 2026-08-27

**Scope, refined against the code.** The task named two `gpt-4o-mini` calls in
`subgoals.action.ts` (`:347`, `:643`). Reading them, they are two different user
actions, not one:

- `:347` `generateAIContentForSubGoal` - runs when a sub-goal is CREATED. This is
  what the task's own rationale is about ("runs when a user creates a goal - a
  timeout at that moment is a user who never comes back").
- `:643` - grades a submitted coding solution inside `submitSubGoalCoding`. A
  separate action, short (`max_tokens: 1000`, `temperature: 0.3`), and
  interactive. **Left alone and raised as its own task**; folding it in here
  would have migrated two unrelated flows under one id.

**A third call the task did not name, and it was the worst one.** `createSubGoal`
also blocked on `generateExplanation` (`studios/ai-generation.actions.ts:10`) - a
`gpt-4o-mini` completion with **no `max_tokens` at all**, asked for a detailed
explanation with code snippets. Unbounded by construction. Migrating only the
named call would have left the action blocking on the larger of the two and the
task's stated goal unmet, so the job does both.

**What moved and what did not.**

| stays in the action (synchronous) | moved to the job |
|---|---|
| auth, goal ownership, usage limit | the explanation completion |
| daily session, sub-goal row, stats | quiz + coding problems |
| the Studio row | the `aiCodingProblem` / `hasCoding` write |
| videos + docs (already fire-and-forget Exa lookups) | the session's `totalCodingProblems` counter |

The user gets a real sub-goal and its Studio back immediately; the job fills them
in. Same shape as `createTailoredResume`, and for the same reason: a failed job
leaves a usable row rather than nothing.

**Both prompts moved verbatim** - same model, temperature, token caps and JSON
shape, including the singular `codingProblem` fallback the original tolerated
because the model has been seen returning one object instead of an array.
Dropping that in a migration would have read as the model getting worse.

**Edge cases handled**
- **Ownership is re-checked in the job**, not trusted from dispatch. The input is
  a pointer (`subGoalId`) and the job joins to the goal to confirm `userId` -
  a sub-goal id alone must not let anyone generate against someone else's goal.
- **The two writes are a `db.batch`.** The sub-goal's problems and the session's
  running count are a pair; the neon-http driver has no transactions, and a
  half-applied pair leaves the counter disagreeing with the rows it counts.
- **The explanation is best-effort.** If it fails the practice problems still
  land, and the job reports which parts did - they are independently useful.
- **The Studio step is an upsert**, matching `generateExplanation`: regenerating
  a sub-goal must not stack two EXPLANATION steps.
- **A failed DISPATCH is not a failed sub-goal.** The action returns success with
  `generationError` set, because the row exists and is usable either way.

**Registration verified in all five places** by script -
`JOB_TYPES` (already declared), `JOB_BINDINGS`, `jobs/index.ts`,
`wrangler.jsonc` (binding + a NEW `v5` tag, never folded into `v4`), and the
entry-point export in `src/index.ts` - the fifth place that the README omitted
until `ResumeStructure` shipped broken because of it.

**Verified:** `npx tsc --noEmit` clean in `apps/main` and `apps/worker`; worker
running on `:8787` with `SUBGOAL_GENERATION` bound; six job types remain declared
but unrunnable (`project_assessment`, `project_mock`, `task_details`,
`goal_creation`, `resource_generation`, `voice_transcription`).

**NOT verified: an end-to-end run.** The signed-in account has no pathfinder
goals - the only goal in the database belongs to a probe account - so creating a
sub-goal through the UI needs a goal created first, which goes through
`createPathfinderGoal` and its own still-inline model calls (`PF-W4`). Combined
with the browser tab being backgrounded, the UI run did not happen. The job is
built and wired; it has not been watched working.

---

## PF-W4 outcome, 2026-08-27 - and the transport bug it uncovered

The task said **"Measure first"** and **"Check whether PF-W2 and PF-W4 are
actually one flow before building two."** Measuring changed the answer twice.

### They are not one flow, and goal creation was never the slow part

`createPathfinderGoal` makes **no model call at all**. The two calls in
`goals.action.ts` belong to different intents:

| call | enclosing function | invoked by |
|---|---|---|
| `:436` | `generateAIStudyPlan` | `createPathfinderGoal`, **fire-and-forget** |
| `:635` | `generateQuizAndCoding` | `generateContentForAISubGoal`, awaited, called from `daily-practice-view.tsx:469` |

So PF-W2 (sub-goal creation), the study plan, and on-demand sub-goal content are
**three** distinct user intents, not one. Only the first was migrated here; the
`:635` path is a separate user action and is raised separately.

### The study plan was a durability bug, not a latency one

    generateAIStudyPlan(...).catch(err => console.error(...))

A floating promise. Never awaited, no `waitUntil`. The action returns immediately
and the isolate is then free to be torn down, so on Cloudflare **the plan may
simply never be generated** - no error, no record of the attempt, just a goal
that stays empty. "Sometimes my plan does not appear" is not a diagnosable bug
report, which makes this shape worse than a slow request: a timeout at least
tells you something happened.

Two improvements the migration made on top of the move, both from reading the
original:

- **A duplicate-run guard on the DATA, not just the dispatch.** The original
  appended sub-goals unconditionally, so a re-fired alarm would have silently
  doubled every topic. The job now refuses a goal that already has sub-goals.
- **One insert instead of N.** The original awaited an insert per topic - 8 to 15
  sequential round trips - and a failure at topic 9 left a half-written plan with
  the counters never updated.

### The transport bug this uncovered - RES-17 was only half a fix

The first dispatch failed with **`Failed to parse URL from [object Request]`** -
the exact error `plan/resume/tasks.md:RES-17` recorded as fixed on 2026-08-25.

RES-17 corrected the **HTTP fallback** and left the **service-binding path**
building a `Request`, on the stated reasoning that "a Fetcher's contract requires
one". It does not: `Fetcher.fetch` takes the same `(input, init)` signature as
global fetch, and a string URL is a valid input. The local `ServiceBinding`
interface declared `fetch: (request: Request)`, which made the correct call look
wrong - **a narrow type standing as evidence for a claim that was not true.**

`apps/main/wrangler.jsonc` declares a `WORKER` service binding, so the binding
path is the one taken whenever the Cloudflare context resolves. Both paths in
`callWorker` and `callExecutorWorker` now pass `(url, init)`; `buildRequest` has
no callers and is marked superseded rather than deleted.

That was the **third** layered cause of the same symptom. All three had to be
fixed before any job could run:

1. the HTTP path building a `Request` (RES-17)
2. `WORKER_API_URL` pointing at `:3004`, so dispatches went nowhere (found today)
3. the binding path building a `Request` (found today)

### Verified - end to end, for the first time in this product

Dispatched `goal_creation` for a real goal, through the same signed-token route
the app uses:

    dispatch -> 200
    status   -> completed, 100%
    result   -> { topicCount: 15, skipped: false }
    goal.total_sub_goals = 15, sub_goal rows = 15

The 15 topics are coherent and correctly ordered - B-tree basics through EXPLAIN,
GiST/GIN, and tuning.

**`background_job` all time: 6 failed, 1 completed.** The one completed row is
this run. Before today, no background job had ever succeeded in this product.

**Still not proven through the UI.** The dispatch was made with a signed token
rather than by clicking, because the browser tab the tooling drives keeps being
backgrounded and Radix sheets will not mount without animation frames. The
worker, the job, the token, the DB writes and the counters are all proven; the
one untested link is the click that calls the server action.

---

# The rest of the migration: TRIAGED, and mostly not needed (2026-08-28)

Niraj, 2026-08-28: *"we should only move the ones which is long like project
generation or something that may take more than 30sec to complete, not all of
them."*

That is the right rule, and applying it to what is actually left changes the
answer completely. **No remaining pathfinder LLM call needs to move.** PF-W3,
PF-W5 and PF-W6 are all void, not deferred.

## Why 30 seconds, and how to estimate it without a stopwatch

The dominant cost of a chat completion is OUTPUT token generation, not the
prompt. `gpt-4o-mini` streams roughly 80 to 150 tokens per second, so
`max_tokens` is a usable upper bound on duration:

| `max_tokens` | worst-case generation | verdict |
|---|---|---|
| 1,000 | 7 to 12s | inline is fine |
| 2,000 | 15 to 25s | inline, with no headroom to spare |
| 4,000 | 30 to 50s | **must be a job** |
| unset | unbounded | **must be a job** |

`max_tokens` unset is the one to watch. It reads as harmless and is the worst
case in the table: the model will happily produce until it decides to stop, and
nothing in the code caps it.

## Every remaining call, measured

| Call | Live? | Model / cap | Estimate | Verdict |
|---|---|---|---|---|
| `goals.action.ts:482` `generateAIStudyPlan` | dead, SUPERSEDED | - | - | already a job (PF-W4); delete the corpse |
| `goals.action.ts:681` `generateQuizAndCoding` | **LIVE** via `generateContentForAISubGoal` | mini / 2,000 | 15-25s | **keep inline** |
| `subgoals.action.ts:363` `generateAIContentForSubGoal` | dead, SUPERSEDED | - | - | already a job (PF-W2); delete the corpse |
| `subgoals.action.ts:659` `submitSubGoalCoding` | **LIVE**, the coding grader | mini / 1,000, temp 0.3 | 8-12s | **keep inline** |
| `subgoals.action.ts:780` `transcribeVoiceRecording` | **dead**, 0 callers | whisper | - | **PF-W3 is VOID** |
| `resources.action.ts:191` `fetchOpenAIResources` | **dead**, 0 callers | mini / 4,000 | 30-50s | **PF-W5 is VOID** |
| `studio-link.action.ts:242` `generateNotesContent` | **dead**, 0 callers | mini / **unset** | unbounded | **PF-W6 is VOID** |

## The finding worth keeping

The two calls that are LIVE are the two SHORT ones. The two that would have
blown the 30-second budget - the 4,000-token resource generator and the
uncapped notes generator - are both **dead code with zero callers**.

So the remaining "worker migration backlog" was never a latency problem. It was
a dead-code problem wearing a latency problem's clothes, and three tasks
(PF-W3, PF-W5, PF-W6) were queued to carefully move code that nothing calls.

Two things follow:

1. **Check for callers BEFORE estimating cost.** Every one of those three tasks
   was written from a `grep` for `openai.chat.completions.create`, which finds
   text, not reachability.
2. **`submitSubGoalCoding` stays inline, and that is a real decision, not an
   omission.** It grades one submission at 1,000 tokens with temperature 0.3, so
   it lands around ten seconds. Making it a job would cost the user a poll cycle
   and a progress bar to save nothing, and would put a credit hold on an action
   that currently has none.

## What would change this

If `generateQuizAndCoding` ever has its cap raised, or `submitSubGoalCoding`
starts grading several problems in one call, they cross the line. The cap is the
signal - watch `max_tokens`, not the prose.
