"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, Database, Github, Shield, Sparkles, ChevronRight, ChevronLeft,
    Check, User, ToggleRight, ToggleLeft, Globe, Lock, Users, Briefcase,
    Loader2, Code2, Award,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import type { KnowMeProfileFull } from "@/types/knowme";
import {
    updateKnowMeProfile, updateOnboardingStep,
    activateKnowMeProfile, generateProfileEmbeddings
} from "@/actions/(main)/knowme";

interface OnboardingWizardProps {
    profile: KnowMeProfileFull;
    userId: string;
}

const TOTAL_STEPS = 4;

const privacyOptions = [
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
        value: "RECRUITERS",
        label: "Only verified recruiters",
        description: "Best for active job search",
        icon: Briefcase,
    },
    {
        value: "PRIVATE",
        label: "Private (just for me)",
        description: "Best for testing before sharing",
        icon: Lock,
    },
] as const;

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(profile.onboardingCompleted ? 4 : Math.max(1, profile.onboardingCompleted || 1));
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form state
    const [includePersonalData, setIncludePersonalData] = useState(profile.includePersonalData);
    const [includeProjects, setIncludeProjects] = useState(true);
    const [includeAssessments, setIncludeAssessments] = useState(true);
    const [includePlatformData, setIncludePlatformData] = useState(false);
    const [selectedPrivacy, setSelectedPrivacy] = useState<string>(profile.privacy);

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const handleNext = async () => {
        if (currentStep >= TOTAL_STEPS) return;

        setIsLoading(true);
        try {
            // Save current step data
            if (currentStep === 2) {
                await updateKnowMeProfile({
                    includePersonalData,
                    includeProjects,
                    includeAssessments,
                    includePlatformData,
                });
            }

            if (currentStep === 3) {
                await updateKnowMeProfile({
                    includePlatformData,
                });
            }

            if (currentStep === TOTAL_STEPS - 1) {
                await updateKnowMeProfile({
                    privacy: selectedPrivacy as "PUBLIC" | "REGISTERED" | "RECRUITERS" | "PRIVATE",
                    isPublic: selectedPrivacy !== "PRIVATE",
                });
            }

            await updateOnboardingStep(currentStep + 1);
            setCurrentStep(prev => prev + 1);
        } catch {
            toast.error("Failed to save progress");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStep <= 1) return;
        setCurrentStep(prev => prev - 1);
    };

    const handleCreateAI = async () => {
        setIsProcessing(true);
        try {
            // Update final settings
            await updateKnowMeProfile({
                privacy: selectedPrivacy as "PUBLIC" | "REGISTERED" | "RECRUITERS" | "PRIVATE",
                isPublic: selectedPrivacy !== "PRIVATE",
            });

            // Generate embeddings
            const result = await generateProfileEmbeddings();

            if (result.success) {
                // Activate profile
                await activateKnowMeProfile();
                toast.success("Your AI assistant is ready!");
                router.push("/knowme");
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create AI");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <WelcomeStep onNext={handleNext} isLoading={isLoading} />;
            case 2:
                return (
                    <DataSourcesStep
                        includePersonalData={includePersonalData}
                        setIncludePersonalData={setIncludePersonalData}
                        includeProjects={includeProjects}
                        setIncludeProjects={setIncludeProjects}
                        includeAssessments={includeAssessments}
                        setIncludeAssessments={setIncludeAssessments}
                    />
                );
            case 3:
                return (
                    <PlatformsStep
                        includePlatformData={includePlatformData}
                        setIncludePlatformData={setIncludePlatformData}
                    />
                );
            case 4:
                return (
                    <PrivacyStep
                        selectedPrivacy={selectedPrivacy}
                        setSelectedPrivacy={setSelectedPrivacy}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
            <div className="w-full max-w-2xl space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            KnowMe Setup
                        </h1>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                        Create your AI-powered portfolio assistant
                    </p>
                </motion.div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                            Step {currentStep} of {TOTAL_STEPS}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                            {Math.round(progress)}% complete
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-8 shadow-xl"
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>

                {
                    currentStep > 1 && (
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isLoading || isProcessing}
                                className="gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </Button>

                            {
                                currentStep < TOTAL_STEPS ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={isLoading}
                                        className="gap-2 bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700"
                                    >
                                        {
                                            isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Continue
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )
                                        }
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleCreateAI}
                                        disabled={isProcessing}
                                        className="gap-2 bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700"
                                    >
                                        {
                                            isProcessing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Creating AI...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Create My AI
                                                </>
                                            )
                                        }
                                    </Button>
                                )
                            }
                        </div>
                    )
                }
            </div>
        </div>
    );
}

// Step 1: Welcome
function WelcomeStep({ onNext, isLoading }: { onNext: () => void; isLoading: boolean }) {
    return (
        <div className="text-center space-y-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center"
            >
                <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Welcome to KnowMe! 👋
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    We&apos;ll help you create an AI assistant that knows everything about your work.
                </p>
            </div>
            <div className="text-left bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
                <p className="font-medium text-slate-900 dark:text-white">
                    This takes about 2 minutes:
                </p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center text-neutral-800 dark:text-neutral-100 text-xs font-bold">
                            1
                        </div>
                        <span>Choose your data sources (30 sec)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center text-neutral-800 dark:text-neutral-100 text-xs font-bold">
                            2
                        </div>
                        <span>Connect platforms (optional, 60 sec)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center text-neutral-800 dark:text-neutral-100 text-xs font-bold">
                            3
                        </div>
                        <span>Set privacy preferences (30 sec)</span>
                    </div>
                </div>
            </div>
            <Button
                onClick={onNext}
                disabled={isLoading}
                className="w-full gap-2 bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 py-6"
                size="lg"
            >
                {
                    isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Let&apos;s Begin
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )
                }
            </Button>
        </div>
    );
}

