import { getAllTransactions } from "@/actions/main/credit.action"
import { TransactionsClient, type Transactions } from "./_components/transactions-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function CreditTransactionsPage() {
    const result = await getAllTransactions({ type: "all" }, { page: 1, limit: 20 })

    const initialTransactions: Transactions[] = result.success ? result.data.transactions : []
    const initialTotalPages = result.success ? result.data.pages || 1 : 1

    return (
        <TransactionsClient
            initialTransactions={initialTransactions}
            initialTotalPages={initialTotalPages}
            loadError={result.success ? null : result.error}
        />
    )
}
