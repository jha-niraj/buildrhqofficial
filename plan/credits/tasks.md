# Credits - tasks

Derived from `overview.md`. Every task names the definition-of-done line it
serves. Order is dependency order.

| ID | Task | Serves | Status |
|---|---|---|---|
| CR-1 | Central price table | 3 | done (2026-08-20) |
| CR-2 | Welcome grant: 100 credits, once, on the ledger | 1, 2 | done (2026-08-20) |
| CR-3 | Backfill ledger rows for existing users | 2 | done (2026-08-20) |
| CR-4 | Charge cover letter generation and questions | 4, 5, 7, 8 | done (2026-08-20) |
| CR-5 | Charge resume tailor and ATS score | 4, 5, 7, 8 | done (2026-08-20) |
| CR-6 | Charge resume imports | 4, 5, 7, 8 | done (2026-08-20) |
| CR-7 | Charge bullet polish (text and voice) | 4, 7 | void - feature deleted (2026-08-20) |
| CR-8 | Show price, balance and shortfall in the UI | 6 | done (2026-08-20) |
| CR-9 | Referral credits | - | not started (deferred, see overview) |

---

## CR-1 - Central price table

**Status:** done (2026-08-20)
**Serves:** definition-of-done 3

**Why.** Costs are scattered: `MOCK_CREDIT_COST = 30` in one action file,
`QUIZ_CREDIT_COST = 25` in another, `PRACTICE_SET_CREDIT_COST` in a types file.
Nobody can answer "what does the product charge for?" without grepping, and two
features that should cost the same drift apart.

**Files**
- new: `apps/main/lib/credits/pricing.ts`
- edit: `actions/(main)/projects/projectv2-mock.action.ts` (drop local const)
- edit: `actions/(main)/projects/projectv2-quiz.action.ts` (drop local const)
- edit: `types/assessment.ts` (re-export from pricing, keep the old names working)

**Steps**
1. One `CREDIT_PRICES` object keyed by operation, values from `overview.md`.
2. A `priceOf(op)` accessor so a typo is a type error, not a `0` charge.
3. Move the four existing constants in; keep their old exported names as
   aliases so no call site changes behaviour in the same commit as the move.

**Edge cases**
- **A price of `0` must mean free, not "unset".** `priceOf` returns a number, and
  callers skip the reserve entirely when it is `0` - reserving 0 credits is
  rejected by `reserveCredits` as an invalid amount, which would turn a free
  operation into a hard error.
- **Changing a price must not affect in-flight work.** Already safe: `credit_hold`
  stores the amount charged, and refunds read the hold, not the table.
- **`types/assessment.ts` is imported by client components.** The pricing module
  must stay free of server-only imports or it will break the client bundle.

**Done when**
`grep -rn "_CREDIT_COST\s*=" apps/main --include="*.ts"` returns only
`lib/credits/pricing.ts`, and `tsc --noEmit` passes in `apps/main`.

---

## CR-2 - Welcome grant: 100 credits, once, on the ledger

**Status:** done (2026-08-20)
**Serves:** definition-of-done 1, 2
**Blocks:** CR-3

**Why.** A new user's wallet shows 100 credits that nothing in the system can
account for. The number comes from a Postgres column default; there is no ledger
row, no grant event, and no way to tell a granted credit from a purchased one.
The ledger is currently empty for every user in the database.

**Files**
- edit: `packages/db/src/schema/schema.ts` - `users.credits` default `100` -> `0`
- new migration
- new: `apps/main/lib/credits/grant.ts` - `grantSignupCredits(userId)`
- edit: `apps/main/actions/(auth)/auth/signup.actions.ts` - call it in `finalizeSignup`

**Steps**
1. Drop the column default to `0`. The grant becomes the only source.
2. `grantSignupCredits` does the balance increment and the `credit_transaction`
   insert inside one `withTransaction`, keyed for idempotency.
3. Call it from `finalizeSignup`, before the welcome email.

**Edge cases**
- **`finalizeSignup` runs from two places** - the register page after OTP, and
  onboarding (the only pass for Google and magic-link users). It is already
  guarded by the `SIGNUP` activity row, but the grant must ALSO be independently
  idempotent: the activity row is written by `processReferral` /
  `createSignupActivity`, and if that path ever changes, an unguarded grant
  becomes a repeatable 100 credits.
