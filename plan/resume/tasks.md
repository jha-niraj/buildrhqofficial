# Resume & cover letter - tasks

Derived from `overview.md`.

`RES-1` through `RES-7` were built on 2026-08-19 before this directory existed;
they are recorded here retroactively so the module has a complete history, and
each was verified before being marked done.

| ID | Task | Serves | Status |
|---|---|---|---|
| RES-1 | `isDefault` on `resume_draft` + auto-default + promote-on-delete | 4 | done (2026-08-19) |
| RES-2 | `resume_structure` worker job: extracted text -> structured draft | 2, 3 | done (2026-08-19) |
| RES-3 | Wire upload -> job, from profile and onboarding | 2, 7 | done (2026-08-19) |
| RES-4 | `get_my_resume` assistant tool with fallback chain | 5 | done (2026-08-19) |
| RES-5 | Cover letter reads the default resume | 5 | done (2026-08-19) |
| RES-6 | Upload path in the resume hub + set-default UI + real blank | 1, 4 | done (2026-08-19) |
| RES-7 | Tailor from a job URL, not only pasted text | 6 | done (2026-08-19) |
| RES-8 | Delete dead code | 9 | done (2026-08-20) |
| RES-9 | Move remaining inline LLM calls to the worker | - | not started (deferred) |

Credit charging for this module's operations is tracked in
`plan/credits/tasks.md` as `CR-4` through `CR-8`.

---

## RES-1 - Default resume

**Status:** done (2026-08-19)

`resume_draft.isDefault` + index (migration `0008`). First draft auto-defaults;
`setDefaultResumeDraft` swaps atomically via `db.batch`; deleting the default
promotes the most recently updated survivor.

**Edge cases handled**
- Two defaults or none is unreachable - both statements are in one batch.
- The worker decides whether to claim the default slot at write time, not
  dispatch time: minutes pass before the alarm, and the user may have set one by
  hand in between.
- Ownership is re-checked before the write; `id` arrives from the client.

**Verified:** column and index confirmed live in Postgres; `tsc` clean.

---

## RES-2 - `resume_structure` worker job

**Status:** done (2026-08-19)

Durable Object + Alarm, registered in all four required places (`JOB_TYPES`,
`JOB_BINDINGS`, `jobs/index.ts`, `wrangler.jsonc` binding + migration tag `v2`).

**Edge cases handled**
- Text under 200 chars is rejected as unreadable rather than spending a `gpt-4o`
  call to hallucinate a resume from a scanned PDF.
- Output normalised: all six sections guaranteed to be arrays.
- Name and email fall back to the account when the resume omits them.
- 4xx from OpenAI is non-retryable; transport and 5xx retry.

**Bug found while verifying:** `chatJSON` always sets
`response_format: json_object`, which OpenAI rejects with a 400 unless the prompt
contains the word "json". The prompt did not. Fixed by adding the explicit JSON
shape to the system prompt.

**Verified:** generated a real PDF, ran it through `unpdf` and the live OpenAI
API - correct dates, `current` flags, and all six sections.

---

## RES-3 - Upload wired to the job

**Status:** done (2026-08-19)

`uploadResume` dispatches `resume_structure` after persisting text, from all
three of its success paths. Onboarding passes a draft name.

**Edge cases handled**
- Extractor now dispatched on file type; a DOCX no longer runs through the PDF
  parser first.
- No text extracted (scanned PDF) means no job dispatched - no wasted call.
- `singleFlight: true`: re-uploading twice in a minute is a correction, not a
  request for two resumes, and the job re-reads the newest text at alarm time.
- Dispatch failure is best-effort and never fails an upload that succeeded.

---

## RES-4 - `get_my_resume` tool

**Status:** done (2026-08-19)

Fallback chain: default draft -> newest draft -> raw uploaded text -> honest
"none" with a suggestion to upload. Bullets and sections capped so a long resume
does not dominate context on every turn.

---

## RES-5 - Cover letter reads the resume

**Status:** done (2026-08-19)

Was building its "Applicant Profile" from hand-entered profile rows only, so a
user who had only uploaded a PDF got a letter written from nothing.

---

## RES-6 - Hub upload path, set-default UI, real blank

**Status:** done (2026-08-19)

