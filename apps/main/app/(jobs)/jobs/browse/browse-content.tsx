"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutList, Search, Filter, ChevronDown,
    Briefcase, Sparkles
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@repo/ui/components/ui/sheet"
import Link from "next/link"
import { JobCard } from "../components/job-card"
import { SkillGapModal } from "../components/skill-gap-modal"
import { getForYouFeedJobs, toggleSaveJob, type FeedJobResult } from "@/actions/jobs"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface BrowseContentProps {
    initialData: {
        success: boolean
        data?: {
            jobs: FeedJobResult[]
            pagination: {
                page: number
                limit: number
                total: number
                totalPages: number
            }
            isAuthenticated?: boolean
        }
        error?: string
    }
    isAuthenticated: boolean
}

export function BrowseContent({ initialData, isAuthenticated }: BrowseContentProps) {
    const [jobs, setJobs] = useState<FeedJobResult[]>(
        initialData.success && initialData.data ? initialData.data.jobs : []
    )
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(
        initialData.success && initialData.data
            ? initialData.data.pagination.page < initialData.data.pagination.totalPages
            : false
    )
    const [total, setTotal] = useState(
        initialData.success && initialData.data ? initialData.data.pagination.total : 0
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Modal state
    const [selectedJob, setSelectedJob] = useState<FeedJobResult | null>(null)
    const [showSkillGapModal, setShowSkillGapModal] = useState(false)

    const handleSaveJob = useCallback(async (jobId: string) => {
        if (!isAuthenticated) {
            toast.info("Sign in to save jobs")
            return
        }

        const result = await toggleSaveJob(jobId)
        if (result.success) {
            setJobs(prev => prev.map(j =>
                j.id === jobId ? { ...j, isSaved: result.saved ?? false } : j
            ))
            toast.success(result.saved ? "Job saved!" : "Job removed from saved")
        }
    }, [isAuthenticated])

    const handleViewDetails = useCallback((job: FeedJobResult) => {
        setSelectedJob(job)
        setShowSkillGapModal(true)
    }, [])

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return

        setLoading(true)
        const result = await getForYouFeedJobs(page + 1, 20)

        if (result.success && result.data) {
            setJobs(prev => [...prev, ...result.data!.jobs])
            setPage(result.data.pagination.page)
            setHasMore(result.data.pagination.page < result.data.pagination.totalPages)
            setTotal(result.data.pagination.total)
        }
        setLoading(false)
    }, [loading, hasMore, page])

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center">
                        <LayoutList className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            Browse All Jobs
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {total} job{total !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
                <Link href="/jobs">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Swipe Mode</span>
                    </Button>
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <Input
                        placeholder="Search jobs, companies, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                    />
                </div>
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setIsFilterOpen(true)}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                </Button>
            </div>

            {/* Jobs List */}
            <AnimatePresence mode="popLayout">
                {jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job, index) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onSave={handleSaveJob}
                                onViewDetails={handleViewDetails}
                                showMatchScore={isAuthenticated}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <BrowseEmptyState />
                )}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? (
                            <InlineLoader size="sm" className="mr-2" />
                        ) : (
                            <ChevronDown className="w-4 h-4 mr-2" />
                        )}
                        Load More
                    </Button>
                </div>
            )}

            {/* Count */}
            {jobs.length > 0 && (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                    Showing {jobs.length} of {total} jobs
                </p>
            )}

            {/* Skill Gap Modal */}
            <SkillGapModal
                job={selectedJob}
                open={showSkillGapModal}
                onClose={() => {
                    setShowSkillGapModal(false)
                    setSelectedJob(null)
                }}
            />

            {/* Filter Sheet */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Filter Jobs</SheetTitle>
                        <SheetDescription>
                            Narrow down your job search
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Filter controls coming soon...</p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

function BrowseEmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
        >
            <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-neutral-600 dark:text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                No jobs available
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-6">
                There are no job postings at the moment. Check back later or explore companies to follow.
            </p>
            <Link href="/companies">
                <Button variant="outline" className="rounded-xl">
                    Explore Companies
                </Button>
            </Link>
        </motion.div>
    )
}
