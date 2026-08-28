// Hand-matched to ProjectsHubClient: a centred hero, a 4-up stat band, then the
// alternating full-bleed sections (public projects, a 2-up grid, a 4-up grid).
// The section backgrounds alternate white / neutral-50 exactly as the real page
// does, so the transition does not flash a different rhythm of bands.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="w-full">
            <ShimmerStyles />

            {/* Hero - centred badge, headline, sub, CTA row, trust pills. */}
            <section className="relative py-20">
                <div className="w-full px-6">
                    <div className="mx-auto max-w-4xl space-y-4 text-center">
                        <div className="flex justify-center">
                            <Shimmer className="h-9 w-52 rounded-full" />
                        </div>
                        <div className="space-y-3 pt-2">
                            <Shimmer className="mx-auto h-12 w-full max-w-2xl" delay={0.06} />
                            <Shimmer className="mx-auto h-12 w-3/5" delay={0.09} />
                        </div>
                        <Shimmer className="mx-auto h-5 w-full max-w-2xl" delay={0.14} />
                        <Shimmer className="mx-auto h-5 w-2/3 max-w-xl" delay={0.16} />

                        <div className="flex flex-col items-center gap-8 pt-6">
                            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                                <Shimmer className="h-14 w-full rounded-xl sm:w-48" delay={0.2} />
                                <Shimmer className="h-14 w-full rounded-xl sm:w-48" delay={0.23} />
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                                {[0, 1, 2].map((i) => (
                                    <Shimmer key={i} className="h-5 w-32" delay={0.28 + i * 0.04} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stat band - 2-up on mobile, 4-up from md. */}
            <section className="bg-white dark:bg-neutral-950">
                <div className="w-full px-6">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl p-6 text-center">
                                <Shimmer className="mx-auto h-12 w-12 rounded-xl" delay={i * 0.05} />
                                <Shimmer className="mx-auto mt-4 h-7 w-20" delay={i * 0.05} />
                                <Shimmer className="mx-auto mt-2 h-3.5 w-24" delay={i * 0.05} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Public projects - header row + a 3-up card grid. */}
            <section className="bg-neutral-50 py-24 dark:bg-neutral-900/50">
                <div className="w-full px-6">
                    <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="space-y-3">
                            <Shimmer className="h-9 w-44 rounded-full" />
                            <Shimmer className="h-8 w-72" delay={0.05} />
                            <Shimmer className="h-4 w-96" delay={0.08} />
                        </div>
                        <Shimmer className="h-10 w-32 rounded-xl" delay={0.12} />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-start justify-between">
                                    <Shimmer className="h-10 w-10 rounded-xl" delay={i * 0.05} />
                                    <Shimmer className="h-5 w-20 rounded-full" delay={i * 0.05} />
                                </div>
                                <Shimmer className="mt-4 h-5 w-3/4" delay={i * 0.05} />
                                <Shimmer className="mt-2 h-4 w-full" delay={i * 0.05} />
                                <Shimmer className="mt-1.5 h-4 w-5/6" delay={i * 0.05} />
                                <div className="mt-4 flex gap-1.5">
                                    {[0, 1, 2].map((j) => (
                                        <Shimmer key={j} className="h-5 w-14 rounded-md" delay={i * 0.05} />
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                    <Shimmer className="h-3.5 w-28" delay={i * 0.05} />
                                    <Shimmer className="h-3.5 w-16" delay={i * 0.05} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Two-up feature section. */}
            <section className="bg-white py-24 dark:bg-neutral-950">
                <div className="w-full px-6">
                    <div className="mb-12 space-y-3 text-center">
                        <Shimmer className="mx-auto h-8 w-72" />
                        <Shimmer className="mx-auto h-4 w-96" delay={0.05} />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                                <Shimmer className="h-11 w-11 rounded-xl" delay={i * 0.06} />
                                <Shimmer className="mt-4 h-6 w-1/2" delay={i * 0.06} />
                                <Shimmer className="mt-3 h-4 w-full" delay={i * 0.06} />
                                <Shimmer className="mt-1.5 h-4 w-4/5" delay={i * 0.06} />
                                <Shimmer className="mt-5 h-10 w-36 rounded-lg" delay={i * 0.06} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Four-up section. */}
            <section className="bg-neutral-50 py-24 dark:bg-neutral-900/50">
                <div className="w-full px-6">
                    <div className="mb-12 space-y-3 text-center">
                        <Shimmer className="mx-auto h-8 w-64" />
                        <Shimmer className="mx-auto h-4 w-80" delay={0.05} />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                                <Shimmer className="h-10 w-10 rounded-xl" delay={i * 0.05} />
                                <Shimmer className="mt-4 h-5 w-2/3" delay={i * 0.05} />
                                <Shimmer className="mt-2 h-4 w-full" delay={i * 0.05} />
                                <Shimmer className="mt-1.5 h-4 w-3/4" delay={i * 0.05} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
