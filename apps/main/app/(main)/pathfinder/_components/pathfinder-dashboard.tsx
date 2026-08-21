'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Progress } from '@repo/ui/components/ui/progress'
import {
    Target, Plus, CheckCircle2, Trophy, Flame, FolderOpen, MoreVertical,
    MoveRight, Code2, Brain, BarChart3, Zap, ChevronRight, Play,
    PauseCircle, CheckCircle, XCircle, Compass, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import {
    PathfinderStatus, PathfinderCategory
} from '@repo/db'
import { CreateGoalSheet } from './create-goal-sheet'
import { CreateGroupSheet } from './create-group-sheet'
import { AssignGoalSheet } from './assign-goal-sheet'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@repo/ui/components/ui/dropdown-menu'
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@repo/ui/components/ui/collapsible'
// Tabs imports reserved for future use
import { cn } from '@repo/ui/lib/utils'
import {
    usePathfinderStore, type PathfinderGoal, type PathfinderGroup
} from '@/app/store/pathfinderStore'
import { PATHFINDER_CATEGORIES } from '@/types/pathfinder'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

type Goal = PathfinderGoal
type Group = PathfinderGroup

interface PathfinderDashboardProps {
    initialGoals: PathfinderGoal[]
    initialGroups: PathfinderGroup[]
}

const categoryConfig = PATHFINDER_CATEGORIES

const statusConfig: Record<PathfinderStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    ACTIVE: { label: 'Active', icon: <Play className="w-3 h-3" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
    VERIFICATION: { label: 'Verifying', icon: <Zap className="w-3 h-3" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
    COMPLETED: { label: 'Completed', icon: <CheckCircle className="w-3 h-3" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
    FAILED: { label: 'Retry', icon: <XCircle className="w-3 h-3" />, color: 'text-red-600', bg: 'bg-red-500/10' },
    ABANDONED: { label: 'Paused', icon: <PauseCircle className="w-3 h-3" />, color: 'text-neutral-600', bg: 'bg-neutral-500/10' },
}

const PIE_COLORS = ['#10b981', '#525252', '#3b82f6', '#404040', '#ec4899', '#06b6d4', '#171717', '#6366f1', '#14b8a6', '#e11d48']

function GoalCard({ goal, onAssign }: { goal: Goal; onAssign: () => void }) {
    const category = categoryConfig[goal.category]
    const status = statusConfig[goal.status]

    const progressPercent = goal.totalSubGoals > 0
        ? Math.round((goal.completedSubGoals / goal.totalSubGoals) * 100)
        : 0

    const lastActivity = goal.lastActivityAt
        ? new Date(goal.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            <Link href={`/pathfinder/${goal.slug}`}>
                <div className="p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer bg-white dark:bg-neutral-900/50 hover:shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0", category.bg)}>
                            {category.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-1 pr-6">
                                {goal.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-4 font-normal gap-1", status.bg, status.color)}>
                                    {status.icon}
                                    {status.label}
                                </Badge>
                                <span className="text-[10px] text-neutral-400 capitalize">
                                    {goal.level.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 mb-3">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-neutral-900 dark:text-neutral-100" />
                            <span>{goal.completedSubGoals}/{goal.totalSubGoals}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3 text-neutral-900 dark:text-neutral-100" />
                            <span>{goal.totalQuizAnswered}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-neutral-900 dark:text-neutral-100" />
                            <span>{goal.totalCodingSolved}</span>
                        </div>
                        {goal.streakDays > 0 && (
                            <div className="flex items-center gap-1 text-neutral-900 dark:text-neutral-100">
                                <Flame className="w-3 h-3" />
                                <span>{goal.streakDays}d</span>
                            </div>
                        )}
                        {lastActivity && (
                            <span className="text-neutral-400 ml-auto text-[10px]">{lastActivity}</span>
                        )}
                    </div>
                    <div className="relative">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-1" />
                    </div>
                </div>
            </Link>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-neutral-600">
                            <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAssign(); }}>
                            <MoveRight className="w-3.5 h-3.5 mr-2" />
                            Move to Group
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    )
}

function GroupSection({ group, goals, onAssignGoal }: { group: Group; goals: Goal[]; onAssignGoal: (goalId: string) => void }) {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors group">
                <div className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ backgroundColor: `${group.color || '#7c3aed'}20` }}>
                    {group.emoji || '📁'}
                </div>
                <span className="font-medium text-xs text-neutral-700 dark:text-neutral-300 flex-1 text-left">{group.name}</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal bg-neutral-100 dark:bg-neutral-800">{goals.length}</Badge>
                <ChevronRight className={cn("w-3.5 h-3.5 text-neutral-400 transition-transform", isOpen && "rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
                {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onAssign={() => onAssignGoal(goal.id)} />
                ))}
                {goals.length === 0 && (
                    <p className="text-xs text-neutral-400 py-3 text-center">No goals in this group</p>
                )}
            </CollapsibleContent>
        </Collapsible>
    )
}

