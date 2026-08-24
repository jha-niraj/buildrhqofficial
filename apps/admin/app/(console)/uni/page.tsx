import { getUniversityDashboardStats } from "@/actions/uni/uni.action"
import { UniOverviewClient, type DashboardStats } from "./_components/uni-overview-client"

const EMPTY_STATS: DashboardStats = {
    totalUniversities: 0,
    verifiedUniversities: 0,
    pendingVerifications: 0,
    rejectedVerifications: 0,
    totalDepartments: 0,
    totalFaculty: 0,
    totalStudents: 0,
    verifiedStudents: 0,
    totalClasses: 0,
    totalCreditsAllocated: 0,
}

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function UniversityPlatformPage() {
    const result = await getUniversityDashboardStats()
    const stats = result.success ? (result.data as DashboardStats) : EMPTY_STATS

    return <UniOverviewClient stats={stats} />
}
