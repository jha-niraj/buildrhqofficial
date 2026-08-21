'use client'

import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import StudioFlashcardBlock from '@/components/studio/blocks/flashcard-block'
import type { SubGoalResources } from '@/app/store/pathfinderStore'

interface PathfinderFlashcardsTabProps {
    subGoalId: string
    subGoalTitle: string
    aiResources: SubGoalResources | null | undefined
}

export function PathfinderFlashcardsTab({
    subGoalId,
    subGoalTitle,
    aiResources,
}: PathfinderFlashcardsTabProps) {
    const flashcards = aiResources?.flashcards ?? []

    return (
        <ScrollArea className="h-full">
            <div className="p-4">
                {flashcards.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <p className="text-sm">No flashcards for this topic yet</p>
                    </div>
                ) : (
                    <StudioFlashcardBlock
                        deck={{
                            id: subGoalId,
                            title: subGoalTitle,
                            cards: flashcards,
                        }}
                        skipSave
                    />
                )}
            </div>
        </ScrollArea>
    )
}
