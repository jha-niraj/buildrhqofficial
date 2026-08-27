"use client"

import { useEffect, useState } from "react"
import {
    Mail, Copy, Trash2, Plus, X, Check, Clock
} from "lucide-react"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Input } from '@repo/ui/components/ui/input'
import {
    getPendingInvitations, createAdminInvitation, revokeInvitation,
} from "@/actions/admin.action"
import { formatAdminRole } from "@/lib/role-labels"

type AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "FINANCE_ADMIN" | "COMMUNITY_ADMIN" | "MODULE_MANAGER" | "VIEWER"

export interface InvitationRow {
    id: string
    email: string
    name: string | null
    code: string
    adminRole: string
    status: string
    expiresAt: Date
}

function isExpired(inv: InvitationRow): boolean {
    return inv.status === "PENDING" && new Date(inv.expiresAt) < new Date()
}

export function InvitationsClient({
    initialInvitations,
    loadError,
}: {
    initialInvitations: InvitationRow[]
    loadError: string | null | undefined
}) {
    const [invitations, setInvitations] = useState<InvitationRow[]>(initialInvitations)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [role, setRole] = useState<AdminRole>("MODULE_MANAGER")
    const [origin, setOrigin] = useState("")

    useEffect(() => {
        setOrigin(window.location.origin)
        if (loadError) toast.error(loadError || "Failed to load invitations")
    }, [loadError])

    async function load() {
        const res = await getPendingInvitations()
        if (!res.success) {
            toast.error(res.error || "Failed to load invitations")
            return
        }
        setInvitations(res.data.map((inv) => ({
            id: inv.id,
            email: inv.email,
            name: inv.name,
            code: inv.code,
            adminRole: inv.adminRole,
            status: inv.status,
            expiresAt: inv.expiresAt,
        })))
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) {
            toast.error("Enter an email address")
            return
        }
        setCreating(true)
        const res = await createAdminInvitation({ email: email.trim().toLowerCase(), name: name.trim() || undefined, adminRole: role })
        setCreating(false)
        if (!res.success) {
            toast.error(res.error)
            return
        }
        toast.success(`Invitation sent to ${email}`)
        setEmail("")
        setName("")
        setRole("MODULE_MANAGER")
        setShowCreate(false)
        load()
    }

    async function handleRevoke(id: string) {
        if (!confirm("Revoke this invitation? The link will stop working immediately.")) return
        setRevokingId(id)
        const res = await revokeInvitation(id)
        setRevokingId(null)
        if (!res.success) {
            toast.error(res.error)
            return
        }
        toast.success("Invitation revoked")
        load()
    }

    function copyLink(code: string) {
        const link = `${origin}/join/${code}`
        navigator.clipboard.writeText(link)
        toast.success("Invitation link copied")
    }

    return (
        <div className="w-full p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <Mail className="w-6 h-6" />
                        Invitations
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Invite team members to the console. Only Super Admins can send invitations.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 transition-colors"
                >
                    {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showCreate ? "Cancel" : "New Invitation"}
                </button>
            </div>

            {showCreate && (
                <form
                    onSubmit={handleCreate}
                    className="mb-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="invite-email" className="mb-1.5 block">Email address</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@shipithq.com"
                                required
                                className="w-full px-4 py-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="invite-name" className="mb-1.5 block">Name (optional)</Label>
                            <Input
                                id="invite-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jane Doe"
                                className="w-full px-4 py-2 rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="mb-1.5 block">Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SUPER_ADMIN">Super Admin - full access</SelectItem>
                                <SelectItem value="MODULE_MANAGER">Team Member - access granted per module</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            A Team Member starts with no access. Grant modules from Access Control after they accept.
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 disabled:opacity-50 transition-colors"
                    >
                        {creating ? <InlineLoader size="sm" /> : <Mail className="w-4 h-4" />}
                        Send Invitation
                    </button>
                </form>
            )}

            {invitations.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    No pending invitations.
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {invitations.map((inv) => {
                        const expired = isExpired(inv)
                        return (
                            <div key={inv.id} className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* min-w-0 on the outer wrapper bounds this DIV's own
                                            width, but `<p>` is a flex item of THIS nested row
                                            (alongside the badge chips), so it needs its own
                                            min-w-0 too, or its default min-width:auto stops
                                            truncate from ever actually clipping - see
                                            docs/responsiveness.md section 2. */}
                                        <p className="min-w-0 flex-1 truncate font-medium text-neutral-900 dark:text-white">
                                            {inv.name || inv.email}
                                        </p>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full">
                                            {formatAdminRole(inv.adminRole)}
                                        </span>
                                        {expired && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Expired
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{inv.email}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => copyLink(inv.code)}
                                        disabled={expired}
                                        title="Copy invitation link"
                                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRevoke(inv.id)}
                                        disabled={revokingId === inv.id}
                                        title="Revoke invitation"
                                        className="p-2 rounded-lg text-neutral-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                                    >
                                        {revokingId === inv.id ? <InlineLoader size="sm" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="mt-6 flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-600">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>
                    Invitation links expire 7 days after creation. An invitee sets their own password when they accept -
                    the link itself is the credential, so treat a copied link like a password.
                </p>
            </div>
        </div>
    )
}
