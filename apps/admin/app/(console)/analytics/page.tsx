import {
    getOverviewStats, getUserGrowthStats, getEngagementStats, getModuleUsageStats, getRevenueStats,
} from "@/actions/main/analytics.action"
import { AnalyticsClient } from "./_components/analytics-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AnalyticsPage() {
    const [overviewRes, growthRes, engagementRes, moduleRes, revenueRes] = await Promise.all([
        getOverviewStats(),
        getUserGrowthStats(),
        getEngagementStats(),
        getModuleUsageStats(),
        // Revenue was already computed by this action and shown nowhere (ADM-30).
        getRevenueStats(),
    ])

    return (
        <AnalyticsClient
            initialOverview={overviewRes.success ? overviewRes.data : null}
            initialGrowth={growthRes.success ? growthRes.data : null}
            initialEngagement={engagementRes.success ? engagementRes.data : null}
            initialModuleUsage={moduleRes.success ? moduleRes.data : null}
            initialRevenue={revenueRes.success ? revenueRes.data : null}
        />
    )
}
