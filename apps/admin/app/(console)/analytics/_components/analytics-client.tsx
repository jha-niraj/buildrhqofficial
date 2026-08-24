"use client"

import { useCallback, useState } from "react"
import { BarChart3, Users, TrendingUp, Activity, Download } from "lucide-react"
import {
    getOverviewStats, getUserGrowthStats, getEngagementStats, getModuleUsageStats,
} from "@/actions/main/analytics.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

type SuccessData<T> = T extends { success: true; data: infer D } ? D : never
type OverviewStats = SuccessData<Awaited<ReturnType<typeof getOverviewStats>>>
type UserGrowthData = SuccessData<Awaited<ReturnType<typeof getUserGrowthStats>>>
type EngagementData = SuccessData<Awaited<ReturnType<typeof getEngagementStats>>>
type ModuleUsageData = SuccessData<Awaited<ReturnType<typeof getModuleUsageStats>>>

export function AnalyticsClient({
    initialOverview,
    initialGrowth,
    initialEngagement,
    initialModuleUsage,
}: {
    initialOverview: OverviewStats | null
    initialGrowth: UserGrowthData | null
    initialEngagement: EngagementData | null
    initialModuleUsage: ModuleUsageData | null
}) {
    const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(initialOverview)
    const [userGrowth, setUserGrowth] = useState<UserGrowthData | null>(initialGrowth)
    const [engagement, setEngagement] = useState<EngagementData | null>(initialEngagement)
    const [moduleUsage, setModuleUsage] = useState<ModuleUsageData | null>(initialModuleUsage)
    const [isLoading, setIsLoading] = useState(false)

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true)
        try {
            const [overviewRes, growthRes, engagementRes, moduleRes] = await Promise.all([
                getOverviewStats(),
                getUserGrowthStats(),
                getEngagementStats(),
                getModuleUsageStats(),
            ])
            if (overviewRes.success) setOverviewStats(overviewRes.data)
            if (growthRes.success) setUserGrowth(growthRes.data)
            if (engagementRes.success) setEngagement(engagementRes.data)
            if (moduleRes.success) setModuleUsage(moduleRes.data)
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
            toast.error("Failed to load analytics")
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7" />
                        Platform Analytics
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Insights and metrics for your platform</p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-neutral-700 to-neutral-900 rounded-lg hover:from-neutral-600 hover:to-neutral-800 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? <InlineLoader size="sm" /> : <Download className="w-4 h-4" />}
                    Refresh
                </button>
            </div>
            {overviewStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{overviewStats.totalUsers?.toLocaleString()}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Users</p>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-900 dark:text-neutral-300">+{overviewStats.newUsers} new this period</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{overviewStats.totalProjects?.toLocaleString()}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Projects</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{overviewStats.activeCommunities?.toLocaleString()}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Communities</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{overviewStats.totalFeedback?.toLocaleString()}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Feedback</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {userGrowth && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">User Growth</h2>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {userGrowth.chartData?.slice(0, 30).map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-neutral-900 to-neutral-800 rounded-t"
                                    style={{
                                        height: `${Math.max((item.count / Math.max(...userGrowth.chartData.map((d) => d.count), 1)) * 100, 5)}%`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 text-center">
                        Last 30 days &middot; Total new users: {userGrowth.total}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {engagement && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Engagement Metrics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Projects Started</span>
                                <span className="text-xl font-semibold text-neutral-900 dark:text-white">{engagement.projectsStarted?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Feedback Submitted</span>
                                <span className="text-xl font-semibold text-neutral-900 dark:text-white">{engagement.feedbackSubmitted?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Communities Joined</span>
                                <span className="text-xl font-semibold text-neutral-900 dark:text-white">{engagement.communitiesJoined?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Mocks Completed</span>
                                <span className="text-xl font-semibold text-neutral-900 dark:text-white">{engagement.mocksCompleted?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
                {moduleUsage && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Module Usage</h2>
                        <div className="space-y-3">
                            {moduleUsage.modules?.map((module, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{module.name}</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white">{module.count?.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-neutral-700 to-neutral-900 h-2 rounded-full"
                                            style={{
                                                width: `${Math.max((module.count / Math.max(...moduleUsage.modules.map((m) => m.count), 1)) * 100, 5)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
