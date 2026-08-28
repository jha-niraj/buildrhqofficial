'use client'

import Link from 'next/link'
import {
    Calendar, Clock, Eye, Play, CheckCircle2
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader,
    CardTitle
} from '@repo/ui/components/ui/card'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface SessionData {
    id: string
    status: string
    createdAt: Date
    completedAt: Date | null
    duration: number | null
    creditsUsed: number
    mock: {
        id: string
        title: string
        description: string
        level: string
        category: string
        duration: number | null
        creditsRequired: number
    }
}

interface SessionCardProps {
    session: SessionData
    userCredits: number
    onRetake: (session: SessionData) => void
    retakingId: string | null
}

export function SessionCard({ session, userCredits, onRetake, retakingId }: SessionCardProps) {
    const isCompleted = session.status === 'COMPLETED'
    const retakeCredits = Math.ceil((session.creditsUsed || session.mock.creditsRequired) / 2)

    const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const formatDuration = (secs: number | null) => {
        if (!secs) return '--'
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <Card className="border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow bg-white dark:bg-neutral-900">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                        {session.mock.title}
                    </CardTitle>
                    <Badge
                        variant={isCompleted ? 'default' : 'secondary'}
                        className={isCompleted ? 'bg-neutral-800' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100'}
                    >
                        {isCompleted ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {isCompleted ? 'Completed' : session.status}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                    {session.mock.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.createdAt)}
                    </span>
                    {
                        isCompleted && session.duration != null && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDuration(session.duration)}
                            </span>
                        )
                    }
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-0">
                {
                    isCompleted ? (
                        <>
                            <Button asChild className="flex-1" variant="outline">
                                <Link href={`/mock/voice/results/${session.id}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Result
                                </Link>
                            </Button>
                            <Button
                                variant="default" // Changed to default for emphasis
                                onClick={() => onRetake(session)}
                                disabled={retakingId === session.id || userCredits < retakeCredits}
                            >
                                {
                                    retakingId === session.id ? (
                                        <span className="flex items-center"><InlineLoader size="sm" className="mr-2" /> Retaking...</span>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Retake ({retakeCredits} cr)
                                        </>
                                    )
                                }
                            </Button>
                        </>
                    ) : (
                        <Button asChild className="w-full">
                            <Link href={`/mock/voice/interview/${session.id}`}>
                                <Play className="w-4 h-4 mr-2" />
                                Continue Interview
                            </Link>
                        </Button>
                    )
                }
            </CardFooter>
        </Card>
    )
}