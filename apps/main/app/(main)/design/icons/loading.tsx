// Matches the gallery: a header block, then a grid of square cards. The rule in
// CLAUDE.md is that a skeleton which does not match is worse than none, because
// the page visibly reflows when the real thing arrives.
export default function Loading() {
    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <div className="shrink-0 space-y-3 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
                <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex gap-3 pt-1">
                    <div className="h-9 w-56 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-9 w-44 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-9 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
            </div>
            <div className="space-y-8 p-6">
                {[0, 1].map((s) => (
                    <div key={s}>
                        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-[104px] animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
