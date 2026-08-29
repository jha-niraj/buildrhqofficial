"use client";

/**
 * The standalone setup page frame.
 *
 * **Currently unreachable.** `onboarding/page.tsx` is a bare
 * `redirect('/knowme')`, so nothing renders this; setup is the Sheet on the
 * KnowMe landing page. Deleting the route is proposed as CLN-50 - it is not
 * done here because deletions get approved, not assumed.
 *
 * It is kept correct rather than left to rot: it used to hold a second full copy
 * of the wizard (645 lines), and because it was the copy nobody could reach, a
 * fix was applied to it and not to the one users actually saw. See CLN-49. All
 * it owns now is a heading and a card; the wizard is
 * `components/knowme/knowme-onboarding.tsx`.
 */

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { KnowMeProfileFull } from "@/types/knowme";
import { KnowMeOnboarding } from "@/components/knowme/knowme-onboarding";

interface OnboardingWizardProps {
    profile: KnowMeProfileFull;
    userId: string;
}

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl space-y-6">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="mb-3 flex items-center justify-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                            <Bot className="h-6 w-6" />
                        </span>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            KnowMe setup
                        </h1>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        An assistant that answers about you, to everyone else
                    </p>
                </motion.header>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <KnowMeOnboarding
                        profile={profile}
                        onComplete={() => router.push("/knowme")}
                    />
                </motion.div>
            </div>
        </div>
    );
}
