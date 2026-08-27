import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="w-full p-6 lg:p-8">
            <ShimmerStyles />
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-48" />
                    <Shimmer className="h-4 w-64" delay={0.06} />
                </div>
                <Shimmer className="h-10 w-56 rounded-lg" delay={0.12} />
            </div>
            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-4">
                        <Shimmer className="h-8 w-8 shrink-0 rounded-lg" delay={i * 0.04} />
                        <div className="flex-1 space-y-2">
                            <Shimmer className="h-4 w-2/3" delay={i * 0.04} />
                            <Shimmer className="h-3 w-1/3" delay={i * 0.04} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
                <Shimmer className="h-3.5 w-24" />
                <div className="flex gap-2">
                    <Shimmer className="h-8 w-8 rounded-lg" />
                    <Shimmer className="h-8 w-8 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
