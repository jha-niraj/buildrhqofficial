"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import {
    Briefcase, Plus, ArrowLeft, Search, Globe, Lock
} from "lucide-react"
import Link from "next/link"
import { getUserInterviewPlans } from "@/actions/(main)/ai/jobinterview.action"
import {
    InterviewPlanCard, type BaseInterviewPlan
} from "../../_components/interviewplancard"

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
    limit: number
}

interface InterviewPlanResponse {
    id: string
    position: string
    description: string | null
    cost: number
    originalCost: number | null
    technicalCount: number
    behavioralCount: number
    codingCount: number
    includeAnswers: boolean
    includePractice: boolean
    purchaseCount: number
    viewCount: number
    rating: number | null
    tags: string[]
    slug: string
    createdAt: Date
    creator: string
}

export default function MyPlansPage() {
    const [plans, setPlans] = useState<BaseInterviewPlan[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false,
        limit: 30
    })
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [visibility, setVisibility] = useState<"all" | "public" | "private">("all")

    const fetchPlans = useCallback(async (page = 1, searchQuery = search, visibilityFilter = visibility) => {
        setIsLoading(true)
        try {
            const response = await getUserInterviewPlans({
                page,
                limit: 30,
                search: searchQuery,
                visibility: visibilityFilter
            })
            if (response.success && response.data) {
                setPlans(response.data.plans.map((plan: InterviewPlanResponse) => ({
                    id: plan.id,
                    position: plan.position,
                    description: plan.description ?? undefined,
                    cost: plan.cost,
                    originalCost: plan.originalCost ?? undefined,
                    technicalCount: plan.technicalCount,
                    behavioralCount: plan.behavioralCount,
                    codingCount: plan.codingCount,
                    includeAnswers: plan.includeAnswers,
                    includePractice: plan.includePractice,
                    purchaseCount: plan.purchaseCount,
                    viewCount: plan.viewCount,
                    rating: plan.rating ?? undefined,
                    tags: plan.tags,
                    slug: plan.slug,
                    createdAt: plan.createdAt.toString(),
                    creator: plan.creator
                })))
                setPagination(response.data.pagination)
            }
        } catch (error) {
            console.error("Error fetching user plans:", error)
        } finally {
            setIsLoading(false)
        }
    }, [search, visibility])

    useEffect(() => {
        fetchPlans(1, search, visibility)
    }, [search, visibility, fetchPlans])

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchPlans(page, search, visibility)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br dark:from-black dark:via-neutral-900 dark:to-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">
                <div className="mb-8 lg:mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <Link href="/ai/interviewassistant" className="flex items-center border w-fit p-2 rounded-lg mb-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 dark:text-neutral-100 shadow-md hover:shadow-lg transition-all">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                My Interview Plans
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                                View and manage all your interview plans. {pagination.totalCount > 0 && `${pagination.totalCount} plan${pagination.totalCount !== 1 ? 's' : ''} found.`}
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 shadow-lg"
                        >
                            <Link href="/ai/interviewassistant" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Generate New
                            </Link>
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by position..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={visibility} onValueChange={(v: "all" | "public" | "private") => setVisibility(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Public Plans
                                    </div>
                                </SelectItem>
                                <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Private Plans
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex justify-end items-center">
                            <Link
                                href="/ai/interviewassistant/publicgenerations"
                                className="text-neutral-800 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-100 text-sm font-medium transition-colors"
                            >
                                Browse Public Plans →
                            </Link>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-64 bg-white/60 dark:bg-slate-800/60 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 lg:py-24"
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="h-8 w-8 text-neutral-800 dark:text-neutral-100" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                {search || visibility !== "all" ? "No plans found" : "No plans yet"}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8">
                                {search || visibility !== "all"
                                    ? "Try adjusting your search or filter settings."
                                    : "Start by generating your first interview plan."}
                            </p>
                            <Button
                                className="bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 shadow-lg"
                                asChild
                            >
                                <Link href="/ai/interviewassistant" className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    {search || visibility !== "all" ? "Create New Plan" : "Generate First Plan"}
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <InterviewPlanCard
                                        plan={plan}
                                        className="h-full"
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrev || isLoading}
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                        .filter(page =>
                                            page === 1 ||
                                            page === pagination.totalPages ||
                                            Math.abs(page - pagination.currentPage) <= 2
                                        )
                                        .map((page, idx, array) => (
                                            <div key={page} className="flex items-center">
                                                {idx > 0 && array[idx - 1] !== page - 1 && (
                                                    <span className="px-2 text-muted-foreground">...</span>
                                                )}
                                                <Button
                                                    variant={page === pagination.currentPage ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    disabled={isLoading}
                                                    className="min-w-[40px]"
                                                >
                                                    {page}
                                                </Button>
                                            </div>
                                        ))
                                    }
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNext || isLoading}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}