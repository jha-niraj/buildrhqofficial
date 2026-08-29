"use client";

import { motion } from "framer-motion";

export default function OnboardingSkeleton() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-neutral-800 to-neutral-800"
                        initial={{ width: "0%" }}
                        animate={{ width: "40%" }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                    </div>

                    <div className="h-8 w-48 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-4" />

                    <div className="h-4 w-72 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8" />

                    <div className="space-y-4">
                        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                    </div>
                    <div className="mt-8 flex justify-between">
                        <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}