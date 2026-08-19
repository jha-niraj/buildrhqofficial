-- Data-only migration. Opening-balance ledger rows for users who held credits
-- before the ledger existed.
--
-- Until 0009 the "user".credits column defaulted to 100, so every account had a
-- balance that no credit_transaction row accounted for. From 0009 the balance is
-- only ever moved by code that writes a matching ledger row, which makes
-- "balance = sum(ledger)" an invariant - one these pre-existing rows would break
-- on day one.
--
-- Deliberately an OPENING BALANCE, not a welcome grant: one of these users holds
-- 500 credits, and labelling that a 100-credit signup grant would make the
-- ledger lie about where the other 400 came from.
--
-- Re-runnable. The NOT EXISTS guard makes a second run a no-op, and users with a
-- zero balance get no row - a zero balance needs no explanation.
INSERT INTO credit_transaction (id, user_id, amount, type, description, currency, created_at)
SELECT
    'backfill_' || u.id,
    u.id,
    u.credits,
    'BONUS',
    'Opening balance (recorded retroactively)',
    'INR',
    now()
FROM "user" u
WHERE u.credits > 0
  AND NOT EXISTS (
      SELECT 1 FROM credit_transaction ct WHERE ct.user_id = u.id
  );
