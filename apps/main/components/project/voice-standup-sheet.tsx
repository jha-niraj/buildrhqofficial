'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Mic, Loader2, CheckCircle2, ArrowRight, Calendar, Clock
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import { Badge } from '@repo/ui/components/ui/badge'
import toast from '@repo/ui/components/ui/sonner'
import {
    Voice, VoiceConfig, VoiceCallbacks
} from '@/components/main/voice'
import { cn } from '@repo/ui/lib/utils'
import { createStandupSession, processStandupConversation } from '@/actions/(main)/projects/standup-voice.action'
import { awaitBackgroundJob } from '@/hooks/use-background-job'

// ElevenLabs Agent configuration for daily standups
// Use the mock voice agent if standup agent is not configured
const STANDUP_AGENT_ID = process.env.NEXT_PUBLIC_STANDUP_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_MOCKVOICE || ''

interface VoiceStandupSheetProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectSlug: string
    projectTitle: string
    userId: string
    userName: string
    /** Previous standup info to provide context */
    previousStandup?: {
        date: string
        completedTasks: string[]
        plannedTasks: string[]
    }
    /** Called when standup is completed successfully */
    onComplete?: (data: StandupSubmission) => void
}

export interface StandupSubmission {
    conversationId: string
    projectId: string
    projectSlug: string
    date: string
}

type StandupStep = 'intro' | 'voice' | 'processing' | 'complete'

