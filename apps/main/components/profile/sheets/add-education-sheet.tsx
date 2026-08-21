'use client'

import { useState, useEffect } from 'react'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Plus, Trash2, GraduationCap } from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import {
    addUserEducation, updateUserEducation, deleteUserEducation
} from '@/actions/(main)/user/profile.action'

interface Education {
    id?: string
    institution: string
    degree?: string | null
    startDate?: Date | null
    endDate?: Date | null
    bulletPoints?: string[]
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editEducation?: Education | null
}

const EMPTY = {
    institution: '',
    degree: '',
    startDate: '',
    endDate: '',
    bulletPoints: '',
    current: false,
}

export function AddEducationSheet({ open, onOpenChange, onSuccess, editEducation }: Props) {
    const [form, setForm] = useState(EMPTY)

    const isEditing = !!editEducation?.id

    useEffect(() => {
        if (open && editEducation) {
            setForm({
                institution: editEducation.institution ?? '',
                degree: editEducation.degree ?? '',
                startDate: editEducation.startDate ? (editEducation.startDate.toISOString().split('T')[0] ?? '') : '',
                endDate: editEducation.endDate ? (editEducation.endDate.toISOString().split('T')[0] ?? '') : '',
                bulletPoints: (editEducation.bulletPoints ?? []).join('\n'),
                current: !editEducation.endDate,
            })
        } else if (open) {
            setForm(EMPTY)
        }
    }, [open, editEducation])

    const field = (k: keyof typeof form) => ({
        value: form[k] as string,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [k]: e.target.value }))
    })

    const handleSubmit = async () => {
        if (!form.institution.trim()) return toast.error('Institution is required')
        if (!form.startDate) return toast.error('Start date is required')

        const bullets = form.bulletPoints.split('\n').map(b => b.trim()).filter(Boolean)
        const data = {
            institution: form.institution.trim(),
            degree: form.degree?.trim() || undefined,
            startDate: new Date(form.startDate),
            endDate: form.current || !form.endDate ? undefined : new Date(form.endDate),
            bulletPoints: bullets,
        }

        onOpenChange(false)
        const toastId = toast.loading(isEditing ? 'Updating education…' : 'Adding education…')
        try {
            const res = isEditing && editEducation?.id
                ? await updateUserEducation(editEducation.id, data)
                : await addUserEducation(data)

            if (!res.success) {
                toast.error(res.message || 'Failed to save', { id: toastId })
                return
            }
            toast.success(isEditing ? 'Education updated!' : 'Education added!', { id: toastId })
            onSuccess()
        } catch {
            toast.error('Something went wrong', { id: toastId })
        }
    }

    const handleDelete = async () => {
        if (!editEducation?.id) return
        onOpenChange(false)
        const toastId = toast.loading('Deleting…')
        try {
            const res = await deleteUserEducation(editEducation.id)
            if (!res.success) {
                toast.error(res.message || 'Failed to delete', { id: toastId })
                return
            }
            toast.success('Education deleted', { id: toastId })
            onSuccess()
        } catch {
            toast.error('Something went wrong', { id: toastId })
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                        </div>
                        <div>
                            <SheetTitle>{isEditing ? 'Edit Education' : 'Add Education'}</SheetTitle>
                            <SheetDescription className="text-xs mt-0.5">
                                Appears on your profile and resumes.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Institution <span className="text-red-500">*</span></Label>
                        <Input placeholder="e.g. MIT, IIT Delhi, Stanford" className="h-9" {...field('institution')} />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Degree / Qualification</Label>
                        <Input placeholder="e.g. B.Tech Computer Science, MBA" className="h-9" {...field('degree')} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Start Date <span className="text-red-500">*</span></Label>
                            <Input type="date" className="h-9" {...field('startDate')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">End Date</Label>
                            <Input type="date" className="h-9" disabled={form.current} {...field('endDate')} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.current}
                            onChange={e => setForm(f => ({ ...f, current: e.target.checked, endDate: '' }))}
                            className="rounded"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Currently studying here</span>
                    </label>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Highlights / Activities</Label>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Optional - one per line (GPA, awards, clubs, etc.)</p>
                        <Textarea
                            placeholder={"CGPA: 9.2/10\nTech Fest Winner 2023\nStudent Council President"}
                            className="h-24 resize-none text-sm"
                            {...field('bulletPoints')}
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 pt-0 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 flex-shrink-0">
                    <Button
                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 h-10"
                        onClick={handleSubmit}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isEditing ? 'Save Changes' : 'Add Education'}
                    </Button>
                    {isEditing && (
                        <Button
                            variant="outline"
                            className="w-full h-9 text-red-500 hover:text-red-600 hover:border-red-300"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
