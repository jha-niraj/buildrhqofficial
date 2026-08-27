# Deletion candidates - RESOLVED 2026-08-20

**Groups A, B and D were approved for deletion by Niraj. Group C was left to my
judgment; 6 of 10 were deleted and 4 kept. Group E was approved on 2026-08-27.
The outcome of every ID is recorded at the bottom of this file.**

> **Correction, 2026-08-27.** The "Outcome" section below claimed Groups A, B and
> D were deleted. Fifteen of the sixteen were still on disk - the deletions never
> reached the tree. See *"The Group A/B/D deletions never reached the tree"* at
> the end of this file. Read that before trusting any past-tense claim here.

Original note, kept for context: *Nothing in this file has been deleted.* It is the second pass Niraj asked for
on 2026-08-20: *"have a pass and make a list of the things that you think should
be deleted and then I will let you know which ones we should delete."*

Tell me which IDs to remove and I will do those and only those.

## How this list was built

Every file below was checked by **import path**, not by symbol name - the
difference matters. `getResumeTemplates` is exported by two different files, so a
name-based search says "4 references" for a file that nothing actually imports.
Each entry here has **zero** importers matching `from '.../<file>'` or
`import('.../<file>')` across `apps/main`.

Next.js convention files (`page`, `layout`, `loading`, `route`, `error`, …) are
excluded: the router reaches them, not an import.

**26 files, ~3,460 lines.**

## Verified NOT dead - do not delete

Flagged by the naive scan, then cleared:

| File | Why it stays |
|---|---|
| `types/elevenlabs-client.d.ts` | Ambient module declaration. `.d.ts` files are never imported by design, and `lib/elevenlabs/patch-client-errors.ts` imports `@elevenlabs/client`, which only compiles because of it. Deleting it breaks the build. |
| `app/(main)/ai/resume/_components/projects-tab-form.tsx` | Looks like a sibling of the tab-forms deleted in RES-8, but `components/profile/sheets/add-project-sheet.tsx` still imports it. |

---

## Group A - superseded duplicates

A working version of the same thing exists elsewhere. Lowest risk.

| ID | File | Lines | Superseded by |
|---|---|---:|---|
| CLN-1 | `components/project/voice-standup-sheet.tsx` | 448 | `app/(main)/projects/[slug]/_components/daily-standup-sheet.tsx`, which is the one the workspace renders. **Note:** this file was edited in `f2fb2a2` during the worker migration, so it was touched recently - it looks like the migration updated both copies rather than noticing one was orphaned. Worth a glance before you say yes. |
| CLN-2 | `actions/(main)/ai/resume-template.action.ts` | 220 | `resume-draft.action.ts`, which exports its own `getResumeTemplates` and is the one the resume page calls. Same name-collision trap as `resume-scrape.action.ts` in RES-8. |
| CLN-3 | `components/kanbanboard.tsx` | 220 | The project workspace has its own task board under `app/(main)/projects/[slug]/tasks`. |

## Group B - orphaned by the RES-8 deletion

These only ever had one caller, and RES-8 removed it.

| ID | File | Lines | Note |
|---|---|---:|---|
| CLN-4 | `actions/(main)/ai/resume-ai.action.ts` | 100 | `polishWorkExperienceBullets` + the voice variant. Its only UI was `experience-tab-form.tsx`. **I just added credit charging to this in CR-7** - if you want bullet-polish as a feature, the right move is to re-wire it into the resume editor rather than delete it. Your call on which. |
| CLN-5 | `hooks/usePdfExtractor.ts` | 52 | Client-side PDF extraction. Superseded by server-side `unpdf` in `uploadResume`. |
| CLN-6 | `utils/pdfjs-init.ts` | 9 | Only existed to support CLN-5. |
| CLN-7 | `app/store/coverLetterStore.ts` | 70 | `cover-letter-client.tsx` holds its state locally with `useState`. |

## Group C - built, never wired up

Complete features with no entry point. Deleting these throws away working code;
that may still be the right call, as it was for the marketplace.

