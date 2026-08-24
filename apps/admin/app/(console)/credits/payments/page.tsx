import { getPayments } from "@/actions/main/credit.action"
import { PaymentsClient, type Payments } from "./_components/payments-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function CreditPaymentsPage() {
    const result = await getPayments({ status: "all" }, { page: 1, limit: 20 })

    const initialPayments: Payments[] = result.success ? result.data.payments : []
    const initialTotalPages = result.success ? result.data.pages || 1 : 1

    return (
        <PaymentsClient
            initialPayments={initialPayments}
            initialTotalPages={initialTotalPages}
            loadError={result.success ? null : result.error}
        />
    )
}
