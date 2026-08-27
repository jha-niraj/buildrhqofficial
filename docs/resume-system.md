# The resume system

## The problem this fixes

There were **two unconnected resume systems**, and every feature picked one at
random:

| | where | read by |
|---|---|---|
| an uploaded PDF | `users.resume`, `users.resumeText`, `users.hasResume` | mock interviews, knowme, the profile page |
| a structured builder | the `resume_draft` table - templates, ATS scoring, JD tailoring | the resume hub and editor |

Nothing bridged them, and nothing knew which resume was *the* resume. Two concrete
consequences:

1. **Cover letters contradicted the resume.** `generateAndSaveCoverLetter` built its
   own "applicant profile" out of the raw `skills` / `work_experience` /
   `portfolio_project` tables while the user's actual resume said something else. It
   also discarded every editorial decision the user had made in the builder - which
   jobs to lead with, which bullets to keep, how to describe themselves.
2. **Tailoring destroyed the master.** `tailorResumeForJD` carried the comment
   "Update THIS draft in place - do not create a new one". So tailoring for a job
   replaced the honest resume the user had built with a version narrowed to one
   application - and tailoring again ran against the already-narrowed copy,
   compounding it.

## The primary resume

One row, `resume_draft.is_default`, enforced as at most one per user by a **partial
unique index** rather than by convention. Two of them is not a cosmetic bug: it
means two features disagree about who the user is.

**On the two names.** The column is `is_default` and the file that reads it is
`lib/resume/primary.ts`. That is deliberate, not drift. "Default" is what the
column and the UI say - there is a star on each card in the hub and a Default
badge - and "primary resume" is the concept: the one authoritative answer to
"who is this user". An earlier draft of this document called the column
`is_primary`; it never shipped under that name, and `plan/resume/tasks.md:RES-1`
is the record of what did.

`apps/main/lib/resume/primary.ts` is the only thing that decides what "this user's
resume" means. Priority, most to least authoritative:

1. the draft marked `isDefault` - an explicit choice by the user
2. the newest **untailored** draft - the closest thing to a master. A JD-tailored
   copy is deliberately skipped: it is narrowed to one job, and using it as the base
   for a different job compounds the narrowing
3. the uploaded PDF's extracted text - unstructured, but it is what the user
   actually sends to employers
4. the profile tables, synthesised - better than nothing

It returns a `ResolvedResume` carrying both the structured `content` (when the
source has it) and a plain-text `text` rendering. **Every LLM consumer uses the
text.** Not `JSON.stringify`, which is what the old actions sent: raw JSON spends a
large share of the token budget on braces and key names, and nudges the model to
answer in JSON shape rather than reason about the content.

### Consumers

Everything that needs the user's resume now goes through the resolver:

- cover letter generation
- JD tailoring
- mock interview `resume_content` (was reading `users.resumeText` directly, so it
  quizzed candidates on a PDF from months ago while the builder said otherwise)

`getResolvedResume()` exists so the UI can *show* which resume a generator will
read. A generator whose inputs are invisible produces output nobody can sanity
check.

## Tailoring for a JD

`createTailoredResume()` in `resume-primary.action.ts`. The point, and the thing
that was asked for: **it does not ask for experience, education or skills again.**
It reads what the user already has and spins off a copy narrowed to this job.

```
createTailoredResume({ jobTitle, company?, jobDescription, sourceDraftId? })
   ↓  resolve the base resume (explicit source > primary > fallbacks)
   ↓  INSERT a new draft, seeded with the SOURCE content
   ↓  dispatch the `resume_tailor` job
   ↓  worker rewrites the NEW draft; the source is never touched
```

The new draft is created up front, not by the job, so that:

- the user can open it immediately and see a real resume, not a spinner
- a failed tailoring leaves a usable copy rather than an empty row
- the job's input stays a pointer (two draft ids) rather than a payload

`sourceDraftId` records the lineage. It is deliberately **not** a foreign key: a
self-reference needs a cascade policy, and the honest policy is "none" - deleting
the master must not delete or blank tailored copies the user already sent out.

If the resolver falls back to the profile tables, a master draft is materialised
first and marked primary - which also gives the user the canonical resume they were
missing. A PDF's extracted text is deliberately never used as the tailoring base:
it is one unstructured blob, and asking a model to reverse it into sections is how
invented employers and dates get in.

## On the worker

Both of these were inline `gpt-4o` completions over a whole resume plus a whole job
description - among the longest calls in the product, on request paths that could
not hold them. See `docs/background-jobs.md`.

| job | what it does |
|---|---|
| `resume_tailor` | rewrites the target draft; never touches the source |
| `cover_letter` | writes the letter from the resolved resume |

