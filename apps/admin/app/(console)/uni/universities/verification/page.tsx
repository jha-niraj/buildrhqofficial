import { getPendingUniversityVerifications, getUniversityDashboardStats } from "@/actions/uni/uni.action"
import { VerificationClient, type University, type Stats } from "./_components/verification-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function UniversityVerificationPage() {
    const [universitiesRes, statsRes] = await Promise.all([
        getPendingUniversityVerifications(),
        getUniversityDashboardStats(),
    ])

    const initialUniversities: University[] = universitiesRes.success ? (universitiesRes.data as unknown as University[]) : []
    const initialStats: Stats = statsRes.success
        ? {
            pending: statsRes.data.pendingVerifications,
            verified: statsRes.data.verifiedUniversities,
            rejected: statsRes.data.rejectedVerifications,
        }
        : { pending: 0, verified: 0, rejected: 0 }

    return <VerificationClient initialUniversities={initialUniversities} initialStats={initialStats} />
}
