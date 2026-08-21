"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Loader2, FileText, Sparkles, Users, Zap, ChevronRight, Upload, Clock,
    Calendar, ArrowRight, ChevronDown, Target, Brain, Code, MessageSquare,
    Shield, CheckCircle, Globe, ChevronUp, FileQuestion, Cpu
} from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Label } from "@repo/ui/components/ui/label"
import toast from '@repo/ui/components/ui/sonner'
import { useUserStore } from "@/app/store/useUserStore"
import {
    getRecentGenerations, getPublicInterviewPlans, purchaseInterviewPlan
} from "@/actions/(main)/ai/jobinterview.action"
import { GenerationSheet } from "./generation-sheet"
import { InterviewPlanCard, type BaseInterviewPlan } from "./interviewplancard"
import DocumentUploadDialog from "@/app/(main)/profile/_components/documentupload"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { uploadResume } from "@/actions/(main)/user/resume.action"

// --- Interfaces ---
interface Generation {
    id: string
    position: string
    createdAt: string
    jobDescription: string
    companyUrl: string
    companyInfo: Record<string, unknown> | null
    generatedContent: {
        technicalQuestions: Array<{
            question: string
            answer?: string
            difficulty: "Easy" | "Medium" | "Hard"
            category: string
        }>
        behavioralQuestions: Array<{
            question: string
            answer?: string
            tips?: string
        }>
        codingQuestions: Array<{
            question: string
            answer?: string
            difficulty: "Easy" | "Medium" | "Hard"
        }>
    }
    includeAnswers: boolean
    searchHash: string | null
    updatedAt: string
    userId: string
    slug: string
}

interface GenerationResponse {
    success: boolean
    data?: Generation[]
    error?: string
}

// --- Constants ---
const features = [
    {
        icon: Brain,
        title: "Technical Deep Dives",
        description: "Role-specific architecture & Learn questions.",
        color: "text-neutral-900",
        bg: "bg-neutral-900/10"
    },
    {
        icon: Code,
        title: "Coding Challenges",
        description: "Real-world problems with AI solution analysis.",
        color: "text-neutral-900",
        bg: "bg-neutral-900/10"
    },
    {
        icon: MessageSquare,
        title: "Behavioral Mastery",
        description: "STAR method scenarios with soft-skill feedback.",
        color: "text-neutral-900",
        bg: "bg-neutral-900/10"
    },
    {
        icon: Target,
        title: "Company Targeting",
        description: "Questions tailored to specific company cultures.",
        color: "text-neutral-900",
        bg: "bg-neutral-900/10"
    }
]

