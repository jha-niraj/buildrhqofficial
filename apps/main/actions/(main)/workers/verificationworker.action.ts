"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { db, pathfinderGoals, pathfinderVerifications } from "@repo/db"
import { and, eq } from "drizzle-orm"
import { PATHFINDER_CREDITS } from "@/lib/constants/pricing"
import { startBackgroundJob, getBackgroundJobStatus } from "./jobs.action"

// ─────────────────────────────────────────────────────────────────────────────
// Pathfinder verification generation, dispatched to the worker.
//
// The inline version called the OpenAI Assistants API and then polled it up to
// 90 times at one second apart - up to 90 seconds of blocking sleep inside a
// server action, which Cloudflare kills long before it finishes. The user had
// already been charged by then.
//
// Now: reserve credits, insert the job row, hand off to a Durable Object, return
// a jobId. The DO schedules an alarm and does the slow work off the request
// path, so closing the tab no longer loses a multi-week goal's verification.
//
// Everything below that is not pathfinder-specific now lives in `jobs.action.ts`
// and is shared with every other job type.
// ─────────────────────────────────────────────────────────────────────────────

export async function startVerificationGeneration(goalId: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
    code?: string
    required?: number
    available?: number
}> {
    try {
        const session = await getSession(await headers())
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
        })
        if (!goal) return { success: false, error: "Goal not found" }

        const fee = PATHFINDER_CREDITS.verificationFee

        const started = await startBackgroundJob(
            "verification_generation",
            { goalId },
            {
                cost: fee,
                reason: `Pathfinder Verification: ${goal.title}`,
                // One verification at a time per user: two would race two Durable
                // Objects at the same verification row, and charge twice.
                singleFlight: true,
            },
        )
        if (!started.success || !started.jobId) return started

        await db
            .update(pathfinderVerifications)
            .set({ verificationCreditsCharged: fee })
            .where(eq(pathfinderVerifications.goalId, goalId))

        return { success: true, jobId: started.jobId }
    } catch (error: unknown) {
        console.error("[pathfinder] startVerificationGeneration failed:", error)
        return { success: false, error: "Failed to start verification generation" }
    }
}

/**
 * Poll a verification job.
 *
 * The credit hold is settled or released by `getBackgroundJobStatus` the first
 * time it sees a terminal status; both are idempotent, so several tabs polling
 * the same job is harmless.
 */
export async function getVerificationJobStatus(jobId: string): Promise<{
    success: boolean
    status?: string
    progress?: number
    phaseLabel?: string
    done?: boolean
    error?: string
}> {
    const res = await getBackgroundJobStatus(jobId)
    if (!res.success) return { success: false, error: res.error }

    return {
        success: true,
        status: res.status,
        progress: res.progress,
        phaseLabel: res.phaseLabel,
        done: res.done,
        error: res.status === "failed" ? `${res.error ?? "Generation failed"}. Your credits have been refunded.` : undefined,
    }
}
