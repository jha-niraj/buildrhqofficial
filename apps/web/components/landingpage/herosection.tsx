"use client"

import { ChevronRight, Terminal } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { useRef, useState, useEffect, useCallback } from "react"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import { ShaderHeroBg, SHADER_PALETTES } from "@repo/ui/components/hero-shader-bg"
import { getPlatformStats } from "@/actions/stats.action"
import { APP_LINKS } from "@/lib/site"
import { HeroSlideArt } from "./hero-slide-art"

interface PlatformStats {
    totalUsers: number
    totalProjects: number
    completedTasks: number
    successRate: number
    totalOpenSourceProjects: number
    totalMockSessions: number
    totalProjectIdeas: number
}

const ROTATE_WORDS = ["career", "portfolio", "resume", "skillset", "interviews", "journey"]

// Rotating product panel. This used to be an image carousel where all five slides
// pointed at the same logo - five identical logos behind dot navigation, which reads as
// broken. Until real product screenshots exist, showing what each surface actually does
// is both honest and more informative than a repeated logo.
//
// FOUR slides, not five, and the set is the nav in `apps/main/lib/navigation.ts` minus
// Jobs. The "Open Source" slide was removed because that module has no route - its
// tables are still in the schema, which is exactly why someone will be tempted to put
// the slide back. Check for a reachable page before doing so.
//
// "Project Studio" was renamed to "Projects" for the same reason: the Studio module was
// deleted from the product, and the copy underneath it was describing Projects anyway.
const SLIDES = [
    {
        label: "Projects",
        headline: "Build something you can defend in an interview.",
        body: "Guided projects broken into real tasks, with reviewed output and a deployable result at the end.",
        points: ["Architecture planning", "Task-level review", "Proof of completion"],
    },
    {
        label: "Mock Interviews",
        headline: "Practise the performance, not just the problem.",
        body: "Technical and behavioural rounds with follow-up questions and feedback on structure and clarity.",
        points: ["DSA & system design", "Behavioural rounds", "Scored feedback"],
    },
    {
        label: "Practice",
        headline: "Hints that teach instead of hand over the answer.",
        body: "Pattern-first problem sets that give you the minimum nudge needed to make progress.",
        points: ["15 core patterns", "Progressive hints", "Progress tracking"],
    },
    {
        label: "Resume & Cover Letters",
        headline: "Get past the keyword search, then past the human.",
        body: "Paste a job description and get bullets tailored to it, with the formatting an ATS can actually parse.",
        points: ["ATS parsing check", "Keyword gap analysis", "Tailored per role"],
    },
]

const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
}

