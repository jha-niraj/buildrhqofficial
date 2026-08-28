'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
    FolderPlus
} from 'lucide-react'
import { createPathfinderGroup } from '@/actions/(main)/pathfinder'
import { cn } from '@repo/ui/lib/utils'
import toast from '@repo/ui/components/ui/sonner'
import type { PathfinderGroup } from '@/app/store/pathfinderStore'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { AnimatedIcon } from '@repo/ui/components/animated-icons'
import { GROUP_ICONS, DEFAULT_GROUP_ICON, GroupIcon } from './group-icon'

interface CreateGroupSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (group: PathfinderGroup) => void
}

// Deduped - '#525252' appeared twice, giving two identical swatches and a
// duplicate React key.
const colorOptions = [
    '#525252', '#737373', '#404040', '#a3a3a3',
    '#10b981', '#ef4444', '#ec4899', '#171717',
]

// The emoji list moved to GROUP_ICONS in ./group-icon. Emoji rendered
// differently on every OS, could not inherit `currentColor`, and stayed
// full-colour inside a dark selected swatch.

export function CreateGroupSheet({ open, onOpenChange, onSuccess }: CreateGroupSheetProps) {
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState<string>(DEFAULT_GROUP_ICON)
    const [color, setColor] = useState('#525252')
    const [isLoading, setIsLoading] = useState(false)

    const resetForm = () => {
        setName('')
        setEmoji(DEFAULT_GROUP_ICON)
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
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
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
                                    GROUP_ICONS.map((name) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setEmoji(name)}
                                            aria-label={name}
                                            aria-pressed={emoji === name}
                                            className={cn(
                                                "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                                                emoji === name
                                                    ? "bg-neutral-200 text-neutral-900 ring-2 ring-neutral-400 dark:bg-neutral-700 dark:text-neutral-100"
                                                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                                            )}
                                        >
                                            <AnimatedIcon name={name} size={18} motion={emoji === name ? 'always' : 'hover'} />
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
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-900 dark:text-neutral-100"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <GroupIcon value={emoji} size={18} motion="always" />
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
                                    <InlineLoader size="sm" />
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