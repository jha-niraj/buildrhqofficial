"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    ChevronRight, Wallet, Lock, Infinity as Infit, Server
} from "lucide-react"
import { Switch } from "@repo/ui/components/ui/switch"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { PricingBento } from "@repo/ui/components/pricing-bento"
import { checkoutUrl } from "@repo/pricing"
import { APP_URL } from "@/lib/site"

const securityFeatures = [
    {
        icon: Lock,
        title: "Encrypted Transactions",
        desc: "AES-256 encryption for all payment data."
    },
    {
        icon: Infit,
        title: "Perpetual Credits",
        desc: "Credits never expire. Your balance is yours forever."
    },
    {
        icon: Server,
        title: "Instant Provisioning",
        desc: "Compute resources allocated immediately upon payment."
    }
]

export default function PricingSection() {
    const [currency, setCurrency] = useState<"INR" | "USD">("INR")

    return (
        <section id="pricing" className="py-24 w-full bg-white dark:bg-neutral-950 relative border-t border-neutral-100 dark:border-neutral-800">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium text-sm mb-6">
                        <Wallet className="w-3.5 h-3.5 mr-2" />
                        Flexible Compute
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                        Pay for <span className="text-neutral-500 dark:text-neutral-400">execution.</span>
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-8">
                        We don&apos;t charge for idle time. Purchase credits and only spend them when you run our specialized agents or take certifications.
                    </p>
                    <div className="flex justify-center items-center gap-4 p-2 pl-4 pr-2 bg-neutral-100 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 w-fit mx-auto">
                        <span className={`text-sm font-bold font-mono transition-colors ${currency === "INR" ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                            INR
                        </span>
                        <Switch
                            checked={currency === "USD"}
                            onCheckedChange={() => setCurrency(currency === "INR" ? "USD" : "INR")}
                            className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-white"
                        />
                        <span className={`text-sm font-bold font-mono transition-colors ${currency === "USD" ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                            USD
                        </span>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-20"
                >
                    <PricingBento
                        currency={currency}
                        hrefFor={(pkg) => checkoutUrl(APP_URL, pkg, currency)}
                        showFreeCredits
                        freeCreditsHref={`${APP_URL}/purchase`}
                    />
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                    {
                        securityFeatures.map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-start p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                            >
                                <feat.icon className="w-6 h-6 text-neutral-900 dark:text-white mb-4" />
                                <h3 className="font-bold text-neutral-900 dark:text-white mb-2">{feat.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))
                    }
                </div>
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-neutral-900 dark:bg-white border border-neutral-800 dark:border-neutral-200 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4 text-white dark:text-neutral-900">Need High-Volume Compute?</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                            For universities and bootcamps requiring bulk credit allocation and dedicated API throughput.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 bg-white text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 rounded-full font-semibold"
                        >
                            <Link href="/aboutus#contact">
                                Contact Sales
                                <ChevronRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}