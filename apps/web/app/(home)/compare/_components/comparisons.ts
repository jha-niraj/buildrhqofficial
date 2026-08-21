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
    /**
     * The long-form part of the page: named sections of argument, below the table.
     *
     * Added after a manual pass found these pages thin next to the rest of the site. Every
     * paragraph obeys the same sourcing rule as the rows above - a fact about us with the
     * file named, a property of the category argued rather than asserted, or a quote from
     * the vendor with a date. **No prices.**
     */
    deepDive: readonly { heading: string; body: readonly string[] }[]
    /** The questions a reader arrives with. Rendered, and emitted as FAQPage. */
    faqs: readonly { question: string; answer: string }[]
}


export const COMPARISONS: readonly Comparison[] = [
    {
        slug: 'leetcode',
        name: 'LeetCode',
        title: 'ShipItHQ vs LeetCode',
        stance: 'One is a problem bank. The other is everything that happens around the problems.',
        description:
            'What a problem bank is genuinely good at, what it does not cover, and why ShipItHQ and LeetCode fit together rather than replace each other.',
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
        deepDive: [
            {
                heading: 'What a judge can and cannot tell you',
                body: [
                    'A judge answers one question: did the output match. That is a genuinely useful answer, and it is the only one it has. It cannot tell you that your solution is correct but unreadable, that you took eleven minutes to find an approach an interviewer would have expected in three, or that you never said a word while you were doing it.',
                    'Interviews score four things and correctness is one of them. The other three - how you got there, how you communicated it, and whether you verified your own work - leave no trace in a submission. That is not a criticism of problem banks; it is a description of what a submission is.',
                    'The practical consequence is that a high solve count and a failed loop are entirely compatible, which is confusing if you believe the count measures readiness. It measures one of four things.',
                ],
            },
            {
                heading: 'Where the code runs, and why it shows up in the errors',
                body: [
                    'Your code here goes to a Linux container built for that execution and destroyed afterwards. It has a real filesystem, a real process, and the actual toolchain: Node, tsx, Python 3, gcc, g++ and a JDK. That list is read off the image definition in `apps/shipitworker/Dockerfile`, which is in this repository.',
                    'The visible difference is the errors. A hosted judge usually normalises compiler output into its own format, so a diagnostic arrives already interpreted. Here g++ speaks for itself, which matters because reading a real compiler message is a skill you need in the job and never practise if something keeps paraphrasing them for you.',
                ],
            },
            {
                heading: 'The rounds a problem bank does not model',
                body: [
                    'A full loop usually contains a recruiter screen, a technical phone screen, one or two coding rounds, a system design conversation, and a behavioural round. Problem practice prepares you for the middle of that list.',
                    'The project rounds are the ones people are least ready for, because they require defending decisions rather than producing answers. The question is not "what is a hash map", it is "why did you pick Postgres over Mongo for this, and what did that cost you". You cannot practise that against a problem set, because the subject matter has to be something you actually built.',
                    'That is the gap this fills: a brief to build against, then a quiz and a mock interview generated from your own project rather than from a bank. Verified in `apps/main/app/(main)/projects`.',
                ],
            },
            {
                heading: 'Using both, in a proportion that works',
                body: [
                    'A reasonable split for someone with a mixed loop ahead of them is roughly half on pattern-based algorithmic practice and half on everything else - the project you have to defend, the resume that has to survive a parser, the answer you have to speak.',
                    'The mistake is not using LeetCode. The mistake is using it for all of your preparation and then being surprised by a take-home, a debugging round, or a behavioural question. Our own blog says the same thing at greater length in the LeetCode alternatives guide, and that post recommends LeetCode.',
                ],
            },
        ],
        faqs: [
            { question: 'Is ShipItHQ a LeetCode alternative?', answer: 'Not really a replacement, no. LeetCode is a problem bank and this is the rounds around the problems - projects you can be interviewed about, spoken mock interviews, resume tooling and application tracking. Most people who use both keep using both.' },
            { question: 'Does ShipItHQ have as many problems as LeetCode?', answer: 'No, and it is not trying to. There is no version of this where a newer product out-banks a decade-old archive. Practice here is four tracks - DSA, system design, web frontend and web backend - organised by pattern rather than by volume.' },
            { question: 'What can ShipItHQ do that LeetCode cannot?', answer: 'Generate a project brief and then interview you about what you built, run a spoken mock interview with follow-up questions, score your resume against what an applicant tracking system actually extracts, and track your applications. None of those are what a problem bank is for.' },
            { question: 'Should I stop using LeetCode?', answer: 'No. If the 45-minute algorithmic screen is the round you are worried about, that is where to spend your evenings. Add the other preparation rather than swapping it.' },
        ],
    },
    {
        slug: 'interviewing-io',
        name: 'interviewing.io',
        title: 'ShipItHQ vs interviewing.io',
        stance: 'Human interviewers from big companies, versus a rehearsal room that is open at 1am.',
        description:
            'When a real senior engineer is worth booking, when an always-available rehearsal is what you need, and why most people end up wanting both.',
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
        deepDive: [
            {
                heading: 'Rehearsal and review are different activities',
                body: [
                    'Preparation works by repetition. The fifth time you explain a caching decision you explain it well; the first time you do not, and the difference is fluency rather than knowledge. Everything about the answer was already in your head on attempt one.',
                    'A booked session with a human is a review: an outside read on how you come across, from somebody who has run the loop you are about to sit. It is the most valuable single hour available and it is not the thing you need ten of.',
                    'These are not competing products so much as different points in the same process. Rehearse until the answer is fluent, then spend a human session on the part you cannot self-assess.',
                ],
            },
            {
                heading: 'What an always-available mock is actually for',
                body: [
                    'The reason most people arrive at a real interview having never said their answer out loud is not that they think it is unnecessary. It is that arranging a mock takes another person, a shared calendar and a favour, so it does not happen.',
                    'Removing the scheduling is most of the value. A voice mock at 1am the night before an onsite is not better than a senior engineer, and it is available, which is the property that decides whether the rehearsal happens at all.',
                    'Verified in `apps/main/app/(main)/mock/voice`. One mode - voice. There is no whiteboard round and no panel.',
                ],
            },
            {
                heading: 'What each of us does outside the mock itself',
                body: [
                    'interviewing.io\'s own front page describes mock interviews with senior and staff engineers across coding, system design, machine learning, behavioural, front-end and engineering-management rounds, plus a free AI interviewer and dedicated coaching programmes (accessed 2026-08-20). Interview practice is the product.',
                    'Here the mock sits alongside the rest of the process: four practice tracks with code executed in a real container, project briefs that generate their own interview, ATS resume scoring and tailoring, and an application tracker with match scoring. Whether that breadth is useful depends entirely on which part of your process is weak.',
                    'If the only weak part is how you come across in an interview, breadth is not an advantage and a human session is the better hour.',
                ],
            },
        ],
        faqs: [
            { question: 'Is an AI mock interview as good as a human one?', answer: 'For feedback on how you come across, no. A senior engineer who has run that company\'s loop gives you something no generated feedback matches. For repetition until an answer is fluent, availability matters more than fidelity, and that is where an always-on mock wins.' },
            { question: 'Should I use both interviewing.io and ShipItHQ?', answer: 'That is the sensible shape for most people. Rehearse until the answer comes out cleanly, then spend a human session on the part you cannot judge yourself - your presence, your pacing, and how you handle being wrong.' },
            { question: 'What does interviewing.io cost?', answer: 'They do not publish prices publicly. Their front page offers a free AI interviewer and paid sessions with human interviewers, and directs you to sign up for details. We do not quote a figure we cannot source.' },
            { question: 'Does ShipItHQ offer interviews with real engineers?', answer: 'No. The mock interviews are AI, voice-based and available on demand. If you want a human who has run a specific company\'s loop, book one - that is a genuinely different product and we are not pretending otherwise.' },
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
