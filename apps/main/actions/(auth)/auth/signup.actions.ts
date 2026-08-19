"use server"

import { db, users, recentActivities } from "@repo/db"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { processReferral, createSignupActivity } from "@/utils/referral"
import { sendEmail } from "@/utils/mail"
import { grantSignupCredits } from "@/lib/credits/grant"

/**
 * Post-signup side effects that better-auth doesn't own.
 *
 * The account itself is created by better-auth (`signUp.email`, a social
 * callback, or a magic link) - this runs once afterwards, from the first
 * authenticated request, to credit the referrer, log the signup activity and
 * send the welcome mail.
 *
 * It MUST be idempotent, because more than one caller reaches it: the register
 * page runs it right after OTP verification, and onboarding runs it too (that's
 * the only pass for users who arrived via Google or a magic link and never
 * touched the register page). The SIGNUP activity row is the marker - both the
 * referred and non-referred paths write one, so checking it catches every case.
 * Keying off the `referrals` row instead would let a non-referred user log a
 * second signup and receive a second welcome email.
 *
 * `referralCode` is the `?ref=` the visitor arrived with, forwarded by the
 * register page after verification succeeds.
 */
export async function finalizeSignup(referralCode?: string | null): Promise<{ success: boolean }> {
	try {
		const session = await getSession(await headers())
		if (!session?.user?.id) return { success: false }

		const userId = session.user.id

		const [alreadyFinalized] = await db
			.select({ id: recentActivities.id })
			.from(recentActivities)
			.where(and(
				eq(recentActivities.userId, userId),
				eq(recentActivities.activityType, "SIGNUP"),
			))
			.limit(1)
		if (alreadyFinalized) return { success: true }

		const [user] = await db
			.select({ name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)
		if (!user) return { success: false }

		if (referralCode) {
			await processReferral(referralCode, userId, user.name || "a new developer")
		} else {
			await createSignupActivity(userId)
		}

		// The opening credit balance. Independently idempotent rather than relying
		// on the SIGNUP-activity guard above: that guard is written by
		// processReferral/createSignupActivity, and if either ever stops writing it
		// an unguarded grant here becomes a repeatable 100 credits.
		//
		// Best-effort, like the welcome mail below. A user sitting at 0 credits can
		// be granted later; a user who cannot finish signup cannot.
		const grant = await grantSignupCredits(userId)
		if (!grant.ok) {
			console.error("[signup] credit grant failed for", userId, "-", grant.error)
		}

		// Best-effort: a failed welcome email must not fail the signup.
		try {
			await sendEmail({ name: user.name || "", email: user.email, emailType: "WELCOME" })
		} catch (err) {
			console.error("[signup] welcome email failed:", err)
		}

		return { success: true }
	} catch (error) {
		console.error("finalizeSignup error:", error)
		return { success: false }
	}
}
