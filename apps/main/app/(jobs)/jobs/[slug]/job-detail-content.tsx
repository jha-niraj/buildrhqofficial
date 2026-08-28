"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    ArrowLeft, MapPin, Clock, ExternalLink, Mic, CheckCircle2,
    ChevronRight, Play, Heart, Share2, TrendingUp, Users, FileText,
    Phone, Layout, MessageSquare, Star, Calendar, Globe,
    Award, Zap, Target, BookOpen, Code, Building2, LucideIcon
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import Link from "next/link"
import {
    showInterest, saveJob, unsaveJob
} from "@/actions/jobs"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface Job {
    id: string
    title: string
    slug: string
    description: string | null
    responsibilities: string[]
    requirements: string[]
    niceToHave: string[]
    benefits: string[]
    company: {
        id: string
        name: string
        slug: string
        logoUrl: string | null
        website: string | null
        industry: string | null
        companySize: string | null
        description: string | null
        verificationStatus: string
    }
    location: string | null
    locationType: string
    employmentType: string
    experienceMin: number | null
    experienceMax: number | null
    salaryMin: number | null
    salaryMax: number | null
    salaryCurrency: string
    salaryDisclosed: boolean
    skillsRequired: string[]
    hasAssignment: boolean
    applicationsCount: number
    publishedAt: Date | null
    interviewProcess: {
        id: string
        name: string
        description: string | null
        estimatedDurationWeeks: number | null
        rounds: Array<{
            id: string
            roundNumber: number
            title: string
            roundType: string
            description: string | null
            durationMinutes: number | null
            format: string | null
            hasMockInterview: boolean
            tipsForCandidates: string[] | null
        }>
    } | null
    isSaved: boolean
    hasApplied: boolean
    applicationStatus: string | null
}

interface JobDetailContentProps {
    job: Job
}

const locationTypeLabels: Record<string, string> = {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ONSITE: "On-site"
}

const employmentTypeLabels: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
    FREELANCE: "Freelance"
}

const roundTypeIcons: Record<string, LucideIcon> = {
    PHONE_SCREEN: Phone,
    TECHNICAL_CODING: Code,
    SYSTEM_DESIGN: Layout,
    BEHAVIORAL: MessageSquare,
    TAKE_HOME: FileText,
    PANEL: Users,
    HIRING_MANAGER: Star,
    CULTURE_FIT: Users,
    HR_FINAL: Users,
    CUSTOM: FileText,
}

const roundTypeColors: Record<string, string> = {
    PHONE_SCREEN: "bg-neutral-900",
    TECHNICAL_CODING: "bg-neutral-900",
    SYSTEM_DESIGN: "bg-neutral-900",
    BEHAVIORAL: "bg-neutral-900",
    TAKE_HOME: "bg-neutral-900",
    PANEL: "bg-pink-500",
    HIRING_MANAGER: "bg-neutral-900",
    CULTURE_FIT: "bg-neutral-900",
    HR_FINAL: "bg-neutral-900",
    CUSTOM: "bg-neutral-500",
}

const formatLabels: Record<string, string> = {
    VOICE: "Voice Call",
    VIDEO: "Video Call",
    IN_PERSON: "In Person",
    WRITTEN: "Written",
    LIVE_CODING: "Live Coding",
    PRESENTATION: "Presentation"
}