| ID | File | Lines | What it is |
|---|---|---:|---|
| CLN-8 | `components/projects/project-analytics.tsx` | 664 | A whole analytics dashboard for a project. The largest single item here. |
| CLN-9 | `components/profile/skills-certifications-sheet.tsx` | 337 | Skills/certifications editor. The profile has other paths to this data. |
| CLN-10 | `actions/(main)/projects/sprint-suggestions.action.ts` | 265 | Users suggesting sprints on a project. |
| CLN-11 | `lib/config/standup-agent.config.ts` | 236 | ElevenLabs agent config for voice standups. **Check against CLN-1** - if the live `daily-standup-sheet` needs this config, it is not dead. |
| CLN-12 | `app/store/feedbackStore.tsx` | 186 | Feedback widget state. |
| CLN-13 | `components/common/share-dialog.tsx` | 136 | Generic share dialog. Sharing is done inline in the resume hub and elsewhere. |
| CLN-14 | `components/studio/_components/create-studio-sheet.tsx` | 112 | Studio creation. |
| CLN-15 | `actions/(main)/user/newsletter.action.ts` | 84 | Newsletter signup. |
| CLN-16 | `actions/(main)/pathfinder/practice-mock.action.ts` | 72 | Pathfinder practice mock. |
| CLN-17 | `actions/(common)/agents/openai-bot.action.ts` | 29 | An OpenAI bot action. |

## Group D - small unused utilities

Cheap to delete, cheap to keep, trivial to rewrite if wanted later.

| ID | File | Lines |
|---|---|---:|
| CLN-18 | `utils/imageCompression.ts` | 78 |
| CLN-19 | `lib/generateusername.ts` | 31 |
| CLN-20 | `utils/mdutils.ts` | 22 |
| CLN-21 | `app/store/projectStore.ts` | 22 |
| CLN-22 | `hooks/use-mobile.tsx` | 18 |
| CLN-23 | `hooks/use-debounce.ts` | 16 |
| CLN-24 | `components/spinners.tsx` | 12 |
| CLN-25 | `components/quizresults.tsx` | 12 |
| CLN-26 | `components/auth/auth-dialog-wrapper.tsx` | 11 |

**On CLN-22 and CLN-23:** `use-mobile` and `use-debounce` are the kind of hook
that gets reached for the moment someone builds a responsive component. Neither
exists in `packages/ui` either. Keeping them costs 34 lines.

---

## My recommendation

**Delete Groups A, B and D** (CLN-1..7, CLN-18..26) - about 1,400 lines of
duplicates, orphans and stubs, with the two caveats flagged on CLN-1 and CLN-4.

**Decide Group C one by one.** Each is a feature someone built. `project-analytics`
at 664 lines in particular is either worth wiring up or worth cutting
deliberately, not by default.

**Do not delete** `types/elevenlabs-client.d.ts` or `projects-tab-form.tsx` - see
the table above.

## Not covered by this pass

- `apps/web`, `apps/uni`, `apps/hiring`, `apps/admin`, `packages/*`. Same scan
  can be run against them on request.
- Unused **exports within live files** (as opposed to whole dead files). A
  narrower and noisier problem; worth a separate pass if you want it.
- Orphaned database tables. There is a known set noted in
  `packages/db/drizzle.config.ts` awaiting a decision, unrelated to this list.


---

# Outcome

Groups A, B and D: **deleted**, all 16 files, on Niraj's instruction.

## Group C - my calls

The rule I applied: **keep it if deleting would orphan a live database table, or
if it is large, substantially designed, and plausibly on the roadmap. Delete it
if it is superseded, trivially recreatable, or has no product intent behind it.**

### Kept (4 files, ~1,085 lines)

| ID | File | Why it stayed |
|---|---|---|
| CLN-8 | `components/projects/project-analytics.tsx` | 664 lines of designed dashboard. No data source, so it is a shell - but the expensive part (deciding the metrics and the layout) is done, project analytics is a plausible thing to want, and recreating it is real work. |
| CLN-10 | `actions/(main)/projects/sprint-suggestions.action.ts` | ~~Kept~~ - **superseded 2026-08-20.** The reasoning was that deleting it would strand a live table. `PRJ-2` then dropped the table too, as third-party sprint suggestions are exactly the multi-user machinery being removed. Both are gone. |
| CLN-15 | `actions/(main)/user/newsletter.action.ts` | Same reason: sole bridge to the live `newsletter` table (`profile.ts:230`). Small, but deleting it orphans schema. |
| CLN-16 | `actions/(main)/pathfinder/practice-mock.action.ts` | Sits in `pathfinder`, a core module per `srs/core-modules/`. It is the join between `pathfinderSubGoals` and `mockInterviewVoice` and composes a live action - small, but the integration logic is not obvious to re-derive. |

