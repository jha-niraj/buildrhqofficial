import { getUniversities } from "@/actions/uni/uni.action"
import { UniversitiesClient, type University, type Pagination } from "./_components/universities-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function UniUniversitiesPage() {
    const result = await getUniversities(1, 20)

    const initialUniversities: University[] = result.success ? (result.data as unknown as University[]) : []
    const initialPagination: Pagination = result.success && result.pagination
        ? result.pagination
        : { page: 1, limit: 20, total: 0, totalPages: 0 }

    return <UniversitiesClient initialUniversities={initialUniversities} initialPagination={initialPagination} />
}
