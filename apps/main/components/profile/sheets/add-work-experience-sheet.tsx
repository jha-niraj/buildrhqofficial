'use client'

import { useState, useEffect } from 'react'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Separator } from '@repo/ui/components/ui/separator'
import { Plus, Trash2, Briefcase } from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import {
    addWorkExperience, updateWorkExperience, deleteWorkExperience
} from '@/actions/(main)/user/profile.action'

interface Experience {
    id?: string
    companyName: string
    roleTitle: string
    companyWebsite?: string | null
    description?: string | null
    bulletPoints?: string[]
    startDate?: Date | null
    endDate?: Date | null
    isCurrentlyWorking?: boolean
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editExperience?: Experience | null
}

const EMPTY_FORM = {
    companyName: '',
    roleTitle: '',
    companyWebsite: '',
    description: '',
    bulletPoints: '',
    startDate: '',
    endDate: '',
    isCurrentlyWorking: false,
}

export function AddWorkExperienceSheet({ open, onOpenChange, onSuccess, editExperience }: Props) {
    const [form, setForm] = useState(EMPTY_FORM)

    const isEditing = !!editExperience?.id

    useEffect(() => {
        if (open && editExperience) {
            setForm({
                companyName: editExperience.companyName ?? '',
                roleTitle: editExperience.roleTitle ?? '',
                companyWebsite: editExperience.companyWebsite ?? '',
                description: editExperience.description ?? '',
                bulletPoints: (editExperience.bulletPoints ?? []).join('\n'),
                startDate: editExperience.startDate ? (editExperience.startDate.toISOString().split('T')[0] ?? '') : '',
                endDate: editExperience.endDate ? (editExperience.endDate.toISOString().split('T')[0] ?? '') : '',
                isCurrentlyWorking: editExperience.isCurrentlyWorking ?? false,
            })
        } else if (open) {
            setForm(EMPTY_FORM)
        }
    }, [open, editExperience])

    const field = (k: keyof typeof form) => ({
        value: form[k] as string,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [k]: e.target.value }))
    })

    const handleSubmit = async () => {
        if (!form.companyName.trim() || !form.roleTitle.trim()) {
            return toast.error('Company name and role title are required')
        }
        if (!form.startDate) return toast.error('Start date is required')

        const bullets = form.bulletPoints
            .split('\n')
            .map(b => b.trim())
            .filter(Boolean)

        const data = {
            companyName: form.companyName.trim(),
            roleTitle: form.roleTitle.trim(),
            companyWebsite: form.companyWebsite?.trim() || undefined,
            description: form.description?.trim() || undefined,
            bulletPoints: bullets,
            startDate: new Date(form.startDate),
            endDate: form.isCurrentlyWorking || !form.endDate ? undefined : new Date(form.endDate),
            isCurrentlyWorking: form.isCurrentlyWorking,
        }

        // Optimistic: close sheet immediately, sync in background
        onOpenChange(false)
        const toastId = toast.loading(isEditing ? 'Updating experience…' : 'Adding experience…')
        try {
            const res = isEditing && editExperience?.id
                ? await updateWorkExperience(editExperience.id, data)
                : await addWorkExperience(data)

            if (!res.success) {
                toast.error(res.message || 'Failed to save', { id: toastId })
                return
            }
            toast.success(isEditing ? 'Experience updated!' : 'Experience added!', { id: toastId })
            onSuccess()
        } catch {
            toast.error('Something went wrong', { id: toastId })
        }
    }

    const handleDelete = async () => {
        if (!editExperience?.id) return
        onOpenChange(false)
        const toastId = toast.loading('Deleting…')
        try {
            const res = await deleteWorkExperience(editExperience.id)
            if (!res.success) {
                toast.error(res.message || 'Failed to delete', { id: toastId })
                return
            }
            toast.success('Experience deleted', { id: toastId })
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
                            <Briefcase className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                        </div>
                        <div>
                            <SheetTitle>{isEditing ? 'Edit Experience' : 'Add Work Experience'}</SheetTitle>
                            <SheetDescription className="text-xs mt-0.5">
                                This data powers your resume and profile.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-medium">Company Name <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g. Google" className="h-9" {...field('companyName')} />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-medium">Job Title <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g. Software Engineer" className="h-9" {...field('roleTitle')} />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-medium">Company Website</Label>
                            <Input placeholder="https://company.com" className="h-9" {...field('companyWebsite')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Start Date <span className="text-red-500">*</span></Label>
                            <Input type="date" className="h-9" {...field('startDate')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">End Date</Label>
                            <Input type="date" className="h-9" disabled={form.isCurrentlyWorking} {...field('endDate')} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isCurrentlyWorking}
                            onChange={e => setForm(f => ({ ...f, isCurrentlyWorking: e.target.checked, endDate: '' }))}
                            className="rounded"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">I currently work here</span>
                    </label>

                    <Separator />

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Description</Label>
                        <Textarea
                            placeholder="Brief role description..."
                            className="h-20 resize-none text-sm"
                            {...field('description')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Bullet Points</Label>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">One per line. Use strong action verbs and metrics.</p>
                        <Textarea
                            placeholder={"Built API reducing latency by 40%\nLed team of 5 engineers across 3 sprints"}
                            className="h-28 resize-none text-sm"
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
                        {isEditing ? 'Save Changes' : 'Add Experience'}
                    </Button>
                    {isEditing && (
                        <Button
                            variant="outline"
                            className="w-full h-9 text-red-500 hover:text-red-600 hover:border-red-300"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Experience
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
