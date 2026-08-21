import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { FEATURE_MODULES } from '@/app/(home)/features/_components/feature-modules'
import { NAV_ITEMS } from './nav-links'

/**
 * What the product does. ONE section, replacing three.
 *
 * ── What this replaced, and why ──
 *
 * `featuressection`, `aitoolssection` and `assessments-section` all made the same argument -
 * "here are things the product does" - one after another, with no narrative between them.
 * Two of them made a claim that was *literally the same claim*: "Real Linux Sandbox" in one
 * and "Interactive Labs ... deploying real code in cloud-based sandboxes" in another. A
 * reader met the sandbox twice and had no way to know it was one feature.
 *
 * ── It reads from `FEATURE_MODULES` ──
 *
 * The single most useful property of this section is that it CANNOT drift from `/features`,
 * because it is the same array. The old three sections carried their own hardcoded copy,
 * which is how "Job Matching - get matched to roles that fit" survived on the landing page
 * while nobody was sure whether matching existed. (It does; the check is recorded in the
 * data file.)
 *
 * The icons come from `nav-links.ts` for the same reason - the navbar dropdown already
 * assigns one per module, and a second mapping would be a second thing to keep in sync.
 *
 * ── The summary, not the body ──
 *
 * Each card prints the module's one-line `summary` and nothing else. The landing page's job
 * is to make a reader want the detail; `/features` is where the detail lives. Repeating the
 * paragraphs here would rebuild the catalogue this section exists to replace.
 */

/** Icon per module id, taken from the navbar's own Features panel. */
const ICONS = Object.fromEntries(
    (NAV_ITEMS.find((i) => i.href === '/features')?.children ?? []).map((c) => [
        c.href.split('#')[1] ?? '',
        c.icon,
    ]),
)

export default function CapabilitiesSection() {
    return (
        <section aria-labelledby="capabilities-heading" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <Reveal className="max-w-2xl">
                    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                        What you get
                    </p>
                    <h2
                        id="capabilities-heading"
                        className="text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 dark:text-white sm:text-5xl"
                    >
                        Six things, and each one does what it says.
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Nothing on this list is coming soon, in beta, or a page you cannot reach after
                        signing up. Where something has a limit, the limit is written on the features
                        page next to it.
                    </p>
                </Reveal>

                <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURE_MODULES.map((m, i) => {
                        const Icon = ICONS[m.id]
                        return (
                            <Reveal key={m.id} delay={Math.min(i * 0.06, 0.3)} className="flex bg-white dark:bg-neutral-950">
                                <Link
                                    href={`/features#${m.id}`}
                                    className="group flex w-full flex-col p-7 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                                >
                                    <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors group-hover:border-neutral-400 group-hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:group-hover:border-neutral-500 dark:group-hover:text-white">
                                        {Icon ? <Icon className="h-5 w-5" aria-hidden /> : null}
                                    </span>
                                    <h3 className="mb-3 text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                                        {m.name}
                                    </h3>
                                    <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                        {m.summary}
                                    </p>
                                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white">
                                        What it does
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                                    </span>
                                </Link>
                            </Reveal>
                        )
                    })}
                </div>

                <Reveal className="mt-10">
                    <Link
                        href="/features"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-300 px-6 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-500"
                    >
                        Every feature, and what each one is not
                        <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </Reveal>
            </div>
        </section>
    )
}
