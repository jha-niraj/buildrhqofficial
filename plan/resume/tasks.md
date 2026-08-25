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

---

## RES-10 - Editor form: real components, real dates, real scrolling

**Status:** done, verified 2026-08-25

**Why.** The editor form is built from primitives the rest of the product does
not use. A raw `<input type="checkbox">` renders the OS checkbox (Image #77); a
raw `<Input type="date">` renders the OS date picker, which on macOS Chrome is a
blue-accented calendar that ignores the monochrome palette entirely (Images #76,
#80); and both the summary and the bullets textareas scroll with a native
scrollbar in a product that uses `ScrollArea` everywhere else (Images #75, #78,
#79). None of these are cosmetic preferences - they are the four places the
editor stops looking like the app it is in.

**Files**
- `packages/ui/src/components/ui/textarea.tsx` - scrolling
- `packages/ui/src/components/ui/month-picker.tsx` - NEW
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx` - all call sites
- `apps/main/components/profile/sheets/add-work-experience-sheet.tsx`
- `apps/main/components/profile/sheets/add-education-sheet.tsx`
- `apps/hiring/app/(main)/applications/[jobSlug]/application-detail-sheet.tsx`

**Steps**
1. `Textarea` grows to fit its content and is wrapped in a `ScrollArea` that caps
   the height. A `<textarea>` is a leaf element - a `ScrollArea` cannot go inside
   one - so the only way to get a styled scrollbar is to stop the textarea
   scrolling at all and let a wrapper do it.
2. New `MonthPicker`: a `Popover` + `Calendar` + month/year dropdowns, controlled,
   emitting the same ISO string the callers already store.
3. Replace all 9 `type="date"` inputs and the 1 native checkbox.

**Edge cases**
- `Textarea` is used with `className="h-24"` / `h-20` / `resize-none` at several
  call sites. A fixed `h-*` on the wrapper must still cap the scroll area, and
  `resize-none` must not be silently dropped.
- The auto-grow must run on `value` change, not only on input, or a
  programmatic set (AI rewrite, profile sync) leaves the box the wrong height.
- Resume dates are stored as full ISO strings but only ever displayed as
  month + year. The picker must round-trip without shifting the day across a
  timezone boundary - `new Date('2026-08-01')` is UTC midnight, which is the
  previous month in any negative offset.
- `add-work-experience-sheet` binds through a `field()` helper that spreads
  `value`/`onChange`. A component with an `onValueChange` API cannot be spread
  into; those two call sites need explicit props.

**Done when**
`grep -rn '<input[^>]*type="\(date\|checkbox\)"' apps` returns nothing outside a
file input, `tsc --noEmit` passes in `apps/main`, `apps/hiring` and
`packages/ui`, and the editor's date fields open the app's own calendar.

---

## RES-11 - Bullets are bullets, everywhere

**Status:** done, verified 2026-08-25

**Why.** Image #78 and #79: a summary and a set of bullet points are being typed
as one run-on paragraph, and the preview renders them as one, because the only
affordance is a bare textarea whose label says "one per line". The rendered
resume then shows a single 6-line bullet (Image #81), which is the one shape a
resume must never have. Anything that reads as a list must be entered as a list
and rendered as a list.

**Files**
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`
- `packages/db/src/resume.ts` - `renderResumeText`, if it joins bullets

**Steps**
1. A `BulletsEditor` that shows one row per bullet with its own control, rather
   than a textarea the user is asked to format by hand.
2. The header summary stays prose - a summary IS a paragraph - but the preview
   must respect its line breaks instead of collapsing them.

**Edge cases**
- Existing drafts hold bullets that were split on `\n` from pasted prose, so a
  single 400-character "bullet" is real data. The editor must not truncate it.
- An empty row must not be persisted as an empty bullet, and must not be
  filtered while the user is still typing in it (the comma bug, again).

**Done when**
Pasting a paragraph into the summary keeps its line breaks in the preview, and
each bullet is a separate row in the form and a separate `•` line in the preview.

---

## RES-12 - Contact row and links on the rendered resume

**Status:** done, verified 2026-08-25

**Why.** Image #75: the header renders raw URLs as plain grey text -
`https://github.com/jha-niraj` and `https://linkedin.com/in/nirajjha31` - which
wrap onto two lines, dominate the contact row, and are not clickable. A resume
is read as a PDF and as a web page; on both, a link should be an icon plus the
handle. Companies also have official sites worth linking, and there is nowhere
to put one.

**Files**
- `packages/db/src/resume.ts` - add `companyUrl` to `ResumeExperienceEntry`
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`
- `apps/main/actions/(main)/ai/resume-profile-sync.action.ts`

**Steps**
1. Contact row renders an icon plus the handle (`jha-niraj`, not the URL), each
   an external link.
2. Add `companyUrl` to the experience entry, a field in the form, and a linked
   company name in the preview.
3. Project `github` / `liveUrl` get the same icon treatment.

**Edge cases**
- `companyUrl` is a NEW key on a jsonb column that `apps/worker` also reads.
  Optional only - every existing draft lacks it.
- A user may type `github.com/x`, `@x` or a bare handle. Deriving the display
  handle must not throw on a string that is not a URL.

**Done when**
The contact row is one line of icons and handles, every one opens in a new tab,
and a company with a URL renders as a link.

---

## RES-13 - Social links entered on the resume reach the profile

**Status:** done, verified 2026-08-25

**Why.** The import page already writes GitHub / LinkedIn / Twitter / website
back to `users` via `saveMyProfileLinks`. The editor's header form collects the
same four things and throws them away, so the profile stays empty and the next
sync has nothing to give - which is exactly why Sync Profile was a no-op on a
real account.

**Files**
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`
- `apps/main/actions/(main)/user/profile-links.action.ts`

**Steps** Save writes the header's link fields through `saveMyProfileLinks`
alongside the draft.

**Edge cases**
- `saveMyProfileLinks` only writes non-empty values, so clearing a link in the
  resume must not clear it on the profile. That is deliberate and stays.
- It must never fail the save. The draft is what the user asked to persist.

**Done when**
Typing a GitHub URL in the editor header and saving makes it appear on
`/profile`, and `select github_url from "user"` shows it.

---

## RES-14 - Preview hierarchy

**Status:** done, verified 2026-08-25

**Why.** Image #81: every section heading is the same size, weight and colour, so
EXPERIENCE, SKILLS, PROJECTS and EDUCATION all read at one level, and the entry
titles inside them compete with the headings. A resume is skimmed, and the
skimming depends entirely on that contrast.

**Files** `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`

**Done when** Section headings, entry titles, meta lines and body text are four
visibly distinct levels in the preview.

---

## RES-15 - AI Tools becomes a column; scrape refuses login walls

**Status:** done, verified 2026-08-25

**Why.** Four defects found together while tailoring a resume:

1. **Five toasts for one action.** `createDraftFromProfile` returns a
   `missingFields` array of six checks, and the hub did
   `missingFields.forEach(toast.warning)`. An empty profile therefore fired five
   warning toasts and then a success toast on top of them - a stack of red that
   reads as five failures when nothing had failed.
2. **A login wall returned as a job description.** Exa fetched a LinkedIn jobs
   URL and got LinkedIn's sign-in page back. It was not empty, so the only guard
   (`if (!jd)`) passed and the wall was pasted into the JD box, in front of a
   button offering to spend 20 credits tailoring against the words "Sign in".
3. **AI Tools was a Sheet**, so it covered the resume - the one thing you need to
   see while tailoring - and its `sm:max-w-md` cap clipped the
   "Tailor This Resume (20 credits)" button at the panel edge.
4. **Summary spacing.** `white-space: pre-line` rendered the blank line between
   paragraphs as a full empty line, so the preview's summary ran ~28px taller
   than the same text needs.

**Files**
- `apps/main/app/(main)/ai/resume/_components/resume-hub.tsx`
- `apps/main/actions/(main)/ai/cover-letter.action.ts`
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`

**Edge cases**
- A LinkedIn `/jobs/search-results/` URL is the wrong page even WITH a session -
  it lists jobs rather than being one - so it gets its own message.
- The wall check must not reject a short but real posting on length alone; a
  marker has to be present too.
- Three full-width columns do not fit at 1512px. The form pane narrows when the
  tools column opens, for the same reason `layout.tsx` collapses the sidebar
  when the AI rail opens.

**Done when**
Creating a resume shows one toast; fetching a LinkedIn search URL returns an
error naming the problem; the tools panel narrows the preview instead of
covering it; `tsc --noEmit` passes in all eight packages.

---

## RES-16 - The generated PDF, and the profile write-back

**Status:** done, verified 2026-08-25

**Why.** A downloaded PDF (`swe.pdf`) exposed seven defects, and Save was still a
one-way street.

**PDF, both templates**
1. `@react-pdf` renders `\n` literally, so each blank line between summary
   paragraphs became a full empty line. Three of them pushed a one-page resume
   onto two.
2. No `lineHeight` on the page style, so body leading was loose enough that a
   four-line bullet read as four separate sentences.
3. The contact row printed raw URLs (`https://github.com/jha-niraj`) as dead
   text. The file contained **zero** `/URI` annotations - nothing was clickable.
4. `minPresenceAhead` was absent, so "PROJECTS" printed alone at the bottom of
   page 1 with every project on page 2.
5. `formatDate` used `new Date(iso)`, which parses a bare ISO date as UTC
   midnight - the previous month in any negative offset.
6. `developer-pro`'s sidebar headings used `ACCENT` (`#171717`) on `SIDEBAR_BG`
   (`#171717`): **1.00:1**, invisible. "CONTACT", "SKILLS", "EDUCATION" and
   "CERTIFICATIONS" simply did not appear.
7. `developer-pro`'s contact glyphs (`✉ ✆ ⌖ ⌁ ⊕`) are outside the WinAnsi
   charset of the built-in Helvetica, so each rendered as nothing.

Also: project `liveUrl` was dropped by `clean-minimal` and `github` by
`developer-pro`; education `field` was collected and never printed.

**Save -> profile.** `syncProfileToResumeDraft` read the profile into a draft and
nothing went the other way, so the editor was write-only: a whole career typed
into a resume left the profile empty, which is what made Sync Profile a no-op.

**Files**
- `apps/main/lib/resume-links.ts` - NEW, shared by all three renderers
- `apps/main/lib/resume-pdf/{clean-minimal,developer-pro}.tsx`
- `apps/main/actions/(main)/ai/resume-to-profile.action.ts` - NEW
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`

**Edge cases**
- Write-back must NEVER delete: a resume is often a deliberately trimmed view of
  a career, and trimming one must not destroy the record.
- A draft entry's `id` is a DB id only when it came from a profile sync, so
  matching is on content. The key must include the START DATE and each matched
  row must be consumed - a real draft held two stints at one company under one
  title, and on (company, role) alone the second overwrote the first.
- Tailored drafts (`tailoredFor` set) are skipped: gpt-4o reworded them for one
  posting and that must not become the canonical history.
- `skills.category` is an 11-value pg enum; an unmapped group is skipped rather
  than guessed into the wrong bucket.
- `start_date` is NOT NULL on all three tables; an entry without one is skipped,
  never defaulted to today.
- Display type needs its own `lineHeight` once the page sets one, or a 22pt name
  inherits a line box shorter than its glyphs and the title rides up into it.

**Done when**
The rendered PDF is 1 page with 14 link annotations (was 2 pages, 0); sidebar
headings measure 7.11:1; saving twice inserts once and updates thereafter;
`tsc --noEmit` passes in all eight packages.

---

## RES-17 - Scrape quality, the worker dispatch, and the AI panel

**Status:** done, verified 2026-08-25

**Why.** Four separate defects from one tailoring session.

1. **`callWorker` broke EVERY background job.** The HTTP fallback was
   `fetch(buildRequest(...))`, and `next dev` polyfills the global `Request` with
   its own class - so the object was not the `Request` undici recognises. undici
   treated a non-Request input as a URL, called `String()` on it, got
   `"[object Request]"` and failed to parse it. Reproduced exactly in node. The
   request never reached the network, so the message named a URL problem for what
   was a realm mismatch. `background_job` showed `resume_tailor`,
   `resume_structure` and `project_generation` all failed with that one string
   over four days. Fixed by passing `(url, init)`; the binding path still builds a
   `Request` because a Fetcher's contract requires one. `callExecutorWorker` had
   the same bug.

2. **The scrape returned the whole LinkedIn page.** The wall check let a real
   posting through, but what came back was the advert plus 25 "Similar jobs", 25
   "Similar Searches", "People also viewed" and a footer - roughly 90% furniture.
   That text was the INPUT to gpt-4o for both ATS scoring and tailoring, which is
   what returned `0/100` with "missing keywords" like *based in Bangalore* and
   *immediate joiners*. The user was charged 5 credits for an answer computed
   from noise and offered a 20-credit rewrite against the same noise.

3. **`res.title` went straight into the Job Title field**, so the job being
   applied for was recorded as "Founding Backend Engineer at Mopid <emdash>
   Bengaluru, Karnataka, India | LinkedIn Jobs".

4. **The AI panel showed its results below the fold**, and the ATS score arrived
   off-screen with nothing on screen changing to say it had.

Also: a duplicate React key (`w-20` appeared twice in a literal array in the
editor's `loading.tsx`) warned five times per render, and `key={g.category}` on
skill groups had the same hazard in four files - nothing stops a user creating
two groups with one name.

**Files**
- `apps/main/lib/workers/client.ts`
- `apps/main/actions/(main)/workers/jobs.action.ts`
- `apps/main/actions/(main)/ai/cover-letter.action.ts`
- `apps/main/app/(main)/ai/resume/_components/resume-editor.tsx`
- `apps/main/app/(main)/ai/resume/draft/[id]/loading.tsx`
- `apps/main/app/(main)/r/[slug]/page.tsx`, `lib/resume-pdf/*.tsx`
- `packages/ui/src/components/ui/textarea.tsx`

**Edge cases**
- The cleaner is CONSERVATIVE: an unrecognised layout keeps its text, and a clean
  that strips below 200 chars returns the raw text instead. Losing part of a real
  posting is worse than leaving boilerplate in - the user can see and delete
  boilerplate but cannot restore a requirement that was silently cut.
- Dash characters must be matched in scraped titles but are banned in this
  codebase's source, so those character classes are written `—–`.
- Radix `ScrollArea` defaults to `type="hover"`; on a text field that means the
  bar only appears once the pointer is already inside, so overflowing content
  just looks cut off. The shared `Textarea` now passes `type="auto"`.

**Done when**
`background_job` stops recording "Failed to parse URL from [object Request]", a
LinkedIn fetch yields the advert alone, the Job Title field reads
"Founding Backend Engineer", and no duplicate-key warning appears.
