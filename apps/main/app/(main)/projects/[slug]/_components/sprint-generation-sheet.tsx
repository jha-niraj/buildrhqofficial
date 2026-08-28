'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles, Rocket, Clock, Target, Code2, XCircle
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@repo/ui/components/ui/sheet'

import { Textarea } from '@repo/ui/components/ui/textarea'
import {
    Card, CardContent, CardHeader, CardTitle
} from '@repo/ui/components/ui/card'
import toast from '@repo/ui/components/ui/sonner'
import { awaitBackgroundJob } from '@/hooks/use-background-job'
import {
    startSprintGeneration, addSprintToProject
} from '@/actions/(main)/projects/sprint-generation.action'
import { Label } from '@repo/ui/components/ui/label'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

// ============================================================================
// Types
// ============================================================================

interface GeneratedTask {
    title: string
    description: string[]
    successCriteria: string[]
    hints: string[]
    estimatedMinutes: number
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    category: string | null
    estimatedTime: string | null
    checkpoints: string[]
    relatedPages: string[]
    dependencies: string[]
    badges: string[]
    tags: string[]
    terminalCommand: string | null
    orderIndex: number
}

interface GeneratedSprint {
    name: string
    goal: string
    duration: string
    tasks: GeneratedTask[]
}

interface SprintGenerationSheetProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    isCreator: boolean
    onSprintAdded?: () => void
}

// ============================================================================
// Sprint Generation Sheet Component
// ============================================================================