- **Idempotency key.** Use `signup-${userId}` in `credit_hold`-style fashion, or a
  uniqueness check on the ledger. Chosen: a `credit_transaction` lookup for this
  user with the exact signup description, inside the transaction, because holds
  model spending and this is a grant.
- **Two concurrent calls.** Both the register page and onboarding can fire in the
  same second for a fast user. The check and the insert must be in ONE
  transaction, not a read-then-write across two awaits.
- **Existing users already hold credits** from the old column default. They must
  not be granted again - CR-3 backfills their ledger instead.
- **A failed grant must not fail signup.** Wrapped, logged, and the account still
  works. A user with 0 credits is recoverable; a user who cannot finish signup is
  not.
- **The 0-credit window.** Between better-auth inserting the row and
  `finalizeSignup` running, the balance is 0. That window is onboarding, where
  nothing is spendable. Verify no code path charges during onboarding.
- **`db.transaction()` throws** on the neon-http driver. Use `withTransaction`.

**Done when**
A new signup through each of the three paths (email+OTP, Google, magic link)
ends with `user.credits = 100` and exactly one `credit_transaction` row of type
`BONUS` describing the welcome grant. Running `finalizeSignup` a second time
changes neither.

---

## CR-3 - Backfill ledger rows for existing users

**Status:** done (2026-08-20)
**Serves:** definition-of-done 2
**Blocked by:** CR-2

**Why.** Three users hold credits (two at 100, one at 500) with zero ledger rows
between them. After CR-2 the invariant is "balance equals the sum of the ledger",
and these rows break it on day one.

**Files**
- new migration, data-only

**Steps**
One `INSERT ... SELECT` writing a single opening-balance row per user with a
non-zero balance and no existing ledger rows.

**Edge cases**
- **Must not run twice.** Guarded by `NOT EXISTS (SELECT 1 FROM credit_transaction
  WHERE user_id = ...)`, so re-running the migration is a no-op.
- **The 500-credit user** is not a 100-credit grant. The row records their actual
  balance as an opening balance, not a welcome grant - labelling it a grant would
  make the ledger lie.
- **Users with 0 credits** get no row. A zero balance needs no explanation.
- **Ordering.** Must run after CR-2's default change, or a user created between
  the two migrations gets 100 from the default and a backfill row for it.

**Done when**
```sql
SELECT u.id FROM "user" u
LEFT JOIN (SELECT user_id, sum(amount) s FROM credit_transaction GROUP BY user_id) t
  ON t.user_id = u.id
WHERE u.credits <> coalesce(t.s, 0);
```
returns zero rows.

---

## CR-4 - Charge cover letter generation and questions

**Status:** done (2026-08-20)
**Serves:** definition-of-done 4, 5, 7, 8

**Why.** Both call `gpt-4o` and cost real money; neither charges anything today.

**Files**
- edit: `apps/main/actions/(main)/ai/cover-letter.action.ts`

**Steps**
Wrap each in `reserveCredits` -> work -> `settleCredits` / `releaseCredits`,
following the documented shape in `lib/credits/hold.ts`.

**Edge cases**
- **A generation that returns empty content must refund.** The OpenAI call can
  succeed with `content: ""`. Delivering nothing and keeping the charge is the
  exact failure the hold system exists to prevent.
- **The DB write can fail after a successful generation.** The user got their
  letter in the response - settle, do not refund. Refunding delivered work makes
  the letter free on retry.
- **Double submit.** Two clicks on Generate are two distinct operations with
  distinct hold ids, so both charge. Guard in the UI (disable while pending) and
  accept it server-side; a shared hold id would be worse, silently returning the
  first letter for the second request.
- **Insufficient credits** must surface `required` and `available`, not a generic
  failure - the UI needs both to tell the user what to buy.
- **Regenerating over an existing draft** charges again. It is another model call.
- **The hold id must be unique per attempt** - `crypto.randomUUID()`, not the
  draft id, or a second generation on the same draft is silently free.

**Done when**
Generating a cover letter debits 15 and leaves a settled hold; forcing the OpenAI
call to throw leaves the balance unchanged and writes a refund row.

---

## CR-5 - Charge resume tailor and ATS score

**Status:** done (2026-08-20)
**Serves:** definition-of-done 4, 5, 7, 8

**Files**
- edit: `apps/main/actions/(main)/ai/resume-draft.action.ts`