export default function JobInterviewAssistant() {
    const router = useRouter()
    const { user, fetchUser } = useUserStore()
    const [position, setPosition] = useState("")
    const [showOptional, setShowOptional] = useState(false)
    const [jobDescription, setJobDescription] = useState("")
    const [companyUrl, setCompanyUrl] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showGenerationSheet, setShowGenerationSheet] = useState(false)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [isUploadingResume, setIsUploadingResume] = useState(false)
    const [recentGenerations, setRecentGenerations] = useState<Generation[]>([])
    const [publicPlans, setPublicPlans] = useState<BaseInterviewPlan[]>([])
    const [publicPlansLoading, setPublicPlansLoading] = useState(true)
    const [purchasingId, setPurchasingId] = useState<string | null>(null)

    // --- Effects & Data Fetching ---
    useEffect(() => {
        fetchUser()
        fetchRecentGenerations()
        fetchPublicPlans()
    }, [fetchUser])

    const fetchRecentGenerations = async () => {
        try {
            const response = (await getRecentGenerations()) as GenerationResponse
            if (response.success && response.data) {
                setRecentGenerations(response.data)
            }
        } catch (error) {
            console.error("Error fetching recent generations:", error)
        }
    }

    const fetchPublicPlans = async () => {
        try {
            const response = await getPublicInterviewPlans(6)
            if (response.success && response.data) {
                setPublicPlans(response.data.map(plan => ({
                    ...plan,
                    description: plan.description || undefined,
                    originalCost: plan.originalCost || undefined,
                    createdAt: typeof plan.createdAt === 'string' ? plan.createdAt : plan.createdAt.toISOString()
                })))
            }
        } catch (error) {
            console.error("Error fetching public plans:", error)
        } finally {
            setPublicPlansLoading(false)
        }
    }

    // --- Handlers ---
    const handlePurchase = async (plan: BaseInterviewPlan) => {
        setPurchasingId(plan.id)
        try {
            const response = await purchaseInterviewPlan(plan.id)
            if (response.success && response.data) {
                toast.success(`Successfully purchased ${plan.position}!`)
                router.push(`/ai/jobinterviewassistant/${response.data.slug}`)
            } else {
                toast.error(response.error || 'Failed to purchase plan')
            }
        } catch {
            toast.error('An error occurred while purchasing the plan')
        } finally {
            setPurchasingId(null)
        }
    }

    const handleGenerationStart = (e: React.FormEvent) => {
        e.preventDefault()
        setShowGenerationSheet(true)
    }

    const handleGenerate = useCallback(async (includeAnswers: boolean, includePractice: boolean, counts: { technical: number; behavioral: number; coding: number }, makePublic: boolean = false) => {
        setShowGenerationSheet(false)
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/job-interview/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    position,
                    jobDescription,
                    companyUrl,
                    includeAnswers,
                    includePractice,
                    counts,
                    makePublic
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to generate interview questions');
            }

            if (data.data?.slug) {
                toast.success('Interview questions generated successfully!')
                window.location.href = `/ai/jobinterviewassistant/${data.data.slug}`
            } else {
                toast.error('Generation completed but redirect failed - check console for details');
            }

        } catch (error) {
            console.error('Generation error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to generate interview questions')
        } finally {
            setIsLoading(false)
        }
    }, [position, jobDescription, companyUrl])

    const handleUploadResume = async (file: File) => {
        setIsUploadingResume(true)
        try {
            const result = await uploadResume(file)
            if (result.success) {
                toast.success("Resume uploaded successfully!")
                fetchUser()
                setShowUploadDialog(false)
            } else {
                toast.error("Failed to upload resume")
            }
        } catch (error) {
            console.error("Error uploading resume:", error)
            toast.error("An error occurred while uploading the resume")
        } finally {
            setIsUploadingResume(false)
        }
    }

    return (
        <div className="font-sans selection:bg-neutral-100 dark:selection:bg-neutral-800/50">
            {/* Background Decor Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neutral-900/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-900/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                        <span>AI-Powered Career Architect</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Master Your Next <br className="hidden md:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 via-neutral-800 to-neutral-800 dark:from-neutral-100 dark:via-neutral-100 dark:to-neutral-100">
                            Technical Interview
                        </span>
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Generate tailored questions, coding challenges, and behavioral scenarios based on your target role and company.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Main Inputs (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Resume Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-xl p-8 border border-neutral-100 dark:border-neutral-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FileText className="w-24 h-24 text-neutral-900 dark:text-white" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                            Resume Context
                                        </h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md">
                                            Upload your resume to let our AI tailor questions specifically to your past experience and skills.
                                        </p>
                                    </div>

                                    <div>
                                        {user?.resume ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <Link href={user.resume} target="_blank">
                                                    <Button className="bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-100 dark:border-neutral-800/50 dark:hover:bg-neutral-800/50 h-11 px-6">
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Resume Active
                                                    </Button>
                                                </Link>
                                                <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">Ready for analysis</span>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => setShowUploadDialog(true)}
                                                variant="outline"
                                                className="h-11 border-dashed border-2 px-6 hover:border-neutral-900 hover:text-neutral-800 dark:hover:text-neutral-100 dark:border-neutral-700 transition-all"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload PDF Resume
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Configuration Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-xl p-8 border border-neutral-100 dark:border-neutral-800">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                                        <Cpu className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                                        Interview Configuration
                                    </h2>
                                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                                        Define the parameters for your mock interview session.
                                    </p>
                                </div>

                                <form onSubmit={handleGenerationStart} className="space-y-8">
                                    {/* Position Input */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold text-neutral-900 dark:text-neutral-200 flex justify-between">
                                            Target Role / Position
                                            <span className="text-xs font-normal text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded">Required</span>
                                        </Label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
                                            <Input
                                                placeholder="e.g. Senior Frontend Engineer, Product Manager, Data Scientist"
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                required
                                                className="pl-12 h-14 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg text-lg focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced/Optional Toggle */}
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowOptional(!showOptional)}
                                            className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-100 transition-colors mb-6"
                                        >
                                            {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            {showOptional ? "Hide Advanced Options" : "Show Advanced Options (Recommended)"}
                                        </button>

                                        <AnimatePresence>
                                            {showOptional && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden space-y-6"
                                                >
                                                    <div className="grid gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-neutral-900 dark:text-neutral-200 font-medium">Job Description</Label>
                                                            <Textarea
                                                                placeholder="Paste the full job description here. The AI will analyze keywords, tech stack requirements, and soft skills to generate highly relevant questions."
                                                                value={jobDescription}
                                                                onChange={(e) => setJobDescription(e.target.value)}
                                                                className="min-h-[150px] bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 resize-none p-4"
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-neutral-900 dark:text-neutral-200 font-medium">Company Website (URL)</Label>
                                                            <div className="relative">
                                                                <Globe className="absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
                                                                <Input
                                                                    placeholder="https://company.com"
                                                                    value={companyUrl}
                                                                    onChange={(e) => setCompanyUrl(e.target.value)}
                                                                    className="pl-11 h-11 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading || !position}
                                        className="w-full h-14 text-lg font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Analyzing Role Requirements...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 relative z-10">
                                                <Sparkles className="w-5 h-5" />
                                                <span>Generate Interview Plan</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                        {/* Subtle gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/0 via-neutral-900/10 to-neutral-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Recent Generations Widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-xl p-6 border border-neutral-100 dark:border-neutral-800 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                        Recent Sessions
                                    </h3>
                                    <Link href="/ai/jobinterviewassistant/generations" className="text-xs font-medium text-neutral-800 dark:text-neutral-100 hover:underline">
                                        View All
                                    </Link>
                                </div>

                                <div className="space-y-3 flex-1">
                                    {recentGenerations.length > 0 ? (
                                        recentGenerations.slice(0, 4).map((gen) => (
                                            <Link href={`/ai/jobinterviewassistant/${gen.slug}`} key={gen.id}>
                                                <div className="group p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all cursor-pointer">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1 group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors">
                                                            {gen.position}
                                                        </p>
                                                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(gen.createdAt), "MMM d")}
                                                        </span>
                                                        {gen.includeAnswers && (
                                                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100 px-1.5 py-0.5 rounded-full font-medium">
                                                                With Answers
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-neutral-400">
                                            <p className="text-sm">No recent sessions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Features Widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-xl p-6 border border-neutral-100 dark:border-neutral-800">
                                <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                    Included Features
                                </h3>
                                <div className="space-y-4">
                                    {features.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">{item.title}</h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Section: Public Plans */}
                <div className="mt-20 border-t border-neutral-200 dark:border-neutral-800 pt-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Community Interview Plans</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                High-quality interview roadmaps created by the community.
                            </p>
                        </div>
                        <Link href="/ai/jobinterviewassistant/publicgenerations">
                            <Button variant="outline" className="gap-2 border-neutral-200 dark:border-neutral-700">
                                <Users className="w-4 h-4" />
                                Browse All Plans
                            </Button>
                        </Link>
                    </div>

                    {publicPlansLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                            ))}
                        </div>
                    ) : publicPlans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publicPlans.map((plan) => (
                                <InterviewPlanCard
                                    key={plan.id}
                                    plan={plan}
                                    primaryLabel={purchasingId === plan.id ? "Processing..." : "Unlock Plan"}
                                    onPrimary={handlePurchase}
                                    disabled={purchasingId === plan.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                            <FileQuestion className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No community plans yet</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm mx-auto mt-2">
                                Be the first to generate a comprehensive interview plan and share it with the community!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs and Sheets */}
            <GenerationSheet
                open={showGenerationSheet}
                onClose={() => setShowGenerationSheet(false)}
                onConfirm={handleGenerate}
                userCredits={user?.credits || 0}
            />
            <DocumentUploadDialog
                isOpen={showUploadDialog}
                onClose={() => setShowUploadDialog(false)}
                onUpload={handleUploadResume}
                isUploading={isUploadingResume}
            />
        </div>
    )
}