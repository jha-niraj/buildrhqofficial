'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@repo/ui/components/ui/card'
import { 
    Loader2, CheckCircle2, MonitorPlay, Sparkles, BookOpen 
} from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { toast } from '@repo/ui/components/ui/sonner'
import { 
    Voice, VoiceConfig, VoiceCallbacks 
} from '@/components/main/voice'
import {
    prepareSprintMockKnowledge, getSprintMockStatus,
    saveSprintMockResult
} from '@/actions/(main)/projects/projectassessments.action'


// ============================================
// Types
// ============================================

interface SprintMockInterviewProps {
    projectId: string
    sprintId: string
    sprintName: string
    sprintNumber: number
    onComplete?: (score: number) => void
}

// ElevenLabs Agent ID for Sprint Mock Interviews
const SPRINT_MOCK_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_SPRINT_MOCK_AGENT_ID || ''

// ============================================
// Sprint Mock Interview Component
// ============================================

export default function SprintMockInterview({
    projectId,
    sprintId,
    sprintName,
    sprintNumber,
    onComplete
}: SprintMockInterviewProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [mockStatus, setMockStatus] = useState<{
        hasCompleted: boolean
        score: number | null
        lastAttempt: Date | null
    } | null>(null)
    const [knowledgeBase, setKnowledgeBase] = useState<string>('')
    const [topics, setTopics] = useState<string[]>([])
    const [isSessionActive, setIsSessionActive] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing')

    // Fetch mock status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            const result = await getSprintMockStatus(projectId, sprintId)
            if (result.success && result.data) {
                setMockStatus(result.data)
            }
        }
        fetchStatus()
    }, [projectId, sprintId])

    // Prepare knowledge base
    const handlePrepareInterview = async () => {
        setIsLoading(true)
        try {
            const result = await prepareSprintMockKnowledge(projectId, sprintId)
            if (result.success && result.data) {
                setKnowledgeBase(result.data.knowledgeBase)
                setTopics(result.data.topics)
            } else {
                toast.error(result.error || 'Failed to prepare interview')
            }
        } catch {
            toast.error('Error preparing interview')
        } finally {
            setIsLoading(false)
        }
    }

    // Start the interview session
    const handleStartInterview = () => {
        if (!knowledgeBase) {
            toast.error('Please prepare the interview first')
            return
        }
        setIsSessionActive(true)
    }

    // Handle session end - save results
    const handleSessionEnd = useCallback(async (conversationId: string) => {
        setIsProcessing(true)
        setProcessingStatus('processing')

        try {
            // Save the mock result with the conversation ID
            const result = await saveSprintMockResult(projectId, sprintId, conversationId)

            if (result.success && result.data) {
                setProcessingStatus('success')
                setMockStatus({
                    hasCompleted: true,
                    score: result.data.score,
                    lastAttempt: new Date()
                })

                toast.success(`Mock interview completed! Score: ${result.data.score}%`)
                onComplete?.(result.data.score)

                // Reset after a delay
                setTimeout(() => {
                    setIsSessionActive(false)
                    setIsProcessing(false)
                }, 2000)
            } else {
                setProcessingStatus('error')
                toast.error(result.error || 'Failed to save results')
                setTimeout(() => {
                    setIsSessionActive(false)
                    setIsProcessing(false)
                }, 2000)
            }
        } catch {
            setProcessingStatus('error')
            toast.error('Error saving interview results')
            setTimeout(() => {
                setIsSessionActive(false)
                setIsProcessing(false)
            }, 2000)
        }
    }, [projectId, sprintId, onComplete])

    // Voice component configuration
    const voiceConfig: VoiceConfig = {
        agentId: SPRINT_MOCK_AGENT_ID,
        userId: projectId,
        knowledgeBase: knowledgeBase,
        firstMessage: `Hello! I'm your AI interviewer for today. We'll be reviewing what you've learned in sprints 1 through ${sprintNumber}. Let's start with a few questions to assess your understanding. Are you ready?`,
        variables: {
            projectId,
            sprintId,
            sprintNumber: sprintNumber.toString(),
            sprintName
        },
        orbColors: ['#6366f1', '#404040'],
        title: `Sprint ${sprintNumber} Mock Interview`,
        subtitle: sprintName,
        stateLabels: {
            idle: { title: 'Ready to Begin?', subtitle: 'Click below to start your mock interview' },
            connecting: { title: 'Connecting...', subtitle: 'Setting up your interview' },
            listening: { title: 'Listening...', subtitle: 'Your turn to answer' },
            talking: { title: 'AI Interviewer', subtitle: 'Listen to the question' },
            processing: { title: 'Processing...', subtitle: 'Analyzing your performance' },
            completed: { title: 'Interview Complete!', subtitle: 'Great job!' },
            error: { title: 'Connection Error', subtitle: 'Please try again' }
        },
        buttonLabels: {
            start: 'Start Interview',
            end: 'End Interview'
        }
    }

    const voiceCallbacks: VoiceCallbacks = {
        onStart: () => {
            console.log('[SprintMock] Interview started')
        },
        onEnd: handleSessionEnd,
        onError: (error) => {
            console.error('[SprintMock] Interview error:', error)
            toast.error('Interview error: ' + error.message)
        }
    }

    // ============================================
    // Render: Already Completed
    // ============================================

    if (mockStatus?.hasCompleted && !isSessionActive) {
        return (
            <Card className="border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-neutral-700 dark:text-neutral-100">
                        <CheckCircle2 className="w-5 h-5" />
                        Sprint Review Completed!
                    </CardTitle>
                    <CardDescription className="text-neutral-800 dark:text-neutral-200">
                        You scored {mockStatus.score}% on the {sprintName} mock interview.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrepareInterview}
                            disabled={isLoading}
                        >
                            <MonitorPlay className="w-4 h-4 mr-2" />
                            Retake Interview
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ============================================
    // Render: Session Active with Voice Component
    // ============================================

    if (isSessionActive) {
        return (
            <div className="flex flex-col items-center py-8">
                <Voice
                    config={voiceConfig}
                    callbacks={voiceCallbacks}
                    showHeader={true}
                    orbSize="lg"
                    showProcessingDialog={isProcessing}
                    processingStatus={processingStatus}
                />

                {/* Knowledge Base Preview (collapsible) */}
                {knowledgeBase && !isProcessing && (
                    <div className="w-full max-w-lg mt-8 space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <BookOpen className="w-4 h-4" />
                            Interview Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {topics.slice(0, 8).map((topic, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {topic}
                                </Badge>
                            ))}
                            {topics.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                    +{topics.length - 8} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ============================================
    // Render: Knowledge Preview (Before Starting)
    // ============================================

    if (knowledgeBase) {
        return (
            <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MonitorPlay className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                        {sprintName} Mock Interview
                    </CardTitle>
                    <CardDescription>
                        Review your knowledge from sprints 1-{sprintNumber} in a mock interview.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {topics.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Topics to be covered:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {topics.slice(0, 10).map((topic, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {topic}
                                    </Badge>
                                ))}
                                {topics.length > 10 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{topics.length - 10} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
                        <p className="text-sm text-neutral-800 dark:text-neutral-100">
                            💡 Make sure you&apos;ve completed all tasks in sprints 1-{sprintNumber} before starting the mock interview for the best experience.
                        </p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
                        <p className="text-sm text-neutral-800 dark:text-neutral-100">
                            🎙️ This interview uses voice AI. Make sure your microphone is enabled and you&apos;re in a quiet environment.
                        </p>
                    </div>

                    <Button
                        onClick={handleStartInterview}
                        disabled={isLoading}
                        className="w-full bg-neutral-800 hover:bg-neutral-700 text-white"
                    >
                        <MonitorPlay className="w-4 h-4 mr-2" />
                        Start Mock Interview
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // ============================================
    // Render: Initial State
    // ============================================

    return (
        <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MonitorPlay className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                        Sprint {sprintNumber} Mock Interview
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        AI Powered
                    </Badge>
                </div>
                <CardDescription>
                    Complete an AI-powered mock interview to review your understanding of {sprintName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className={cn(
                        "p-3 rounded-lg",
                        "bg-neutral-50 dark:bg-neutral-900"
                    )}>
                        <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{sprintNumber}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Sprints</p>
                    </div>
                    <div className={cn(
                        "p-3 rounded-lg",
                        "bg-neutral-50 dark:bg-neutral-900"
                    )}>
                        <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">~10</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Minutes</p>
                    </div>
                    <div className={cn(
                        "p-3 rounded-lg",
                        "bg-neutral-50 dark:bg-neutral-900"
                    )}>
                        <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">5-8</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Questions</p>
                    </div>
                </div>

                <Button
                    onClick={handlePrepareInterview}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Prepare Interview
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
