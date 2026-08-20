import {
    BrainCircuit, Code2, GraduationCap, BarChart3, GitMerge, FileCode, ArrowRight
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button';
import Link from 'next/link';
import { Reveal } from "@/components/reveal"

// Every line here is checked against a route in apps/main. Three claims were removed
// on 2026-08-20 because nothing implemented them: adaptive difficulty, coding-velocity
// analytics, and "execute in the browser" (the executor is a server-side container).
// If a claim goes in, find the code first - see plan/web/polish/01-content-truth.md.
const features = [
    {
        icon: BrainCircuit,
        title: "Pattern-First Practice",
        description: "DSA, system design, frontend and backend sets organised by pattern, with hints that nudge instead of hand over the answer."
    },
    {
        icon: Code2,
        title: "Real Linux Sandbox",
        description: "Your code runs in an actual Linux container - JavaScript, TypeScript, Python, Java, C and C++ - not a browser emulator."
    },
    {
        icon: BarChart3,
        title: "Progress You Can See",
        description: "Solved counts, streaks and XP across every track, so you know what you have actually covered."
    },
    {
        icon: GitMerge,
        title: "AI Mock Interviews",
        description: "Real-time voice interviews with an AI interviewer and instant, detailed feedback on your answers."
    },
    {
        icon: GraduationCap,
        title: "Job Matching",
        description: "Add your resume and links, and get matched to roles that actually fit your skills and experience."
    },
    {
        icon: FileCode,
        title: "Project Portfolio",
        description: "Build full-stack applications with guided specs, not just copy-paste tutorials."
    }
]

export default function FeaturesSection() {
    return (
        <section className="py-24 w-full bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6">
                <Reveal
                        className="text-center mb-16"
                    >
                    <h2 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
                        The Full Stack.
                    </h2>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-light">
                        A complete ecosystem designed to take you from &quot;Hello World&quot; to Senior Engineer.
                    </p>
                </Reveal>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {
                        features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Reveal
                        key={index}
                        className="group p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-300"
                    >
                                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-6 text-neutral-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </Reveal>
                            )
                        })
                    }
                </div>
                <div className="mt-12 text-center">
                    <Link href="/blogs">
                        <Button variant="ghost" className="cursor-pointer text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            Explore Technical Resources <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}