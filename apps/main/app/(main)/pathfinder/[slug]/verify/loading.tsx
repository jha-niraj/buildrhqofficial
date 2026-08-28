// Hand-matched to the goal verification flow.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full px-6 py-8">
            <ShimmerStyles />

            <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-56" />
                    <Shimmer className="h-4 w-80" delay={0.06} />
                </div>
                <Shimmer className="h-10 w-36 rounded-xl" delay={0.12} />
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Shimmer key={i} className="h-9 w-28 rounded-lg" delay={i * 0.05} />
                ))}
            </div>

            <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, s) => (
                    <div key={s} className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-6">
                        <Shimmer className="h-5 w-44" delay={s * 0.08} />
                        <Shimmer className="mt-2 h-3.5 w-72" delay={s * 0.08} />
                        <div className="mt-5 space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Shimmer className="h-3.5 w-28" delay={s * 0.08 + i * 0.04} />
                                    <Shimmer className="h-10 w-full rounded-lg" delay={s * 0.08 + i * 0.04} />
                                </div>
                            ))}
                        </div>
                        <Shimmer className="mt-5 h-10 w-32 rounded-lg" delay={s * 0.08} />
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}
