// Hand-matched to the pricing page: pt-32 hero over a 3-up tier grid, then the FAQ.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full">
            <ShimmerStyles />
            <section className="pb-20 pt-32">
                <div className="mx-auto max-w-7xl space-y-4 px-6 text-center">
                    <Shimmer className="mx-auto h-8 w-40 rounded-full" />
                    <Shimmer className="mx-auto h-12 w-full" delay={0.06} />
                    <Shimmer className="mx-auto h-5 w-3/4" delay={0.1} />
                </div>
            </section>

            <section className="pb-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`rounded-2xl border p-6 ${
                                    i === 1
                                        ? "border-neutral-900 dark:border-white"
                                        : "border-neutral-200 dark:border-neutral-800"
                                }`}
                            >
                                <Shimmer className="h-4 w-24" delay={i * 0.07} />
                                <Shimmer className="mt-4 h-10 w-32" delay={i * 0.07} />
                                <Shimmer className="mt-2 h-3.5 w-28" delay={i * 0.07} />
                                <Shimmer className="mt-6 h-11 w-full rounded-xl" delay={i * 0.07} />
                                <div className="mt-6 space-y-3">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <div key={j} className="flex items-center gap-2.5">
                                            <Shimmer className="h-4 w-4 shrink-0 rounded-full" delay={i * 0.07 + j * 0.03} />
                                            <Shimmer className="h-3.5 flex-1" delay={i * 0.07 + j * 0.03} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="mx-auto max-w-3xl px-6">
                    <Shimmer className="mx-auto mb-10 h-8 w-64" />
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
                                <Shimmer className="h-4 w-2/3" delay={i * 0.05} />
                                <Shimmer className="h-4 w-4 rounded" delay={i * 0.05} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
