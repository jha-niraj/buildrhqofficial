// Hand-matched to the feedback inbox: header with no action button, a
// search + category-filter + status-filter row (three controls, not two),
// and feedback cards (round avatar, title + two-line description, category
// badge, meta row, status control) - the previous skeleton's icon-tile
// avatar and two-control filter row didn't match either (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="w-full">
                <div className="mb-8 space-y-2">
                    <Shimmer className="h-8 w-64" />
                    <Shimmer className="h-4 w-72" delay={0.06} />
                </div>

                <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <Shimmer className="h-10 flex-1 rounded-lg" />
                        <Shimmer className="h-10 w-full rounded-lg md:w-44" delay={0.06} />
                        <Shimmer className="h-10 w-full rounded-lg md:w-44" delay={0.1} />
                    </div>
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <div className="flex items-start gap-4">
                                <Shimmer className="h-10 w-10 shrink-0 rounded-full" delay={i * 0.05} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <Shimmer className="h-4 w-56" delay={i * 0.05} />
                                        <Shimmer className="h-5 w-16 shrink-0 rounded-full" delay={i * 0.05} />
                                    </div>
                                    <Shimmer className="h-3.5 w-full max-w-md" delay={i * 0.05} />
                                    <div className="flex items-center gap-4 pt-1">
                                        <Shimmer className="h-3 w-24" delay={i * 0.05} />
                                        <Shimmer className="h-3 w-16" delay={i * 0.05} />
                                        <Shimmer className="h-3 w-20" delay={i * 0.05} />
                                    </div>
                                    <Shimmer className="mt-2 h-8 w-40 rounded-lg" delay={i * 0.05} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
