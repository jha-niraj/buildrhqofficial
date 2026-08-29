"use client";

/** Matches `public-chat-interface.tsx`: the same full-height card, header and composer. */

import { Skeleton } from "@repo/ui/components/ui/skeleton";

export default function PublicChatSkeleton() {
    return (
        <div className="mx-auto flex h-dvh min-h-0 w-full max-w-5xl flex-col px-4 py-4 sm:px-6">
            <Skeleton className="mb-3 h-8 w-36 shrink-0 rounded-md" />

            <div className="mx-auto flex w-full min-h-0 max-w-4xl flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-6 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-4 py-10">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                    <div className="mt-3 grid w-full max-w-3xl gap-2.5 sm:grid-cols-2">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                    </div>
                </div>

                <div className="shrink-0 border-t border-neutral-200 p-3 sm:px-6 dark:border-neutral-800">
                    <Skeleton className="h-11 w-full rounded-2xl" />
                    <Skeleton className="mx-auto mt-2 h-3 w-80 max-w-full" />
                </div>
            </div>
        </div>
    );
}
