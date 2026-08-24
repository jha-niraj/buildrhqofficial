import { getHiringDashboardStats } from "@/actions/hiring/hiring.action"
import { HiringOverviewClient, type DashboardStats } from "./_components/hiring-overview-client"

const EMPTY_STATS: DashboardStats = {
    totalCompanies: 0,
    verifiedCompanies: 0,
    pendingVerifications: 0,
    totalMembers: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingInvitations: 0,
}

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function HiringPlatformPage() {
    const result = await getHiringDashboardStats()
    const stats = result.success ? (result.data as DashboardStats) : EMPTY_STATS

    return <HiringOverviewClient stats={stats} />
}
