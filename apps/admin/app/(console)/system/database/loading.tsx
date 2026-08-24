// Hand-matched to Database & System Health: header + Refresh button, a
// health-status card (icon+status+timestamp, then a 2-col detail grid), and
// a 9-tile stat grid under "Database Statistics" - not a data table, which
// is what the previous skeleton assumed; this page has never had one
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-72" />
                        <Shimmer className="h-4 w-64" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-28 rounded-lg" delay={0.1} />
                </div>

                <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4 flex items-center gap-3">
                        <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
                        <div className="space-y-1.5">
                            <Shimmer className="h-5 w-44" />
                            <Shimmer className="h-3.5 w-56" delay={0.04} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                                <Shimmer className="h-3 w-32" delay={i * 0.05} />
                                <Shimmer className="mt-1.5 h-5 w-20" delay={i * 0.05} />
                            </div>
                        ))}
                    </div>
                </div>

                <Shimmer className="mb-4 h-5 w-44" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4">
                            <div className="flex items-center gap-3">
                                <Shimmer className="h-9 w-9 shrink-0 rounded-lg" delay={i * 0.03} />
                                <div className="space-y-1.5">
                                    <Shimmer className="h-3.5 w-24" delay={i * 0.03} />
                                    <Shimmer className="h-5 w-14" delay={i * 0.03} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
