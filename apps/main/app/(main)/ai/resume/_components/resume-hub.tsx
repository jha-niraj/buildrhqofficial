'use client'
import Link from "next/link";
import { useRouter } from 'next/navigation'

import { useState, useTransition } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@repo/ui/components/ui/sheet'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'
import {
    Plus, FileText, Upload, Globe, Github, Linkedin,
    Download, Copy, Trash2, Eye, ExternalLink, Sparkles, Store,
    LayoutTemplate, Clock, Lock, CheckCircle2, Settings, Star, FileUp
} from 'lucide-react'
import { DotmSquare11 } from '@repo/ui/components/ui/dotm-square-11'
import toast from '@repo/ui/components/ui/sonner'
import {
    createDraftFromProfile, createResumeDraft, deleteResumeDraft, updateResumeDraft,
    duplicateResumeDraft, setDefaultResumeDraft
} from '@/actions/(main)/ai/resume-draft.action'
import { importAndCreateDraft } from '@/actions/(main)/ai/resume-import.action'
import { uploadResume } from '@/actions/(main)/user/resume.action'
import { validateResumeFile } from '@/lib/resume-extractor.client'
import { emptyResumeDraftContent } from '@/types/resume-draft'
import { PLATFORM_TEMPLATES } from '@/types/resume-draft'
import { cn } from '@repo/ui/lib/utils'
import { resumeShareUrl } from "@/lib/urls"
import { creditErrorMessage, priceSuffix } from '@/lib/credits/notify'

interface Draft {
    id: string
    name: string
    templateSlug: string
    isPublic: boolean
    isDefault: boolean
    shareSlug: string
    viewCount: number
    tailoredFor: string | null
    atsScore: number | null
    importedFrom: string | null
    createdAt: Date
    updatedAt: Date
}

interface Template {
    id: string
    slug: string
    name: string
    description: string
    isPlatform: boolean
    isMarketplace: boolean
    marketplacePrice: number
    creditsCost: number
    totalSales: number
    tags: string[]
    createdBy: { name: string | null; username: string | null; image: string | null } | null
    config: unknown
}

interface Props {
    drafts: Draft[]
    templates: Template[]
}

