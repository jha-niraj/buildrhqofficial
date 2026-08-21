"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bot, Sparkles, MessageSquare, Github, Code2, Briefcase, ChevronRight,
    Shield, Zap, Globe, BarChart3, Users, ArrowRight, Play, Database, User,
    Loader2, Check, ToggleRight, ToggleLeft, Lock, Award
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet";
import {
    initializeKnowMeProfile, updateKnowMeProfile, updateOnboardingStep,
    activateKnowMeProfile, generateProfileEmbeddings
} from "@/actions/(main)/knowme";
import toast from "@repo/ui/components/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useRouter } from "next/navigation";
import type { KnowMeProfileFull } from "@/types/knowme";

interface KnowMeLandingPageProps {
    isLoggedIn: boolean;
    profile?: KnowMeProfileFull | null;
}

const features = [
    {
        icon: MessageSquare,
        title: "24/7 AI Assistant",
        description: "Answer questions about your work anytime, even when you're asleep.",
    },
    {
        icon: Github,
        title: "Connect Platforms",
        description: "Sync data from GitHub, LeetCode, and more to enrich your AI.",
    },
    {
        icon: Code2,
        title: "Portfolio Integration",
        description: "Embed your AI chatbot directly into your personal portfolio.",
    },
    {
        icon: BarChart3,
        title: "Rich Analytics",
        description: "See who's asking about you and what they're interested in.",
    },
];

const howItWorks = [
    {
        step: 1,
        title: "Connect Your Data",
        description: "We gather your projects, assessments, and platform data",
        icon: Zap,
    },
    {
        step: 2,
        title: "AI Learns About You",
        description: "Your data is converted into intelligent knowledge",
        icon: Bot,
    },
    {
        step: 3,
        title: "Share & Impress",
        description: "Visitors can chat with your AI from anywhere",
        icon: Globe,
    },
];

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

const TOTAL_STEPS = 4;

