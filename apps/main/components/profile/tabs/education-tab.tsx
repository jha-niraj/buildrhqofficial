"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { GraduationCap, Plus, Pencil, CalendarDays } from "lucide-react"
import { AddEducationSheet } from "@/components/profile/sheets/add-education-sheet"

function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

interface EducationEntry {
    id: string
    degree?: string | null
    institution: string
    startDate: Date | null
    endDate?: Date | null
    bulletPoints?: string[]
}

interface EducationTabProps {
    user: {
        university?: string | null
        educations?: EducationEntry[]
    }
    isOwnProfile: boolean
    onRefresh?: () => void | Promise<void>
}

export function EducationTab({ user, isOwnProfile, onRefresh }: EducationTabProps) {
    const educations = user.educations ?? []
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingEdu, setEditingEdu] = useState<EducationEntry | null>(null)

    const openAdd = () => { setEditingEdu(null); setSheetOpen(true) }
    const openEdit = (edu: EducationEntry) => { setEditingEdu(edu); setSheetOpen(true) }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                Education
                            </CardTitle>
                            {isOwnProfile && (
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={openAdd}>
                                    <Plus className="w-3.5 h-3.5" /> Add Education
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {educations.length > 0 ? (
                            <div className="space-y-5">
                                {educations.map((edu, idx) => (
                                    <motion.div
                                        key={edu.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <GraduationCap className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {edu.degree ? `${edu.degree}` : ""}
                                                        {edu.degree && <span className="text-muted-foreground font-normal">, </span>}
                                                        {edu.institution}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {edu.startDate ? formatDate(edu.startDate) : "-"} - {edu.endDate ? formatDate(edu.endDate) : "Present"}
                                                    </div>
                                                </div>
                                                {isOwnProfile && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground"
                                                        onClick={() => openEdit(edu)}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            {edu.bulletPoints && edu.bulletPoints.length > 0 && (
                                                <ul className="mt-2 space-y-1">
                                                    {edu.bulletPoints.map((p, i) => (
                                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                            <span className="text-neutral-900 dark:text-neutral-100 flex-shrink-0">•</span>
                                                            <span>{p}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isOwnProfile && (
                                    <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2" onClick={openAdd}>
                                        <Plus className="w-3.5 h-3.5" /> Add Another
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm mb-1">No education added yet</p>
                                {user.university && (
                                    <p className="text-xs mb-3 text-muted-foreground">Legacy: {user.university}</p>
                                )}
                                {isOwnProfile && (
                                    <Button size="sm" onClick={openAdd}>
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Education
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <AddEducationSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onSuccess={async () => await onRefresh?.()}
                editEducation={editingEdu}
            />
        </div>
    )
}
