import {
    getOverviewStats, getUserGrowthStats, getEngagementStats, getModuleUsageStats,
} from "@/actions/main/analytics.action"
import { AnalyticsClient } from "./_components/analytics-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function AnalyticsPage() {
    const [overviewRes, growthRes, engagementRes, moduleRes] = await Promise.all([
        getOverviewStats(),
        getUserGrowthStats(),
        getEngagementStats(),
        getModuleUsageStats(),
    ])

    return (
        <AnalyticsClient
            initialOverview={overviewRes.success ? overviewRes.data : null}
            initialGrowth={growthRes.success ? growthRes.data : null}
            initialEngagement={engagementRes.success ? engagementRes.data : null}
            initialModuleUsage={moduleRes.success ? moduleRes.data : null}
        />
    )
}
