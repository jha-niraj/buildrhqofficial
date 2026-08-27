# KnowMe - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| KM-1 | Deleting a profile deletes its vectors | 2 | done (2026-08-27) |
| KM-2 | Put KnowMe back in the nav | - | done (2026-08-27) |
| KM-3 | Verify the loop end to end with a real profile | 1 | not started - the next task when this is picked up |
| KM-4 | Recruiter verification on the public chat | 3 | deferred (2026-08-27) |
| KM-5 | The remaining platform handlers | 1 | deferred (2026-08-27) |
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

**Status:** not started
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

---

## KM-4 - Recruiter verification

**Status:** not started
**Serves:** definition-of-done 3

`chat.action.ts:83` is `// TODO: Check if user is a verified recruiter`. Today
anyone can ask anything of any active profile. Decide whether that is the product
(a public persona is public) or whether asking requires an identified caller -
this is a product decision, not a bug, and it changes what the module IS.

---

## KM-5 - The remaining platform handlers

**Status:** not started

`data.action.ts:484` is `// TODO: Add other platform handlers`. The settings
screen offers to connect platforms; one is implemented. Either build the rest or
stop offering them.

---

## KM-6 - One shared user-knowledge source

**Status:** not started

The real version of "merge KnowMe with the AI chat" - see the decision in
`overview.md`. Merge the KNOWLEDGE, keep the two chats. `lib/resume/primary.ts`
is the pattern: one resolver, many consumers, each with its own permissions.

**Blocked on** KM-3, because there is no point unifying a source that has never
been shown to work.
