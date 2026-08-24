"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

/**
 * Console-level error boundary. Nothing in this repo ships a shared one
 * (gurukul's `AppErrorView` is built on `@repo/errors`, which this repo
 * doesn't have - see plan/admin/overview.md's Out of scope section), so this
 * is written fresh, kept deliberately plain: a full-height page taking over
 * an error boundary is already the unusual case, and it should look like a
 * dead end with one way out, not another styled surface competing for
 * attention.
 *
 * `error.message` is never rendered - a Drizzle failure can carry SQL, column
 * or table names, and this reaches the same audience as everything else in
 * the console, which is not a reason to relax that. Only `error.digest` is
 * shown, so a report can be correlated with a server log line.
 */
export default function ConsoleError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("[console]", error)
    }, [error])

    return (
        <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                <AlertTriangle className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </span>
            <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Something went wrong</h2>
                <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                    This page hit an error loading its data. It's usually transient - try again.
                </p>
                {error.digest && (
                    <p className="pt-1 font-mono text-xs text-neutral-400 dark:text-neutral-600">Ref: {error.digest}</p>
                )}
            </div>
            <button
                type="button"
                onClick={reset}
                className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
            </button>
        </div>
    )
}
