# Payments - tasks

Read `overview.md` first. It defines what settlement means and why there are two
paths to it.

## PAY-1 - Checkout opened on a white screen - DONE 2026-08-28

**Why.** Razorpay Checkout paints a full-viewport backdrop behind the payment
card, and on the layout this account is served that backdrop is #F5F5F5. Opening
it from the dark app flashed the entire screen near-white.

### Setting `theme.backdrop_color` does NOT fix this

That was the first attempt and it changed nothing, which is worth recording,
because the option is real, documented, and looks like the answer. Reading
`checkout.js` shows why - it builds its theme like this:

```js
theme: { ...options.theme, ...(Fr() ? { backdrop_color: 'rgba(245,245,245,1)' } : {}) }
```

The override is spread AFTER the caller's theme, so when that gate is true the
value we pass is discarded and replaced with near-white. Confirmed in the served
script: `backdrop_color` appears exactly twice, once as the default
`rgba(0,0,0,0.6)` and once as this override.

### What does work

Checkout injects `.razorpay-container > .razorpay-backdrop` into OUR document -
only the iframe inside it is cross-origin - and colours it with
`wt(e){ St.backdrop.style.background = e }`, an inline style. An author rule
marked `!important` beats an inline style, so the backdrop is now set from
`globals.css`, theme-aware off the `.dark` class on `<html>`.

`theme.backdrop_color` is kept in `PurchaseClient` as the correct value for any
layout that does honour it. The CSS is the lever that actually holds.

**Verified** by reproducing checkout's own assignment in the live page: create
`.razorpay-backdrop`, set `style.background = 'rgba(245,245,245,1)'`, read the
computed value back. Dark: `rgba(10, 10, 10, 0.94)`. Light: `rgba(38, 38, 38,
0.72)`. The inline write loses in both. The rule is present twice in the served
stylesheet.

Not confirmed visually in-session: the automation tab reports
`visibilityState: "hidden"`, and checkout refuses to open in a backgrounded tab
(`.razorpay-container` stays `display: none`), so there was nothing to screenshot.

**Also removed:** the `rzp-open` class this file added to `<body>` in three
places. It never had a CSS rule anywhere in the repo, so it did nothing.

## PAY-2 - Closing checkout was not recorded - DONE 2026-08-28

**Why.** `create-order` writes a `PENDING` payments row before checkout opens, so
an attempt always exists. But `modal.ondismiss` only reset local UI state and
`payment.failed` only raised a toast - neither told the server anything. The row
stayed `PENDING` for ever, and in the admin payments table an attempt abandoned
three weeks ago was indistinguishable from one happening right now.

New `POST /api/payments/attempt` moves a row PENDING -> CANCELLED or FAILED.

**It is deliberately the weakest endpoint in the module.** It is driven by a
client the user controls, so it can only reach states that grant nothing. Its
`WHERE` is scoped three ways: the caller's own `userId` (one user cannot cancel
another's checkout), the order id, and `status='PENDING'` - which is what makes a
late-arriving dismiss harmless, because if the webhook already settled the order
the update matches nothing instead of overwriting a paid payment as cancelled.

Called with `keepalive: true`: the commonest caller is `ondismiss`, and someone
who closes checkout often closes the tab in the same breath, which would abandon
a normal fetch - precisely the case this exists to record.

## PAY-3 - There was no webhook at all - DONE 2026-08-28

**Why this was the serious one.** Settlement happened only in the browser, in
Checkout's `handler`. That runs only if the tab is still alive when Razorpay
hands control back. Often it is not: the user closes the tab on the success
screen, the phone locks during a UPI handoff, the network drops. In every one of
those the money is captured and the credits are **never granted**, and nothing
in the system knows. Only a support ticket would ever find it.

`POST /api/payments/webhook` handles `payment.captured`, `order.paid`,
`payment.failed`, `refund.created` and `refund.processed`.

