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

---

## CR-10 - Signed-out visitors are inside the app

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 9

**Why.** A signed out user sees the full application: sidebar, Pathfinder,
Projects, AI Tools, KnowMe, Jobs. The sidebar says "Sign In" and "0 credits"
while the page behind it renders as though they were a member.

`middleware.ts:203` is the whole bug:

```ts
const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
```

`protectedRoutes` has **four** entries - `/home`, `/profile`, `/settings`,
`/transactions`. Everything else is public by omission rather than by decision.
There IS a list of intended public routes directly above it, `_publicRoutes`,
but the underscore says it all: nothing reads it. It is documentation of an
intent the code never implemented.

**This is a deny-by-default problem, not a missing-entry problem.** Adding
`/pathfinder` to the list fixes today's screenshot and leaves the next module to
ship exposed. The default has to flip.

**Files.** `apps/main/middleware.ts`

**Steps.**
1. Replace `protectedRoutes` with `PUBLIC_ROUTES` and invert the check:
   everything under the matcher requires a session unless it is public.
2. Public set: `/signin`, `/register`, `/forgotpassword`, `/resetpassword`,
   `/error`, and `/purchase`.
3. Keep the existing `callbackUrl` behaviour so the visitor returns to where
   they were headed after signing in.

**Edge cases.**
- **`/purchase` must stay public** and is the only in-app page that is. Someone
  has to be able to see what credits cost before they sign up. Its History and
  Bounty actions are NOT public - they move to `/credits` in CR-11.
- **Exact match versus prefix.** `/signin` must not open `/signin-anything`.
  Match the route exactly, or by prefix only where a subtree is genuinely public.
- The onboarding gate below must keep running for signed-in users. Flipping the
  default must not return early past it.
- `/` already redirects for signed-in users; signed-out it must reach the
  marketing site rather than bounce to `/signin`.
- The matcher already excludes `api/auth`, `api/webhooks`, `_next/*` and files
  with extensions. Do not widen it.

**Done when.** Signed out, `/pathfinder` `/projects` `/ai` `/knowme` `/jobs`
`/home` each redirect to `/signin?callbackUrl=...`; `/purchase` returns 200; and
signing in from that redirect lands back on the original path.

**Verified 2026-08-28**, with a cookie-less client:

    /pathfinder    307 -> /signin?callbackUrl=%2Fpathfinder
    /projects      307 -> /signin?callbackUrl=%2Fprojects
    /ai            307 -> /signin?callbackUrl=%2Fai
    /knowme        307 -> /signin?callbackUrl=%2Fknowme
    /jobs/browse   307 -> /signin?callbackUrl=%2Fjobs%2Fbrowse
    /home          307 -> /signin?callbackUrl=%2Fhome
    /transactions  307 -> /signin?callbackUrl=%2Ftransactions
    /purchase      200
    /signin        200

`_publicRoutes` is deleted. It listed twenty-three paths that were meant to be
public and was never read by anything - the underscore was the only honest thing
about it.

---

## CR-11 - A credits page

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 10
- **Blocked by:** CR-10 (it is a protected route)

**Why.** Definition-of-done 2 says every credit has a ledger row explaining
where it came from. Nothing SHOWS the user those rows. The balance is a number in
the sidebar, purchases are an email receipt, and the ledger is invisible - so
"where did my credits go" has no answer in the product.

`/transactions` exists and lists transactions, but it is reached from a History
button on the pricing page, which is the wrong home: pricing is for people who
have not paid yet.

**Files.**
- `apps/main/app/(main)/credits/page.tsx`, `loading.tsx`, `_components/` (new)
- `apps/main/lib/navigation.ts`
- `apps/main/app/(main)/purchase/_components/PurchaseClient.tsx`

**Steps.**
1. `/credits` with: the current balance, purchases (amount, credits, status,
   receipt), and the full ledger from `credit_transaction`.
2. Move the **History** button off `/purchase` and onto `/credits`.
3. Move **Bounty Program** onto `/credits` as well, and KEEP it on `/purchase` -
   Niraj, 2026-08-28: it is an offer, and the pricing page is where an offer
   belongs.
4. Add to navigation.

**Edge cases.**
- **A zero-row ledger is the common case today**, not an error. The empty state
  has to read as "no purchases yet", never as a spinner or a blank panel.
- `payments.amount` is `decimal(10,2)` and arrives from the driver as a STRING.
  Formatting it as a number without parsing prints `12.00` as `12`.
