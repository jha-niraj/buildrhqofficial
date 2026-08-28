'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, ArrowRight, Check, Sparkles, Code2, Brain, Rocket,
    Zap, Globe, Lock, Terminal, Cpu, Layers, AlertCircle,
} from 'lucide-react'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { Progress } from '@repo/ui/components/ui/progress'
import toast from '@repo/ui/components/ui/sonner'
import { ProjectEchoSchema } from '@/actions/(main)/schemas/projects.schema'
import { startProjectGeneration, getGenerationStatus } from '@/actions/(main)/workers/projectsworker.action'
import { z } from 'zod'
import { cn } from '@repo/ui/lib/utils'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

type FormData = z.infer<typeof ProjectEchoSchema>

const GENERATION_TYPES = [
    { value: 'FULL_STACK', label: 'Full Stack', icon: Layers, description: 'Complete web app' },
    { value: 'FRONTEND', label: 'Frontend', icon: Code2, description: 'UI-focused build' },
    { value: 'APP', label: 'Mobile App', icon: Rocket, description: 'iOS & Android' },
    { value: 'PROGRAMS', label: 'Programs', icon: Terminal, description: 'CLI tools & scripts' },
    { value: 'AI/ML', label: 'AI / ML', icon: Sparkles, description: 'Models & pipelines' },
    { value: 'AI_AGENT', label: 'AI Agent', icon: Zap, description: 'Autonomous systems' },
    { value: 'OTHER', label: 'Other', icon: Brain, description: 'Custom project' },
] as const

const DIFFICULTY_LEVELS = [
    { value: 'BEGINNER', label: 'Beginner', desc: '0-6 months' },
    { value: 'INTERMEDIATE', label: 'Intermediate', desc: '6-18 months' },
    { value: 'ADVANCED', label: 'Advanced', desc: '18+ months' },
] as const

const FRONTEND_STACKS = ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'React Native']
const BACKEND_STACKS = ['Node.js', 'Next.js API', 'Python / FastAPI', 'Django', 'Java / Spring', 'Go']
const DATABASES = ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite', 'Supabase', 'Firebase']

