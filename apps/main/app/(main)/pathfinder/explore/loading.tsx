// Matches the CONTENT PANE only.
//
// `explore/layout.tsx` renders the 320px goal sidebar itself as a server
// component, so this skeleton stands in for `page.tsx` alone - the pane to its
// right. It previously rendered `mx-auto max-w-7xl px-6 py-8` with a centred
// `max-w-3xl` column and a 2-up card grid: a whole-page layout drawn inside one
// pane, which then collapsed into a centred empty state when the real content
// arrived.
import { Shimmer, ShimmerStyles } from "@repo/ui/components/skeleton-kit"

export default function Loading() {
    return (
        <div className="flex h-full items-center justify-center p-8">
            <ShimmerStyles />
            <div className="flex flex-col items-center text-center">
                <Shimmer className="h-16 w-16 rounded-2xl" />
                <Shimmer className="mt-6 h-6 w-52" delay={0.06} />
                <Shimmer className="mt-3 h-4 w-80" delay={0.1} />
                <Shimmer className="mt-1.5 h-4 w-64" delay={0.12} />
                <div className="mt-6 flex items-center gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Shimmer key={i} className="h-4 w-16" delay={0.14 + i * 0.04} />
                    ))}
                </div>
            </div>
        </div>
    )
}
