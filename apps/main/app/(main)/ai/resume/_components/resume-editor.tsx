'use client'
import Link from "next/link";

import { useState, useCallback, useTransition } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Badge } from '@repo/ui/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
    ArrowLeft, Download, Eye, Lock, Wand2,
    Plus, Trash2, Save, ExternalLink, BarChart3, RefreshCw
} from 'lucide-react'
import { DotmSquare11 } from '@repo/ui/components/ui/dotm-square-11'
import toast from '@repo/ui/components/ui/sonner'
import { updateResumeDraft, scoreResumeAgainstJD, tailorResumeForJD } from '@/actions/(main)/ai/resume-draft.action'
import { syncProfileToResumeDraft } from '@/actions/(main)/ai/resume-profile-sync.action'
import { extractJobDescription } from '@/actions/(main)/ai/cover-letter.action'
import { creditErrorMessage, priceSuffix } from '@/lib/credits/notify'
import {
    ResumeDraftContent, ResumeHeader, ResumeExperienceEntry,
    ResumeProjectEntry, ResumeEducationEntry, ResumeSkillGroup,
    PLATFORM_TEMPLATES
} from '@/types/resume-draft'
import { cn } from '@repo/ui/lib/utils'

function nanoid() { return Math.random().toString(36).slice(2, 10) }

interface Props {
    draft: { id: string; name: string; templateSlug: string; isPublic: boolean; shareSlug: string; atsScore: number | null }
    content: ResumeDraftContent
    templates: Array<{ slug: string; name: string; isPlatform: boolean; config: unknown }>
}

// ─── Section: Header ──────────────────────────────────────────────────────────
function HeaderSection({ header, onChange }: { header: ResumeHeader; onChange: (h: ResumeHeader) => void }) {
    const field = (k: keyof ResumeHeader, label: string, placeholder?: string) => (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</Label>
            <Input
                value={(header[k] as string) ?? ''}
                onChange={e => onChange({ ...header, [k]: e.target.value })}
                placeholder={placeholder}
                className="h-8 text-sm"
            />
        </div>
    )
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                {field('name', 'Full Name', 'John Doe')}
                {field('title', 'Job Title', 'Software Engineer')}
                {field('email', 'Email', 'john@example.com')}
                {field('phone', 'Phone', '+1 555 000 0000')}
                {field('location', 'Location', 'San Francisco, CA')}
                {field('website', 'Website', 'https://johndoe.dev')}
                {field('github', 'GitHub', 'github.com/johndoe')}
                {field('linkedin', 'LinkedIn', 'linkedin.com/in/johndoe')}
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Professional Summary</Label>
                <Textarea
                    value={header.summary ?? ''}
                    onChange={e => onChange({ ...header, summary: e.target.value })}
                    placeholder="A brief summary of your background and goals…"
                    className="h-20 text-sm resize-none"
                />
            </div>
        </div>
    )
}

