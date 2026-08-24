import { getDashboardStats } from "@/actions/admin.action"
import { getHiringDashboardStats } from "@/actions/hiring/hiring.action"
import { getUniversityDashboardStats } from "@/actions/uni/uni.action"
import { getOverviewStats } from "@/actions/main/analytics.action"
import { DashboardClient, type AllStats } from "./_components/dashboard-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AdminDashboard() {
    const [mainRes, hiringRes, uniRes, overviewRes] = await Promise.all([
        getDashboardStats(),
        getHiringDashboardStats(),
        getUniversityDashboardStats(),
        getOverviewStats(),
    ])

    const stats: AllStats = {
        main: mainRes.success ? mainRes.data ?? null : null,
        hiring: hiringRes.success ? (hiringRes.data as AllStats["hiring"]) ?? null : null,
        uni: uniRes.success ? (uniRes.data as AllStats["uni"]) ?? null : null,
        overview: overviewRes.success ? overviewRes.data ?? null : null,
    }

    return <DashboardClient initialStats={stats} />
}
