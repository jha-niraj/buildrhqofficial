import { getPendingInvitations } from "@/actions/admin.action"
import { InvitationsClient, type InvitationRow } from "./_components/invitations-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function InvitationsPage() {
    const res = await getPendingInvitations()

    const initialInvitations: InvitationRow[] = res.success
        ? res.data.map((inv) => ({
            id: inv.id,
            email: inv.email,
            name: inv.name,
            code: inv.code,
            adminRole: inv.adminRole,
            status: inv.status,
            expiresAt: inv.expiresAt,
        }))
        : []

    return <InvitationsClient initialInvitations={initialInvitations} loadError={res.success ? null : res.error} />
}
