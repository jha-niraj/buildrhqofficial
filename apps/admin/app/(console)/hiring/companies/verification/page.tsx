import { getPendingCompanyVerifications, getHiringDashboardStats } from "@/actions/hiring/hiring.action"
import { VerificationClient, type Company, type Stats } from "./_components/verification-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function CompanyVerificationPage() {
    const [companiesRes, statsRes] = await Promise.all([
        getPendingCompanyVerifications(),
        getHiringDashboardStats(),
    ])

    const initialCompanies: Company[] = companiesRes.success ? (companiesRes.data as unknown as Company[]) : []
    const initialStats: Stats = statsRes.success
        ? {
            pending: statsRes.data.pendingVerifications,
            verified: statsRes.data.verifiedCompanies,
            rejected: statsRes.data.rejectedVerifications,
        }
        : { pending: 0, verified: 0, rejected: 0 }

    return <VerificationClient initialCompanies={initialCompanies} initialStats={initialStats} />
}
