import { withTransaction, creditTransactions, users } from "@repo/db";
import { and, eq, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// A debit that cannot go negative.
//
// Thirteen call sites across the product did this:
//
//     const [user] = await db.select({ credits }).from(users).where(eq(id, userId))
//     if (user.credits < amount) return "Insufficient credits"
//     await db.update(users).set({ credits: sql`credits - ${amount}` })
//
// Read, decide, then write. Two requests that arrive together both pass the read
// - neither can see the other's write yet - and both debit. A user with one
// credit gets two generations and a balance of -1, and it is reachable with a
// double-click or two tabs, not a crafted attack.
//
// `hold.ts` already gets this right, and says why: the guard belongs in the SQL,
// not in the branch above it. This is the same guard for the flows that take a
// straight debit rather than a hold.
//
// WHAT THIS DOES NOT DO is refund. A hold (`withCredits`) is still the right tool
// for anything that charges and THEN does fallible work - it settles on success
// and refunds on failure. Use this only where the charge and the thing being paid
// for commit together, so there is nothing to refund.
// ─────────────────────────────────────────────────────────────────────────────

export type DebitResult =
    | { ok: true; remaining: number }
    | { ok: false; code: "INSUFFICIENT_CREDITS"; required: number; available: number };

interface DebitInput {
    userId: string;
    amount: number;
    /** Ledger description. Shown to the user in their transaction history. */
    description: string;
    /** Ledger currency. The column is an enum, so this is not a free string. */
    currency?: "INR" | "USD" | "EUR" | "GBP";
}

/**
 * Debit `amount`, or report that the balance was too low.
 *
 * The balance check and the write are ONE statement: the update only matches a
 * row that still has enough, so two concurrent calls cannot both win. The second
 * one updates zero rows and gets `ok: false` back.
 *
 * The ledger row is written in the same transaction as the balance change, so the
 * two can never disagree - a process death between them was previously enough to
 * leave a user debited with no record of why.
 */
export async function debitCredits(input: DebitInput): Promise<DebitResult> {
    const { userId, amount, description, currency = "INR" } = input;

    if (!Number.isInteger(amount) || amount <= 0) {
        return { ok: false, code: "INSUFFICIENT_CREDITS", required: amount, available: 0 };
    }

    return withTransaction(async (tx) => {
        // Guarded in SQL rather than by the branch above it. `returning` tells us
        // whether this call was the one that won.
        const debited = await tx
            .update(users)
            .set({ credits: sql`${users.credits} - ${amount}` })
            .where(and(eq(users.id, userId), sql`${users.credits} >= ${amount}`))
            .returning({ credits: users.credits });

        if (debited.length === 0) {
            const [current] = await tx
                .select({ credits: users.credits })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            return {
                ok: false as const,
                code: "INSUFFICIENT_CREDITS" as const,
                required: amount,
                available: current?.credits ?? 0,
            };
        }

        await tx.insert(creditTransactions).values({
            userId,
            // Negative: SPEND rows debit. Summing the ledger has to reconcile with
            // the balance, and a positive SPEND row makes it add instead.
            amount: -amount,
            type: "SPEND",
            currency,
            description,
        });

        return { ok: true as const, remaining: debited[0]!.credits };
    });
}

/** The message to show when `debitCredits` reports an empty balance. */
export function insufficientCreditsMessage(result: Extract<DebitResult, { ok: false }>): string {
    return `Insufficient credits. This needs ${result.required} credits and you have ${result.available}.`;
}
