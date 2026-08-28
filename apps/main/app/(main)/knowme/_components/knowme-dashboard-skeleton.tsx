"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

export default function KnowMeDashboardSkeleton() {
    return (
        <div className="w-full px-4 py-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div>
                            <Skeleton className="h-7 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
            </motion.div>
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div>
                                    <Skeleton className="h-5 w-32 mb-1" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px] p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white dark:from-neutral-900 dark:to-neutral-900">
                            <div className="flex gap-3">
                                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                <Skeleton className="h-20 w-3/4 rounded-2xl" />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Skeleton className="h-12 w-1/2 rounded-2xl" />
                            </div>
                            <div className="flex gap-3">
                                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                <Skeleton className="h-24 w-2/3 rounded-2xl" />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                            <div className="flex gap-3">
                                <Skeleton className="h-10 flex-1 rounded-xl" />
                                <Skeleton className="h-10 w-10 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <Skeleton className="h-9 w-44" />
                        <Skeleton className="h-9 w-40" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <Skeleton className="h-5 w-20 mb-4" />
                        <div className="space-y-4">
                            {
                                [1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <Skeleton className="h-5 w-28 mb-4" />
                        <div className="space-y-3">
                            {
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="w-5 h-5" />
                                    </div>
                                ))
                            }
                        </div>
                        <Skeleton className="h-9 w-full mt-4" />
                    </div>

                    <Skeleton className="h-36 rounded-2xl" />

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}