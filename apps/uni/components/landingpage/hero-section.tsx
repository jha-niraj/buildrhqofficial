"use client"
import Link from "next/link";

import {
    GraduationCap, Users, BookOpen, TrendingUp, ArrowRight
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { motion } from "framer-motion"

export default function HeroSection() {

    return (
        <div className="relative min-h-svh w-full overflow-hidden bg-white dark:bg-neutral-950 flex flex-col items-center justify-center pt-20">
            <div className="relative z-10 w-full px-6">
                <div className="mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-8"
                    >
                        <span className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm text-[10px] font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                            University Platform // V2.0
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6"
                    >
                        Deploy Industry-Ready <br />
                        <span className="text-neutral-500 dark:text-neutral-500">
                            Curriculum Infrastructure.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
                    >
                        Equip your institution with automated coding sandboxes, AI-driven assessment engines, and direct pipelines to hiring partners.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <Button className="cursor-pointer h-12 px-8 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold transition-all hover:scale-105" asChild><Link href="/register">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Register Institution
                        </Link></Button>
                        <Button variant="outline" className="cursor-pointer h-12 px-8 rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 dark:bg-white" asChild><Link href="#how-it-works">
                            System Architecture
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link></Button>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden max-w-4xl mx-auto"
                    >
                        {
                            [
                                { label: "Students", value: "50k+", icon: Users },
                                { label: "Campuses", value: "100+", icon: GraduationCap },
                                { label: "Assignments", value: "10k+", icon: BookOpen },
                                { label: "Placements", value: "85%", icon: TrendingUp },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-neutral-950 p-6 flex flex-col items-center justify-center group hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                    <stat.icon className="w-5 h-5 text-neutral-400 mb-3 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                                    <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            ))
                        }
                    </motion.div>
                </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none" />
        </div>
    )
}