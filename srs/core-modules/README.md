# Core Modules — Projects & Pathfinder

The two modules ShipItHQ is being narrowed to. Everything else (`ai`, `mock`,
`knowme`, `practice`, `jobs`, `opensource`) stays in the repo untouched and is
out of scope for this plan.

**Why these two.** Together they are one story — *set a goal, build the project,
get it verified* — and both accumulate user state that grows over time, which is
the only durable reason anyone returns to a tool. `projects` alone is a worse
Jira. `pathfinder` alone is a to-do list. Together they are the product.

```
srs/core-modules/
├── README.md                 ← you are here: shared rules, the arc, the ordering
├── projects/
│   ├── 00-state-of-play.md   scan findings, evidence, what exists today
│   ├── 01-blockers.md        what must be fixed before anything else ships
│   ├── 02-worker-migration.md   long-running work → Durable Object + Alarm
│   ├── 03-ui-layout.md       layout, responsive, states
│   └── 04-backlog.md         everything else, ordered
└── pathfinder/
    ├── 00-state-of-play.md
    ├── 01-blockers.md
    ├── 02-worker-migration.md
    ├── 03-ui-layout.md
    └── 04-backlog.md
```

Task IDs are stable and cross-referenced: `PRJ-*` for projects, `PF-*` for
pathfinder. Where one blocks the other it is stated explicitly on both sides.

---

## Non-negotiables for all work in here

**1. Long-running work goes to a Worker. No exceptions.**

The pattern already exists and is proven — `apps/worker` runs project
generation as a Durable Object that schedules an Alarm, executes off the request
path, and writes progress to the `background_job` table. The app polls. Copy that
shape; do not invent a second one.

```
server action                     worker (Durable Object)
─────────────                     ───────────────────────
insert background_job (queued) →  POST /start
                                  ctx.storage.setAlarm(now)   ← returns immediately
return { jobId }                       ↓
                                  alarm() runs the real work
client polls getStatus(jobId)  ←  writes status/progress/result to background_job
```

Reference implementation:
- Worker: `apps/worker/src/jobs/project-generation.ts`
- Client: `appsts/main/actions/(main)/workers/projectsworker.action.ts`
- UI: `apps/main/components/projects/project-generate-sheet.tsx` (polls at :103)

The rule of thumb: **if it calls an LLM, it does not belong in a server action.**
On Cloudflare Workers the request has a hard CPU/wall budget, and a 30-60s
completion will be killed. Today 11 action files in these two modules make
inline LLM calls (see each module's `02-worker-migration.md`).

**2. AI generation must stay intact.**

Migrating a flow to the worker must not change what the model is asked or what it
returns. Prompts, model IDs, temperatures and output schemas move verbatim. Each
migration task states which prompt is moving and from where. If a prompt needs to
change, that is a separate task, taken separately, after the migration is proven.

**3. Nothing is deleted.**

Dead code, duplicated flows and unused helpers are *listed*, not removed. The
decision on what to cut is Niraj's and has not been made.

**4. `tsc --noEmit` after every change; lint and builds only when asked.**

Per `CLAUDE.md`. Scope to the package being edited.

---

## Suggested order

The blockers first, because they are the ones that make the modules feel broken
rather than incomplete, and two of them cost users real credits.

| # | what | why first |
|---|------|-----------|
| 1 | `PRJ-B1` / `PF-B1` — credit loss on failure | Users are charged for work they never receive. Costs money and trust, and it is the cheapest to fix |
| 2 | `PF-B2` — verification runs inline | The single most likely thing to time out in production. Blocks the whole verification flow |
| 3 | `PRJ-B2` — no error boundaries | Any thrown error in either module currently takes out the whole app shell |
| 4 | worker migration (`PF-W*`, `PRJ-W*`) | Everything else is built on top of this |
| 5 | UI/layout | Cheap, visible, and safe once the data layer is stable |
| 6 | backlog | Ordered inside each file |

## Shared work that touches both

### SHARED-1 — `background_job` needs a `type` column

`packages/db/src/schema/worker.ts:17` has `jobId`, `status`, `progress`, `input`,
`result`, `error`, `userId` — and no job type. Survivable while project
generation is the only writer; broken the moment a second job type appears, which
is every task in both `02-worker-migration.md` files.

Add `type` + an index on `(userId, type, status)`, backfill existing rows to
`'project_generation'`, and export one `JobType` union that both the app and the
worker import.

Full detail in `projects/02-worker-migration.md`.
**Blocks:** every `PF-W*` and `PRJ-W*` task.

### SHARED-2 — one polling hook

`components/projects/project-generate-sheet.tsx:103` hand-rolls its poll loop.
Five more flows need the identical thing. Build `useBackgroundJob(jobId)` →
`{ status, progress, result, error }` with backoff, abort-on-unmount and a
terminal-state stop.

Build it during `PRJ-W4` (the smallest migration) so it is shaped by two real
consumers rather than designed against one.

### SHARED-3 — one credit-hold helper

**Blocks `PRJ-B1`, `PF-B1`, `PRJ-W1`, `PRJ-W2`, `PF-W1`** — the most depended-on
task in this plan, and the one that stops users being charged for work they never
receive.

Today both modules debit credits *before* the work and neither refunds on
failure. `projects` has a `_refundCredits()` that is never called
(`project.action.ts:57`); `pathfinder` debits in front of a four-call AI sequence
(`verification.action.ts:172`). Pathfinder's `:621` refund is a **performance
rebate**, not a failure refund — do not conflate them.

The helper owns one lifecycle:

```
reserve(userId, amount, reason) → holdId     debit + creditTransactions row
   ↓ work runs (inline or on a worker)
settle(holdId)                               keep the debit
release(holdId, reason)                      refund + reversing ledger row
```

Requirements:

- **Idempotent, keyed on `holdId`** (job id once the work is on a worker). A
  Durable Object alarm can re-fire after eviction — without this, that is a
  double charge or a double refund.
- Writes a `creditTransactions` row on both sides so the ledger reconciles.
- Distinct `description` values for failure refunds vs performance rebates, or
  the ledger becomes unreadable.
- Atomic. `db.transaction()` throws on the neon-http driver — use
  `withTransaction` or `db.batch`.

Failure cases that must release: LLM error, timeout/abort, schema-validation
failure, worker job ending `failed`.
