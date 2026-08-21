"use client"
import Link from "next/link";

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@repo/ui/components/ui/button"
import { Progress } from "@repo/ui/components/ui/progress"
import {
    Target, Plus, CheckCircle2
} from "lucide-react"
import { PATHFINDER_CATEGORIES } from "@/types/pathfinder"
import type { PathfinderGoalSummary } from "@/types/pathfinder"

interface PathfinderGoalsCardProps {
    goals: PathfinderGoalSummary[]
}


export default function PathfinderGoalsCard({ goals }: PathfinderGoalsCardProps) {
    const router = useRouter()
    const activeGoals = goals.filter((g) => g.status === "ACTIVE" || g.status === "VERIFICATION")
    const completedCount = goals.filter((g) => g.status === "COMPLETED").length
    const total = goals.length
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    return (
        <>
            <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col">
                <div className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                                <Target className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                            </div>
                            <span className="font-semibold text-sm">Learning Goals</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild><Link href="/pathfinder">
                            <Plus className="h-3 w-3 mr-1" />
                            New Goal
                        </Link></Button>
                    </div>
                    {
                        goals.length > 0 && (
                            <div className="mt-4 space-y-1.5">
                                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Overall progress</span>
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                        {completedCount}/{total} done
                                    </span>
                                </div>
                                <Progress value={progressPercent} className="h-1.5" />
                            </div>
                        )
                    }
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                    {
                        activeGoals.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-6 space-y-3"
                            >
                                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">No active goals</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Set a learning goal to track progress</p>
                                </div>
                                <Link href="/pathfinder" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:text-neutral-800 transition-colors">
                                    <Plus className="h-3 w-3" />
                                    Create your first goal
                                </Link>
                            </motion.div>
                        ) : (
                            <AnimatePresence>
                                {
                                    activeGoals.slice(0, 4).map((goal, index) => {
                                        const category = PATHFINDER_CATEGORIES[goal.category as keyof typeof PATHFINDER_CATEGORIES]
                                        return (
                                            <motion.div
                                                key={goal.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ delay: index * 0.06 }}
                                                className="px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                                onClick={() => router.push("/pathfinder")}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base flex-shrink-0">{category?.emoji ?? "🎯"}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate text-neutral-800 dark:text-neutral-200">{goal.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Progress value={goal.progressPercent} className="h-1 flex-1" />
                                                            <span className="text-[10px] text-neutral-400 flex-shrink-0 w-6 text-right">
                                                                {goal.progressPercent}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <CheckCircle2 className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                }
                                {
                                    activeGoals.length > 4 && (
                                        <Link href="/pathfinder" className="w-full text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 py-1.5 transition-colors">
                                            +{activeGoals.length - 4} more goals
                                        </Link>
                                    )
                                }
                            </AnimatePresence>
                        )
                    }
                </div>
            </div>
        </>
    )
}