// ─── Section: Experience ─────────────────────────────────────────────────────
function ExperienceSection({ items, onChange }: { items: ResumeExperienceEntry[]; onChange: (v: ResumeExperienceEntry[]) => void }) {
    const update = (id: string, patch: Partial<ResumeExperienceEntry>) =>
        onChange(items.map(x => x.id === id ? { ...x, ...patch } : x))
    const remove = (id: string) => onChange(items.filter(x => x.id !== id))
    const add = () => onChange([...items, { id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, bullets: [''] }])

    return (
        <div className="space-y-4">
            {items.map((e, idx) => (
                <div key={e.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500">Position {idx + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-neutral-400 hover:text-red-500" onClick={() => remove(e.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input className="h-8 text-sm" placeholder="Company" value={e.company} onChange={ev => update(e.id, { company: ev.target.value })} />
                        <Input className="h-8 text-sm" placeholder="Job Title" value={e.role} onChange={ev => update(e.id, { role: ev.target.value })} />
                        <Input className="h-8 text-sm" type="date" value={e.startDate?.split('T')[0] ?? ''} onChange={ev => update(e.id, { startDate: ev.target.value })} />
                        <div className="flex items-center gap-2">
                            {!e.current && <Input className="h-8 text-sm flex-1" type="date" value={e.endDate?.split('T')[0] ?? ''} onChange={ev => update(e.id, { endDate: ev.target.value })} />}
                            <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer flex-shrink-0">
                                <input type="checkbox" checked={e.current} onChange={ev => update(e.id, { current: ev.target.checked, endDate: ev.target.checked ? undefined : e.endDate })} />
                                Current
                            </label>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-500">Bullet points (one per line)</Label>
                        <Textarea
                            className="text-xs h-24 resize-none"
                            value={e.bullets.join('\n')}
                            onChange={ev => update(e.id, { bullets: ev.target.value.split('\n') })}
                            placeholder="• Led migration of legacy API to GraphQL, reducing payload size by 60%"
                        />
                    </div>
                </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Position</Button>
        </div>
    )
}

// ─── Section: Projects ───────────────────────────────────────────────────────
function ProjectsSection({ items, onChange }: { items: ResumeProjectEntry[]; onChange: (v: ResumeProjectEntry[]) => void }) {
    const update = (id: string, patch: Partial<ResumeProjectEntry>) =>
        onChange(items.map(x => x.id === id ? { ...x, ...patch } : x))
    const remove = (id: string) => onChange(items.filter(x => x.id !== id))
    const add = () => onChange([...items, { id: nanoid(), name: '', description: '', technologies: [], github: '', liveUrl: '', bullets: [''] }])

    return (
        <div className="space-y-4">
            {items.map((p, idx) => (
                <div key={p.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500">Project {idx + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-neutral-400 hover:text-red-500" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input className="h-8 text-sm" placeholder="Project Name" value={p.name} onChange={e => update(p.id, { name: e.target.value })} />
                        <Input className="h-8 text-sm" placeholder="GitHub URL" value={p.github ?? ''} onChange={e => update(p.id, { github: e.target.value })} />
                        <Input className="h-8 text-sm col-span-2" placeholder="Live URL" value={p.liveUrl ?? ''} onChange={e => update(p.id, { liveUrl: e.target.value })} />
                    </div>
                    <Input className="h-8 text-sm" placeholder="Technologies (comma-separated)" value={p.technologies.join(', ')} onChange={e => update(p.id, { technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                    <Textarea
                        className="text-xs h-20 resize-none"
                        value={p.bullets.join('\n')}
                        onChange={e => update(p.id, { bullets: e.target.value.split('\n') })}
                        placeholder="• Built with React, Node.js - 500+ daily active users"
                    />
                </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Project</Button>
        </div>
    )
}

// ─── Section: Education ──────────────────────────────────────────────────────
function EducationSection({ items, onChange }: { items: ResumeEducationEntry[]; onChange: (v: ResumeEducationEntry[]) => void }) {
    const update = (id: string, patch: Partial<ResumeEducationEntry>) =>
        onChange(items.map(x => x.id === id ? { ...x, ...patch } : x))
    const remove = (id: string) => onChange(items.filter(x => x.id !== id))
    const add = () => onChange([...items, { id: nanoid(), institution: '', degree: '', startDate: '', endDate: '', bullets: [] }])

    return (
        <div className="space-y-4">
            {items.map((e, idx) => (
                <div key={e.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500">Education {idx + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-neutral-400 hover:text-red-500" onClick={() => remove(e.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input className="h-8 text-sm col-span-2" placeholder="Institution" value={e.institution} onChange={ev => update(e.id, { institution: ev.target.value })} />
                        <Input className="h-8 text-sm" placeholder="Degree" value={e.degree ?? ''} onChange={ev => update(e.id, { degree: ev.target.value })} />
                        <Input className="h-8 text-sm" placeholder="Field of Study" value={e.field ?? ''} onChange={ev => update(e.id, { field: ev.target.value })} />
                        <Input className="h-8 text-sm" type="date" value={e.startDate?.split('T')[0] ?? ''} onChange={ev => update(e.id, { startDate: ev.target.value })} />
                        <Input className="h-8 text-sm" type="date" value={e.endDate?.split('T')[0] ?? ''} onChange={ev => update(e.id, { endDate: ev.target.value })} />
                    </div>
                </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Education</Button>
        </div>
    )
}

// ─── Section: Skills ─────────────────────────────────────────────────────────
function SkillsSection({ items, onChange }: { items: ResumeSkillGroup[]; onChange: (v: ResumeSkillGroup[]) => void }) {
    const update = (i: number, patch: Partial<ResumeSkillGroup>) =>
        onChange(items.map((x, idx) => idx === i ? { ...x, ...patch } : x))
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
    const add = () => onChange([...items, { category: '', items: [] }])

    return (
        <div className="space-y-3">
            {items.map((g, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <Input className="h-7 text-xs flex-1" placeholder="Category (e.g. Languages, Frameworks)" value={g.category} onChange={e => update(i, { category: e.target.value })} />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <Input
                        className="h-7 text-xs"
                        placeholder="Skills (comma-separated)"
                        value={g.items.join(', ')}
                        onChange={e => update(i, { items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={add}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Skill Group</Button>
        </div>
    )
}

// ─── AI Tools Sheet ───────────────────────────────────────────────────────────
function AIToolsSheet({ draftId, open, onClose, onContentUpdated }: {
    draftId: string; open: boolean; onClose: () => void
    onContentUpdated: (content: ResumeDraftContent) => void
}) {
    const [jd, setJd] = useState('')
    const [jobUrl, setJobUrl] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [loading, setLoading] = useState<'score' | 'tailor' | 'fetch' | null>(null)
    const [scoreResult, setScoreResult] = useState<{ score: number; missing_keywords: string[]; matched_keywords: string[]; suggestions: string[] } | null>(null)
    const [tailorResult, setTailorResult] = useState<{ suggestions: string[]; keywordsAdded: string[]; summary: string } | null>(null)

    /**
     * Pull the job description off a posting URL, the same way the cover letter
     * flow does. Nobody wants to select and copy a job ad, and a partial paste is
     * the most common reason a tailored resume misses the requirements.
     */
    const handleFetchJd = async () => {
        if (!jobUrl.trim()) {
            toast.error('Paste a job posting URL first')
            return
        }
        setLoading('fetch')
        const res = await extractJobDescription(jobUrl.trim())
        setLoading(null)
        if (!res.success || !res.description) {
            toast.error(res.error ?? 'Could not read that posting - paste the description instead')
            return
        }
        setJd(res.description)
        // Only fill the title if the user has not typed one; the page title is a
        // guess ("Careers | Acme") often enough that it must not overwrite them.
        if (res.title && !jobTitle.trim()) setJobTitle(res.title)
        toast.success('Job description pulled in - check it before tailoring')
    }

    const handleScore = async () => {
        if (!jd.trim()) return toast.error('Paste a job description first')
        setLoading('score')
        const res = await scoreResumeAgainstJD(draftId, jd)
        setLoading(null)
        if (!res.success) return toast.error(creditErrorMessage(res, 'Failed to score'))
        setScoreResult(res as unknown as { score: number; missing_keywords: string[]; matched_keywords: string[]; suggestions: string[] })
        setTailorResult(null)
    }

    const handleTailor = async () => {
        if (!jd.trim() || !jobTitle.trim()) return toast.error('Enter job title and paste JD')
        setLoading('tailor')
        const res = await tailorResumeForJD(draftId, jd, jobTitle)
        setLoading(null)
        if (!res.success) return toast.error(creditErrorMessage(res, 'Failed to tailor'))
        if (res.updatedContent) {
            onContentUpdated(res.updatedContent as ResumeDraftContent)
            // Auto-save the tailored content so changes persist without manual Save click
            await updateResumeDraft(draftId, { content: res.updatedContent as ResumeDraftContent })
        }
        setTailorResult({ suggestions: res.suggestions ?? [], keywordsAdded: res.keywordsAdded ?? [], summary: res.summary ?? '' })
        setScoreResult(null)
        toast.success('Resume tailored and saved!')
    }

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> AI Tools</SheetTitle>
                </SheetHeader>
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Job Title</Label>
                        <Input placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Job Posting URL</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://company.com/jobs/123"
                                value={jobUrl}
                                onChange={e => setJobUrl(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                onClick={handleFetchJd}
                                disabled={loading !== null || !jobUrl.trim()}
                            >
                                {loading === 'fetch' ? 'Reading…' : 'Fetch'}
                            </Button>
                        </div>
                        <p className="text-[10px] text-neutral-500">Or paste the description below.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Job Description</Label>
                        <Textarea className="h-36 text-xs" placeholder="Paste the full job description here…" value={jd} onChange={e => setJd(e.target.value)} />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <DotmSquare11 size={40} dotSize={5} speed={1.4} />
                            <p className="text-xs text-neutral-500">{loading === 'score' ? 'Scoring your resume…' : 'Tailoring bullets in place…'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="w-full" onClick={handleScore}>
                                <BarChart3 className="w-4 h-4 mr-2" /> ATS Score{priceSuffix('resume_ats_score')}
                            </Button>
                            <Button className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90" onClick={handleTailor}>
                                <Wand2 className="w-4 h-4 mr-2" /> Tailor This Resume{priceSuffix('resume_tailor_jd')}
                            </Button>
                        </div>
                    )}

                    {/* Tailor result */}
                    {tailorResult && (
                        <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                            {tailorResult.summary && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800/40">
                                    ✓ {tailorResult.summary}
                                </p>
                            )}
                            {tailorResult.keywordsAdded.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-neutral-800 mb-1.5">Keywords added/emphasised</p>
                                    <div className="flex flex-wrap gap-1">
                                        {tailorResult.keywordsAdded.map(k => <Badge key={k} className="text-[10px] bg-neutral-50 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-100">{k}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {tailorResult.suggestions.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-neutral-800 mb-1.5">What you should add to this resume</p>
                                    <ul className="space-y-1">
                                        {tailorResult.suggestions.map((s, i) => (
                                            <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex gap-1.5">
                                                <span className="text-neutral-900 flex-shrink-0">→</span>{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <p className="text-[10px] text-neutral-400">Changes are saved to this resume. Press Save in the editor to persist.</p>
                        </div>
                    )}

                    {scoreResult && (
                        <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">ATS Score</span>
                                <span className={cn('text-2xl font-black', scoreResult.score >= 80 ? 'text-neutral-800' : scoreResult.score >= 60 ? 'text-neutral-800' : 'text-red-600')}>
                                    {scoreResult.score}/100
                                </span>
                            </div>
                            {scoreResult.missing_keywords.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-red-600 mb-1.5">Missing keywords</p>
                                    <div className="flex flex-wrap gap-1">
                                        {scoreResult.missing_keywords.map(k => <Badge key={k} className="text-[10px] bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{k}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {scoreResult.suggestions.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-neutral-600 mb-1.5">Suggestions</p>
                                    <ul className="space-y-1">
                                        {scoreResult.suggestions.map((s, i) => <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400">• {s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Live Preview (HTML) ──────────────────────────────────────────────────────
function LivePreview({ content, templateSlug }: { content: ResumeDraftContent; templateSlug: string }) {
    const { header, experience, projects, education, skills } = content
    const platDef = PLATFORM_TEMPLATES.find(p => p.slug === templateSlug)
    const accent = platDef?.config.primaryColor ?? '#1a1a1a'

    return (
        <div className="bg-white text-[10px] leading-relaxed p-8 min-h-full" style={{ fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>
            <div style={{ borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{header.name || 'Your Name'}</p>
                {header.title && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{header.title}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 4, color: '#64748b', fontSize: 9 }}>
                    {[header.email, header.phone, header.location, header.github, header.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
                </div>
            </div>
            {header.summary && <p style={{ color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>{header.summary}</p>}

            {experience.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 2, marginBottom: 6 }}>Experience</p>
                    {experience.map(e => (
                        <div key={e.id} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>{e.role} - {e.company}</span>
                                <span style={{ color: '#94a3b8' }}>{e.startDate?.split('T')[0]} - {e.current ? 'Present' : e.endDate?.split('T')[0]}</span>
                            </div>
                            {e.bullets.filter(Boolean).map((b, i) => <p key={i} style={{ paddingLeft: 12, color: '#374151', marginTop: 1 }}>• {b}</p>)}
                        </div>
                    ))}
                </div>
            )}

            {skills.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 2, marginBottom: 6 }}>Skills</p>
                    {skills.map(g => (
                        <div key={g.category} style={{ marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{g.category}: </span>
                            <span style={{ color: '#475569' }}>{g.items.join(' · ')}</span>
                        </div>
                    ))}
                </div>
            )}

            {projects.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 2, marginBottom: 6 }}>Projects</p>
                    {projects.map(p => (
                        <div key={p.id} style={{ marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{p.name}</span>
                            {p.technologies.length > 0 && <span style={{ color: '#94a3b8', marginLeft: 6 }}>{p.technologies.join(', ')}</span>}
                            {p.bullets.filter(Boolean).map((b, i) => <p key={i} style={{ paddingLeft: 12, color: '#374151', marginTop: 1 }}>• {b}</p>)}
                        </div>
                    ))}
                </div>
            )}

            {education.length > 0 && (
                <div>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 2, marginBottom: 6 }}>Education</p>
                    {education.map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{e.degree ? `${e.degree}, ${e.institution}` : e.institution}</span>
                            <span style={{ color: '#94a3b8' }}>{e.startDate?.split('T')[0]} - {e.endDate?.split('T')[0]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export function ResumeEditor({ draft, content: initialContent, templates }: Props) {
    const [content, setContent] = useState<ResumeDraftContent>(initialContent)
    const [name, setName] = useState(draft.name)
    const [templateSlug, setTemplateSlug] = useState(draft.templateSlug)
    const [isPublic, setIsPublic] = useState(draft.isPublic)
    const [aiSheetOpen, setAiSheetOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [, startTransition] = useTransition()

    const handleSyncProfile = async () => {
        setSyncing(true)
        try {
            const result = await syncProfileToResumeDraft(draft.id)
            if (result.success) {
                setContent(result.content)
                toast.success('Profile synced! Review and edit as needed.')
            } else {
                toast.error(result.error ?? 'Sync failed')
            }
        } catch {
            toast.error('Failed to sync profile')
        } finally {
            setSyncing(false)
        }
    }

    const save = useCallback(async (silent = false) => {
        setSaving(true)
        const res = await updateResumeDraft(draft.id, { name, templateSlug, content, isPublic })
        setSaving(false)
        if (!silent) { if (res.success) toast.success('Saved!'); else toast.error('Save failed') }
    }, [draft.id, name, templateSlug, content, isPublic])

    const platformTemplates = templates.filter(t => t.isPlatform)

    return (
        <div className="flex flex-col h-screen">
            {/* ── Top bar ── */}
            <div className="flex items-center gap-3 px-4 h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild><Link href='/ai/resume'>
                    <ArrowLeft className="w-4 h-4" />
                </Link></Button>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-7 text-sm border-transparent bg-transparent font-semibold w-48"
                />
                <Select value={templateSlug} onValueChange={setTemplateSlug}>
                    <SelectTrigger className="h-7 text-xs w-36 border-neutral-200 dark:border-neutral-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {platformTemplates.map(t => <SelectItem key={t.slug} value={t.slug} className="text-xs">{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center gap-1.5">
                    {draft.atsScore !== null && (
                        <Badge variant="outline" className="text-xs">ATS {draft.atsScore}</Badge>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={syncing}
                        onClick={handleSyncProfile}
                        title="Auto-fill from your ShipItHQ profile"
                    >
                        <RefreshCw className={cn("w-3 h-3 mr-1", syncing && "animate-spin")} />
                        {syncing ? 'Syncing…' : 'Sync Profile'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAiSheetOpen(true)}>
                        <Wand2 className="w-3 h-3 mr-1" /> AI Tools
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                            startTransition(async () => {
                                await updateResumeDraft(draft.id, { isPublic: !isPublic })
                                setIsPublic(p => !p)
                                toast.success(!isPublic ? 'Made public' : 'Made private')
                            })
                        }}
                    >
                        {isPublic ? <><Eye className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}
                    </Button>
                    {isPublic && (
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/r/${draft.shareSlug}`, '_blank')}>
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/resume/pdf/${draft.id}`, '_blank')}>
                        <Download className="w-3 h-3 mr-1" /> PDF
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90" onClick={() => save()}>
                        {saving ? <DotmSquare11 size={14} dotSize={2} speed={1.4} /> : <><Save className="w-3 h-3 mr-1" />Save</>}
                    </Button>
                </div>
            </div>

            {/* ── Two-pane editor ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Form */}
                <div className="w-full lg:w-[440px] lg:flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto">
                    <Tabs defaultValue="header" className="h-full">
                        <TabsList className="sticky top-0 z-10 w-full rounded-none border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 justify-start px-4 gap-1 h-9">
                            {['header', 'experience', 'projects', 'education', 'skills'].map(t => (
                                <TabsTrigger key={t} value={t} className="text-xs capitalize h-7">{t}</TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="p-4">
                            <TabsContent value="header" className="mt-0"><HeaderSection header={content.header} onChange={h => setContent(c => ({ ...c, header: h }))} /></TabsContent>
                            <TabsContent value="experience" className="mt-0"><ExperienceSection items={content.experience} onChange={v => setContent(c => ({ ...c, experience: v }))} /></TabsContent>
                            <TabsContent value="projects" className="mt-0"><ProjectsSection items={content.projects} onChange={v => setContent(c => ({ ...c, projects: v }))} /></TabsContent>
                            <TabsContent value="education" className="mt-0"><EducationSection items={content.education} onChange={v => setContent(c => ({ ...c, education: v }))} /></TabsContent>
                            <TabsContent value="skills" className="mt-0"><SkillsSection items={content.skills} onChange={v => setContent(c => ({ ...c, skills: v }))} /></TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Right: Live preview */}
                <div className="hidden lg:flex flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 p-6 items-start justify-center">
                    <div className="w-[595px] shadow-2xl">
                        <LivePreview content={content} templateSlug={templateSlug} />
                    </div>
                </div>
            </div>

            <AIToolsSheet
                draftId={draft.id}
                open={aiSheetOpen}
                onClose={() => setAiSheetOpen(false)}
                onContentUpdated={(updatedContent) => setContent(updatedContent)}
            />
        </div>
    )
}