**Three things it gets right that are easy to get wrong:**

1. **It verifies against the RAW body.** Re-serialising a parsed object changes
   key order and whitespace and the HMAC would never match.
2. **It compares with `timingSafeEqual`,** after a length check because that
   function throws on mismatched lengths. `===` leaks the signature bytewise.
3. **It refuses to run without `RAZORPAY_WEBHOOK_SECRET`** rather than falling
   through. A webhook that accepts anything when misconfigured is a free credit
   generator for whoever finds it.

### The idempotency guard, and why `verify` had to change too

In the normal case BOTH paths run for the same payment. `db` is neon-http with
no transactions, so the "read status, then write" that `verify` used was a real
race: both readers see `PENDING`, both write `COMPLETED`, the user is credited
twice.

Both now claim the row with a single conditional update:

```sql
UPDATE payment SET status='COMPLETED' WHERE id=? AND status='PENDING'
```

Postgres serialises that per row, so exactly one racer gets a row back and only
that one grants. The loser returns success without granting, which is the
correct answer - the payment IS settled, just not by it.

Refunds use the same guard in the other direction (`COMPLETED` -> `REFUNDED`),
so a redelivered refund event cannot deduct twice. Credits are allowed to go
negative there on purpose: clamping at zero silently forgives a refund taken
after the credits were spent, and a negative balance is at least visible.

### The middleware bug this uncovered

CR-10 made the app deny-by-default. The matcher exempts `api/auth` and
`api/webhooks` - but the new route is `api/payments/webhook`, so an
unauthenticated Razorpay POST was redirected to `/signin` with a 307. Razorpay
would have retried, given up, and the webhook would have been silently dead on
arrival. `/api/payments/webhook` is now in the middleware pass-through list; it
authenticates by HMAC, and a session there would be meaningless.

### Verified end to end

With a local secret and a synthetic PENDING row:

| Case | Result |
|---|---|
| Missing signature | 400 |
| Wrong signature | 400 |
| Valid signature | 200 |
| Valid signature, body tampered after signing | 400 |
| Three deliveries of the same `payment.captured` | status COMPLETED, **one** credit_transaction, balance +7 exactly |
| Unknown order id | 200, warns, grants nothing |

The test row, its transaction and the balance were all reverted afterwards.

## PAY-4 - Failed purchases were invisible to the user - DONE 2026-08-28

`GET /api/transactions` read only `credit_transaction`. A failed or abandoned
purchase never creates one, so the history panel could not answer "I tried to
pay and got nothing" - the exact question that sends someone to their history.

It now also returns FAILED, CANCELLED and REFUNDED payments, merged into one
list by time so a failure sits directly above the retry that succeeded.
COMPLETED is excluded on purpose: it already appears as its PURCHASE
transaction, and listing it twice reads as having been charged twice.

Attempt rows show no +/- figure - printing "0" beside real charges reads as a
charge of zero rather than as no charge at all. The money amount is shown muted
with the reason underneath.

## PAY-5 - Set the webhook up in the Razorpay dashboard - TODO (Niraj)

Code is done and tested; this is the dashboard half, and until it is done the
webhook path does not exist in production.

1. Razorpay dashboard -> Settings -> Webhooks -> Add New Webhook.
2. URL: `https://www.shipithq.com/api/payments/webhook`.
3. Subscribe: `payment.captured`, `order.paid`, `payment.failed`,
   `refund.created`, `refund.processed`.
4. Copy the signing secret into `RAZORPAY_WEBHOOK_SECRET` in
   `apps/main/.env.production`, then `cd apps/main && pnpm release`.

`apps/main/.env` currently holds a local placeholder for that key so the route
could be tested. **It must be replaced with the dashboard value** - the local one
will fail signature verification against real deliveries.

**Done when.** A test payment made in the dashboard's test mode arrives, the row
reaches COMPLETED, and exactly one credit_transaction exists for it.

## PAY-6 - Sweep stale PENDING rows - TODO