### Deleted (6 files, ~820 lines)

| ID | File | Why it went |
|---|---|---|
| CLN-9 | `components/profile/skills-certifications-sheet.tsx` | Superseded - `components/profile/sheets/add-skills-sheet.tsx` is the live path. |
| CLN-11 | `lib/config/standup-agent.config.ts` | Confirmed the live `daily-standup-sheet.tsx` does not reference it. Belonged to the orphaned `voice-standup-sheet` (CLN-1). |
| CLN-12 | `app/store/feedbackStore.tsx` | A Zustand wrapper over `feedback.action.ts`. Trivially recreatable. `feedback.action.ts` itself was **kept** - it bridges the live `feedbacks` table (`schema.ts:442`), and is now unreferenced. |
| CLN-13 | `components/common/share-dialog.tsx` | Generic share dialog; every surface that shares does it inline. |
| CLN-14 | `components/studio/_components/create-studio-sheet.tsx` | There is no `app/(main)/studio` route at all - nothing to create into. |
| CLN-17 | `actions/(common)/agents/openai-bot.action.ts` | A bare `gpt-3.5-turbo` call, superseded by the tool-using assistant in `lib/ai/tools.ts`. |

## Consequences worth knowing

- **Bullet polish is gone as a feature.** `resume-ai.action.ts` (CLN-4, Group B)
  was deleted. Its only UI was `experience-tab-form.tsx`, already removed by
  `RES-8`, so it was unreachable - but this does undo the credit charging added
  in `CR-7`. The price was removed from `pricing.ts` rather than left as config
  nothing reads. See `plan/credits/tasks.md:CR-7`.
- **`actions/(main)/user/feedback.action.ts` is now unreferenced** but kept, as
  the only route to the `feedbacks` table.
- **Totals:** 22 files deleted across all groups, ~2,900 lines. Combined with
  `RES-8`, roughly **5,100 lines** removed from `apps/main`.


---

# Group E - the superseded profile generation (added 2026-08-20)

**Awaiting your decision. Nothing here has been deleted** - you said "I am not
telling you to delete anything", so this is a list, not an action.

`/profile` and `/profile/[username]` now render one shared component
(`components/profile/profile-view.tsx`). The files below are the older tabbed
generation that used to render the public profile: a header, a tab bar, a
sidebar and eight tab panels. They are no longer imported by anything, and the
barrel (`components/profile/index.ts`) no longer exports them.

| ID | File | Lines |
|---|---|---:|
| CLN-27 | `components/profile/tabs/about-tab.tsx` | 481 |
| CLN-28 | `components/profile/tabs/at-a-glance-tab.tsx` | 480 |
| CLN-29 | `components/profile/integrations-tab.tsx` | 397 |
| CLN-30 | `components/profile/tabs/activity-tab.tsx` | 378 |
| CLN-31 | `components/profile/tabs/skills-tab.tsx` | 371 |
| CLN-32 | `components/profile/profile-header.tsx` | 319 |
| CLN-33 | `components/profile/modals/endorse-skill-modal.tsx` | 307 |
| CLN-34 | `components/profile/tabs/work-experience-tab.tsx` | 265 |
| CLN-35 | `components/profile/profile-sidebar.tsx` | 247 |
| CLN-36 | `components/profile/profile-tabs.tsx` | 162 |
| CLN-37 | `components/profile/tabs/education-tab.tsx` | 140 |
| CLN-38 | `components/profile/tabs/projects-tab.tsx` | 534 |
| CLN-39 | `components/profile/tabs/resume-tab.tsx` | 555 |

**~4,636 lines.**

## Two notes before you decide

- **CLN-39 (`resume-tab.tsx`) carried the resume-upload control.** That control
  now lives in the shared `profile-view.tsx` (upload, view, replace, delete),
  wired to the same `uploadResume` pipeline as onboarding - see
  `plan/profile/tasks.md:PRF-6`. Nothing is lost by removing this file.

- **`components/profile/sheets/*` are all still live** and are NOT on this list:
  `add-skills-sheet`, `add-work-experience-sheet`, `add-education-sheet`,
  `add-project-sheet`, `profile-strength-sheet`. The shared view opens them.

