# Resume & cover letter - overview

## What this module is

The place a user turns their history into the two documents a job application
needs. They arrive with either a PDF they already have or nothing at all; they
leave with a structured, editable resume that the rest of the product can read,
and cover letters written against real job descriptions.

The important part is that second clause. The resume is not only a document the
user exports - it is the record of who they are that every other AI feature on
ShipItHQ reads when it needs to know their background.

## Definition of done

1. **A user can get a resume onto the platform three ways**: upload a PDF/DOCX,
   import from LinkedIn/GitHub, or build one from their ShipItHQ profile. A user
   with none of those can still start from a genuinely blank resume and type.

2. **An uploaded file becomes structured data, not a blob.** Text is extracted
   with `unpdf` (PDF) or `mammoth` (DOCX), then passed through a model that
   returns typed sections. The user never sees raw extracted text presented as
   their resume.

3. **Parsing never blocks a request.** It runs as a `resume_structure` worker job
   on a Durable Object, because a `gpt-4o` pass over a full resume does not fit
   in a server action's budget.

4. **Exactly one resume is the user's default at all times.** Creating the first
   one sets it; deleting the default promotes another; the user can switch with
   one click and can see which one is current.

5. **Every AI feature that needs the user's background reads the default resume**
   - the assistant's `get_my_resume` tool, cover letter generation, and mock
   interview context. None of them asks the user to retype what they uploaded.

6. **A resume can be tailored to a job description supplied as pasted text or as
   a URL**, and scored against it.

7. **Uploading at onboarding is enough.** A user who drops in a PDF during signup
   and does nothing else has a structured, default resume waiting, and every AI
   feature works for them.

8. **Every AI operation in the module is priced and charged** per
   `plan/credits/overview.md`, and every failure refunds.

9. **No dead code.** Superseded components, duplicate scrapers and unreferenced
   actions are removed, not left for the next reader to evaluate.

## Decisions

- **The default resume is a flag on `resume_draft`, not a pointer on `user`.**
  A pointer needs a nullable foreign key and a cleanup path on delete; a flag with
  a "promote another on delete" rule keeps the invariant local to the table that
  owns it. Enforced in `setDefaultResumeDraft` with `db.batch`, not by a partial
  unique index - an ordinary two-statement swap would fail halfway against one.

- **Readers fall back rather than fail.** `get_my_resume` and cover letter
  generation read: default draft -> most recently updated draft -> raw uploaded
  text -> an honest "this user has no resume". A user whose drafts predate the
  flag still gets an answer.

- **Parsing an uploaded resume is free** (see `plan/credits/overview.md`).

- **Structured content is normalised in the worker before it is stored.** All six
  sections are guaranteed present as arrays. The editor and every consumer assume
  that; a missing key would be a crash rather than an empty section.

## Out of scope

- **The resume template marketplace.** Purchase/list/delist/earnings actions were
  written and never wired to UI. Deleted on 2026-08-20 by Niraj's decision as not
  core. Recoverable from git history if the feature is revived.
- **PDF export design.** The two templates in `lib/resume-pdf/` are unchanged.
- **Public resume sharing** (`/r/[slug]`). Works; untouched.
- ~~**Moving the remaining inline LLM calls to the worker.**~~ **Done**
  (`RES-9`, 2026-08-27). Every model call in this module now runs in
  `apps/worker`. Two exceptions stay inline and are argued in that task:
  `extractJobDescription` (one Exa fetch, no model, and interactive) and
  `whisperTranscribe` (a speech model on a short clip, free, interactive).
  `tailorResumeForJD` was not moved but deleted - it had been superseded by
  `createTailoredResume` and had no callers (`RES-18`).