interface ProjectGenerateSheetProps {
    trigger?: React.ReactNode
    onSuccess?: (projectSlug: string) => void
    spaceId?: string
    defaultValues?: { title?: string; description?: string; type?: string; difficulty?: string }
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

const PHASES = [
    'Designing the project blueprint',
    'Saving your project',
    'Creating sprints & tasks',
    'Finalizing',
]

export default function ProjectGenerateSheet({
    trigger, onSuccess, defaultValues, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange,
}: ProjectGenerateSheetProps) {
    const router = useRouter()
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalIsOpen !== undefined ? externalIsOpen : internalOpen
    const setOpen = useCallback((v: boolean) => { setInternalOpen(v); externalOnOpenChange?.(v) }, [externalOnOpenChange])

    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [phaseLabel, setPhaseLabel] = useState<string>(PHASES[0]!)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [form, setForm] = useState<Partial<FormData>>({
        projectTitle: defaultValues?.title || '',
        projectDescription: defaultValues?.description || '',
        generationType: (defaultValues?.type as FormData['generationType']) || undefined,
        difficulty: (defaultValues?.difficulty as FormData['difficulty']) || 'INTERMEDIATE',
        technologies: [],
        LearnsFocus: [],
        stacks: { frontend: '', backend: '', database: '', deployment: '', aiProvider: '' },
        preferences: { generateNow: true, pagesPreset: 'CUSTOM' },
        visibility: 'PUBLIC',
        includeAssessment: false,
    })

    const set = (key: keyof FormData, value: unknown) => setForm(p => ({ ...p, [key]: value }))
    const setStack = (key: string, value: string) =>
        setForm(p => ({ ...p, stacks: { ...(p.stacks || {}), [key]: p.stacks?.[key as keyof typeof p.stacks] === value ? '' : value } }))

    useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

    const cost = (form.visibility === 'PUBLIC' ? 13 : 25) + (form.includeAssessment ? 30 : 0)

    const canProceed = step === 0
        ? (form.projectTitle?.length ?? 0) >= 3 && (form.projectDescription?.length ?? 0) >= 10 && !!form.generationType
        : true

    const startPolling = useCallback((jobId: string) => {
        pollingRef.current = setInterval(async () => {
            const s = await getGenerationStatus(jobId)
            if (!s.success) return
            if (typeof s.progress === 'number') setProgress(s.progress)
            if (s.phaseLabel) setPhaseLabel(s.phaseLabel)
            if (s.status === 'completed' && s.slug) {
                if (pollingRef.current) clearInterval(pollingRef.current)
                setProgress(100)
                toast.success('Project generated!')
                if (onSuccess) onSuccess(s.slug)
                else router.push(`/projects/${s.slug}`)
                setOpen(false)
            } else if (s.status === 'failed') {
                if (pollingRef.current) clearInterval(pollingRef.current)
                setLoading(false)
                toast.error(s.error || 'Generation failed. Please try again.')
            }
        }, 3000)
    }, [onSuccess, router, setOpen])

    const handleSubmit = async () => {
        try {
            const validated = ProjectEchoSchema.parse(form)
            setLoading(true)
            setProgress(5)
            setPhaseLabel(PHASES[0]!)
            const res = await startProjectGeneration(validated)
            if (!res.success || !res.jobId) {
                setLoading(false)
                toast.error(res.error || 'Could not start generation')
                return
            }
            startPolling(res.jobId)
        } catch (err) {
            if (err instanceof z.ZodError) toast.error(err.issues[0]?.message || 'Please complete the form')
            else toast.error('Something went wrong')
        }
    }

    // ── Generating view ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <Sheet open={open} onOpenChange={(v) => { if (!v) toast.info('Generation continues in the background.'); setOpen(v) }}>
                <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 flex flex-col">
                    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
                        <div className="relative flex h-20 w-20 items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-neutral-900/20" />
                            <Sparkles className="h-7 w-7 text-neutral-900 dark:text-neutral-100" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Building your project</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{phaseLabel}</p>
                        </div>
                        <div className="w-full max-w-sm">
                            <Progress value={progress} className="h-1.5" />
                            <div className="mt-2 flex justify-between font-mono text-[11px] text-neutral-400">
                                <span>{progress}%</span>
                                <span>~1-2 min</span>
                            </div>
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                            {PHASES.map((p, i) => {
                                const active = phaseLabel === p
                                const done = PHASES.indexOf(phaseLabel) > i
                                return (
                                    <div key={p} className="flex items-center gap-2.5 text-sm">
                                        {done ? <Check className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                                            : active ? <InlineLoader size="sm" className="text-neutral-900 dark:text-neutral-100" />
                                                : <div className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700" />}
                                        <span className={cn(done || active ? 'text-neutral-900 dark:text-white' : 'text-neutral-400')}>{p}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <Button variant="outline" onClick={() => setOpen(false)} className="mt-2">Close - keep generating</Button>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    // ── Form view ────────────────────────────────────────────────────────────
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 flex flex-col gap-0">
                <SheetHeader className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <SheetTitle className="text-base">Generate a project</SheetTitle>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Step {step + 1} of 2 · {step === 0 ? 'Details' : 'Setup'}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                        {[0, 1].map(i => (
                            <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-neutral-900' : 'bg-neutral-200 dark:bg-neutral-800')} />
                        ))}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <AnimatePresence mode="wait">
                        {step === 0 ? (
                            <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Project title</Label>
                                    <Input placeholder="e.g. Realtime collaboration board" value={form.projectTitle} onChange={e => set('projectTitle', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm">What do you want to build?</Label>
                                    <Textarea rows={3} placeholder="Describe the idea, who it's for, and the core features…" value={form.projectDescription} onChange={e => set('projectDescription', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Project type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {GENERATION_TYPES.map(t => {
                                            const active = form.generationType === t.value
                                            return (
                                                <button key={t.value} type="button" onClick={() => set('generationType', t.value)}
                                                    className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                                                        active ? 'border-neutral-900 bg-neutral-50 dark:bg-neutral-200/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700')}>
                                                    <t.icon className={cn('h-4.5 w-4.5 mt-0.5 shrink-0', active ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500')} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.label}</p>
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{t.description}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Difficulty</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DIFFICULTY_LEVELS.map(d => {
                                            const active = form.difficulty === d.value
                                            return (
                                                <button key={d.value} type="button" onClick={() => set('difficulty', d.value)}
                                                    className={cn('rounded-xl border p-3 text-center transition-colors',
                                                        active ? 'border-neutral-900 bg-neutral-50 dark:bg-neutral-200/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300')}>
                                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{d.label}</p>
                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{d.desc}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-6">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm">Tech stack <span className="text-neutral-400 font-normal">· optional</span></Label>
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Leave blank and the AI picks a sensible stack.</p>
                                    </div>
                                    <StackRow label="Frontend" options={FRONTEND_STACKS} value={form.stacks?.frontend} onSelect={v => setStack('frontend', v)} />
                                    <StackRow label="Backend" options={BACKEND_STACKS} value={form.stacks?.backend} onSelect={v => setStack('backend', v)} />
                                    <StackRow label="Database" options={DATABASES} value={form.stacks?.database} onSelect={v => setStack('database', v)} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">Visibility</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([
                                            { value: 'PUBLIC', label: 'Public', desc: 'Anyone can view · 13 credits', icon: Globe },
                                            { value: 'PRIVATE', label: 'Private', desc: 'Only you · 25 credits', icon: Lock },
                                        ] as const).map(v => {
                                            const active = form.visibility === v.value
                                            return (
                                                <button key={v.value} type="button" onClick={() => set('visibility', v.value)}
                                                    className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                                                        active ? 'border-neutral-900 bg-neutral-50 dark:bg-neutral-200/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300')}>
                                                    <v.icon className={cn('h-4 w-4 mt-0.5', active ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500')} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{v.label}</p>
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{v.desc}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <button type="button" onClick={() => set('includeAssessment', !form.includeAssessment)}
                                    className={cn('flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                                        form.includeAssessment ? 'border-neutral-900 bg-neutral-50 dark:bg-neutral-200/10' : 'border-neutral-200 dark:border-neutral-800')}>
                                    <div className="flex items-center gap-2.5">
                                        <Cpu className={cn('h-4 w-4', form.includeAssessment ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500')} />
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Add skill assessment</p>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Auto-graded checkpoints · +30 credits</p>
                                        </div>
                                    </div>
                                    <div className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', form.includeAssessment ? 'bg-neutral-900' : 'bg-neutral-300 dark:bg-neutral-700')}>
                                        <div className={cn('h-4 w-4 rounded-full bg-white transition-transform', form.includeAssessment && 'translate-x-4')} />
                                    </div>
                                </button>

                                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Total cost</span>
                                        <span className="font-mono text-lg font-bold text-neutral-900 dark:text-white">{cost} credits</span>
                                    </div>
                                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        <AlertCircle className="h-3 w-3" /> Credits are only charged once generation succeeds.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
                    {step === 0 ? <span /> : (
                        <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>
                    )}
                    {step === 0 ? (
                        <Button disabled={!canProceed} onClick={() => setStep(1)} className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200">
                            <Sparkles className="mr-1.5 h-4 w-4" /> Generate · {cost} credits
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

function StackRow({ label, options, value, onSelect }: { label: string; options: string[]; value?: string; onSelect: (v: string) => void }) {
    return (
        <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {options.map(o => {
                    const active = value === o
                    return (
                        <button key={o} type="button" onClick={() => onSelect(o)}
                            className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors',
                                active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300')}>
                            {o}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