---

# Group E - DECIDED 2026-08-27

**Niraj: "Do the Group E".** All 13 files approved for deletion.

Re-verified by import path immediately before deleting, not trusted from the
2026-08-20 scan: `components/profile/index.ts` exports none of them, and no file
under `app/` or `components/` imports any of the paths.

Two of them were still being edited by accident after they went dead, which is
the cost this deletion removes:

- `profile-tabs.tsx` was modified in `b3dc1209` (2026-08-25), 33 lines, in a
  commit about the resume module.
- `profile-header.tsx` was given `min-w-0` fixes during `SHL-6`'s responsiveness
  pass. That work is discarded here, correctly - it was markup nobody renders.

---

# The Group A/B/D deletions never reached the tree

**Found 2026-08-27 while working through this file. Recorded rather than quietly
fixed, because the outcome section above says something that is not true.**

The "Outcome" heading states *"Groups A, B and D: **deleted**, all 16 files, on
Niraj's instruction."* Checked against the filesystem, **15 of the 16 are still
present**. Only `CLN-4` (`resume-ai.action.ts`) actually went.

`git log --diff-filter=D` shows no deletion commit for any of the 15. They were
never removed and then restored - the deletion simply did not happen. The
likeliest moment it was lost is `1c1e7b02` (2026-08-20), *"Resolved the merge
conflicts from the remote and local changes"*, which is the commit that landed
this whole session's work; a merge that takes "theirs" on a delete-vs-modify
conflict silently keeps the file.

Group C is unaffected: all 6 of its approved deletions are genuinely gone. So the
loss is specific to the A/B/D batch, not to the pass as a whole.

**Still present, ~1,240 lines:**

| Group | IDs |
|---|---|
| A | CLN-1 `voice-standup-sheet.tsx`, CLN-2 `resume-template.action.ts`, CLN-3 `kanbanboard.tsx` |
| B | CLN-5 `usePdfExtractor.ts`, CLN-6 `pdfjs-init.ts`, CLN-7 `coverLetterStore.ts` |
| D | CLN-18..26, all nine |

The approval on record is Niraj's own, quoted at the top of the Outcome section,
and nothing about the reasoning has changed - so this is finishing approved work
that failed, not a new deletion decision. Re-verified by import path on
2026-08-27 before re-running it, because a week of commits sits between the
approval and now and a dead file can acquire a caller.

`CLN-2` is additionally covered by `plan/resume/tasks.md:RES-18`, which is where
it gets deleted, because it needs the same name-collision check as
`tailorResumeForJD` in that file.

**The lesson worth keeping:** a deletion is verified by `ls`, not by having
written the deletion. Every other task in `plan/` states a falsifiable "Done
when"; this file's outcome section stated an action instead, and that is exactly
the gap the convention exists to close.

## Outcome of both, 2026-08-27

**28 files, 5,896 lines**, all re-verified by import path immediately before
deletion and all clear.

| batch | files | note |
|---|---:|---|
| Group A | 3 | `CLN-2` also carries `plan/resume/tasks.md:RES-18` |
| Group B | 3 | `CLN-4` was already gone; the other three were not |
| Group D | 9 | all of them |
| Group E | 13 | the superseded tabbed profile generation |

`components/profile/tabs/` no longer exists. `components/profile/` is down to
`index.ts`, `profile-view.tsx`, `profile-view-skeleton.tsx`, `modals/` (two live
modals) and `sheets/` (five live sheets). The barrel's comment was rewritten -
it said the Group E files were "still on disk pending Niraj's call", which is no
longer true and would have misled the next reader in the opposite direction.

**One re-verification changed nothing but was worth running.** `projects-tab.tsx`
(CLN-38) looks like it has a caller: `add-project-sheet.tsx` imports
`projects-tab-**form**`, a different file in the resume module, and the one
RES-8 recorded as "must NOT be deleted". A substring match on `projects-tab`
finds it. The import specifier does not. Same trap, third time in this repo.

**Not touched:** the four Group C files kept in the 2026-08-20 pass
(`project-analytics.tsx`, `newsletter.action.ts`, `practice-mock.action.ts`, and
`feedback.action.ts` which that pass left unreferenced-but-kept as the only
bridge to the `feedbacks` table). Their reasoning is unchanged and no new
decision was asked for.

