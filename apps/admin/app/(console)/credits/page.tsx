import { getAllTransactions, getCreditRequests, getCreditStats } from "@/actions/main/credit.action"
import { CreditsClient, type Transaction, type CreditRequest } from "./_components/credits-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function CreditsPage() {
    const [statsRes, transactionsRes, requestsRes] = await Promise.all([
        getCreditStats(),
        getAllTransactions({ type: undefined }, { page: 1, limit: 50 }),
        getCreditRequests("PENDING", { page: 1, limit: 10 }),
    ])

    const initialStats = statsRes.success
        ? statsRes.data
        : { totalCredits: 0, pendingRequests: 0, totalTransactions: 0, totalPayments: 0 }
    const initialTransactions: Transaction[] = transactionsRes.success ? transactionsRes.data.transactions : []
    const initialRequests: CreditRequest[] = requestsRes.success ? requestsRes.data.requests : []

    return (
        <CreditsClient
            initialStats={initialStats}
            initialTransactions={initialTransactions}
            initialRequests={initialRequests}
        />
    )
}