export function JobDetailContent({ job }: JobDetailContentProps) {
    const router = useRouter()
    const [isApplying, setIsApplying] = useState(false)
    const [isSaved, setIsSaved] = useState(job.isSaved)
    const [isSaving, setIsSaving] = useState(false)
    const [hasApplied, setHasApplied] = useState(job.hasApplied)

    const formatSalary = (min: number | null, max: number | null, currency: string) => {
        if (!min && !max) return null
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        })
        if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`
        if (min) return `From ${formatter.format(min)}`
        if (max) return `Up to ${formatter.format(max)}`
        return null
    }

    const formatExperience = (min: number | null, max: number | null) => {
        if (!min && !max) return null
        if (min && max) return `${min}-${max} years`
        if (min) return `${min}+ years`
        if (max) return `Up to ${max} years`
        return null
    }

    const handleShowInterest = async () => {
        if (hasApplied) {
            router.push("/jobs/applications")
            return
        }
        setIsApplying(true)
        try {
            const result = await showInterest(job.id)
            if (result.success) {
                setHasApplied(true)
                router.push("/jobs/applications")
            }
        } catch (error) {
            console.error("Error showing interest:", error)
        } finally {
            setIsApplying(false)
        }
    }

    const handleToggleSave = async () => {
        setIsSaving(true)
        try {
            if (isSaved) {
                await unsaveJob(job.id)
                setIsSaved(false)
            } else {
                await saveJob(job.id)
                setIsSaved(true)
            }
        } catch (error) {
            console.error("Error toggling save:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} at ${job.company.name}`,
                    text: `Check out this job opportunity: ${job.title} at ${job.company.name}`,
                    url: window.location.href
                })
            } catch (error) {
                console.error("Error sharing:", error)
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    const publishedDate = job.publishedAt ? new Date(job.publishedAt) : null
    const daysAgo = publishedDate ? Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)) : null

    return (
        <div className="min-h-full">
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Jobs
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                onClick={handleToggleSave}
                                disabled={isSaving}
                            >
                                <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                onClick={handleShare}
                            >
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                                {
                                    job.company.logoUrl ? (
                                        <Image
                                            src={job.company.logoUrl}
                                            alt={job.company.name}
                                            className="w-full h-full object-cover"
                                            fill
                                        />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-neutral-600 dark:text-neutral-400" />
                                    )
                                }
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
                                    {job.title}
                                </h1>
                                <Link
                                    href={`/companies/${job.company.slug}`}
                                    className="text-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors inline-flex items-center gap-1"
                                >
                                    {job.company.name}
                                    {
                                        job.company.verificationStatus === "VERIFIED" && (
                                            <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                        )
                                    }
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <Badge variant="secondary" className="text-sm">
                                        {locationTypeLabels[job.locationType]}
                                    </Badge>
                                    <Badge variant="secondary" className="text-sm">
                                        {employmentTypeLabels[job.employmentType]}
                                    </Badge>
                                    {
                                        job.company.industry && (
                                            <Badge variant="outline" className="text-sm">{job.company.industry}</Badge>
                                        )
                                    }
                                    {
                                        daysAgo !== null && (
                                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                                Posted {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}
                                            </span>
                                        )
                                    }
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            {
                                job.location && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                        <MapPin className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                        <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Location</p>
                                            <p className="font-medium text-neutral-900 dark:text-white text-sm">{job.location}</p>
                                        </div>
                                    </div>
                                )
                            }
                            {
                                formatExperience(job.experienceMin, job.experienceMax) && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                        <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                        <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Experience</p>
                                            <p className="font-medium text-neutral-900 dark:text-white text-sm">
                                                {formatExperience(job.experienceMin, job.experienceMax)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            }
                            {
                                job.salaryDisclosed && formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                                        <TrendingUp className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                        <div>
                                            <p className="text-xs text-neutral-800 dark:text-neutral-100">Salary</p>
                                            <p className="font-medium text-neutral-700 dark:text-neutral-100 text-sm">
                                                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            }
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                <Users className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Applicants</p>
                                    <p className="font-medium text-neutral-900 dark:text-white text-sm">{job.applicationsCount}</p>
                                </div>
                            </div>
                        </motion.div>

                        {
                            job.description && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                        About This Role
                                    </h2>
                                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                                        {job.description}
                                    </p>
                                </motion.div>
                            )
                        }

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                Required Skills
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {
                                    job.skillsRequired.map((skill, i) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">
                                            {skill}
                                        </Badge>
                                    ))
                                }
                            </div>
                        </motion.div>

                        {
                            job.responsibilities.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        Responsibilities
                                    </h2>
                                    <ul className="space-y-2">
                                        {
                                            job.responsibilities.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                                                    {item}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </motion.div>
                            )
                        }
                        {
                            job.requirements.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        Requirements
                                    </h2>
                                    <ul className="space-y-2">
                                        {
                                            job.requirements.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                                                    {item}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </motion.div>
                            )
                        }
                        {
                            job.niceToHave.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        Nice to Have
                                    </h2>
                                    <ul className="space-y-2">
                                        {
                                            job.niceToHave.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                                                    {item}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </motion.div>
                            )
                        }
                        {
                            job.benefits.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        Benefits & Perks
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {
                                            job.benefits.map((benefit, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-100"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                                    <span className="text-sm">{benefit}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </motion.div>
                            )
                        }

                        <Separator />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            {
                                job.interviewProcess ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle2 className="w-6 h-6 text-neutral-800 dark:text-neutral-100" />
                                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                                                Interview Process
                                            </h2>
                                            <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                Transparent
                                            </Badge>
                                        </div>

                                        {
                                            job.interviewProcess.description && (
                                                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                                    {job.interviewProcess.description}
                                                </p>
                                            )
                                        }
                                        {
                                            job.interviewProcess.estimatedDurationWeeks && (
                                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Estimated duration: {job.interviewProcess.estimatedDurationWeeks} weeks</span>
                                                </div>
                                            )
                                        }

                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                                            This company has shared their interview process. Practice for each round with AI mock interviews!
                                        </p>
                                        <div className="relative pl-10 space-y-6">
                                            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-900" />

                                            {
                                                job.interviewProcess.rounds.map((round, index) => {
                                                    const IconComponent = roundTypeIcons[round.roundType as keyof typeof roundTypeIcons] || FileText
                                                    const roundColor = roundTypeColors[round.roundType as keyof typeof roundTypeColors] || "bg-neutral-500"
                                                    return (
                                                        <motion.div
                                                            key={round.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.9 + index * 0.1 }}
                                                            className="relative"
                                                        >
                                                            <div className={`absolute -left-6 w-10 h-10 rounded-full ${roundColor} flex items-center justify-center shadow-lg`}>
                                                                <IconComponent className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="ml-4 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
                                                                                Round {round.roundNumber}
                                                                            </span>
                                                                            {
                                                                                round.format && (
                                                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                                        • {formatLabels[round.format] || round.format}
                                                                                    </span>
                                                                                )
                                                                            }
                                                                            {
                                                                                round.durationMinutes && (
                                                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                                        • {round.durationMinutes} min
                                                                                    </span>
                                                                                )
                                                                            }
                                                                        </div>
                                                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                                                            {round.title}
                                                                        </h3>
                                                                        {
                                                                            round.description && (
                                                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                                                                                    {round.description}
                                                                                </p>
                                                                            )
                                                                        }
                                                                        {
                                                                            round.tipsForCandidates && round.tipsForCandidates.length > 0 && (
                                                                                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                                                                                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-100 mb-1">
                                                                                        💡 Tips from the team
                                                                                    </p>
                                                                                    <ul className="text-sm text-neutral-800 dark:text-neutral-100 space-y-1">
                                                                                        {
                                                                                            round.tipsForCandidates.map((tip, i) => (
                                                                                                <li key={i}>• {tip}</li>
                                                                                            ))
                                                                                        }
                                                                                    </ul>
                                                                                </div>
                                                                            )
                                                                        }
                                                                    </div>
                                                                    {
                                                                        round.hasMockInterview && (
                                                                            <Button
                                                                                className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 gap-2 shrink-0"
                                                                                onClick={() => {
                                                                                    // Navigate to mock interview for this round
                                                                                    router.push(`/mock/job/${job.id}?round=${round.id}`)
                                                                                }}
                                                                            >
                                                                                <Mic className="w-4 h-4" />
                                                                                Practice
                                                                            </Button>
                                                                        )
                                                                    }
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })
                                            }
                                        </div>
                                        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-900 flex items-center justify-center shrink-0">
                                                    <Mic className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                                        Prepare with AI Mock Interviews
                                                    </h4>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                                                        Practice with company-specific mock interviews tailored to each round.
                                                        Get real-time feedback and improve your chances of success.
                                                    </p>
                                                    <Button className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200" asChild><Link href={`/mock/job/${job.id}`}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Start Practicing
                                                    </Link></Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                                        <FileText className="w-12 h-12 text-neutral-600 dark:text-neutral-700 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                            Interview Process Not Disclosed
                                        </h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                                            This company hasn&apos;t shared their interview process yet.
                                            You can still apply and practice with our general mock interviews.
                                        </p>
                                        <Button variant="outline" className="mt-4 rounded-xl" asChild><Link href="/mock">
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Explore Practice Interviews
                                        </Link></Button>
                                    </div>
                                )
                            }
                        </motion.div>
                    </div>
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="sticky top-24 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg"
                        >
                            {
                                hasApplied ? (
                                    <>
                                        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 mb-4">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-semibold">Already Applied</span>
                                        </div>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                            You&apos;ve shown interest in this position. Check your applications for status updates.
                                        </p>
                                        <Button className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-12" asChild><Link href="/jobs/applications">
                                            View My Applications
                                        </Link></Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleShowInterest}
                                            disabled={isApplying}
                                            className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-12 mb-4"
                                        >
                                            {
                                                isApplying ? (
                                                    <>
                                                        <InlineLoader size="sm" className="mr-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        I&apos;m Interested
                                                    </>
                                                )
                                            }
                                        </Button>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                                            Click to start preparing for this role
                                        </p>
                                    </>
                                )
                            }
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                        >
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                                About the Company
                            </h3>
                            <Link
                                href={`/companies/${job.company.slug}`}
                                className="block group"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
                                        {
                                            job.company.logoUrl ? (
                                                <Image src={job.company.logoUrl} alt={job.company.name} fill className="object-cover" />
                                            ) : (
                                                <Building2 className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                            )
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-900 dark:text-white group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors flex items-center gap-1">
                                            {job.company.name}
                                            {
                                                job.company.verificationStatus === "VERIFIED" && (
                                                    <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                )
                                            }
                                        </p>
                                        {
                                            job.company.industry && (
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.company.industry}</p>
                                            )
                                        }
                                    </div>
                                </div>
                            </Link>

                            {
                                job.company.description && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3">
                                        {job.company.description}
                                    </p>
                                )
                            }

                            <div className="space-y-2">
                                {
                                    job.company.companySize && (
                                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                            <Users className="w-4 h-4" />
                                            <span>{job.company.companySize} employees</span>
                                        </div>
                                    )
                                }
                                {
                                    job.company.website && (
                                        <Link
                                            href={job.company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-100 hover:underline"
                                        >
                                            <Globe className="w-4 h-4" />
                                            <span>Visit Website</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    )
                                }
                            </div>
                            <Link
                                href={`/companies/${job.company.slug}`}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                View Company Profile
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </motion.div>

                        {
                            job.hasAssignment && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-700">
                                            Take-Home Assignment
                                        </h3>
                                    </div>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-100">
                                        This position includes a take-home assignment as part of the interview process.
                                    </p>
                                </motion.div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}