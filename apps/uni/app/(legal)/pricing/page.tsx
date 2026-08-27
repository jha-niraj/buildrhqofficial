"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Check, X, Zap, Shield, Crown, GraduationCap, Users,
    ArrowRight, BookOpen
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@repo/ui/components/ui/tabs"

// Currency Configuration
const currencies = {
    INR: { symbol: "₹", rate: 83.21, label: "INR" },
    USD: { symbol: "$", rate: 1, label: "USD" }
}

type CurrencyKey = keyof typeof currencies

// University Pricing Data
const pricingData = {
    credits: {
        title: "Credit Packs",
        description: "Purchase credits for students to access premium features.",
        icon: Zap,
        tiers: [
            {
                name: "Starter Pack",
                basePrice: 99,
                suffix: "500 credits",
                description: "Perfect for small departments or trial usage.",
                icon: Zap,
                features: [
                    "500 Platform Credits",
                    "AI Assessments Access",
                    "Mock Interview Sessions",
                    "Basic Support",
                    "90 Days Validity",
                ],
                missing: ["Bulk Discount", "Priority Support", "Custom Allocation"],
            },
            {
                name: "Growth Pack",
                basePrice: 399,
                suffix: "2,500 credits",
                description: "Ideal for medium-sized institutions.",
                icon: Shield,
                popular: true,
                features: [
                    "2,500 Platform Credits",
                    "AI Assessments Access",
                    "Mock Interview Sessions",
                    "Coding Challenges",
                    "Priority Support",
                    "180 Days Validity",
                    "Department Allocation",
                ],
                missing: ["Dedicated Manager"],
            },
            {
                name: "Enterprise Pack",
                basePrice: 999,
                suffix: "10,000 credits",
                description: "Full institution deployment.",
                icon: Crown,
                features: [
                    "10,000 Platform Credits",
                    "All Premium Features",
                    "Custom Credit Allocation",
                    "Student Analytics",
                    "Dedicated Account Manager",
                    "365 Days Validity",
                    "API Access",
                ],
                missing: [],
            },
        ],
    },
    subscription: {
        title: "Annual Plans",
        description: "Unlimited access with annual subscription.",
        icon: Users,
        tiers: [
            {
                name: "Department",
                basePrice: 1999,
                suffix: "/year",
                description: "For individual departments.",
                icon: Zap,
                features: [
                    "Up to 200 Students",
                    "5 Faculty Members",
                    "Unlimited Classes",
                    "Basic Assignments",
                    "Email Support",
                    "Standard Analytics",
                ],
                missing: ["Placement Portal", "Custom Branding", "API"],
            },
            {
                name: "Institution",
                basePrice: 4999,
                suffix: "/year",
                description: "Full university deployment.",
                icon: Shield,
                popular: true,
                features: [
                    "Up to 2,000 Students",
                    "Unlimited Faculty",
                    "All Department Access",
                    "Placement Portal",
                    "Advanced Analytics",
                    "Priority Support",
                    "LMS Integration",
                ],
                missing: ["White-label"],
            },
            {
                name: "Enterprise",
                basePrice: 9999,
                suffix: "/year",
                description: "Multi-campus and large universities.",
                icon: Crown,
                features: [
                    "Unlimited Students",
                    "Unlimited Faculty",
                    "Multi-Campus Support",
                    "White-label Branding",
                    "Custom Integrations",
                    "SLA Guarantee",
                    "Dedicated Success Team",
                    "SSO & Advanced Security",
                ],
                missing: [],
            },
        ],
    },
    placements: {
        title: "Placement Services",
        description: "Connect students with top employers.",
        icon: GraduationCap,
        tiers: [
            {
                name: "Basic",
                basePrice: 499,
                suffix: "/semester",
                description: "Essential placement features.",
                icon: Zap,
                features: [
                    "Job Board Access",
                    "Company Partnerships (5)",
                    "Student Profiles",
                    "Application Tracking",
                ],
                missing: ["AI Matching", "Mock Interviews", "Analytics"],
            },
            {
                name: "Professional",
                basePrice: 1499,
                suffix: "/semester",
                description: "Comprehensive placement support.",
                icon: Shield,
                popular: true,
                features: [
                    "Job Board Access",
                    "Company Partnerships (25)",
                    "AI Candidate Matching",
                    "Mock Interview Credits",
                    "Resume Builder",
                    "Placement Analytics",
                ],
                missing: ["Dedicated Coordinator"],
            },
            {
                name: "Premium",
                basePrice: 2999,
                suffix: "/semester",
                description: "Full placement management.",
                icon: Crown,
                features: [
                    "Unlimited Partnerships",
                    "AI-Powered Matching",
                    "Interview Scheduling",
                    "Offer Management",
                    "Dedicated Coordinator",
                    "Real-time Analytics",
                    "Employer Dashboard",
                ],
                missing: [],
            },
        ],
    },
    custom: {
        title: "Custom Solutions",
        description: "Tailored packages for unique requirements.",
        icon: BookOpen,
        tiers: [
            {
                name: "Integration",
                basePrice: 2500,
                suffix: "one-time",
                description: "Connect with your existing systems.",
                icon: Zap,
                features: [
                    "LMS Integration",
                    "ERP Sync",
                    "SSO Setup",
                    "Data Migration",
                ],
                missing: ["Custom Development"],
            },
            {
                name: "Custom Build",
                basePrice: 5000,
                suffix: "starts at",
                description: "Bespoke features for your workflow.",
                icon: Shield,
                popular: true,
                features: [
                    "Custom Assessment Types",
                    "Branded Student Portal",
                    "Custom Reporting",
                    "Workflow Automation",
                    "API Development",
                ],
                missing: [],
            },
            {
                name: "Full Service",
                basePrice: 15000,
                suffix: "/year",
                description: "Managed education operations.",
                icon: Crown,
                features: [
                    "Dedicated Support Team",
                    "Content Curation",
                    "Faculty Training",
                    "Student Onboarding",
                    "Complete Analytics",
                    "Success Metrics",
                ],
                missing: [],
            },
        ],
    },
}

