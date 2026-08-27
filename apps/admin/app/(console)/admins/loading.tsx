// Hand-matched to the Team page: header with a single "Invite Admin" link,
// no filter row, and the 6-column table (Admin, Role, Status, Last Login,
// Joined, actions) with no pagination - the whole team renders on one page
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="w-full">
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-32" />
                        <Shimmer className="h-4 w-56" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-32 rounded-lg" delay={0.12} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Shimmer key={i} className="h-4 flex-1" delay={i * 0.05} />
                        ))}
                        <Shimmer className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                                <Shimmer className="h-8 w-8 shrink-0 rounded-full" delay={i * 0.04} />
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <Shimmer key={j} className="h-4 flex-1" delay={i * 0.03} />
                                ))}
                                <Shimmer className="h-4 w-4 shrink-0" delay={i * 0.03} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
