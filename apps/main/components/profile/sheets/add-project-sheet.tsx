"use client"

import { useState } from "react"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import {
    Plus, Trash2, CalendarIcon, Link2, Image
} from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@repo/ui/components/ui/calendar"
import {
    Popover, PopoverContent, PopoverTrigger
} from "@repo/ui/components/ui/popover"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import { TechSelect } from "@/app/(main)/ai/resume/_components/projects-tab-form"
import toast from "@repo/ui/components/ui/sonner"
import { addPortfolioProject } from "@/actions/(main)/user/profile.action"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"

const PROJECT_TYPES = ["PROFESSIONAL", "PERSONAL", "OPEN_SOURCE", "ACADEMIC"]
const STATUSES = ["IN_PROGRESS", "COMPLETED", "ARCHIVED"]
const VISIBILITIES = ["PUBLIC", "PRIVATE"]
const LINK_TYPES = ["GITHUB", "GITLAB", "BITBUCKET", "DEMO", "DOCUMENTATION", "LIVE SITE", "DOWNLOAD", "BLOG POST"]
const MEDIA_TYPES = ["Image", "Video"]
const TECH_OPTIONS = [
    "HTML", "HTML5", "CSS", "CSS3", "Sass", "Less", "JavaScript", "TypeScript", "jQuery", "Redux",
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "NestJS",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "Drizzle",
    "TailwindCSS", "Bootstrap", "Material UI", "Chakra UI",
    "Python", "Java", "Go", "Rust", "C++", "C#",
    "Docker", "Kubernetes", "AWS", "GCP", "Vercel", "Netlify",
]

interface AddProjectSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddProjectSheet({ open, onOpenChange, onSuccess }: AddProjectSheetProps) {
    const [startDateOpen, setStartDateOpen] = useState(false)
    const [endDateOpen, setEndDateOpen] = useState(false)
    const [form, setForm] = useState({
        projectName: "",
        projectType: PROJECT_TYPES[0],
        status: STATUSES[0],
        visibility: VISIBILITIES[0],
        description: "",
        technologies: [] as string[],
        startDate: new Date(),
        endDate: undefined as Date | undefined,
        links: [] as { linkType: string; url: string; description: string | null }[],
        media: [] as { mediaUrl: string; mediaType: string; caption: string | null }[],
    })

    const resetForm = () => {
        setForm({
            projectName: "",
            projectType: PROJECT_TYPES[0],
            status: STATUSES[0],
            visibility: VISIBILITIES[0],
            description: "",
            technologies: [],
            startDate: new Date(),
            endDate: undefined,
            links: [],
            media: [],
        })
    }

    const handleSubmit = async () => {
        if (!form.projectName.trim()) {
            toast.error("Project name is required")
            return
        }

        const lines = form.description.split("\n").filter(Boolean)
        const data = {
            projectName: form.projectName.trim(),
            projectType: form.projectType ?? "PERSONAL",
            status: form.status ?? "IN_PROGRESS",
            visibility: form.visibility ?? "PUBLIC",
            technologies: form.technologies,
            bulletPoints: lines,
            startDate: form.startDate,
            endDate: form.endDate,
            links: form.links.filter((l) => l.url.trim()),
            media: form.media.filter((m) => m.mediaUrl.trim()),
        }

        // Optimistic: close and reset immediately
        resetForm()
        onOpenChange(false)
        const toastId = toast.loading("Adding project…")
        const res = await addPortfolioProject(data)
        if (res.success) {
            toast.success("Project added!", { id: toastId })
            onSuccess()
        } else {
            toast.error(res.message || "Failed to add project", { id: toastId })
        }
    }

