// Hand-matched to the users table: header with a single "Export" button (no
// stat row), a search + role-filter + status-filter row (three controls),
// and the 8-column table (checkbox, User, Role, Credits, XP, Status,
// Joined, actions) - the previous skeleton assumed a stat row and a
// two-control filter bar, neither of which this page has (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-56" />
                        <Shimmer className="h-4 w-72" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-28 rounded-lg" delay={0.1} />
                </div>

                <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <Shimmer className="h-10 flex-1 rounded-lg" />
                        <Shimmer className="h-10 w-full rounded-lg md:w-36" delay={0.06} />
                        <Shimmer className="h-10 w-full rounded-lg md:w-36" delay={0.1} />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                        <Shimmer className="h-4 w-4 shrink-0 rounded" />
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Shimmer key={i} className="h-4 flex-1" delay={i * 0.05} />
                        ))}
                        <Shimmer className="h-4 w-4 shrink-0 rounded" />
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                                <Shimmer className="h-4 w-4 shrink-0 rounded" delay={i * 0.03} />
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <Shimmer key={j} className="h-4 flex-1" delay={i * 0.03} />
                                ))}
                                <Shimmer className="h-6 w-6 shrink-0 rounded" delay={i * 0.03} />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
                        <Shimmer className="h-3.5 w-52" />
                        <div className="flex gap-2">
                            <Shimmer className="h-8 w-8 rounded-lg" />
                            <Shimmer className="h-8 w-8 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