A row can still stall at PENDING if the user's browser dies before `ondismiss`
fires AND no webhook arrives (an order created but never attempted). Razorpay
sends nothing for an order that was never paid, so nothing will ever resolve it.

A scheduled pass should mark PENDING rows older than a day as CANCELLED, after
checking their real status via the Razorpay orders API rather than assuming.

Not urgent: there are 0 such rows today, and PAY-2 removes the common cause.

## PAY-7 - Refreshing during checkout left the row PENDING - DONE 2026-08-28

**Why.** `ondismiss` fires when the user closes the modal. It does NOT fire when
the document goes away underneath it - a refresh, a back navigation, closing the
tab. Those cases left the payments row at PENDING for ever, which is the same
hole PAY-2 was written to close, reached by a different door.

A `pagehide` listener now reports the open order as CANCELLED.

- **`pagehide`, not `beforeunload`.** `beforeunload` is unreliable on mobile,
  where a tab is often discarded without firing it, and using it disqualifies
  the page from the back/forward cache. `pagehide` covers both.
- **`sendBeacon`, not `fetch`.** It is the only transport the browser undertakes
  to deliver after the document is gone. It needs an explicit `Blob` type,
  because its default is `text/plain` and the route parses JSON. `fetch` with
  `keepalive` remains the fallback.
- **An `openOrder` ref** holds the order whose checkout is open, and every path
  that already reports an outcome clears it. It is cleared BEFORE verifying, not
  after: the redirect to `/purchase/success` fires `pagehide`, and a stale ref
  there would report a payment just taken as abandoned.

### This exposed a money bug in the settlement guard

Reporting an abandonment on unload creates an ordering the old code could not
survive: the user refreshes mid-payment, the browser reports CANCELLED, and only
THEN does Razorpay deliver `payment.captured`.

`settle` claimed the row `WHERE status='PENDING'`. Against a CANCELLED row that
matches nothing - so the capture would have been dropped, and **a purchase the
user actually paid for would never have granted its credits.** The same clause
was in `verify`.

Both now claim from `PENDING`, `CANCELLED` or `FAILED`. Only `COMPLETED` and
`REFUNDED` are terminal for settlement. The reasoning is worth keeping: the
client's CANCELLED is a *guess* about what the user did, while a capture event is
Razorpay stating the money moved. The second always wins.

**Verified:** a row seeded as CANCELLED, then a signed `payment.captured`
delivered against it -> status COMPLETED, exactly 1 credit_transaction, balance
+9. Reverted afterwards.

## PAY-8 - Split usage from purchases in the history panel - DONE 2026-08-28

One merged list answered neither of the two questions people actually bring to
it: "where did my credits go" is a list of spends, "what have I paid for" is a
list of money. Three tabs now:

| Tab | Holds |
|---|---|
| Usage | SPEND, BONUS, REWARD - credits spent, and grants that were not bought |
| Purchases | PURCHASE transactions, plus FAILED / CANCELLED / REFUNDED attempts |
| Referrals | unchanged |

A failed attempt belongs under Purchases rather than Usage: it granted nothing,
so it is not usage, but it is very much part of the payment record.

The row markup was inline in the transactions tab. A second tab would have meant
a second copy, and the first divergence between them would have been a bug
invisible from either site alone - so it is now one `LedgerCard` rendered by
both. `?tab=purchases` deep-links to the new tab.

**Also:** the list scrolls in a real `ScrollArea` now. It was a bare
`overflow-y-auto`, which works but renders the OS scrollbar - a wide grey slab
in a 520px panel, and the only one in the app. The comment above it already
claimed a ScrollArea was there; now there is one. `min-h-0` beside `flex-1` is
load-bearing, and the bound must never go on the ScrollArea root as `max-h`:
Radix's viewport is `h-full`, which against an auto-height parent resolves to
auto and clips the overflow with no scrollbar to admit it.
