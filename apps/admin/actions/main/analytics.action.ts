"use server"

import { db, users, feedbacks, payments, mockVoiceSession } from "@repo/db"
import { eq, gte, lte, and, count } from "drizzle-orm"
import { checkModuleAccess } from "@/lib/module-access"
import type { AdminResponse } from "@/types/admin"

interface DateRange {
    from?: Date
    to?: Date
}

/**
 * Turn a sparse `{ "YYYY-MM-DD": value }` map into a DENSE, ascending series -
 * one entry per day between `from` and `to`, with absent days filled as `0`.
 *
 * Why this exists (ADM-29). The grouped maps these actions build only contain
 * dates that had a row, and that is not a time series: rendered on an evenly
 * spaced axis, three sign-ups on the 1st, the 14th and the 30th draw as three
 * ADJACENT points - a steady trickle. The gaps, which are most of the month,
 * disappear. The shape of the line is wrong, not just its labels.
 *
 * It also settles ordering. `Object.entries` returns string keys in insertion
 * order, so the series inherited whatever order the query returned;
 * `getUserGrowthStats` sorts by `createdAt` and was fine, `getRevenueStats` has
 * no `orderBy` and could zig backwards in time. Generating the dates here rather
 * than reading them off the map makes that unrepresentable.
 *
 * Stepping is in UTC because the keys are UTC (`toISOString().split("T")[0]`).
 * Walking local days against UTC keys drops or duplicates a day at the boundary
 * in any non-zero offset - which is every timezone this product runs in.
 */
function denseDailySeries<K extends string>(
    grouped: Record<string, number>,
    from: Date,
    to: Date,
    key: K,
): Array<{ date: string } & Record<K, number>> {
    const out: Array<{ date: string } & Record<K, number>> = []

    // Normalise both ends to UTC midnight so the loop is a whole number of days
    // and the final day is always included.
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
    const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))

    // A guard, not a limit: a caller passing an inverted or absurd range should
    // get a short series rather than a loop that never ends.
    const MAX_DAYS = 366

    for (let i = 0; cursor <= last && i <= MAX_DAYS; i++) {
        const date = cursor.toISOString().split("T")[0] as string
        out.push({ date, [key]: grouped[date] ?? 0 } as { date: string } & Record<K, number>)
        cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return out
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

        // Dense and ascending - see `denseDailySeries`. A day with no sign-ups
        // is a `0`, not an absent entry, or the gaps vanish from the line.
        const chartData = denseDailySeries(dailyData, from, to, "count")

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

        // Dense and ascending. This one also FIXES the order: the payments query
        // has no `orderBy`, so the old insertion-ordered series could run
        // backwards through the month.
        const chartData = denseDailySeries(dailyRevenue, from, to, "amount")

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
