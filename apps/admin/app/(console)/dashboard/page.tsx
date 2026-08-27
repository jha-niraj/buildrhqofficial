import { getDashboardStats } from "@/actions/admin.action"
import { getHiringDashboardStats } from "@/actions/hiring/hiring.action"
import { getUniversityDashboardStats } from "@/actions/uni/uni.action"
import { getOverviewStats, getUserGrowthStats, getRevenueStats } from "@/actions/main/analytics.action"
import { DashboardClient, type AllStats } from "./_components/dashboard-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AdminDashboard() {
    const [mainRes, hiringRes, uniRes, overviewRes, growthRes, revenueRes] = await Promise.all([
        getDashboardStats(),
        getHiringDashboardStats(),
        getUniversityDashboardStats(),
        getOverviewStats(),
        // The two series the dashboard charts (ADM-27). Both are real and
        // DB-derived; there is deliberately no hiring/university chart, because
        // neither module exposes a time series and a flat invented line would
        // imply measurement that does not exist.
        getUserGrowthStats(),
        getRevenueStats(),
    ])

    const stats: AllStats = {
        main: mainRes.success ? mainRes.data ?? null : null,
        hiring: hiringRes.success ? (hiringRes.data as AllStats["hiring"]) ?? null : null,
        uni: uniRes.success ? (uniRes.data as AllStats["uni"]) ?? null : null,
        overview: overviewRes.success ? overviewRes.data ?? null : null,
        // A failed or unauthorised fetch becomes an empty series, which the chart
        // renders as its own empty state. It must not become a zero-filled line -
        // that reads as "we measured, and it was nothing".
        userGrowth: growthRes.success ? growthRes.data?.chartData ?? [] : [],
        revenue: revenueRes.success ? revenueRes.data?.chartData ?? [] : [],
    }

    return <DashboardClient initialStats={stats} />
}
