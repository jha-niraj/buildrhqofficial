"use client";

export default function SettingsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>

            <div className="flex gap-2 mb-8">
                {
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                    ))
                }
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />

                <div className="space-y-4">
                    {
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        ))
                    }
                </div>

                <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            </div>
        </div>
    );
}