export default function KnowMeLandingPage({ isLoggedIn, profile }: KnowMeLandingPageProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    // Auto-open sheet if profile exists with incomplete onboarding
    const [onboardingOpen, setOnboardingOpen] = useState(
        profile && !profile.onboardingCompleted && profile.status === "SETUP"
    );
    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form state
    const [includePersonalData, setIncludePersonalData] = useState(profile?.includePersonalData ?? true);
    const [includeProjects, setIncludeProjects] = useState(profile?.includeProjects ?? true);
    const [includeAssessments, setIncludeAssessments] = useState(profile?.includeAssessments ?? true);
    const [includePlatformData, setIncludePlatformData] = useState(profile?.includePlatformData ?? false);
    const [selectedPrivacy, setSelectedPrivacy] = useState<string>(profile?.privacy ?? "PUBLIC");

    const progress = (currentStep / TOTAL_STEPS) * 100;

    const handleGetStarted = async () => {
        if (!isLoggedIn) {
            router.push("/login?callbackUrl=/knowme");
            return;
        }

        setIsLoading(true);
        try {
            const result = await initializeKnowMeProfile();
            if (result.success) {
                // Check if resuming or starting fresh
                if (result.message === "Resume onboarding") {
                    toast.success("Welcome back! Let's continue setting up your AI.");
                } else {
                    toast.success("Profile initialized! Let's set up your AI.");
                }
                setOnboardingOpen(true);
            } else {
                toast.error(result.error || "Failed to initialize profile");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

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
                setOnboardingOpen(false);
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

    return (
        <>
            <div className="min-h-screen overflow-hidden">
                <section className="relative py-20 lg:py-32">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        <div
                            className={cn(
                                "absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full blur-[100px]",
                                "bg-[radial-gradient(circle,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0)_70%)]",
                                "dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0)_70%)]"
                            )}
                        />
                        <div className="absolute top-[25%] left-[5%] w-96 h-96 rounded-full blur-[120px] animate-pulse-slow bg-neutral-100/30 dark:bg-neutral-800/20" />
                        <div className="absolute top-[20%] right-[10%] w-96 h-96 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000 bg-neutral-100/40 dark:bg-neutral-800/20" />
                        <div
                            className={cn(
                                "absolute inset-0 bg-[size:32px_32px]",
                                "bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]",
                                "dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]",
                                "[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
                            )}
                        />
                    </div>
                    <div className="container mx-auto px-4 max-w-7xl relative">
                        <div className="text-center max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-neutral-200/50 dark:border-white/10 rounded-full mb-6">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                                    </span>
                                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        AI-Powered Portfolio
                                    </span>
                                </div>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-neutral-900 dark:text-white"
                            >
                                Meet{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-white dark:to-neutral-400">
                                    KnowMe
                                </span>
                                <br />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                    Your AI Portfolio Assistant
                                </span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8 font-light text-neutral-700 dark:text-neutral-300"
                            >
                                Create an intelligent AI chatbot that knows everything about your
                                professional profile. Let recruiters and visitors discover your
                                skills, projects, and experience through natural conversation.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        onClick={handleGetStarted}
                                        disabled={isLoading}
                                        className={cn(
                                            "h-14 px-8 text-base rounded-2xl font-bold transition-all duration-300",
                                            "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xl shadow-neutral-900/10",
                                            "dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                        )}
                                    >
                                        {
                                            isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Setting up...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 mr-2" />
                                                    {isLoggedIn ? "Get Started Free" : "Sign In to Start"}
                                                    <ChevronRight className="w-5 h-5 ml-1" />
                                                </>
                                            )
                                        }
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className={cn(
                                            "h-14 px-8 text-base rounded-2xl backdrop-blur-md transition-all duration-300",
                                            "border-neutral-300 bg-white/50 text-neutral-900 hover:bg-white/80",
                                            "dark:border-neutral-700 dark:bg-black/50 dark:text-white dark:hover:bg-white/10 dark:hover:border-neutral-500"
                                        )}
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Watch Demo
                                    </Button>
                                </motion.div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>500+ developers using</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>10K+ questions answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    <span>100+ recruiters engaged</span>
                                </div>
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                            className="mt-16 relative"
                        >
                            <div className="relative max-w-4xl mx-auto">
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                        </div>
                                        <div className="flex-1 mx-4">
                                            <div className="bg-white dark:bg-neutral-800 rounded-lg px-4 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2 max-w-md mx-auto">
                                                <Shield className="w-3 h-3 text-neutral-400" />
                                                shipithq.com/knowme/yourname
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-neutral-50 dark:bg-neutral-900 min-h-[300px]">
                                        <div className="max-w-md mx-auto space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-sm">
                                                    <Bot className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
                                                    <p className="text-sm text-neutral-700 dark:text-neutral-200">
                                                        Hi! 👋 I&apos;m the AI assistant for <strong>John Developer</strong>.
                                                        Ask me anything about his skills, projects, or experience!
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 justify-end">
                                                <div className="bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-none p-4 max-w-xs">
                                                    <p className="text-sm">
                                                        What&apos;s his experience with React?
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-sm">
                                                    <Bot className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
                                                    <p className="text-sm text-neutral-700 dark:text-neutral-200">
                                                        I have 3+ years of React experience! I&apos;ve built 5 production apps
                                                        including an e-commerce platform with 10K+ users.
                                                        <br /><br />
                                                        📊 <strong>95%</strong> on React Assessment
                                                        <br />
                                                        🔗 View my projects →
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-4 -left-4 bg-white dark:bg-neutral-800 rounded-xl px-4 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700"
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-neutral-500 animate-pulse" />
                                        <span className="text-neutral-600 dark:text-neutral-300">Always available</span>
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -bottom-4 -right-4 bg-white dark:bg-neutral-800 rounded-xl px-4 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700"
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <Sparkles className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                        <span className="text-neutral-600 dark:text-neutral-300">AI-powered answers</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </section>
                <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100/60 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-full backdrop-blur-sm mb-4">
                                <Zap className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Features</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                                Everything you need to stand out
                            </h2>
                            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                                KnowMe combines your professional data with AI to create
                                an intelligent assistant that represents you perfectly.
                            </p>
                        </motion.div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {
                                features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        whileHover={{ y: -5 }}
                                        className="group bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-xl transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <feature.icon className="w-6 h-6 text-white dark:text-neutral-900" />
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {feature.description}
                                        </p>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </section>
                <section className="py-20 bg-white dark:bg-black">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100/60 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-full backdrop-blur-sm mb-4">
                                <Bot className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">How It Works</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                                Set up in 2 minutes
                            </h2>
                            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                                Getting started is simple. Just connect your data and let AI do the rest.
                            </p>
                        </motion.div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {
                                howItWorks.map((step, index) => (
                                    <motion.div
                                        key={step.step}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="relative text-center"
                                    >
                                        {
                                            index < howItWorks.length - 1 && (
                                                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-neutral-200 dark:bg-neutral-800" />
                                            )
                                        }
                                        <div className="relative">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                <step.icon className="w-10 h-10 text-neutral-600 dark:text-neutral-300" />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-bold text-sm">
                                                {step.step}
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {step.description}
                                        </p>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </section>
                <section className="py-20 bg-neutral-900 dark:bg-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div
                            className={cn(
                                "absolute inset-0 bg-[size:32px_32px]",
                                "bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)]",
                                "dark:bg-[linear-gradient(to_right,#00000020_1px,transparent_1px),linear-gradient(to_bottom,#00000020_1px,transparent_1px)]"
                            )}
                        />
                    </div>
                    <div className="container mx-auto px-4 max-w-4xl relative text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-neutral-900 mb-4">
                                Ready to transform your portfolio?
                            </h2>
                            <p className="text-white/80 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                                Join hundreds of developers who are already using KnowMe
                                to showcase their skills in a whole new way.
                            </p>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="lg"
                                    onClick={handleGetStarted}
                                    disabled={isLoading}
                                    className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 px-8 py-6 text-lg rounded-xl shadow-lg"
                                >
                                    {isLoading ? "Setting up..." : "Create Your AI Now"}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            </div>

            <Sheet open={onboardingOpen!} onOpenChange={setOnboardingOpen}>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                    <div className="max-w-2xl mx-auto py-6">
                        <SheetHeader className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white dark:text-neutral-900" />
                                </div>
                                <SheetTitle className="text-xl font-bold">KnowMe Setup</SheetTitle>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                                Create your AI-powered portfolio assistant
                            </p>
                        </SheetHeader>
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400">
                                    Step {currentStep} of {TOTAL_STEPS}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-400">
                                    {Math.round(progress)}% complete
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6 overflow-y-auto max-h-[calc(85vh-280px)]">
                            {
                                currentStep === 1 && (
                                    <WelcomeStep onNext={handleNext} isLoading={isLoading} />
                                )
                            }
                            {
                                currentStep === 2 && (
                                    <DataSourcesStep
                                        includePersonalData={includePersonalData}
                                        setIncludePersonalData={setIncludePersonalData}
                                        includeProjects={includeProjects}
                                        setIncludeProjects={setIncludeProjects}
                                        includeAssessments={includeAssessments}
                                        setIncludeAssessments={setIncludeAssessments}
                                    />
                                )
                            }
                            {
                                currentStep === 3 && (
                                    <PlatformsStep
                                        includePlatformData={includePlatformData}
                                        setIncludePlatformData={setIncludePlatformData}
                                    />
                                )
                            }
                            {
                                currentStep === 4 && (
                                    <PrivacyStep
                                        selectedPrivacy={selectedPrivacy}
                                        setSelectedPrivacy={setSelectedPrivacy}
                                    />
                                )
                            }
                        </div>

                        {
                            currentStep > 1 && (
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={isLoading || isProcessing}
                                        className="gap-2"
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                        Back
                                    </Button>

                                    {
                                        currentStep < TOTAL_STEPS ? (
                                            <Button
                                                onClick={handleNext}
                                                disabled={isLoading}
                                                className="gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900"
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
                                                className="gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900"
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
                </SheetContent>
            </Sheet>

            {/* eslint-disable-next-line react/no-unknown-property */}
            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 4s;
                }
            `}</style>
        </>
    );
}

// Step 1: Welcome
function WelcomeStep({ onNext, isLoading }: { onNext: () => void; isLoading: boolean }) {
    return (
        <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white dark:text-neutral-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Welcome to KnowMe! 👋
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    We&apos;ll help you create an AI assistant that knows everything about your work.
                </p>
            </div>
            <div className="text-left bg-white dark:bg-neutral-800 rounded-xl p-4 space-y-3">
                <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    This takes about 2 minutes:
                </p>
                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 text-xs font-bold">
                            1
                        </div>
                        <span>Choose your data sources (30 sec)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 text-xs font-bold">
                            2
                        </div>
                        <span>Connect platforms (optional, 60 sec)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 text-xs font-bold">
                            3
                        </div>
                        <span>Set privacy preferences (30 sec)</span>
                    </div>
                </div>
            </div>
            <Button
                onClick={onNext}
                disabled={isLoading}
                className="w-full gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 py-5"
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
        <div className="space-y-4">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                    <Database className="w-6 h-6 text-white dark:text-neutral-900" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                    What should your AI know?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select the data sources to include
                </p>
            </div>
            <div className="space-y-2">
                <DataSourceOption
                    icon={<User className="w-4 h-4" />}
                    title="ShipItHQ Profile Data"
                    description="Bio, skills, and basic information"
                    enabled={includePersonalData}
                    onToggle={() => setIncludePersonalData(!includePersonalData)}
                />
                <DataSourceOption
                    icon={<Code2 className="w-4 h-4" />}
                    title="Projects"
                    description="All your ShipItHQ projects and details"
                    enabled={includeProjects}
                    onToggle={() => setIncludeProjects(!includeProjects)}
                />
                <DataSourceOption
                    icon={<Award className="w-4 h-4" />}
                    title="Assessments"
                    description="Test scores and certifications"
                    enabled={includeAssessments}
                    onToggle={() => setIncludeAssessments(!includeAssessments)}
                />
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>Tip:</strong> More data = better answers. You can always change this later.
                    </span>
                </p>
            </div>
        </div>
    );
}

// Step 3: Platform Connections
function PlatformsStep({
    includePlatformData,
    setIncludePlatformData,
}: {
    includePlatformData: boolean;
    setIncludePlatformData: (v: boolean) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                    <Github className="w-6 h-6 text-white dark:text-neutral-900" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                    Connect External Platforms
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Supercharge your AI with data from other platforms
                </p>
            </div>
            <div
                className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                    includePlatformData
                        ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-900 dark:border-white"
                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                )}
                onClick={() => setIncludePlatformData(!includePlatformData)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
                        <Github className="w-5 h-5 text-white dark:text-neutral-900" />
                    </div>
                    <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                            Enable Platform Data
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        </h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            GitHub repositories, contributions, and more
                        </p>
                    </div>
                </div>
                {
                    includePlatformData ? (
                        <ToggleRight className="w-7 h-7 text-neutral-900 dark:text-white" />
                    ) : (
                        <ToggleLeft className="w-7 h-7 text-neutral-400" />
                    )
                }
            </div>

            {
                includePlatformData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-3 space-y-2"
                    >
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Platforms will be synced after setup:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {
                                ["GitHub", "LeetCode", "StackOverflow", "LinkedIn"].map((platform) => (
                                    <div
                                        key={platform}
                                        className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg text-xs"
                                    >
                                        <div className="w-5 h-5 rounded bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center">
                                            <Code2 className="w-3 h-3" />
                                        </div>
                                        {platform}
                                    </div>
                                ))
                            }
                        </div>
                    </motion.div>
                )
            }

            <Button
                variant="ghost"
                className="w-full text-neutral-500 dark:text-neutral-400 text-sm"
                onClick={() => setIncludePlatformData(false)}
            >
                Skip for now
            </Button>
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
        <div className="space-y-4">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white dark:text-neutral-900" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                    Who can chat with your AI?
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Choose who can access your AI profile
                </p>
            </div>
            <div className="space-y-2">
                {
                    privacyOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedPrivacy === option.value;

                        return (
                            <div
                                key={option.value}
                                onClick={() => setSelectedPrivacy(option.value)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",
                                    isSelected
                                        ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-900 dark:border-white"
                                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        isSelected ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                                    )}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                                            {option.label}
                                            {
                                                'recommended' in option && option.recommended === true && (
                                                    <Badge className="text-xs bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                                        Recommended
                                                    </Badge>
                                                )
                                            }
                                        </h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    isSelected
                                        ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
                                        : "border-neutral-300 dark:border-neutral-600"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white dark:text-neutral-900" />}
                                </div>
                            </div>
                        );
                    })
                }
            </div>
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
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
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",
                enabled
                    ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-900 dark:border-white"
                    : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
            )}
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    enabled ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                )}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                        {title}
                        {
                            enabled && (
                                <Check className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                            )
                        }
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {description}
                    </p>
                </div>
            </div>
            {
                enabled ? (
                    <ToggleRight className="w-7 h-7 text-neutral-900 dark:text-white" />
                ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-400" />
                )
            }
        </div>
    );
}