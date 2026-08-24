import { getDatabaseStats, getSystemHealth } from "@/actions/system.action"
import { DatabaseClient } from "./_components/database-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function DatabaseHealthPage() {
    const [statsResult, healthResult] = await Promise.all([getDatabaseStats(), getSystemHealth()])

    return (
        <DatabaseClient
            initialStats={statsResult.success ? statsResult.data : undefined}
            initialHealth={healthResult.success ? healthResult.data : undefined}
        />
    )
}
