// Hand-matched to the credit-transactions table: header (no action button,
// no stat row - those live on the credits overview page, not here), a
// search + type-filter row, and the 5-column table (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 space-y-2">
                    <Shimmer className="h-8 w-56" />
                    <Shimmer className="h-4 w-72" delay={0.06} />
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Shimmer className="h-10 w-full rounded-lg" />
                    </div>
                    <Shimmer className="h-10 w-full rounded-lg" delay={0.06} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Shimmer key={i} className="h-4 flex-1" delay={i * 0.05} />
                        ))}
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <Shimmer key={j} className="h-4 flex-1" delay={i * 0.03} />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
                        <Shimmer className="h-8 w-20 rounded-lg" />
                        <Shimmer className="h-4 w-24" />
                        <Shimmer className="h-8 w-16 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}
