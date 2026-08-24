// Hand-matched to admin analytics: header + Refresh button, 4 stat tiles, a
// full-width User Growth bar chart, then a 2-up row of Engagement Metrics
// (label/value rows, not a chart) and Module Usage (progress bars) - not a
// uniform 2x2 chart grid, which is what the previous skeleton assumed
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-56" />
                        <Shimmer className="h-4 w-64" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-28 rounded-lg" delay={0.1} />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <div className="mb-2 flex items-center gap-3">
                                <Shimmer className="h-10 w-10 rounded-lg" delay={i * 0.05} />
                                <div className="space-y-1.5">
                                    <Shimmer className="h-6 w-16" delay={i * 0.05} />
                                    <Shimmer className="h-3 w-20" delay={i * 0.05} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-8 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                    <Shimmer className="mb-4 h-5 w-32" />
                    <div className="flex h-64 items-end gap-2">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="flex-1" style={{ height: `${20 + (i % 7) * 10}%` }}>
                                <Shimmer className="h-full w-full rounded-t" delay={i * 0.01} />
                            </div>
                        ))}
                    </div>
                    <Shimmer className="mx-auto mt-4 h-3.5 w-56" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                        <Shimmer className="mb-4 h-5 w-40" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <Shimmer className="h-4 w-32" delay={i * 0.05} />
                                    <Shimmer className="h-5 w-12" delay={i * 0.05} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                        <Shimmer className="mb-4 h-5 w-32" />
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Shimmer className="h-3.5 w-24" delay={i * 0.05} />
                                        <Shimmer className="h-3.5 w-10" delay={i * 0.05} />
                                    </div>
                                    <Shimmer className="h-2 w-full rounded-full" delay={i * 0.05} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
