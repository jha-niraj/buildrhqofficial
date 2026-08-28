import { getCreditsOverview } from "@/actions/(main)/credits/credits.action"
import { CreditsClient } from "./_components/credits-client"

export const metadata = {
    title: "Credits | ShipItHQ",
    description: "Your credit balance, purchases and full spending history.",
}

// The balance changes on every AI action, so this must never be served stale.
export const dynamic = "force-dynamic"

export default async function CreditsPage() {
    const result = await getCreditsOverview()

    // Middleware already gates this route (CR-10), so an unauthenticated request
    // never arrives here. A failure at this point is a real error, not a
    // redirect, and the client says so rather than showing an empty wallet -
    // "0 credits" when the query failed is the most alarming lie this page could
    // tell.
    return (
        <CreditsClient
            data={result.success ? result.data : null}
            error={result.success ? null : result.error}
        />
    )
}
