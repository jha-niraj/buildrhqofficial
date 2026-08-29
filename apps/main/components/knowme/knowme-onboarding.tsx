"use client";

/**
 * KnowMe setup - ONE definition, two entry points.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * This wizard was written twice: once in `knowme-landing.tsx` (shown in a Sheet
 * when a profile is in SETUP and the user is on /knowme) and once in
 * `onboarding/_components/onboarding-wizard.tsx`. Same four steps, same
 * handlers, same step components, ~450 duplicated lines. See CLN-49.
 *
 * Worth knowing before you go looking for the second one: `/knowme/onboarding`
 * is a bare `redirect('/knowme')`, so that copy has had NO callers for a while.
 * The Sheet is the only way a user reaches setup today. That is why the drift
 * below all ran one direction - fixes were being made to the page nobody
 * rendered. Deleting the route is proposed as CLN-50.
 *
 * They had already drifted, and not cosmetically:
 *
 *  - **KM-5 was applied to the unreachable copy.** The wizard copy was cut back
 *    to GitHub, the one platform with a real sync handler. The landing copy -
 *    the ONLY one a user can reach - went on advertising LeetCode, StackOverflow
 *    and LinkedIn, all three of which hit a `break` in the sync switch, reported
 *    success and wrote nothing. So the fix shipped, and every user still met the
 *    bug.
 *  - **KM-12 had to be made three times.** Removing one privacy option meant
 *    the same edit in the landing, the wizard and settings; each was found only
 *    because `tsc` happened to reject the type.
 *
 * ── Two fixes folded in while merging ────────────────────────────────────────
 *  - **Setup resumes.** `updateOnboardingStep` has always written
 *    `know_me_profile.onboarding_step`, and nothing has ever read it back, so
 *    closing the wizard at step 3 restarted it at step 1. The step is now part
 *    of `KnowMeProfileFull` and seeds `currentStep`.
 *  - **The platform step no longer sets state during render.** The wizard copy
 *    called `setIncludePlatformData(false)` in the middle of its render, which
 *    React warns about and which made the toggle beside it a no-op. Platforms
 *    are connected in Settings after the AI exists (KM-5), so the step is now
 *    informational and the flag is written false where the save happens.
 *
 * The caller supplies its own heading and its own container: a Sheet on the
 * landing page, a card on the standalone page. What lives here is the part that
 * must not differ - the steps, the order, the saves and the wording.
 */

