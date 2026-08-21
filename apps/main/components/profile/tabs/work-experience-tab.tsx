"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import {
    FileText, Eye, Loader2, Plus, Pencil, Building2, CalendarDays
} from "lucide-react"
import Link from "next/link"
import toast from "@repo/ui/components/ui/sonner"
import { uploadResume } from "@/actions/(main)/user/resume.action"
import { getResumeSignedUrl } from "@/actions/(main)/user/resume.action"
import { AddWorkExperienceSheet } from "@/components/profile/sheets/add-work-experience-sheet"

interface Experience {
    id: string
    companyName: string
    roleTitle: string
    description?: string | null
    bulletPoints?: string[]
    startDate: Date
    endDate?: Date | null
    isCurrentlyWorking?: boolean
    companyWebsite?: string | null
}

interface WorkExperienceTabProps {
    user: {
        id: string
        name?: string | null
        username?: string | null
        image?: string | null
        location?: string | null
        occupation?: string | null
        resume?: string | null
        hasResume?: boolean
        experiences?: Experience[]
        portfolioProjects?: Array<{
            id: string
            projectName: string
            description?: string | null
            bulletPoints?: string[]
            technologies?: string[]
            startDate: Date
            endDate?: Date | null
        }>
        educations?: Array<{
            id: string
            degree?: string | null
            institution: string
            startDate: Date | null
            endDate?: Date | null
        }>
        certifications?: Array<{
            id: string
            name: string
            issuer: string
            issuedDate: Date
            link: string
        }>
        skills?: Array<{ id: string; name: string; category?: string }>
        socialLinks?: Array<{ id: string; platform: string; url: string }>
    }
    isOwnProfile: boolean
    onUploadResume?: () => void | Promise<void>
    onRefresh?: () => void | Promise<void>
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function WorkExperienceTab({ user, isOwnProfile, onUploadResume, onRefresh }: WorkExperienceTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [resumeViewUrl, setResumeViewUrl] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingExp, setEditingExp] = useState<Experience | null>(null)

    const handleUploadClick = () => fileInputRef.current?.click()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if (!allowed.includes(file.type)) {
            toast.error("Please upload a PDF or DOC/DOCX file")
            return
        }
        setUploading(true)
        try {
            const result = await uploadResume(file)
            if (result.url || result.success) {
                toast.success("Resume uploaded successfully!")
                await onUploadResume?.()
            } else {
                toast.error(result.message || "Upload failed")
            }
        } catch {
            toast.error("Failed to upload resume")
        } finally {
            setUploading(false)
            e.target.value = ""
        }
    }

    const handleViewResume = async () => {
        if (resumeViewUrl) { window.open(resumeViewUrl, "_blank"); return }
        const res = await getResumeSignedUrl()
        if (res?.url) { setResumeViewUrl(res.url); window.open(res.url, "_blank") }
        else toast.error("Could not load resume")
    }

    const openAdd = () => { setEditingExp(null); setSheetOpen(true) }
    const openEdit = (exp: Experience) => { setEditingExp(exp); setSheetOpen(true) }

    const handleSaved = async () => {
        await onRefresh?.()
        await onUploadResume?.()
    }

    return (
        <div className="space-y-6">
            {/* Uploaded resume card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-neutral-900/10 via-neutral-900/10 to-neutral-900/10 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-900 flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Uploaded Resume</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {user.hasResume && user.resume ? "PDF document available" : "No resume uploaded yet"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                                {user.hasResume && user.resume ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={handleViewResume}>
                                        <Eye className="w-4 h-4" /> View / Download
                                    </Button>
                                ) : isOwnProfile && (
                                    <Button
                                        onClick={handleUploadClick}
                                        disabled={uploading}
                                        className="gap-2 bg-gradient-to-r from-neutral-900 to-neutral-900 text-white hover:from-neutral-800 hover:to-neutral-800"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                        {uploading ? "Uploading..." : "Upload Resume"}
                                    </Button>
                                )}
                                {isOwnProfile && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/ai/resume">
                                            <FileText className="w-4 h-4 mr-1.5" />
                                            Resume Builder
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Work Experiences */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base">Work Experience</h3>
                    {isOwnProfile && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={openAdd}>
                            <Plus className="w-3.5 h-3.5" /> Add Experience
                        </Button>
                    )}
                </div>

                {(!user.experiences || user.experiences.length === 0) ? (
                    <Card className="p-8 text-center">
                        <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground mb-3">No work experience added yet</p>
                        {isOwnProfile && (
                            <Button size="sm" onClick={openAdd}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Your First Experience
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {user.experiences.map((exp, idx) => (
                            <motion.div
                                key={exp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Building2 className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold">{exp.roleTitle}</h4>
                                                    {exp.isCurrentlyWorking && (
                                                        <Badge className="text-[10px] bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {formatDate(exp.startDate)} - {exp.isCurrentlyWorking ? 'Present' : exp.endDate ? formatDate(exp.endDate) : '-'}
                                                </div>
                                                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                                                    <ul className="mt-2 space-y-1">
                                                        {exp.bulletPoints.map((b, i) => (
                                                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                                <span className="text-primary flex-shrink-0 mt-0.5">•</span>
                                                                <span>{b}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                        {isOwnProfile && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground"
                                                onClick={() => openEdit(exp)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        {isOwnProfile && (
                            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={openAdd}>
                                <Plus className="w-3.5 h-3.5" /> Add Another Experience
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>

            <AddWorkExperienceSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onSuccess={handleSaved}
                editExperience={editingExp}
            />
        </div>
    )
}
