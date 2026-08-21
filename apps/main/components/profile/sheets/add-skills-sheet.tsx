'use client'

import { useState } from 'react'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import { Loader2, Plus, Trash2, Code2, X } from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import { updateUserSkills, deleteSkill } from '@/actions/(main)/user/user.action'
import type { UserSkill } from '@/types/user'

const CATEGORIES = [
    'LANGUAGES', 'FRAMEWORKS_LIBRARIES', 'TOOLS_DATABASES',
    'FRONTEND', 'BACKEND', 'API', 'DATABASE', 'DEVOPS', 'CLOUD', 'AI_TOOLS', 'PLATFORMS',
]

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

interface Skill {
    id: string
    name: string
    level: string
    category: string
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    existingSkills?: Skill[]
}

export function AddSkillsSheet({ open, onOpenChange, onSuccess, existingSkills = [] }: Props) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [newSkill, setNewSkill] = useState('')
    const [category, setCategory] = useState('LANGUAGES')
    const [level, setLevel] = useState('intermediate')
    const [pending, setPending] = useState<Array<{ name: string; category: string; level: string }>>([])

    const addToPending = () => {
        const name = newSkill.trim()
        if (!name) return toast.error('Enter a skill name')
        if (existingSkills.some(s => s.name.toLowerCase() === name.toLowerCase()) ||
            pending.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            return toast.error('Skill already added')
        }
        setPending(p => [...p, { name, category, level }])
        setNewSkill('')
    }

    const removePending = (name: string) => setPending(p => p.filter(s => s.name !== name))

    const handleSave = async () => {
        if (!pending.length) return toast.error('Add at least one skill')
        const toSave = [...pending]
        setPending([])
        onOpenChange(false)
        const toastId = toast.loading(`Saving ${toSave.length} skill${toSave.length > 1 ? 's' : ''}…`)
        try {
            await updateUserSkills(toSave as UserSkill[])
            toast.success(`${toSave.length} skill${toSave.length > 1 ? 's' : ''} added!`, { id: toastId })
            onSuccess()
        } catch {
            toast.error('Failed to save skills', { id: toastId })
        }
    }

    const handleDelete = async (id: string, name: string) => {
        setDeletingId(id)
        try {
            await deleteSkill(id)
            toast.success(`"${name}" removed`)
            onSuccess()
        } catch {
            toast.error('Failed to delete skill')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                            <Code2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                        </div>
                        <div>
                            <SheetTitle>Manage Skills</SheetTitle>
                            <SheetDescription className="text-xs mt-0.5">
                                Add or remove skills from your profile.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
                    {/* Add new skill */}
                    <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Add Skill</p>
                        <div className="space-y-2">
                            <Input
                                placeholder="Skill name (e.g. React, Python, Docker)"
                                value={newSkill}
                                onChange={e => setNewSkill(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addToPending()}
                                className="h-9"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c} className="text-xs">
                                                {c.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={level} onValueChange={setLevel}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LEVELS.map(l => (
                                            <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={addToPending}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to Queue
                            </Button>
                        </div>
                    </div>

                    {/* Pending skills */}
                    {pending.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Ready to save ({pending.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {pending.map(s => (
                                    <Badge key={s.name} className="gap-1.5 pr-1.5 bg-neutral-50 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800/40">
                                        {s.name}
                                        <span className="text-[10px] opacity-70">{s.level}</span>
                                        <button onClick={() => removePending(s.name)} className="ml-0.5 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing skills */}
                    {existingSkills.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Your Skills ({existingSkills.length})</p>
                            <div className="space-y-1.5">
                                {existingSkills.map(skill => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{skill.name}</span>
                                            <Badge variant="outline" className="text-[10px] capitalize">{skill.level}</Badge>
                                            <Badge variant="outline" className="text-[10px]">{skill.category.replace(/_/g, ' ')}</Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500"
                                            disabled={deletingId === skill.id}
                                            onClick={() => handleDelete(skill.id, skill.name)}
                                        >
                                            {deletingId === skill.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <Trash2 className="w-3 h-3" />
                                            }
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 pt-0 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    <Button
                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 h-10"
                        onClick={handleSave}
                        disabled={!pending.length}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {pending.length ? `Save ${pending.length} Skill${pending.length > 1 ? 's' : ''}` : 'Add Skills to Queue First'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
