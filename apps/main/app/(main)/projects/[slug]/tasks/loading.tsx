// Hand-matched to the project task board.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <ShimmerStyles />

            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <Shimmer className="h-8 w-56" />
                    <Shimmer className="h-4 w-80" delay={0.06} />
                </div>
                <Shimmer className="h-10 w-36 rounded-xl" delay={0.12} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, col) => (
                    <div key={col} className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between px-1">
                            <Shimmer className="h-4 w-24" delay={col * 0.06} />
                            <Shimmer className="h-5 w-6 rounded-full" delay={col * 0.06} />
                        </div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                                <Shimmer className="h-4 w-4/5" delay={col * 0.06 + i * 0.04} />
                                <Shimmer className="mt-2 h-3 w-1/2" delay={col * 0.06 + i * 0.04} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
