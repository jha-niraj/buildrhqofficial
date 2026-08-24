/** Skeleton for /compare: a ledger hero (copy, then a four-fact row) over a two-card grid. */
export default function Loading() {
    return (
        <div className="animate-pulse">
            <div className="bg-neutral-100 dark:bg-neutral-900">
                <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
                    <div className="max-w-2xl">
                        <div className="h-3 w-20 rounded bg-neutral-300 dark:bg-neutral-800" />
                        <div className="mt-4 h-12 w-full rounded bg-neutral-300 dark:bg-neutral-800" />
                        <div className="mt-3 h-12 w-2/3 rounded bg-neutral-300 dark:bg-neutral-800" />
                        <div className="mt-6 h-4 w-full max-w-lg rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="mt-8 flex gap-3">
                            <div className="h-11 w-32 rounded-full bg-neutral-300 dark:bg-neutral-800" />
                            <div className="h-11 w-36 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-neutral-900/25 pt-8 sm:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <div className="h-8 w-16 rounded bg-neutral-300 dark:bg-neutral-800" />
                                <div className="mt-2 h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
                <div className="grid gap-5 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-neutral-200 p-7 dark:border-neutral-800">
                            <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
                            <div className="mt-3 h-6 w-48 rounded bg-neutral-300 dark:bg-neutral-800" />
                            <div className="mt-4 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                            <div className="mt-2 h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                            <div className="mt-6 h-4 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                    ))}
                </div>
                <div className="mt-16 h-64 rounded-2xl border border-neutral-200 dark:border-neutral-800" />
            </div>
        </div>
    )
}
