'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
    FolderPlus, Loader2
} from 'lucide-react'
import { createPathfinderGroup } from '@/actions/(main)/pathfinder'
import { cn } from '@repo/ui/lib/utils'
import toast from '@repo/ui/components/ui/sonner'
import type { PathfinderGroup } from '@/app/store/pathfinderStore'

interface CreateGroupSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (group: PathfinderGroup) => void
}

const colorOptions = [
    '#525252', '#737373', '#10b981', '#525252',
    '#ef4444', '#ec4899', '#404040', '#a3a3a3',
]

const emojiOptions = ['📁', '🎯', '💻', '🚀', '📚', '🧠', '⚡', '🔥', '💡', '🎨']

export function CreateGroupSheet({ open, onOpenChange, onSuccess }: CreateGroupSheetProps) {
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState('📁')
    const [color, setColor] = useState('#525252')
    const [isLoading, setIsLoading] = useState(false)

    const resetForm = () => {
        setName('')
        setEmoji('📁')
        setColor('#525252')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Please enter a group name')
            return
        }

        setIsLoading(true)

        try {
            const result = await createPathfinderGroup({
                name: name.trim(),
                emoji,
                color,
            })

            if (result.success && result.group) {
                const newGroup: PathfinderGroup = {
                    id: result.group.id,
                    name: result.group.name,
                    emoji: result.group.emoji,
                    color: result.group.color,
                    description: result.group.description ?? null,
                    order: result.group.order ?? 0,
                    _count: { goals: 0 }
                }
                toast.success('Group created!')
                resetForm()
                onOpenChange(false)
                onSuccess?.(newGroup)
            } else {
                toast.error(result.error || 'Failed to create group')
            }
        } catch {
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen)
            if (!isOpen) resetForm()
        }}>
            <SheetContent side="bottom" className="h-auto max-h-[70vh]">
                <div className="max-w-md mx-auto">
                    <SheetHeader className="text-center mb-6">
                        <div className="w-11 h-11 mx-auto rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <FolderPlus className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <SheetTitle className="text-lg">Create Group</SheetTitle>
                        <SheetDescription className="text-sm">
                            Organize your learning goals into groups
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs text-neutral-500 dark:text-neutral-400">Group Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Frontend, Backend, DSA"
                                className="h-10"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-neutral-500 dark:text-neutral-400">Icon</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {
                                    emojiOptions.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEmoji(e)}
                                            className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all",
                                                emoji === e
                                                    ? "bg-neutral-200 dark:bg-neutral-700 ring-2 ring-neutral-400"
                                                    : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            {e}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-neutral-500 dark:text-neutral-400">Color</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {
                                    colorOptions.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg transition-all",
                                                color === c && "ring-2 ring-offset-2 ring-neutral-400"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    {emoji}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                        {name || 'Group Name'}
                                    </div>
                                    <div className="text-[10px] text-neutral-400">Preview</div>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !name.trim()}
                        >
                            {
                                isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <FolderPlus className="w-4 h-4 mr-1.5" />
                                        Create Group
                                    </>
                                )
                            }
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}