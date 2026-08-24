import { getAdminUsers } from "@/actions/admin.action"
import { AdminsClient, type Admin } from "./_components/admins-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AdminManagementPage() {
    const res = await getAdminUsers()

    const admins: Admin[] = res.success
        ? res.data.map((a) => ({
            id: a.id,
            name: a.user?.name ?? null,
            email: a.user?.email ?? "",
            role: a.adminRole,
            status: a.status,
            lastLoginAt: a.lastLoginAt,
            createdAt: a.createdAt,
        }))
        : []

    return <AdminsClient initialAdmins={admins} loadError={res.success ? null : res.error} />
}