import { useState } from "react";
import {
    Award, Check, ChevronRight, Code2, Database, Github, Globe, Lock, Shield,
    Sparkles, ToggleLeft, ToggleRight, User, Users,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader";
import type { KnowMeProfileFull } from "@/types/knowme";
import {
    updateKnowMeProfile, updateOnboardingStep,
    activateKnowMeProfile, generateProfileEmbeddings,
} from "@/actions/(main)/knowme";

const TOTAL_STEPS = 4;

type Privacy = "PUBLIC" | "REGISTERED" | "PRIVATE";

/**
 * `RECRUITERS` is absent, not merely unselected. This product has no recruiter
 * identity - no role, no verification, no way to become one (KM-4) - so the
 * option could only ever mean "everyone", which is silently what it meant, or
 * "nobody". Neither is what "Verified recruiters only" promised. See KM-12.
 */
const PRIVACY_OPTIONS: {
    value: Privacy;
    label: string;
    description: string;
    icon: typeof Globe;
    recommended?: boolean;
}[] = [
        {
            value: "PUBLIC",
            label: "Anyone with the link",
            description: "Best for job seekers and networking",
            icon: Globe,
            recommended: true,
        },
        {
            value: "REGISTERED",
            label: "Only logged-in users",
            description: "Best for community engagement",
            icon: Users,
        },
        {
            value: "PRIVATE",
            label: "Private (just for me)",
            description: "Best for testing before sharing",
            icon: Lock,
        },
    ];

interface KnowMeOnboardingProps {
    profile?: KnowMeProfileFull | null;
    /** Fires once the AI has been created and activated. */
    onComplete: () => void;
}

export function KnowMeOnboarding({ profile, onComplete }: KnowMeOnboardingProps) {
    // Resume where they left off. `onboardingStep` is 0 on a fresh row and can
    // in principle exceed TOTAL_STEPS if the step count ever shrinks, so it is
    // clamped rather than trusted.
    const [currentStep, setCurrentStep] = useState(() => {
        if (profile?.onboardingCompleted) return TOTAL_STEPS;
        return Math.min(Math.max(profile?.onboardingStep ?? 1, 1), TOTAL_STEPS);
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [includePersonalData, setIncludePersonalData] = useState(profile?.includePersonalData ?? true);
    const [includeProjects, setIncludeProjects] = useState(profile?.includeProjects ?? true);
    const [includeAssessments, setIncludeAssessments] = useState(profile?.includeAssessments ?? true);
    const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>(
        // A row still set to the retired RECRUITERS value has to land somewhere.
        // REGISTERED is what the server now reads it as - see `canView`.
        profile?.privacy === "RECRUITERS" ? "REGISTERED" : ((profile?.privacy as Privacy) ?? "PUBLIC"),
    );

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const handleNext = async () => {
        if (currentStep >= TOTAL_STEPS) return;

        setIsLoading(true);
        try {
            if (currentStep === 2) {
                await updateKnowMeProfile({
                    includePersonalData,
                    includeProjects,
                    includeAssessments,
                    // Always false out of setup. Platforms are connected in Settings
                    // once the AI exists, which is what step 3 now says. KM-5.
                    includePlatformData: false,
                });
            }

            if (currentStep === TOTAL_STEPS - 1) {
                await updateKnowMeProfile({ privacy: selectedPrivacy });
            }

            await updateOnboardingStep(currentStep + 1);
            setCurrentStep((prev) => prev + 1);
        } catch {
            toast.error("Failed to save progress");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStep <= 1) return;
        setCurrentStep((prev) => prev - 1);
    };

    const handleCreateAI = async () => {
        setIsProcessing(true);
        try {
            // `isPublic` is derived from `privacy` server-side - see KM-12.
            await updateKnowMeProfile({ privacy: selectedPrivacy });

            const result = await generateProfileEmbeddings();
            if (!result.success) throw new Error(result.error);

            await activateKnowMeProfile();
            toast.success("Your AI assistant is ready");
            onComplete();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create your AI");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Step {currentStep} of {TOTAL_STEPS}</span>
                    <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
                {currentStep === 1 && <WelcomeStep onNext={handleNext} isLoading={isLoading} />}
                {currentStep === 2 && (
                    <DataSourcesStep
                        includePersonalData={includePersonalData}
                        setIncludePersonalData={setIncludePersonalData}
                        includeProjects={includeProjects}
                        setIncludeProjects={setIncludeProjects}
                        includeAssessments={includeAssessments}
                        setIncludeAssessments={setIncludeAssessments}
                    />
                )}
                {currentStep === 3 && <PlatformsStep />}
                {currentStep === 4 && (
                    <PrivacyStep selectedPrivacy={selectedPrivacy} setSelectedPrivacy={setSelectedPrivacy} />
                )}
            </div>

            {/* Step 1 has its own full-width Continue inside the card, so the nav
                row would be a second button saying the same thing. */}
            {currentStep > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isLoading || isProcessing}
                        className="gap-2"
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Back
                    </Button>

                    {currentStep < TOTAL_STEPS ? (
                        <Button onClick={handleNext} disabled={isLoading} className="gap-2">
                            {isLoading ? (
                                <InlineLoader size="sm" />
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleCreateAI} disabled={isProcessing} className="gap-2">
                            {isProcessing ? (
                                <>
                                    <InlineLoader size="sm" />
                                    Creating your AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Create my AI
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

function StepHeading({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                {icon}
            </span>
            <h2 className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">{title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>
        </div>
    );
}

function WelcomeStep({ onNext, isLoading }: { onNext: () => void; isLoading: boolean }) {
    const steps = [
        "Choose your data sources (30 sec)",
        "See where platforms get connected (10 sec)",
        "Set who can chat with it (30 sec)",
    ];

    return (
        <div className="space-y-5 text-center">
            <StepHeading
                icon={<Sparkles className="h-6 w-6" />}
                title="Welcome to KnowMe"
                subtitle="An AI that answers questions about your work, to everyone else."
            />
            <div className="space-y-3 rounded-xl bg-white p-4 text-left dark:bg-neutral-800">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    This takes about a minute:
                </p>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {steps.map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                                {i + 1}
                            </span>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <Button onClick={onNext} disabled={isLoading} size="lg" className="w-full gap-2">
                {isLoading ? (
                    <InlineLoader size="sm" />
                ) : (
                    <>
                        Get started
                        <ChevronRight className="h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
    );
}

function DataSourcesStep({
    includePersonalData,
    setIncludePersonalData,
    includeProjects,
    setIncludeProjects,
    includeAssessments,
    setIncludeAssessments,
}: {
    includePersonalData: boolean;
    setIncludePersonalData: (v: boolean) => void;
    includeProjects: boolean;
    setIncludeProjects: (v: boolean) => void;
    includeAssessments: boolean;
    setIncludeAssessments: (v: boolean) => void;
}) {
    return (
        <div className="space-y-4">
            <StepHeading
                icon={<Database className="h-6 w-6" />}
                title="What should your AI know?"
                subtitle="Anything you leave out is something it will say it does not know."
            />
            <div className="space-y-2">
                <DataSourceOption
                    icon={<User className="h-4 w-4" />}
                    title="ShipItHQ profile"
                    description="Bio, skills and basic information"
                    enabled={includePersonalData}
                    onToggle={() => setIncludePersonalData(!includePersonalData)}
                    recommended
                />
                <DataSourceOption
                    icon={<Code2 className="h-4 w-4" />}
                    title="Projects"
                    description="Your ShipItHQ projects and their details"
                    enabled={includeProjects}
                    onToggle={() => setIncludeProjects(!includeProjects)}
                    recommended
                />
                <DataSourceOption
                    icon={<Award className="h-4 w-4" />}
                    title="Assessments"
                    description="Test scores and certifications"
                    enabled={includeAssessments}
                    onToggle={() => setIncludeAssessments(!includeAssessments)}
                />
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                <span>You can change any of this later in Settings, then re-index.</span>
            </p>
        </div>
    );
}

/**
 * Informational. There is nothing to toggle here.
 *
 * GitHub is the only platform with a real sync handler; the rest hit a `break`
 * in the switch and wrote nothing while reporting success (KM-5). And platforms
 * are connected AFTER the AI exists, from Settings, because the connection flow
 * needs a profile to attach to. So this step tells the user where that happens
 * rather than offering a switch that setup would override anyway.
 */
function PlatformsStep() {
    return (
        <div className="space-y-4">
            <StepHeading
                icon={<Github className="h-6 w-6" />}
                title="Platforms come later"
                subtitle="Your AI trains on your ShipItHQ work first."
            />
            <div className="space-y-3 rounded-xl bg-white p-4 dark:bg-neutral-800">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Once your AI is created you can connect external accounts from Settings, and
                    re-index to fold them in.
                </p>
                <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-200 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200">
                        <Github className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">GitHub</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Repositories and contributions
                        </p>
                    </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    GitHub is the only one connected today. More sources are coming.
                </p>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-white p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                    <strong className="font-medium text-neutral-900 dark:text-white">Tip:</strong>{" "}
                    you can also train it by chatting with it and correcting the answers.
                </span>
            </p>
        </div>
    );
}

function PrivacyStep({
    selectedPrivacy,
    setSelectedPrivacy,
}: {
    selectedPrivacy: Privacy;
    setSelectedPrivacy: (v: Privacy) => void;
}) {
    return (
        <div className="space-y-4">
            <StepHeading
                icon={<Shield className="h-6 w-6" />}
                title="Who can chat with your AI?"
                subtitle="This is enforced on the public link, not just recorded."
            />
            <div className="space-y-2">
                {PRIVACY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedPrivacy === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedPrivacy(option.value)}
                            aria-pressed={isSelected}
                            className={cn(
                                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                                isSelected
                                    ? "border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800"
                                    : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600",
                            )}
                        >
                            <span className="flex min-w-0 items-center gap-3">
                                <span className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    isSelected
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                        : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
                                )}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white">
                                        {option.label}
                                        {option.recommended && (
                                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                                        )}
                                    </span>
                                    <span className="block text-xs text-neutral-600 dark:text-neutral-400">
                                        {option.description}
                                    </span>
                                </span>
                            </span>
                            <span className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                isSelected
                                    ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
                                    : "border-neutral-300 dark:border-neutral-600",
                            )}>
                                {isSelected && <Check className="h-3 w-3 text-white dark:text-neutral-900" />}
                            </span>
                        </button>
                    );
                })}
            </div>
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                You can change this any time in Settings.
            </p>
        </div>
    );
}

function DataSourceOption({
    icon,
    title,
    description,
    enabled,
    onToggle,
    recommended,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    recommended?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                enabled
                    ? "border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800"
                    : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600",
            )}
        >
            <span className="flex min-w-0 items-center gap-3">
                <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    enabled
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
                )}>
                    {icon}
                </span>
                <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white">
                        {title}
                        {recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        )}
                    </span>
                    <span className="block text-xs text-neutral-600 dark:text-neutral-400">
                        {description}
                    </span>
                </span>
            </span>
            {enabled ? (
                <ToggleRight className="h-7 w-7 shrink-0 text-neutral-900 dark:text-white" />
            ) : (
                <ToggleLeft className="h-7 w-7 shrink-0 text-neutral-500 dark:text-neutral-400" />
            )}
        </button>
    );
}

export default KnowMeOnboarding;
