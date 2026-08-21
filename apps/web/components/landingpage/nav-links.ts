import {
    Code2, FolderKanban, Video, Sparkles, Briefcase, Coins,
    BookOpen, Tags, Users, Mail, Swords, Scale, ShieldCheck,
    MessagesSquare, Braces, FileText,
} from 'lucide-react'

/**
 * The marketing navigation, as data.
 *
 * Separated from the navbar component for one reason: the desktop dropdown and the mobile
 * accordion have to stay in sync, and they are different renderings in different parts of
 * the file. When they were two literal arrays they drifted - which is the same failure the
 * three blog cards had.
 *
 * ── Descriptions are not decoration ──
 *
 * `02-navigation.md`: *"A dropdown of seven bare words makes the reader do the work of
 * guessing what each one is; a description does it for them, and it is also where the
 * honest scope of a feature can be stated."*
 *
 * So every row has one, and they are short enough to read at a glance while the mouse is
 * still moving.
 *
 * ── Every href resolves ──
 *
 * A dropdown row that 404s is worse than a missing dropdown. The Compare rows exist because
 * `/compare/leetcode` and `/compare/interviewing-io` were built first; the Features anchors
 * exist because those `id`s are in `features/_components/feature-modules.ts`. Adding a row
 * here without the page is the one change that must not happen.
 */

export type NavIcon = typeof Code2

export interface NavChild {
    href: string
    title: string
    description: string
    icon: NavIcon
}

export interface NavItem {
    /** Where the top-level label itself goes. Always a real page, never `#`. */
    href: string
    label: string
    children?: readonly NavChild[]
}

export const NAV_ITEMS: readonly NavItem[] = [
    {
        href: '/features',
        label: 'Features',
        children: [
            {
                href: '/features#practice',
                title: 'Practice',
                description: 'DSA, system design and web tracks, run in a real Linux container',
                icon: Code2,
            },
            {
                href: '/features#projects',
                title: 'Projects',
                description: 'A brief to build, then an interview about what you built',
                icon: FolderKanban,
            },
            {
                href: '/features#mock',
                title: 'Mock interviews',
                description: 'Voice mocks with no scheduling and nobody to owe a favour to',
                icon: Video,
            },
            {
                href: '/features#ai',
                title: 'AI tools',
                description: 'ATS scoring, resume tailoring and cover letters from your own resume',
                icon: Sparkles,
            },
            {
                href: '/features#jobs',
                title: 'Jobs',
                description: 'Browse roles, save them, and track what you applied to',
                icon: Briefcase,
            },
            {
                href: '/features#credits',
                title: 'Credits',
                description: '100 free at signup, no expiry, no subscription',
                icon: Coins,
            },
        ],
    },
    {
        href: '/compare',
        label: 'Compare',
        children: [
            {
                href: '/compare/leetcode',
                title: 'vs LeetCode',
                description: 'One is a problem bank. The other is everything around the problems',
                icon: Swords,
            },
            {
                href: '/compare/interviewing-io',
                title: 'vs interviewing.io',
                description: 'Human interviewers, versus a rehearsal room open at 1am',
                icon: Swords,
            },
            {
                href: '/compare',
                title: 'How we write these',
                description: 'What the alternative is good at comes first, and no prices from memory',
                icon: Scale,
            },
        ],
    },
    {
        href: '/blogs',
        label: 'Resources',
        children: [
            {
                href: '/blogs',
                title: 'Blog',
                description: '30 guides on interview prep, DSA, resumes and careers',
                icon: BookOpen,
            },
            {
                href: '/blogs/topics/interview-prep',
                title: 'Interview prep',
                description: 'Phone screens, behavioural rounds, system design and mocks',
                icon: MessagesSquare,
            },
            {
                href: '/blogs/topics/dsa',
                title: 'DSA and practice',
                description: 'The fifteen patterns, complexity, and a three-month plan',
                icon: Braces,
            },
            {
                href: '/blogs/topics/resume',
                title: 'Resume and applications',
                description: 'What a parser extracts, and the bullets a human reads',
                icon: FileText,
            },
            {
                href: '/blogs/topics/portfolio',
                title: 'Portfolio and projects',
                description: 'What to build, how to finish it, and how to deploy it',
                icon: FolderKanban,
            },
            {
                href: '/blogs',
                title: 'All topics',
                description: 'Seven hubs, each with a reading path',
                icon: Tags,
            },
        ],
    },
    // ── Company ──
    //
    // Added after a manual pass found that the legal pages were reachable only from the
    // footer, and that About and Contact were buried in Resources - which is the last
    // place somebody looks for "who is this company". A visitor checking whether a product
    // is real goes looking for exactly these four, and making them hunt is its own signal.
    {
        href: '/aboutus',
        label: 'Company',
        children: [
            {
                href: '/aboutus',
                title: 'About',
                description: 'Who is building this, and what it deliberately does not do',
                icon: Users,
            },
            {
                href: '/aboutus#contact',
                title: 'Contact',
                description: 'Questions, bugs, and anything we have got wrong',
                icon: Mail,
            },
            {
                href: '/termsofservice',
                title: 'Terms of service',
                description: 'What you agree to, in language you can actually read',
                icon: Scale,
            },
            {
                href: '/privacypolicy',
                title: 'Privacy policy',
                description: 'What we store, why, and what we do not collect',
                icon: ShieldCheck,
            },
        ],
    },
    // Top-level, not a dropdown row. It is the second most-clicked item on a marketing
    // site and burying it costs conversions - see 02-navigation.md.
    { href: '/pricing', label: 'Pricing' },
] as const
