'use client'

import { useCallback } from 'react'
import { StudioPanel } from '@/components/studio/studio-panel'
import { createOrGetStudioForSubGoal } from '@/actions/(main)/pathfinder/studio-link.action'

export interface SubGoalForTabs {
    id: string
    title: string
    aiCodingProblem: unknown
    codingCompleted: boolean
    codingPassed: boolean
}

interface PathfinderNotesTabProps {
    subGoalId: string
    subGoalTitle: string
    goalId: string
    studioId: string | null
}

export function PathfinderNotesTab({
    subGoalId,
    subGoalTitle,
    goalId: _goalId,
    studioId,
}: PathfinderNotesTabProps) {
    const createStudioAction = useCallback(
        async () => {
            const result = await createOrGetStudioForSubGoal(subGoalId, subGoalTitle)
            if (result.error) return { error: result.error }
            return { studioId: result.studioId! }
        },
        [subGoalId, subGoalTitle]
    )

    return (
        // This div had NO height at all, which is the whole reason the panel it
        // wraps reached for `h-[calc(100vh-4rem)]`: with an auto-height parent,
        // `h-full` resolves to auto, so a viewport unit was the only thing that
        // produced a number. Give it a real height and the hack is unnecessary.
        //
        // `flex-shrink-0` is also dropped: it forced the box to its content
        // height inside a flex column, which is the opposite of what is wanted.
        <div className="flex h-full min-h-0 w-full flex-col border-l border-neutral-200 dark:border-neutral-800">
            <StudioPanel
                isOpen
                onToggle={() => { }}
                context={{
                    title: `Notes: ${subGoalTitle}`,
                    description: `Study notes for ${subGoalTitle}`,
                    source: 'PATHFINDER',
                    sourceId: subGoalId,
                    topicLabel: subGoalTitle,
                }}
                isLoggedIn={true}
                width="100%"
                hideClose
                hideHeader
                initialStudioId={studioId ?? undefined}
                createStudioAction={createStudioAction}
            />
        </div>
    )
}