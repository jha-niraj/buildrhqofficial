'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { motion } from 'framer-motion'
import {
    Coins, CheckCircle2
} from 'lucide-react'
import {
    PATHFINDER_CATEGORIES, type CategoryConfig
} from '@/types/pathfinder'
import type { PathfinderCategory } from '@repo/db'
import { cn } from '@repo/ui/lib/utils'
import { EmptyState } from '../../_components/pathfinder-dashboard'
import { usePathfinderStore, type PathfinderGoal, type PathfinderGroup } from '@/app/store/pathfinderStore'
import { CreateGoalSheet } from '../../_components/create-goal-sheet'

interface GoalUser {
    id: string
    name: string | null
    username: string | null
    image: string | null
}

interface Goal {
    id: string
    title: string
    slug: string
    category: PathfinderCategory
    level: string
    overview: string | null
    totalSubGoals: number
    completedSubGoals: number
    creditPrice: number | null
    createdAt: Date
    user: GoalUser
}

interface ExploreSidebarProps {
    goals: Goal[]
}

export function ExploreSidebar({ goals }: ExploreSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const segments = pathname.split('/explore/')[1]
    const selectedSlug = segments ? segments.split('/')[0] : null

    const {
        groups: userGroups,
        setCreateSheetOpen,
        createSheetOpen,
        addGroup
    } = usePathfinderStore()

    const handleGoalCreated = (goalId: string, newGoal?: Partial<PathfinderGoal>) => {
        setCreateSheetOpen(false)
        const slug = newGoal?.slug ?? goalId
        router.push(`/pathfinder/${slug}`)
    }

    const handleGroupCreated = (newGroup: PathfinderGroup) => {
        addGroup(newGroup)
    }

    return (
        <div className="w-[320px] lg:w-[360px] shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950">
            {/* `reflow` + `min-w-0` - this is the shrink-to-fit trap from
                docs/responsiveness.md, and it is why the goal cards overflowed the
                panel with their titles cut off rather than ellipsised.

                Radix wraps a ScrollArea's viewport children in a
                `min-width:100%; display:table` box, and `display:table` sizes to
                its content's MAX-CONTENT width. A long goal title therefore made
                the card row wider than the 320px panel, the viewport clipped the
                overflow instead of scrolling it, and the `truncate` on the title
                never engaged - because there was nothing bounding it to truncate
                against. The fix is on the scroller, not on the title. */}
            <ScrollArea reflow className="min-h-0 min-w-0 flex-1">
                <div className="min-w-0 p-3 space-y-2">
                    {
                        goals.map((goal) => {
                            const category = PATHFINDER_CATEGORIES[goal.category]
                            const isSelected = selectedSlug === goal.slug
                            return (
                                <ExploreGoalCard
                                    key={goal.id}
                                    goal={goal}
                                    category={category}
                                    isSelected={!!isSelected}
                                />
                            )
                        })
                    }
                    {
                        goals.length === 0 && (
                            <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                No public goals yet. Be the first to share!
                                <EmptyState onCreateGoal={() => setCreateSheetOpen(true)} />
                            </div>
                        )
                    }
                </div>
            </ScrollArea>

            <CreateGoalSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
                onSuccess={handleGoalCreated}
                groups={userGroups}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    )
}

function ExploreGoalCard({
    goal,
    category,
    isSelected,
}: {
    goal: Goal
    category: CategoryConfig | undefined
    isSelected: boolean
}) {
    return (
        <Link
            href={`/pathfinder/explore/${goal.slug}`}
            className="block"
        >
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    p-3 rounded-xl border transition-all cursor-pointer group
                    ${isSelected
                        ? 'border-neutral-900 bg-neutral-50 dark:bg-neutral-900/30 dark:border-neutral-300'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                    }
                `}
            >
                <div className="flex gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
                        category?.bg ?? "bg-neutral-200 dark:bg-neutral-700"
                    )}>
                        {category?.emoji ?? "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "text-sm font-medium truncate",
                            // `dark:text-neutral-100` when selected, not `-800`.
                            // The selected card's dark background is
                            // `dark:bg-neutral-900/30`, so `dark:text-neutral-800`
                            // put near-black ink on a near-black surface - the
                            // title of the SELECTED goal was the one you could not
                            // read, which is the opposite of what selection means.
                            isSelected ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-900 dark:text-white"
                        )}>
                            {goal.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                            by {goal.user?.name || goal.user?.username || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                            <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                <CheckCircle2 className="w-3 h-3" />
                                {goal.completedSubGoals}/{goal.totalSubGoals} tasks
                            </span>
                            {
                                goal.creditPrice != null && goal.creditPrice > 0 && (
                                    <span className="flex items-center gap-1 text-neutral-800 dark:text-neutral-100">
                                        <Coins className="w-3 h-3" />
                                        {goal.creditPrice} cred
                                    </span>
                                )
                            }
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}