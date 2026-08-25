"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import {
    getPublicInterviewPlans, purchaseInterviewPlan
} from "@/actions/(main)/ai/jobinterview.action"
import {
    InterviewPlanCard, type BaseInterviewPlan
} from "../../_components/interviewplancard"
import { useSession } from '@repo/auth/client';
import { useRouter } from "next/navigation"
import toast from '@repo/ui/components/ui/sonner'

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

export default function PublicGenerationsPage() {
    const [plans, setPlans] = useState<BaseInterviewPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [q, setQ] = useState("")
    const [includeAnswers, setIncludeAnswers] = useState<"all" | "yes" | "no">("all")
    const [includePractice, setIncludePractice] = useState<"all" | "yes" | "no">("all")
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await getPublicInterviewPlans(100) // Get more plans to allow better filtering
                if (response.success && response.data) {
                    setPlans(response.data.map((plan: InterviewPlanResponse) => ({
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
                }
            } catch (error) {
                console.error("Error fetching public plans:", error)
                toast("Error", {
                    description: "Failed to load public interview plans",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchPlans()
    }, [])

    // const _filteredPositions = useMemo(() => {
    //     const s = new Set<string>(["All"])
    //     plans.forEach((p) => s.add(p.position))
    //     return Array.from(s)
    // }, [plans])

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase()
        return plans.filter((p) => {
            const matchQ = !ql || p.position.toLowerCase().includes(ql) ||
                (p.description && p.description.toLowerCase().includes(ql)) ||
                (p.tags && p.tags.some((tag: string) => tag.toLowerCase().includes(ql)))
            const matchAnswers = includeAnswers === "all" ||
                (includeAnswers === "yes" && p.includeAnswers) ||
                (includeAnswers === "no" && !p.includeAnswers)
            const matchPractice = includePractice === "all" ||
                (includePractice === "yes" && p.includePractice) ||
                (includePractice === "no" && !p.includePractice)
            return matchQ && matchAnswers && matchPractice
        })
    }, [plans, q, includeAnswers, includePractice])

    const handlePurchase = async (plan: BaseInterviewPlan) => {
        if (!session?.user) {
            toast("Authentication required", {
                description: "Please sign in to purchase interview plans",
            })
            return
        }

        setPurchasing(plan.id)

        try {
            const response = await purchaseInterviewPlan(plan.id)
            if (response.success && response.data) {
                toast("Purchase successful!", {
                    description: `You've purchased the interview plan for ${plan.position}. Redirecting...`,
                })

                // Redirect to the purchased plan
                setTimeout(() => {
                    router.push(`/ai/interviewassistant/${response.data.slug}`)
                }, 1500)
            } else {
                throw new Error(response.error || "Purchase failed")
            }
        } catch (error) {
            console.error("Purchase error:", error)
            toast("Purchase failed", {
                description: error instanceof Error ? error.message : "Failed to purchase plan",
            })
        } finally {
            setPurchasing(null)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br dark:from-black dark:via-neutral-900 dark:to-black">
            <section className="border-b border-border/50">
                <div className="mx-auto max-w-7xl px-4 py-10">
                    <div className="mb-6">
                        <Link href="/ai/interviewassistant" className="flex items-center border w-fit p-2 rounded-lg mb-4 border-neutral-200 hover:border-neutral-300 text-neutral-700 dark:text-neutral-100 shadow-md hover:shadow-lg transition-all">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold text-balance text-slate-900 dark:text-white">
                            Public Interview Plans
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Discover interview plans shared by the community. Purchase plans to get instant access to curated questions and answers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by position, description, or tags..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={includeAnswers} onValueChange={(v: "all" | "yes" | "no") => setIncludeAnswers(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="With Answers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                <SelectItem value="yes">With Answers</SelectItem>
                                <SelectItem value="no">Questions Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={includePractice} onValueChange={(v: "all" | "yes" | "no") => setIncludePractice(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Practice Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                <SelectItem value="yes">With Practice</SelectItem>
                                <SelectItem value="no">No Practice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            <section>
                <div className="mx-auto max-w-7xl px-4 py-10">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-64 bg-white/60 dark:bg-slate-800/60 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-8 w-8 text-neutral-800 dark:text-neutral-100" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                {plans.length === 0 ? "No public plans available" : "No plans match your filters"}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {plans.length === 0 ? "Be the first to share your interview plan with the community!" : "Try adjusting your search criteria to find more plans."}
                            </p>
                            <Button asChild>
                                <Link href="/ai/interviewassistant">
                                    Create Interview Plan
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {filtered.length} plan{filtered.length !== 1 ? 's' : ''} found
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filtered.map((plan) => (
                                    <InterviewPlanCard
                                        key={plan.id}
                                        plan={plan}
                                        primaryLabel="Purchase Plan"
                                        onPrimary={handlePurchase}
                                        disabled={purchasing === plan.id}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}
