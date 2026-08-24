import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/actions/admin.action"
import { ProfileClient } from "./_components/profile-client"

/**
 * Server component (ADM-8) - loads on the server so `loading.tsx`'s skeleton
 * is what a slow load actually shows, instead of flashing once and handing
 * off to a client-side spinner. The interactive half (password form,
 * permissions grid) lives in _components/profile-client.tsx.
 */
export default async function AdminProfilePage() {
    const res = await getCurrentAdmin()

    // getCurrentAdmin() only fails this way if the session/admin_access check
    // in it fails - which app/(console)/layout.tsx already guaranteed passes
    // before this page can render. Treated as impossible rather than given a
    // page-level error state for a condition that can't occur.
    if (!res.success) redirect("/")

    return (
        <ProfileClient
            admin={{
                name: res.data.user?.name ?? null,
                email: res.data.user?.email ?? "",
                role: res.data.adminRole,
                permissions: (res.data.permissions ?? {}) as Record<string, string[]>,
            }}
        />
    )
}
