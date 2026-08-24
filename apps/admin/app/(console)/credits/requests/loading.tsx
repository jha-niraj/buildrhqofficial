// Hand-matched to the credit-request queue: header with a "N pending" pill
// (not stat cards), a single search box (no filter select), and a list of
// request cards (avatar + name/badge + email + amount/date + approve/reject
// buttons) - not the generic icon-row shape the previous skeleton assumed
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-52" />
                        <Shimmer className="h-4 w-72" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-28 rounded-lg" delay={0.1} />
                </div>

                <Shimmer className="mb-6 h-10 w-full rounded-lg" />

                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 items-start gap-4">
                                    <Shimmer className="h-12 w-12 shrink-0 rounded-full" delay={i * 0.05} />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Shimmer className="h-4 w-40" delay={i * 0.05} />
                                        <Shimmer className="h-3 w-52" delay={i * 0.05} />
                                        <div className="flex gap-4 pt-1">
                                            <Shimmer className="h-3.5 w-24" delay={i * 0.05} />
                                            <Shimmer className="h-3.5 w-28" delay={i * 0.05} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 lg:flex-col lg:items-end">
                                    <Shimmer className="h-9 w-24 rounded-lg" delay={i * 0.05} />
                                    <Shimmer className="h-9 w-24 rounded-lg" delay={i * 0.05} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
