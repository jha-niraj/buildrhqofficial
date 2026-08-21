'use client'

import { useEffect, useState } from 'react'
import { getRecentSubmissions } from '@/actions/(main)/projects/project.action'
import { Card, CardContent, CardHeader } from '@repo/ui/components/ui/card'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Badge } from '@repo/ui/components/ui/badge'
import { Button } from '@repo/ui/components/ui/button'
import {
    Github, ExternalLink, Trophy, Star, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { ProjectSubmission } from '@/types/project'

export function RecentSubmissionsGrid() {
    const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                setLoading(true)
                const result = await getRecentSubmissions(9)

                if (result.success && result.data) {
                    setSubmissions(result.data)
                } else {
                    setLoading(true)
                }
            } catch (err) {
                console.error("Error fetching recent submissions: " + err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [])

    if (loading) {
        return <RecentSubmissionsGridSkeleton />
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-600 dark:text-neutral-400">
                    Unable to load submissions. Please try again later.
                </p>
            </div>
        )
    }

    if (submissions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-600 dark:text-neutral-400">
                    No project submissions yet. Be the first to submit your project!
                </p>
            </div>
        )
    }

    const difficultyColors = {
        BEGINNER: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
        INTERMEDIATE: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
        ADVANCED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
                submissions.map((submission: ProjectSubmission) => (
                    <Card key={submission.id} className="h-full bg-white dark:bg-neutral-900 shadow-2xl rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge className={`${difficultyColors[submission.project?.difficulty as keyof typeof difficultyColors]} text-xs px-2 py-1`}>
                                    {submission.project?.difficulty}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Submitted
                                </Badge>
                            </div>

                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 leading-tight">
                                {submission.project?.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                                <Image
                                    src={submission.user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${submission.user?.name || 'User'}`}
                                    alt={submission.user?.name || 'User'}
                                    className="w-5 h-5 rounded-full"
                                    height={20}
                                    width={20}
                                />
                                <span className="font-medium">{submission.user?.name || submission.user?.username}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3 space-y-4">
                            <div className="flex flex-wrap gap-1">
                                {
                                    submission.project?.technologies?.slice(0, 3).map((tech: string) => (
                                        <Badge key={tech} variant="outline" className="text-xs">
                                            {tech}
                                        </Badge>
                                    ))
                                }
                                {
                                    submission.project?.technologies && submission.project.technologies.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{submission.project.technologies.length - 3}
                                        </Badge>
                                    )
                                }
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDistanceToNow(new Date(submission.submittedAt || submission.createdAt), { addSuffix: true })}</span>
                                </div>
                                {
                                    submission.upvotes && submission.upvotes > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-neutral-900 text-neutral-900 dark:text-neutral-100" />
                                            <span>{submission.upvotes}</span>
                                        </div>
                                    )
                                }
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                <Link href={submission.githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full rounded-xl border-neutral-200 dark:border-neutral-800">
                                        <Github className="w-4 h-4 mr-2" />
                                        Code
                                    </Button>
                                </Link>
                                {
                                    submission.liveUrl && (
                                        <Link href={submission.liveUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button size="sm" className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-xl">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Live
                                            </Button>
                                        </Link>
                                    )
                                }
                            </div>
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    )
}

export function RecentSubmissionsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
                [...Array(6)].map((_, i) => (
                    <Card key={i} className="h-full bg-white dark:bg-neutral-900 shadow-2xl rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <CardHeader className="pb-3 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-2/3" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-1">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                <Skeleton className="h-9 flex-1 rounded-xl" />
                                <Skeleton className="h-9 flex-1 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    )
}