# Deletion candidates - RESOLVED 2026-08-20

**Groups A, B and D were deleted on Niraj's instruction. Group C was left to my
judgment; 6 of 10 were deleted and 4 kept. The outcome of every ID is recorded
at the bottom of this file.**

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

- **CLN-39 (`resume-tab.tsx`) was edited earlier this session** - it carries the
  resume-upload wiring that dispatches the `resume_structure` worker job. That
  work is not lost: the same upload path exists in
  `components/profile/tabs/work-experience-tab.tsx`... which is also on this
  list. **The live upload surfaces are `/ai/resume` (the hub's Upload source) and
  onboarding**, both of which call the same `uploadResume` action. So the
  profile page currently has no resume UPLOAD control, only a "Resume on file"
  readout linking to `/ai/resume`. If you want upload back on the profile page
  itself, say so and I will add it to the shared view - it is a small addition,
  not a reason to keep 555 lines.

- **`components/profile/sheets/*` are all still live** and are NOT on this list:
  `add-skills-sheet`, `add-work-experience-sheet`, `add-education-sheet`,
  `add-project-sheet`, `profile-strength-sheet`. The shared view opens them.
