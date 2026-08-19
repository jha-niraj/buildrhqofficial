// Hand-matched to InterviewAssistantDetails (_components/interviewassistantdetails.tsx).
//
// Not a split workspace - that shape belongs to the practice routes. This page is
// a max-w-7xl column: a back button, a rounded-2xl hero card (icon tile, badge,
// big title, meta row, badge cluster, description panel), then a two-column
// TabsList (`tabData` has exactly two entries: Technical and Behavioural) above
// the question list.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="min-h-screen">
            <ShimmerStyles />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <Shimmer className="h-9 w-24 rounded-lg" />
                </div>

                {/* Hero card. */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/80">
                    <div className="border-b border-neutral-200 bg-neutral-100/40 p-8 dark:border-neutral-800/40 dark:bg-neutral-800/10">
                        <div className="flex flex-col justify-between gap-6 md:flex-row">
                            <div className="min-w-0 flex-1">
                                <div className="mb-4 flex items-center gap-4">
                                    <Shimmer className="h-12 w-12 rounded-xl" />
                                    <Shimmer className="h-7 w-28 rounded-md" delay={0.05} />
                                </div>
                                <Shimmer className="mb-4 h-10 w-full max-w-xl" delay={0.08} />
                                <div className="flex flex-wrap gap-4">
                                    {[0, 1, 2].map((i) => (
                                        <Shimmer key={i} className="h-4 w-36" delay={0.12 + i * 0.03} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-start gap-2">
                                {[0, 1, 2].map((i) => (
                                    <Shimmer key={i} className="h-8 w-28 rounded-md" delay={0.18 + i * 0.03} />
                                ))}
                            </div>
                        </div>

                        {/* Description panel. */}
                        <div className="mt-6 rounded-xl border border-neutral-200 bg-white/60 p-5 dark:border-neutral-800 dark:bg-neutral-800/60">
                            <Shimmer className="mb-2 h-5 w-40" delay={0.26} />
                            <div className="space-y-2">
                                <Shimmer className="h-4 w-full" delay={0.28} />
                                <Shimmer className="h-4 w-full" delay={0.3} />
                                <Shimmer className="h-4 w-2/3" delay={0.32} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TabsList - grid-cols-2, matching `tabData`. */}
                <div className="mb-8 grid grid-cols-2 gap-1 rounded-2xl border border-neutral-200 bg-white/90 p-1 dark:border-neutral-700/50 dark:bg-neutral-800/90">
                    <Shimmer className="h-14 rounded-xl" />
                    <Shimmer className="h-14 rounded-xl" delay={0.05} />
                </div>

                {/* Question list. */}
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/60"
                        >
                            <div className="flex items-start gap-4">
                                <Shimmer className="h-8 w-8 shrink-0 rounded-lg" delay={i * 0.05} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Shimmer className="h-5 w-4/5" delay={i * 0.05} />
                                    <Shimmer className="h-4 w-full" delay={i * 0.05} />
                                    <Shimmer className="h-4 w-3/5" delay={i * 0.05} />
                                </div>
                                <Shimmer className="h-6 w-20 shrink-0 rounded-md" delay={i * 0.05} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
