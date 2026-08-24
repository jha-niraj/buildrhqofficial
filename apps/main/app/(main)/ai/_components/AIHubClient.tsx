"use client"

import { motion } from "framer-motion"
import {
    ArrowRight, Sparkles, Users, Zap, Trophy, Briefcase,
    LayoutTemplate, ChevronRight, CheckCircle2, FileText
} from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { useRouter } from "next/navigation"

// Active tools - Job Interview Assistant & Resume Creator only
const tools = [
    {
        id: "jobinterviewassistant",
        icon: Briefcase,
        name: "Job Interview Assistant",
        description: "Context-aware simulation that ingests your specific resume and the target job description to generate high-probability technical questions.",
        features: ["Resume Parsing", "Role-Specific Scenarios", "STAR Method Feedback"],
        status: "Live",
        credits: 25,
        href: "/ai/jobinterviewassistant"
    },
    {
        id: "resumecreator",
        icon: FileText,
        name: "Resume Creator",
        description: "Build ATS-friendly resumes with AI. Sync work experience, education, skills & projects to your profile.",
        features: ["Profile Sync", "Live Preview", "ATS Optimization"],
        status: "Live",
        credits: 0,
        href: "/ai/resume"
    },
    {
        id: "coverletter",
        icon: FileText,
        name: "Cover Letter",
        description: "Build ATS-friendly resumes with AI. Sync work experience, education, skills & projects to your profile.",
        features: ["Profile Sync", "Live Preview", "ATS Optimization"],
        status: "Live",
        credits: 0,
        href: "/ai/resume/cover-letter"
    },
]

const stats = [
    { label: "Interviews Aced", value: "850", icon: Trophy, suffix: "+" },
    { label: "Systems Designed", value: "2.1K", icon: LayoutTemplate, suffix: "" },
    { label: "Active Developers", value: "10K", icon: Users, suffix: "+" },
    { label: "Uptime", value: "99.9", icon: Zap, suffix: "%" },
]

export default function AiToolsPage() {
    const router = useRouter();

    return (
        <div className="font-sans selection:bg-neutral-100 dark:selection:bg-neutral-800">

                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-neutral-900/10 opacity-50 blur-[100px] dark:bg-neutral-200/20"></div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <motion.div
                            className="flex flex-col items-center text-center space-y-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm backdrop-blur-sm">
                                    <Sparkles className="w-3.5 h-3.5 mr-2 text-neutral-900 dark:text-neutral-100" />
                                    The Coder&apos;z Intelligence Engine
                                </Badge>
                            </motion.div>
                            <motion.h1
                                className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-950 dark:text-white max-w-4xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Tools specifically engineered <br className="hidden md:block" />
                                <span className="text-neutral-400 dark:text-neutral-400">for the modern developer.</span>
                            </motion.h1>
                            <motion.p
                                className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                We don&apos;t build generic wrappers. We build specialized agents that help you architect systems, contribute to open source, and land high-impact roles.
                            </motion.p>
                            <motion.div
                                className="flex flex-wrap items-center justify-center gap-4 pt-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button size="lg" className="h-12 px-8 text-base bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 shadow-xl shadow-neutral-500/10 rounded-full transition-all duration-300">
                                    Explore Studio
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
                <section className="py-12 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            {
                                stats.map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex flex-col items-center text-center group"
                                    >
                                        <div className="mb-3 text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                            {stat.value}<span className="text-neutral-400 dark:text-neutral-400 ml-0.5 text-2xl">{stat.suffix}</span>
                                        </div>
                                        <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </section>
                <section id="studio" className="py-24 bg-neutral-50/50 dark:bg-neutral-950">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                                    Developer Studio
                                </h2>
                                <p className="text-lg text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                                    Specialized agents designed to handle the complexities of software engineering.
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tools.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    onClick={() => router.push(tool.href)}
                                    className="cursor-pointer"
                                >
                                    <div className="group relative h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-neutral-900/5 dark:hover:shadow-black/50 transition-all duration-500">
                                        <div className="p-8">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-14 h-14 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white">
                                                    <tool.icon className="w-7 h-7" />
                                                </div>
                                                <Badge className="bg-neutral-50 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-100">
                                                    {tool.status}
                                                </Badge>
                                            </div>
                                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">{tool.name}</h3>
                                            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-base mb-6">
                                                {tool.description}
                                            </p>
                                            <div className="flex items-center justify-end text-sm font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
                                                Launch <ChevronRight className="ml-1 w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="py-24 relative overflow-hidden bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-900/20"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neutral-200/50 dark:bg-neutral-800/30 rounded-full blur-[100px] pointer-events-none" />

                    <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                One subscription. <br /> Infinite possibilities.
                            </h2>
                            <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-light">
                                Access the entire suite of engineering intelligence tools with a single plan. No hidden fees.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold text-lg rounded-full"
                                >
                                    Get Started Free
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 bg-transparent text-neutral-900 dark:text-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 dark:bg-white font-semibold text-lg rounded-full"
                                >
                                    View Pricing
                                </Button>
                            </div>
                            <div className="pt-6 flex items-center justify-center gap-6 text-sm text-neutral-400 font-medium">
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" /> Cancel anytime</span>
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" /> Secure payment</span>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
    )
}