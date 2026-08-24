// Hand-matched to My Admin Profile: header (no button), a profile-info card
// (avatar + name/email/role, not a form), an "Access Permissions" 2-col
// grid of module cards, and a change-password card with a 3-field form -
// not three identical 4-field form sections, which is what the previous
// skeleton assumed (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 space-y-2">
                    <Shimmer className="h-8 w-52" />
                    <Shimmer className="h-4 w-80" delay={0.06} />
                </div>

                <div className="mb-8 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                    <div className="flex items-center gap-4">
                        <Shimmer className="h-14 w-14 shrink-0 rounded-full" />
                        <div className="space-y-2">
                            <Shimmer className="h-4.5 w-32" />
                            <Shimmer className="h-3.5 w-44" delay={0.04} />
                            <Shimmer className="h-4 w-24 rounded-full" delay={0.08} />
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <Shimmer className="mb-3 h-5 w-40" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <Shimmer className="h-4 w-24" delay={i * 0.05} />
                                    <Shimmer className="h-4 w-4" delay={i * 0.05} />
                                </div>
                                <div className="flex gap-2">
                                    <Shimmer className="h-5 w-14 rounded-full" delay={i * 0.05} />
                                    <Shimmer className="h-5 w-14 rounded-full" delay={i * 0.05} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                    <Shimmer className="mb-4 h-5 w-40" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Shimmer className="h-3.5 w-32" />
                            <Shimmer className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Shimmer className="h-3.5 w-24" />
                            <Shimmer className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Shimmer className="h-3.5 w-28" />
                            <Shimmer className="h-10 w-full rounded-lg" />
                        </div>
                    </div>
                    <Shimmer className="mt-5 h-10 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
