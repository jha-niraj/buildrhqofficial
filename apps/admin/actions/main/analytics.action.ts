"use server"

import { db, users, feedbacks, payments, mockVoiceSession } from "@repo/db"
import { eq, gte, lte, and, count } from "drizzle-orm"
import { checkModuleAccess } from "@/lib/module-access"
import type { AdminResponse } from "@/types/admin"

interface DateRange {
    from?: Date
    to?: Date
}

// Get overview statistics
export async function getOverviewStats(dateRange?: DateRange): Promise<AdminResponse<{
    totalUsers: number
    newUsers: number
    totalProjects: number
    totalCredits: number
    totalFeedback: number
    activeCommunities: number
    period: { from: string; to: string }
}>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const now = new Date()
        const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const to = dateRange?.to || now

        const [
            totalUsersResult,
            newUsersResult,
            totalFeedbackResult,
        ] = await Promise.all([
            db.select({ totalUsers: count() }).from(users),
            db.select({ newUsers: count() }).from(users).where(and(gte(users.createdAt, from), lte(users.createdAt, to))),
            db.select({ totalFeedback: count() }).from(feedbacks).where(and(gte(feedbacks.createdAt, from), lte(feedbacks.createdAt, to))),
        ])
        const totalUsers = totalUsersResult[0]?.totalUsers ?? 0
        const newUsers = newUsersResult[0]?.newUsers ?? 0
        const totalFeedback = totalFeedbackResult[0]?.totalFeedback ?? 0

        // Get total credits across users
        const allUsers = await db.query.users.findMany({ columns: { credits: true } })
        const totalCredits = allUsers.reduce((sum, u) => sum + (u.credits || 0), 0)

        return {
            success: true,
            data: {
                totalUsers,
                newUsers,
                totalProjects: 0, // communities/projectV2 not in Drizzle tables used here
                totalCredits,
                totalFeedback,
                activeCommunities: 0,
                period: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            },
        }
    } catch (error) {
        console.error("Get overview stats error:", error)
        return { success: false, error: "Failed to fetch overview statistics" }
    }
}

// Get user growth statistics
export async function getUserGrowthStats(dateRange?: DateRange): Promise<AdminResponse<{
    chartData: Array<{ date: string; count: number }>
    total: number
    period: { from: string; to: string }
}>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const now = new Date()
        const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const to = dateRange?.to || now

        // Get daily user registrations
        const usersInRange = await db.query.users.findMany({
            where: and(gte(users.createdAt, from), lte(users.createdAt, to)),
            columns: { createdAt: true },
            orderBy: (t, { asc }) => [asc(t.createdAt)]
        })

        // Group by date
        const dailyData: Record<string, number> = {}
        usersInRange.forEach(user => {
            const date = user.createdAt.toISOString().split("T")[0]
            if (date) {
                dailyData[date] = (dailyData[date] || 0) + 1
            }
        })

        const chartData = Object.entries(dailyData).map(([date, count]) => ({
            date,
            count,
        }))

        return {
            success: true,
            data: {
                chartData,
                total: usersInRange.length,
                period: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            },
        }
    } catch (error) {
        console.error("Get user growth stats error:", error)
        return { success: false, error: "Failed to fetch user growth statistics" }
    }
}

// Get engagement statistics
export async function getEngagementStats(dateRange?: DateRange): Promise<AdminResponse<{
    projectsStarted: number
    feedbackSubmitted: number
    communitiesJoined: number
    mocksCompleted: number
    period: { from: string; to: string }
}>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const now = new Date()
        const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const to = dateRange?.to || now

        const [
            feedbackSubmittedResult,
            mocksCompletedResult,
        ] = await Promise.all([
            db.select({ feedbackSubmitted: count() }).from(feedbacks).where(
                and(gte(feedbacks.createdAt, from), lte(feedbacks.createdAt, to))
            ),
            db.select({ mocksCompleted: count() }).from(mockVoiceSession).where(
                and(gte(mockVoiceSession.createdAt, from), lte(mockVoiceSession.createdAt, to))
            ),
        ])
        const feedbackSubmitted = feedbackSubmittedResult[0]?.feedbackSubmitted ?? 0
        const mocksCompleted = mocksCompletedResult[0]?.mocksCompleted ?? 0

        return {
            success: true,
            data: {
                projectsStarted: 0,
                feedbackSubmitted,
                communitiesJoined: 0,
                mocksCompleted,
                period: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            },
        }
    } catch (error) {
        console.error("Get engagement stats error:", error)
        return { success: false, error: "Failed to fetch engagement statistics" }
    }
}