**Running total across `RES-8`, the 2026-08-20 pass and this one: roughly 11,000
lines removed from `apps/main`.**

**Verified:** `cd apps/main && npx tsc --noEmit` exits 0 after all 28 deletions.

---

# Group F - the KnowMe module (raised and DECIDED 2026-08-27)

> **Decided: KEEP and unpark.** Niraj: *"add this knowme link to the nav ... I
> want this to be the feature which should know all the things about the user."*
> KnowMe is back in the sidebar and now has its own plan directory,
> `plan/knowme/`. The recommendation below (leave parked, decide later) was
> overruled, and the "make it consistent" half happened anyway - the nav and the
> home page agree again, in the other direction.
>
> The delete option is off the table. The rest of this entry stays as the
> record of what the module costs.

**Originally raised as a decision. Nothing here was deleted.** Raised because
`apps/main/lib/navigation.ts:26` says *"KnowMe is parked (code kept, hidden from
nav)"*, and parked code that nobody has decided about is exactly what this file
exists to surface.

## What it is

| | |
|---|---:|
| Routes | 5 - `/knowme`, `/knowme/onboarding`, `/knowme/settings`, `/knowme/analytics`, `/knowme/[username]` |
| App components | 21 `.tsx` |
| Server actions | 7 files |
| **Total** | **~7,769 lines** |
| Database tables | **13** |
| **Live rows across all 13** | **0** |

Bigger than Group E (the superseded profile generation, ~4,636 lines) and bigger
than `RES-8` and the original A-D groups combined.

## The finding that makes this urgent rather than tidy

**It is hidden from the sidebar and still advertised on the home page.**

- `app/(main)/home/_components/feature-discovery.tsx:89` links to `/knowme`
- `app/(main)/home/_components/home-client-wrapper.tsx:22` mounts a KnowMe sheet

So a user cannot find KnowMe in navigation but is invited into it from the first
screen they land on. Whatever is decided, those two references and the nav
comment have to agree - right now they contradict each other, and the home page
is the one users actually see.

## The options, honestly

**Delete it.** 7,769 lines and 13 tables go. Nothing is destroyed: every table is
empty, so this is an ordinary migration rather than a data decision - the same
situation `PRJ-5` was in. It is recoverable from git history. This is consistent
with `srs/core-modules/README.md`, which says the product is being narrowed to
Projects and Pathfinder and lists `knowme` among the modules explicitly out of
scope.

**Revive it.** Put it back in the nav and finish it. Worth knowing what that
commits to: `knowme/embeddings.action.ts` is one of the 11 files doing raw SQL
credit math, it has its own `know_me_credit_transaction` table separate from the
main ledger, and it carries an embeddings pipeline against Upstash Vector -
`UPSTASH_VECTOR_REST_URL` and `_TOKEN` are already in the env. That is a second
credit system and a second vector store to maintain.

**Leave it parked, but make it consistent.** Cheapest: remove the two home-page
entry points so "parked" is actually true, and revisit later. Costs ~10 lines and
stops the product advertising a door that is not in the corridor.

## Recommendation

**Leave it parked and make it consistent, now** - the two home references are a
live inconsistency and cost almost nothing to fix. Then decide delete-or-revive
separately, when the narrowing to Projects and Pathfinder is further along and
the answer is obvious rather than a guess.

Deleting 7,769 lines and 13 tables is not reversible in practice even though it
is in git, and there is no cost to holding an empty module for another few weeks.

---

# Group G - pathfinder resource generation (raised 2026-08-27)

**A decision for Niraj. Nothing deleted.** Found while starting `PF-W5` in
`srs/core-modules/pathfinder/02-worker-migration.md` - the migration turned out
to have nothing to migrate.

| ID | File | Lines | Status |
|---|---|---:|---|
| CLN-40 | `actions/(main)/pathfinder/resources.action.ts` | 303 | **zero importers of the module path, anywhere in the repo** |

Its only function export, `generateSubGoalResources`, is called nowhere. The
symbol appears exactly twice in the repo: its own definition and its own
`console.error`.

## Three reasons it reads as alive

1. **A live sibling with the identical filename.**
   `actions/(main)/projects/resources.action.ts` is imported in three places. Any
   search for `resources.action` finds those.
