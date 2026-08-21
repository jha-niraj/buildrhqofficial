'use client'

import { motion } from 'framer-motion'
import {
    Lock, ArrowLeft, Brain, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@repo/ui/components/ui/button'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@repo/ui/components/ui/card'
import { Progress } from '@repo/ui/components/ui/progress'

interface ProgressGateProps {
    type: 'quiz' | 'mock'
    currentProgress: number
    requiredProgress: number
    projectSlug: string
    projectTitle: string
}

export function ProgressGate({ type, currentProgress, requiredProgress, projectSlug, projectTitle }: ProgressGateProps) {
    const Icon = type === 'quiz' ? Brain : Sparkles
    const title = type === 'quiz' ? 'Quiz Assessment' : 'AI Mock Interview'
    const description = type === 'quiz'
        ? 'Test your knowledge with an AI-generated quiz'
        : 'Practice with an AI-powered mock interview'

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <Link
                        href={`/projects/${projectSlug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-full backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Project
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center min-h-[60vh]"
                >
                    <Card className="p-4 max-w-lg w-full bg-white dark:bg-neutral-900 shadow-2xl rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <CardHeader className="text-center pb-4">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-neutral-100 dark:bg-neutral-800/30 rounded-full">
                                    <Lock className="w-12 h-12 text-neutral-800 dark:text-neutral-100" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl flex items-center justify-center gap-2">
                                <Icon className="w-6 h-6" />
                                {title} Locked
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600 dark:text-neutral-400">Current Progress</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">
                                        {Math.round(currentProgress)}%
                                    </span>
                                </div>
                                <Progress value={currentProgress} className="h-3" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600 dark:text-neutral-400">Required to Unlock</span>
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                                        {requiredProgress}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Complete <span className="font-semibold text-neutral-900 dark:text-white">{requiredProgress}% of {projectTitle}</span> to unlock this feature.
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    You need {requiredProgress - Math.round(currentProgress)}% more progress
                                </p>
                            </div>
                            <div className="space-y-4">
                                <Link href={`/projects/${projectSlug}/tasks`} className="block">
                                    <Button className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-xl">
                                        Continue Working on Tasks
                                    </Button>
                                </Link>
                                <Link href={`/projects/${projectSlug}`} className="block">
                                    <Button variant="outline" className="w-full rounded-xl">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Project Details
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}