const TEMPLATE_COLORS: Record<string, string> = {
    'clean-minimal': 'from-neutral-900/10 to-neutral-900/10 border-neutral-200 dark:border-neutral-800',
    'developer-pro': 'from-neutral-900/10 to-neutral-900/10 border-neutral-200 dark:border-neutral-800',
    'executive-classic': 'from-neutral-900/10 to-neutral-900/10 border-neutral-200 dark:border-neutral-800',
    'ats-optimizer': 'from-neutral-900/10 to-neutral-900/10 border-neutral-200 dark:border-neutral-800',
    'modern-creative': 'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800',
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── New Resume Sheet ────────────────────────────────────────────────────────
function NewResumeSheet({ templates, open, onClose }: {
    templates: Template[]
    open: boolean
    onClose: () => void
}) {
    const router = useRouter()
    const [source, setSource] = useState<'profile' | 'import' | 'upload' | 'blank'>('profile')
    const [name, setName] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('clean-minimal')
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [githubUrl, setGithubUrl] = useState('')
    const [pastedText, setPastedText] = useState('')
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const platformTemplates = templates.filter(t => t.isPlatform)

    const handleCreate = async () => {
        if (!name.trim()) return toast.error('Please enter a resume name')
        setLoading(true)
        try {
            let result: { success: boolean; error?: string; draft?: { id: string }; missingFields?: string[] } | null = null

            if (source === 'upload') {
                if (!uploadFile) {
                    setLoading(false)
                    return toast.error('Choose a PDF or DOCX file first')
                }
                // The file goes to the profile, its text is extracted with unpdf,
                // and a worker turns that text into the draft. That parse takes
                // longer than a request, so there is no draft id to redirect to
                // here - the resume appears in the list when the job lands.
                const upload = await uploadResume(uploadFile, undefined, { draftName: name })
                if (!upload.success) {
                    setLoading(false)
                    return toast.error(upload.message ?? 'Could not read that file')
                }
                if (!upload.structureJobId) {
                    setLoading(false)
                    return toast.error(
                        'We saved the file but could not read any text from it. If it is a scanned PDF, upload a text-based export instead.',
                    )
                }
                toast.success('Resume uploaded. We are reading it now - it will appear here in a minute.')
                onClose()
                router.refresh()
                return
            }

            if (source === 'import') {
                if (!linkedinUrl && !githubUrl && !pastedText.trim()) {
                    setLoading(false)
                    return toast.error('Provide at least one import source')
                }
                result = await importAndCreateDraft({ name, templateSlug: selectedTemplate, linkedinUrl, githubUrl, pastedText })
            } else if (source === 'blank') {
                // Actually blank. This used to call createDraftFromProfile, so
                // "Start from scratch" handed back a resume already full of
                // profile data with no way to tell it had ignored the choice.
                result = await createResumeDraft({
                    name,
                    templateSlug: selectedTemplate,
                    content: emptyResumeDraftContent(),
                })
            } else {
                result = await createDraftFromProfile(name, selectedTemplate)
            }
            if (!result.success) return toast.error(creditErrorMessage(result, 'Failed to create resume'))

            // Show toasts for missing profile data
            if (result.missingFields?.length) {
                result.missingFields.forEach(field => {
                    toast.warning(`${field} not found on your profile - fill it in the editor`)
                })
            }

            toast.success(
                source === 'import' ? 'Resume created from your imported data!'
                    : source === 'blank' ? 'Blank resume created!'
                    : 'Resume created from your profile!',
            )
            onClose()
            router.push(`/ai/resume/draft/${result.draft?.id}`)
        } catch {
            toast.error('Failed to create resume')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 overflow-y-auto">
                <SheetHeader className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <SheetTitle className="text-xl">Create New Resume</SheetTitle>
                    <SheetDescription>Name your resume and choose how to populate it.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <DotmSquare11 size={48} dotSize={6} speed={1.4} />
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {source === 'import' ? 'Scraping & extracting data…'
                                    : source === 'upload' ? 'Uploading and reading your file…'
                                    : 'Building your resume…'}
                            </p>
                            <p className="text-xs text-neutral-500">This takes ~20 seconds</p>
                        </div>
                    ) : (
                        <>
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Resume Name</Label>
                                <Input
                                    placeholder="e.g. Google SWE Resume, Startup CTO v2"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            {/* Source selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Populate from</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'profile' as const, icon: <FileText className="w-4 h-4" />, label: 'My Profile', desc: 'Use your ShipItHQ data' },
                                        { id: 'upload' as const, icon: <FileUp className="w-4 h-4" />, label: 'Upload', desc: 'PDF or DOCX' },
                                        { id: 'import' as const, icon: <Upload className="w-4 h-4" />, label: 'Import', desc: 'LinkedIn, GitHub, text' },
                                        { id: 'blank' as const, icon: <Plus className="w-4 h-4" />, label: 'Blank', desc: 'Start from scratch' },
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSource(s.id)}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                                                source === s.id
                                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                                            )}
                                        >
                                            {s.icon}
                                            <span className="text-xs font-semibold">{s.label}</span>
                                            <span className={cn('text-[10px]', source === s.id ? 'opacity-70' : 'text-neutral-500')}>{s.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Upload an existing resume */}
                            {source === 'upload' && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Your existing resume</Label>
                                    <label
                                        htmlFor="resume-upload-file"
                                        className={cn(
                                            'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed cursor-pointer transition-colors',
                                            uploadFile
                                                ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                                                : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500',
                                        )}
                                    >
                                        <FileUp className="w-5 h-5 text-neutral-500" />
                                        <span className="text-xs font-medium text-center">
                                            {uploadFile ? uploadFile.name : 'Click to choose a PDF or DOCX'}
                                        </span>
                                        <span className="text-[10px] text-neutral-500">Max 5MB</span>
                                    </label>
                                    <input
                                        id="resume-upload-file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            const check = validateResumeFile(file)
                                            if (!check.valid) {
                                                toast.error(check.error ?? 'Unsupported file')
                                                return
                                            }
                                            setUploadFile(file)
                                        }}
                                    />
                                    <p className="text-[10px] text-neutral-500">
                                        We read the text out of your file and let AI structure it into sections you can
                                        edit. This runs in the background - the resume shows up here when it is done.
                                    </p>
                                </div>
                            )}

                            {/* Import sources */}
                            {source === 'import' && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium flex items-center gap-1.5">
                                            <Linkedin className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" /> LinkedIn URL
                                        </Label>
                                        <Input placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium flex items-center gap-1.5">
                                            <Github className="w-3.5 h-3.5" /> GitHub URL
                                        </Label>
                                        <Input placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Paste Resume Text</Label>
                                        <Textarea
                                            placeholder="Paste your existing resume text here…"
                                            className="h-28 text-xs"
                                            value={pastedText}
                                            onChange={e => setPastedText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Template selection. Hidden for uploads: the worker writes
                                the draft itself and always starts it on clean-minimal,
                                so offering a choice here would be a lie. */}
                            <div className={cn('space-y-2', source === 'upload' && 'hidden')}>
                                <Label className="text-sm font-medium">Choose Template</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {platformTemplates.map(t => {
                                        const platDef = PLATFORM_TEMPLATES.find(p => p.slug === t.slug)
                                        return (
                                            <button
                                                key={t.slug}
                                                onClick={() => setSelectedTemplate(t.slug)}
                                                className={cn(
                                                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                                                    selectedTemplate === t.slug
                                                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                                                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                                                )}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg flex-shrink-0"
                                                    style={{ backgroundColor: platDef?.previewColor ?? '#6366f1', opacity: 0.8 }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate">{t.name}</p>
                                                    <p className="text-[10px] text-neutral-500 truncate">{t.description}</p>
                                                </div>
                                                {selectedTemplate === t.slug && <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!loading && (
                    <div className="p-6 pt-0 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 h-11"
                            onClick={handleCreate}
                            disabled={!name.trim() || (source === 'upload' && !uploadFile)}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {source === 'import' ? `Import & Create Resume${priceSuffix('resume_import')}`
                                : source === 'upload' ? 'Upload & Read Resume'
                                : 'Create Resume'}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

// ─── Resume Card ─────────────────────────────────────────────────────────────
function ResumeCard({ draft, onDelete, onTogglePublic, onDuplicate, onSetDefault }: {
    draft: Draft
    onDelete: (id: string) => void
    onTogglePublic: (id: string, val: boolean) => void
    onDuplicate: (id: string) => void
    onSetDefault: (id: string) => void
}) {
    const colorClass = TEMPLATE_COLORS[draft.templateSlug] ?? TEMPLATE_COLORS['clean-minimal']

    return (
        <div className={`group rounded-2xl border bg-gradient-to-br p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${colorClass}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-neutral-900 dark:text-white">{draft.name}</p>
                    {draft.tailoredFor && (
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5">Tailored for: {draft.tailoredFor}</p>
                    )}
                </div>
                {draft.atsScore !== null && (
                    <div className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        draft.atsScore >= 80 ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100'
                            : draft.atsScore >= 60 ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                        ATS {draft.atsScore}
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap">
                {draft.isDefault && (
                    <Badge className="text-[10px] gap-1 bg-neutral-900 text-white dark:bg-white dark:text-black">
                        <Star className="w-2.5 h-2.5 fill-current" /> Default
                    </Badge>
                )}
                <Badge variant="outline" className="text-[10px] capitalize">{draft.templateSlug.replace(/-/g, ' ')}</Badge>
                {draft.importedFrom && (
                    <Badge variant="outline" className="text-[10px] capitalize">{draft.importedFrom.split(',').join(' + ')}</Badge>
                )}
                <div className="ml-auto flex items-center gap-1 text-[10px] text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(draft.updatedAt)}
                </div>
            </div>

            {/* Public indicator */}
            {draft.isPublic && (
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-800 dark:text-neutral-100">
                    <Globe className="w-3 h-3" />
                    Public · {draft.viewCount} views
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                <Button size="sm" className="flex-1 h-7 text-xs bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90" asChild><Link href={`/ai/resume/draft/${draft.id}`}>
                    <Settings className="w-3 h-3 mr-1" /> Edit
                </Link></Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    title="Download PDF"
                    onClick={() => window.open(`/api/resume/pdf/${draft.id}`, '_blank')}
                >
                    <Download className="w-3 h-3" />
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    title={draft.isDefault
                        ? 'This is the resume ShipItHQ AI uses'
                        : 'Use this resume for AI features'}
                    disabled={draft.isDefault}
                    onClick={() => onSetDefault(draft.id)}
                >
                    <Star className={cn('w-3 h-3', draft.isDefault && 'fill-current text-neutral-900 dark:text-white')} />
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    title={draft.isPublic ? 'Make private' : 'Make public'}
                    onClick={() => onTogglePublic(draft.id, !draft.isPublic)}
                >
                    {draft.isPublic ? <Eye className="w-3 h-3 text-neutral-900 dark:text-neutral-100" /> : <Lock className="w-3 h-3" />}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    title="Copy share link"
                    onClick={() => {
                        const url = resumeShareUrl(draft.shareSlug)
                        navigator.clipboard.writeText(url)
                        toast.success('Share link copied!')
                        if (!draft.isPublic) {
                            toast.info('Make resume public so the link works')
                        }
                    }}
                >
                    <Copy className="w-3 h-3" />
                </Button>
                {draft.isPublic && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        title="Open public link"
                        onClick={() => window.open(`/r/${draft.shareSlug}`, '_blank')}
                    >
                        <ExternalLink className="w-3 h-3" />
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    title="Duplicate resume"
                    onClick={() => onDuplicate(draft.id)}
                >
                    Duplicate
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500"
                    onClick={() => onDelete(draft.id)}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    )
}

// ─── Main Hub ────────────────────────────────────────────────────────────────
export function ResumeHub({ drafts: initialDrafts, templates }: Props) {
    const [drafts, setDrafts] = useState<Draft[]>(initialDrafts)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [, startTransition] = useTransition()

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await deleteResumeDraft(id)
            setDrafts(d => d.filter(x => x.id !== id))
            toast.success('Resume deleted')
        })
    }

    const handleTogglePublic = (id: string, val: boolean) => {
        startTransition(async () => {
            await updateResumeDraft(id, { isPublic: val })
            setDrafts(d => d.map(x => x.id === id ? { ...x, isPublic: val } : x))
            toast.success(val ? 'Resume is now public' : 'Resume is now private')
        })
    }

    const handleSetDefault = (id: string) => {
        startTransition(async () => {
            const res = await setDefaultResumeDraft(id)
            if (!res.success) {
                toast.error(res.error ?? 'Could not set the default resume')
                return
            }
            // Exactly one default in the list, mirroring what the action just
            // wrote, so the badge does not need a refetch to be right.
            setDrafts(d => d.map(x => ({ ...x, isDefault: x.id === id })))
            toast.success('ShipItHQ AI will use this resume from now on')
        })
    }

    const handleDuplicate = (id: string) => {
        startTransition(async () => {
            const res = await duplicateResumeDraft(id)
            if (res.success && res.draft) {
                setDrafts(d => [res.draft as Draft, ...d])
                toast.success('Resume duplicated')
            }
        })
    }

    const platformTemplates = templates.filter(t => t.isPlatform)
    const communityTemplates = templates.filter(t => !t.isPlatform && t.isMarketplace)

    return (
        <div className="w-full">
            {/* ── Hero header ── */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Resume Builder</h1>
                            <p className="text-sm text-neutral-500 mt-1">
                                Create, import, tailor - land the job you deserve.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <Button variant="outline" size="sm" asChild><Link href='/blueprint/resume'>
                                <Store className="w-3.5 h-3.5 mr-1.5" />
                                Blueprint
                            </Link></Button>
                            <Button variant="outline" size="sm" className="border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900" asChild><Link href='/ai/resume/import'>
                                <Linkedin className="w-3.5 h-3.5 mr-1" />
                                <Github className="w-3.5 h-3.5 mr-1.5" />
                                AI Import
                            </Link></Button>
                            <Button
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90"
                                onClick={() => setSheetOpen(true)}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                New Resume
                            </Button>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-6 mt-5 text-sm">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                            <span className="font-semibold">{drafts.length}</span>
                            <span className="text-neutral-500">resumes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                            <span className="font-semibold">{drafts.filter(d => d.isPublic).length}</span>
                            <span className="text-neutral-500">public</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <LayoutTemplate className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                            <span className="font-semibold">{platformTemplates.length}</span>
                            <span className="text-neutral-500">templates</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Tabs defaultValue="resumes">
                    <TabsList className="mb-6">
                        <TabsTrigger value="resumes">My Resumes</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>

                    {/* ── My Resumes ── */}
                    <TabsContent value="resumes">
                        {drafts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-neutral-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-neutral-700 dark:text-neutral-300">No resumes yet</p>
                                    <p className="text-sm text-neutral-500 mt-0.5">Create your first resume in 60 seconds</p>
                                </div>
                                <Button onClick={() => setSheetOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Resume
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* New resume tile */}
                                <button
                                    onClick={() => setSheetOpen(true)}
                                    className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-5 flex flex-col items-center justify-center gap-2 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors min-h-[180px] text-neutral-500"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-sm font-medium">New Resume</span>
                                </button>
                                {/* Import from LinkedIn / GitHub tile */}
                                <Link href='/ai/resume/import' className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-5 flex flex-col items-center justify-center gap-2 hover:border-neutral-800 dark:hover:border-neutral-700 transition-colors min-h-[180px] text-neutral-900 dark:text-neutral-100">
                                    <Globe className="w-6 h-6" />
                                    <span className="text-sm font-medium">Import from LinkedIn &amp; GitHub</span>
                                    <span className="text-[10px] text-neutral-500">Scrape &amp; auto-fill your resume</span>
                                </Link>
                                {drafts.map(d => (
                                    <ResumeCard
                                        key={d.id}
                                        draft={d}
                                        onDelete={handleDelete}
                                        onTogglePublic={handleTogglePublic}
                                        onDuplicate={handleDuplicate}
                                        onSetDefault={handleSetDefault}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Templates ── */}
                    <TabsContent value="templates">
                        <div className="space-y-8">
                            {/* Platform templates */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-base font-semibold">ShipItHQ Templates</h2>
                                    <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs">Official</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {platformTemplates.map(t => {
                                        const platDef = PLATFORM_TEMPLATES.find(p => p.slug === t.slug)
                                        return (
                                            <div key={t.slug} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col gap-3">
                                                <div className="h-24 rounded-xl flex items-center justify-center text-white text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${platDef?.previewColor ?? '#6366f1'}20, ${platDef?.previewColor ?? '#6366f1'}40)`, border: `1px solid ${platDef?.previewColor ?? '#6366f1'}30` }}>
                                                    <span style={{ color: platDef?.previewColor ?? '#6366f1' }}>{t.name}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{t.name}</p>
                                                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{t.description}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {t.tags.slice(0, 3).map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                    <span className="text-xs text-neutral-800 dark:text-neutral-200 font-medium">Free</span>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => { setSheetOpen(true) }}
                                                    >
                                                        Use Template
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Community / marketplace */}
                            {communityTemplates.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-base font-semibold">Community Templates</h2>
                                        <Button variant="ghost" size="sm" asChild><Link href='/blueprint/resume'>
                                            Browse Blueprint <ExternalLink className="w-3 h-3 ml-1" />
                                        </Link></Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {communityTemplates.slice(0, 6).map(t => (
                                            <div key={t.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                                                <p className="font-semibold text-sm">{t.name}</p>
                                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{t.description}</p>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{t.marketplacePrice} credits</span>
                                                    <Button size="sm" className="h-7 text-xs" asChild><Link href='/blueprint/resume'>
                                                        View in Blueprint
                                                    </Link></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload own template CTA */}
                            <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                                    <Upload className="w-5 h-5 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Create & Sell Your Template</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">Upload your own resume template to Blueprint marketplace and earn credits</p>
                                </div>
                                <Button variant="outline" size="sm" asChild><Link href='/blueprint/resume?tab=sell'>
                                    <Store className="w-3.5 h-3.5 mr-1.5" /> Open Blueprint
                                </Link></Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <NewResumeSheet templates={templates} open={sheetOpen} onClose={() => setSheetOpen(false)} />
        </div>
    )
}
