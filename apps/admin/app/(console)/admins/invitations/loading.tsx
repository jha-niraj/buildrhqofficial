import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <ShimmerStyles />
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-48" />
                    <Shimmer className="h-4 w-80" delay={0.06} />
                </div>
                <Shimmer className="h-10 w-40 rounded-lg" delay={0.12} />
            </div>
            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0 space-y-2">
                            <Shimmer className="h-4 w-40" delay={i * 0.05} />
                            <Shimmer className="h-3 w-56" delay={i * 0.05} />
                        </div>
                        <div className="flex shrink-0 gap-1">
                            <Shimmer className="h-8 w-8 rounded-lg" delay={i * 0.05} />
                            <Shimmer className="h-8 w-8 rounded-lg" delay={i * 0.05} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
