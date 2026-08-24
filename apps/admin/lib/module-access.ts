import { db, adminAccess } from "@repo/db"
import { eq } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getEffectivePermissions, hasPermission, type AdminPermission, type AdminPermissions, type PermissionLevel } from "@/lib/navigation"

export type AdminAccessCheck =
    | { authorized: true; adminAccess: typeof adminAccess.$inferSelect }
    | { authorized: false; error: string }

/**
 * The one module-scoped access check for every admin action. Routes through
 * `getEffectivePermissions()`, not a raw `hasPermission()` call against the
 * stored jsonb - `hasPermission` alone has no idea SUPER_ADMIN exists, and a
 * SUPER_ADMIN's `permissions` column is typically `{}` (their access comes
 * from the role, not per-module grants).
 *
 * Was copy-pasted per action file (`system.action.ts`, then
 * `hiring.action.ts`/`uni.action.ts`) before this consolidation - and one of
 * those copies (`system.action.ts`'s) had silently dropped the
 * `status !== "ACTIVE"` check that the others kept, so a SUSPENDED admin
 * with a stored `system` grant could still call `updateSystemSetting` or
 * `clearCache`. One copy means one place for that kind of drift to happen.
 */
export async function checkModuleAccess(requiredModule: AdminPermission, requiredLevel: PermissionLevel): Promise<AdminAccessCheck> {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        return { authorized: false, error: "Not authenticated" }
    }

    const adminRecord = await db.query.adminAccess.findFirst({
        where: eq(adminAccess.userId, session.user.id),
    })

    if (!adminRecord || adminRecord.status !== "ACTIVE") {
        return { authorized: false, error: "Not authorized" }
    }

    const effective = getEffectivePermissions(adminRecord.adminRole, (adminRecord.permissions ?? {}) as AdminPermissions)
    if (!hasPermission(effective, requiredModule, requiredLevel)) {
        return { authorized: false, error: `You do not have ${requiredLevel} access to the ${requiredModule} module` }
    }

    return { authorized: true, adminAccess: adminRecord }
}

/**
 * Any active admin, regardless of per-module grants - for actions scoped to
 * the CALLING admin's own data (their notifications, their own password),
 * where a module permission check makes no sense: a TEAM_MEMBER with no
 * `system` grant still has notifications of their own to read.
 */
export async function requireAnyActiveAdmin(): Promise<AdminAccessCheck> {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        return { authorized: false, error: "Not authenticated" }
    }

    const adminRecord = await db.query.adminAccess.findFirst({
        where: eq(adminAccess.userId, session.user.id),
    })

    if (!adminRecord || adminRecord.status !== "ACTIVE") {
        return { authorized: false, error: "Not authorized" }
    }

    return { authorized: true, adminAccess: adminRecord }
}