Fourth create source (Upload), star button and Default badge per card, and
"Blank" now actually creates a blank resume - it previously called
`createDraftFromProfile` and returned a profile-filled resume while claiming
otherwise.

---

## RES-7 - Tailor from a job URL

**Status:** done (2026-08-19)

Reuses the Exa-backed `extractJobDescription` the cover letter flow already had.
Does not overwrite a job title the user has already typed.

---

## RES-8 - Delete dead code

**Status:** done (2026-08-20)
**Serves:** definition-of-done 9

**Why.** ~2,230 lines that nothing imports. Every one of them is a file a future
reader has to open, understand and rule out.

**Approved for deletion** (Niraj, 2026-08-20 - "delete the marketplace as well,
anything not directly related to the core features"):

| File | Lines | Why it is dead |
|---|---:|---|
| `app/(main)/ai/resume/_components/resume-hub-client.tsx` | 458 | superseded by `resume-hub.tsx`; the page renders `ResumeHub` |
| `app/(main)/ai/resume/_components/resume-creator-tabs.tsx` | 302 | superseded; `/ai/resume/create` now redirects to `/ai/resume` |
| `app/(main)/ai/resume/_components/experience-tab-form.tsx` | 519 | only imported by `resume-creator-tabs` |
| `app/(main)/ai/resume/_components/education-tab-form.tsx` | 294 | only imported by `resume-creator-tabs` |
| `app/(main)/ai/resume/_components/skills-tab-form.tsx` | 213 | only imported by `resume-creator-tabs` |
| `app/(main)/ai/resume/_components/socials-tab-form.tsx` | 188 | only imported by `resume-creator-tabs` |
| `app/store/resumeCreatorStore.ts` | - | only imported by `resume-creator-tabs` |
| `actions/(main)/ai/resume-scrape.action.ts` | 464 | duplicate of `resume-import.action.ts`, nothing imports the file |
| `actions/(main)/ai/resume-marketplace.action.ts` | 227 | marketplace, never wired up; cut as non-core |
| `lib/resume-extractor.ts` | 52 | superseded by `resume-extractor.client.ts`; no importers |
| 4 exports in `actions/(main)/ai/resume-import.action.ts` | - | `importFromText`, `importFromLinkedIn`, `importFromUrl`, `importFromGitHub` - no callers |

**Must NOT be deleted**
- `app/(main)/ai/resume/_components/projects-tab-form.tsx` - looks like a sibling
  of the other tab-forms but is still imported by
  `components/profile/sheets/add-project-sheet.tsx`.

**Edge cases**
- **Name collision.** `importProfileAndCreateDraft` is exported by BOTH
  `resume-scrape.action.ts` and `resume-import.action.ts`. The live callers
  import from `resume-import`. Confirm the import specifier, not the symbol, or
  the wrong file gets deleted.
- **The marketplace tab in `resume-hub.tsx`** renders community templates from
  `getResumeTemplates` (in `resume-draft.action.ts`), which stays. Only the
  purchase/list/delist actions go. Confirm the tab still renders.
- **`resumeTemplate` / `templatePurchase` tables stay.** Deleting actions is not
  deleting schema; a data-destroying migration is not part of this task.
- **`moduleEnum` in the credits schema references `RESUME_TEMPLATE`.** Untouched.
- **Delete in dependency order** and typecheck after, so a missed importer is a
  compile error rather than a runtime 500.

**Done when**
`tsc --noEmit` passes in `apps/main`, `/ai/resume` renders with all tabs, and
`grep -rn` finds no importer of any deleted path.

---

## RES-9 - Move remaining inline LLM calls to the worker

**Status:** not started - deferred

`tailorResumeForJD` (full `gpt-4o` resume regeneration - the highest timeout
risk), `scoreResumeAgainstJD`, `generateAndSaveCoverLetter`,
`generateCoverLetterQuestions` and the import actions all call models inline in
server actions, against the rule in `CLAUDE.md`. `resume_structure` (RES-2) is
the only one on the worker.

Deferred on 2026-08-20: it is a refactor of pre-existing code rather than part of
the feature work, and `CR-4`..`CR-7` deliberately put the credit lifecycle in
place first so the migration has refunds to inherit.
