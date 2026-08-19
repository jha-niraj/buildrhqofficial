# Pathfinder — worker migration

12 inline LLM calls across 5 files, none of them on a worker. This module has the
heaviest AI load in the product and the least offloading.

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
