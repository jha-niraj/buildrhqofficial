/**
 * The comparison pages, and the sourcing rules they are built under.
 *
 * ── The rule from `01-content-truth.md` ──
 *
 * > Every statement about a competitor must be checkable against something they publish,
 * > dated, with the source URL recorded next to the claim. A comparison table that
 * > overstates is a comparison table that gets screenshotted.
 *
 * That rule survived contact with reality, and it changed what these pages say.
 *
 * ── What could not be sourced, and what was done about it ──
 *
 * LeetCode serves HTTP 403 to automated fetches across their whole domain, including the
 * subscribe page and the support articles. Every price figure available for them comes
 * from third-party SEO blogs, several of which sell competing products. Those figures also
 * disagreed with each other on the date this was written.
 *
 * interviewing.io does not publish prices at all. Their own front page offers a free AI
 * interviewer and paid human sessions, and says to sign up to see what those cost
 * (interviewing.io, accessed 2026-08-20).
 *
 * So: **no page here states a competitor's price.** Not "around", not "roughly", not a
 * figure with a hedge in front of it. A price is the single most screenshotted cell in any
 * comparison table and the one most likely to be out of date within a quarter.
 *
 * ── What the pages compare instead ──
 *
 * The SHAPE of the approach, which is stable, publicly visible, and not something a vendor
 * changes on a Tuesday. A problem bank with a judge is a problem bank with a judge whatever
 * it charges. Every claim is therefore one of three kinds:
 *
 *   1. A fact about ShipItHQ, with the file it was read from.
 *   2. A property of the CATEGORY the competitor belongs to, argued rather than asserted.
 *   3. A quote from the competitor's own page, with the URL and the date it was read.
 *
 * A cell that would need a fourth kind was cut. That is why some rows say "not compared".
 *
 * ── Do not add a price row to this file ──
 *
 * If someone wants one, the work is to read the vendor's own pricing page on the day, quote
 * it, date it, and accept that it needs re-checking every quarter. Not to remember a number.
 */

export interface ComparisonRow {
    /** What is being compared. Phrase as a question a reader actually has. */
    dimension: string
    /** ShipItHQ's answer. */
    ours: string
    /** The alternative's answer, or how the category works. */
    theirs: string
    /** Where this row was checked. Shown on the page - it is not a hidden comment. */
    source: string
}

export interface Comparison {
    /** URL slug. `/compare/<slug>`. */
    slug: string
    /** Display name of the alternative. */
    name: string
    /** The one-line positioning. Shown as the hero subtitle. */
    stance: string
    /** Hero title. */
    title: string
    /** The honest opening: what the alternative is genuinely good at. */
    creditWhereDue: readonly string[]
    /** The argument for using this instead, or as well. */
    argument: readonly string[]
    rows: readonly ComparisonRow[]
    /** Who should pick the alternative. A comparison with no such section is an advert. */
    pickThemIf: readonly string[]
    pickUsIf: readonly string[]
    /** Vendor link, so a reader can check the claims themselves. */
    vendorUrl: string
    /** SEO description. */
    description: string
}

const REPO = 'verified in this repo'

