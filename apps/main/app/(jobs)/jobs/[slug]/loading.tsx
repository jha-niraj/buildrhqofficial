// Hand-matched to the job detail page (2/3 body + 1/3 apply rail).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ShimmerStyles />

            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-56" />
                    <Shimmer className="h-4 w-80" delay={0.06} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6">
                        <div className="flex items-start gap-4">
                            <Shimmer className="h-16 w-16 shrink-0 rounded-2xl" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Shimmer className="h-7 w-3/4" delay={0.05} />
                                <Shimmer className="h-4 w-1/2" delay={0.08} />
                                <div className="flex gap-2 pt-1">
                                    {[0, 1, 2].map((j) => (
                                        <Shimmer key={j} className="h-5 w-16 rounded-full" delay={0.1 + j * 0.03} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Shimmer key={i} className="h-4 w-full" delay={0.14 + i * 0.03} />
                            ))}
                            <Shimmer className="h-4 w-2/3" delay={0.4} />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 space-y-3 p-6">
                        <Shimmer className="h-5 w-40" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Shimmer key={i} className="h-4 w-full" delay={i * 0.04} />
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 space-y-3 p-5">
                        <Shimmer className="h-5 w-28" />
                        <Shimmer className="h-11 w-full rounded-xl" delay={0.06} />
                        <Shimmer className="h-11 w-full rounded-xl" delay={0.1} />
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 space-y-2.5 p-5">
                        <Shimmer className="h-4 w-24" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <Shimmer className="h-3.5 w-20" delay={i * 0.04} />
                                <Shimmer className="h-3.5 w-16" delay={i * 0.04} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
