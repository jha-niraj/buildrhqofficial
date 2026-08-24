import { getCreditRequests } from "@/actions/main/credit.action"
import { RequestsClient, type CreditRequests } from "./_components/requests-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function CreditRequestsPage() {
    const result = await getCreditRequests("PENDING", { page: 1, limit: 20 })

    const initialRequests: CreditRequests[] = result.success ? result.data.requests : []
    const initialTotalPages = result.success ? result.data.pages || 1 : 1

    return (
        <RequestsClient
            initialRequests={initialRequests}
            initialTotalPages={initialTotalPages}
            loadError={result.success ? null : result.error}
        />
    )
}
