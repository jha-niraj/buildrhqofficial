# Interview prep - overview

## What this module is

The place a user turns a real job posting into practice they can actually do.

Paste a job description (or a URL we scrape), and ShipItHQ produces a Pathfinder
goal whose topics are the questions that job would ask: technical, behavioral,
and coding. The user then answers them the same way they work through any other
Pathfinder goal - quiz attempts, coding submissions, a Studio for notes, and the
same progress and verification machinery.

The point is the second half of that sentence. This capability already existed
twice: once as the standalone **Job Interview Assistant** (`/ai/interviewassistant`,
roughly 6,600 lines across 5 tables) and once, generalised, as Pathfinder. They
are not two features. They are the same feature built twice, and the Interview
Assistant is the narrower of the two.

So this module is not "build interview prep". It is **fold interview prep into
Pathfinder and delete the standalone copy**, so that one engine owns creating,
practising, scoring, publishing and selling a body of practice material.

## Why the Interview Assistant loses

The two schemas are close to a one-to-one map:

| Job Interview Assistant | Pathfinder |
|---|---|
| `jobInterviewAssistant` (slug, isPublic, publicCost, purchaseCount, viewCount, rating, tags) | `pathfinderGoals` (slug, isPublic, creditPrice, forkedFromId) |
| generated technical / behavioral / coding questions | `pathfinderSubGoals` |
| `userQuestionResponse` | `pathfinderQuizAttempts` |
| `codeEvaluation` | `pathfinderCodingSubmissions` |
| `interviewPlanPurchase` | `pathfinderGoalPurchases` |

Pathfinder is a strict generalisation: it has everything above plus daily
sessions, groups, streaks, verification, a usage ledger, and Studio notes. The
one thing the Interview Assistant has that Pathfinder does not is its **entry
point** - "here is a job description, generate from it" - and that is a single
generation prompt, not an architecture.

Even that entry point is already half-shared: `extractJobDescription` (Exa-backed)
lives in `cover-letter.action.ts` and is the same scrape both features want.

## Definition of done

1. A user can create a Pathfinder goal by pasting a **job description** or a
   **job posting URL**, and gets back a goal whose sub-goals are that job's
   likely interview questions.
2. Those sub-goals are split into **technical**, **behavioral** and **coding**,
   and the kind is visible in the UI and stored in the database - not inferred
   from the title.
3. Coding questions arrive as real Pathfinder coding problems (`hasCoding`,
   `aiCodingProblem`), gradeable through the existing submission flow. No second
   grading path is introduced.
4. Generation runs in `apps/worker` as a Durable Object job. No LLM call happens
   inside a server action.
5. The generated goal records where it came from: the job description, the
   company URL, and any scraped company info.
6. An interview-prep goal is publishable, forkable and priceable through the
   **same** `pathfinderGoals` fields every other goal uses. No parallel
   marketplace.
7. `/ai/interviewassistant` and every route under it is gone, and nothing in the
   navigation, the AI rail or the home page links to it.
8. The five Interview Assistant tables are dropped by a generated migration, and
   `jobinterview.action.ts` is deleted.
9. `apps/main` typechecks, `pnpm check-nav` passes, and the flow has been driven
   end to end in a real browser - not asserted from source.

## Out of scope

- **Voice answers.** The Interview Assistant had `transcribeVoiceToText` and
  `voice_transcription` is a declared-but-unbound job type with zero dispatch
  sites. Voice interviewing belongs to the `mock` module, and `PF-1` in
  `srs/core-modules/pathfinder/04-backlog.md` is the task that settles the
  three-way overlap. This module does not touch it.
- **The three-way mock-interview overlap itself** (`PF-1`). Retiring the
  Interview Assistant removes one of the several duplicated surfaces, but
  `projectv2-mock` and the standalone `mock` module are a separate decision.
- **Company research as a feature.** `fetchCompanyInfo` is kept only as context
  for generation. No company pages, no company profiles.
- **Backfilling old Interview Assistant rows into Pathfinder goals.** See the
  decision below.

## Decisions

- **Nothing is migrated. The tables are dropped.** Niraj, 2026-08-28: "we are not
  on production so we can do anything here." That removes the only real argument
  for a staged retirement - `interviewPlanPurchase` holds credit-purchase history,
  which on a live product could not simply be deleted. On a pre-production
  database it can, and a migration path nobody will ever run is worse than no
  migration path.
- **Interview prep is a Pathfinder category, not a flag.** A new
  `INTERVIEW_PREP` value on `pathfinderCategoryEnum`, so these goals filter,
  sort and display through the machinery every other category already uses.
- **Question kind is a column, not a convention.** `pathfinderSubGoals.kind`
  (`TECHNICAL` / `BEHAVIORAL` / `CODING` / `TOPIC`), defaulting to `TOPIC` so
  every existing sub-goal keeps its meaning. Encoding the kind in the title
  string was considered and rejected: it cannot be filtered or counted.
- **Generation price: 1 credit per 2 questions**, matching what the Interview
  Assistant charged (`baseCredits = ceil(total / 2)`). This is a real change for
  Pathfinder, where `goal_creation` and `subgoal_generation` currently dispatch
  with **no `cost` at all** and generation is effectively free. Flagged for
  Niraj, and **SETTLED 2026-08-28: keep it as is.** Interview-prep generation is
  charged at the old Interview Assistant rate; `goal_creation` and
  `subgoal_generation` stay free. This is knowingly inconsistent within
  Pathfinder. It was chosen over the alternatives because charging for the other
  two is a price rise on something users already get for nothing, and making
  interview prep free gives up revenue on a capability that was priced and live.
  Revisit when Pathfinder pricing is looked at as a whole, not before.
- **The old public slugs are not redirected.** Pre-production, and no external
  link to them is known to exist.
