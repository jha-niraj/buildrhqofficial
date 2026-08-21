import { Reveal } from '@/components/reveal'
import { DockerfilePanel } from './dockerfile-panel'

/**
 * The container. The one thing on this page a competitor cannot copy in a sprint.
 *
 * ── What this section is NOT ──
 *
 * `04-landing-composition.md` scoped this as "paste code, press run, see real output", with
 * a recorded terminal as the fallback. Both were rejected, and the reason is the whole point
 * of the section:
 *
 * A live demo needs a public, rate-limited execution endpoint that does not exist yet, and
 * standing one up is its own piece of work with its own abuse surface.
 *
 * A *recorded* terminal was the fallback, and it is worse than it sounds. The transcript
 * would have to be generated somewhere, and the only compilers available to generate it were
 * Apple clang on a laptop - which prints a visibly different diagnostic from the GNU g++ that
 * actually runs in the container. Shipping that under the caption "real compiler output"
 * would be a fabricated screenshot on a page whose argument is that nothing here is faked.
 *
 * ── So it shows the Dockerfile ──
 *
 * The panel itself is `dockerfile-panel.tsx`, which is a small client component because
 * `ScrollArea` is Radix. The boundary sits around the panel rather than around this
 * section, so the heading, the copy and the three facts stay server-rendered.
 *
 * The image definition is checked into this repo at `apps/shipitworker/Dockerfile`, and
 * these lines are copied from it verbatim. It is the strongest evidence available and the
 * one thing nobody bothers to fake: a reader who does not believe the claim can go and read
 * the file.
 *
 * When a public execution endpoint exists, this section should become the live demo, and the
 * Dockerfile can move to a caption underneath it.
 */

const FACTS = [
    {
        value: '6',
        label: 'Languages',
        detail: 'JavaScript, TypeScript, Python 3, C, C++, Java',
    },
    {
        value: '1',
        label: 'Container per run',
        detail: 'Started for your execution, thrown away after it',
    },
    {
        value: '0',
        label: 'Emulated runtimes',
        detail: 'A real filesystem, a real process, the compiler\'s own errors',
    },
] as const

export default function ProofSection() {
    return (
        <section aria-labelledby="proof-heading" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
                    <Reveal>
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                            Proof, not a bullet point
                        </p>
                        <h2
                            id="proof-heading"
                            className="text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 dark:text-white sm:text-5xl"
                        >
                            Your code runs on a real machine.
                        </h2>
                        <div className="mt-6 space-y-4 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                            <p>
                                Most practice platforms mark your answer by comparing it to an expected
                                string. When something goes wrong you get their description of the
                                error, which is a translation of a translation.
                            </p>
                            <p>
                                Here, the code goes to a Linux container that exists for that execution
                                and is destroyed afterwards. If g++ says you compared a signed int to an
                                unsigned size, that is g++ talking.
                            </p>
                            <p className="border-l-2 border-neutral-900 py-1 pl-6 text-[17px] text-neutral-700 dark:border-white dark:text-neutral-300">
                                You do not have to take the claim on trust. This is the image
                                definition itself, not a description of it.
                            </p>
                        </div>

                        <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-neutral-200 pt-8 dark:border-neutral-800 sm:grid-cols-3">
                            {FACTS.map((f) => (
                                <div key={f.label}>
                                    <dt className="text-3xl font-bold tabular-nums tracking-tight text-neutral-900 dark:text-white">
                                        {f.value}
                                    </dt>
                                    <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                                        {f.label}
                                    </dd>
                                    <dd className="mt-1.5 text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
                                        {f.detail}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <DockerfilePanel />
                    </Reveal>
                </div>
            </div>
        </section>
    )
}