**Edge cases**
- **`tailorResumeForJD` writes the draft in place.** If the model returns
  malformed `updatedContent`, the current code would persist `undefined` over a
  working resume. Validate before writing, refund and leave the draft untouched
  if it does not parse. Destroying the resume AND keeping the charge is the worst
  case in this module.
- **`scoreResumeAgainstJD` uses `JSON.parse` on model output** with no guard - a
  parse failure throws past the charge. It must refund.
- **A score of 0 is a valid score**, not a failure. Do not treat falsy as failed.
- **Both re-read the draft with an ownership check** already; keep it, and take
  the money only after ownership is confirmed - charging for someone else's
  draft id then failing is a refundable charge that never should have happened.

**Done when**
Tailoring debits 20 and scoring debits 5; a forced malformed model response
refunds and leaves the stored resume byte-identical.

---

## CR-6 - Charge resume imports

**Status:** done (2026-08-20)
**Serves:** definition-of-done 4, 5, 7, 8

**Files**
- edit: `apps/main/actions/(main)/ai/resume-import.action.ts`

**Edge cases**
- **Partial scrapes.** `importProfileAndCreateDraft` pulls LinkedIn, GitHub,
  Twitter and a portfolio, each best-effort. If every source fails it returns an
  error - that path must refund. If only some succeed, the model still ran:
  charge.
- **Exa or GitHub being down** is a failure the user did not cause. Refund.
- **The draft insert failing after a successful model call** - refund, because
  the user has nothing to show for it. This is the opposite call to CR-4's, and
  deliberately so: a cover letter is returned in the response and is useful on
  its own, an import that saves nothing leaves the user with an empty list.

**Done when**
An import debits 20 on success; an import where every source fails leaves the
balance unchanged.

---

## CR-7 - Charge bullet polish (text and voice)

**Status:** void (2026-08-20) - built, then deleted with the feature

Charging was implemented as described below, and then `resume-ai.action.ts` was
deleted as `CLN-4` in the same session: its only caller,
`experience-tab-form.tsx`, had already gone with `RES-8`, so bullet polish was
unreachable before the charge was ever added. The price was removed from
`lib/credits/pricing.ts` rather than left as config nothing reads.

Kept here rather than deleted because the edge cases below are the ones that
apply if bullet polish is ever re-wired into the resume editor.
**Serves:** definition-of-done 4, 7

**Files**
- edit: `apps/main/actions/(main)/ai/resume-ai.action.ts`

**Edge cases**
- **The voice path is two calls** - ElevenLabs transcription then the polish
  completion. One charge covers both; a transcription failure refunds before the
  second call is made.
- **These already return `{ success: false }` on a missing API key** rather than
  throwing. Reserve AFTER those guards, or a misconfigured environment charges
  users for work that was never attempted.
- **Called repeatedly while editing.** 3 credits is deliberately low; the UI
  should not auto-trigger it.

**Done when**
Polishing debits 3; an unconfigured `OPENAI_API_KEY` returns its error with the
balance untouched.

---

## CR-8 - Show price, balance and shortfall in the UI

**Status:** done (2026-08-20)
**Serves:** definition-of-done 6

**Why.** A button that silently costs 20 credits is a button users learn to fear.

**Files**
- edit: `app/(main)/ai/resume/_components/resume-editor.tsx`
- edit: `app/(main)/ai/resume/_components/cover-letter-client.tsx`
- edit: `app/(main)/ai/resume/_components/resume-hub.tsx`

**Steps**
Label each AI action with its cost, and on `INSUFFICIENT_CREDITS` show what was
needed, what they have, and a link to `/purchase`.

**Edge cases**
- **The price must come from the shared table**, not be typed into the label. A
  label that disagrees with the charge is worse than no label.
- **Balance goes stale** after a spend on a server-rendered page; refresh it after
  a successful charge rather than showing a number that is one operation behind.
- **A free operation shows no badge** at all, rather than "0 credits", which reads
  as broken.

**Done when**
Every AI button in the resume and cover letter surfaces shows its cost, and a
user with 5 credits attempting a 20-credit tailor sees "needs 20, you have 5"
and a route to buy.

---

## CR-9 - Referral credits

**Status:** not started - deferred

`processReferral` writes a `REFERRAL_BONUS` activity row and grants no credits.
Either the referrer should be paid in credits or the activity row is misleading.
Deferred: it is a decision about referral economics, not a bug. Raised
2026-08-20.
