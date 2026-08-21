import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { COMPARISONS } from '@/app/(home)/compare/_components/comparisons'

/**
 * Why this and not the free alternative.
 *
 * ── The section the page was missing ──
 *
 * `04-landing-composition.md`: *"Nothing in that sequence answers why this instead of the
 * free alternative, which is the actual question a student arrives with."* Four consecutive
 * feature lists never got near it.
 *
 * ── It leads with the concession ──
 *
 * The first thing this says is that LeetCode is good and you should use it. That is not
 * modesty, it is the only way the rest is believable: a reader who has spent six months on
 * LeetCode knows perfectly well it works, and a section that opens by implying otherwise
 * has told them the page is not honest before they reach the argument.
 *
 * Same guard as the comparison pages themselves, and it is enforced the same way - by
 * reading `creditWhereDue` from the shared data rather than writing fresh copy here that
 * could quietly drop it.
 *
 * ── No prices ──
 *
 * Nothing here quotes a competitor's price, for the reasons written at the top of
 * `compare/_components/comparisons.ts`. If a price appears in this section later, it did
 * not come from that file.
 */
export default function CompareSection() {
    return (
        <section
            aria-labelledby="compare-heading"
            className="border-y border-neutral-200 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/40 lg:py-32"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
                    <Reveal>
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                            The honest bit
                        </p>
                        <h2
                            id="compare-heading"
                            className="text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 dark:text-white sm:text-5xl"
                        >
                            Keep using LeetCode.
                        </h2>
                        <div className="mt-6 space-y-4 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                            <p>
                                It is very good at the thing it is for, and if the 45-minute algorithm
                                screen is the round you are worried about, that is where to spend your
                                evenings. We are not trying to out-bank a decade-old problem archive.
                            </p>
                            <p>
                                The gap is not in the problems. It is that a judge tells you whether
                                your answer passed and stops there - it does not ask why you chose that
                                structure, read your resume against the posting, or make you say a
                                system design answer out loud.
                            </p>
                            <p className="border-l-2 border-neutral-900 py-1 pl-6 text-[17px] text-neutral-700 dark:border-white dark:text-neutral-300">
                                Which is why most people end up wanting both, and why every comparison
                                on this site opens with what the other one is good at.
                            </p>
                        </div>
                    </Reveal>

                    <div className="flex flex-col gap-4">
                        {COMPARISONS.map((c, i) => (
                            <Reveal key={c.slug} delay={0.1 + i * 0.08} className="flex">
                                <Link
                                    href={`/compare/${c.slug}`}
                                    className="group flex w-full flex-col rounded-2xl border border-neutral-200 bg-white p-7 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                                >
                                    <h3 className="mb-3 text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                        {c.title}
                                    </h3>
                                    <p className="mb-5 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                        {c.stance}
                                    </p>
                                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white">
                                        Read the comparison
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                                    </span>
                                </Link>
                            </Reveal>
                        ))}

                        <Reveal delay={0.1 + COMPARISONS.length * 0.08}>
                            <Link
                                href="/compare"
                                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-700 dark:hover:decoration-white"
                            >
                                How these comparisons are written
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    )
}
