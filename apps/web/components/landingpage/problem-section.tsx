import { Reveal } from '@/components/reveal'

/**
 * The problem, before the product answers it.
 *
 * ── Why this section exists at all ──
 *
 * The landing page went hero -> feature list -> feature list -> feature list. A reader got
 * four catalogues and no narrative, and nothing in that sequence answered the question they
 * actually arrived with, which is not "what does it do" but "why is what I am already doing
 * not working".
 *
 * This is that question, asked before anything is sold.
 *
 * ── Clauses, not a paragraph ──
 *
 * The copy is a LIST - five places preparation leaks - and set as one justified block that
 * structure disappears and the reader has to parse the sentence to find the list. One clause
 * per line makes the five countable at a glance and lands one idea at a time.
 *
 * ── A deliberate deviation from the reference ──
 *
 * The component this is modelled on animates each WORD's opacity and blur against scroll
 * progress, using `useScroll`/`useTransform`. It is a lovely effect and it costs a
 * framer-motion client component with a scroll listener on the landing page.
 *
 * Four sections were just converted OFF framer-motion for exactly that reason
 * (`06-performance.md`), and adding a heavier one back in the same pass would be spending
 * the budget on the first decorative thing that asked. So the clauses stagger in with the
 * zero-JS `Reveal` primitive instead: one idea at a time, same reading rhythm, no runtime.
 *
 * If the per-word focus-pull is ever wanted, it needs to arrive with a Lighthouse number
 * next to it - see rule 6 in the performance budget.
 */

const CLAUSES = [
    'You have solved four hundred problems and still freeze on the follow-up question.',
    'Your best project is a tutorial you finished, and you cannot say why you built it that way.',
    'The first time you say a system design answer out loud is in the interview.',
    'Your resume is a two-column PDF that the screen reads as one column of noise.',
    'And you find all of this out one rejection at a time, weeks after you could have fixed it.',
] as const

export default function ProblemSection() {
    return (
        <section
            aria-labelledby="problem-heading"
            className="border-y border-neutral-200 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-900/40 lg:py-32"
        >
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <Reveal>
                    <p
                        id="problem-heading"
                        className="mb-10 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400"
                    >
                        Before anything else
                    </p>
                </Reveal>

                <div className="space-y-5">
                    {CLAUSES.map((clause, i) => (
                        <Reveal key={clause.slice(0, 24)} delay={i * 0.12}>
                            <p className="text-2xl font-semibold leading-[1.35] tracking-tight text-neutral-900 dark:text-white sm:text-3xl sm:leading-[1.3]">
                                {clause}
                            </p>
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={CLAUSES.length * 0.12}>
                    <p className="mt-12 max-w-2xl border-l-2 border-neutral-900 py-1 pl-6 text-lg leading-relaxed text-neutral-600 dark:border-white dark:text-neutral-400">
                        None of that is a problem with how much you practised. It is a problem with
                        practising one of the five things an interview loop actually tests.
                    </p>
                </Reveal>
            </div>
        </section>
    )
}
