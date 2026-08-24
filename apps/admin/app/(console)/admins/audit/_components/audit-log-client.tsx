"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, LogIn, AlertCircle, Eye } from "lucide-react"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { format } from "date-fns"
import { getAuditLogs } from "@/actions/admin.action"

export interface AuditLogRow {
    id: string
    action: string
    module: string
    resourceType: string | null
    resourceId: string | null
    description: string | null
    createdAt: Date
    adminUser: { id: string; name: string | null; email: string } | undefined
}

const MODULES = ["all", "admin_management", "system", "users", "credits", "feedback", "hiring", "university"] as const

const ACTION_ICONS: Record<string, typeof Plus> = {
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
    LOGIN: LogIn,
    ERROR: AlertCircle,
    VIEW: Eye,
}

function actionIcon(action: string) {
    return ACTION_ICONS[action] ?? Activity
}

export function AuditLogClient({
    initialLogs,
    initialTotal,
    initialPages,
    loadError,
}: {
    initialLogs: AuditLogRow[]
    initialTotal: number
    initialPages: number
    loadError: string | null | undefined
}) {
    const [logs, setLogs] = useState<AuditLogRow[]>(initialLogs)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(initialPages)
    const [total, setTotal] = useState(initialTotal)
    const [moduleFilter, setModuleFilter] = useState<(typeof MODULES)[number]>("all")
    const [firstLoad, setFirstLoad] = useState(true)

    useEffect(() => {
        if (loadError) toast.error(loadError || "Failed to load audit logs")
    }, [loadError])

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getAuditLogs(page, 20, moduleFilter)
        setLoading(false)
        if (!res.success) {
            toast.error(res.error || "Failed to load audit logs")
            return
        }
        setLogs(res.data.logs)
        setTotalPages(res.data.pages || 1)
        setTotal(res.data.total)
    }, [page, moduleFilter])

    useEffect(() => {
        if (firstLoad) { setFirstLoad(false); return }
        load()
    }, [load, firstLoad])

    return (
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <Activity className="w-6 h-6" />
                        Audit Log
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Every admin action, in order. {total} total.
                    </p>
                </div>
                <div className="w-full md:w-56">
                    <Select
                        value={moduleFilter}
                        onValueChange={(v) => { setModuleFilter(v as (typeof MODULES)[number]); setPage(1) }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MODULES.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m === "all" ? "All modules" : m.replace(/_/g, " ")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <InlineLoader size="md" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    No audit log entries{moduleFilter !== "all" ? " for this module" : ""}.
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {logs.map((log) => {
                        const Icon = actionIcon(log.action)
                        return (
                            <div key={log.id} className="flex items-start gap-3 p-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    <Icon className="w-4 h-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-neutral-900 dark:text-white">
                                        {log.description || `${log.action} on ${log.resourceType ?? log.module}`}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        <span>{log.adminUser?.name || log.adminUser?.email || "Unknown admin"}</span>
                                        <span>&middot;</span>
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 uppercase tracking-wide">
                                            {log.module.replace(/_/g, " ")}
                                        </span>
                                        <span>&middot;</span>
                                        <span>{format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
