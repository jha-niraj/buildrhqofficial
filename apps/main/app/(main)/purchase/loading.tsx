// Matched to the REDESIGNED purchase page (CR-13): a title row with the currency
// toggle and compact custom control, then the pack cards, then the FAQ list.
//
// It previously described the old layout - a hero custom-amount panel and a row
// of trust badges - and leaving it would produce exactly the reflow the rule in
// CLAUDE.md exists to prevent: the skeleton drawing one page and the real thing
// replacing it with another.
export default function Loading() {
    return (
        <div className="w-full px-6 pt-6 pb-16">
            <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div className="space-y-3">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-12 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-4 w-96 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="h-8 w-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-9 w-56 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-8 w-36 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
            </div>

            <div className="mb-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                ))}
            </div>

            <div>
                <div className="h-6 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="mt-6 space-y-px">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse bg-neutral-200 dark:bg-neutral-800" />
                    ))}
                </div>
            </div>
        </div>
    )
}
