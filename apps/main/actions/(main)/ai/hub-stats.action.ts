"use server"

import { db, resumeDraft, coverLetter as coverLetters, jobInterviewAssistant, users } from "@repo/db"
import { count, eq } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"

/**
 * The numbers shown on the AI hub.
 *
 * ── These replace invented ones ──
 *
 * The hub shipped with "850+ Interviews Aced", "2.1K Systems Designed", "10K+ Active
 * Developers" and "99.9% Uptime". None of those were measured; they were written into a
 * `const stats` array by hand. The About page carried the same kind of thing and it was
 * removed for the same reason - a number nobody computed is a claim, and this one was on a
 * page asking the user to spend credits.
 *
 * ── Why per-user and not platform-wide ──
 *
 * A platform total on a signed-in tool page is either flattering and unverifiable, or honest
 * and discouraging ("3 interviews aced"). What a user actually wants to know here is where
 * THEIR work is: how many resumes they have, whether they have written a cover letter, what
 * they can still afford. Every one of these is a real row count for the calling user, and all
 * four are things they can click through to and verify.
 */

export interface AiHubStats {
    resumes: number
    coverLetters: number
    interviewPlans: number
    credits: number
}

export async function getAiHubStats(): Promise<AiHubStats> {
    const empty: AiHubStats = { resumes: 0, coverLetters: 0, interviewPlans: 0, credits: 0 }
    try {
        const session = await getSession(await headers())
        if (!session?.user?.id) return empty
        const userId = session.user.id

        // Four independent counts - run together rather than serialising four round trips.
        const [resumes, letters, plans, me] = await Promise.all([
            db.select({ n: count() }).from(resumeDraft).where(eq(resumeDraft.userId, userId)),
            db.select({ n: count() }).from(coverLetters).where(eq(coverLetters.userId, userId)),
            db.select({ n: count() }).from(jobInterviewAssistant).where(eq(jobInterviewAssistant.userId, userId)),
            db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1),
        ])

        return {
            resumes: resumes[0]?.n ?? 0,
            coverLetters: letters[0]?.n ?? 0,
            interviewPlans: plans[0]?.n ?? 0,
            credits: me[0]?.credits ?? 0,
        }
    } catch (error: unknown) {
        // Zeroes are honest here. A failed count must never fall back to a flattering
        // placeholder - that is how the invented numbers got there in the first place.
        console.error("[ai-hub] stats failed:", error)
        return empty
    }
}
