"use client"

import { useState } from "react"
import { changeAdminPassword } from "@/actions/admin.action"
import { Shield, BadgeCheck, KeyRound, Mail } from "lucide-react"
import { toast } from "@repo/ui/components/ui/sonner"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { formatAdminRole } from "@/lib/role-labels"

interface ProfileAdmin {
    name: string | null
    email: string
    role: string
    permissions: Record<string, string[]>
}

function PermissionsGrid({ perms }: { perms: Record<string, string[]> }) {
    const modules = Object.keys(perms)
    if (modules.length === 0) {
        return <p className="text-sm text-neutral-500 dark:text-neutral-400">No permissions assigned.</p>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
                <div key={mod} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-900 dark:text-white capitalize">{mod.replace(/_/g, " ")}</span>
                        <BadgeCheck className="w-4 h-4 text-neutral-900 dark:text-white" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(perms[mod] || []).map((lvl) => (
                            <span key={lvl} className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {lvl}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ProfileClient({ admin }: { admin: ProfileAdmin }) {
    const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
    const [changing, setChanging] = useState(false)

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        if (!pwd.current || !pwd.next) return toast.error("Please fill all fields")
        if (pwd.next.length < 8) return toast.error("New password must be at least 8 characters")
        if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match")
        setChanging(true)
        const res = await changeAdminPassword(pwd.current, pwd.next)
        setChanging(false)
        if (res.success) {
            toast.success("Password changed successfully")
            setPwd({ current: "", next: "", confirm: "" })
        } else {
            toast.error(res.error || "Failed to change password")
        }
    }

    return (
        <div className="w-full p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                    <Shield className="w-7 h-7" />
                    My Admin Profile
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">View your admin details, permissions, and change your password.</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-xl font-bold">
                        {admin.name?.charAt(0) || "A"}
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-neutral-900 dark:text-white">{admin.name}</div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <Mail className="w-4 h-4" /> {admin.email}
                        </div>
                        <div className="mt-1 text-xs px-2 py-0.5 inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            Role: {formatAdminRole(admin.role)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Access Permissions</h2>
                <PermissionsGrid perms={admin.permissions} />
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <KeyRound className="w-5 h-5" /> Change Password
                </h2>
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Current password</Label>
                        <Input
                            type="password"
                            value={pwd.current}
                            onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            placeholder="Enter current password"
                            required
                        />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">New password</Label>
                        <Input
                            type="password"
                            value={pwd.next}
                            onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Confirm new password</Label>
                        <Input
                            type="password"
                            value={pwd.confirm}
                            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            placeholder="Re-enter new password"
                            required
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={changing}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 disabled:opacity-50"
                        >
                            {changing ? (<span className="flex items-center gap-2"><InlineLoader size="sm" /> Saving</span>) : "Change Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
