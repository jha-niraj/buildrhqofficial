import { getAuditLogs } from "@/actions/admin.action"
import { AuditLogClient, type AuditLogRow } from "./_components/audit-log-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AuditLogPage() {
    const res = await getAuditLogs(1, 20, "all")

    const initialLogs: AuditLogRow[] = res.success ? res.data.logs : []
    const initialTotal = res.success ? res.data.total : 0
    const initialPages = res.success ? res.data.pages : 1

    return (
        <AuditLogClient
            initialLogs={initialLogs}
            initialTotal={initialTotal}
            initialPages={initialPages}
            loadError={res.success ? null : res.error}
        />
    )
}
