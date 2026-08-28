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

/** One row of the "usage by feature" table. */
export interface CreditFeatureUsage {
    /** Display name, derived from the ledger description. */
    feature: string
    /** How many times it was charged. */
    uses: number
    /** Net credits spent, after refunds. */
    credits: number
    /** Share of total spend, 0-100. */
    percent: number
}

/** One day of the trend: what went out, and what came in. */
export interface CreditSpendDay {
    /** ISO date, YYYY-MM-DD. */
    date: string
    /** Credits spent that day. */
    credits: number
    /** Credits added that day - top-ups, grants and rewards. */
    added: number
}

/**
 * Which feature a ledger row belongs to.
 *
 * DERIVED FROM THE DESCRIPTION, because there is nothing better. `credit_transaction`
 * records `type` (SPEND / BONUS / REWARD) and a free-text `description`, and no
 * column saying WHICH priced operation was charged. So the feature name is the
 * text before the first colon:
 *
 *     "Resume: ATS score against a job description"   -> Resume
 *     "Interview prep: Senior Backend Engineer"       -> Interview prep
 *
 * This is a parse, and parses rot. A row written with a different prefix lands
 * in its own bucket and nobody notices. The real fix is an `operation` column on
 * `credit_transaction` holding the `PricedOperation` key, which would also let
 * this join against `CREDIT_PRICES` instead of guessing. Raised as CR-14.
 */
function featureOf(description: string): string {
    // A refund names the thing it refunded: "Refund (failed): Resume: ...".
    // Strip the wrapper so the credits go back to the right feature rather than
    // creating a "Refund (failed)" bucket.
    const body = description.replace(/^Refund\s*\([^)]*\):\s*/i, "")
    const head = body.split(":")[0]?.trim()
    if (!head || head.length > 40) return "Other"
    return head
}

export interface CreditsOverview {
    balance: number
    /** Sum of SPEND rows, as a positive number. */
    totalSpent: number
    /** Sum of everything that added credits. */
    totalAdded: number
    purchases: CreditPurchaseRow[]
    ledger: CreditLedgerRow[]
    /** Spend grouped by feature, biggest first. */
    usage: CreditFeatureUsage[]
    /** Daily spend for the last 30 days, zero-filled. */
    trend: CreditSpendDay[]
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
        // A REFUND is not income and the thing it refunded is not spend. Counting
        // the refund in `totalAdded` and the original charge in `totalSpent`
        // makes both numbers larger than anything that happened - and it made the
        // header disagree with the usage table below, which nets refunds off:
        // "Total spent 28" over a table summing to 8.
        //
        // Both still reconcile against the balance either way
        // (added - spent = balance); this way the numbers also mean what they say.
        let totalSpent = 0
        let totalAdded = 0
        for (const row of ledgerRows) {
            const isRefund = /^Refund\b/i.test(row.description)
            if (row.amount < 0) totalSpent += Math.abs(row.amount)
            else if (isRefund) totalSpent -= row.amount
            else totalAdded += row.amount
        }
        // A refund arriving before its charge is recorded would drive this
        // negative for a moment. Never show a negative "spent".
        totalSpent = Math.max(0, totalSpent)

        // ── Usage by feature ────────────────────────────────────────────────
        // Refunds are netted OFF the feature they refunded rather than counted
        // as usage: a generation that failed and was refunded cost nothing, and
        // showing it as spend would overstate every feature that ever failed.
        const byFeature = new Map<string, { uses: number; credits: number }>()
        for (const row of ledgerRows) {
            const isSpend = row.amount < 0
            const isRefund = /^Refund\b/i.test(row.description)
            if (!isSpend && !isRefund) continue

            const key = featureOf(row.description)
            const entry = byFeature.get(key) ?? { uses: 0, credits: 0 }
            if (isSpend) {
                entry.uses += 1
                entry.credits += Math.abs(row.amount)
            } else {
                entry.credits -= row.amount
            }
            byFeature.set(key, entry)
        }

        const netSpend = [...byFeature.values()].reduce((a, e) => a + Math.max(0, e.credits), 0)
        const usage: CreditFeatureUsage[] = [...byFeature.entries()]
            .map(([feature, e]) => ({
                feature,
                uses: e.uses,
                credits: Math.max(0, e.credits),
                // Guard the divide: with no spend at all every row would be NaN%
                // and the bars would render at zero width with "NaN%" beside them.
                percent: netSpend > 0 ? (Math.max(0, e.credits) / netSpend) * 100 : 0,
            }))
            .filter((u) => u.uses > 0)
            .sort((a, b) => b.credits - a.credits)

        // ── Spend trend, zero-filled ────────────────────────────────────────
        // Days with no spend must be present as 0. Without them the chart joins
        // the last spend straight to the next one and draws a slope across a
        // week of inactivity, which reads as steady usage that never happened.
        const DAYS = 30
        const dayKey = (d: Date) => d.toISOString().slice(0, 10)
        const spendByDay = new Map<string, number>()
        const addedByDay = new Map<string, number>()
        for (const row of ledgerRows) {
            const k = dayKey(new Date(row.createdAt))
            if (row.amount < 0) {
                spendByDay.set(k, (spendByDay.get(k) ?? 0) + Math.abs(row.amount))
            } else if (!/^Refund\b/i.test(row.description)) {
                // Refunds are excluded from "added" for the same reason they are
                // netted off "spent": money returned is not money received.
                addedByDay.set(k, (addedByDay.get(k) ?? 0) + row.amount)
            }
        }
        const trend: CreditSpendDay[] = []
        const cursor = new Date()
        cursor.setUTCHours(0, 0, 0, 0)
        cursor.setUTCDate(cursor.getUTCDate() - (DAYS - 1))
        for (let i = 0; i < DAYS; i++) {
            const k = dayKey(cursor)
            trend.push({
                date: k,
                credits: spendByDay.get(k) ?? 0,
                added: addedByDay.get(k) ?? 0,
            })
            cursor.setUTCDate(cursor.getUTCDate() + 1)
        }

        return {
            success: true,
            data: {
                balance: userRows[0]?.credits ?? 0,
                totalSpent,
                totalAdded,
                purchases: purchaseRows,
                ledger: ledgerRows,
                usage,
                trend,
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