export default function VoiceStandupSheet({
    isOpen,
    onClose,
    projectId,
    projectSlug,
    projectTitle,
    userId,
    userName,
    previousStandup,
    onComplete
}: VoiceStandupSheetProps) {
    const [step, setStep] = useState<StandupStep>('intro')
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [conversationId, setConversationId] = useState<string | null>(null)
    console.log(conversationId)
    const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing')

    // Reset state when sheet opens
    useEffect(() => {
        if (isOpen) {
            setStep('intro')
            setConversationId(null)
            setProcessingStatus('processing')
        }
    }, [isOpen])

    // Generate the standup prompt with context
    const generateStandupPrompt = useCallback(() => {
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        let contextSection = ''
        if (previousStandup) {
            contextSection = `
PREVIOUS STANDUP (${previousStandup.date}):
- Completed: ${previousStandup.completedTasks.join(', ')}
- Planned: ${previousStandup.plannedTasks.join(', ')}
`
        }

        return `You are a friendly and professional Scrum Master conducting a daily standup meeting. Today is ${today}.

            CONTEXT:
            - Project: ${projectTitle}
            - Team Member: ${userName}
            ${contextSection}

            YOUR ROLE:
            1. Greet the team member warmly
            2. Ask the three standup questions one at a time:
            - What did you accomplish yesterday?
            - What do you plan to work on today?
            - Do you have any blockers or need help with anything?
            3. Listen actively and ask clarifying questions if needed
            4. Keep the conversation focused and time-efficient (5-10 minutes)
            5. Summarize what was discussed at the end
            6. Provide encouragement and close the standup positively

            TONE:
            - Professional but friendly
            - Supportive and encouraging
            - Concise but not rushed
            - Focus on understanding their progress and challenges

            IMPORTANT:
            - Always ask follow-up questions if answers are vague
            - Help identify potential risks or blockers
            - Encourage the team member when they share accomplishments
            - Keep the conversation natural and conversational
        `
    }, [projectTitle, userName, previousStandup])

    const generateFirstMessage = useCallback(() => {
        const greeting = getTimeBasedGreeting()
        return `${greeting}, ${userName}! Ready for your daily standup for ${projectTitle}? Let's make this quick and productive. First, what did you work on yesterday?`
    }, [userName, projectTitle])

    const voiceConfig: VoiceConfig = {
        agentId: STANDUP_AGENT_ID,
        userId,
        knowledgeBase: generateStandupPrompt(),
        firstMessage: generateFirstMessage(),
        orbColors: ['#10b981', '#34d399'], // Green theme for standups
        title: 'Daily Standup',
        subtitle: projectTitle,
        stateLabels: {
            idle: { title: 'Ready to Start', subtitle: 'Click to begin your standup' },
            connecting: { title: 'Connecting...', subtitle: 'Setting up your standup session' },
            listening: { title: 'Your Turn', subtitle: 'Share your update' },
            talking: { title: 'Scrum Master Speaking', subtitle: 'Listen to the question' },
            processing: { title: 'Processing Standup', subtitle: 'Analyzing your updates...' },
            completed: { title: 'Standup Complete!', subtitle: 'Great job staying consistent!' },
            error: { title: 'Connection Error', subtitle: 'Please try again' }
        },
        buttonLabels: {
            start: 'Start Standup',
            end: 'End Standup'
        }
    }

    const voiceCallbacks: VoiceCallbacks = {
        onStart: () => {
            console.log('[VoiceStandup] Session started')
        },
        onEnd: async (convId) => {
            console.log('[VoiceStandup] Session ended:', convId)
            setConversationId(convId)
            setStep('processing')
            setProcessingStatus('processing')

            try {
                // Hand off to the worker, then follow the job. The waiting - for
                // ElevenLabs to finish the transcript, then for the summary -
                // happens on a Durable Object alarm, so closing this sheet no
                // longer loses the standup.
                const result = await processStandupConversation(sessionId || projectId, convId)

                if (!result.success || !result.jobId) {
                    throw new Error(result.error || 'Failed to process standup')
                }

                const outcome = await awaitBackgroundJob(result.jobId)
                if (!outcome.ok) {
                    throw new Error(outcome.error)
                }

                setProcessingStatus('success')
                setStep('complete')

                // Callback with completion data
                onComplete?.({
                    conversationId: convId,
                    projectId,
                    projectSlug,
                    date: new Date().toISOString()
                })

            } catch (error) {
                console.error('[VoiceStandup] Processing error:', error)
                setProcessingStatus('error')
                toast.error('Failed to process standup. Your data has been saved.')
            }
        },
        onError: (error) => {
            console.error('[VoiceStandup] Error:', error)
            toast.error('Connection error. Please try again.')
        }
    }

    const handleStartVoice = async () => {
        try {
            // Create session on the server first
            const result = await createStandupSession(projectId, projectSlug)

            if (!result.success) {
                toast.error(result.error || 'Failed to start standup')
                return
            }

            setSessionId(result.sessionId!)
            setStep('voice')
        } catch (error) {
            console.error('[VoiceStandup] Error starting session:', error)
            toast.error('Failed to start standup session')
        }
    }

    const handleClose = () => {
        if (step === 'voice') {
            // Warn user before closing during active session
            if (confirm('Are you sure you want to end the standup?')) {
                onClose()
            }
        } else {
            onClose()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            step === 'complete'
                                ? "bg-neutral-100 dark:bg-neutral-800/30"
                                : "bg-gradient-to-br from-neutral-900 to-neutral-900"
                        )}>
                            {
                                step === 'complete' ? (
                                    <CheckCircle2 className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                                ) : (
                                    <Mic className="w-5 h-5 text-white" />
                                )
                            }
                        </div>
                        <div>
                            <SheetTitle className="text-xl">Voice Standup</SheetTitle>
                            <SheetDescription className="text-sm">
                                {projectTitle}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <AnimatePresence mode="wait">
                    {
                        step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-800 mb-3 flex items-center gap-2">
                                        🎙️ Voice Standup Session
                                    </h3>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-700 mb-4">
                                        Have a natural conversation with our AI Scrum Master. Share your progress, plans, and blockers just like a real standup meeting.
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                                            <div className="text-lg mb-1">📝</div>
                                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-100">Yesterday</div>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                                            <div className="text-lg mb-1">🎯</div>
                                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-100">Today</div>
                                        </div>
                                        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                                            <div className="text-lg mb-1">🚧</div>
                                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-100">Blockers</div>
                                        </div>
                                    </div>
                                </div>

                                {
                                    previousStandup && (
                                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                                                <Calendar className="w-4 h-4" />
                                                Last standup: {previousStandup.date}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Planned: </span>
                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                        {previousStandup.plannedTasks.slice(0, 2).join(', ')}
                                                        {previousStandup.plannedTasks.length > 2 && ` +${previousStandup.plannedTasks.length - 2} more`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                <div className="flex items-center justify-between py-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Estimated time: 5-10 minutes</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                        5 credits
                                    </Badge>
                                </div>
                                <Button
                                    onClick={handleStartVoice}
                                    className="w-full bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 text-white py-6 text-lg gap-2"
                                    disabled={!STANDUP_AGENT_ID}
                                >
                                    {
                                        !STANDUP_AGENT_ID ? (
                                            <>Agent not configured</>
                                        ) : (
                                            <>
                                                Start Voice Standup
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )
                                    }
                                </Button>
                            </motion.div>
                        )
                    }
                    {
                        step === 'voice' && (
                            <motion.div
                                key="voice"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="min-h-[500px] flex flex-col items-center justify-center"
                            >
                                <Voice
                                    config={voiceConfig}
                                    callbacks={voiceCallbacks}
                                    orbSize="lg"
                                    showProcessingDialog={false}
                                />
                            </motion.div>
                        )
                    }
                    {
                        step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="min-h-[400px] flex flex-col items-center justify-center space-y-6"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-900 flex items-center justify-center">
                                        {
                                            processingStatus === 'processing' && (
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            )
                                        }
                                        {
                                            processingStatus === 'success' && (
                                                <CheckCircle2 className="w-8 h-8 text-white" />
                                            )
                                        }
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2">
                                        {processingStatus === 'processing' ? 'Processing Your Standup' : 'Processing Complete!'}
                                    </h3>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        {
                                            processingStatus === 'processing'
                                                ? 'Extracting insights from your standup...'
                                                : 'Your standup has been recorded successfully!'
                                        }
                                    </p>
                                </div>
                            </motion.div>
                        )
                    }
                    {
                        step === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center">
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-800 mb-2">
                                        Standup Complete! 🎉
                                    </h3>
                                    <p className="text-neutral-800 dark:text-neutral-700">
                                        Great job staying consistent with your daily standups. Keep up the momentum!
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 text-center border border-neutral-200 dark:border-neutral-800">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">🔥</div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Streak maintained</div>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 text-center border border-neutral-200 dark:border-neutral-800">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">✅</div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Recorded</div>
                                    </div>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full"
                                >
                                    Done
                                </Button>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    )
}

// Helper function to get time-based greeting
function getTimeBasedGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}