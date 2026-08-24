// Hand-matched to the admin dashboard: welcome header, a 4-KPI row, a
// "Platform Overview" heading over 3 platform cards (icon + title/desc +
// 2x2 sub-stat grid each), then a 2-up row (a pending-actions feed beside a
// 6-tile quick-links grid). No charts and no table on this page - an
// earlier version of this skeleton assumed both; re-matched to what
// dashboard-client.tsx actually renders (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="w-full mx-auto">
                <div className="mb-8 flex items-center gap-3">
                    <Shimmer className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Shimmer className="h-7 w-56" />
                        <Shimmer className="h-4 w-72" delay={0.06} />
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-4">
                            <Shimmer className="h-3.5 w-20" delay={i * 0.05} />
                            <Shimmer className="mt-2 h-7 w-16" delay={i * 0.05} />
                        </div>
                    ))}
                </div>

                <div className="mb-8">
                    <Shimmer className="mb-4 h-5 w-36" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <Shimmer className="h-12 w-12 rounded-xl" delay={i * 0.05} />
                                    <div className="space-y-1.5">
                                        <Shimmer className="h-4.5 w-24" delay={i * 0.05} />
                                        <Shimmer className="h-3.5 w-32" delay={i * 0.05} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <div key={j} className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3">
                                            <Shimmer className="h-6 w-10" delay={i * 0.05 + j * 0.02} />
                                            <Shimmer className="mt-1.5 h-3 w-14" delay={i * 0.05 + j * 0.02} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                        <Shimmer className="mb-4 h-5 w-36" />
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Shimmer key={i} className="h-14 w-full rounded-lg" delay={i * 0.06} />
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                        <Shimmer className="mb-4 h-5 w-28" />
                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Shimmer key={i} className="h-12 w-full rounded-lg" delay={i * 0.04} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