function StatsSection({ goals }: { goals: Goal[] }) {
    const activeGoals = goals.filter(g => g.status === 'ACTIVE' || g.status === 'VERIFICATION')
    const completedGoals = goals.filter(g => g.status === 'COMPLETED')
    const totalTasks = goals.reduce((sum, g) => sum + g.totalSubGoals, 0)
    const completedTasks = goals.reduce((sum, g) => sum + g.completedSubGoals, 0)
    const totalQuiz = goals.reduce((sum, g) => sum + g.totalQuizAnswered, 0)
    const totalCoding = goals.reduce((sum, g) => sum + g.totalCodingSolved, 0)
    const maxStreak = Math.max(...goals.map(g => g.streakDays), 0)

    const stats = [
        { label: 'Active', value: activeGoals.length, icon: <Target className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
        { label: 'Done', value: completedGoals.length, icon: <Trophy className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
        { label: 'Tasks', value: `${completedTasks}/${totalTasks}`, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
        { label: 'Quiz', value: totalQuiz, icon: <Brain className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
        { label: 'Code', value: totalCoding, icon: <Code2 className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
        { label: 'Streak', value: `${maxStreak}d`, icon: <Flame className="w-4 h-4" />, color: 'text-neutral-800', bg: 'bg-neutral-900/10' },
    ]

    return (
        <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
                <div key={stat.label} className={cn("p-3 rounded-xl", stat.bg)}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className={stat.color}>{stat.icon}</div>
                        <span className="text-[10px] text-neutral-500">{stat.label}</span>
                    </div>
                    <div className={cn("text-lg font-semibold", stat.color)}>{stat.value}</div>
                </div>
            ))}
        </div>
    )
}

function ActivityChart({ goals }: { goals: Goal[] }) {
    const chartData = goals
        .filter(g => g.status === 'ACTIVE' || g.status === 'COMPLETED')
        .slice(0, 8)
        .map((g) => ({
            name: g.title.length > 12 ? g.title.slice(0, 12) + '…' : g.title,
            tasks: g.completedSubGoals,
            quiz: g.totalQuizAnswered,
            code: g.totalCodingSolved,
        }))

    if (chartData.length === 0) return null

    return (
        <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Goal Activity</h3>
            <div className="bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-3">
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} barSize={12} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={25} />
                        <RechartsTooltip
                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ fontWeight: 600 }}
                        />
                        <Bar dataKey="tasks" fill="#10b981" radius={[3, 3, 0, 0]} name="Tasks" />
                        <Bar dataKey="quiz" fill="#404040" radius={[3, 3, 0, 0]} name="Quiz" />
                        <Bar dataKey="code" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Code" />
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-neutral-500"><span className="w-2 h-2 rounded-sm bg-neutral-900" />Tasks</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-neutral-500"><span className="w-2 h-2 rounded-sm bg-neutral-900" />Quiz</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-neutral-500"><span className="w-2 h-2 rounded-sm bg-neutral-900" />Code</span>
                </div>
            </div>
        </div>
    )
}

