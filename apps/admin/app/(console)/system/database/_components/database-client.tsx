"use client"

import { useCallback, useEffect, useState } from "react"
import { Database, Activity, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { getDatabaseStats, getSystemHealth } from "@/actions/system.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { format } from "date-fns"
import type { DatabaseStats, SystemHealth as SystemHealthType } from "@/types/admin"

const AUTO_REFRESH_MS = 30_000

export function DatabaseClient({
    initialStats,
    initialHealth,
}: {
    initialStats: DatabaseStats | undefined
    initialHealth: SystemHealthType | undefined
}) {
    const [dbStats, setDbStats] = useState<DatabaseStats | undefined>(initialStats)
    const [health, setHealth] = useState<SystemHealthType | undefined>(initialHealth)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = useCallback(async () => {
        setRefreshing(true)
        try {
            const [statsResult, healthResult] = await Promise.all([getDatabaseStats(), getSystemHealth()])
            if (statsResult.success) setDbStats(statsResult.data)
            if (healthResult.success) setHealth(healthResult.data)
        } catch (error) {
            console.error("Fetch error:", error)
            toast.error("Failed to fetch system data")
        } finally {
            setRefreshing(false)
        }
    }, [])

    // Matches the "Page auto-refreshes every 30 seconds" note at the bottom of
    // this page - previously just copy, with nothing behind it.
    useEffect(() => {
        const interval = setInterval(fetchData, AUTO_REFRESH_MS)
        return () => clearInterval(interval)
    }, [fetchData])

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <Database className="w-7 h-7" />
                        Database &amp; System Health
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Monitor database statistics and system health</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 disabled:opacity-50 transition-colors"
                >
                    {refreshing ? <InlineLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            {health && (
                <div className="mb-8">
                    <div className={`p-6 rounded-xl border ${health.databaseStatus === "healthy"
                        ? "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-200 dark:border-neutral-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            {health.databaseStatus === "healthy" ? (
                                <CheckCircle className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
                            ) : (
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            )}
                            <div>
                                <h2 className={`text-xl font-semibold ${health.databaseStatus === "healthy"
                                    ? "text-neutral-900 dark:text-neutral-700"
                                    : "text-red-900 dark:text-red-200"
                                    }`}>
                                    System Status: {health.databaseStatus === "healthy" ? "Healthy" : "Unhealthy"}
                                </h2>
                                <p className={`text-sm ${health.databaseStatus === "healthy"
                                    ? "text-neutral-700 dark:text-neutral-100"
                                    : "text-red-700 dark:text-red-300"
                                    }`}>
                                    Last checked: {health.timestamp ? format(new Date(health.timestamp), "MMM dd, yyyy HH:mm:ss") : "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg ${health.databaseStatus === "healthy" ? "bg-white dark:bg-neutral-800" : "bg-red-100 dark:bg-red-900/30"}`}>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Database Connection</p>
                                <p className={`text-lg font-semibold ${health.databaseStatus === "healthy" ? "text-neutral-800 dark:text-neutral-100" : "text-red-600 dark:text-red-400"}`}>
                                    {health.databaseStatus === "healthy" ? "Connected" : "Disconnected"}
                                </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Recent Activities (24h)</p>
                                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{health.recentActivitiesLast24h?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {dbStats && (
                <>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Database Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Users" value={dbStats.users} icon="👥" />
                        <StatCard label="Projects" value={dbStats.projects} icon="📁" />
                        <StatCard label="Communities" value={dbStats.communities} icon="🌐" />
                        <StatCard label="Mock Interviews" value={dbStats.mockInterviews} icon="🎤" />
                        <StatCard label="Feedback" value={dbStats.feedback} icon="💬" />
                        <StatCard label="Credit Transactions" value={dbStats.creditTransactions} icon="💰" />
                        <StatCard label="Assessment Questions" value={dbStats.assessmentQuestions} icon="❓" />
                        <StatCard label="Forge Tracks" value={dbStats.forgeTracks} icon="🛤️" />
                        <StatCard label="Crucible Events" value={dbStats.crucibleEvents} icon="🔥" />
                    </div>
                </>
            )}
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-700 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    System Monitoring
                </h3>
                <ul className="text-sm text-neutral-800 dark:text-neutral-100 space-y-1">
                    <li>&bull; Page auto-refreshes every 30 seconds</li>
                    <li>&bull; Database health checks connection status</li>
                    <li>&bull; Statistics show real-time record counts</li>
                    <li>&bull; Active users based on last 24 hours of activity</li>
                </ul>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-white text-xl">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{value?.toLocaleString()}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
                </div>
            </div>
        </div>
    )
}
