import { getCompanies } from "@/actions/hiring/hiring.action"
import { CompaniesClient, type Company, type Pagination } from "./_components/companies-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function HiringCompaniesPage() {
    const result = await getCompanies(1, 20)

    const initialCompanies: Company[] = result.success ? (result.data as unknown as Company[]) : []
    const initialPagination: Pagination = result.success && result.pagination
        ? result.pagination
        : { page: 1, limit: 20, total: 0, totalPages: 0 }

    return <CompaniesClient initialCompanies={initialCompanies} initialPagination={initialPagination} />
}
