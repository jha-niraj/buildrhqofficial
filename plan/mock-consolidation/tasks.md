# Mock interview consolidation - tasks

Derived from `overview.md`. Completes `PF-1` in
`srs/core-modules/pathfinder/04-backlog.md`, whose deliverable was "the decision
plus a written comparison" - the comparison is the table in `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| MC-1 | One ElevenLabs conversation client | 1, 2, 3, 4 | done (2026-08-28) |
| MC-2 | Write the two-tables decision where it will be read | 5 | done (2026-08-28) |
| MC-3 | `learnualScore` is a misnamed column | - | blocked: needs an interactive `db:generate` |

---

## MC-1 - One ElevenLabs conversation client

- [x] **Status:** done, verified 2026-08-28

**Why.** Two copies of the same fetch, and the forked copy has three defects the
original does not. This is the concrete cost of the duplication, not a
tidiness argument:

1. **A failed fetch is swallowed.** `projectv2-mock.action.ts:344` is
   `if (response.ok) { ...read transcript... }` with **no else branch**. When the
   call fails, `transcript` stays `[]` and `duration` stays `0`, and execution
   continues into a write that marks the session completed. The interview
   happened; the record says it had no words in it. AI feedback is then generated
   from that emptiness.
2. **The duration is read from a field that does not exist.** It does
   `Math.floor((data.metadata?.duration || 0) / 1000)`. ElevenLabs returns
   `metadata.call_duration_secs`, already in seconds - the sibling file's own
   `ConversationDetails` interface says so. So `?.duration` is `undefined`, `|| 0`
   takes over, and **every project mock session records a duration of 0**. The
   `/1000` also says whoever wrote it believed the value was milliseconds.
3. **No `cache: 'no-store'`.** The canonical copy sets it. Next.js caches `fetch`
   by default, and a conversation that is still being finalised must not be
   served from cache.

**Files.**
- `apps/main/utils/elevenlabs/conversations.ts` (new)
- `apps/main/actions/(main)/mockvoice/conversation.action.ts`
- `apps/main/actions/(main)/projects/projectv2-mock.action.ts`

**Steps.**
1. New util exporting `ConversationDetails` and
   `fetchConversation(conversationId)`, taking the best of both: the explicit API
   key check from the fork, `cache: 'no-store'` and the real type from the
   canonical, and a discriminated result.
2. Both callers use it. `getConversationDetails` becomes a thin wrapper so its
   existing callers do not move.
3. In `processProjectMockCompletion`, a failed fetch must NOT fall through to the
   completion write.

**Edge cases.**
- The util must **not** be `"use server"`. Exported async functions in such a
  module become public endpoints, and this one holds an API key.
- Return a discriminated union, not `{ success: boolean }`. A widened `boolean`
  stops TypeScript narrowing and callers lose `data` - the exact failure the
  cover-letter extractor hit during IP-4.
- Do not "fix" the canonical copy's non-null assertion on the key by throwing at
  module scope; the check belongs inside the call.
- Keep `duration` in SECONDS at the boundary. Both tables store seconds.

**Done when.** `grep -rn 'api.elevenlabs.io/v1/convai/conversations'` returns one
hit in `apps/main`, `tsc` passes, and a failed fetch in
`processProjectMockCompletion` returns an error instead of writing a completed
session.

**Verified 2026-08-28.** The grep returns exactly one hit
(`utils/elevenlabs/conversations.ts:94`); `apps/main` typechecks at 0 errors; the
failed-fetch path now returns `{ success: false, error }` before the write.

**A FOURTH defect turned up while doing it, and it is the biggest one.** The fork
read `process.env.ELEVENLABS_AI_KEY`. That variable is set NOWHERE - `.env`
defines `ELEVENLABS_API_KEY`, apps/worker reads `ELEVENLABS_API_KEY`, and the
working name outnumbers the misspelling 21 uses to 8. So
`processProjectMockCompletion` returned "ElevenLabs API not configured" on
**every call it ever received**. The path was not merely buggy, it was dead, which
is consistent with `project_v2_mock_session` holding zero rows.

And it was not alone. `ELEVENLABS_AI_KEY` was read by **three** files:

| File | Consequence |
|---|---|
| `projects/projectv2-mock.action.ts` | mock completion always "not configured" |
| `practice/practice/voice.action.ts` | `getApiKey()` threw on every call |
| `lib/elevenlabs-speech.ts` | transcription "not configured"; `isElevenLabsConfigured()` returned false forever |

All three now go through `elevenLabsKey()`, which reads `ELEVENLABS_API_KEY` and
falls back to the misspelling. The fallback is deliberate: both example env files
list BOTH names, so an environment may genuinely have only the old one set, and
asserting the second key was never wanted would be a guess. Both example files
now carry a note saying which to set.

**Not fixed here:** seven `: any` annotations remain in
`projectv2-mock.action.ts`, all in Drizzle query callbacks. That is `PF-B5` in
`srs/core-modules/pathfinder/01-blockers.md` and has its own task; fixing it here
would be widening the one in flight.

---

## MC-2 - Write the two-tables decision where it will be read

- [x] **Status:** done, verified 2026-08-28

**Why.** The next person to notice two mock session tables will assume it is an
accident and try to merge them. `overview.md` argues it is not, but nobody reads
a plan file while editing a schema.

**Files.** `packages/db/src/schema/mock.ts`, `packages/db/src/schema/projects.ts`

**Steps.** A short comment above each session table naming the other one, saying
what each holds that the other cannot, and pointing at
`plan/mock-consolidation/overview.md`.

**Edge cases.** Say what is SHARED as well as what differs, or the comment reads
as a justification rather than a boundary.

**Done when.** Both tables carry the note and each names the other.

**Verified 2026-08-28.** `mock_voice_session` in `schema/mock.ts` and
`project_v2_mock_session` in `schema/projects.ts` each carry a block naming the
other, listing what IS shared (the ElevenLabs lifecycle, via
`utils/elevenlabs/conversations.ts`) and what is not (scenario/price/rating on one
side, project/sprint/scores on the other), and both point at
`plan/mock-consolidation/overview.md`.

---

## MC-3 - `learnualScore` looks like a typo

- [ ] **Status:** not started

**Why.** `project_v2_mock_session.learnual_score` sits beside `technical_score`
and `communication_score`. "Learnual" is not a word; it is almost certainly
"learning". A column nobody can spell is a column nobody will query.

**It is worse than a typo.** The column's ONLY writer is
`projectv2-mock.action.ts:400`, and it sets it from
`feedback.problemSolving?.score`. So the column does not hold a learning score
under a misspelled name - it holds a **problem-solving** score under a name that
describes something else entirely. The right name is `problemSolvingScore` /
`problem_solving_score`.

**Attempted and reverted 2026-08-28, blocked on a TTY.** The rename is two lines
(the schema and the one write site) and the table has zero rows, so it is free
today. But `pnpm db:generate` cannot produce the migration here:

    Error: Interactive prompts require a TTY terminal

drizzle-kit has to ask whether this is a RENAME or a drop-and-add, and there is
no terminal to answer in. Hand-writing the `ALTER TABLE ... RENAME COLUMN` was
rejected: it would leave drizzle's snapshot in `drizzle/meta/` disagreeing with
the database, and the next `db:generate` would try to apply it again.

**Done when.** Niraj runs `pnpm db:generate` from `packages/db` interactively and
answers "renamed", after applying the two-line change:

    packages/db/src/schema/projects.ts:497   learnualScore -> problemSolvingScore
                                             "learnual_score" -> "problem_solving_score"
    apps/main/actions/(main)/projects/projectv2-mock.action.ts:400  same key
