"use client";

export default function AnalyticsSkeleton() {
    return (
        <div className="w-full px-4 py-8">
            <div className="mb-8">
                <div className="h-8 w-48 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-4 gap-4 mb-8">
                {
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse mb-2" />
                            <div className="h-8 w-16 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
                        </div>
                    ))
                }
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse mb-4" />
                    <div className="h-64 bg-slate-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                        {
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-10 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}