// Step 2: Data Sources
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
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900 flex items-center justify-center">
                    <Database className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    What should your AI know about you?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select the data sources to include in your AI&apos;s knowledge base
                </p>
            </div>
            <div className="space-y-3">
                <DataSourceOption
                    icon={<User className="w-5 h-5" />}
                    title="ShipItHQ Profile Data"
                    description="Bio, skills, and basic information"
                    enabled={includePersonalData}
                    onToggle={() => setIncludePersonalData(!includePersonalData)}
                    recommended
                />
                <DataSourceOption
                    icon={<Code2 className="w-5 h-5" />}
                    title="Projects"
                    description="All your ShipItHQ projects and details"
                    enabled={includeProjects}
                    onToggle={() => setIncludeProjects(!includeProjects)}
                    recommended
                />
                <DataSourceOption
                    icon={<Award className="w-5 h-5" />}
                    title="Assessments"
                    description="Test scores and certifications"
                    enabled={includeAssessments}
                    onToggle={() => setIncludeAssessments(!includeAssessments)}
                />
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                <p className="text-sm text-neutral-800 dark:text-neutral-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>Tip:</strong> More data = better answers.
                        You can always add or remove data sources later in settings.
                    </span>
                </p>
            </div>
        </div>
    );
}

// Step 3: Platform Connections Info
function PlatformsStep({
    includePlatformData,
    setIncludePlatformData,
}: {
    includePlatformData: boolean;
    setIncludePlatformData: (v: boolean) => void;
}) {
    // Set to false by default for initial setup - platforms can be connected later
    if (includePlatformData) {
        setIncludePlatformData(false);
    }
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-pink-500 flex items-center justify-center">
                    <Github className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    External Platform Connections
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enhance your AI with data from external platforms
                </p>
            </div>

            {/* Info Card */}
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                    </div>
                    <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-800 mb-1">
                            First, let&apos;s train with ShipItHQ data
                        </h4>
                        <p className="text-sm text-neutral-700 dark:text-neutral-100">
                            Your AI will be trained on your ShipItHQ profile, projects, and assessments first. 
                            Once your AI is ready, you can connect external platforms from the Settings page.
                        </p>
                    </div>
                </div>
            </div>

            {/* Available Platforms Preview */}
            <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Platforms available in Settings:
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {
                        [
                            { name: "GitHub", icon: Github, description: "Repos & contributions" },
                            { name: "LeetCode", icon: Code2, description: "Problem solving stats" },
                            { name: "StackOverflow", icon: Code2, description: "Answers & reputation" },
                            { name: "LinkedIn", icon: Briefcase, description: "Work history" },
                        ].map((platform) => (
                            <div
                                key={platform.name}
                                className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-700 rounded-lg opacity-60"
                            >
                                <div className="w-8 h-8 rounded bg-slate-200 dark:bg-neutral-600 flex items-center justify-center">
                                    <platform.icon className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{platform.name}</p>
                                    <p className="text-xs text-slate-500">{platform.description}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                    🔒 Configure these after your AI is created
                </p>
            </div>

            {/* Tip */}
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                <p className="text-sm text-neutral-800 dark:text-neutral-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>Tip:</strong> You can also train your AI by chatting with it! 
                        Ask questions and provide corrections to improve its knowledge.
                    </span>
                </p>
            </div>
        </div>
    );
}

// Step 4: Privacy Settings
function PrivacyStep({
    selectedPrivacy,
    setSelectedPrivacy,
}: {
    selectedPrivacy: string;
    setSelectedPrivacy: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Who can chat with your AI?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Choose who can access your AI-powered profile
                </p>
            </div>
            <div className="space-y-3">
                {
                    privacyOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedPrivacy === option.value;

                        return (
                            <div
                                key={option.value}
                                onClick={() => setSelectedPrivacy(option.value)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                    isSelected
                                        ? "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-900"
                                        : "bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        isSelected ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-slate-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            {option.label}
                                            {
                                                'recommended' in option && option.recommended === true && (
                                                    <Badge className="text-xs bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                        Recommended
                                                    </Badge>
                                                )
                                            }
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                    isSelected
                                        ? "border-neutral-900 bg-neutral-900"
                                        : "border-slate-300 dark:border-neutral-600"
                                )}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        );
                    })
                }
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                You can change this anytime in settings
            </p>
        </div>
    );
}

// Data Source Option Component
function DataSourceOption({
    icon,
    title,
    description,
    enabled,
    onToggle,
    recommended = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    recommended?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                enabled
                    ? "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-900"
                    : "bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600"
            )}
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    enabled ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-slate-400"
                )}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {title}
                        {
                            recommended && enabled && (
                                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            )
                        }
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>
            {
                enabled ? (
                    <ToggleRight className="w-8 h-8 text-neutral-900 dark:text-neutral-100" />
                ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                )
            }
        </div>
    );
}