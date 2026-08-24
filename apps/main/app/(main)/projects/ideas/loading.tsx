// Hand-matched to ProjectIdeasClient (_components/ProjectIdeasClient.tsx).
//
// First paint is the "categories" view, not a three-up card grid: a sticky
// header (logo tile + title, a two-button segmented toggle, "Submit Idea"), a
// w-64/lg:w-72 category rail that is hidden below md, and a main pane holding
// the category header, the technology pill row and the 2-up project grid.
//
// The rail count is the component's own loading state - it renders exactly five
// `h-12 rounded-lg` rows while categories load - and the project grid uses four,
// which is what the client shows while `getPlatformProjects` (limit 20) is in
// flight. Matching those means the transition from this file to the real
// in-component skeleton is invisible.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full">
            <ShimmerStyles />

            {/* Sticky header. */}
            <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <Shimmer className="h-8 w-8 rounded-lg" />
                        <Shimmer className="h-5 w-32" delay={0.05} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                            <Shimmer className="h-7 w-28 rounded-md" delay={0.08} />
                            <Shimmer className="h-7 w-28 rounded-md" delay={0.1} />
                        </div>
                        <Shimmer className="hidden h-8 w-28 rounded-lg sm:block" delay={0.13} />
                    </div>
                </div>
            </div>

            <div className="flex min-h-[calc(100dvh-4rem)]">
                {/* Category rail - hidden below md, exactly as the real aside is. */}
                <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-neutral-50/50 md:block lg:w-72 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="p-4">
                        <Shimmer className="mb-3 ml-2 h-2.5 w-20" />
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Shimmer key={i} className="h-12 rounded-lg" delay={i * 0.05} />
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    {/* Mobile category select. */}
                    <div className="border-b border-neutral-200 p-4 md:hidden dark:border-neutral-800">
                        <Shimmer className="h-10 w-full rounded-lg" />
                    </div>

                    <div className="p-4 md:p-6">
                        {/* Category header. */}
                        <div className="mb-6 flex items-center gap-3">
                            <Shimmer className="h-10 w-10 rounded-xl" />
                            <div className="space-y-1.5">
                                <Shimmer className="h-6 w-44" delay={0.05} />
                                <Shimmer className="h-4 w-64" delay={0.08} />
                            </div>
                        </div>

                        {/* Technology pills. */}
                        <div className="mb-6 flex items-center gap-2 overflow-hidden pb-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Shimmer
                                    key={i}
                                    className="h-7 w-20 shrink-0 rounded-full"
                                    delay={0.1 + i * 0.03}
                                />
                            ))}
                        </div>

                        {/* Project grid - 2-up from lg, four placeholders. */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="flex items-start justify-between">
                                        <Shimmer className="h-10 w-10 rounded-xl" delay={i * 0.05} />
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
                </main>
            </div>
        </div>
    );
}
