"use server"

import { db, users, feedbacks, rewards } from "@repo/db"
import { eq, and, ilike, or, count, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { checkModuleAccess } from "@/lib/module-access"
import type { AdminResponse } from "@/types/admin"
import { logAdminAudit } from "@/lib/audit-log"

interface FeedbackFilters {
    search?: string
    category?: "all" | "BUG" | "FEATURE" | "UI" | "OTHER"
    status?: "all" | "UNDER_REVIEW" | "PLANNED" | "COMPLETED"
}

interface PaginationParams {
    page?: number
    limit?: number
}

// Get all feedback with filters and pagination
export async function getAllFeedback(
    filters?: FeedbackFilters,
    pagination?: PaginationParams
): Promise<AdminResponse<{
    feedback: Array<typeof feedbacks.$inferSelect & {
        user: { id: string; name: string | null; email: string; image: string | null } | undefined
        rewards: Array<{ credits: number; xp: number | null }>
    }>
    total: number
    pages: number
}>> {
    try {
        const accessCheck = await checkModuleAccess("feedback", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const page = pagination?.page || 1
        const limit = pagination?.limit || 20
        const offset = (page - 1) * limit

        const whereConditions = []

        if (filters?.search) {
            whereConditions.push(
                or(
                    ilike(feedbacks.title, `%${filters.search}%`),
                    ilike(feedbacks.description, `%${filters.search}%`)
                )
            )
        }

        if (filters?.category && filters.category !== "all") {
            whereConditions.push(eq(feedbacks.category, filters.category))
        }

        if (filters?.status && filters.status !== "all") {
            whereConditions.push(eq(feedbacks.status, filters.status))
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

        const [feedbackList, totalResult] = await Promise.all([
            db.query.feedbacks.findMany({
                where: whereClause,
                with: {
                    user: {
                        columns: { id: true, name: true, email: true, image: true }
                    }
                },
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                limit,
                offset
            }),
            db.select({ total: count() }).from(feedbacks).where(whereClause)
        ])
        const total = totalResult[0]?.total ?? 0

        // Attach rewards manually (feedbackId is unique in rewards)
        const feedbackWithRewards = await Promise.all(
            feedbackList.map(async (fb) => {
                const reward = await db.query.rewards.findFirst({
                    where: eq(rewards.feedbackId, fb.id)
                })
                return { ...fb, rewards: reward ? [reward] : [] }
            })
        )

        return {
            success: true,
            data: {
                feedback: feedbackWithRewards,
                total,
                pages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Get all feedback error:", error)
        return { success: false, error: "Failed to fetch feedback" }
    }
}

// Update feedback status
export async function updateFeedbackStatus(
    feedbackId: string,
    status: "UNDER_REVIEW" | "PLANNED" | "COMPLETED"
): Promise<AdminResponse<typeof feedbacks.$inferSelect | undefined>> {
    try {
        const accessCheck = await checkModuleAccess("feedback", "write")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.adminAccess

        const [feedback] = await db.update(feedbacks)
            .set({ status })
            .where(eq(feedbacks.id, feedbackId))
            .returning()

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "UPDATE",
            module: "feedback",
            resourceType: "Feedback",
            resourceId: feedbackId,
            description: `Updated feedback status to ${status}`,
        })

        revalidatePath("/feedback")

        return { success: true, data: feedback }
    } catch (error) {
        console.error("Update feedback status error:", error)
        return { success: false, error: "Failed to update feedback status" }
    }
}

// Assign reward to feedback
export async function assignReward(
    feedbackId: string,
    credits: number,
    xp?: number,
    description?: string
): Promise<AdminResponse<typeof rewards.$inferSelect>> {
    try {
        const accessCheck = await checkModuleAccess("feedback", "write")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.adminAccess

        const feedback = await db.query.feedbacks.findFirst({
            where: eq(feedbacks.id, feedbackId),
            with: { user: true }
        })

        if (!feedback) {
            return { success: false, error: "Feedback not found" }
        }

        // Check if reward already exists
        const existingReward = await db.query.rewards.findFirst({
            where: eq(rewards.feedbackId, feedbackId)
        })

        if (existingReward) {
            return { success: false, error: "Reward already assigned" }
        }

        // Create reward
        const rewardRows = await db.insert(rewards).values({
            feedbackId,
            type: "FEEDBACK",
            credits,
            xp: xp || 0,
            description: description || `Reward for feedback: ${feedback.user.name}`,
        }).returning()
        const reward = rewardRows[0]
        if (!reward) return { success: false, error: "Failed to create reward" }

        // Update user credits and XP
        await db.update(users)
            .set({
                credits: sql`${users.credits} + ${credits}`,
                currentXp: sql`${users.currentXp} + ${xp || 0}`
            })
            .where(eq(users.id, feedback.userId))

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "CREATE",
            module: "feedback",
            resourceType: "Reward",
            resourceId: reward.id,
            description: `Assigned reward: ${credits} credits${xp ? `, ${xp} XP` : ""} for feedback "${feedback.user.name}"`,
        })

        revalidatePath("/feedback")

        return { success: true, data: reward }
    } catch (error) {
        console.error("Assign reward error:", error)
        return { success: false, error: "Failed to assign reward" }
    }
}

// Delete feedback
export async function deleteFeedback(feedbackId: string): Promise<AdminResponse<null>> {
    try {
        const accessCheck = await checkModuleAccess("feedback", "delete")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.adminAccess

        const feedback = await db.query.feedbacks.findFirst({
            where: eq(feedbacks.id, feedbackId),
            with: { user: { columns: { name: true } } }
        })

        await db.delete(feedbacks).where(eq(feedbacks.id, feedbackId))

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "DELETE",
            module: "feedback",
            resourceType: "Feedback",
            resourceId: feedbackId,
            description: `Deleted feedback: ${feedback?.user?.name}`,
        })

        revalidatePath("/feedback")

        return { success: true, data: null }
    } catch (error) {
        console.error("Delete feedback error:", error)
        return { success: false, error: "Failed to delete feedback" }
    }
}

