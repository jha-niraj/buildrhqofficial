# KnowMe - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| KM-1 | Deleting a profile deletes its vectors | 2 | done (2026-08-27) |
| KM-2 | Put KnowMe back in the nav | - | done (2026-08-27) |
| KM-3 | Verify the loop end to end with a real profile | 1 | BLOCKED on the Vectorize index (2026-08-28) |
| KM-4 | Recruiter verification on the public chat | 3 | decided (2026-08-28) |
| KM-5 | The remaining platform handlers | 1 | done (2026-08-28) |
| KM-6 | One shared user-knowledge source | - | deferred (2026-08-27) |

---

## KM-1 - Deleting a profile deletes its vectors

**Status:** done (2026-08-27)

`deleteKnowMeProfile` cascaded the `know_me_*` rows and left the embedded copy of
the user's personal data in Upstash - which is the store the PUBLIC chat endpoint
queries. "Delete my profile" therefore left the data both present and answerable
by strangers. It was a `TODO`, with the correct call already written and
commented out one line below.

**Edge case that decided the implementation.** Vectors are deleted BEFORE the
rows, because `profile.id` is the namespace key. Dropping the row first and then
failing would strand a namespace whose key nothing records any more. Failing in
this order leaves the profile intact and retryable, which is the recoverable
direction.

---

## KM-2 - Put KnowMe back in the nav

**Status:** done (2026-08-27)

Added as a primary item with `Analytics` and `Settings` children. `pnpm
check-nav` passes: all 22 paths resolve literally.

**What this also fixed.** KnowMe was "parked (code kept, hidden from nav)" while
`home/_components/feature-discovery.tsx:89` went on linking to `/knowme` from the
home page. It was unreachable from the sidebar and advertised on the first screen
a user sees. The nav comment and the home page now agree.

---

## KM-3 - Verify the loop end to end

**Status:** BLOCKED on the Vectorize index (2026-08-28)
**Serves:** definition-of-done 1

**Why.** 13 tables, **0 rows**. Every code path in this module is unexercised.
"It is written" and "it works" are different claims and only the first is
currently supported.

**Steps.** One real profile: initialize, add personal data, connect a platform,
generate embeddings, then ask it something from a signed-out browser and from the
API with a key.

**Edge cases**
- **Embedding generation writes a `know_me_embedding_job` row** - check it reaches
  a terminal state rather than sitting at pending, the same failure mode
  `background_job` had.
- **Ask a question with no relevant chunk.** The answer to "what is their
  favourite colour" must be "they have not said", not a confident invention -
  this is a profile of a real person and a hallucination here is defamatory.
- **Ask from a signed-out browser.** The public path must not silently pick up
  the owner's own session and appear to work.

**Done when** a profile answers a real question from a signed-out browser, and
the analytics page shows that question.

**BLOCKED 2026-08-28, on infrastructure rather than code.** The vector store was
migrated from Upstash to Cloudflare Vectorize, and the index does not exist yet.
Locally there is no binding either (`next dev` is not a Worker), and the REST
fallback's `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` are unset, so
`generateProfileEmbeddings` cannot write a single vector. Every step after
"add personal data" is unreachable.

Unblocks the moment these are run (they are also in `.env.example`):

    npx wrangler vectorize create shipithq-knowme --dimensions=1024 --metric=cosine
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=profileId --type=string
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=sourceType --type=string

The metadata index is not optional. Tenant isolation is a `profileId` filter, so
without it every query returns empty rather than erroring - which would look
exactly like "the loop does not work".

---

## KM-4 - Recruiter verification

**Status:** decided, 2026-08-28 (a public persona is public)
**Serves:** definition-of-done 3

`chat.action.ts:83` was `// TODO: Check if user is a verified recruiter`. Today
anyone can ask anything of any active profile. Decide whether that is the product
(a public persona is public) or whether asking requires an identified caller -
this is a product decision, not a bug, and it changes what the module IS.

**DECIDED 2026-08-28, Niraj: a public persona is public.** Consistent with the
earlier call to keep KnowMe as an ask-anything API surface rather than a gated
one.

What already protects it, and is enough:

- `allowAnonymous` and `allowRegisteredUsers` on the owner's privacy settings,
  both checked before a session opens.
- A per-session rate limit, default 20 questions with a one-hour reset.

