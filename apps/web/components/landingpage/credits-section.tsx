import {
    Zap, Wallet, ArrowRight, Check, Activity
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { APP_URL } from "@/lib/site"
import { Reveal } from "@/components/reveal"

// Checked against the product on 2026-08-20. "Gain credits by merging PRs" was removed:
// the opensource tables exist in the schema but the module has no route, so there is no
// way for a user to earn that way.
const benefits = [
    { title: "No Expiration", desc: "Credits stay in your wallet forever." },
    { title: "Start With 100", desc: "Every new account gets 100 credits - no card needed." },
    { title: "Transparent Usage", desc: "See exactly how much each AI query costs." }
]

export default function CreditsSection() {
    return (
        <section className="py-24 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start">
                    <Reveal
                        className="flex-1 sticky top-24"
                    >
                        <Badge variant="outline" className="mb-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 px-4 py-1.5 rounded-full">
                            <Wallet className="w-3.5 h-3.5 mr-2" />
                            Flex Economy
                        </Badge>
                        <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight">
                            Pay for impact. <br />
                            <span className="text-neutral-500 dark:text-neutral-400">Not idle time.</span>
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                            We rejected the subscription model. Purchase <strong>Compute Credits</strong> once and spend them only when you use our high-cost AI agents or take certifications.
                        </p>
                        <div className="space-y-6">
                            {
                                benefits.map((item, i) => (
                                    <Reveal
                        key={i}
                        className="flex gap-4"
                    >
                                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{item.title}</h4>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                                        </div>
                                    </Reveal>
                                ))
                            }
                        </div>
                        <div className="mt-10 pt-10 border-t border-neutral-200 dark:border-neutral-800">
                            <a href={`${APP_URL}/purchase`}>
                                <Button size="lg" className="cursor-pointer rounded-full h-12 px-8 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                                    Top Up Wallet <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </a>
                        </div>
                    </Reveal>
                    <Reveal
                        className="flex-1 w-full max-w-md"
                    >
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 p-8">

                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-900 dark:text-white">
                                        JD
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-neutral-900 dark:text-white">John Doe</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Free Tier</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Balance</div>
                                    <div className="text-xl font-bold text-neutral-900 dark:text-white font-mono">250 CR</div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-medium mb-2">
                                        <span className="text-neutral-500 dark:text-neutral-400">Reputation (XP)</span>
                                        <span className="text-neutral-900 dark:text-white">1,250 / 2,000</span>
                                    </div>
                                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full w-[65%] bg-neutral-900 dark:bg-white rounded-full" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <Zap className="w-5 h-5 text-neutral-900 dark:text-white mb-2" />
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">12</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Simulations Run</div>
                                    </div>
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <Activity className="w-5 h-5 text-neutral-900 dark:text-white mb-2" />
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">85%</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Success Rate</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Recent Usage</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-300">System Design Agent</span>
                                        <span className="font-mono text-neutral-900 dark:text-white">-40 CR</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-300">Mock Interview</span>
                                        <span className="font-mono text-neutral-900 dark:text-white">-25 CR</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-300">PR Merge Bonus</span>
                                        <span className="font-mono text-neutral-800 dark:text-neutral-100">+100 CR</span>
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