2. **A duplicated type name.** `SubGoalResources` looks like it has 8 consumers -
   every one imports it from `app/store/pathfinderStore`, which declares its own
   copy. Same for `Flashcard`. The declarations in this file have no consumers.
3. It is a complete, plausible 303-line implementation: an Exa fetch and an
   OpenAI call in parallel, token accounting wired to `logPathfinderUsage`.

Third time in this repo (`RES-8`, `CLN-2`, now this). **Check the import
specifier, not the symbol.**

## The product question underneath

The feature was never wired up. `pathfinder-videos-tab.tsx` and
`pathfinder-flashcards-tab.tsx` read `aiResources` from the Zustand store, and
nothing populates it from this generator. So sub-goal learning resources are not
slow - they do not exist.

**Delete it**, or **wire it up** as a worker job per `PF-W5`. Recommend deciding
this when the narrowing to Projects and Pathfinder is settled: if Pathfinder is
core, generated resources per sub-goal is a plausible thing to want, and the
prompt here is already written.

**If deleting:** the two types worth keeping (`SubGoalResources`, `Flashcard`)
already exist independently in `app/store/pathfinderStore`, so nothing needs
moving first.

---

# CLN-41 - superseded by the PF-W2 migration (raised 2026-08-27)

| ID | File / symbol | Lines | Status |
|---|---|---:|---|
| CLN-41 | `generateAIContentForSubGoal` in `actions/(main)/pathfinder/subgoals.action.ts` | ~95 | superseded by `apps/worker/src/jobs/subgoal-generation.ts`, no callers |

Kept in place with a `SUPERSEDED` banner rather than deleted, per the "nothing is
deleted" rule in `srs/core-modules/README.md` - dead code in the two core modules
is listed for Niraj, never removed as a side effect of a migration.

The worker job runs the same prompt with the same model, temperature and token
cap, so this is a true duplicate. The risk of keeping it is the usual one: two
copies of a prompt drift, and the banner says so explicitly.

Delete it whenever the migration has been watched working end to end.

---

# CLN-42 / CLN-43 - superseded by the PF-W4 migration (2026-08-27)

| ID | File / symbol | Lines | Status |
|---|---|---:|---|
| CLN-42 | `generateAIStudyPlan` in `actions/(main)/pathfinder/goals.action.ts` | ~110 | superseded by `apps/worker/src/jobs/goal-creation.ts`, no callers |
| CLN-43 | `buildRequest` in `apps/main/lib/workers/client.ts` | ~15 | no callers - BOTH transports now pass `(url, init)` |

Both kept in place with `SUPERSEDED` banners rather than deleted, per the
"nothing is deleted" rule in `srs/core-modules/README.md`.

**CLN-43 is the one worth keeping visible.** Building a `Request` there was the
realm hazard that broke every background job in this product, and `RES-17`
removed only half of it - the HTTP path - leaving the service-binding path
broken for two more days. The banner exists so the next person understands why
the function must not come back, not merely that it is unused.

Delete both once the migrations have been exercised through the UI as well as by
direct dispatch.

---

# CLN-44 - `pathfinder-studio-tab.tsx`, never imported (2026-08-27)

| ID | File | Lines | Status |
|---|---|---:|---|
| CLN-44 | `apps/main/app/(main)/pathfinder/[slug]/_components/pathfinder-studio-tab.tsx` | ~105 | zero importers |

Found while fixing the right pane of `daily-practice-view`. Nothing imports it:

```bash
grep -rn 'pathfinder-studio-tab\|PathfinderStudioTab' apps/main/app apps/main/components
# (no output)
```

The tab actually rendered on that page is `pathfinder-notes-tab.tsx`, which
mounts `StudioPanel`. This file mounts `StudioContainer` instead, so it is not
merely unused, it is a second answer to the same question.

**Why it is worth a line here rather than a silent delete.** Its root was
`h-[calc(100dvh-200px)]` - the same viewport-height-inside-a-bounded-pane bug
that made the live panel overflow the page card. It went unnoticed because the
file never renders. Left in place per the "nothing is deleted" rule, and NOT
fixed: fixing dead code only makes it look maintained. Delete it, or wire it up
and delete `pathfinder-notes-tab`, but do not leave both.

This is the fourth name-collision trap in this repo (after `generateAIStudyPlan`,
`generateSubGoalResources` and `buildRequest`): the name reads alive, the file is
not.