// Get revenue statistics (from credit purchases)
export async function getRevenueStats(dateRange?: DateRange): Promise<AdminResponse<{
    chartData: Array<{ date: string; amount: number }>
    totalRevenue: number
    transactionCount: number
    averageValue: number
    period: { from: string; to: string }
}>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const now = new Date()
        const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const to = dateRange?.to || now

        const paymentRecords = await db.query.payments.findMany({
            where: and(
                gte(payments.createdAt, from),
                lte(payments.createdAt, to),
                eq(payments.status, "COMPLETED")
            ),
            columns: { amount: true, currency: true, createdAt: true }
        })

        // Group by date
        const dailyRevenue: Record<string, number> = {}
        let totalRevenue = 0

        paymentRecords.forEach(payment => {
            const date = payment.createdAt.toISOString().split("T")[0]
            const amount = payment.amount ? Number(payment.amount) : 0
            if (date) {
                dailyRevenue[date] = (dailyRevenue[date] || 0) + amount
            }
            totalRevenue += amount
        })

        const chartData = Object.entries(dailyRevenue).map(([date, amount]) => ({
            date,
            amount,
        }))

        return {
            success: true,
            data: {
                chartData,
                totalRevenue,
                transactionCount: paymentRecords.length,
                averageValue: paymentRecords.length > 0 ? totalRevenue / paymentRecords.length : 0,
                period: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            },
        }
    } catch (error) {
        console.error("Get revenue stats error:", error)
        return { success: false, error: "Failed to fetch revenue statistics" }
    }
}

// Get module usage statistics
export async function getModuleUsageStats(dateRange?: DateRange): Promise<AdminResponse<{
    modules: Array<{ name: string; count: number }>
    period: { from: string; to: string }
}>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const now = new Date()
        const from = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const to = dateRange?.to || now

        const [
            mocksCountResult,
        ] = await Promise.all([
            db.select({ mocksCount: count() }).from(mockVoiceSession).where(
                and(gte(mockVoiceSession.createdAt, from), lte(mockVoiceSession.createdAt, to))
            ),
        ])
        const mocksCount = mocksCountResult[0]?.mocksCount ?? 0

        return {
            success: true,
            data: {
                modules: [
                    { name: "Projects", count: 0 },
                    { name: "Mock Interviews", count: mocksCount },
                    { name: "Assessments", count: 0 },
                    { name: "Communities", count: 0 },
                    { name: "Learns", count: 0 },
                ],
                period: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
            },
        }
    } catch (error) {
        console.error("Get module usage stats error:", error)
        return { success: false, error: "Failed to fetch module usage statistics" }
    }
}

// Export analytics data
export async function exportAnalytics(
    type: "users" | "revenue" | "engagement",
    dateRange?: DateRange
): Promise<AdminResponse<string>> {
    try {
        const accessCheck = await checkModuleAccess("analytics", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        let csv = ""

        switch (type) {
            case "users": {
                const stats = await getUserGrowthStats(dateRange)
                if (stats.success && stats.data) {
                    csv = "Date,New Users\n"
                    stats.data.chartData.forEach((row) => {
                        csv += `${row.date},${row.count}\n`
                    })
                }
                break
            }
            case "revenue": {
                const stats = await getRevenueStats(dateRange)
                if (stats.success && stats.data) {
                    csv = "Date,Revenue\n"
                    stats.data.chartData.forEach((row) => {
                        csv += `${row.date},${row.amount}\n`
                    })
                }
                break
            }
            case "engagement": {
                const stats = await getEngagementStats(dateRange)
                if (stats.success && stats.data) {
                    csv = "Metric,Count\n"
                    csv += `Projects Started,${stats.data.projectsStarted}\n`
                    csv += `Feedback Submitted,${stats.data.feedbackSubmitted}\n`
                    csv += `Communities Joined,${stats.data.communitiesJoined}\n`
                    csv += `Mocks Completed,${stats.data.mocksCompleted}\n`
                }
                break
            }
        }

        return { success: true, data: csv }
    } catch (error) {
        console.error("Export analytics error:", error)
        return { success: false, error: "Failed to export analytics" }
    }
}
