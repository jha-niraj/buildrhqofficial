"use client"

import { useEffect } from "react"
import { Shield, UserPlus, Settings } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@repo/ui/components/ui/sonner"
import { isSuperAdminRole, formatAdminRole } from "@/lib/role-labels"

export interface Admin {
    id: string
    name: string | null
    email: string
    role: string
    status: string
    lastLoginAt: Date | null
    createdAt: Date
}

export function AdminsClient({
    initialAdmins,
    loadError,
}: {
    initialAdmins: Admin[]
    loadError: string | null | undefined
}) {
    useEffect(() => {
        if (loadError) toast.error(loadError || "Failed to load admins")
    }, [loadError])

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-7 h-7" />
                        Team
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {initialAdmins.length} active {initialAdmins.length === 1 ? "administrator" : "administrators"}
                    </p>
                </div>
                <Link
                    href="/admins/invitations"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Admin
                </Link>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {initialAdmins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Shield className="w-12 h-12 text-neutral-400 mb-4" />
                        <p className="text-neutral-500 dark:text-neutral-400">No admins found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                    <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Admin</th>
                                    <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                                    <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                    <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Last Login</th>
                                    <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Joined</th>
                                    <th className="text-left p-4 w-12"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialAdmins.map((admin) => (
                                    <tr
                                        key={admin.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                                                    <span className="text-white font-semibold">{(admin.name || admin.email || "A")[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{admin.name || "Unknown"}</p>
                                                    <p className="text-sm text-neutral-500">{admin.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                                isSuperAdminRole(admin.role)
                                                    ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white"
                                                    : "bg-neutral-50 dark:bg-neutral-200/10 text-neutral-800 dark:text-neutral-100",
                                            )}>
                                                <Shield className="w-3 h-3" />
                                                {formatAdminRole(admin.role)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                                admin.status === "ACTIVE"
                                                    ? "bg-neutral-50 dark:bg-neutral-200/10 text-neutral-800 dark:text-neutral-100"
                                                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400",
                                            )}>
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full mr-1.5",
                                                    admin.status === "ACTIVE" ? "bg-neutral-900" : "bg-neutral-400",
                                                )} />
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-neutral-500">
                                            {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}
                                        </td>
                                        <td className="p-4 text-sm text-neutral-500">
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href="/admins/access"
                                                title="Manage access"
                                                className="inline-flex p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-neutral-500" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
