/**
 * Everywhere in the product the assistant is allowed to send someone.
 *
 * ── Why this is a table and not a sentence in the prompt ──
 *
 * The assistant kept ending good answers with nowhere to go. It would list five project ideas
 * and stop; describe the resume builder and stop. The obvious fix is to let it write links -
 * and that is the wrong fix, because a model writing a URL is a model guessing a URL. It does
 * not know this app's routes, it will happily invent `/dashboard/resume-builder`, and a
 * confidently wrong link is worse than no link.
 *
 * So the model never writes a path. It picks an `id` from this list, and the ROUTE turns that
 * id into a button using the href written here. An id it invents resolves to nothing and is
 * dropped, which is the failure mode we want: silence rather than a dead end.
 *
 * ── Keeping it honest ──
 *
 * Every `href` here must be a real route. `scripts/check-nav.mjs` already proves that for the
 * sidebar; this table is checked the same way by `scripts/check-destinations.mjs`, for exactly
 * the reason the nav one exists - a wrong path here has no symptom until somebody taps it.
 */

export interface Destination {
    /** What the model passes. Stable: renaming one silently breaks older conversations. */
    id: string
    /** Real route. Must resolve literally - see the checker. */
    href: string
    /** Button text. Written as an action, because it is one. */
    label: string
    /** Shown to the model so it can choose. Says what is THERE, not what it is called. */
    description: string
}

export const DESTINATIONS: readonly Destination[] = [
    {
        id: "practice_dsa",
        href: "/practice/dsa",
        label: "Open DSA practice",
        description: "Data structures and algorithms problems that run against real test cases.",
    },
    {
        id: "practice_system_design",
        href: "/practice/system-design",
        label: "Open system design practice",
        description: "System design exercises.",
    },
    {
        id: "practice_web_frontend",
        href: "/practice/web-frontend",
        label: "Open frontend practice",
        description: "Frontend build exercises.",
    },
    {
        id: "practice_web_backend",
        href: "/practice/web-backend",
        label: "Open backend practice",
        description: "Backend and API exercises.",
    },
    {
        id: "project_ideas",
        href: "/projects/ideas",
        label: "Browse project ideas",
        description: "The catalogue of project ideas, browsable by technology and difficulty.",
    },
    {
        id: "my_projects",
        href: "/projects/myprojects",
        label: "Open my projects",
        description: "Projects this user is building, with their sprints and tasks.",
    },
    {
        id: "mock_interview",
        href: "/mock/voice",
        label: "Start a mock interview",
        description: "Voice mock interviews.",
    },
    {
        id: "resume_builder",
        href: "/ai/resume",
        label: "Open Resume Builder",
        description: "Create, import and tailor resumes.",
    },
    {
        id: "resume_import",
        href: "/ai/resume/import",
        label: "Import from LinkedIn or GitHub",
        description: "Build a resume automatically from a LinkedIn profile and GitHub account.",
    },
    {
        id: "cover_letter",
        href: "/ai/coverletter",
        label: "Open Cover Letters",
        description: "Generate a cover letter for a specific job posting.",
    },
    {
        id: "interview_assistant",
        href: "/pathfinder",
        label: "Open Interview Assistant",
        description: "Job-specific interview preparation built from a posting.",
    },
    {
        id: "pathfinder",
        href: "/pathfinder",
        label: "Open Pathfinder",
        description: "Long-running learning goals broken into subgoals, with progress tracking.",
    },
    {
        id: "pathfinder_explore",
        href: "/pathfinder/explore",
        label: "Explore goals",
        description: "Public Pathfinder goals made by other people, to copy or follow.",
    },
    {
        id: "jobs",
        href: "/jobs",
        label: "Browse jobs",
        description: "Job postings, with tracking for applications.",
    },
    {
        id: "profile",
        href: "/profile",
        label: "Open my profile",
        description: "Skills, experience, education, projects and the uploaded resume.",
    },
    {
        id: "purchase",
        href: "/purchase",
        label: "Buy credits",
        description: "Top up credits. Use when the user is out of credits or asks what things cost.",
    },
    {
        id: "settings",
        href: "/settings/account",
        label: "Open settings",
        description: "Account details, password, connected accounts and integrations.",
    },
] as const

const BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]))

/** Resolve an id the model supplied. Unknown ids return null and are dropped by the caller. */
export function resolveDestination(id: unknown): Destination | null {
    return typeof id === "string" ? (BY_ID.get(id) ?? null) : null
}

/** The list as the model sees it, for the tool's parameter description. */
export const DESTINATION_IDS: readonly string[] = DESTINATIONS.map((d) => d.id)
