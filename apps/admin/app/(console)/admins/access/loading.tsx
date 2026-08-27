// Hand-matched to Access Control: a header with no action button, then a
// stack of per-admin cards - avatar/name/email/role badge, three status
// buttons, an 8-module x 4-level permission matrix, and a Save button. The
// previous skeleton assumed a single wide table, which this page has never
// been (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="w-full">
                <div className="mb-6 space-y-2">
                    <Shimmer className="h-8 w-48" />
                    <Shimmer className="h-4 w-64" delay={0.06} />
                </div>

                <div className="space-y-6">
                    {Array.from({ length: 2 }).map((_, card) => (
                        <div key={card} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <Shimmer className="h-10 w-10 rounded-full" delay={card * 0.1} />
                                    <div className="space-y-1.5">
                                        <Shimmer className="h-4 w-32" delay={card * 0.1} />
                                        <Shimmer className="h-3 w-44" delay={card * 0.1} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Shimmer key={i} className="h-7 w-16 rounded-lg" delay={card * 0.1 + i * 0.03} />
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                                <div className="flex gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                                    <Shimmer className="h-3.5 w-24" delay={card * 0.1} />
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Shimmer key={i} className="h-3.5 w-16" delay={card * 0.1 + i * 0.02} />
                                    ))}
                                </div>
                                {Array.from({ length: 8 }).map((_, row) => (
                                    <div key={row} className="flex items-center gap-3 border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
                                        <Shimmer className="h-3.5 w-24" delay={card * 0.1 + row * 0.02} />
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Shimmer key={i} className="h-8 w-8 shrink-0 rounded-md" delay={card * 0.1 + row * 0.02 + i * 0.01} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Shimmer className="h-9 w-32 rounded-lg" delay={card * 0.1} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