export default function PricingPage() {
    const [currency, setCurrency] = useState<CurrencyKey>("INR")
    const [activeTab, setActiveTab] = useState("credits")

    const formatPrice = (basePrice: number) => {
        const value = Math.round(basePrice * currencies[currency].rate)
        return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 mb-16 relative">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                                CODER&apos;Z <span className="text-neutral-900 font-mono font-normal">UNI</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <Badge variant="outline" className="mb-6 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100">
                                University Pricing
                            </Badge>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6">
                                Invest in <span className="text-neutral-900">Education.</span><br />
                                <span className="text-neutral-400 dark:text-neutral-600">Empower Students.</span>
                            </h1>
                            <p className="text-lg text-neutral-500 max-w-2xl font-light">
                                Flexible pricing designed for universities, colleges, and educational institutions of all sizes.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex gap-1 shadow-sm">
                            {
                                (Object.keys(currencies) as CurrencyKey[]).map((cur) => (
                                    <button
                                        key={cur}
                                        onClick={() => setCurrency(cur)}
                                        className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all ${currency === cur
                                            ? "bg-neutral-800 text-white shadow-md"
                                            : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            }`}
                                    >
                                        {cur}
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6">
                    <Tabs defaultValue="credits" value={activeTab} onValueChange={setActiveTab} className="space-y-12">
                        <div className="overflow-x-auto pb-4 scrollbar-hide">
                            <TabsList className="inline-flex h-auto p-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                                {
                                    Object.entries(pricingData).map(([key, data]) => (
                                        <TabsTrigger
                                            key={key}
                                            value={key}
                                            className="px-6 py-3 cursor-pointer rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-800 dark:data-[state=active]:text-neutral-800 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
                                        >
                                            <data.icon className="w-4 h-4" />
                                            {data.title}
                                        </TabsTrigger>
                                    ))
                                }
                            </TabsList>
                        </div>
                        <AnimatePresence mode="wait">
                            {
                                Object.entries(pricingData).map(([key, data]) => (
                                    <TabsContent key={key} value={key} className="mt-0 outline-none">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid md:grid-cols-3 gap-8"
                                        >
                                            {
                                                data.tiers.map((tier, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className={`relative p-8 rounded-3xl border flex flex-col ${tier.popular
                                                            ? "bg-gradient-to-br from-neutral-800 to-neutral-800 text-white border-neutral-800 shadow-2xl scale-105 z-10"
                                                            : "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                                                            }`}
                                                    >
                                                        {
                                                            tier.popular && (
                                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-neutral-800 to-neutral-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wider">
                                                                    MOST POPULAR
                                                                </div>
                                                            )
                                                        }
                                                        <div className="mb-8">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${tier.popular
                                                                ? "bg-white/20"
                                                                : "bg-neutral-50 dark:bg-neutral-800/30"
                                                                }`}>
                                                                <tier.icon className={`w-6 h-6 ${tier.popular ? "text-white" : "text-neutral-800 dark:text-neutral-100"}`} />
                                                            </div>
                                                            <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                                            <p className={`text-sm leading-relaxed ${tier.popular
                                                                ? "text-neutral-200"
                                                                : "text-neutral-500"
                                                                }`}>
                                                                {tier.description}
                                                            </p>
                                                        </div>
                                                        <div className="mb-8">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-4xl font-bold tracking-tight">
                                                                    {formatPrice(tier.basePrice)}
                                                                </span>
                                                            </div>
                                                            <span className={`text-sm ${tier.popular
                                                                ? "text-neutral-300"
                                                                : "text-neutral-500"
                                                                }`}>
                                                                {tier.suffix}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 space-y-4 mb-8">
                                                            {
                                                                tier.features.map((feature, i) => (
                                                                    <div key={i} className="flex items-start gap-3 text-sm">
                                                                        <Check className={`w-5 h-5 shrink-0 ${tier.popular
                                                                            ? "text-neutral-300"
                                                                            : "text-neutral-800 dark:text-neutral-100"
                                                                            }`} />
                                                                        <span>{feature}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                            {
                                                                tier.missing.map((feature, i) => (
                                                                    <div key={i} className="flex items-start gap-3 text-sm opacity-50">
                                                                        <X className="w-5 h-5 shrink-0" />
                                                                        <span>{feature}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                        <Link href="/contactus" className="w-full mt-auto">
                                                            <button className={`cursor-pointer w-full py-4 rounded-xl font-bold transition-all ${tier.popular
                                                                ? "bg-white text-neutral-800 hover:bg-neutral-50"
                                                                : "bg-neutral-800 text-white hover:bg-neutral-700"
                                                                }`}>
                                                                Select {tier.name}
                                                            </button>
                                                        </Link>
                                                    </motion.div>
                                                ))
                                            }
                                        </motion.div>
                                    </TabsContent>
                                ))
                            }
                        </AnimatePresence>
                    </Tabs>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-24">
                    <div className="bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 md:p-12 text-center">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                            Need a Custom Solution for Your University?
                        </h2>
                        <p className="text-neutral-500 mb-8 max-w-2xl mx-auto">
                            For large universities, multi-campus deployments, or specific integration needs,
                            we offer custom pricing based on your institution size and requirements.
                        </p>
                        <Link
                            href="/contactus"
                            className="cursor-pointer inline-flex items-center font-bold text-neutral-800 dark:text-neutral-100 border-b border-neutral-800 dark:border-neutral-100 pb-0.5 hover:opacity-70 transition-opacity"
                        >
                            Schedule a University Demo <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}