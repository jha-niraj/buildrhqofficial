'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import {
    Check, FolderOpen, X
} from 'lucide-react'
import { assignGoalToGroup } from '@/actions/(main)/pathfinder'
import { cn } from '@repo/ui/lib/utils'
import toast from '@repo/ui/components/ui/sonner'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { GroupIcon } from './group-icon'

interface Group {
    id: string
    name: string
    emoji: string | null
    color: string | null
    _count?: { goals: number }
}

interface AssignGoalSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    goalId: string | null
    groups: Group[]
    onAssign?: (goalId: string, groupId: string | null) => void
}

export function AssignGoalSheet({ open, onOpenChange, goalId, groups, onAssign }: AssignGoalSheetProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleAssign = async () => {
        if (!goalId) return

        setIsLoading(true)

        try {
            const result = await assignGoalToGroup(goalId, selectedGroupId)

            if (result.success) {
                toast.success(selectedGroupId ? 'Goal moved to group' : 'Goal removed from group')
                onAssign?.(goalId, selectedGroupId)
                onOpenChange(false)
                setSelectedGroupId(null)
            } else {
                toast.error(result.error || 'Failed to move goal')
            }
        } catch {
            toast.error('Failed to move goal')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveFromGroup = async () => {
        if (!goalId) return

        setIsLoading(true)

        try {
            const result = await assignGoalToGroup(goalId, null)

            if (result.success) {
                toast.success('Goal removed from group')
                onAssign?.(goalId, null)
                onOpenChange(false)
                setSelectedGroupId(null)
            } else {
                toast.error(result.error || 'Failed to remove from group')
            }
        } catch {
            toast.error('Failed to remove from group')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen)
            if (!isOpen) setSelectedGroupId(null)
        }}>
            <SheetContent side="right" className="w-full sm:max-w-lg">
                <div className="max-w-md mx-auto">
                    <SheetHeader className="text-center mb-6">
                        <div className="w-11 h-11 mx-auto rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <FolderOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <SheetTitle className="text-lg">Move to Group</SheetTitle>
                        <SheetDescription className="text-sm">
                            Select a group or remove from current group
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            {
                                groups.length === 0 ? (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                                        No groups created yet
                                    </p>
                                ) : (
                                    groups.map((group) => (
                                        <button
                                            key={group.id}
                                            onClick={() => setSelectedGroupId(group.id === selectedGroupId ? null : group.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                                selectedGroupId === group.id
                                                    ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                                                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                                            )}
                                        >
                                            <div
                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-900 dark:text-neutral-100"
                                                style={{ backgroundColor: `${group.color || '#525252'}20` }}
                                            >
                                                <GroupIcon value={group.emoji} size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {group.name}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {group._count?.goals || 0} goals
                                                </div>
                                            </div>
                                            {
                                                selectedGroupId === group.id && (
                                                    <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                )
                                            }
                                        </button>
                                    ))
                                )
                            }
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleRemoveFromGroup}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                <X className="w-4 h-4 mr-1.5" />
                                Remove
                            </Button>
                            <Button
                                onClick={handleAssign}
                                disabled={isLoading || !selectedGroupId}
                                className="flex-1"
                            >
                                {
                                    isLoading ? (
                                        <InlineLoader size="sm" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-1.5" />
                                            Move
                                        </>
                                    )
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}