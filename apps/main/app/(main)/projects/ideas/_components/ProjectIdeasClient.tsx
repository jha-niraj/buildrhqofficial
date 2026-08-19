"use client"

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Lightbulb, Sparkles, Layers, Target, CheckCircle2, Heart,
    Eye, Code2, Search, Filter, Crown, Users, Clock, ChevronRight,
    Zap, BookOpen, Play, MessageSquare
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Input } from '@repo/ui/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@repo/ui/components/ui/sheet'
import {
    getProblemStatements
} from '@/actions/(main)/projects/project-ideas.action'
import {
    getProjectCategories, getPlatformProjects
} from '@/actions/(main)/projects/categories.action'
import toast from '@repo/ui/components/ui/sonner'
import ProjectGenerateSheet from '@/components/projects/project-generate-sheet'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { cn } from '@repo/ui/lib/utils'
import { CommentThread } from '@/components/comments'

// Dynamic Lucide icon map (for DB-driven icons)
import * as LucideIcons from 'lucide-react'

function DynamicIcon({ name, className }: { name: string; className?: string }) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]
    if (!Icon) return <Layers className={className} />
    return <Icon className={className} />
}

interface DBCategory {
    id: string; slug: string; name: string; description: string;
    icon: string; color: string; orderIndex: number;
    technologies: DBTechnology[]
}

interface DBTechnology {
    id: string; slug: string; name: string; description: string;
    icon: string; color: string; learningOutcomes: string[];
    projectCount: number; orderIndex: number; categoryId: string;
}

interface PlatformProject {
    id: string; slug: string; title: string; shortDescription: string | null;
    description: string; technologies: string[]; difficulty: string;
    estimatedHours: number; totalViews: number; totalStarted: number;
    includeAssessment: boolean; isPlatformSeeded: boolean; projectSource: string;
    recruiterSignal: string | null; generationType: string; guidedModeEnabled: boolean;
    creator: { name: string | null; username: string | null; image: string | null };
    _count: { progress: number; submissions: number };
}

interface ProblemStatement {
    id: string; projectTitle: string; projectDescription: string;
    difficulty: string; overview: string | null; coreRequirements: string[];
    engineeringConstraints: string[]; suggestedStacks: Record<string, string[]> | null;
    recruiterSignal: string | null; views: number; buildCount: number;
    commentCount: number;
    createdAt: Date; submittedBy?: { id: string; name: string | null; username: string | null; image: string | null } | null;
}

