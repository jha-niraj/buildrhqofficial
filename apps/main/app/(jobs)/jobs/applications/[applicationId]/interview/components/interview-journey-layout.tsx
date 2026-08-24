"use client"

import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import {
    ArrowLeft, Building2, CheckCircle2, Lock, Mic, FileText, 
    Users, Code, Phone, Briefcase, MessageSquare, ClipboardList, 
    Target, Award, ChevronRight, Clock, Calendar, Play, ExternalLink
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Progress } from "@repo/ui/components/ui/progress"

interface InterviewRound {
    id: string
    roundNumber: number
    roundType: string
    title: string
    description: string
    durationMinutes: number | null
    format: string
    hasMockInterview: boolean
    whatToExpect: unknown // JsonValue from Prisma
    sampleQuestions: unknown // JsonValue from Prisma
    tipsForCandidates: unknown // JsonValue from Prisma
}

interface InterviewProcess {
    id: string
    name: string
    description: string | null
    rounds: InterviewRound[]
}

interface Job {
    id: string
    title: string
    slug: string
    hasAssignment: boolean
    assignmentDetails: unknown // JsonValue from Prisma
    assignmentDeadlineDays: number | null
    company: {
        id: string
        name: string
        slug: string | null
        logoUrl: string | null
    }
    interviewProcess: InterviewProcess | null
}

// Helper type for parsed assignment details
interface AssignmentDetails {
    title: string
    description: string
    requirements: string[]
    resources: string[]
    deliverables: string[]
}

function parseAssignmentDetails(data: unknown): AssignmentDetails | null {
    if (!data || typeof data !== 'object') return null
    const obj = data as Record<string, unknown>
    return {
        title: typeof obj.title === 'string' ? obj.title : '',
        description: typeof obj.description === 'string' ? obj.description : '',
        requirements: Array.isArray(obj.requirements) ? obj.requirements : [],
        resources: Array.isArray(obj.resources) ? obj.resources : [],
        deliverables: Array.isArray(obj.deliverables) ? obj.deliverables : []
    }
}

interface PrepProgress {
    id: string
    overallReadinessScore?: number
    readinessScore?: number
    roundsCompleted?: number | number[]
}

interface Application {
    id: string
    status: string
    assignmentStartedAt: Date | null
    assignmentSubmittedAt: Date | null
    assignmentScore: number | null
    assignmentFeedback: unknown
    interviewScheduledAt: Date | null
    interviewCompletedAt: Date | null
    interviewFeedback: unknown
    job: Job
    prepProgress: PrepProgress | null
}

interface InterviewJourneyLayoutProps {
    application: Application
}

const roundTypeIcons: Record<string, LucideIcon> = {
    PHONE_SCREEN: Phone,
    TECHNICAL_CODING: Code,
    SYSTEM_DESIGN: Target,
    BEHAVIORAL: Users,
    TAKE_HOME: ClipboardList,
    PANEL: Users,
    HIRING_MANAGER: Briefcase,
    CULTURE_FIT: MessageSquare,
    HR_FINAL: Award,
    CUSTOM: FileText,
}

const roundTypeLabels: Record<string, string> = {
    PHONE_SCREEN: "Phone Screen",
    TECHNICAL_CODING: "Technical Coding",
    SYSTEM_DESIGN: "System Design",
    BEHAVIORAL: "Behavioral",
    TAKE_HOME: "Take Home",
    PANEL: "Panel Interview",
    HIRING_MANAGER: "Hiring Manager",
    CULTURE_FIT: "Culture Fit",
    HR_FINAL: "HR Final",
    CUSTOM: "Custom Round",
}

