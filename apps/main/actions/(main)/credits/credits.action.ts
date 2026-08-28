"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { db, users, creditTransactions, payments } from "@repo/db"
import { eq, desc } from "drizzle-orm"

/**
 * Everything the /credits page shows, in one round trip.
 *
 * Definition-of-done 2 in plan/credits/overview.md says every credit a user
 * holds has a ledger row explaining where it came from. Nothing in the product
 * SHOWED those rows: the balance was a number in the sidebar, a purchase was an
 * email, and the ledger was invisible. So "where did my credits go" had no
 * answer inside the product. See CR-11.
 */

export interface CreditLedgerRow {
    id: string
    amount: number
    type: string
    description: string
    createdAt: Date
}

export interface CreditPurchaseRow {
    id: string
    credits: number
    /**
     * A STRING, deliberately. `payments.amount` is `decimal(10,2)` and the
     * neon driver hands decimals back as strings to avoid float rounding.
     * Formatting it as a number is how "12.50" becomes "12.5".
     */
    amount: string
    currency: string
    status: string
    paymentId: string | null
    createdAt: Date
}

export interface CreditsOverview {
    balance: number
    /** Sum of SPEND rows, as a positive number. */
    totalSpent: number
    /** Sum of everything that added credits. */
    totalAdded: number
    purchases: CreditPurchaseRow[]
    ledger: CreditLedgerRow[]
}

export async function getCreditsOverview(): Promise<
    { success: true; data: CreditsOverview } | { success: false; error: string }
> {
    try {
        const session = await getSession(await headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }
        const userId = session.user.id

        // Three independent reads, together rather than one after another.
        const [userRows, purchaseRows, ledgerRows] = await Promise.all([
            db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1),
            db
                .select({
                    id: payments.id,
                    credits: payments.credits,
                    amount: payments.amount,
                    currency: payments.currency,
                    status: payments.status,
                    paymentId: payments.paymentId,
                    createdAt: payments.createdAt,
                })
                .from(payments)
                .where(eq(payments.userId, userId))
                .orderBy(desc(payments.createdAt)),
            db
                .select({
                    id: creditTransactions.id,
                    amount: creditTransactions.amount,
                    type: creditTransactions.type,
                    description: creditTransactions.description,
                    createdAt: creditTransactions.createdAt,
                })
                .from(creditTransactions)
                .where(eq(creditTransactions.userId, userId))
                .orderBy(desc(creditTransactions.createdAt)),
        ])

        // The AMOUNT carries the sign, not the type. Real rows look like
        // `SPEND -3` and `BONUS 10000`, so summing by `type` would have made
        // `totalSpent` negative and printed a minus in front of a minus.
        //
        // Splitting on the sign rather than on `type` is also the more robust
        // rule: a new transaction type cannot break the totals by not being
        // spelled "SPEND".
        let totalSpent = 0
        let totalAdded = 0
        for (const row of ledgerRows) {
            if (row.amount < 0) totalSpent += Math.abs(row.amount)
            else totalAdded += row.amount
        }

        return {
            success: true,
            data: {
                balance: userRows[0]?.credits ?? 0,
                totalSpent,
                totalAdded,
                purchases: purchaseRows,
                ledger: ledgerRows,
            },
        }
    } catch (error: unknown) {
        console.error("Error loading credits overview:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Could not load your credits",
        }
    }
}
