# Mock interview consolidation - overview

## What this module is

The decision `PF-1` asked for: which implementation is *the* mock interview, and
what the others do instead.

`PF-1` said "three implementations". Measured on 2026-08-28 it was **four**, and
two of those were partly dead. After the CLN-45 sweep removed the dead parts,
**two live implementations remain**:

| Implementation | Lines | Storage | LLM work | Transport |
|---|---:|---|---|---|
| `mockvoice/` (the standalone module) | 1,336 actions + 4,024 UI | `mock_interview_voice`, `mock_voice_session`, `mock_voice_rating` | **worker jobs** `mock_conversation`, `mock_feedback` | its own ElevenLabs fetch |
| `projects/projectv2-mock.action.ts` | 535 | `project_v2_mock_session`, `project_v2_knowledge_base` | **inline** in the server action | its own ElevenLabs fetch |

## The decision

**`mockvoice/` is the canonical mock interview.** It is not close: it owns the
schema, the UI, the ratings and the marketplace, and it is the only one whose LLM
work runs on the worker.

**But `projectv2-mock` is NOT deleted, and its table is NOT merged.** That is the
part worth arguing, because "consolidate" reads like "delete one".

The two are the same MECHANISM and different PRODUCTS:

- `mockvoice` interviews you against a **scenario** somebody authored - a mock
  with a category, a price, a public listing, a rating.
- `projectv2-mock` interviews you about **your own project**, using a knowledge
  base generated from your code, and scores you on technical, communication and
  learning dimensions against work you actually did.

Their session tables reflect that honestly. The shared half is the ElevenLabs
session lifecycle - `id`, `userId`, `agentId`, `conversationId`, `duration`,
`transcript`, `status`, `startedAt`, `completedAt`. The unshared halves are real:
`mockId` + `variables` + `creditsUsed` + `userRating` on one side, `projectId` +
`sprintId` + four score columns + `strengths[]` + `improvements[]` on the other.
Forcing them into one table means half the columns are null for half the rows,
which is the "one table, two entities" smell.

So: **share the transport, not the interpretation.** Same shape as the KnowMe
decision ("merge the knowledge, keep the two chats") and `lib/resume/primary.ts`.

## Definition of done

1. There is exactly ONE piece of code in `apps/main` that fetches an ElevenLabs
   conversation. Both mock flows call it.
2. That one client fails LOUDLY when the fetch fails. It does not return an empty
   transcript that a caller will store as though the interview had no words in it.
3. It reads the duration from the field ElevenLabs actually returns.
4. It sets `cache: 'no-store'`, because a conversation being finalised must not be
   served from a Next.js fetch cache.
5. `project_v2_mock_session` and `mock_voice_session` remain separate tables, and
   the reason is written down where the next person will look.
6. `apps/main` typechecks and the mock routes still load.

## Out of scope

- **Merging the two session tables.** See the decision above.
- **Unifying the feedback shape.** `mockvoice` stores `aiAnalysis` as jsonb;
  `projectv2` stores four score columns plus `strengths[]`/`improvements[]`. They
  score different things, so the divergence is meaningful rather than accidental.
- **Moving `projectv2-mock`'s LLM calls to the worker.** Applying the 30-second
  rule honestly: they are capped at 2,000 and 1,000 tokens on `gpt-4o-mini`,
  which is 15-25s and 8-12s. Within budget. The case for consolidation here is
  duplication, not latency, and it would be dishonest to dress it up as latency.
- **The standalone `mock` module's own 4,024 lines of UI.** Untouched.

## Decisions

- **Both mock tables hold ZERO rows** (checked 2026-08-28). The entire mock
  capability, in every implementation, has never been run against real data. That
  is why this consolidation is low risk, and it is also why the ambition is
  deliberately small: unifying schemas nobody has exercised would be guessing.
- **`learnualScore` on `project_v2_mock_session` is left alone.** It looks like a
  typo for "learning", but renaming a column is a migration for a table with no
  rows and no proven flow. Noted, not fixed - see MC-3.
