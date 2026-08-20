import {
    Trophy, Target, Timer, Code, BookOpen, Sparkles, Terminal
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { APP_LINKS, APP_URL } from "@/lib/site"
import { Reveal } from "@/components/reveal"

const features = [
    {
        icon: BookOpen,
        title: "Structured Paths",
        description: "Every project arrives as sprints and tasks with acceptance criteria, not a blank repo."
    },
    {
        icon: Terminal,
        title: "Interactive Labs",
        description: "No video fluff. Learn by deploying real code in cloud-based sandboxes."
    },
    {
        icon: Target,
        title: "Timed Simulations",
        description: "Practice under pressure with real-world constraints and deadlines."
    },
    {
        icon: Trophy,
        title: "Project Assessments",
        description: "Finish a project and answer a generated quiz on what you actually built."
    }
]

export default function AssessmentsSection() {
    return (
        <section className="py-24 relative bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <Reveal
                        className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
                    >
                    <div className="max-w-2xl">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm mb-6">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-neutral-900 dark:text-white" />
                            Learn & Prove
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
                            Mastery through <span className="text-neutral-500 dark:text-neutral-400">repetition.</span>
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
                            Theory is optional. Practice is mandatory. Validate your skills with our rigorous assessment engine.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href={APP_LINKS.signup}>
                            <Button size="lg" className="cursor-pointer rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 h-12 px-6">
                                Start Learning
                            </Button>
                        </a>
                        <a href={`${APP_URL}/practice`}>
                            <Button size="lg" variant="outline" className="cursor-pointer rounded-full border-neutral-200 dark:border-neutral-800 h-12 px-6">
                                Take Assessment
                            </Button>
                        </a>
                    </div>
                </Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {
                            features.map((feature, index) => (
                                <Reveal
                        key={index}
                        className="group p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
                    >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-4 text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </Reveal>
                            ))
                        }
                    </div>
                    <Reveal
                        className="relative"
                    >
                        <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
                            <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                    <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                    <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                                    <Code className="w-3 h-3" />
                                    <span>challenge_01.ts</span>
                                </div>
                                <div className="w-10" />
                            </div>
                            <div className="flex h-[400px]">
                                <div className="flex-1 p-6 font-mono text-sm overflow-hidden bg-neutral-50/50 dark:bg-neutral-900">
                                    <div className="text-neutral-500 dark:text-neutral-400 mb-2">Task: Optimize array traversal</div>
                                    <div className="space-y-1">
                                        <div><span className="text-neutral-800 dark:text-neutral-100">interface</span> <span className="text-neutral-900 dark:text-white">User</span> {'{'}</div>
                                        <div className="pl-4">id: <span className="text-neutral-800 dark:text-neutral-100">string</span>;</div>
                                        <div className="pl-4">score: <span className="text-neutral-800 dark:text-neutral-100">number</span>;</div>
                                        <div>{'}'}</div>
                                        <br />
                                        <div><span className="text-neutral-800 dark:text-neutral-100">function</span> <span className="text-neutral-800 dark:text-neutral-100">rankUsers</span>(users: User[]): User[] {'{'}</div>
                                        <div className="pl-4 text-neutral-500 dark:text-neutral-400">TODO: Implement quicksort here</div>
                                        <div className="pl-4"><span className="text-neutral-800 dark:text-neutral-100">return</span> users.sort((a, b) =&gt; b.score - a.score);</div>
                                        <div>{'}'}</div>
                                    </div>
                                    <div className="mt-12 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">TERMINAL</div>
                                        <div className="text-xs font-mono space-y-1">
                                            <div className="text-neutral-800 dark:text-neutral-100">➜  ~ npm run test</div>
                                            <div>&gt; running 3 tests...</div>
                                            <div className="text-neutral-800 dark:text-neutral-100">✓ large_dataset_performance (12ms)</div>
                                            <div className="text-neutral-800 dark:text-neutral-100">✓ edge_cases_empty (2ms)</div>
                                            <div className="animate-pulse">_</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-48 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 p-4 hidden sm:block">
                                    <div className="mb-6">
                                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Time Left</div>
                                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-mono font-medium">
                                            <Timer className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                            14:20
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Difficulty</div>
                                        <Badge variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800/30 dark:bg-neutral-800/20 dark:text-neutral-100">
                                            Hard
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Stats</div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-neutral-500 dark:text-neutral-400">Tests</span>
                                                <span className="text-neutral-900 dark:text-white font-medium">3/5</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-neutral-900 h-full w-[60%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}