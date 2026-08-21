"use client";

import { motion } from "framer-motion";
import { FolderKanban, ArrowRight, Layers } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import Link from "next/link";

interface Project {
    id: string;
    project: {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        difficulty: string;
    };
}

interface ProjectsPreviewProps {
    projects: Project[];
}

const difficultyConfig: Record<string, { color: string; dot: string }> = {
    easy:   { color: "bg-neutral-900/10 text-neutral-800 dark:text-neutral-100 border-neutral-900/20", dot: "bg-neutral-900" },
    medium: { color: "bg-neutral-900/10 text-neutral-800 dark:text-neutral-100 border-neutral-900/20",         dot: "bg-neutral-900"   },
    hard:   { color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",                 dot: "bg-red-500"     },
};

export default function ProjectsPreview({ projects }: ProjectsPreviewProps) {
    const display = projects.slice(0, 4);

    return (
        <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                        <FolderKanban className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                    </div>
                    <span className="font-semibold text-sm">My Projects</span>
                </div>
                <Link href="/projects" className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    View all <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* List */}
            <div className="flex-1 flex flex-col justify-center">
                {display.length > 0 ? (
                    <div className="space-y-2">
                        {display.map((p, i) => {
                            const cfg = difficultyConfig[p.project.difficulty?.toLowerCase()] ?? difficultyConfig.medium!;
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                >
                                    <Link href={`/projects/${p.project.slug}`}>
                                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                            <span className="flex-1 text-sm font-medium truncate text-neutral-800 dark:text-neutral-200">
                                                {p.project.title}
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${cfg.color} capitalize flex-shrink-0`}>
                                                {p.project.difficulty}
                                            </Badge>
                                            <ArrowRight className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-neutral-900/10 flex items-center justify-center mx-auto">
                            <Layers className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">No active projects</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Pick a project to start building</p>
                        </div>
                        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:text-neutral-800 transition-colors">
                            Browse projects <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
