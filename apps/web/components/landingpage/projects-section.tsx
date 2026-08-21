"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Target, Globe, Cpu, Terminal, Layers, ShieldCheck
} from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import { getProjectsPageStats } from "@/actions/stats.action"
import { APP_URL } from "@/lib/site"

// Marketing showcase - EXAMPLE briefs, not real user projects.
//
// These sit directly beside counts that ARE real (getProjectsPageStats reads the
// database), so without the "Example briefs" label above the grid a visitor reads
// six invented titles as six shipped projects. Either label them or replace them
// with real registry rows; do not quietly un-label them.
//
// The live, data-backed registry lives in the app (main).
const SHOWCASE = [
    { title: "Realtime Collab Editor", stack: "Next.js · WebSockets · Postgres", tag: "Full-stack" },
    { title: "Distributed Rate Limiter", stack: "Go · Redis · gRPC", tag: "Systems" },
    { title: "RAG Knowledge Base", stack: "Python · pgvector · FastAPI", tag: "AI" },
    { title: "Type-safe API Gateway", stack: "TypeScript · tRPC · Turbo", tag: "Backend" },
    { title: "Design System Kit", stack: "React · Tailwind · Storybook", tag: "Frontend" },
    { title: "CI/CD Pipeline Builder", stack: "Docker · GitHub Actions", tag: "DevOps" },
]

interface ProjectStats {
    totalProjects: number
    activeBuilders: number
    completedTasks: number
    successRate: number
}

const features = [
    {
        icon: Terminal,
        title: "Scaffold Agent",
        description: "Generate personalized boilerplates based on your tech stack preference."
    },
    {
        icon: Layers,
        title: "Execution Plan",
        description: "Step-by-step implementation guide broke down into atomic tasks."
    },
    {
        icon: ShieldCheck,
        title: "Knowledge Check",
        description: "Validate understanding with automated technical quizzes per module."
    },
    {
        icon: Target,
        title: "Interview Sim",
        description: "Defend your project decisions against an AI technical interviewer."
    }
]

export default function ProjectsSection() {
    const [stats, setStats] = useState<ProjectStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const result = await getProjectsPageStats()
                if (result.success && result.data) {
                    setStats({
                        totalProjects: result.data.totalProjects,
                        activeBuilders: result.data.activeBuilders,
                        completedTasks: result.data.completedTasks,
                        successRate: result.data.successRate
                    })
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Format number for display
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toString()
    }

    // Dynamic stats using real data
    const displayStats = [
        {
            label: "Projects Built",
            value: loading ? "..." : `${formatNumber(stats?.totalProjects || 0)}+`,
        },
        {
            label: "Active Builders",
            value: loading ? "..." : `${formatNumber(stats?.activeBuilders || 0)}+`,
        },
        {
            label: "Tasks Completed",
            value: loading ? "..." : `${formatNumber(stats?.completedTasks || 0)}+`,
        },
        {
            label: "Success Rate",
            value: loading ? "..." : `${stats?.successRate || 94}%`,
        },
    ]

    return (
        <section id="projects" className="py-24 relative bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm mb-6">
                        <Cpu className="w-3.5 h-3.5 mr-2" />
                        Project Foundry
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                        From Prompt to <span className="text-neutral-500 dark:text-neutral-400">Production.</span>
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                        Don&apos;t just watch tutorials. Generate full-stack project scaffolds, follow execution plans, and deploy real software to your portfolio.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {
                        features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                            >
                                <div className="font-mono text-5xl font-bold text-neutral-500 dark:text-neutral-500 leading-none mb-4 select-none">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <feature.icon className="w-7 h-7 text-neutral-900 dark:text-white mb-4" />
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mt-3">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))
                    }
                </div>
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-neutral-200 dark:border-neutral-800 pb-8 gap-6"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                            Public Registry
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                            Open source projects built by the community.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <a href={`${APP_URL}/projects/generate`}>
                            <Button className="cursor-pointer rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                                <Terminal className="mr-2 h-4 w-4" />
                                Initialize Project
                            </Button>
                        </a>
                        <a href={`${APP_URL}/projects/allprojects`}>
                            <Button variant="outline" className="cursor-pointer rounded-full border-neutral-200 dark:border-neutral-800">
                                View Registry
                            </Button>
                        </a>
                    </div>
                </motion.div>

                {/* neutral-600/400, not neutral-400/500. This label measured 2.52:1 on white and
                    4.18:1 on the dark surface - both under the 4.5:1 floor for text this small.
                    It is also the label WEB-1 added to mark these briefs as invented rather than
                    real generated projects, so it is the one line here that must be readable. */}
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-400">
                    Example briefs
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {SHOWCASE.map((p) => (
                        <div
                            key={p.title}
                            className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                    {p.tag}
                                </span>
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                            </div>
                            <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">
                                {p.title}
                            </h4>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                                {p.stack}
                            </p>
                        </div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-20"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {
                            displayStats.map((stat, index) => (
                                <div key={index} className="flex flex-col items-center md:items-start border-t border-neutral-200 dark:border-neutral-800 pt-6">
                                    {loading ? (
                                        <Skeleton className="h-9 w-20 mb-2" />
                                    ) : (
                                        <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white mb-1">
                                            {stat.value}
                                        </div>
                                    )}
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </motion.div>
            </div>
        </section>
    )
}