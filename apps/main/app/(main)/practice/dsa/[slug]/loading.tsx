// Hand-matched to the DSA practice workspace.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
            <ShimmerStyles />
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-3">
                    <Shimmer className="h-7 w-7 rounded-lg" />
                    <Shimmer className="h-4 w-48" delay={0.05} />
                </div>
                <div className="flex items-center gap-2">
                    <Shimmer className="h-8 w-24 rounded-lg" delay={0.1} />
                    <Shimmer className="h-8 w-20 rounded-lg" delay={0.14} />
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <div className="min-h-0 w-full space-y-4 overflow-hidden border-border p-5 lg:w-1/2 lg:border-r">
                    <Shimmer className="h-6 w-2/3" />
                    <div className="flex gap-2">
                        <Shimmer className="h-5 w-16 rounded-full" delay={0.06} />
                        <Shimmer className="h-5 w-20 rounded-full" delay={0.09} />
                    </div>
                    <div className="space-y-2 pt-2">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Shimmer key={i} className="h-4 w-full" delay={i * 0.04} />
                        ))}
                        <Shimmer className="h-4 w-3/5" delay={0.4} />
                    </div>
                    <Shimmer className="h-28 w-full rounded-xl" delay={0.45} />
                </div>
                <div className="min-h-0 w-full flex-1 p-5 lg:w-1/2">
                    <Shimmer className="h-full min-h-[320px] w-full rounded-xl" delay={0.12} />
                </div>
            </div>
        </div>
    );
}
