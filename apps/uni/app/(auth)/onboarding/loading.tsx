// Hand-matched to the university onboarding wizard (page.tsx).
//
// This route has a known shape, so it gets a skeleton rather than the branded
// full-screen loader: the nav bar, the centred max-w-4xl column, the three-step
// indicator (`steps` in page.tsx has exactly three entries - the connector
// stroke is drawn between them, not after the last) and the rounded-3xl form
// card holding step 0's two-column field grid.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="flex min-h-dvh flex-col bg-white dark:bg-neutral-950">
            <ShimmerStyles />

            <nav className="w-full border-b border-neutral-200 bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-8 w-8 rounded-lg" />
                        <Shimmer className="h-5 w-40" delay={0.05} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Shimmer className="hidden h-4 w-44 sm:block" delay={0.09} />
                        <Shimmer className="h-8 w-8 rounded-md" delay={0.12} />
                    </div>
                </div>
            </nav>

            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden p-4">
                <div className="w-full max-w-4xl">
                    <div className="mb-8 space-y-2 text-center">
                        <Shimmer className="mx-auto h-2.5 w-44" />
                        <Shimmer className="mx-auto h-9 w-full max-w-lg" delay={0.06} />
                    </div>

                    {/* Three-step indicator: circle + label, connector between steps. */}
                    <div className="mb-8 flex justify-center gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Shimmer className="h-8 w-8 rounded-full" delay={i * 0.06} />
                                <Shimmer className="hidden h-4 w-28 md:block" delay={i * 0.06} />
                                {i < 2 && <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-800" />}
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="grid gap-6 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Shimmer className="h-3 w-32" delay={i * 0.05} />
                                    <Shimmer className="h-10 w-full rounded-lg" delay={i * 0.05} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Shimmer className="h-10 w-32 rounded-lg" delay={0.25} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
