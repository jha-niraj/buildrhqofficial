'use client'

import {
    Tabs, TabsList, TabsTrigger, TabsContent
} from '@repo/ui/components/ui/tabs'
import { Code2, CheckCircle2, StickyNote } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { PathfinderNotesTab } from './pathfinder-notes-tab'
import type { SubGoalForTabs } from './pathfinder-notes-tab'

interface SubGoalContentTabsProps {
    subGoalId: string
    subGoalTitle: string
    goalId: string
    hasCoding: boolean
    codingCompleted: boolean
    codingPassed: boolean
    studioId: string | null
    onCodingComplete: () => void
    SubGoalCodingComponent: React.ComponentType<{ subGoal: SubGoalForTabs; onComplete: () => void }>
    subGoal: SubGoalForTabs
}

export function SubGoalContentTabs({
    subGoalId,
    subGoalTitle,
    goalId,
    hasCoding,
    codingCompleted,
    codingPassed,
    studioId,
    onCodingComplete,
    SubGoalCodingComponent,
    subGoal,
}: SubGoalContentTabsProps) {
    return (
        <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden h-full">
            <TabsList className="flex-shrink-0 mx-4 mt-4 h-auto flex-wrap gap-1">
                <TabsTrigger value="notes" className="text-xs gap-1">
                    <StickyNote className="w-3 h-3" />
                    Notes
                </TabsTrigger>
                {
                    hasCoding && (
                        <TabsTrigger value="coding" className="text-xs gap-1">
                            <Code2 className="w-3 h-3" />
                            Coding
                            {
                                codingCompleted && (
                                    <CheckCircle2
                                        className={cn(
                                            'w-3 h-3',
                                            codingPassed ? 'text-neutral-900 dark:text-neutral-100' : 'text-red-500'
                                        )}
                                    />
                                )
                            }
                        </TabsTrigger>
                    )
                }
            </TabsList>

            <TabsContent value="notes" className="flex-1 overflow-hidden m-0">
                <PathfinderNotesTab
                    subGoalId={subGoalId}
                    subGoalTitle={subGoalTitle}
                    goalId={goalId}
                    studioId={studioId}
                />
            </TabsContent>

            {
                hasCoding && (
                    <TabsContent value="coding" className="flex-1 overflow-hidden m-0 p-4">
                        <SubGoalCodingComponent subGoal={subGoal} onComplete={onCodingComplete} />
                    </TabsContent>
                )
            }
        </Tabs>
    )
}
