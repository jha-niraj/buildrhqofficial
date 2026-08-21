import { Reveal } from '@/components/reveal'

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
 * The image definition is checked into this repo at `apps/shipitworker/Dockerfile`, and
 * these lines are copied from it verbatim. It is the strongest evidence available and the
 * one thing nobody bothers to fake: a reader who does not believe the claim can go and read
 * the file.
 *
 * When a public execution endpoint exists, this section should become the live demo, and the
 * Dockerfile can move to a caption underneath it.
 */

/**
 * Copied verbatim from `apps/shipitworker/Dockerfile`.
 *
 * If that file changes, this changes with it. It is quoted rather than imported because the
 * marketing site does not depend on the worker package and should not start doing so to
 * render a code block.
 */
const DOCKERFILE = `FROM node:20-bookworm-slim

# Language runtimes: Python, C/C++ (gcc/g++), Java (JDK). TypeScript runs via tsx.
RUN apt-get update && apt-get install -y --no-install-recommends \\
	python3 \\
	gcc \\
	g++ \\
	default-jdk \\
	ca-certificates \\
	&& rm -rf /var/lib/apt/lists/* \\
	&& npm install -g tsx@4.19.2

# Run the executor as a non-root user for a little extra hardening.
RUN useradd -m runner`

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
                                You do not have to take that on trust. The image is checked into the
                                repo, and this is it.
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
                        <figure className="m-0 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
                            <figcaption className="flex items-center gap-2 border-b border-neutral-800 px-5 py-3">
                                <span className="flex gap-1.5" aria-hidden>
                                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                                </span>
                                <span className="ml-2 font-mono text-[11px] text-neutral-400">
                                    apps/shipitworker/Dockerfile
                                </span>
                            </figcaption>
                            {/* overflow-x-auto: a Dockerfile line is long and must scroll inside
                                this box rather than making the page scroll sideways. */}
                            <div className="overflow-x-auto">
                                <pre className="px-5 py-5 font-mono text-[12.5px] leading-relaxed text-neutral-300 sm:text-[13px]">
                                    <code>{DOCKERFILE}</code>
                                </pre>
                            </div>
                        </figure>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}