    const toggleTech = (tech: string) => {
        setForm((p) => ({
            ...p,
            technologies: p.technologies.includes(tech)
                ? p.technologies.filter((t) => t !== tech)
                : [...p.technologies, tech],
        }))
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent scroll={false} side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
                <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                    <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetTitle>Add Project</SheetTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-normal">
                            Projects you add here will appear on your profile and auto-populate your resumes.
                        </p>
                    </SheetHeader>
                    <ScrollArea className="min-h-0 flex-1 w-full" viewportClassName="px-6 py-4" reflow>
                        <div className="space-y-6 w-full max-w-3xl">
                            <div>
                                <Label>Project Name</Label>
                                <Input
                                    value={form.projectName}
                                    onChange={(e) => setForm((p) => ({ ...p, projectName: e.target.value }))}
                                    placeholder="Project name"
                                />
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="min-w-[140px]">
                                    <Label>Project Type</Label>
                                    <Select
                                        value={form.projectType}
                                        onValueChange={(v) => setForm((p) => ({ ...p, projectType: v }))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="min-w-[140px]">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="min-w-[120px]">
                                    <Label>Visibility</Label>
                                    <Select value={form.visibility} onValueChange={(v) => setForm((p) => ({ ...p, visibility: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {VISIBILITIES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="One point per line..."
                                    rows={4}
                                    maxLength={5000}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">{form.description.length}/5000</p>
                            </div>
                            <div>
                                <Label>Technologies</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {
                                        form.technologies.map((tech) => (
                                            <button
                                                key={tech}
                                                type="button"
                                                onClick={() => toggleTech(tech)}
                                                className="px-2 py-1 rounded text-xs border bg-primary text-primary-foreground border-primary"
                                            >
                                                {tech} ×
                                            </button>
                                        ))
                                    }
                                    <TechSelect
                                        options={TECH_OPTIONS}
                                        selected={form.technologies}
                                        onToggle={toggleTech}
                                        onAddCustom={(t) => {
                                            const tech = t.trim().toUpperCase().replace(/\s+/g, "_")
                                            if (tech && !form.technologies.includes(tech)) {
                                                setForm((p) => ({ ...p, technologies: [...p.technologies, tech] }))
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Project Links</Label>
                                <div className="space-y-3 mt-2">
                                    {
                                        form.links.map((link, i) => (
                                            <div key={i} className="flex gap-2 items-start flex-wrap">
                                                <Select
                                                    value={link.linkType}
                                                    onValueChange={(v) =>
                                                        setForm((p) => ({ ...p, links: p.links.map((l, j) => (j === i ? { ...l, linkType: v } : l)) }))
                                                    }
                                                >
                                                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {LINK_TYPES.map((lt) => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input className="flex-1 min-w-[180px]" placeholder="https://..." value={link.url} onChange={(e) => setForm((p) => ({ ...p, links: p.links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)) }))} />
                                                <Input className="w-[180px]" placeholder="Description" value={link.description || ""} onChange={(e) => setForm((p) => ({ ...p, links: p.links.map((l, j) => (j === i ? { ...l, description: e.target.value } : l)) }))} />
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setForm((p) => ({ ...p, links: p.links.filter((_, j) => j !== i) }))}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    }
                                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setForm((p) => ({ ...p, links: [...p.links, { linkType: "GITHUB", url: "", description: null }] }))}>
                                        <Plus className="w-4 h-4" /> Add Link
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Project Media</Label>
                                <div className="space-y-3 mt-2">
                                    {
                                        form.media.map((med, i) => (
                                            <div key={i} className="flex gap-2 items-start flex-wrap p-3 rounded-lg border bg-muted/30">
                                                <Select value={med.mediaType} onValueChange={(v) => setForm((p) => ({ ...p, media: p.media.map((m, j) => (j === i ? { ...m, mediaType: v } : m)) }))}>
                                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {MEDIA_TYPES.map((mt) => <SelectItem key={mt} value={mt}>{mt}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input className="flex-1 min-w-[200px]" placeholder="https://..." value={med.mediaUrl} onChange={(e) => setForm((p) => ({ ...p, media: p.media.map((m, j) => (j === i ? { ...m, mediaUrl: e.target.value } : m)) }))} />
                                                <Input className="w-[180px]" placeholder="Description" value={med.caption || ""} onChange={(e) => setForm((p) => ({ ...p, media: p.media.map((m, j) => (j === i ? { ...m, caption: e.target.value } : m)) }))} />
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setForm((p) => ({ ...p, media: p.media.filter((_, j) => j !== i) }))}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    }
                                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setForm((p) => ({ ...p, media: [...p.media, { mediaUrl: "", mediaType: "Image", caption: null }] }))}>
                                        <Plus className="w-4 h-4" /> Add Media
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <Label>Start Date</Label>
                                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(form.startDate, "MMMM d, yyyy")}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={form.startDate}
                                                onSelect={(d) => d && setForm((p) => ({ ...p, startDate: d }))}
                                                onDayClick={() => setStartDateOpen(false)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>End Date (optional)</Label>
                                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {form.endDate ? format(form.endDate, "MMMM d, yyyy") : "Select"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={form.endDate}
                                                onSelect={(d) => setForm((p) => ({ ...p, endDate: d }))}
                                                onDayClick={() => setEndDateOpen(false)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <div className="px-6 py-4 border-t shrink-0">
                        <Button onClick={handleSubmit}>
                            Add Project
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}