// Get feedback statistics
export async function getFeedbackStats(): Promise<AdminResponse<{
    total: number
    underReview: number
    planned: number
    completed: number
    bugs: number
    features: number
    verified: number
}>> {
    try {
        const accessCheck = await checkModuleAccess("feedback", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const [
            totalResult,
            underReviewResult,
            plannedResult,
            completedResult,
            bugsResult,
            featuresResult,
        ] = await Promise.all([
            db.select({ total: count() }).from(feedbacks),
            db.select({ underReview: count() }).from(feedbacks).where(eq(feedbacks.status, "UNDER_REVIEW")),
            db.select({ planned: count() }).from(feedbacks).where(eq(feedbacks.status, "PLANNED")),
            db.select({ completed: count() }).from(feedbacks).where(eq(feedbacks.status, "COMPLETED")),
            db.select({ bugs: count() }).from(feedbacks).where(eq(feedbacks.category, "BUG")),
            db.select({ features: count() }).from(feedbacks).where(eq(feedbacks.category, "FEATURE")),
        ])
        const total = totalResult[0]?.total ?? 0
        const underReview = underReviewResult[0]?.underReview ?? 0
        const planned = plannedResult[0]?.planned ?? 0
        const completed = completedResult[0]?.completed ?? 0
        const bugs = bugsResult[0]?.bugs ?? 0
        const features = featuresResult[0]?.features ?? 0

        return {
            success: true,
            data: {
                total,
                underReview,
                planned,
                completed,
                bugs,
                features,
                verified: 0,
            },
        }
    } catch (error) {
        console.error("Get feedback stats error:", error)
        return { success: false, error: "Failed to fetch feedback statistics" }
    }
}