const statusConfig: Record<string, { label: string; color: string }> = {
    SHORTLISTED: { label: "Shortlisted", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    ASSIGNMENT_SENT: { label: "Assignment Pending", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    ASSIGNMENT_SUBMITTED: { label: "Assignment Submitted", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    INTERVIEWED: { label: "Interviewed", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    OFFER_EXTENDED: { label: "Offer Extended", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
    HIRED: { label: "Hired", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100" },
}

export function InterviewJourneyLayout({ application }: InterviewJourneyLayoutProps) {
    const pathname = usePathname()

    const { job, prepProgress } = application
    const interviewProcess = job.interviewProcess
    const rounds = interviewProcess?.rounds || []

    // Determine which rounds are unlocked based on status
    const isAssignmentUnlocked = ["ASSIGNMENT_SENT", "ASSIGNMENT_SUBMITTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFER_EXTENDED", "HIRED"].includes(application.status)
    const isAssignmentCompleted = application.assignmentSubmittedAt !== null

    // Get completed rounds
    const completedRounds = prepProgress?.roundsCompleted
        ? (Array.isArray(prepProgress.roundsCompleted)
            ? prepProgress.roundsCompleted
            : Array.from({ length: prepProgress.roundsCompleted }, (_, i) => i + 1))
        : []

    const isRoundUnlocked = (roundNumber: number) => {
        // First round is always unlocked if interview is scheduled
        if (roundNumber === 1) {
            return ["INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFER_EXTENDED", "HIRED"].includes(application.status)
        }
        // Subsequent rounds are unlocked if previous round is completed
        return completedRounds.includes(roundNumber - 1)
    }

    const isRoundCompleted = (roundNumber: number) => {
        return completedRounds.includes(roundNumber)
    }

    const overallProgress = rounds.length > 0
        ? Math.round((completedRounds.length / rounds.length) * 100)
        : 0

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl" asChild><Link href="/jobs/applications">
                            <ArrowLeft className="w-5 h-5" />
                        </Link></Button>
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden">
                                {
                                    job.company.logoUrl ? (
                                        <Image
                                            src={job.company.logoUrl}
                                            alt={job.company.name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="w-6 h-6 text-neutral-400" />
                                    )
                                }
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    {job.title}
                                </h1>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.company.name}</p>
                            </div>
                        </div>
                        <Badge className={statusConfig[application.status]?.color || "bg-neutral-100"}>
                            {statusConfig[application.status]?.label || application.status}
                        </Badge>
                    </div>
                </div>
            </div>
            {/* w-72 beside a flex-1 main with no breakpoint left 72px for the main
                column on a 360px phone - the interview journey (assignment status,
                round-by-round progress) was effectively unreachable there. Below
                `lg` the aside now flows full-width above the main content instead
                of beside it; the fixed width, sticky positioning and viewport-height
                floor are all `lg:`-scoped since they only make sense once there is
                room for a real two-column layout. See docs/responsiveness.md
                section 3. */}
            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
                <aside className="w-full bg-white dark:bg-neutral-900 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 lg:w-72 lg:min-h-[calc(100dvh-73px)] lg:sticky lg:top-[73px] lg:overflow-y-auto">
                    <div className="p-4">
                        <div className="mb-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                    Interview Progress
                                </span>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {overallProgress}%
                                </span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                {completedRounds.length} of {rounds.length} rounds completed
                            </p>
                        </div>
                        <nav className="space-y-1">
                            <Link href={`/jobs/applications/${application.id}/interview`}>
                                <button
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${pathname === `/jobs/applications/${application.id}/interview`
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                        }`}
                                >
                                    <Target className="w-5 h-5" />
                                    <span className="font-medium">Overview</span>
                                </button>
                            </Link>

                            {
                                job.hasAssignment && (
                                    <>
                                        <div className="pt-4 pb-2">
                                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3">
                                                Assignment
                                            </span>
                                        </div>
                                        <Link href={`/jobs/applications/${application.id}/interview/assignment`}>
                                            <button
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${pathname.includes("/assignment")
                                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                                        : isAssignmentUnlocked
                                                            ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                                            : "opacity-50 cursor-not-allowed text-neutral-400"
                                                    }`}
                                                disabled={!isAssignmentUnlocked}
                                            >
                                                <ClipboardList className="w-5 h-5" />
                                                <span className="flex-1 font-medium">Take-Home Assignment</span>
                                                {
                                                    !isAssignmentUnlocked ? (
                                                        <Lock className="w-4 h-4" />
                                                    ) : isAssignmentCompleted ? (
                                                        <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                    ) : null
                                                }
                                            </button>
                                        </Link>
                                    </>
                                )
                            }

                            {
                                rounds.length > 0 && (
                                    <>
                                        <div className="pt-4 pb-2">
                                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3">
                                                Interview Rounds
                                            </span>
                                        </div>
                                        {
                                            rounds.map((round) => {
                                                const isUnlocked = isRoundUnlocked(round.roundNumber)
                                                const isCompleted = isRoundCompleted(round.roundNumber)
                                                const isActive = pathname.includes(`/round/${round.id}`)

                                                return (
                                                    <Link
                                                        key={round.id}
                                                        href={isUnlocked ? `/jobs/applications/${application.id}/interview/round/${round.id}` : "#"}
                                                    >
                                                        <button
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${isActive
                                                                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                                                    : isUnlocked
                                                                        ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                                                        : "opacity-50 cursor-not-allowed text-neutral-400"
                                                                }`}
                                                            disabled={!isUnlocked}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${isCompleted
                                                                    ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100"
                                                                    : isUnlocked
                                                                        ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100"
                                                                        : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700"
                                                                }`}>
                                                                {round.roundNumber}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium block truncate">{round.title}</span>
                                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 block truncate">
                                                                    {roundTypeLabels[round.roundType] || round.roundType}
                                                                </span>
                                                            </div>
                                                            {
                                                                !isUnlocked ? (
                                                                    <Lock className="w-4 h-4 shrink-0" />
                                                                ) : isCompleted ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100 shrink-0" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                                                )
                                                            }
                                                        </button>
                                                    </Link>
                                                )
                                            })
                                        }
                                    </>
                                )
                            }

                            {
                                rounds.some(r => r.hasMockInterview) && (
                                    <>
                                        <div className="pt-4 pb-2">
                                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3">
                                                Practice
                                            </span>
                                        </div>
                                        <Link href={`/companies/${job.company.slug}/mock`}>
                                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors">
                                                <Mic className="w-5 h-5" />
                                                <span className="flex-1 font-medium">Mock Interviews</span>
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </>
                                )
                            }
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                                Interview Journey Overview
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                                Track your progress through the interview process for {job.title} at {job.company.name}
                            </p>

                            {
                                interviewProcess && (
                                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                            {interviewProcess.name}
                                        </h3>
                                        {
                                            interviewProcess.description && (
                                                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                                                    {interviewProcess.description}
                                                </p>
                                            )
                                        }
                                        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{rounds.length} rounds</span>
                                            </div>
                                            {
                                                application.interviewScheduledAt && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Scheduled for {new Date(application.interviewScheduledAt).toLocaleDateString()}</span>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                )
                            }

                            <div className="space-y-4">
                                {
                                    job.hasAssignment && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`relative pl-8 pb-6 border-l-2 ${isAssignmentCompleted
                                                    ? "border-neutral-900"
                                                    : isAssignmentUnlocked
                                                        ? "border-neutral-900"
                                                        : "border-neutral-300 dark:border-neutral-700"
                                                }`}
                                        >
                                            <div className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ${isAssignmentCompleted
                                                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                    : isAssignmentUnlocked
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                        : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500"
                                                }`}>
                                                {
                                                    isAssignmentCompleted ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : (
                                                        <ClipboardList className="w-3 h-3" />
                                                    )
                                                }
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                                        Take-Home Assignment
                                                    </h4>
                                                    {
                                                        isAssignmentCompleted ? (
                                                            <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                                Completed
                                                            </Badge>
                                                        ) : isAssignmentUnlocked ? (
                                                            <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                                In Progress
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">Locked</Badge>
                                                        )
                                                    }
                                                </div>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                                    {parseAssignmentDetails(job.assignmentDetails)?.title || "Complete the take-home assignment"}
                                                </p>
                                                {
                                                    isAssignmentUnlocked && !isAssignmentCompleted && (
                                                        <Link href={`/jobs/applications/${application.id}/interview/assignment`}>
                                                            <Button size="sm" className="rounded-lg">
                                                                <Play className="w-4 h-4 mr-2" />
                                                                Start Assignment
                                                            </Button>
                                                        </Link>
                                                    )
                                                }
                                            </div>
                                        </motion.div>
                                    )
                                }

                                {
                                    rounds.map((round, index) => {
                                        const isUnlocked = isRoundUnlocked(round.roundNumber)
                                        const isCompleted = isRoundCompleted(round.roundNumber)
                                        const Icon = roundTypeIcons[round.roundType] || FileText

                                        return (
                                            <motion.div
                                                key={round.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`relative pl-8 ${index < rounds.length - 1 ? "pb-6 border-l-2" : ""} ${isCompleted
                                                        ? "border-neutral-900"
                                                        : isUnlocked
                                                            ? "border-neutral-900"
                                                            : "border-neutral-300 dark:border-neutral-700"
                                                    }`}
                                            >
                                                <div className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ${isCompleted
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                        : isUnlocked
                                                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                            : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500"
                                                    }`}>
                                                    {
                                                        isCompleted ? (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ) : (
                                                            <span className="text-xs font-semibold">{round.roundNumber}</span>
                                                        )
                                                    }
                                                </div>
                                                <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 ${!isUnlocked ? "opacity-60" : ""
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-5 h-5 text-neutral-400" />
                                                            <h4 className="font-semibold text-neutral-900 dark:text-white">
                                                                {round.title}
                                                            </h4>
                                                        </div>
                                                        {
                                                            isCompleted ? (
                                                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                                    Completed
                                                                </Badge>
                                                            ) : isUnlocked ? (
                                                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                                    Up Next
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="flex items-center gap-1">
                                                                    <Lock className="w-3 h-3" />
                                                                    Locked
                                                                </Badge>
                                                            )
                                                        }
                                                    </div>
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                                        {roundTypeLabels[round.roundType]} • {round.durationMinutes || 45} minutes
                                                    </p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                                                        {round.description || "Interview round details will be provided."}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {
                                                            isUnlocked && (
                                                                <Link href={`/jobs/applications/${application.id}/interview/round/${round.id}`}>
                                                                    <Button size="sm" variant="outline" className="rounded-lg">
                                                                        View Details
                                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                                    </Button>
                                                                </Link>
                                                            )
                                                        }
                                                        {
                                                            round.hasMockInterview && isUnlocked && !isCompleted && (
                                                                <Link href={`/companies/${job.company.slug}/mock`}>
                                                                    <Button size="sm" className="rounded-lg">
                                                                        <Mic className="w-4 h-4 mr-2" />
                                                                        Practice
                                                                    </Button>
                                                                </Link>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                }
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    )
}