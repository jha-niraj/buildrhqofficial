import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getJobsTabCounts } from "@/actions/jobs/tabs"
import { JobsTabsWrapper } from "./components/jobs-tabs-wrapper"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

export default async function JobsLayout({
    children
}: {
    children: React.ReactNode
}) {
    const [session, countsResult] = await Promise.all([
        getSession(headers()),
        getJobsTabCounts()
    ])

    const isAuthenticated = !!session?.user?.id
    const counts = countsResult.success && countsResult.data 
        ? countsResult.data 
        : { spark: 0, following: 0, saved: 0, applied: 0, browse: 0 }

    return (
        <div className="min-h-full">
            {/* Header with Tabs */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
                <div className="p-4 lg:p-6">
                    {/* Title */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
                                Jobs
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Find your next opportunity
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Suspense fallback={
                        <div className="h-12 bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />
                    }>
                        <JobsTabsWrapper 
                            counts={counts} 
                            isAuthenticated={isAuthenticated} 
                        />
                    </Suspense>
                </div>
            </div>

            {/* Page Content */}
            <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                    <InlineLoader size="lg" className="text-neutral-400" />
                </div>
            }>
                {children}
            </Suspense>
        </div>
    )
}
