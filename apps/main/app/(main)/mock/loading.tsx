// Hand-matched to the mock-interview hub.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full px-6 py-8">
            <ShimmerStyles />

            <div className="mb-10 space-y-4 text-center">
                <Shimmer className="mx-auto h-9 w-44 rounded-full" />
                <Shimmer className="mx-auto h-11 w-full max-w-xl" delay={0.06} />
                <Shimmer className="mx-auto h-5 w-full max-w-lg" delay={0.1} />
                <div className="flex justify-center gap-3 pt-2">
                    <Shimmer className="h-12 w-40 rounded-xl" delay={0.14} />
                    <Shimmer className="h-12 w-40 rounded-xl" delay={0.17} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 p-5">
                        <div className="flex items-start justify-between">
                            <Shimmer className="h-11 w-11 rounded-xl" delay={i * 0.05} />
                            <Shimmer className="h-6 w-20 rounded-full" delay={i * 0.05} />
                        </div>
                        <Shimmer className="mt-4 h-5 w-3/4" delay={i * 0.05} />
                        <Shimmer className="mt-2 h-4 w-full" delay={i * 0.05} />
                        <Shimmer className="mt-1.5 h-4 w-5/6" delay={i * 0.05} />
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {[0, 1, 2].map((j) => (
                                <Shimmer key={j} className="h-5 w-14 rounded-md" delay={i * 0.05} />
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                            <Shimmer className="h-3.5 w-24" delay={i * 0.05} />
                            <Shimmer className="h-3.5 w-16" delay={i * 0.05} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
