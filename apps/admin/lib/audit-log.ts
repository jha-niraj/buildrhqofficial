import { db, adminAuditLogs } from "@repo/db"

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "ERROR" | "VIEW"

interface AuditLogInput {
    adminId: string
    action: AuditAction
    module: string
    resourceType?: string
    resourceId?: string
    description?: string
    changes?: unknown
    metadata?: unknown
}

/**
 * Writes one `admin_audit_log` row. Swallows its own failure - an audit
 * write failing must never fail the mutation it describes - and logs to the
 * server console instead so a broken write is still visible.
 */
export async function logAdminAudit(input: AuditLogInput): Promise<void> {
    try {
        await db.insert(adminAuditLogs).values(input)
    } catch (error: unknown) {
        console.error("Audit log write failed:", error)
    }
}
