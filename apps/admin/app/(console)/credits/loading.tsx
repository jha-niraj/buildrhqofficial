// Hand-matched to the credits overview: header (no action button), 4 stat
// tiles, a 3-tab strip, and the overview tab's 2-column split (recent
// transactions list beside pending requests list) - not a single ledger
// table, which is what the previous version of this skeleton assumed
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="w-full">
                <div className="mb-8 space-y-2">
                    <Shimmer className="h-8 w-56" />
                    <Shimmer className="h-4 w-72" delay={0.06} />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <Shimmer className="mb-2 h-10 w-10 rounded-lg" delay={i * 0.05} />
                            <Shimmer className="h-7 w-20" delay={i * 0.05} />
                            <Shimmer className="mt-1.5 h-3.5 w-28" delay={i * 0.05} />
                        </div>
                    ))}
                </div>

                <div className="mb-6 flex gap-6 border-b border-neutral-200 dark:border-neutral-800">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Shimmer key={i} className="mb-3 h-5 w-20" delay={i * 0.06} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, col) => (
                        <div key={col} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <Shimmer className="mb-4 h-5 w-32" />
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 py-1">
                                        <Shimmer className="h-8 w-8 shrink-0 rounded-full" delay={i * 0.04} />
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <Shimmer className="h-3.5 w-32" delay={i * 0.04} />
                                            <Shimmer className="h-3 w-20" delay={i * 0.04} />
                                        </div>
                                        <Shimmer className="h-4 w-12 shrink-0" delay={i * 0.04} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