- Both `INR` and `USD` exist in `payments.currency`. Format per row, not per page.
- A `PENDING` payment is not a purchase yet. Show the status rather than counting
  it in a total.

**Done when.** `/credits` shows the balance, at least one purchase row with its
status and currency, and ledger rows; `/purchase` no longer has a History button
and still has Bounty; `pnpm check-nav` passes.

**Verified 2026-08-28.** `/credits` is gated (307 to `/signin?callbackUrl=%2Fcredits`
signed out), `/purchase` has no History button and keeps Bounty, and `check-nav`
passes at 36 paths. The History side panel and its drag-to-resize handling - 121
lines - went with it; `PurchaseClient` dropped from 852 to ~640 lines.

**Real data caught a bug the schema comment did not.** The action assumed SPEND
rows stored positive amounts with the sign implied by `type`. They do not: the
ledger holds `SPEND -3` and `SPEND -5`. Summing by type made `totalSpent`
negative, and the row would have rendered `--3`. Totals now split on the SIGN of
the amount rather than on `type`, which is also the more robust rule - a new
transaction type cannot break the arithmetic by not being spelled "SPEND".

---

## CR-12 - One FAQ list, shared

- [x] **Status:** done, verified 2026-08-28

**Why.** `/purchase` has no FAQ at all. `apps/web` has nine good ones in
`app/(home)/pricing/_components/pricing-faqs.ts`. Copying them into `apps/main`
would make a second copy that drifts - the exact failure that produced three
mock-interview implementations and three copies of the pathfinder category union.

**Files.**
- `packages/pricing/src/faqs.ts` (new)
- `apps/web/app/(home)/pricing/_components/pricing-faqs.ts`
- `apps/main` purchase page

**Steps.** Move the list into `@repo/pricing`, which `apps/main` already depends
on, and re-export from the web location so that page does not change. Extend to
around fourteen questions, covering what the current nine miss: refunds,
invoices, expiry, minimum purchase, what happens at zero.

**Edge cases.**
- `@repo/pricing` is imported by server and client code in three apps. Keep the
  file free of React and of anything Node-only.
- The web page feeds these into `faqSchema()` for rich results. The shape
  (`{ q, a }`) must not change or the structured data silently stops emitting.

**Done when.** Both apps render from the same array, `apps/web` and `apps/main`
typecheck, and the web page's FAQ JSON-LD still contains every question.

**Verified 2026-08-28.** Fifteen questions (was eight) in
`packages/pricing/src/faqs.ts`; `apps/web`, `apps/main` and `packages/pricing`
all typecheck at zero errors.

**Exposed as a SUBPATH export, `@repo/pricing/faqs`, and that detail is
load-bearing.** Re-exporting it from `index.ts` needed a relative import, and the
two toolchains disagree about how to write one: `tsc` under `moduleResolution:
node16` demands `./faqs.js`, and Next's bundler cannot resolve that because the
file is `.ts`. Satisfying tsc produced a clean typecheck and a **500 on
/purchase** - `Module not found: Can't resolve './faqs.js'`. A subpath export
means nothing imports it relatively and both tools are happy.

---

## CR-13 - Redesign the purchase page

- [x] **Status:** done, verified 2026-08-28
- **Blocked by:** CR-12

**Why.** Niraj, 2026-08-28: the page is "very bad". The specific problems, from
the screenshot:

- The custom-amount control is the loudest thing on the page: a full-width panel
  with the number set in roughly 72px type, above the packs it should be
  secondary to. Most people want a pack.
- Four trust badges (AES-256, <100ms, No Expiration, Refund Policy) sit above the
  fold, ahead of any price.
- No FAQ, so every question a buyer has goes unanswered on the page where they
  decide.

**The reference** is the ElevenLabs pricing page Niraj shared: a quiet row of
plan cards, each with its price and what it includes, and a long plain FAQ
accordion underneath. No hero, no badges, no gradients.

**Files.** `apps/main/app/(main)/purchase/_components/PurchaseClient.tsx` (852
lines today), `loading.tsx`

**Steps.**
1. Packs first, as a row of cards.
2. Custom amount becomes a compact control in the top right, not a hero panel.
3. FAQ accordion from CR-12 underneath.
4. Trust badges drop to a single quiet line near the button, or go.
5. Keep the currency toggle and the Bounty Program sheet.

**Edge cases.**
- **The skeleton must be rebuilt with the page.** `loading.tsx` is hand-matched
  to the current layout; leaving it produces exactly the reflow the rule in
  CLAUDE.md exists to prevent.
