# Payments - what this module is when it is done

Razorpay is the only payment provider. A purchase is done when three things are
true together: Razorpay captured the money, the `payments` row says `COMPLETED`,
and a `credit_transaction` of type `PURCHASE` exists granting the credits. Any
state where one is true and another is not is a bug, and the module's job is to
make that state impossible to persist.

## The two paths, and why both are needed

**The browser path.** `create-order` inserts a `PENDING` payments row and returns
a Razorpay order id. Checkout opens; on success its `handler` posts to `verify`,
which checks the HMAC signature, re-fetches the payment from Razorpay, and only
then flips the row to `COMPLETED` and grants credits.

**The webhook path.** Razorpay posts to `/api/payments/webhook` server to server,
signed with the webhook secret. It does the same settlement.

Both exist because the browser path can be interrupted between the money moving
and `verify` being called - the tab is closed, the network drops, the phone
locks during a UPI handoff. The money is captured; without the webhook the
credits are simply never granted, and nothing in the system knows. That is a
silent loss of a paid-for good, and it is the single most important thing this
module prevents.

**They must be idempotent against each other,** because in the normal case BOTH
run for the same payment. Settlement is guarded on the row's own status: the
first writer to move it off `PENDING` wins, the second sees `COMPLETED` and
returns success without granting a second time.

## Every attempt is recorded

A payments row is written before checkout opens, so an attempt exists even if
the user never pays. Its status is the whole story:

| Status | Means |
|---|---|
| `PENDING` | Order created, outcome not yet known. Should be short-lived. |
| `COMPLETED` | Captured, credits granted. |
| `FAILED` | Razorpay declined it, or reported a non-captured status. |
| `CANCELLED` | The user closed checkout without paying. |
| `REFUNDED` | Refunded at Razorpay, credits clawed back. |

A `PENDING` row that never resolves is indistinguishable from one in flight,
which is why closing checkout must write `CANCELLED` rather than leaving it.
Admin filters this table by status, so an unresolved row is a support ticket
nobody can answer.

## What the user sees

Credits are earned and spent in `credit_transaction`; money moves in `payments`.
The history panel shows both, because "I paid and got nothing" is exactly the
question a ledger of successful grants cannot answer. A failed or cancelled
attempt appears there, marked as such, granting nothing.

## Decisions

- **Amounts are never trusted from the client.** The client sends `credits`; the
  price is looked up from `@repo/pricing` server-side, and re-verified against
  Razorpay's own record before credits are granted.
- **The webhook secret is separate from the API key secret.** It is its own
  dashboard value, `RAZORPAY_WEBHOOK_SECRET`, and the route must refuse to run
  without it rather than accepting unsigned posts.