Two safety behaviours worth keeping:

- **`resume_tailor` validates the model's output shape** before writing it. A model
  that returns a partial or wrongly-shaped resume would otherwise write a draft that
  renders as a blank page. On a bad shape it keeps the source content, still returns
  the suggestions, and says so in the summary.
- **Both prompts forbid fabrication explicitly.** If the JD wants something the
  candidate does not have, it belongs in `suggestions`, not in the resume. This is
  the failure mode that gets a candidate caught in an interview.

`cover_letter` prefers to re-read the linked draft over the text snapshot the app
sent, so an edit made between dispatch and the alarm is picked up.

## The shared content contract

`resume_draft.content` is `jsonb`, so the database enforces nothing about its
shape - and both `apps/main` and `apps/worker` read and write it. The types, plus
`renderResumeText`, `isResumeDraftContent` and `coerceResumeDraftContent`, therefore
live in `packages/db/src/resume.ts` and are imported by both.
`apps/main/types/resume-draft.ts` re-exports them so existing imports keep working.

`coerceResumeDraftContent` matters more than it looks: a row written by an older
version of the app, or by a model that returned the wrong shape, can be missing
whole sections, and every array access downstream assumes all six keys exist.

## Migrations

**Two** of them, not one. Worth knowing, because the flag and the constraint that
makes it an invariant arrived four migrations apart.

`packages/db/drizzle/0008_supreme_supernaut.sql` - the flag and its lookup index:

```sql
ALTER TABLE "resume_draft" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;
CREATE INDEX "resume_draft_user_id_is_default_idx" ON "resume_draft" USING btree ("user_id","is_default");
```

`packages/db/drizzle/0012_aberrant_random.sql` - tailoring lineage, the cover
letter's link to a draft, and the uniqueness constraint:

```sql
ALTER TABLE "cover_letter" ALTER COLUMN "job_url" DROP NOT NULL;
ALTER TABLE "cover_letter" ADD COLUMN "resume_draft_id" text;
ALTER TABLE "resume_draft" ADD COLUMN "source_draft_id" text;
ALTER TABLE "resume_draft" ADD COLUMN "tailored_for_company" text;
ALTER TABLE "cover_letter" ADD CONSTRAINT ... FOREIGN KEY ("resume_draft_id") ... ON DELETE set null;
CREATE UNIQUE INDEX "resume_draft_one_default_per_user" ON "resume_draft" USING btree ("user_id") WHERE "resume_draft"."is_default";
```

Both are additive and safe to apply.

`job_url` was `NOT NULL`, which meant "paste a job description" had no way to save -
a JD is as often pasted as linked.

The partial unique index could not conflict on existing data when it landed,
because nothing had `is_default = true` yet. **No user has a default until they
set one or create their first draft**, and until then the resolver runs on
fallback 2 (newest untailored draft), which is the old behaviour plus
determinism.

The gap between 0008 and 0012 is why `setDefaultResumeDraft` swaps inside a
`db.batch` rather than trusting the index to reject a second write: the two
statements have to land together, and the neon-http driver has no transactions.
See `plan/resume/tasks.md:RES-1`.

## Still to do

Reconciled against the code on 2026-08-27. Two of the four entries that used to
be here have been done since, and are recorded rather than dropped so that
somebody reading an older copy of this file can tell what changed.

- ~~**Nothing costs credits.**~~ **Done.** Every AI operation in the module is
  priced from `lib/credits/pricing.ts` and charged reserve -> settle-or-refund.
  Tailoring is 20, an ATS score is 5, a cover letter is 15, an import is 20, and
  parsing an uploaded resume is deliberately free. The prices and the reasoning
  behind each are in `plan/credits/overview.md`; the work is `CR-4`..`CR-8`.
- ~~`tailorResumeForJD` is superseded but not deleted.~~ **Deleted** on
  2026-08-27 as `plan/resume/tasks.md:RES-18`, with Niraj's approval, along with
  the private `isResumeDraftContent` copy that only it used. Do not reintroduce
  it: `createTailoredResume` is the replacement and the reason is at the top of
  "Tailoring for a JD" above.
- `scoreResumeAgainstJD` is still inline. It is `gpt-4o-mini` with a small output,
  so it usually survives a request - but it writes `jdSnapshot` onto the master
  resume, which is mild pollution of a row that is supposed to be job-agnostic.
  Both the move and dropping that write are `plan/resume/tasks.md:RES-9`, which
  also covers the two import actions and `generateCoverLetterQuestions` - the
  last inline model calls in the module.
- `PLATFORM_TEMPLATES` in `apps/main/types/resume-draft.ts` uses indigo, pink and
  emerald, which `CLAUDE.md` rules out.
