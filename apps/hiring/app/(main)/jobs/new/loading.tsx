// Hand-matched to job-form-content.tsx - same wrapper, same grids, same card chrome, so
// nothing reflows when the real content mounts.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="min-h-full p-6 lg:p-8">
            <ShimmerStyles />
            <div className="container mx-auto">
                <div className="mb-8 space-y-2">
                    <Shimmer className="h-8 w-64" />
                    <Shimmer className="h-4 w-96" delay={0.06} />
                </div>

                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, s) => (
                        <div key={s} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
                            <Shimmer className="h-5 w-44" delay={s * 0.08} />
                            <Shimmer className="mt-2 h-3.5 w-72" delay={s * 0.08} />
                            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Shimmer className="h-3.5 w-28" delay={s * 0.08 + i * 0.04} />
                                        <Shimmer className="h-10 w-full rounded-lg" delay={s * 0.08 + i * 0.04} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Shimmer className="h-11 w-28 rounded-xl" />
                    <Shimmer className="h-11 w-36 rounded-xl" delay={0.05} />
                </div>
            </div>
        </div>
    );
}
