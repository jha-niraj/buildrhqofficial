"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import {
    ArrowLeft, Building2, CheckCircle2, Clock, Calendar,
    ClipboardList, FileText, ExternalLink, Send, AlertCircle,
    Download, Upload, Link as LinkIcon
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@repo/ui/components/ui/dialog"
import toast from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

export interface AssignmentDetails {
    title: string
    description: string
    requirements: string[]
    resources: string[]
    deliverables: string[]
}

export interface Job {
    id: string
    title: string
    slug: string
    hasAssignment: boolean
    assignmentDetails: AssignmentDetails | null
    assignmentDeadlineDays: number | null
    company: {
        id: string
        name: string
        slug: string | null
        logoUrl: string | null
    }
}

export interface Application {
    id: string
    status: string
    assignmentStartedAt: Date | null
    assignmentSubmittedAt: Date | null
    assignmentScore: number | null
    assignmentFeedback: string | null
    assignmentProjectCloneId?: string | null
    job: Job
}

interface AssignmentContentProps {
    application: Application
}

export function AssignmentContent({ application }: AssignmentContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [submissionUrl, setSubmissionUrl] = useState("")
    const [submissionNotes, setSubmissionNotes] = useState("")

    const { job } = application
    const assignment = job.assignmentDetails
    const isSubmitted = application.assignmentSubmittedAt !== null
    const hasStarted = application.assignmentStartedAt !== null

    // Calculate deadline
    const getDeadline = () => {
        if (!application.assignmentStartedAt || !job.assignmentDeadlineDays) return null
        const startDate = new Date(application.assignmentStartedAt)
        startDate.setDate(startDate.getDate() + job.assignmentDeadlineDays)
        return startDate
    }

    const deadline = getDeadline()
    const isOverdue = deadline && new Date() > deadline && !isSubmitted

    const handleStartAssignment = async () => {
        startTransition(async () => {
            // Call server action to start assignment
            // This would update assignmentStartedAt in the database
            toast.success("Assignment started! Good luck!")
            router.refresh()
        })
    }

    const handleSubmitAssignment = async () => {
        if (!submissionUrl.trim()) {
            toast.error("Please provide a submission URL")
            return
        }

        startTransition(async () => {
            // Call server action to submit assignment
            // This would update status to ASSIGNMENT_SUBMITTED
            toast.success("Assignment submitted successfully!")
            setShowSubmitDialog(false)
            router.refresh()
        })
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl" asChild><Link href={`/jobs/applications/${application.id}/interview`}>
                            <ArrowLeft className="w-5 h-5" />
                        </Link></Button>
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden">
                                {
                                    job.company.logoUrl ? (
                                        <Image
                                            src={job.company.logoUrl}
                                            alt={job.company.name}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                    )
                                }
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    Take-Home Assignment
                                </h1>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.title} • {job.company.name}</p>
                            </div>
                        </div>
                        {
                            isSubmitted ? (
                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Submitted
                                </Badge>
                            ) : isOverdue ? (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Overdue
                                </Badge>
                            ) : hasStarted ? (
                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                    <Clock className="w-3 h-3 mr-1" />
                                    In Progress
                                </Badge>
                            ) : (
                                <Badge variant="outline">Not Started</Badge>
                            )
                        }
                    </div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {
                        deadline && !isSubmitted && (
                            <div className={`mb-6 p-4 rounded-xl border ${isOverdue
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    : "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-200 dark:border-neutral-800"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <Clock className={`w-5 h-5 ${isOverdue ? "text-red-600" : "text-neutral-800 dark:text-neutral-200"}`} />
                                    <div>
                                        <p className={`font-medium ${isOverdue ? "text-red-700 dark:text-red-400" : "text-neutral-700 dark:text-neutral-100"}`}>
                                            {isOverdue ? "Assignment Overdue" : "Deadline"}
                                        </p>
                                        <p className={`text-sm ${isOverdue ? "text-red-600 dark:text-red-500" : "text-neutral-800 dark:text-neutral-200"}`}>
                                            {
                                                deadline.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {
                        assignment && (
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                                        {assignment.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                                        {
                                            job.assignmentDeadlineDays && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{job.assignmentDeadlineDays} days to complete</span>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Description
                                    </h3>
                                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                                        <ReactMarkdown>{assignment.description}</ReactMarkdown>
                                    </div>
                                </div>

                                {
                                    assignment.requirements && assignment.requirements.length > 0 && (
                                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                                <ClipboardList className="w-5 h-5" />
                                                Requirements
                                            </h3>
                                            <ul className="space-y-2">
                                                {
                                                    assignment.requirements.map((req, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100 mt-0.5 shrink-0" />
                                                            <span className="text-neutral-700 dark:text-neutral-300">{req}</span>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    )
                                }
                                {
                                    assignment.deliverables && assignment.deliverables.length > 0 && (
                                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Upload className="w-5 h-5" />
                                                Deliverables
                                            </h3>
                                            <ul className="space-y-2">
                                                {
                                                    assignment.deliverables.map((del, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-100 mt-0.5 shrink-0">
                                                                {index + 1}
                                                            </div>
                                                            <span className="text-neutral-700 dark:text-neutral-300">{del}</span>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    )
                                }
                                {
                                    assignment.resources && assignment.resources.length > 0 && (
                                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Download className="w-5 h-5" />
                                                Resources
                                            </h3>
                                            <div className="space-y-2">
                                                {
                                                    assignment.resources.map((resource, index) => (
                                                        <Link
                                                            key={index}
                                                            href={resource}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                                        >
                                                            <LinkIcon className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                            <span className="text-sm text-neutral-800 dark:text-neutral-100 truncate flex-1">
                                                                {resource}
                                                            </span>
                                                            <ExternalLink className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                                        </Link>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )
                                }

                                <div className="p-6">
                                    {
                                        isSubmitted ? (
                                            <div className="text-center py-4">
                                                <CheckCircle2 className="w-12 h-12 text-neutral-900 dark:text-neutral-100 mx-auto mb-3" />
                                                <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                                    Assignment Submitted
                                                </h4>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                                    Submitted on {application.assignmentSubmittedAt &&
                                                        new Date(application.assignmentSubmittedAt).toLocaleDateString()}
                                                </p>
                                                {
                                                    application.assignmentScore !== null && (
                                                        <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-lg px-4 py-2">
                                                            Score: {application.assignmentScore}%
                                                        </Badge>
                                                    )
                                                }
                                                {
                                                    application.assignmentFeedback && (
                                                        <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-left">
                                                            <h5 className="font-medium text-neutral-900 dark:text-white mb-2">
                                                                Feedback
                                                            </h5>
                                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                {application.assignmentFeedback}
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        ) : hasStarted ? (
                                            <Button
                                                size="lg"
                                                className="w-full rounded-xl"
                                                onClick={() => setShowSubmitDialog(true)}
                                            >
                                                <Send className="w-5 h-5 mr-2" />
                                                Submit Assignment
                                            </Button>
                                        ) : (
                                            <Button
                                                size="lg"
                                                className="w-full rounded-xl"
                                                onClick={handleStartAssignment}
                                                disabled={isPending}
                                            >
                                                {
                                                    isPending ? (
                                                        <InlineLoader size="md" className="mr-2" />
                                                    ) : (
                                                        <ClipboardList className="w-5 h-5 mr-2" />
                                                    )
                                                }
                                                Start Assignment
                                            </Button>
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }
                </motion.div>
            </div>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Submit Assignment</DialogTitle>
                        <DialogDescription>
                            Provide the link to your completed assignment. Make sure all requirements are met before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="url">Submission URL *</Label>
                            <Input
                                id="url"
                                placeholder="https://github.com/username/project"
                                value={submissionUrl}
                                onChange={(e) => setSubmissionUrl(e.target.value)}
                                className="mt-2"
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                GitHub repository, deployed URL, or file sharing link
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="notes">Additional Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any additional information about your submission..."
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                                className="mt-2 min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSubmitDialog(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitAssignment}
                            disabled={isPending || !submissionUrl.trim()}
                        >
                            {
                                isPending ? (
                                    <InlineLoader size="sm" className="mr-2" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )
                            }
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}