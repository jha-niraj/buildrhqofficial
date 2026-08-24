// Hand-matched to System Settings: header + "Clear Cache" button, and a
// flat list of 5 setting rows (title + description + one control each -
// a toggle or a number field, not a form). The previous skeleton assumed
// three card sections each with a 3-field form and its own Save button,
// and dropped the header button entirely - neither matches this page
// (ADM-22).
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="p-6">
            <ShimmerStyles />
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Shimmer className="h-8 w-52" />
                        <Shimmer className="h-4 w-64" delay={0.06} />
                    </div>
                    <Shimmer className="h-9 w-32 rounded-lg" delay={0.1} />
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
                            <Shimmer className="h-4.5 w-40" delay={i * 0.05} />
                            <Shimmer className="mt-1.5 h-3.5 w-64" delay={i * 0.05} />
                            <Shimmer className="mt-3 h-6 w-24 rounded-full" delay={i * 0.05} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
