'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Separator } from '@repo/ui/components/ui/separator'
import {
    Sparkles, Clock, Brain, CheckCircle, Play, AlertCircle,
    Trophy, Target, RotateCcw, Mic
} from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import { createMockVoiceSession, getMockSessionInfo } from '@/actions/(main)/mockvoice/session.action'
import Link from 'next/link'
import { cn } from '@repo/ui/lib/utils'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { AnimatedIcon, type AnimatedIconName } from '@repo/ui/components/animated-icons'
import { MOCK_CATEGORIES } from '../voice/_constants/mock-categories'

interface MockData {
    id: string
    title: string
    description: string
    category?: string
    level: string
    duration: number
    creditsRequired: number
    questionsCount?: number
    tags?: string[]
    byAdmin?: boolean
    popularity?: number
}

interface PurchaseMockSheetProps {
    isOpen: boolean
    onClose: () => void
    mock: MockData | null
    userCredits: number
}

interface SessionInfo {
    sessionCount: number
    isCreator: boolean
    freeSessionsRemaining: number
    needsPayment: boolean
    creditsToCharge: number
    fullPrice: number
}

const levelColors: Record<string, string> = {
    BEGINNER: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100',
    INTERMEDIATE: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100',
    ADVANCED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100',
    EXPERT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// The emoji map that was here is gone. It keyed the SAME categories as
// MOCK_CATEGORIES and had already drifted - it was missing `ALL` - which is the
// whole argument against a second copy. Icons now come from MOCK_CATEGORIES.
const iconForCategory = (category?: string | null): AnimatedIconName =>
    MOCK_CATEGORIES.find((c) => c.value === category)?.icon ?? 'learning'

export function PurchaseMockSheet({ isOpen, onClose, mock, userCredits }: PurchaseMockSheetProps) {
    const router = useRouter()
    const [isStarting, setIsStarting] = useState(false)
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
    const [isLoadingInfo, setIsLoadingInfo] = useState(false)

    useEffect(() => {
        if (isOpen && mock) {
            setIsLoadingInfo(true)
            getMockSessionInfo(mock.id)
                .then(r => { if (r.success && r.data) setSessionInfo(r.data) })
                .catch(() => {})
                .finally(() => setIsLoadingInfo(false))
        } else {
            setSessionInfo(null)
        }
    }, [isOpen, mock])

    if (!mock) return null

    const creditsNeeded = sessionInfo?.creditsToCharge ?? mock.creditsRequired
    const isFreeSession = sessionInfo ? !sessionInfo.needsPayment : false
    const hasEnoughCredits = isFreeSession || userCredits >= creditsNeeded

    const handleStart = async () => {
        if (!hasEnoughCredits) {
            toast.error(`You need ${creditsNeeded - userCredits} more credits`)
            return
        }
        setIsStarting(true)
        try {
            const result = await createMockVoiceSession({
                mockId: mock.id,
                mockType: 'predefined',
                includesResume: false,
                retakeCredits: isFreeSession
                    ? 0
                    : sessionInfo?.isCreator && sessionInfo.needsPayment
                        ? creditsNeeded
                        : undefined,
            })
            if (!result.success) throw new Error(result.error || 'Failed to create session')
            toast.success('Starting interview…')
            onClose()
            router.push(`/mock/voice/interview/${result.sessionId}`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to start interview')
            setIsStarting(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-y-auto">
                {/* Header */}
                <SheetHeader className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                            <AnimatedIcon name={iconForCategory(mock.category)} size={20} motion="always" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn('text-xs font-medium', levelColors[mock.level])}>
                                {mock.level}
                            </Badge>
                            {mock.byAdmin && (
                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs">
                                    Official
                                </Badge>
                            )}
                        </div>
                    </div>
                    <SheetTitle className="text-xl text-left leading-snug">{mock.title}</SheetTitle>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-left leading-relaxed mt-1">
                        {mock.description}
                    </p>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-5">
                    {/* Quick stats row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            <span className="text-lg font-bold">{mock.duration}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wide">min</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <Brain className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            <span className="text-lg font-bold">{mock.questionsCount ?? '-'}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wide">questions</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <Trophy className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            <span className="text-lg font-bold">{mock.popularity ?? 0}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wide">sessions</span>
                        </div>
                    </div>

                    {/* Tags */}
                    {mock.tags && mock.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {mock.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <Separator />

                    {/* Session info */}
                    {isLoadingInfo ? (
                        <div className="flex justify-center py-3">
                            <InlineLoader size="md" className="text-neutral-600 dark:text-neutral-400" />
                        </div>
                    ) : sessionInfo && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Your attempts</span>
                                </div>
                                <span className="font-semibold">{sessionInfo.sessionCount} / 3</span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                                <div
                                    className="bg-neutral-900 dark:bg-white h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (sessionInfo.sessionCount / 3) * 100)}%` }}
                                />
                            </div>
                            {sessionInfo.isCreator && sessionInfo.freeSessionsRemaining > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-200 dark:border-neutral-800/30 rounded-lg text-xs text-neutral-700 dark:text-neutral-100">
                                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    {sessionInfo.freeSessionsRemaining} free session{sessionInfo.freeSessionsRemaining > 1 ? 's' : ''} remaining - you created this mock
                                </div>
                            )}
                            {sessionInfo.isCreator && sessionInfo.needsPayment && (
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-200 dark:border-neutral-800/30 rounded-lg text-xs text-neutral-700 dark:text-neutral-100">
                                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                                    Creator discount: <span className="line-through ml-1">{sessionInfo.fullPrice}</span>
                                    <span className="font-semibold ml-1">{creditsNeeded} credits</span>
                                    <span className="ml-1 opacity-70">(50% off)</span>
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Session cost</p>
                            {!isFreeSession && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Your balance: {userCredits} credits</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            {isFreeSession ? (
                                <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">Free</span>
                            ) : (
                                <span className="text-2xl font-bold text-neutral-900 dark:text-white">{creditsNeeded}</span>
                            )}
                            {!isFreeSession && (
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">credits</span>
                            )}
                        </div>
                    </div>

                    {/* Insufficient credits warning */}
                    {!hasEnoughCredits && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            You need {creditsNeeded - userCredits} more credits to start
                        </div>
                    )}
                </div>

                {/* Sticky footer actions */}
                <div className="p-6 pt-0 space-y-3 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                    <Button
                        size="lg"
                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 text-base py-6 font-semibold"
                        onClick={handleStart}
                        disabled={!hasEnoughCredits || isStarting || isLoadingInfo}
                    >
                        {isStarting ? (
                            <>
                                <InlineLoader size="md" className="mr-2" />
                                Starting…
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5 mr-2" />
                                {isFreeSession ? 'Start Free Session' : 'Start Interview Now'}
                            </>
                        )}
                    </Button>
                    {!hasEnoughCredits && (
                        <Button size="lg" variant="outline" className="w-full" asChild>
                            <Link href="/purchase">
                                <Play className="w-4 h-4 mr-2" />
                                Get More Credits
                            </Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
