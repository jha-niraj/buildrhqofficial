"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles, LayoutList, PartyPopper,
    Building2, RefreshCw, ArrowRight
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@repo/ui/components/ui/dialog"
import { SwipeStack } from "../components/swipe-card"
import { SkillGapModal } from "../components/skill-gap-modal"
import { recordSwipeAction, getSparkJobs } from "@/actions/jobs/tabs"
import { toggleSaveJob, type FeedJobResult } from "@/actions/jobs"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface SparkContentProps {
    initialJobs: FeedJobResult[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    } | null
    isAuthenticated: boolean
}

type SwipedJob = FeedJobResult & { swipeDirection: "left" | "right" }

export function SparkContent({ initialJobs, pagination, isAuthenticated }: SparkContentProps) {
    const [jobs, setJobs] = useState<FeedJobResult[]>(initialJobs)
    const [swipedJobs, setSwipedJobs] = useState<SwipedJob[]>([])
    const [lastSwipedJob, setLastSwipedJob] = useState<FeedJobResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(pagination?.page || 1)
    const [hasMore, setHasMore] = useState(
        pagination ? pagination.page < pagination.totalPages : false
    )

    // Modal states
    const [selectedJob, setSelectedJob] = useState<FeedJobResult | null>(null)
    const [showSkillGapModal, setShowSkillGapModal] = useState(false)
    const [showInterestedModal, setShowInterestedModal] = useState(false)

    const handleSwipeLeft = useCallback(async (job: FeedJobResult) => {
        // Remove from current jobs
        setJobs(prev => prev.filter(j => j.id !== job.id))
        setSwipedJobs(prev => [...prev, { ...job, swipeDirection: "left" as const }])
        setLastSwipedJob(job)

        // Record the swipe (skip action)
        if (isAuthenticated) {
            await recordSwipeAction(job.id, "left")
        }
    }, [isAuthenticated])

    const handleSwipeRight = useCallback(async (job: FeedJobResult) => {
        // Remove from current jobs
        setJobs(prev => prev.filter(j => j.id !== job.id))
        setSwipedJobs(prev => [...prev, { ...job, swipeDirection: "right" as const }])
        setLastSwipedJob(job)
        setSelectedJob(job)

        // Show interested modal
        if (isAuthenticated) {
            setShowInterestedModal(true)
            // Record the swipe (saves the job)
            await recordSwipeAction(job.id, "right")
        } else {
            toast.info("Sign in to save jobs you're interested in")
        }
    }, [isAuthenticated])

    const handleSave = useCallback(async (job: FeedJobResult) => {
        if (!isAuthenticated) {
            toast.info("Sign in to save jobs")
            return
        }

        const result = await toggleSaveJob(job.id)
        if (result.success) {
            setJobs(prev => prev.map(j => 
                j.id === job.id ? { ...j, isSaved: result.saved ?? false } : j
            ))
            toast.success(result.saved ? "Job saved!" : "Job removed from saved")
        }
    }, [isAuthenticated])

    const handleViewDetails = useCallback((job: FeedJobResult) => {
        setSelectedJob(job)
        setShowSkillGapModal(true)
    }, [])

    const handleUndo = useCallback(() => {
        if (lastSwipedJob) {
            setJobs(prev => [lastSwipedJob, ...prev])
            setSwipedJobs(prev => prev.filter(j => j.id !== lastSwipedJob.id))
            setLastSwipedJob(null)
        }
    }, [lastSwipedJob])

    const loadMoreJobs = useCallback(async () => {
        if (loading || !hasMore) return

        setLoading(true)
        const result = await getSparkJobs(page + 1, 20)
        
        if (result.success && result.data) {
            setJobs(prev => [...prev, ...(result.data!.jobs as unknown as FeedJobResult[])])
            setPage(result.data.pagination.page)
            setHasMore(result.data.pagination.page < result.data.pagination.totalPages)
        }
        setLoading(false)
    }, [loading, hasMore, page])

    // Check if we need to load more jobs
    if (jobs.length < 5 && hasMore && !loading) {
        loadMoreJobs()
    }

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            Discover Jobs
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Swipe right on jobs you like
                        </p>
                    </div>
                </div>
                <Link href="/jobs/browse">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2">
                        <LayoutList className="w-4 h-4" />
                        <span className="hidden sm:inline">List View</span>
                    </Button>
                </Link>
            </div>

            {/* Swipe Area */}
            <AnimatePresence mode="wait">
                {jobs.length > 0 ? (
                    <motion.div
                        key="swipe-stack"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center"
                    >
                        <SwipeStack
                            jobs={jobs}
                            onSwipeLeft={handleSwipeLeft}
                            onSwipeRight={handleSwipeRight}
                            onSave={handleSave}
                            onViewDetails={handleViewDetails}
                            onUndo={handleUndo}
                            lastSwipedJob={lastSwipedJob}
                        />

                        {/* Stats */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {jobs.length} jobs remaining
                                {swipedJobs.length > 0 && ` • ${swipedJobs.filter(j => j.swipeDirection === "right").length} interested`}
                            </p>
                        </div>
                    </motion.div>
                ) : loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <InlineLoader size="lg" className="text-neutral-600 dark:text-neutral-400 mb-4" />
                        <p className="text-neutral-500 dark:text-neutral-400">Loading more jobs...</p>
                    </motion.div>
                ) : (
                    <AllCaughtUpState 
                        interestedCount={swipedJobs.filter(j => j.swipeDirection === "right").length}
                        onRefresh={() => window.location.reload()}
                    />
                )}
            </AnimatePresence>

            {/* Skill Gap Modal */}
            <SkillGapModal
                job={selectedJob}
                open={showSkillGapModal}
                onClose={() => {
                    setShowSkillGapModal(false)
                    setSelectedJob(null)
                }}
            />

            {/* Interested Modal */}
            <Dialog open={showInterestedModal} onOpenChange={setShowInterestedModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <PartyPopper className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                            Great Choice!
                        </DialogTitle>
                        <DialogDescription>
                            We&apos;ve saved <span className="font-medium text-neutral-900 dark:text-white">{selectedJob?.title}</span> at <span className="font-medium text-neutral-900 dark:text-white">{selectedJob?.company.name}</span> to your Saved jobs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/20 rounded-xl">
                            <p className="text-sm text-neutral-700 dark:text-neutral-100">
                                You can review your saved jobs and apply when you&apos;re ready. We recommend preparing by practicing mock interviews for this role.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 rounded-xl"
                                onClick={() => setShowInterestedModal(false)}
                            >
                                Keep Swiping
                            </Button>
                            <Link href="/jobs/saved" className="flex-1">
                                <Button className="w-full rounded-xl">
                                    View Saved
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AllCaughtUpState({ 
    interestedCount,
    onRefresh 
}: { 
    interestedCount: number
    onRefresh: () => void 
}) {
    return (
        <motion.div
            key="caught-up"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-800/30 rounded-3xl flex items-center justify-center mb-6">
                <PartyPopper className="w-12 h-12 text-neutral-800 dark:text-neutral-100" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                You&apos;re All Caught Up!
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
                You&apos;ve reviewed all available jobs. 
                {interestedCount > 0 && (
                    <span className="block mt-1 text-neutral-800 dark:text-neutral-100 font-medium">
                        {interestedCount} jobs saved to your list!
                    </span>
                )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                {interestedCount > 0 && (
                    <Link href="/jobs/saved">
                        <Button className="rounded-xl gap-2">
                            View Saved Jobs
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                )}
                <Link href="/companies">
                    <Button variant="outline" className="rounded-xl gap-2">
                        <Building2 className="w-4 h-4" />
                        Explore Companies
                    </Button>
                </Link>
                <Button 
                    variant="ghost" 
                    className="rounded-xl gap-2"
                    onClick={onRefresh}
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>
        </motion.div>
    )
}
