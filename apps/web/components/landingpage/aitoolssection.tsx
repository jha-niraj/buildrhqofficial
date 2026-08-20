import {
    Briefcase, FileText, PenLine, ArrowRight, Sparkles
} from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { APP_URL } from "@/lib/site"
import { Reveal } from "@/components/reveal"

const tools = [
    {
        icon: FileText,
        title: "Resume Creator",
        description: "Build an ATS-friendly resume with AI. Sync your work, education, skills and projects from your profile and export a polished PDF.",
        status: "Live",
        href: `${APP_URL}/ai/resume`
    },
    {
        icon: Briefcase,
        title: "Interview Assistant",
        description: "Context-aware simulation that ingests your specific resume and the target job description to generate high-probability technical questions.",
        status: "Live",
        href: `${APP_URL}/ai/jobinterviewassistant`
    },
    {
        icon: PenLine,
        title: "Cover Letter",
        description: "Generate a tailored, role-specific cover letter in seconds - grounded in your profile and the job you're applying to.",
        status: "Live",
        href: `${APP_URL}/ai/resume/cover-letter`
    }
]

export default function AIToolsSection() {
    return (
        <section id="ai-tools" className="relative w-full overflow-hidden border-t border-neutral-100 bg-white py-24 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-neutral-100 dark:bg-neutral-900 blur-[100px] opacity-50" />

            <div className="max-w-7xl mx-auto px-6">
                <Reveal
                        className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
                    >
                    <div className="max-w-3xl">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm backdrop-blur-sm mb-6">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-neutral-900 dark:text-white" />
                            Intelligence Engine
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                            Tools that make you <span className="text-neutral-500 dark:text-neutral-400">dangerous.</span>
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light leading-relaxed max-w-2xl">
                            We don&apos;t build generic wrappers. We build specialized agents that help you write a standout resume, ace technical interviews, and land high-impact roles.
                        </p>
                    </div>
                    <div>
                        <Button variant="outline" asChild className="h-12 px-6 rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white dark:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:bg-white">
                            <a href={`${APP_URL}/ai`}>
                                View Full Roster <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </Button>
                    </div>
                </Reveal>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {
                        tools.map((tool, index) => (
                            <Reveal
                        key={index}
                        className="group relative h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-neutral-900/5 dark:hover:shadow-black/50 transition-all duration-500 flex flex-col justify-between"
                    >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-200 via-neutral-900 to-neutral-200 dark:from-neutral-800 dark:via-white dark:to-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                                            <tool.icon className="w-6 h-6" />
                                        </div>
                                        <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100 border-0 px-3">
                                            Live
                                        </Badge>
                                    </div>
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            {tool.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-8 pb-8 pt-0">
                                    <a href={tool.href} className="inline-flex items-center text-sm font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-1 hover:border-neutral-900 dark:hover:border-white transition-all">
                                        Launch Tool <ArrowRight className="ml-2 w-4 h-4" />
                                    </a>
                                </div>
                            </Reveal>
                        ))
                    }
                </div>
                <Reveal
                        className="mt-16 relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
                    >
                    <div className="absolute inset-0 bg-neutral-900 dark:bg-white/5"></div>
                    <div className="absolute inset-0 opacity-20" />

                    <div className="relative p-10 md:p-16 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-6">
                            <Sparkles className="w-3 h-3" />
                            <span>One Subscription</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                            Access the full <br className="hidden md:block" />Engineering Intelligence Suite
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-10 max-w-lg mx-auto leading-relaxed">
                            Stop using generic tools. Get access to the entire suite of specialized developer agents with a single plan.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" className="cursor-pointer bg-white text-neutral-900 hover:bg-neutral-100 rounded-full h-12 px-8">
                                Get Started Free
                            </Button>
                            <Button variant="outline" size="lg" className="cursor-pointer bg-transparent text-white border-white/20 hover:bg-white/10 rounded-full h-12 px-8">
                                View Pricing
                            </Button>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}