export default function ProjectIdeasPage() {
    const [activeView, setActiveView] = useState<'categories' | 'problems'>('categories')

    // DB-driven data
    const [dbCategories, setDbCategories] = useState<DBCategory[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<DBCategory | null>(null)
    const [selectedTech, setSelectedTech] = useState<DBTechnology | null>(null)

    // Platform projects
    const [platformProjects, setPlatformProjects] = useState<PlatformProject[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)

    // Problem statements
    const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([])
    const [loadingProblems, setLoadingProblems] = useState(false)
    const [problemSearch, setProblemSearch] = useState('')
    const [problemDifficulty, setProblemDifficulty] = useState('all')

    // Problem detail sheet
    const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null)
    const [problemDetailOpen, setProblemDetailOpen] = useState(false)
    // Mirrors selectedProblem.id so handleCommentCountChange can stay memoised
    // without capturing a stale id in its closure.
    const selectedProblemIdRef = useRef<string | null>(null)
    selectedProblemIdRef.current = selectedProblem?.id ?? null

    // Generate sheet
    const [generateSheetOpen, setGenerateSheetOpen] = useState(false)
    const [generateDefaults, setGenerateDefaults] = useState<{ title?: string; description?: string }>({})

    // Fetch categories from DB
    useEffect(() => {
        async function load() {
            setLoadingCategories(true)
            const result = await getProjectCategories()
            if (result.success && result.data) {
                setDbCategories(result.data as DBCategory[])
                if (result.data.length > 0) {
                    setSelectedCategory(result.data[0] as DBCategory)
                }
            }
            setLoadingCategories(false)
        }
        load()
    }, [])

    // Fetch platform projects when category/tech changes
    useEffect(() => {
        if (!selectedCategory) return
        async function loadProjects() {
            setLoadingProjects(true)
            const techFilter = selectedTech?.name
            const result = await getPlatformProjects({
                technology: techFilter,
                limit: 20,
            })
            if (result.success && result.data) {
                setPlatformProjects(result.data as PlatformProject[])
            }
            setLoadingProjects(false)
        }
        loadProjects()
    }, [selectedCategory, selectedTech])

    const fetchProblemStatements = useCallback(async () => {
        setLoadingProblems(true)
        try {
            const result = await getProblemStatements({ difficulty: problemDifficulty, search: problemSearch })
            if (result.success && result.data) {
                setProblemStatements(result.data as ProblemStatement[])
            }
        } catch {
            toast.error('Failed to load problem statements')
        } finally {
            setLoadingProblems(false)
        }
    }, [problemDifficulty, problemSearch])

    useEffect(() => {
        if (activeView === 'problems') fetchProblemStatements()
    }, [activeView, fetchProblemStatements])

    // Comments mutate the denormalised counter server-side; mirror it locally so
    // the card badge behind the sheet updates without a refetch.
    const handleCommentCountChange = useCallback((commentCount: number) => {
        setSelectedProblem(prev => (prev ? { ...prev, commentCount } : prev))
        setProblemStatements(prev => prev.map(p =>
            p.id === selectedProblemIdRef.current ? { ...p, commentCount } : p
        ))
    }, [])

    const handleStartBuilding = (problem: ProblemStatement) => {
        setProblemDetailOpen(false)
        setGenerateDefaults({ title: problem.projectTitle, description: problem.overview || problem.projectDescription })
        setTimeout(() => setGenerateSheetOpen(true), 200)
    }

    const getDifficultyColor = (d: string) => {
        switch (d) {
            case 'BEGINNER': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100'
            case 'INTERMEDIATE': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100'
            case 'ADVANCED': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
            default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
        }
    }

    return (
        <div className="font-sans">
            <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Project Ideas</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                                <button
                                    onClick={() => setActiveView('categories')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                        activeView === 'categories'
                                            ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                                    )}
                                >
                                    <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                                    By Technology
                                </button>
                                <button
                                    onClick={() => setActiveView('problems')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                        activeView === 'problems'
                                            ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                                    )}
                                >
                                    <Target className="w-3.5 h-3.5 inline mr-1.5" />
                                    Problem First
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeView === 'categories' ? (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <div className="flex min-h-[calc(100vh-4rem)]">
                            {/* LEFT SIDEBAR - Categories */}
                            <aside className="w-64 lg:w-72 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex-shrink-0 hidden md:block overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
                                <div className="p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 px-2">
                                        Categories
                                    </p>
                                    {loadingCategories ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Skeleton key={i} className="h-12 rounded-lg" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {dbCategories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setSelectedCategory(cat); setSelectedTech(null) }}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                                                        selectedCategory?.id === cat.id
                                                            ? "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
                                                            : "hover:bg-white/60 dark:hover:bg-neutral-800/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0 transition-transform group-hover:scale-105",
                                                        cat.color
                                                    )}>
                                                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm font-medium truncate",
                                                            selectedCategory?.id === cat.id
                                                                ? "text-neutral-900 dark:text-white"
                                                                : "text-neutral-600 dark:text-neutral-400"
                                                        )}>
                                                            {cat.name}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                            {cat.technologies.length} technologies
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "w-3.5 h-3.5 flex-shrink-0 transition-transform",
                                                        selectedCategory?.id === cat.id
                                                            ? "text-neutral-900 dark:text-white rotate-90"
                                                            : "text-neutral-300 dark:text-neutral-600"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </aside>

                            {/* MAIN CONTENT - Right side */}
                            <main className="flex-1 overflow-y-auto">
                                {/* Mobile category selector */}
                                <div className="md:hidden p-4 border-b border-neutral-200 dark:border-neutral-800">
                                    <Select
                                        value={selectedCategory?.slug || ''}
                                        onValueChange={(slug) => {
                                            const cat = dbCategories.find(c => c.slug === slug)
                                            if (cat) { setSelectedCategory(cat); setSelectedTech(null) }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dbCategories.map(cat => (
                                                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedCategory && (
                                    <div className="p-4 md:p-6">
                                        {/* Category Header */}
                                        <div className="mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white", selectedCategory.color)}>
                                                    <DynamicIcon name={selectedCategory.icon} className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedCategory.name}</h2>
                                                    <p className="text-sm text-neutral-500">{selectedCategory.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Technology Pills */}
                                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                            <button
                                                onClick={() => setSelectedTech(null)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                                    !selectedTech
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                                                        : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                                                )}
                                            >
                                                All
                                            </button>
                                            {selectedCategory.technologies.map(tech => (
                                                <button
                                                    key={tech.id}
                                                    onClick={() => setSelectedTech(selectedTech?.id === tech.id ? null : tech)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5",
                                                        selectedTech?.id === tech.id
                                                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                                                            : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                                                    )}
                                                >
                                                    <span>{tech.icon}</span>
                                                    {tech.name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selected Tech Learning Outcomes */}
                                        {selectedTech && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-900/20 dark:to-neutral-900/20 border border-neutral-100 dark:border-neutral-800/30"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BookOpen className="w-4 h-4 text-neutral-800 dark:text-neutral-100" />
                                                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">What you&apos;ll learn with {selectedTech.name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedTech.learningOutcomes.map((outcome, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-100">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {outcome}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Platform Curated Projects Section */}
                                        <div className="mb-8">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Crown className="w-4 h-4 text-neutral-900" />
                                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">ShipItHQ Curated Projects</h3>
                                                <Badge className="bg-gradient-to-r from-neutral-100 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-800/30 text-neutral-800 dark:text-neutral-100 text-[10px] border-0">
                                                    Ready to Start
                                                </Badge>
                                            </div>

                                            {loadingProjects ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <Skeleton key={i} className="h-48 rounded-xl" />
                                                    ))}
                                                </div>
                                            ) : platformProjects.length === 0 ? (
                                                <div className="text-center py-12 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                                    <Zap className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                                                    <p className="text-sm text-neutral-500">No curated projects for this selection yet.</p>
                                                    <p className="text-xs text-neutral-400 mt-1">Try selecting a different technology or check back soon!</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {platformProjects.map((project, index) => (
                                                        <motion.div
                                                            key={project.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <Link href={`/projects/${project.slug}`}>
                                                                <div className="group relative bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg transition-all duration-300 cursor-pointer">
                                                                    {/* ShipItHQ Badge */}
                                                                    <div className="absolute top-3 right-3">
                                                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-900/40 dark:to-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                                                                            <Crown className="w-3 h-3 text-neutral-900" />
                                                                            <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-100">ShipItHQ</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-start gap-2 mb-3">
                                                                        <Badge className={cn(getDifficultyColor(project.difficulty), "text-[10px]")}>
                                                                            {project.difficulty}
                                                                        </Badge>
                                                                        {project.guidedModeEnabled && (
                                                                            <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-[10px] border-0">
                                                                                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                                                                AI Guided
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors line-clamp-1 pr-20">
                                                                        {project.title}
                                                                    </h4>

                                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">
                                                                        {project.shortDescription || project.description}
                                                                    </p>

                                                                    {/* Tech Tags */}
                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {project.technologies.slice(0, 4).map(tech => (
                                                                            <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                                                                {tech}
                                                                            </span>
                                                                        ))}
                                                                        {project.technologies.length > 4 && (
                                                                            <span className="text-[10px] text-neutral-400">+{project.technologies.length - 4}</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Recruiter Signal */}
                                                                    {project.recruiterSignal && (
                                                                        <div className="mb-3 p-2 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-800/30">
                                                                            <p className="text-[10px] text-neutral-800 dark:text-neutral-100 line-clamp-1">
                                                                                📡 {project.recruiterSignal}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Stats row */}
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.estimatedHours}h</span>
                                                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project._count.progress} enrolled</span>
                                                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.totalViews}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-xs font-medium text-neutral-800 dark:text-neutral-100 group-hover:translate-x-0.5 transition-transform">
                                                                            <Play className="w-3 h-3" />
                                                                            Start
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Community Ideas (from the technology) */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Users className="w-4 h-4 text-neutral-900" />
                                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Community Ideas</h3>
                                                <Badge className="bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100 text-[10px] border-0">
                                                    User Submitted
                                                </Badge>
                                            </div>
                                            <div className="text-center py-8 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                                <Target className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                                                <p className="text-sm text-neutral-500">No ideas for this technology yet.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </main>
                        </div>
                    </motion.div>
                ) : (
                    /* PROBLEM FIRST VIEW */
                    <motion.div
                        key="problems"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-[1400px] mx-auto p-4 md:p-6"
                    >
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    placeholder="Search problem statements..."
                                    value={problemSearch}
                                    onChange={(e) => setProblemSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchProblemStatements()}
                                    className="pl-10 h-10 rounded-lg"
                                />
                            </div>
                            <Select value={problemDifficulty} onValueChange={setProblemDifficulty}>
                                <SelectTrigger className="w-full sm:w-44 h-10 rounded-lg">
                                    <Filter className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {loadingProblems ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
                            </div>
                        ) : problemStatements.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                                <Target className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                                <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">No problem statements found</h3>
                                <p className="text-sm text-neutral-500">Nothing here yet - check back soon.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {problemStatements.map((problem, index) => (
                                    <motion.div
                                        key={problem.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="group bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all hover:-translate-y-0.5 flex flex-col"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{problem.views || 0}</span>
                                                
                                                {/* Reads the denormalised counter - no join per card. */}
                                                <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{problem.commentCount || 0}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors">
                                            {problem.projectTitle}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mb-3 line-clamp-2 flex-grow">
                                            {problem.overview || problem.projectDescription}
                                        </p>
                                        {problem.coreRequirements?.slice(0, 2).map((req, i) => (
                                            <div key={i} className="flex items-center gap-1 text-[10px] text-neutral-500 mb-1">
                                                <CheckCircle2 className="w-3 h-3 text-neutral-900" />
                                                <span className="truncate">{req}</span>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedProblem(problem); setProblemDetailOpen(true) }}>
                                                Details
                                            </Button>
                                            <Button size="sm" onClick={() => handleStartBuilding(problem)} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Build
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Problem Detail Sheet */}
            <Sheet open={problemDetailOpen} onOpenChange={setProblemDetailOpen}>
                <SheetContent side="bottom" className="h-[80vh] w-full overflow-y-auto">
                    {selectedProblem && (
                        <section className="w-full max-w-5xl mx-auto">
                            <SheetHeader className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge className={getDifficultyColor(selectedProblem.difficulty)}>{selectedProblem.difficulty}</Badge>
                                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{selectedProblem.views || 0}</span>
                                        
                                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{selectedProblem.commentCount || 0}</span>
                                    </div>
                                </div>
                                <SheetTitle className="text-left text-2xl">{selectedProblem.projectTitle}</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">Overview</h4>
                                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{selectedProblem.overview || selectedProblem.projectDescription}</p>
                                </div>
                                {selectedProblem.recruiterSignal && (
                                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">📡 Recruiter Signal</h4>
                                        <p className="text-sm text-neutral-700 dark:text-neutral-100">{selectedProblem.recruiterSignal}</p>
                                    </div>
                                )}
                                {selectedProblem.coreRequirements?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Core Requirements</h4>
                                        <ul className="space-y-2">
                                            {selectedProblem.coreRequirements.map((req, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedProblem.engineeringConstraints?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Engineering Constraints</h4>
                                        <ul className="space-y-2">
                                            {selectedProblem.engineeringConstraints.map((c, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <Target className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{c}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedProblem.suggestedStacks && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Suggested Stacks</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(selectedProblem.suggestedStacks).map(([key, values]) => (
                                                Array.isArray(values) && values.map((v: string, i: number) => (
                                                    <Badge key={`${key}-${i}`} variant="outline" className="text-xs">{v}</Badge>
                                                ))
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Generic comment system, first consumer. The same component
                                    mounts under a project or a blog post with a different entityType. */}
                                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                    <CommentThread
                                        entityType="PROJECT_IDEA"
                                        entityId={selectedProblem.id}
                                        initialCount={selectedProblem.commentCount || 0}
                                        onCountChange={handleCommentCountChange}
                                    />
                                </div>
                            </div>
                            <SheetFooter className="mt-8">
                                <Button onClick={() => handleStartBuilding(selectedProblem)} className="w-full h-12 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                                    <Code2 className="w-4 h-4 mr-2" />
                                    Start Building This Project
                                </Button>
                            </SheetFooter>
                        </section>
                    )}
                </SheetContent>
            </Sheet>


            <ProjectGenerateSheet
                trigger={<></>}
                defaultValues={generateDefaults}
                isOpen={generateSheetOpen}
                onOpenChange={setGenerateSheetOpen}
                onSuccess={() => { setGenerateSheetOpen(false); toast.success('Project created! Redirecting...') }}
            />
        </div>
    )
}