export const COMPARISONS: readonly Comparison[] = [
    {
        slug: 'leetcode',
        name: 'LeetCode',
        title: 'ShipItHQ vs LeetCode',
        stance: 'One is a problem bank. The other is everything that happens around the problems.',
        description:
            'An honest comparison of ShipItHQ and LeetCode: what a problem bank is genuinely good at, what it does not cover, and where the two fit together rather than replace each other.',
        vendorUrl: 'https://leetcode.com/',
        creditWhereDue: [
            'LeetCode is very good at one thing, and it is a thing that matters: getting you ready for a 45-minute algorithmic screen where somebody asks you to solve a puzzle you have not seen before. Most large tech companies still run that interview.',
            'If that is the round you are worried about, use it. Nothing on this page argues otherwise, and ShipItHQ is not trying to be a bigger problem bank - there is no version of this where a newer product out-banks a decade-old archive.',
        ],
        argument: [
            'The gap is not in the problems. It is in everything the interview loop contains that a problem bank does not model.',
            'A judge tells you whether your answer passed. It does not ask why you chose that data structure, and no interviewer stops at "correct". It does not read your resume against the posting you are applying to. It does not make you say a system design answer out loud, which is the round most people fail having never rehearsed it once.',
            'That is the actual argument here, and it is why the two are not really substitutes. A reasonable split is that you spend half your preparation on pattern practice and the other half on the rounds nobody drills: the project you have to defend, the resume that has to survive a parser, the answer you have to speak.',
        ],
        rows: [
            {
                dimension: 'Algorithmic problem practice',
                ours: 'Four tracks - DSA, system design, web frontend, web backend',
                theirs: 'A large algorithmic problem archive, which is the category it defined',
                source: 'ours: apps/main/app/(main)/practice',
            },
            {
                dimension: 'Where your code runs',
                ours: 'A Linux container built for that run: Node, TypeScript, Python 3, C, C++, Java. Real compiler output',
                theirs: 'A hosted judge across a wide language list',
                source: 'ours: runtimes read from apps/shipitworker\'s Dockerfile',
            },
            {
                dimension: 'A project you can be interviewed about',
                ours: 'Generated briefs, then a quiz and a mock interview written from your own build',
                theirs: 'Not what a problem bank is for',
                source: 'ours: apps/main/app/(main)/projects',
            },
            {
                dimension: 'Spoken mock interview',
                ours: 'Voice mock, no scheduling and nobody to owe a favour to',
                theirs: 'Not what a problem bank is for',
                source: 'ours: apps/main/app/(main)/mock/voice',
            },
            {
                dimension: 'Resume against a specific posting',
                ours: 'ATS score, tailoring to a job description, cover letters generated from your own resume',
                theirs: 'Not what a problem bank is for',
                source: 'ours: apps/main/app/(main)/ai',
            },
            {
                dimension: 'Application tracking',
                ours: 'Browse, save, follow companies, track what you sent',
                theirs: 'Not what a problem bank is for',
                source: 'ours: apps/main/app/(jobs)/jobs',
            },
            {
                dimension: 'How you pay',
                ours: 'Credits, spent per operation. 100 free at signup, no expiry, no subscription',
                theirs: 'Not compared - see the note below this table',
                source: 'ours: SIGNUP_GRANT_CREDITS in apps/main/lib/credits/grant.ts',
            },
        ],
        pickThemIf: [
            'The algorithmic screen is the round you are worried about and you want the deepest archive of it.',
            'You want a specific company\'s tagged questions and a decade of discussion threads under each problem.',
            'You are early enough that volume of pattern practice is the bottleneck, not anything else.',
        ],
        pickUsIf: [
            'You can pass the algorithm round and still cannot explain the project on your CV.',
            'Your applications are not converting to phone screens, which is a resume problem and not a DSA problem.',
            'You have never said a system design answer out loud and your first time will otherwise be the real one.',
            'You want practice, projects, mocks, resume tooling and applications in one place rather than five tabs.',
        ],
    },
    {
        slug: 'interviewing-io',
        name: 'interviewing.io',
        title: 'ShipItHQ vs interviewing.io',
        stance: 'Human interviewers from big companies, versus a rehearsal room that is open at 1am.',
        description:
            'An honest comparison of ShipItHQ and interviewing.io: when a real senior engineer is worth booking, when an always-available rehearsal is what you actually need, and why most people want both.',
        vendorUrl: 'https://interviewing.io/',
        creditWhereDue: [
            'interviewing.io\'s own front page describes mock interviews conducted by senior and staff engineers from companies including Meta, Google, Amazon and OpenAI, across coding, system design, machine learning, behavioural, front-end and engineering-management rounds (interviewing.io, accessed 2026-08-20).',
            'A real senior engineer telling you what they actually thought is worth more than any generated feedback, and nothing here claims otherwise. If you can afford it before a specific onsite, book it.',
        ],
        argument: [
            'The constraint on human mocks is not quality. It is availability and cost per session, and both of those decide how many times you can do it.',
            'Preparation works by repetition. The fifth time you explain your caching decision, you explain it well; the first time, you do not. A format you book in advance and pay for per session is not one you run five times in a week, and that is the specific gap this fills.',
            'So the sensible shape is both: rehearse until the answer is fluent, then spend a human session on the thing you cannot self-assess, which is how you come across.',
        ],
        rows: [
            {
                dimension: 'Who conducts the mock',
                ours: 'AI, voice, on demand',
                theirs: 'Senior and staff engineers from large tech companies, and an AI interviewer',
                source: 'theirs: interviewing.io front page, accessed 2026-08-20',
            },
            {
                dimension: 'Availability',
                ours: 'Immediately, as many times as you like',
                theirs: 'Booked sessions with a human; the AI interviewer is offered free',
                source: 'theirs: interviewing.io front page, accessed 2026-08-20',
            },
            {
                dimension: 'Coding practice attached',
                ours: 'Four practice tracks with code run in a real container',
                theirs: 'Interview practice is the product; their site also offers a question bank',
                source: 'ours: apps/main/app/(main)/practice',
            },
            {
                dimension: 'Project work',
                ours: 'Briefs, then a quiz and mock written from what you built',
                theirs: 'Not part of what their front page describes',
                source: 'theirs: interviewing.io front page, accessed 2026-08-20',
            },
            {
                dimension: 'Resume and applications',
                ours: 'ATS scoring, tailoring, cover letters, application tracking',
                theirs: 'Not part of what their front page describes',
                source: 'ours: apps/main/app/(main)/ai and app/(jobs)/jobs',
            },
            {
                dimension: 'How you pay',
                ours: 'Credits per operation. 100 free at signup, no expiry',
                theirs: 'Not compared - they do not publish prices publicly',
                source: 'theirs: no price stated on interviewing.io, accessed 2026-08-20',
            },
        ],
        pickThemIf: [
            'You have a specific onsite booked and want a human who has run that company\'s loop to tell you how you came across.',
            'You want feedback on the parts a machine is worst at judging: presence, pacing, how you handle being wrong.',
            'You are past the point where more repetition helps and need an outside read.',
        ],
        pickUsIf: [
            'You need the tenth rehearsal, not the first review, and cost per session is what is stopping you.',
            'You want the practice, the project, the resume and the applications in the same place as the mock.',
            'It is 1am the night before and there is nobody to book.',
        ],
    },
] as const

export const COMPARISON_SLUGS = COMPARISONS.map((c) => c.slug)

export function getComparison(slug: string): Comparison | undefined {
    return COMPARISONS.find((c) => c.slug === slug)
}

/** Shown under every table. The sourcing rule, said out loud to the reader. */
export const SOURCING_NOTE =
    'We do not list a competitor\'s price. Prices change, comparison tables do not, and an out-of-date figure in our favour would be the most dishonest thing on this page. Every claim above is either something you can check in a link, or something about our own product that we have named the file for.'
