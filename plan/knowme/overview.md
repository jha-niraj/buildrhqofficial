# KnowMe - overview

## Scope, narrowed 2026-08-27

> **Niraj:** *"keep the api part for the knowme where someone can ask and we
> already have the data that we will reply with ... for now I guess we should not
> focus onto this one."*
>
> **KnowMe is the API and the public ask-and-answer surface. Nothing more, and
> not now.** Deprioritised behind resume and cover letter.
>
> What that decision keeps: `/api/v1/knowme/chat`, the API keys and rate limits,
> the public `/knowme/[username]` page, and the retrieval that answers from data
> the product already holds.
>
> What it defers: `KM-4` recruiter verification, `KM-5` the remaining platform
> handlers, and `KM-6` the shared knowledge source. It does NOT defer `KM-1`
> (already fixed - deleting a profile now deletes its vectors), because that one
> is a privacy defect on a public endpoint and the endpoint is the part being
> kept.
>
> `KM-3` (prove the loop works with one real profile) stays the next task
> whenever this is picked up, because the API answering from "data we already
> have" is exactly the thing that has never been exercised.

## What this module is

**A queryable public persona.** Someone else - a recruiter, a hiring manager, or
a program calling an API - asks questions about you, and an AI answers from an
embedded copy of your work, curated and trained by you.

That sentence is the whole module, and every part of it is load-bearing:
*someone else*, *asks*, *you curate*. It is the outward-facing half of ShipItHQ.

## Is it finished? Nearly, and it has never been used

Scanned 2026-08-27. This is not a stub. It is ~7,769 lines of working
implementation:

| piece | state |
|---|---|
| Vector store | Upstash, `utils/knowme/vector-db.ts`, namespaced per profile |
| Embeddings | `text-embedding-3-small`, batched, content-hashed, chunked by source |
| Answering | `gpt-4o-mini` over retrieved chunks, `utils/knowme/ai-response.ts` |
| Public surface | `/knowme/[username]` and `POST /api/v1/knowme/chat` |
| API product | API keys, rate limits, per-request logging, usage stats |
| Owner curation | `saveOwnerTraining`, `approveResponseAsTraining`, message feedback |
| Analytics | who asked what, profile views, exportable |
| Platform sync | connect / sync / disconnect external platforms |

**13 tables, 0 rows.** Every table is empty, so nothing above has been exercised
by a real user. "Complete" here means the code paths exist, not that they work.

### Known gaps

1. ~~**Deleting a profile left the vectors behind.**~~ **Fixed 2026-08-27.** The
   cascade cleared Postgres; the embedded copy of the user's personal data stayed
   in Upstash, which is exactly what the PUBLIC chat endpoint queries. So "delete
   my profile" left the data both present and answerable by strangers. It was a
   `TODO` with the call commented out one line below the delete.
2. **`chat.action.ts:83` - recruiter verification is a `TODO`.** Anyone can ask,
   with no check that they are who they claim.
3. **`data.action.ts:484` - only one platform handler exists.** "Connect your
   platforms" currently connects one.
4. **Never load-tested, and it is a public endpoint with rate limits that have
   never been hit.**

## Definition of done

1. A user can build a profile, embed it, and share a link that answers questions
   about them from their real work.
2. **Deleting anything deletes it everywhere** - Postgres and the vector store.
   (1 above.)
3. Every question asked of a profile is attributable and rate-limited.
4. The owner can see what was asked and correct any answer.
5. No private field is reachable through the public surface without the owner
   having chosen to publish it.

## Decision: KnowMe and the AI assistant do NOT merge

Asked by Niraj on 2026-08-27: *both do the same thing, why can't we merge them?*

They look identical - both are "a chat box that knows about the user" - and they
are not the same product. The difference is **who is asking**, and it decides
everything else.

| | KnowMe | AI assistant (the rail) |
|---|---|---|
| Who asks | **anyone else**, plus API clients | **you** |
| Auth | public link / API key | your session |
| What it can do | answer, only | **act**: `create_project`, `create_goal`, `create_cover_letter` |
| What it may see | what you curated and published | everything you own |
| Retrieval | vector search over embedded chunks | typed tool calls straight to your rows |
| Failure mode | says something wrong about you in public | does the wrong thing in your account |

**Merging the surfaces would be a data leak, not a refactor.** The assistant's
`get_my_resume` returns the user's full resume - correct for the owner, a breach
for a stranger on a public link. Every one of its 11 tools is written with "the
caller IS the user" as an assumption. Put a public visitor behind that same
interface and the safe default disappears; you would be one forgotten permission
check away from publishing someone's private data, on the exact endpoint whose
purpose is to be public.

The two also want opposite things from an answer. The assistant should be
literal and current - read the row, act on it. KnowMe should be curated and
flattering-but-true - the owner trains it, approves answers, and corrects it. The
same model with the same prompt cannot be both.

### What SHOULD be shared, and is the real version of the question

**The knowledge layer, not the chat.** Both need one honest answer to "what do we
know about this user". Today that exists twice:

- KnowMe embeds profile, projects, assessments, GitHub and bio into Upstash.
- The assistant reads the same underlying data through `lib/ai/tools.ts`, and the
  resume specifically through `lib/resume/primary.ts` - which already exists
  precisely because two features disagreed about who the user was.

`lib/resume/primary.ts` is the pattern to copy: **one resolver, many consumers,
each with its own permissions.** A shared "user knowledge" source would feed the
assistant directly and feed KnowMe's embedding pipeline, so the two can never
drift into two different accounts of the same person - while keeping two
surfaces, two auth boundaries and two tones.

**So the answer is: merge the knowledge, keep the chats.** That is the useful
half of the idea, and it is also the safe half.

## Out of scope

- Rebuilding the assistant rail. It is inward-facing and stays.
- The second credit ledger (`know_me_credit_transaction`) - real fragmentation,
  tracked with the wider credits consolidation, not here.
