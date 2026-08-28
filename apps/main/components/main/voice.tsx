'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useConversation } from '@/lib/elevenlabs/use-conversation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@repo/ui/components/ui/button'
import dynamic from 'next/dynamic'
import type { AgentState } from '@/components/main/orb'

const Orb = dynamic(() => import('@/components/main/orb').then(m => ({ default: m.Orb })), { ssr: false })
import {
    Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
    CheckCircle2, AlertCircle
} from 'lucide-react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle
} from '@repo/ui/components/ui/dialog'
import toast from '@repo/ui/components/ui/sonner'
import { cn } from '@repo/ui/lib/utils'
import { getElevenLabsToken } from '@/actions/(main)/mockvoice/session.action'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

export type VoiceSessionStatus = 'idle' | 'connecting' | 'active' | 'processing' | 'completed' | 'error'

export interface VoiceConfig {
    /** ElevenLabs Agent ID */
    agentId: string
    /** User ID for the session */
    userId?: string
    /** Custom knowledge base / system prompt override */
    knowledgeBase?: string
    /** First message the agent will say */
    firstMessage?: string
    /** Variables to pass to the agent (for prompt templating) */
    variables?: Record<string, string>
    /** Colors for the Orb visualization */
    orbColors?: [string, string]
    /** Title shown in the UI */
    title?: string
    /** Subtitle/description shown in the UI */
    subtitle?: string
    /** Labels for different states */
    stateLabels?: {
        idle?: { title: string; subtitle: string }
        connecting?: { title: string; subtitle: string }
        listening?: { title: string; subtitle: string }
        talking?: { title: string; subtitle: string }
        processing?: { title: string; subtitle: string }
        completed?: { title: string; subtitle: string }
        error?: { title: string; subtitle: string }
    }
    /** Button labels */
    buttonLabels?: {
        start?: string
        end?: string
    }
}

export interface VoiceCallbacks {
    /** Called when the conversation starts */
    onStart?: () => void
    /** Called when the conversation ends with the conversation ID */
    onEnd?: (conversationId: string) => void
    /** Called when an error occurs */
    onError?: (error: Error) => void
    /** Called when the agent state changes */
    onStateChange?: (state: AgentState) => void
    /** Called when processing is complete */
    onProcessingComplete?: () => void
}

export interface VoiceProps {
    config: VoiceConfig
    callbacks?: VoiceCallbacks
    /** Whether to show the header with title */
    showHeader?: boolean
    /** Custom class name for the container */
    className?: string
    /** Orb size (width/height) */
    orbSize?: 'sm' | 'md' | 'lg' | 'xl'
    /** Show processing dialog */
    showProcessingDialog?: boolean
    /** Processing status for external control */
    processingStatus?: 'processing' | 'success' | 'error'
}

const DEFAULT_STATE_LABELS = {
    idle: { title: 'Ready to Begin?', subtitle: 'Click the button below to start' },
    connecting: { title: 'Connecting...', subtitle: 'Setting up your session' },
    listening: { title: 'Listening...', subtitle: 'Your turn to speak' },
    talking: { title: 'Speaking...', subtitle: 'Listen carefully' },
    processing: { title: 'Processing...', subtitle: 'Analyzing your session' },
    completed: { title: 'Completed!', subtitle: 'Session has ended' },
    error: { title: 'Error', subtitle: 'Something went wrong' }
}

const ORB_SIZES = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
    xl: 'max-w-lg'
}