Why the recruiter gate is not built: this product has **no recruiter identity** -
no role, no verification flow, no way to become one. `RECRUITER` is therefore a
viewer type nothing can produce, and a gate nobody can pass is not a gate.
`know_me_privacy_settings.allow_recruiters` stays dormant for the same reason;
it is not surfaced in the settings UI and is read by nothing, so it promises the
user nothing. The TODO is replaced with the reasoning so the next reader does not
"finish" it.

---

## KM-5 - The remaining platform handlers

**Status:** done, 2026-08-28 (stopped offering what has no handler)

`data.action.ts:484` was `// TODO: Add other platform handlers`. The settings
screen offers to connect platforms; one is implemented. Either build the rest or
stop offering them.

**DONE 2026-08-28: stopped offering them.** The onboarding wizard advertised
GitHub, LeetCode, StackOverflow and LinkedIn. Only GitHub has a handler; the
other three hit a silent `break` in the sync switch, so connecting one reported
success, wrote zero external data, and left the user unable to tell "synced,
found nothing" from "never ran". The list now shows GitHub alone, and the switch
has a `default` that THROWS with the platform name instead of falling through.

**The reason LinkedIn was not simply implemented is worth recording.**
`utils/truefolio/linkedin.ts` exports `fetchLinkedInData(username)`, has zero
callers, and looks exactly like the missing handler. It returns **mock data** - a
hardcoded fake profile, labelled as such in its own comment. Wiring it would have
filled a real person's public, strangers-can-query-it persona with invented
employment history, which is the defamation risk KM-3's own edge cases warn
about. The real LinkedIn path in this repo is the Exa-backed scrape inside the
`resume_import` worker job; that is what to reuse if LinkedIn is ever connected
here.

---

## KM-6 - One shared user-knowledge source

**Status:** blocked on KM-3, which is blocked on the Vectorize index

The real version of "merge KnowMe with the AI chat" - see the decision in
`overview.md`. Merge the KNOWLEDGE, keep the two chats. `lib/resume/primary.ts`
is the pattern: one resolver, many consumers, each with its own permissions.

**Blocked on** KM-3, because there is no point unifying a source that has never
been shown to work.

## KM-7 - /knowme crashed with a neon connection error - DONE 2026-08-28

**Symptom.** Every visit to `/knowme` died on a runtime error:

```
No database connection string was provided to `neon()`.
Perhaps an environment variable has not been set?
    packages/db/src/client.ts (34:17) @ module evaluation
```

The stack read, innermost last: `client.ts` <- `@repo/db/index.ts` <-
`utils/knowme/vector-db.ts` <- `utils/knowme/index.ts` <-
`knowme-dashboard.tsx`.

**Cause.** `knowme-dashboard.tsx` is `"use client"` and needed exactly one thing
from the utils: `formatRelativeDate`, a pure date formatter. It imported it from
the `@/utils/knowme` barrel.

A barrel re-export is a real import. The barrel re-exports `vector-db.ts`, which
imports `db` from `@repo/db` as a value, so pulling one formatter through it
dragged the neon client into the browser bundle - where it evaluates at module
scope, finds no `DATABASE_URL`, and throws before the page renders.

This is why the error appeared only now. `vector-db.ts` gained its `@repo/db`
import when it moved to Vectorize and `deleteNamespace` began reading vector ids
out of Postgres; the barrel import in the dashboard had been harmless until then.

**Fix.** A new `utils/knowme/format.ts` holding only pure functions, imported
directly by the client component.

Moving the import one level deeper to `helpers.ts` would NOT have fixed it -
that module imports `createHash`/`randomBytes` from `node:crypto` for API-key
hashing, so a client importing it drags Node's crypto in instead. The new module
has no server dependency of any kind. `helpers.ts` re-exports from it, so every
existing server-side import is unchanged.

**Scope.** One file, not the whole module. A sweep of every `"use client"`
component against every util that imports the `db` value (`utils/referral.ts`,
`utils/knowme/vector-db.ts`, `lib/resume/primary.ts`,
`lib/github/github-service.ts`), directly or through a barrel, found no other
crossing.

**Done when.** `/knowme` and `/knowme/settings` render with no neon error and no
runtime overlay. Verified in the browser. (`/knowme/analytics` and
`/knowme/onboarding` both redirect to `/knowme` for this account, which is
existing behaviour and unrelated.)
