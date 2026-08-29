import { Suspense } from "react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getJobsTabCounts } from "@/actions/jobs/tabs"
import { JobsTabsWrapper } from "./components/jobs-tabs-wrapper"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { JobsHeaderOffset } from "./components/header-offset"

/**
 * The jobs shell: one header row carrying the title AND the tabs.
 *
 * ── Why the tabs moved up beside the title ───────────────────────────────────
 * They were a second stacked row, so ~140px of chrome sat above the first job on
 * every tab. The tabs are a filter on one surface, not five separate places, and
 * a filter belongs on the same line as the thing it filters. Niraj, 2026-08-29.
 *
 * ── Why this page was slow, and what actually fixed it ───────────────────────
 * The layout used to `await getJobsTabCounts()` alongside the session before
 * returning anything. A layout renders BEFORE its children, so that five-count
 * aggregate blocked the header, the tab row and the page body on every single
 * navigation - each tab paying for the counts of the other four before it could
 * paint.
 *
 * The counts are now behind their own `<Suspense>`. The shell and the page paint
 * immediately; the numbers arrive when they arrive.
 *
 * Niraj asked whether these should be `?tab=` params on one page instead. They
 * should not: the query is identical either way, so a param fixes nothing, and
 * routes buy a shareable URL, a per-tab `loading.tsx`, independent fetching and
 * real browser history. The blocking `await` was the whole problem. See
 * `plan/jobs/overview.md`.
 */
export default async function JobsLayout({
    children
}: {
    children: React.ReactNode
}) {
    const session = await getSession(headers())
    const isAuthenticated = !!session?.user?.id

    return (
        <div className="min-h-full">
            {/* Opaque (JB-11), and it publishes its own height as `--jobs-header-h`
                so the browse page's control bar can pin beneath it without a
                hand-written offset. See `header-offset.tsx`. */}
            <JobsHeaderOffset>
                <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:p-6">
                    <div className="min-w-0 shrink-0">
                        <h1 className="text-xl font-bold text-neutral-900 lg:text-2xl dark:text-white">
                            Jobs
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            Find your next opportunity
                        </p>
                    </div>

                    {/* Its own boundary. Without this the counts block the whole tree. */}
                    <Suspense
                        fallback={
                            <div className="h-11 w-full animate-pulse rounded-2xl bg-neutral-100 lg:max-w-2xl dark:bg-neutral-900" />
                        }
                    >
                        <JobsTabs isAuthenticated={isAuthenticated} />
                    </Suspense>
                </div>
            </JobsHeaderOffset>

            <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                    <InlineLoader size="lg" className="text-neutral-600 dark:text-neutral-400" />
                </div>
            }>
                {children}
            </Suspense>
        </div>
    )
}

/** Split out purely so the `await` below sits inside a Suspense boundary. */
async function JobsTabs({ isAuthenticated }: { isAuthenticated: boolean }) {
    const countsResult = await getJobsTabCounts()
    const counts = countsResult.success && countsResult.data
        ? countsResult.data
        : { spark: 0, following: 0, saved: 0, applied: 0, browse: 0 }

    return <JobsTabsWrapper counts={counts} isAuthenticated={isAuthenticated} />
}