- Monochrome. The reference page is colourful; the palette here is not.
- The page is PUBLIC (CR-10). It must render for a signed-out visitor with no
  balance, and its buy action must send them to sign-in rather than failing.
- Razorpay checkout is loaded by the layout `<Script>`. Do not move the buy
  handler into a component that unmounts before the callback returns.

**Done when.** Packs are the first thing below the title, the custom control is
in the top right, the FAQ renders every question from `@repo/pricing`, the
skeleton matches, and a signed-out visitor can read the whole page.

**Verified 2026-08-28** by fetching `/purchase` with no cookies (200, 126KB) and
grepping the HTML:

    Frequently asked questions              present
    How does ShipItHQ pricing work          present
    What happens when I run out of credits  present
    Where can I see what I have spent       present
    Custom amount                           present
    Bounty Program                          present
    AES-256 Encryption                      absent   (trust badges removed)
    >History<                               absent   (moved to /credits)

`loading.tsx` was rewritten alongside it. It described the old hero-panel layout,
and leaving it would have produced exactly the reflow the rule in CLAUDE.md
exists to prevent - the skeleton drawing one page and the real thing replacing it
with another.

**Amended 2026-08-28 after review, two further changes.**

**1. The pack grid was a bento and should not have been.** `PricingBento` gave
the popular pack a wide `FeaturedCard` at `lg:col-span-5` and dealt the rest
3, 4, 4, 8 - five cards at four different widths, the last stretched across the
whole row. The eye had to re-learn the layout at every step and prices could not
be compared down a column. Every card is now identical in a uniform
`md:2 / xl:4` grid with `items-stretch`, and the popular pack is marked by a ring
and its badge rather than by being a different SIZE. `FeaturedCard` (97 lines) is
deleted - nothing rendered it any more.

This is SHARED: the marketing pricing page and the landing page render the same
component, and both get the same layout. `packages/ui`, `apps/web` and
`apps/main` all typecheck.

**2. The FAQ was fifteen full-width rounded pills**, which read as fifteen
buttons rather than one list. It is now two columns: a STICKY left rail carrying
the section title and its CTAs, and the questions scrolling against it on the
right, separated by rules rather than boxed one per card.

`lg:self-start` on the sticky rail is load-bearing and easy to miss - a grid item
stretches to the row height by default, and a stretched item has nowhere to
travel, so `sticky` silently does nothing.

**Amended again 2026-08-28. The sticky rail still did not stick**, and
`lg:self-start` was not the reason.

`PurchaseClient`'s ROOT carried `overflow-hidden`. An ancestor with
`overflow: hidden` becomes the containing block that `position: sticky` measures
against, and since that element does not scroll, the rail had nowhere to travel.
The class looked harmless, sat three hundred lines from the thing it broke, and
`position: sticky` computed correctly the whole time - which is what makes this
failure mode so hard to see. It was there to clip a grid background that is
`absolute inset-0` and therefore bounded by the root anyway.

Verified by walking the ancestor chain from the rail to the scrollport in the
live DOM: every level now reports `overflow: visible` with no transform.

Three other things went in with it:
- **`max-w-7xl` on the page.** At full width the pack cards stretched into a
  shape no price card wants, and the FAQ line length ran past comfortable
  reading.
- **The FAQ rows were pills because of the SHARED component**, not this page.
  `AccordionItem` in packages/ui defaults to
  `rounded-2xl bg-neutral-100 dark:bg-neutral-900`. Overridden here to a plain
  row with a rule and real padding (`px-4 py-5`).
- **Prices and credit counts now count up** when the currency toggles, via a new
  `@repo/ui/components/ui/count-up`. Flipping INR to USD replaced every number
  instantly, which reads as a glitch rather than as a change the user made. The
  currency SYMBOL is split off the digits so only the number animates, INR counts
  in whole rupees and USD to two places, and `prefers-reduced-motion` sets the
  final value immediately - a price someone cannot pin down is worse than no
  animation.

## CR-15 - Retire /transactions into the credits page - DONE 2026-08-28

**Why.** CR-11 gave `/credits` a History panel that mounts the same client the
`/transactions` route rendered, with the same two tabs. Two URLs for one view is
the state where they drift, and Niraj asked for the standalone one to go.

**What went.**

- `app/(main)/transactions/page.tsx` and its `loading.tsx`, deleted.
- `_components/TransactionsClient.tsx` moved to
  `app/(main)/credits/_components/transactions-panel.tsx`. It is not a route's
  private component any more, it is the credits panel, and a `_components`
  folder under a route with no `page.tsx` is a trap for the next reader.