export function Voice({
    config,
    callbacks,
    showHeader = false,
    className,
    orbSize = 'md',
    showProcessingDialog = false,
    processingStatus = 'processing'
}: VoiceProps) {
    const [isMicMuted, setIsMicMuted] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [agentState, setAgentState] = useState<AgentState>(null)
    const [sessionStatus, setSessionStatus] = useState<VoiceSessionStatus>('idle')
    const [showDialog, setShowDialog] = useState(false)

    const conversationIdRef = useRef<string | null>(null)
    const hasStartedRef = useRef(false)

    const stateLabels = { ...DEFAULT_STATE_LABELS, ...config.stateLabels }

    const conversation = useConversation({
        micMuted: isMicMuted,
        volume,
        onConnect: () => {
            console.log('[Voice] Connected to ElevenLabs')
            setAgentState('listening')
            setSessionStatus('active')
            toast.success(config.title ? `${config.title} started!` : 'Session started!')
            callbacks?.onStart?.()
        },
        onDisconnect: () => {
            console.log('[Voice] Disconnected from ElevenLabs')
            setAgentState(null)
            if (hasStartedRef.current && conversationIdRef.current) {
                handleSessionEnd()
            }
        },
        onModeChange: (mode: { mode: string }) => {
            console.log('[Voice] Mode changed:', mode)
            const newState: AgentState = mode.mode === 'speaking' ? 'talking' : 'listening'
            setAgentState(newState)
            callbacks?.onStateChange?.(newState)
        },
        onError: (error: unknown) => {
            console.error('[Voice] Error:', error)
            toast.error('Connection error. Please try again.')
            setAgentState(null)
            setSessionStatus('error')
            callbacks?.onError?.(new Error(String(error)))
        },
        onMessage: (message: unknown) => {
            console.log('[Voice] Message:', message)
        },
    })

    // Update agent state in callbacks
    useEffect(() => {
        callbacks?.onStateChange?.(agentState)
    }, [agentState, callbacks])

    // Request microphone permission on mount
    useEffect(() => {
        async function requestMicPermission() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
            } catch (error) {
                console.error('[Voice] Microphone permission denied:', error)
                toast.error('Microphone access is required')
            }
        }
        requestMicPermission()
    }, [])

    const startSession = useCallback(async () => {
        if (!config.agentId) {
            toast.error('Agent configuration is missing')
            return
        }

        try {
            hasStartedRef.current = true
            setSessionStatus('connecting')
            setAgentState('thinking')

            const tokenResult = await getElevenLabsToken(config.agentId)
            if (!tokenResult.success || !tokenResult.token) {
                toast.error('Failed to authenticate with voice agent')
                setAgentState(null)
                setSessionStatus('error')
                hasStartedRef.current = false
                return
            }

            const conversationId = await conversation.startSession({
                conversationToken: tokenResult.token,
                connectionType: 'webrtc',
                userId: config.userId,
                dynamicVariables: config.variables
            })

            conversationIdRef.current = conversationId

        } catch (error) {
            console.error('[Voice] Error starting session:', error)
            toast.error('Failed to start session. Please try again.')
            setAgentState(null)
            setSessionStatus('error')
            hasStartedRef.current = false
            callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)))
        }
    }, [config, conversation, callbacks])

    const endSession = useCallback(async () => {
        try {
            await conversation.endSession()
            setSessionStatus('processing')
        } catch (error) {
            console.error('[Voice] Error ending session:', error)
            toast.error('Failed to end session properly')
        }
    }, [conversation])

    const handleSessionEnd = useCallback(() => {
        if (!conversationIdRef.current) return

        setShowDialog(true)
        setSessionStatus('processing')
        callbacks?.onEnd?.(conversationIdRef.current)
    }, [callbacks])

    const toggleMic = useCallback(() => {
        setIsMicMuted(prev => {
            const newValue = !prev
            toast.info(newValue ? 'Microphone muted' : 'Microphone unmuted')
            return newValue
        })
    }, [])

    const toggleVolume = useCallback(() => {
        const newVolume = volume > 0 ? 0 : 0.8
        setVolume(newVolume)
        conversation.setVolume({ volume: newVolume })
        toast.info(newVolume > 0 ? 'Audio unmuted' : 'Audio muted')
    }, [volume, conversation])

    // Determine current display state
    const getCurrentState = (): keyof typeof stateLabels => {
        if (sessionStatus === 'processing') return 'processing'
        if (sessionStatus === 'completed') return 'completed'
        if (sessionStatus === 'error') return 'error'
        if (sessionStatus === 'connecting') return 'connecting'
        if (agentState === 'thinking') return 'connecting'
        if (agentState === 'listening') return 'listening'
        if (agentState === 'talking') return 'talking'
        return 'idle'
    }

    const currentState = getCurrentState()
    const currentLabels = stateLabels[currentState]
    const isActive = sessionStatus === 'active' || sessionStatus === 'connecting'

    return (
        <div className={cn("flex flex-col items-center", className)}>
            {
                showHeader && config.title && (
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold">{config.title}</h1>
                        {
                            config.subtitle && (
                                <p className="text-neutral-600 dark:text-neutral-400">{config.subtitle}</p>
                            )
                        }
                    </div>
                )
            }
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("relative w-full aspect-square mb-8", ORB_SIZES[orbSize])}
            >
                <Orb
                    agentState={agentState}
                    volumeMode="auto"
                    getInputVolume={conversation.getInputVolume}
                    getOutputVolume={conversation.getOutputVolume}
                    colors={config.orbColors || ['#737373', '#404040']}
                />
            </motion.div>
            <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentState}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <h2 className="text-2xl font-bold mb-2">{currentLabels.title}</h2>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            {currentLabels.subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex items-center justify-center gap-4">
                {
                    sessionStatus === 'idle' ? (
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700 text-white px-8 py-6 text-lg"
                            onClick={startSession}
                        >
                            <Phone className="w-5 h-5 mr-2" />
                            {config.buttonLabels?.start || 'Start Session'}
                        </Button>
                    ) : isActive ? (
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
                                onClick={endSession}
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
                    ) : null
                }
            </div>
            {
                showProcessingDialog && (
                    <Dialog open={showDialog} onOpenChange={() => { }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {
                                        processingStatus === 'processing' && (
                                            <>
                                                <InlineLoader size="md" className="text-neutral-800 dark:text-neutral-200" />
                                                {stateLabels.processing.title}
                                            </>
                                        )
                                    }
                                    {
                                        processingStatus === 'success' && (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                                                {stateLabels.completed.title}
                                            </>
                                        )
                                    }
                                    {
                                        processingStatus === 'error' && (
                                            <>
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                {stateLabels.error.title}
                                            </>
                                        )
                                    }
                                </DialogTitle>
                                <DialogDescription>
                                    {processingStatus === 'processing' && stateLabels.processing.subtitle}
                                    {processingStatus === 'success' && stateLabels.completed.subtitle}
                                    {processingStatus === 'error' && stateLabels.error.subtitle}
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                )
            }
        </div>
    )
}

// Export types for external use
export type { AgentState }
