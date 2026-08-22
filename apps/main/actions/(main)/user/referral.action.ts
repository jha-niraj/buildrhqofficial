"use server"

import { db, users, referrals } from "@repo/db"
import { desc, eq } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { generateReferralCode } from "@/utils/referral"
import { absoluteUrl } from "@/lib/urls"
// From lib/, not declared here: this file is "use server", and such a module may export only
// async functions - every export becomes a callable endpoint, so a constant is a build error.
import { REFERRAL_XP, type ReferralSummary } from "@/lib/referrals"

/**
 * The read side of referrals.
 *
 * The write side has existed for a long time and works: `processReferral` in
 * `utils/referral.ts` is called from signup, inserts the `referral` row, awards the referrer
 * 300 XP and increments `users.referralCount`. What never existed was any way for a user to
 * SEE any of it - no code to share, no count, no list. So the feature ran silently and nobody
 * could use it on purpose.
 *
 * ── The code is minted lazily ──
 *
 * `users.referralCode` is nullable and older accounts have none, because the column was added
 * after they signed up. Rather than backfilling every row, a missing code is generated the
 * first time the user looks at this page. `generateReferralCode` already checks for
 * collisions, so this is safe to call concurrently - the worst case is a wasted candidate.
 */

export async function getMyReferrals(): Promise<
    { success: true; data: ReferralSummary } | { success: false; error: string }
> {
    try {
        const session = await getSession(await headers())
        if (!session?.user?.id) return { success: false, error: "Not signed in" }
        const userId = session.user.id

        const [me] = await db
            .select({ name: users.name, referralCode: users.referralCode })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!me) return { success: false, error: "User not found" }

        let code = me.referralCode
        if (!code) {
            code = await generateReferralCode(me.name || "dev")
            await db.update(users).set({ referralCode: code }).where(eq(users.id, userId))
        }

        // Joined to `users` so the list shows who, not just how many. Capped: this is a
        // summary panel, and somebody with 400 referrals does not need all of them here.
        const rows = await db
            .select({
                id: users.id,
                name: users.name,
                image: users.image,
                joinedAt: referrals.createdAt,
            })
            .from(referrals)
            .innerJoin(users, eq(users.id, referrals.referredUserId))
            .where(eq(referrals.referrerId, userId))
            .orderBy(desc(referrals.createdAt))
            .limit(50)

        return {
            success: true,
            data: {
                code,
                // Built from `absoluteUrl`, never `window.location.origin` - that is the author's
                // host, not the recipient's, and a referral link is by definition read
                // somewhere else.
                link: absoluteUrl(`/register?ref=${encodeURIComponent(code)}`),
                count: rows.length,
                xpEarned: rows.length * REFERRAL_XP,
                referred: rows,
            },
        }
    } catch (error: unknown) {
        console.error("[referrals] getMyReferrals failed:", error)
        return { success: false, error: "Could not load your referrals" }
    }
}
