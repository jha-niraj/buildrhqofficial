'use client'

import { useState } from 'react'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import { Input } from '@repo/ui/components/ui/input'
import { Button } from '@repo/ui/components/ui/button'
import {
    Loader2, Sparkles, Target
} from 'lucide-react'
import { createSubGoal } from '@/actions/(main)/pathfinder/subgoals.action'
import type { GoalUsageSummary } from '@/app/store/pathfinderStore'
import { usePathfinderStore } from '@/app/store/pathfinderStore'
import { PATHFINDER_CREDITS } from '@/lib/constants/pricing'

interface CreateSubGoalSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    goalId: string
    onSuccess: (subGoal: {
        id: string
        title: string
        description: string | null
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
        source: string
        aiCodingProblem: unknown
        hasCoding: boolean
        quizCompleted: boolean
        quizScore: number | null
        codingCompleted: boolean
        codingPassed: boolean
        order: number
        studioId?: string | null
    }, _aiResources?: unknown, usageSummary?: GoalUsageSummary) => void
}

export function CreateSubGoalSheet({
    open,
    onOpenChange,
    goalId,
    onSuccess,
}: CreateSubGoalSheetProps) {
    const [title, setTitle] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const setGoalUsage = usePathfinderStore((s) => s.setGoalUsage)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await createSubGoal({
                goalId,
                title: title.trim(),
                source: 'text',
            })

            if (!result.success) {
                const err = result as { code?: string; pendingCredits?: number }
                if (err.code === 'USAGE_BLOCKED') {
                    setError(
                        `AI usage limit reached (${err.pendingCredits ?? 0} credits pending). ` +
                        `Add credits to continue. Threshold: ${PATHFINDER_CREDITS.usageBlockThreshold} credits.`
                    )
                } else {
                    setError(result.error ?? 'Failed to create sub-goal')
                }
                return
            }

            if (result.subGoal) {
                if (result.usageSummary) {
                    setGoalUsage(goalId, result.usageSummary)
                }
                onSuccess(
                    result.subGoal as Parameters<typeof onSuccess>[0],
                    undefined,
                    result.usageSummary
                )
                setTitle('')
                onOpenChange(false)
            }
        } catch (err) {
            console.error('Error creating sub-goal:', err)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (next: boolean) => {
        if (!isLoading) {
            setError(null)
            if (!next) setTitle('')
            onOpenChange(next)
        }
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                        Add Learning Task
                    </SheetTitle>
                    <SheetDescription>
                        What do you want to learn today? We&apos;ll generate resources, videos, docs, and practice content.
                        Cost is ~1-2 credits per sub-goal (Exa + OpenAI). Usage shown in top-right.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Topic
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. React Hooks, Array methods, REST APIs"
                            className="mt-1.5"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    {
                        error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )
                    }

                    {
                        !isLoading ? (
                            <Button
                                type="submit"
                                className="w-full bg-neutral-800 hover:bg-neutral-700"
                                disabled={!title.trim()}
                            >
                                Generate Content
                            </Button>
                        ) : (
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-neutral-900 dark:text-neutral-100 animate-spin" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                    Generating Content
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                    Fetching videos & docs (Exa) + creating content (OpenAI)
                                </p>
                                <p className="text-xs text-neutral-400">
                                    This usually takes 5-10 seconds
                                </p>
                            </div>
                        )
                    }
                </form>
            </SheetContent>
        </Sheet>
    )
}