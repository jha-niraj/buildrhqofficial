'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Progress } from '@repo/ui/components/ui/progress'
import {
    Copy, Loader2, Code2, Brain, CheckCircle2, User, BookOpen,
    ArrowRight, Sparkles
} from 'lucide-react'
import { copyPathfinderGoal } from '@/actions/(main)/pathfinder'
import { useUserStore } from '@/app/store/useUserStore'
import { PATHFINDER_CATEGORIES } from '@/types/pathfinder'
import { cn } from '@repo/ui/lib/utils'
import toast from '@repo/ui/components/ui/sonner'

interface SubGoal {
    id: string
    title: string
    description: string | null
    status: string
    hasCoding: boolean
    isAIGenerated?: boolean
}

interface GoalUser {
    id: string
    name: string | null
    username: string | null
    image: string | null
}

interface Goal {
    id: string
    title: string
    slug: string
    category: string
    level: string
    overview: string | null
    totalSubGoals: number
    completedSubGoals: number
    creditPrice: number | null
    subGoals: SubGoal[]
    user: GoalUser
}

interface GoalPreviewContentProps {
    goal: Goal
}

export function GoalPreviewContent({ goal }: GoalPreviewContentProps) {
    const router = useRouter()
    const { credits } = useUserStore()
    const [copying, setCopying] = useState(false)
    const category = PATHFINDER_CATEGORIES[goal.category as keyof typeof PATHFINDER_CATEGORIES]
    const price = goal.creditPrice ?? 0
    const canAfford = (credits ?? 0) >= price
    const isPaid = price > 0
    const progressPercent = goal.totalSubGoals > 0
        ? Math.round((goal.completedSubGoals / goal.totalSubGoals) * 100)
        : 0

    const handleCopy = async () => {
        setCopying(true)
        try {
            const result = await copyPathfinderGoal(goal.id)
            if (result.success && result.slug) {
                toast.success('Goal copied! Redirecting...')
                router.push(`/pathfinder/${result.slug}`)
            } else {
                toast.error(result.error || 'Failed to copy goal')
                if (result.code === 'INSUFFICIENT_CREDITS') {
                    toast.error(`You need ${result.required} credits. You have ${result.available}.`)
                }
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setCopying(false)
        }
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-6 max-w-3xl mx-auto">
                {/* Hero Section */}
                <div className="mb-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0",
                            category?.bg ?? "bg-neutral-100 dark:bg-neutral-800/30"
                        )}>
                            {category?.emoji ?? "🎯"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                                {goal.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-neutral-500">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    {goal.user?.name || goal.user?.username || 'Unknown'}
                                </span>
                                <Badge variant="secondary" className="text-xs capitalize">
                                    {goal.level.toLowerCase()}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                    {goal.category.replace('_', ' ').toLowerCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {goal.overview && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                            {goal.overview}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-neutral-500" />
                                <span className="text-xs text-neutral-500">Topics</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{goal.totalSubGoals}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                <span className="text-xs text-neutral-500">Completed</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{goal.completedSubGoals}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                <span className="text-xs text-neutral-500">Progress</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{progressPercent}%</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {goal.totalSubGoals > 0 && (
                        <div className="mb-4">
                            <Progress value={progressPercent} className="h-1.5" />
                        </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleCopy}
                            disabled={copying || (isPaid && !canAfford)}
                            size="lg"
                            className="gap-2"
                        >
                            {copying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            {isPaid ? `Copy for ${price} credits` : 'Copy to My Goals'}
                        </Button>
                        {isPaid && (
                            <span className="text-sm text-neutral-500">
                                {canAfford
                                    ? `You have ${credits ?? 0} credits`
                                    : `Need ${price - (credits ?? 0)} more credits`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Topics Grid */}
                {goal.subGoals && goal.subGoals.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-neutral-500" />
                            Study Plan ({goal.subGoals.length} topics)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {goal.subGoals.map((sg, idx) => (
                                <div
                                    key={sg.id}
                                    className="group p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-500 shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white leading-snug">
                                                {sg.title}
                                            </p>
                                            {sg.description && (
                                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {sg.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-2.5">
                                                <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-neutral-50 dark:bg-neutral-900/30 text-neutral-800 dark:text-neutral-100 border-0">
                                                    <Brain className="w-2.5 h-2.5" />
                                                    Quiz
                                                </Badge>
                                                {sg.hasCoding && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-neutral-50 dark:bg-neutral-900/30 text-neutral-800 dark:text-neutral-100 border-0">
                                                        <Code2 className="w-2.5 h-2.5" />
                                                        Coding
                                                    </Badge>
                                                )}
                                                {sg.isAIGenerated && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-0">
                                                        <Sparkles className="w-2.5 h-2.5" />
                                                        AI
                                                    </Badge>
                                                )}
                                                {sg.status === 'COMPLETED' && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-neutral-50 dark:bg-neutral-900/30 text-neutral-800 dark:text-neutral-100 border-0">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                        Done
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0 mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {goal.subGoals && goal.subGoals.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                        <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500">This goal has no topics yet.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
