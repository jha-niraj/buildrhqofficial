# Projects — state of play

Findings from a scan of the module on 2026-08-02. Everything here is evidence
from the code, with file and line references, not estimation.

## Size

**13,188 lines** across 12 routes — the largest module in the product.

| route | purpose |
|---|---|
| `/projects` | marketing-style hub (hero, stat band, public projects) |
| `/projects/allprojects` | browse everything |
| `/projects/myprojects` | the user's own |
| `/projects/ideas` | idea browser with category rail + threaded comments |
| `/projects/leaderboard`, `/projects/leaderboard/[username]` | rankings |
| `/projects/[slug]` | **the workspace** — overview / pages / setup / settings tabs |
| `/projects/[slug]/tasks` | kanban |
| `/projects/[slug]/sprints` | sprint board |
| `/projects/[slug]/quiz` | generated quiz |
| `/projects/[slug]/aimock` | mock interview on the project |
| `/projects/[slug]/leaderboard` | per-project rankings |

## Server actions — 8,100 lines across 16 files

| file | lines | LLM calls inline |
|---|---|---|
| `project.action.ts` | 1,139 | — |
| `projectassessments.action.ts` | 1,120 | **3** |
| `feature-suggestions.action.ts` | 747 | — |
| `project-errors.action.ts` | 672 | — |
| `team-collaboration.action.ts` | 559 | — |
| `projectv2-mock.action.ts` | 528 | **3** |
| `project-ideas.action.ts` | 501 | — |
| `standup-voice.action.ts` | 478 | **2** |
| `leaderboard.action.ts` | 466 | — |
| `sprint-generation.action.ts` | 450 | **1** |
| `standup.action.ts` | 432 | — |
| `projectv2-quiz.action.ts` | 400 | **1** |
| `task-details.action.ts` | 365 | **1** |
| `sprint-suggestions.action.ts` | 265 | — |
| `resources.action.ts` | 221 | — |
| `categories.action.ts`, `tasks.action.ts` | 299 | — |

**11 inline LLM calls across 6 files.** All of them are on the request path.

## What already works well

**Project generation is correctly offloaded.** This is the reference
implementation for everything else:

- `apps/worker/src/jobs/project-generation.ts` — a Durable Object that
  persists input, schedules an immediate Alarm, and runs the ~1–1.5 min pipeline
  off the request path. It guards against duplicate runs when the DO is evicted
  mid-alarm (`:44`) and deliberately catches rather than rethrows so the alarm
  does not auto-retry and create duplicates (`:65`). Both are the right calls.
- `apps/main/actions/(main)/workers/projectsworker.action.ts` — issues an
  HMAC-signed, 5-minute-expiry token scoped to a single action and job id
  (`issueWorkerToken`, `:21`), inserts the `background_job` row *before* calling
  the worker so the UI can poll immediately, and checks credits up front.
- `apps/main/components/projects/project-generate-sheet.tsx:103` — polls
  `getGenerationStatus(jobId)`.

**The comment system** (`Comment` table, polymorphic, soft-delete, rate-limited
per user) is sound and was verified against the live database.

**Route skeletons** exist for all 12 routes and were hand-matched to their real
layouts.

## Confirmed defects

### Credits are charged with no failure refund

`project.action.ts:57` defines `_refundCredits(userId, amount, description)`.

**It is never called.** The underscore prefix is the only thing keeping the
linter quiet. `grep -n "_refundCredits"` returns exactly one hit — the definition.

So any generation or assessment flow that debits credits and then fails leaves
the user charged with nothing to show for it.

### 43 × `catch (error: any)`

`CLAUDE.md` explicitly bans this: *"`catch (error: unknown)`, narrowed before
use. Never `catch (error: any)`."* There are 43 in these two modules.

Beyond style: `error: any` means `error.message` type-checks even when the thrown
value is a string, a Response, or undefined — which is how error handling
silently produces `undefined` in user-facing messages.

### Heavy `any` usage in the action layer

| file | occurrences |
|---|---|
| `project.action.ts` | 49 |
| `leaderboard.action.ts` | 19 |
| `project-ideas.action.ts` | 17 |
| `projectv2-mock.action.ts` | 16 |
| `project-errors.action.ts` | 15 |
| `categories.action.ts` | 9 |
| `standup.action.ts` | 8 |
| `projectv2-quiz.action.ts` | 8 |

### No error boundaries

`find … -name "error.tsx"` returns **nothing** for this module. A thrown error in
any project route escapes to the root, which means the whole app shell — sidebar,
AI rail and all — is replaced by the global error page.

### Tab triggers are wrong in dark mode

`projects/[slug]/_components/project-details-client.tsx:768` and `:779`:

```
data-[state=active]:bg-neutral-900 dark:bg-white data-[state=active]:text-white
dark:text-neutral-900 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black
```

`dark:bg-white` and `dark:text-neutral-900` are **not** gated on
`data-[state=active]`. In dark mode every trigger — active and inactive — gets a
white background, so the active state is invisible and the tab strip reads as a
solid white bar.

### No `maxDuration` anywhere

`grep -rn "maxDuration\|export const runtime"` across both modules returns
nothing. Every inline LLM call runs under the platform default.

## Open questions for Niraj

1. `projectv2-mock.action.ts` (528 lines, 3 LLM calls) overlaps the separate
   `mock` module (4,006 lines). Two implementations of project mock interviews.
   Which one survives?
2. `projectassessments.action.ts` is 1,120 lines with 3 LLM calls and is the
   largest single action file. Is assessment still in scope for the narrowed
   product, or does it follow `practice` into the parked pile?
3. `/projects` (the hub) is styled as a **marketing page** — hero, stat band,
   trust pills — inside the authenticated app shell. Was that deliberate, or is
   it a landing page that ended up behind auth?
