import { getAdminUsers } from "@/actions/admin.action"
import { AccessClient, type AdminRow, type Level } from "./_components/access-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern
 *  note. Interactive permission-toggling lives in _components/access-client. */
export default async function AdminAccessPage() {
    const res = await getAdminUsers()

    const admins: AdminRow[] = res.success
        ? res.data.map((a) => ({
            id: a.id,
            user: a.user,
            adminRole: a.adminRole,
            status: a.status,
            permissions: (a.permissions ?? {}) as Record<string, Level[]>,
        }))
        : []

    return <AccessClient initialAdmins={admins} loadError={res.success ? null : res.error} />
}
