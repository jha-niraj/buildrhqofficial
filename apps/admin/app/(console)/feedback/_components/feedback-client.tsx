"use client"

import { useState, useEffect, useCallback } from "react"
import {
    MessageCircle, Search, ChevronLeft, ChevronRight, Award, Trash2,
    CheckCircle, Clock, AlertCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import {
    getAllFeedback, updateFeedbackStatus, assignReward, deleteFeedback
} from "@/actions/main/feedback.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@repo/ui/components/ui/sheet"
import { Button } from "@repo/ui/components/ui/button"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import Image from "next/image"

export interface Feedback {
    id: string
    title: string
    description: string
    category: string
    status: string
    upvotes: number
    createdAt: Date | string
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    } | undefined
    // Rewards is 0-or-1 in practice (feedbackId is unique in the rewards
    // table), returned as an array by getAllFeedback() - see the comment
    // there. "Verified" below is derived from this rather than a schema
    // field: `feedbacks.isVerified` was removed from the schema at some
    // point and this page (and assignReward()) were left reading/writing a
    // column that no longer exists, so it silently never worked.
    rewards: Array<{ credits: number; xp: number | null }>
}

const itemsPerPage = 20

export function FeedbackClient({
    initialFeedback,
    initialTotal,
    initialPages,
    loadError,
}: {
    initialFeedback: Feedback[]
    initialTotal: number
    initialPages: number
    loadError: string | null | undefined
}) {
    const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback)
    const [totalFeedback, setTotalFeedback] = useState(initialTotal)
    const [totalPages, setTotalPages] = useState(initialPages)
    const [isLoading, setIsLoading] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<"all" | "BUG" | "FEATURE" | "UI" | "OTHER">("all")
    const [statusFilter, setStatusFilter] = useState<"all" | "UNDER_REVIEW" | "PLANNED" | "COMPLETED">("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
    const [showRewardDialog, setShowRewardDialog] = useState(false)
    const [firstLoad, setFirstLoad] = useState(true)

    useEffect(() => {
        if (loadError) toast.error(loadError || "Failed to fetch feedback")
    }, [loadError])

    const fetchFeedback = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getAllFeedback(
                {
                    search: searchQuery || undefined,
                    category: categoryFilter,
                    status: statusFilter,
                },
                {
                    page: currentPage,
                    limit: itemsPerPage,
                }
            )

            if (result.success) {
                setFeedback(result.data.feedback)
                setTotalFeedback(result.data.total)
                setTotalPages(result.data.pages)
            } else {
                toast.error(result.error || "Failed to fetch feedback")
            }
        } catch (error: unknown) {
            console.error("Failed to fetch feedback:", error)
            toast.error("Failed to fetch feedback")
        } finally {
            setIsLoading(false)
        }
    }, [categoryFilter, currentPage, statusFilter, searchQuery])

    useEffect(() => {
        if (firstLoad) { setFirstLoad(false); return }
        fetchFeedback()
    }, [currentPage, searchQuery, categoryFilter, statusFilter, fetchFeedback, firstLoad])

    useEffect(() => {
        if (firstLoad) return
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchFeedback()
            } else {
                setCurrentPage(1)
            }
        }, 500)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery])

    useEffect(() => {
        if (firstLoad) return
        if (currentPage !== 1) {
            setCurrentPage(1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter, statusFilter])

    const handleStatusChange = useCallback(async (feedbackId: string, newStatus: "UNDER_REVIEW" | "PLANNED" | "COMPLETED") => {
        try {
            const result = await updateFeedbackStatus(feedbackId, newStatus)
            if (result.success) {
                toast.success("Status updated successfully")
                fetchFeedback()
            } else {
                toast.error(result.error || "Failed to update status")
            }
        } catch (error: unknown) {
            console.error("Error occurred while updating status:", error)
            toast.error("Failed to update status")
        }
    }, [fetchFeedback])

    const handleAssignReward = useCallback(async (feedbackId: string, credits: number, xp: number) => {
        try {
            const result = await assignReward(feedbackId, credits, xp)
            if (result.success) {
                toast.success("Reward assigned successfully")
                setShowRewardDialog(false)
                setSelectedFeedback(null)
                fetchFeedback()
            } else {
                toast.error(result.error || "Failed to assign reward")
            }
        } catch (error: unknown) {
            console.error("Error occurred while assigning reward:", error)
            toast.error("Failed to assign reward")
        }
    }, [fetchFeedback])

    const handleDelete = useCallback(async (feedbackId: string) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return

        try {
            const result = await deleteFeedback(feedbackId)
            if (result.success) {
                toast.success("Feedback deleted successfully")
                fetchFeedback()
            } else {
                toast.error(result.error || "Failed to delete feedback")
            }
        } catch (error: unknown) {
            console.error("Error occurred while deleting feedback:", error)
            toast.error("Failed to delete feedback")
        }
    }, [fetchFeedback])

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "BUG": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            case "FEATURE": return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-100"
            case "UI": return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-100"
            default: return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle className="w-4 h-4 text-neutral-900" />
            case "PLANNED": return <Clock className="w-4 h-4 text-neutral-900" />
            default: return <AlertCircle className="w-4 h-4 text-neutral-900" />
        }
    }

    return (
        <div className="w-full p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <MessageCircle className="w-7 h-7" />
                        Feedback Management
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Review and respond to user feedback
                    </p>
                </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <Input
                            type="text"
                            placeholder="Search feedback..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-500 transition-all"
                        />
                    </div>
                    <Select
                        value={categoryFilter}
                        onValueChange={(value) => setCategoryFilter(value as "all" | "BUG" | "FEATURE" | "UI" | "OTHER")}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="BUG">Bug</SelectItem>
                            <SelectItem value="FEATURE">Feature</SelectItem>
                            <SelectItem value="UI">UI/UX</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as "all" | "UNDER_REVIEW" | "PLANNED" | "COMPLETED")}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                            <SelectItem value="PLANNED">Planned</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-4">
                {
                    isLoading ? (
                        <div className="text-center py-12">
                            <InlineLoader size="md" className="mx-auto" />
                        </div>
                    ) : feedback.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                            <MessageCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                            <p className="text-neutral-500 dark:text-neutral-400">No feedback found</p>
                        </div>
                    ) : (
                        feedback.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {
                                        item.user?.image ? (
                                            <Image
                                                src={item.user?.image ?? ""}
                                                alt={item.user?.name || item.user?.email || ""}
                                                className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800"
                                                height={32}
                                                width={32}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                                                    {item.user?.name?.[0]?.toUpperCase() || item.user?.email?.[0]?.toUpperCase() || ''}
                                                </span>
                                            </div>
                                        )
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(item.status)}
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium",
                                                    getCategoryColor(item.category)
                                                )}>
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                            <span>{item.user?.name || item.user?.email}</span>
                                            <span>•</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Award className="w-4 h-4" />
                                                {item.upvotes} upvotes
                                            </span>
                                            {
                                                item.rewards.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-neutral-900 flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Rewarded
                                                        </span>
                                                    </>
                                                )
                                            }
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={item.status}
                                                onValueChange={(value) => handleStatusChange(item.id, value as "UNDER_REVIEW" | "PLANNED" | "COMPLETED")}
                                            >
                                                <SelectTrigger className="w-auto">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                                    <SelectItem value="PLANNED">Planned</SelectItem>
                                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {
                                                item.rewards.length === 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFeedback(item)
                                                            setShowRewardDialog(true)
                                                        }}
                                                        className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-neutral-900 to-neutral-900 rounded-lg hover:from-neutral-800 hover:to-neutral-800 transition-colors flex items-center gap-2"
                                                    >
                                                        <Award className="w-4 h-4" />
                                                        Assign Reward
                                                    </button>
                                                )
                                            }
                                            {
                                                item.rewards[0] && (
                                                    <span className="px-3 py-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-200/10 rounded-lg flex items-center gap-2">
                                                        <Award className="w-4 h-4" />
                                                        {item.rewards[0].credits} credits{typeof item.rewards[0].xp === 'number' ? `, ${item.rewards[0].xp} XP` : ''}
                                                    </span>
                                                )
                                            }
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="ml-auto p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )
                }
            </div>
            {
                totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFeedback)} of {totalFeedback} items
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400 px-3">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            }
            <Sheet open={showRewardDialog && !!selectedFeedback} onOpenChange={setShowRewardDialog}>
                <SheetContent side="right" className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Assign Reward</SheetTitle>
                        <SheetDescription>{selectedFeedback?.title}</SheetDescription>
                    </SheetHeader>
                    {
                        selectedFeedback && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const credits = Number(formData.get("credits"));
                                    const xp = Number(formData.get("xp"));
                                    handleAssignReward(selectedFeedback.id, credits, xp);
                                }}
                                className="space-y-4 mt-4"
                            >
                                <div>
                                    <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Credits
                                    </Label>
                                    <Input
                                        type="number"
                                        name="credits"
                                        required
                                        min="0"
                                        defaultValue="100"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                    />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        XP (Optional)
                                    </Label>
                                    <Input
                                        type="number"
                                        name="xp"
                                        min="0"
                                        defaultValue="50"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowRewardDialog(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                    >
                                        Assign
                                    </Button>
                                </div>
                            </form>
                        )
                    }
                </SheetContent>
            </Sheet>
        </div>
    )
}