function CategoryChart({ goals }: { goals: Goal[] }) {
    const categoryData = Object.entries(
        goals.reduce((acc, g) => {
            acc[g.category] = (acc[g.category] || 0) + 1
            return acc
        }, {} as Record<string, number>)
    ).map(([cat, count], idx) => ({
        name: cat.toLowerCase().replace('_', ' '),
        value: count,
        emoji: categoryConfig[cat as PathfinderCategory]?.emoji || '📁',
        color: PIE_COLORS[idx % PIE_COLORS.length],
    }))

    if (categoryData.length === 0) return null

    return (
        <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">By Category</h3>
            <div className="bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-3">
                <div className="flex items-center gap-4">
                    <div className="w-[120px] h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={28} strokeWidth={2}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} stroke="hsl(var(--background))" />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize flex-1 truncate">{cat.emoji} {cat.name}</span>
                                <span className="text-xs font-medium text-neutral-900 dark:text-white">{cat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProgressOverview({ goals }: { goals: Goal[] }) {
    const activeGoals = goals
        .filter(g => g.status === 'ACTIVE')
        .sort((a, b) => {
            const aP = a.totalSubGoals > 0 ? a.completedSubGoals / a.totalSubGoals : 0
            const bP = b.totalSubGoals > 0 ? b.completedSubGoals / b.totalSubGoals : 0
            return bP - aP
        })
        .slice(0, 5)

    if (activeGoals.length === 0) return null

    return (
        <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Active Progress</h3>
            <div className="space-y-2.5">
                {activeGoals.map((goal) => {
                    const pct = goal.totalSubGoals > 0 ? Math.round((goal.completedSubGoals / goal.totalSubGoals) * 100) : 0
                    const category = categoryConfig[goal.category]
                    return (
                        <Link key={goal.id} href={`/pathfinder/${goal.slug}`}>
                            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0", category.bg)}>
                                    {category.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{goal.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Progress value={pct} className="h-1 flex-1" />
                                        <span className="text-[10px] text-neutral-400 w-8 text-right">{pct}%</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

function RecentActivity({ goals }: { goals: Goal[] }) {
    const recentGoals = [...goals]
        .filter(g => g.lastActivityAt)
        .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime())
        .slice(0, 5)

    if (recentGoals.length === 0) return null

    return (
        <div>
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Recent Activity</h3>
            <div className="space-y-1">
                {recentGoals.map((goal) => {
                    const category = categoryConfig[goal.category]
                    return (
                        <Link key={goal.id} href={`/pathfinder/${goal.slug}`}>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
                                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0", category.bg)}>
                                    {category.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{goal.title}</p>
                                    <p className="text-[10px] text-neutral-400">
                                        {goal.lastActivityAt && new Date(goal.lastActivityAt).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

function OverviewContent({ goals, groups: _groups }: { goals: Goal[]; groups: Group[] }) {
    if (goals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <BarChart3 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">No stats yet</h3>
                <p className="text-xs text-neutral-400">Create your first goal to see stats here</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <StatsSection goals={goals} />
            <ActivityChart goals={goals} />
            <CategoryChart goals={goals} />
            <ProgressOverview goals={goals} />
            <RecentActivity goals={goals} />
        </div>
    )
}

export function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-neutral-400" />
            </div>
            <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">Start Your Learning Journey</h3>
            <p className="text-sm text-neutral-500 max-w-xs mb-4">Create your first learning goal and track progress with AI-powered practice.</p>
            <Button onClick={onCreateGoal} size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Goal
            </Button>
        </motion.div>
    )
}

function QuickActions({ onCreateGoal, onCreateGroup }: { onCreateGoal: () => void; onCreateGroup: () => void }) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={onCreateGoal} className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                <Target className="w-4 h-4 mr-1.5" />
                New Goal
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateGroup} className="h-8 text-xs">
                <FolderOpen className="w-4 h-4 mr-1.5" />
                New Group
            </Button>
            <Link href="/pathfinder/explore">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Compass className="w-4 h-4 mr-1.5" />
                    Explore
                </Button>
            </Link>
        </div>
    )
}

export function PathfinderDashboard({ initialGoals, initialGroups }: PathfinderDashboardProps) {
    const {
        goals, groups, initialize,
        setCreateSheetOpen, setCreateGroupSheetOpen, setAssignSheetOpen,
        createSheetOpen, createGroupSheetOpen, assignSheetOpen,
        selectedGoalId, setSelectedGoalId,
        addGoal, addGroup, assignGoalToGroup
    } = usePathfinderStore()

    const [mobileTab, setMobileTab] = useState<'goals' | 'overview'>('goals')

    useEffect(() => {
        initialize(initialGoals, initialGroups)
    }, [initialGoals, initialGroups, initialize])

    const displayGoals = goals.length > 0 ? goals : initialGoals
    const displayGroups = groups.length > 0 ? groups : initialGroups

    const ungroupedGoals = displayGoals.filter(g => !g.groupId)
    const groupedGoals = displayGroups.map(group => ({
        group,
        goals: displayGoals.filter(g => g.groupId === group.id),
    }))

    const handleGoalCreated = (goalId: string, newGoal?: Goal) => {
        setCreateSheetOpen(false)
        if (newGoal) addGoal(newGoal)
        const slug = (newGoal as { slug?: string })?.slug ?? goalId
        window.location.href = `/pathfinder/${slug}`
    }

    const handleGroupCreated = (newGroup: Group) => {
        addGroup(newGroup)
        setCreateGroupSheetOpen(false)
    }

    const handleAssignGoal = (goalId: string) => {
        setSelectedGoalId(goalId)
        setAssignSheetOpen(true)
    }

    const handleAssignComplete = (goalId: string, groupId: string | null) => {
        assignGoalToGroup(goalId, groupId)
        setAssignSheetOpen(false)
    }

    const GoalsList = () => (
        <AnimatePresence mode="wait">
            {displayGoals.length === 0 ? (
                <EmptyState onCreateGoal={() => setCreateSheetOpen(true)} />
            ) : (
                <div>
                    {groupedGoals.filter(g => g.goals.length > 0).map(({ group, goals: groupGoals }) => (
                        <GroupSection key={group.id} group={group} goals={groupGoals} onAssignGoal={handleAssignGoal} />
                    ))}
                    {groupedGoals.filter(g => g.goals.length === 0).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
                            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-2 px-2">Empty Groups</p>
                            {groupedGoals.filter(g => g.goals.length === 0).map(({ group }) => (
                                <div key={group.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-400">
                                    <span style={{ backgroundColor: `${group.color || '#7c3aed'}20` }} className="w-4 h-4 rounded flex items-center justify-center text-[10px]">
                                        {group.emoji || '📁'}
                                    </span>
                                    {group.name}
                                </div>
                            ))}
                        </div>
                    )}
                    {ungroupedGoals.length > 0 && (
                        <div className={cn(displayGroups.length > 0 && "mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50")}>
                            {displayGroups.length > 0 && (
                                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-2 px-2">
                                    Ungrouped ({ungroupedGoals.length})
                                </p>
                            )}
                            <div className="space-y-2">
                                {ungroupedGoals.map((goal) => (
                                    <GoalCard key={goal.id} goal={goal} onAssign={() => handleAssignGoal(goal.id)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AnimatePresence>
    )

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/80 backdrop-blur-sm">
                <div className="w-full mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <Target className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-neutral-900 dark:text-white">Pathfinder</h1>
                            <p className="text-xs text-neutral-500">Track your learning goals</p>
                        </div>
                    </div>
                    <QuickActions
                        onCreateGoal={() => setCreateSheetOpen(true)}
                        onCreateGroup={() => setCreateGroupSheetOpen(true)}
                    />
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="lg:hidden shrink-0 px-4 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900/80">
                <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-0.5">
                    <button
                        onClick={() => setMobileTab('goals')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                            mobileTab === 'goals' ? "bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500"
                        )}
                    >
                        <Target className="w-3.5 h-3.5" /> Goals
                    </button>
                    <button
                        onClick={() => setMobileTab('overview')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                            mobileTab === 'overview' ? "bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500"
                        )}
                    >
                        <TrendingUp className="w-3.5 h-3.5" /> Overview
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full w-full mx-auto flex">
                    {/* Goals Panel - Desktop always, Mobile conditional */}
                    <div className={cn(
                        "w-full lg:w-[400px] xl:w-[440px] border-r border-neutral-200/60 dark:border-neutral-800/60 flex flex-col bg-white dark:bg-neutral-900/30",
                        mobileTab !== 'goals' && "hidden lg:flex"
                    )}>
                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                <GoalsList />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Overview Panel - Desktop always, Mobile conditional */}
                    <div className={cn(
                        "flex-1 flex flex-col",
                        mobileTab !== 'overview' && "hidden lg:flex"
                    )}>
                        <ScrollArea className="flex-1">
                            <div className="p-6">
                                <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">Overview</h2>
                                <OverviewContent goals={displayGoals} groups={displayGroups} />
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            <CreateGoalSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
                onSuccess={handleGoalCreated}
                groups={displayGroups}
                onGroupCreated={handleGroupCreated}
            />
            <CreateGroupSheet
                open={createGroupSheetOpen}
                onOpenChange={setCreateGroupSheetOpen}
                onSuccess={handleGroupCreated}
            />
            <AssignGoalSheet
                open={assignSheetOpen}
                onOpenChange={setAssignSheetOpen}
                goalId={selectedGoalId}
                groups={displayGroups}
                onAssign={handleAssignComplete}
            />
        </div>
    )
}
