"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    MapPin, Clock, Building2, Mic, CheckCircle2, ChevronRight,
    Play, Heart, Share2, TrendingUp, Users, FileText, Phone,
    Code, Layout, MessageSquare, Star, Loader2, LucideIcon
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import Link from "next/link"
import { showInterest } from "@/actions/jobs"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Job {
    id: string
    title: string
    slug: string
    company: {
        id: string
        name: string
        logoUrl: string | null
        industry: string | null
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
        rounds: Array<{
            id: string
            roundNumber: number
            title: string
            roundType: string
            hasMockInterview: boolean
        }>
    } | null
}

interface JobDetailSheetProps {
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

export function JobDetailSheet({ job }: JobDetailSheetProps) {
    const router = useRouter()
    const [isApplying, setIsApplying] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

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
        setIsApplying(true)
        try {
            const result = await showInterest(job.id)
            if (result.success) {
                router.push("/jobs/applications")
            }
        } catch (error) {
            console.error("Error showing interest:", error)
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="sticky top-0 bg-white dark:bg-neutral-950 z-10 border-b border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                        {
                            job.company.logoUrl ? (
                                <Image
                                    src={job.company.logoUrl}
                                    alt={job.company.name}
                                    className="w-full h-full object-cover"
                                    fill
                                />
                            ) : (
                                <Building2 className="w-8 h-8 text-neutral-400" />
                            )
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                            {job.title}
                        </h2>
                        <Link
                            href={`/companies/${job.company.id}`}
                            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
                        >
                            {job.company.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary">
                                {locationTypeLabels[job.locationType]}
                            </Badge>
                            <Badge variant="secondary">
                                {employmentTypeLabels[job.employmentType]}
                            </Badge>
                            {
                                job.company.industry && (
                                    <Badge variant="outline">{job.company.industry}</Badge>
                                )
                            }
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <Button
                        onClick={handleShowInterest}
                        disabled={isApplying}
                        className="flex-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                    >
                        {
                            isApplying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => setIsSaved(!isSaved)}
                    >
                        <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {
                        job.location && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                <MapPin className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Location</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{job.location}</p>
                                </div>
                            </div>
                        )
                    }
                    {
                        formatExperience(job.experienceMin, job.experienceMax) && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                                <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Experience</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">
                                        {formatExperience(job.experienceMin, job.experienceMax)}
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    {
                        job.salaryDisclosed && formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/20">
                                <TrendingUp className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                <div>
                                    <p className="text-xs text-neutral-800 dark:text-neutral-100">Salary</p>
                                    <p className="font-medium text-neutral-700 dark:text-neutral-100">
                                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                        <Users className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                        <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Applicants</p>
                            <p className="font-medium text-neutral-900 dark:text-white">{job.applicationsCount}</p>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                        Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {
                            job.skillsRequired.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="px-3 py-1">
                                    {skill}
                                </Badge>
                            ))
                        }
                    </div>
                </div>

                <Separator />

                {
                    job.interviewProcess ? (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    Interview Process
                                </h3>
                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs">
                                    Transparent
                                </Badge>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                This company has shared their interview process. Practice for each round with AI mock interviews!
                            </p>
                            <div className="relative pl-8">
                                <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-neutral-200 dark:bg-neutral-800" />

                                <div className="space-y-4">
                                    {
                                        job.interviewProcess.rounds.map((round, index) => {
                                            const IconComponent = roundTypeIcons[round.roundType] || FileText
                                            return (
                                                <motion.div
                                                    key={round.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="relative flex items-start gap-4"
                                                >
                                                    <div className={`absolute -left-4 w-8 h-8 rounded-full ${roundTypeColors[round.roundType]} flex items-center justify-center shrink-0`}>
                                                        <IconComponent className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                                                    Round {round.roundNumber}
                                                                </span>
                                                                <h4 className="font-medium text-neutral-900 dark:text-white">
                                                                    {round.title}
                                                                </h4>
                                                            </div>
                                                            {
                                                                round.hasMockInterview && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-lg text-xs gap-1.5"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            // Navigate to mock interview
                                                                        }}
                                                                    >
                                                                        <Mic className="w-3.5 h-3.5" />
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
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                                <p className="text-sm text-neutral-700 dark:text-neutral-100">
                                    <strong>Pro tip:</strong> Companies with transparent processes tend to have higher candidate satisfaction.
                                    Click &quot;Practice&quot; on any round to start an AI mock interview!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center">
                            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                            <h3 className="font-medium text-neutral-900 dark:text-white mb-1">
                                Interview Process Not Disclosed
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                This company hasn&apos;t shared their interview process yet.
                            </p>
                        </div>
                    )
                }

                <Separator />

                {
                    job.hasAssignment && (
                        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-700">
                                    Take-Home Assignment
                                </h3>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-100">
                                This position includes a take-home assignment as part of the interview process.
                            </p>
                        </div>
                    )
                }

                <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                        About {job.company.name}
                    </h3>
                    <Link
                        href={`/companies/${job.company.id}`}
                        className="block p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
                                    {
                                        job.company.logoUrl ? (
                                            <Image src={job.company.logoUrl} alt={job.company.name} fill className="object-cover" />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-neutral-400" />
                                        )
                                    }
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white">
                                        {job.company.name}
                                    </p>
                                    {
                                        job.company.industry && (
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.company.industry}</p>
                                        )
                                    }
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 p-4">
                <Button
                    onClick={handleShowInterest}
                    disabled={isApplying}
                    className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-12"
                >
                    {
                        isApplying ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                I&apos;m Interested - Start Preparing
                            </>
                        )
                    }
                </Button>
            </div>
        </div>
    )
}