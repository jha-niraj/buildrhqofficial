import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession } from "@repo/auth"
import { db, adminAccess } from "@repo/db"
import { eq } from "drizzle-orm"
import { LayoutClient } from "./_components/layout-client"
import type { AdminPermissions } from "@/lib/navigation"

/**
 * The real gate. `middleware.ts` only checks for a session COOKIE - and every
 * signed-in ShipItHQ user, not just an admin, holds one here, because
 * `@repo/auth` shares one `cookiePrefix` across every app. This is the layer
 * that actually asks "is this person an admin", on the server, before a single
 * byte of console UI renders. See plan/admin/tasks.md ADM-1.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession(headers())
    if (!session?.user?.id) redirect("/")

    const [access] = await db
        .select({
            adminRole: adminAccess.adminRole,
            status: adminAccess.status,
            permissions: adminAccess.permissions,
        })
        .from(adminAccess)
        .where(eq(adminAccess.userId, session.user.id))
        .limit(1)

    // No row, or a row that isn't ACTIVE (SUSPENDED / INACTIVE) - both send a
    // signed-in, non-admin (or no-longer-admin) session back to "/", which
    // renders its own "this account does not have console access" state rather
    // than looping back here.
    if (!access || access.status !== "ACTIVE") redirect("/")

    return (
        <LayoutClient
            adminRole={access.adminRole}
            permissions={(access.permissions ?? {}) as AdminPermissions}
            user={{ name: session.user.name ?? session.user.email, email: session.user.email, image: session.user.image ?? null }}
        >
            {children}
        </LayoutClient>
    )
}
