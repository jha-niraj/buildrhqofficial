// Hand-matched to the settings shell (nav rail + panel).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full px-6 py-8">
            <ShimmerStyles />

            <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 lg:flex-row">
                <div className="w-full shrink-0 space-y-1 lg:w-56">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Shimmer key={i} className="h-10 w-full rounded-lg" delay={i * 0.05} />
                    ))}
                </div>
                <div className="min-w-0 flex-1">
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, s) => (
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
            </div>
        </div>
    );
}