**Five references had to move with it,** and only one of them was an import -
this is the part a delete gets wrong:

| Where | Was | Now |
|---|---|---|
| `credits-client.tsx` | `@/app/(main)/transactions/_components/...` | `./transactions-panel` |
| `PurchaseClient.tsx` | imported, never rendered | removed |
| `mainsidebar.tsx` | Referrals to `/transactions?tab=referrals` | `/credits?tab=referrals` |
| `app/robots.ts` | disallowed `/transactions/` | removed |
| `credits.action.ts` | `revalidatePath("/transactions")` | `revalidatePath("/credits")` |

**The deep link needed one more change.** `historyOpen` started `false`, so the
sidebar's Referrals entry would have opened `/credits` with the panel shut and
the link would look broken. It is now seeded from the URL in the `useState`
initialiser rather than an effect, so the panel is open on the first paint
instead of flicking open after it. `transactions-panel` already reads the same
`?tab` param for which tab to start on, so both halves of the link agree.

**Done when.** `tsc` clean, `check-nav` 36/36, zero references to the old path
anywhere in the repo, and both consumers recompiling with no errors. All four
verified.

### Left deliberately: the `embedded` prop

`transactions-panel` still branches on `embedded` in 26 places, and the `false`
branch - the standalone page's entrance animations and its full-page header - is
now unreachable, because the only caller passes `embedded`. Unwinding it is a
refactor of the whole component, not part of deleting a route, so it is logged
as CLN-48 rather than done half-way here.

## CR-16 - Buy goes straight to payment, and the packs animate - DONE 2026-08-28

**Why the sheet went.** Clicking Buy opened a "Confirm purchase" sheet headed
"Verify allocation before executing transaction", listing what the credits would
buy. Three things were wrong with it at once:

1. **The numbers were wrong.** Every row read `0-1 units` - Projects, AI Job
   Interview and Bug Hunter all showed the same useless range, so the panel that
   existed to tell you what you were getting told you nothing.
2. **One row advertised a feature as unavailable.** "Mock (Coming Soon) - 0
   units", on the screen where the user is about to pay. Mock ships today; the
   label was stale.
3. **It restated a decision already made.** The pack's contents are on the card
   the user just clicked. A confirmation step that repeats the offer less
   accurately than the page behind it is friction, not safety - there is nothing
   destructive to confirm, the payment provider has its own confirm step, and
   the amount is re-verified server-side when the order is created.

Buy now calls `initiatePayment` directly. The signed-out branch is kept exactly
as it was: it still routes to `/register?callbackUrl=<checkout path>` rather
than firing a toast, so the pack survives the round trip through sign-up.

The deep link from `apps/web` (`/purchase?plan=&credits=&currency=`) landed on
the same sheet and now goes straight to payment too. Clicking a pack on the
marketing site IS the decision; asking again on arrival was asking twice.

**`lib/credit-usage.ts` deleted** - 94 lines, and the sheet was its only
consumer. `computeUsageForCredits`, `creditUsageConfig` and `formatCountRange`
had no other caller anywhere in the repo.

### The packs had no entrance at all

`PricingBento` carried zero motion, on either the marketing site or in-app, so
the whole price grid arrived in one blink. Added:

- **Per-card entrance**, `whileInView` with `once: true` and a 70ms stagger, so
  the row reads left to right. `y: 16` deliberately small - with four across, a
  tall travel leaves the last card still climbing while the first has settled.
- **Hover lift** of 4px on a spring, replacing nothing (the card only had a
  border/shadow transition).
- **Section entrance** on the purchase page wrapper, so the grid arrives as one
  movement rather than five unrelated ones.

`whileInView` rather than `animate` throughout: the packs sit near the fold on a
long page, and an entrance that finished before you scrolled to it is the same
as no entrance.

Two details worth keeping:

- `useReducedMotion` skips both the entrance and the hover lift. A card that
  jumps under the cursor is precisely the motion that setting exists to disable.
- The card keeps `transition-colors` in CSS and gives only the lift to framer.
  Handing colour to framer as well would mean restating every `dark:` variant as
  a JS value.

**Done when.** `tsc` clean across `apps/{main,web}` and `packages/ui`; `/purchase`
200 with no compile errors; no reference anywhere to the sheet's state, its
helpers, or the deleted module; exactly one `<Sheet>` left in `PurchaseClient`,
the Bounty one. All verified.
