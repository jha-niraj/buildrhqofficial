"use client"

import {
    Card, CardContent, CardFooter, CardHeader, CardTitle
} from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
    Star, Briefcase, Code, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter as DialogFooterUI,
    DialogHeader, DialogTitle, DialogTrigger
} from "@repo/ui/components/ui/dialog"

export interface BaseInterviewPlan {
    id: string
    position: string
    description?: string
    cost: number
    originalCost?: number
    technicalCount: number
    behavioralCount: number
    codingCount: number
    includeAnswers: boolean
    includePractice: boolean
    purchaseCount: number
    viewCount?: number
    rating?: number
    tags?: string[]
    slug: string
    createdAt: string
    creator: string
}

export function InterviewPlanCard({
    plan,
    onPrimary,
    primaryLabel = "Get this plan",
    disabled,
    className,
}: {
    plan: BaseInterviewPlan
    onPrimary?: (plan: BaseInterviewPlan) => void
    primaryLabel?: string
    disabled?: boolean
    className?: string
}) {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const totalQuestions = plan.technicalCount + plan.behavioralCount + plan.codingCount

    return (
        <Card
            className={cn(
                "border border-border/50 bg-white dark:bg-neutral-900 hover:shadow-lg transition-shadow flex flex-col",
                className,
            )}
        >
            <CardHeader className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-xl line-clamp-2">{plan.position}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-neutral-900/30 text-neutral-800 dark:text-neutral-100">
                                Public
                            </Badge>
                            <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                {plan.cost} Credits
                            </Badge>
                            {plan.originalCost && plan.originalCost !== plan.cost && (
                                <Badge variant="outline" className="text-xs">
                                    50% Off
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        {typeof plan.rating === "number" && (
                            <div className="flex items-center gap-1 justify-end text-neutral-800 dark:text-neutral-200">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium">{plan.rating.toFixed(1)}</span>
                            </div>
                        )}
                        {!!plan.purchaseCount && (
                            <div className="flex items-center gap-1 justify-end text-neutral-800 dark:text-neutral-100 text-xs">
                                <span>{plan.purchaseCount} purchases</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-2 flex-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {totalQuestions} Questions
                    </span>
                    <span>by {plan.creator}</span>
                </div>

                {/* Question breakdown */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {plan.technicalCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                            <Code className="h-3 w-3 mr-1" />
                            {plan.technicalCount} Technical
                        </Badge>
                    )}
                    {plan.behavioralCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {plan.behavioralCount} Behavioral
                        </Badge>
                    )}
                    {plan.codingCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                            <Code className="h-3 w-3 mr-1" />
                            {plan.codingCount} Coding
                        </Badge>
                    )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {plan.includeAnswers && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-100">
                            ✓ Answers
                        </Badge>
                    )}
                    {plan.includePractice && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-100">
                            ✓ Practice
                        </Badge>
                    )}
                </div>

                {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                )}

                {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {plan.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                {tag}
                            </Badge>
                        ))}
                        {plan.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                +{plan.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="px-5 pb-5">
                {onPrimary ? (
                    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" disabled={disabled}>
                                {primaryLabel}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Purchase Interview Plan</DialogTitle>
                                <DialogDescription>
                                    This interview plan will cost {plan.cost} credits. You&apos;ll get access to all {totalQuestions} questions
                                    {plan.includeAnswers ? ' with detailed answers' : ''}
                                    {plan.includePractice ? ' and practice mode' : ''}. Do you want to continue?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooterUI className="gap-2">
                                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={disabled}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        onPrimary?.(plan)
                                        setConfirmOpen(false)
                                    }}
                                    disabled={disabled}
                                >
                                    {disabled ? "Processing..." : "Confirm Purchase"}
                                </Button>
                            </DialogFooterUI>
                        </DialogContent>
                    </Dialog>
                ) : plan.slug ? (
                    <Button asChild className="w-full">
                        <Link href={`/ai/interviewassistant/${plan.slug}`}>Open</Link>
                    </Button>
                ) : (
                    <Button className="w-full" disabled>
                        Open
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
