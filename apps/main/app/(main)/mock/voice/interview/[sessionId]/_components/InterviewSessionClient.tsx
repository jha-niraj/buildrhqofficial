'use client'

import { use, useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useConversation } from '@elevenlabs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@repo/ui/components/ui/dialog'
import dynamic from 'next/dynamic'
import type { AgentState } from '@/components/main/orb'

const Orb = dynamic(() => import('@/components/main/orb').then(m => ({ default: m.Orb })), { ssr: false })
import {
    Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
    Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import { awaitBackgroundJob } from '@/hooks/use-background-job'
import {
    saveConversationData, updateSessionStatus, getSessionDetails,
    getElevenLabsToken
} from '@/actions/(main)/mockvoice/session.action'
import { 
    processConversationCompletion 
} from '@/actions/(main)/mockvoice/conversation.action'

interface SessionVariables {
    username: string
    position: string
    level: string
    description: string
    knowledge_base: string
    resume_content?: string | null
}

interface SessionData {
    id: string
    userId: string
    agentId: string | null
    variables: SessionVariables | null
    mock: {
        title: string
        description: string
        level: string
        category: string
        duration: number | null
    } | null
}

export default function MockInterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()

    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isMicMuted, setIsMicMuted] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [agentState, setAgentState] = useState<AgentState>(null)
    const [showProcessingDialog, setShowProcessingDialog] = useState(false)
    const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [hasStarted, setHasStarted] = useState(false)

    const conversationIdRef = useRef<string | null>(null)
    const intentionalEndRef = useRef(false)
    const isProcessingRef = useRef(false)

    // Handler for conversation end - defined before useConversation
    const handleConversationEnd = useCallback(async () => {
        if (!conversationIdRef.current || isProcessingRef.current) return
        isProcessingRef.current = true

        setShowProcessingDialog(true)
        setProcessingStatus('processing')

        try {
            // Hand the transcript off to the worker and follow the job. The
            // wait for ElevenLabs to finish processing happens on a Durable
            // Object alarm, so it no longer dies with this request.
            const result = await processConversationCompletion(
                resolvedParams.sessionId,
                conversationIdRef.current
            )

            if (!result.success || !result.jobId) {
                throw new Error(result.error ?? 'Failed to process interview')
            }

            const outcome = await awaitBackgroundJob(result.jobId)
            if (!outcome.ok) {
                throw new Error(outcome.error)
            }

            setProcessingStatus('success')

            // Wait a moment to show success state
            setTimeout(() => {
                router.push(`/mock/voice/results/${resolvedParams.sessionId}`)
            }, 1500)
        } catch (error) {
            console.error('Error processing conversation:', error)
            setProcessingStatus('error')
            const message = error instanceof Error ? error.message : 'Failed to process interview'
            toast.error(message)
        }
    }, [resolvedParams.sessionId, router])

    const conversation = useConversation({
        micMuted: isMicMuted,
        volume,
        onConnect: () => {
            console.log('[MockInterview] Connected to ElevenLabs')
            setAgentState('listening')
            toast.success('Interview started!')
        },
        onDisconnect: () => {
            console.log('[MockInterview] Disconnected from ElevenLabs, intentional:', intentionalEndRef.current)
            setAgentState(null)
            // Process when we have a conversation - supports both user click and 11 Labs AI-ended interview
            if (conversationIdRef.current && !isProcessingRef.current) {
                handleConversationEnd()
            }
        },
        onModeChange: (mode: { mode: string }) => {
            console.log('[MockInterview] Mode changed:', mode.mode)
            setAgentState(mode.mode === 'speaking' ? 'talking' : 'listening')
        },
        onError: (error: unknown) => {
            console.error('[MockInterview] Conversation error:', error)
            const message = error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : 'Connection error. Please try again.'
            toast.error(message)
            setAgentState(null)
            setHasStarted(false)
        },
        onMessage: (message: unknown) => {
            console.log('[MockInterview] Message:', message)
        },
    })

    // Load session details
    useEffect(() => {
        async function loadSession() {
            try {
                const result = await getSessionDetails(resolvedParams.sessionId)

                if (!result.success || !result.session) {
                    toast.error('Session not found')
                    router.push('/mock/voice')
                    return
                }

                // Transform session data to match our interface
                const session = result.session
                const transformedSession: SessionData = {
                    id: session.id,
                    userId: session.userId,
                    agentId: session.agentId,
                    variables: session.variables as SessionVariables | null,
                    mock: session.mock ? {
                        title: session.mock.title,
                        description: session.mock.description,
                        level: session.mock.level,
                        category: session.mock.category,
                        duration: session.mock.duration
                    } : null
                }

                setSessionData(transformedSession)
            } catch (error) {
                console.error('Error loading session:', error)
                toast.error('Failed to load session')
                router.push('/mock/voice')
            } finally {
                setIsLoading(false)
            }
        }

        loadSession()
    }, [resolvedParams.sessionId, router])

    // Request microphone permission on mount
    useEffect(() => {
        async function requestMicPermission() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
            } catch (error) {
                console.error('Microphone permission denied:', error)
                toast.error('Microphone access is required for voice interviews')
            }
        }

        requestMicPermission()
    }, [])

    const startInterview = async () => {
        if (!sessionData || !sessionData.variables) {
            toast.error('Session data missing. Please go back and try again.')
            return
        }

        try {
            setHasStarted(true)
            setAgentState('thinking')

            // Server action reads agentId from env - no client-side secret needed
            const tokenResult = await getElevenLabsToken()
            if (!tokenResult.success || !tokenResult.token) {
                toast.error('Failed to authenticate with voice agent')
                setAgentState(null)
                setHasStarted(false)
                return
            }

            // Update session status
            await updateSessionStatus(resolvedParams.sessionId, 'IN_PROGRESS')

            // Start ElevenLabs conversation - pass ALL variables including knowledge_base
            const variables = sessionData.variables

            const conversationId = await conversation.startSession({
                conversationToken: tokenResult.token,
                connectionType: 'webrtc',
                userId: sessionData.userId,
                dynamicVariables: {
                    username: variables.username,
                    position: variables.position,
                    level: variables.level,
                    description: variables.description,
                    knowledge_base: variables.knowledge_base,
                    resume_content: variables.resume_content || '',
                }
            })

            conversationIdRef.current = conversationId

            // Save conversation ID to database
            await saveConversationData(resolvedParams.sessionId, conversationId, new Date())

        } catch (error) {
            console.error('Error starting interview:', error)
            toast.error('Failed to start interview. Please try again.')
            setAgentState(null)
            setHasStarted(false)
        }
    }

    const endInterview = useCallback(async () => {
        try {
            intentionalEndRef.current = true
            await conversation.endSession()
            await updateSessionStatus(resolvedParams.sessionId, 'COMPLETED')
            setAgentState(null)
        } catch (error) {
            console.error('Error ending interview:', error)
            toast.error('Failed to end interview properly')
        }
    }, [conversation, resolvedParams.sessionId])

    const toggleMic = () => {
        setIsMicMuted(!isMicMuted)
        toast.info(isMicMuted ? 'Microphone unmuted' : 'Microphone muted')
    }

    const toggleVolume = () => {
        const newVolume = volume > 0 ? 0 : 0.8
        setVolume(newVolume)
        conversation.setVolume({ volume: newVolume })
        toast.info(newVolume > 0 ? 'Audio unmuted' : 'Audio muted')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{sessionData?.mock?.title}</h1>
                        <p className="text-neutral-600 dark:text-neutral-400">{sessionData?.mock?.description}</p>
                    </div>
                    <Badge className="text-sm">
                        {sessionData?.mock?.level}
                    </Badge>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl"
                >
                    <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
                        {
                            !hasStarted ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="text-6xl mb-4">🎙️</div>
                                    <h3 className="font-semibold text-lg mb-2">Interview Details</h3>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 text-center">
                                        {
                                            sessionData?.mock?.duration && (
                                                <p>Duration: {sessionData.mock.duration} minutes</p>
                                            )
                                        }
                                        {
                                            sessionData?.mock?.category && (
                                                <p>Category: {sessionData.mock.category}</p>
                                            )
                                        }
                                        <p className="mt-2">Voice-based AI interview with real-time feedback</p>
                                        <p>Ensure your microphone is ready before starting</p>
                                    </div>
                                </div>
                            ) : (
                                <Orb
                                    agentState={agentState}
                                    volumeMode="auto"
                                    getInputVolume={conversation.getInputVolume}
                                    getOutputVolume={conversation.getOutputVolume}
                                    colors={['#6366f1', '#404040']}
                                />
                            )
                        }
                    </div>
                    <div className="text-center mb-8">
                        <AnimatePresence mode="wait">
                            {
                                !hasStarted && (
                                    <motion.div
                                        key="ready"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <h2 className="text-3xl font-bold mb-2">Ready to Begin?</h2>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            Click the button below to start your mock interview
                                        </p>
                                    </motion.div>
                                )
                            }
                            {
                                hasStarted && agentState === 'thinking' && (
                                    <motion.div
                                        key="thinking"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <h2 className="text-2xl font-bold mb-2">Connecting...</h2>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            Setting up your interview session
                                        </p>
                                    </motion.div>
                                )
                            }
                            {
                                agentState === 'listening' && (
                                    <motion.div
                                        key="listening"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <h2 className="text-2xl font-bold mb-2">Listening...</h2>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            Your turn to speak
                                        </p>
                                    </motion.div>
                                )
                            }
                            {
                                agentState === 'talking' && (
                                    <motion.div
                                        key="talking"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <h2 className="text-2xl font-bold mb-2">Interviewer Speaking...</h2>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            Listen carefully to the question
                                        </p>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        {
                            !hasStarted ? (
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 text-white px-8 py-6 text-lg"
                                    onClick={startInterview}
                                >
                                    <Phone className="w-5 h-5 mr-2" />
                                    Start Interview
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        variant={isMicMuted ? 'destructive' : 'outline'}
                                        onClick={toggleMic}
                                        className="rounded-full w-14 h-14"
                                    >
                                        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="destructive"
                                        onClick={endInterview}
                                        className="rounded-full w-16 h-16"
                                    >
                                        <PhoneOff className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant={volume === 0 ? 'destructive' : 'outline'}
                                        onClick={toggleVolume}
                                        className="rounded-full w-14 h-14"
                                    >
                                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </Button>
                                </>
                            )
                        }
                    </div>
                </motion.div>
            </div>
            <Dialog
                open={showProcessingDialog}
                onOpenChange={(open) => {
                    // Only allow closing on error state
                    if (!open && processingStatus === 'error') {
                        setShowProcessingDialog(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
                    // Prevent closing during processing/success
                    if (processingStatus !== 'error') e.preventDefault()
                }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {processingStatus === 'processing' && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-neutral-800 dark:text-neutral-200" />
                                    Processing Your Interview
                                </>
                            )}
                            {processingStatus === 'success' && (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                                    Interview Completed!
                                </>
                            )}
                            {processingStatus === 'error' && (
                                <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    Processing Error
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {processingStatus === 'processing' && 'Please wait while we analyze your interview performance...'}
                            {processingStatus === 'success' && 'Redirecting to your results...'}
                            {processingStatus === 'error' && 'There was an issue processing your interview. You can still view your results.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <AnimatePresence mode="wait">
                            {processingStatus === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-3 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-neutral-800 dark:text-neutral-200" />
                                        <span>Retrieving conversation details...</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-neutral-800 dark:text-neutral-200" />
                                        <span>Generating transcript...</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-neutral-800 dark:text-neutral-200" />
                                        <span>Preparing your feedback...</span>
                                    </div>
                                </motion.div>
                            )}
                            {processingStatus === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex flex-col items-center justify-center py-8"
                                >
                                    <CheckCircle2 className="w-20 h-20 text-neutral-800 dark:text-neutral-200 mb-4" />
                                    <p className="text-center text-neutral-600 dark:text-neutral-400">
                                        Your interview has been successfully processed!
                                    </p>
                                </motion.div>
                            )}
                            {processingStatus === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-4 py-4"
                                >
                                    <AlertCircle className="w-16 h-16 text-red-400" />
                                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                                        Don&apos;t worry - your session data has been saved. You can still view partial results or try again.
                                    </p>
                                    <div className="flex gap-3 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowProcessingDialog(false)
                                                router.push('/mock/voice')
                                            }}
                                        >
                                            Back to Mocks
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={() => {
                                                setShowProcessingDialog(false)
                                                router.push(`/mock/voice/results/${resolvedParams.sessionId}`)
                                            }}
                                        >
                                            View Results
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}