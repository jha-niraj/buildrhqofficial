// Hand-matched to the interview journey shell.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit";

export default function Loading() {
    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
            <ShimmerStyles />
            <div className="flex shrink-0 items-center gap-4 border-b border-border px-6 py-4">
                <Shimmer className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                    <Shimmer className="h-4 w-48" delay={0.05} />
                    <Shimmer className="h-3 w-32" delay={0.08} />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-1 items-center gap-2">
                        <Shimmer className="h-8 w-8 shrink-0 rounded-full" delay={i * 0.06} />
                        <Shimmer className="h-3.5 flex-1" delay={i * 0.06} />
                    </div>
                ))}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-6">
                <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
                    <Shimmer className="h-7 w-2/3" />
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Shimmer key={i} className="h-4 w-full" delay={i * 0.04} />
                    ))}
                </div>
            </div>
        </div>
    );
}