export function SprintGenerationSheet({
    isOpen,
    onClose,
    projectId,
    isCreator,
    onSprintAdded
}: SprintGenerationSheetProps) {
    const [sprintDescription, setSprintDescription] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [generatedSprint, setGeneratedSprint] = useState<GeneratedSprint | null>(null)
    const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input')
    const [generationPhase, setGenerationPhase] = useState<string>('')

    const difficultyColors = {
        BEGINNER: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
        INTERMEDIATE: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
        ADVANCED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100',
    }

    const handleGenerate = async () => {
        if (!sprintDescription.trim()) {
            toast.error('Please describe what you want to build')
            return
        }

        setIsGenerating(true)
        setStep('generating')

        try {
            // Generation runs on the worker; this follows the job. The sprint is
            // still only a preview until the user adds it below.
            const started = await startSprintGeneration(projectId, sprintDescription.trim())

            if (!started.success || !started.jobId) {
                toast.error(started.error || 'Failed to generate sprint')
                setStep('input')
                return
            }

            const outcome = await awaitBackgroundJob<{ sprint?: GeneratedSprint }>(
                started.jobId,
                (progress, phaseLabel) => setGenerationPhase(phaseLabel ? `${phaseLabel}…` : `${progress}%`),
            )

            if (outcome.ok && outcome.result?.sprint) {
                setGeneratedSprint(outcome.result.sprint)
                setStep('preview')
                toast.success('Sprint generated! Review and add it to your project.')
            } else {
                toast.error(outcome.ok ? 'Failed to generate sprint' : outcome.error)
                setStep('input')
            }
        } catch (error) {
            console.error('Error generating sprint:', error)
            toast.error('Failed to generate sprint')
            setStep('input')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAddSprint = async () => {
        if (!generatedSprint) return

        setIsAdding(true)

        try {
            const result = await addSprintToProject(projectId, generatedSprint)

            if (result.success) {
                const message = isCreator
                    ? 'Sprint added to your project!'
                    : result.data?.isPersonal
                        ? 'Sprint added! Accept it to include in your progress.'
                        : 'Sprint added!'

                toast.success(message)
                onSprintAdded?.()
                handleClose()
            } else {
                toast.error(result.error || 'Failed to add sprint')
            }
        } catch (error) {
            console.error('Error adding sprint:', error)
            toast.error('Failed to add sprint')
        } finally {
            setIsAdding(false)
        }
    }

    const handleClose = () => {
        setSprintDescription('')
        setGeneratedSprint(null)
        setStep('input')
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleGenerate()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader className="text-left pb-6 max-w-5xl mx-auto space-y-6">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Generate New Sprint
                    </SheetTitle>
                    <SheetDescription>
                        Describe what you want to build and AI will create a structured sprint with tasks.
                    </SheetDescription>
                </SheetHeader>
                <AnimatePresence mode="wait">
                    <section className="max-w-5xl mx-auto space-y-6">
                        {
                            step === 'input' && (
                                <motion.div
                                    key="input"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            What do you want to build?
                                        </Label>
                                        <Textarea
                                            placeholder="e.g., User authentication with email verification and password reset functionality"
                                            value={sprintDescription}
                                            onChange={(e) => setSprintDescription(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="min-h-[120px] resize-none"
                                            autoFocus
                                        />
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Press Enter to generate or describe in detail for better results
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Quick suggestions:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {
                                                [
                                                    'User authentication system',
                                                    'Dashboard with analytics',
                                                    'API integration',
                                                    'Database models setup',
                                                    'Payment integration',
                                                    'File upload feature'
                                                ].map((suggestion) => (
                                                    <Badge
                                                        key={suggestion}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                        onClick={() => setSprintDescription(suggestion)}
                                                    >
                                                        {suggestion}
                                                    </Badge>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!sprintDescription.trim() || isGenerating}
                                        className="w-full bg-black text-white dark:bg-white dark:text-black"
                                        size="lg"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Sprint with AI
                                    </Button>

                                    {
                                        !isCreator && (
                                            <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                                                As a collaborator, sprints you create will appear in your timeline.
                                                You can accept or reject them to track progress.
                                            </p>
                                        )
                                    }
                                </motion.div>
                            )
                        }
                        {
                            step === 'generating' && (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="flex flex-col items-center justify-center py-16 space-y-6"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <InlineLoader size="lg" className="text-white" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                            Generating Your Sprint
                                        </h3>
                                        <div className="space-y-1">
                                            {/* The real phase reported by the
                                                worker, once there is one. Until
                                                the first status write lands, the
                                                rotating copy below stands in. */}
                                            {
                                                generationPhase ? (
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                        {generationPhase}
                                                    </p>
                                                ) : [
                                                    'Analyzing project context...',
                                                    'Creating task breakdown...',
                                                    'Adding success criteria...',
                                                    'Finalizing sprint structure...'
                                                ].map((text, idx) => (
                                                    <motion.p
                                                        key={text}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: [0, 1, 1, 0] }}
                                                        transition={{
                                                            delay: idx * 1.5,
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            repeatDelay: 4.5
                                                        }}
                                                        className="text-sm text-neutral-500 dark:text-neutral-400"
                                                    >
                                                        {text}
                                                    </motion.p>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }
                        {
                            step === 'preview' && generatedSprint && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <Card className="bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-900/30 border-neutral-200 dark:border-neutral-800">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-lg">{generatedSprint.name}</CardTitle>
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {generatedSprint.duration}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                                                <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-800 dark:text-neutral-200" />
                                                {generatedSprint.goal}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                            <Code2 className="w-4 h-4" />
                                            {generatedSprint.tasks.length} Tasks
                                        </h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {
                                                generatedSprint.tasks.map((task, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 text-neutral-800 dark:text-neutral-100 flex items-center justify-center text-xs font-medium">
                                                                    {idx + 1}
                                                                </span>
                                                                <h5 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                                                    {task.title}
                                                                </h5>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Badge className={`text-xs ${difficultyColors[task.difficulty]}`}>
                                                                    {task.difficulty}
                                                                </Badge>
                                                                {
                                                                    task.estimatedTime && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {task.estimatedTime}
                                                                        </Badge>
                                                                    )
                                                                }
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-8">
                                                            {task.description[0]}
                                                            {task.description.length > 1 && ` (+${task.description.length - 1} more steps)`}
                                                        </p>
                                                    </motion.div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setGeneratedSprint(null)
                                                setStep('input')
                                            }}
                                            className="flex-1"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Regenerate
                                        </Button>
                                        <Button
                                            onClick={handleAddSprint}
                                            disabled={isAdding}
                                            className="flex-1 bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700"
                                        >
                                            {
                                                isAdding ? (
                                                    <InlineLoader size="sm" className="mr-2" />
                                                ) : (
                                                    <Rocket className="w-4 h-4 mr-2" />
                                                )
                                            }
                                            {isCreator ? 'Add to Project' : 'Add to My Timeline'}
                                        </Button>
                                    </div>

                                    {
                                        !isCreator && (
                                            <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                                                This sprint will be added to your personal timeline.
                                                Accept it to include in your progress tracking.
                                            </p>
                                        )
                                    }
                                </motion.div>
                            )
                        }
                    </section>
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    )
}