export default function HeroSection() {
    const reduced = useReducedMotion()

    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [wordIdx, setWordIdx] = useState(0)
    const [wordVis, setWordVis] = useState(true)
    const [slideIdx, setSlideIdx] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const result = await getPlatformStats()
                if (result.success && result.data) {
                    setStats(result.data as unknown as PlatformStats)
                }
            } catch {
                // non-critical
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    useEffect(() => {
        const t = setInterval(() => {
            setWordVis(false)
            setTimeout(() => {
                setWordIdx(i => (i + 1) % ROTATE_WORDS.length)
                setWordVis(true)
            }, 280)
        }, 2600)
        return () => clearInterval(t)
    }, [])

    const startAutoplay = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            setSlideIdx(i => (i + 1) % SLIDES.length)
        }, 5000)
    }, [])

    useEffect(() => {
        startAutoplay()
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [startAutoplay])

    const goTo = (idx: number) => {
        setSlideIdx(idx)
        startAutoplay()
    }

    const statItems = [
        {
            eyebrow: "Active Developers",
            value: loading ? null : formatNumber(stats?.totalUsers ?? 0),
            desc: "Building on ShipItHQ",
            accent: "bg-neutral-900",
        },
        {
            eyebrow: "Projects Built",
            value: loading ? null : formatNumber(stats?.totalProjects ?? 0),
            desc: "Shipped by our community",
            accent: "bg-neutral-900",
        },
        {
            eyebrow: "Mock Interviews",
            value: loading ? null : formatNumber(stats?.totalMockSessions ?? 0),
            desc: "Conducted on platform",
            accent: "bg-neutral-900",
        },
        {
            eyebrow: "Open Source",
            value: loading ? null : formatNumber(stats?.totalOpenSourceProjects ?? 0),
            desc: "Projects tracked for contributors",
            accent: "bg-neutral-900",
        },
    ]

    return (
        <section className="relative h-screen overflow-hidden bg-neutral-100 dark:bg-black">
            {/* Animated shader backdrop in both themes: warm pearl in light, a
                premium neutral graphite in dark so the white hero text stays legible. */}
            <ShaderHeroBg colors={SHADER_PALETTES.pearl} light className="dark:hidden" />
            <ShaderHeroBg colors={SHADER_PALETTES.graphite} className="hidden dark:block" />

            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 lg:px-16">

                {/* ── Top row: text left + stats right ─────────────────────── */}
                <div className="flex shrink-0 flex-col items-start gap-10 pt-24 pb-6 lg:flex-row lg:items-center lg:gap-14 lg:pt-28">

                    {/* Left: text */}
                    <motion.div
                        className="flex-1"
                        variants={reduced ? undefined : container}
                        initial={reduced ? false : "hidden"}
                        animate={reduced ? undefined : "show"}
                    >
                        {/* rotating badge */}
                        <motion.div
                            className="mb-7 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 dark:border-white/10 dark:bg-white/5"
                            variants={reduced ? undefined : item}
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-900 dark:bg-white" />
                            <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 dark:text-white/50">
                                Accelerate your
                            </span>
                            <span
                                className="min-w-[68px] text-left text-[11px] font-semibold uppercase tracking-widest text-neutral-900 dark:text-white"
                                style={{
                                    opacity: wordVis ? 1 : 0,
                                    filter: wordVis ? "blur(0)" : "blur(5px)",
                                    transition: "opacity 200ms, filter 200ms",
                                }}
                            >
                                {ROTATE_WORDS[wordIdx]}
                            </span>
                        </motion.div>

                        <motion.h1
                            className="text-[48px] font-bold leading-[1.05] tracking-[-2.5px] text-neutral-950 dark:text-white lg:text-[58px]"
                            variants={reduced ? undefined : item}
                        >
                            The Engineering
                            <br />
                            <span className="text-neutral-500 dark:text-white/55">Intelligence Suite.</span>
                        </motion.h1>

                        <motion.p
                            className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-neutral-600 dark:text-white/65"
                            variants={reduced ? undefined : item}
                        >
                            Build real projects, practice DSA & system design, ace AI mock
                            interviews, and get matched to jobs - with a suite of specialized
                            AI agents designed for serious developers.
                        </motion.p>

                        <motion.div
                            className="mt-8 flex flex-wrap items-center gap-3"
                            variants={reduced ? undefined : item}
                        >
                            {/* The marketing site never knows who you are - both CTAs simply
                                hand off to the app deploy, which owns auth end to end. */}
                            <a
                                href={APP_LINKS.signup}
                                className="group inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
                            >
                                <Terminal className="h-4 w-4" />
                                Start building free
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </a>
                            <a
                                href={APP_LINKS.signin}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-transparent px-7 py-3.5 text-[14px] font-medium text-neutral-700 transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                            >
                                Sign in
                                <span className="text-neutral-600 dark:text-white/60">→</span>
                            </a>
                        </motion.div>

                        <motion.div
                            className="mt-5 flex items-center gap-6"
                            variants={reduced ? undefined : item}
                        >
                            <p className="text-[12px] text-neutral-600 dark:text-white/55">
                                Trusted by developers · No credit card required
                            </p>
                            <div className="flex items-center gap-1.5">
                                {SLIDES.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goTo(i)}
                                        aria-label={`Show ${SLIDES[i]?.label}`}
                                        className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                                            i === slideIdx
                                                ? "w-6 bg-neutral-950 dark:bg-white"
                                                : "w-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-white/20 dark:hover:bg-white/40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right: 2×2 stats card */}
                    <motion.div
                        className="w-full flex-1"
                        initial={reduced ? false : { opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5">
                            <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 dark:divide-white/10">
                                {statItems.map((s) => (
                                    <div key={s.eyebrow} className="px-6 py-5">
                                        <p className="mb-3 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                            <span className={`h-1 w-1 shrink-0 rounded-full ${s.accent}`} />
                                            {s.eyebrow}
                                        </p>
                                        {s.value === null ? (
                                            <Skeleton className="h-10 w-16 mb-1" />
                                        ) : (
                                            <p className="text-[38px] font-bold leading-none tracking-tight text-neutral-900 dark:text-white">
                                                {s.value}
                                                <span className="text-[22px] text-neutral-900 dark:text-white">+</span>
                                            </p>
                                        )}
                                        <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Rotating product panel - fills rest, bleeds off bottom ── */}
                <motion.div
                    className="relative min-h-0 flex-1"
                    initial={reduced ? false : { opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="absolute inset-0 bottom-[-48px] overflow-hidden rounded-t-2xl border border-b-0 border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-white/10 dark:bg-neutral-900">
                        {SLIDES.map((slide, i) => (
                            <div
                                key={slide.label}
                                aria-hidden={i !== slideIdx}
                                className="absolute inset-0 transition-opacity duration-500"
                                style={{ opacity: i === slideIdx ? 1 : 0 }}
                            >
                                {/* Two columns, not one.
                                
                                    This was `flex flex-col justify-center` with the copy in
                                    a `max-w-xl`, so at desktop width the left third held
                                    everything and the right two thirds were empty - on the
                                    first thing below the fold on the busiest page.
                                
                                    The illustration is server-rendered SVG on currentColor
                                    with CSS-only animation; it adds no JavaScript to a panel
                                    that already pays for the rotation. */}
                                <div className="grid h-full grid-cols-1 items-center gap-8 px-8 sm:px-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
                                    <div className="min-w-0">
                                        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-900 dark:text-white">
                                            {slide.label}
                                        </p>
                                        <p className="mb-3 text-2xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                                            {slide.headline}
                                        </p>
                                        <p className="mb-6 max-w-lg text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            {slide.body}
                                        </p>
                                        <ul className="flex flex-wrap gap-2">
                                            {slide.points.map((point) => (
                                                <li
                                                    key={point}
                                                    className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] text-neutral-600 dark:border-white/10 dark:text-neutral-400"
                                                >
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* hidden below lg: at tablet width the panel is not
                                        tall enough for both, and the copy is what matters. */}
                                    <div className="hidden min-w-0 lg:block">
                                        <HeroSlideArt
                                            index={i}
                                            className="w-full text-neutral-400 dark:text-neutral-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    )
}
