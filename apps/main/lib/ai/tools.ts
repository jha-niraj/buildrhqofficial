import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
    db, users, projectsV2, projectIdeas, userProjectV2Progress,
    pathfinderGoals, practiceModuleProgress, jobs, companies, resumeDraft,
} from "@repo/db";

// ─────────────────────────────────────────────────────────────────────────────
// Agent tools for the ShipItHQ assistant.
//
// Design rules, all of which exist because the model decides when these run:
//
//  1. EVERY tool is scoped to the calling user's id, which the model never sees
//     and cannot pass. `userId` is bound by the route from the session, so a
//     hallucinated argument cannot read someone else's rows.
//  2. READ ONLY. Nothing here writes, and nothing takes a free-form SQL or path
//     argument. A tool the model can be talked into misusing is not a tool.
//  3. Results are capped and projected down to the few columns worth spending
//     tokens on. Returning a whole row would blow the context on jsonb blobs
//     (`stacks`, `assistantRaw`) that say nothing useful in a chat reply.
//  4. Every handler returns a plain object, never throws. A tool that throws
//     would abort the turn; a tool that returns `{ error }` lets the model
//     explain the problem.
// ─────────────────────────────────────────────────────────────────────────────

/** OpenAI function-tool shape. Kept local so this file has no SDK dependency. */
export interface ToolSpec {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
            additionalProperties: false;
        };
    };
}

type Handler = (args: Record<string, unknown>, userId: string) => Promise<unknown>;

/** Clamp a model-supplied count into a range we're willing to pay for. */
function limitArg(raw: unknown, fallback: number, max: number): number {
    const n = typeof raw === "number" ? Math.floor(raw) : Number.parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(n, max);
}

function stringArg(raw: unknown, max = 120): string | null {
    if (typeof raw !== "string") return null;
    const s = raw.trim().slice(0, max);
    return s.length ? s : null;
}

// ── get_my_profile ───────────────────────────────────────────────────────────

const getMyProfile: Handler = async (_args, userId) => {
    const [row] = await db
        .select({
            name: users.name,
            username: users.username,
            headline: users.headline,
            bio: users.bio,
            university: users.university,
            semester: users.semester,
            company: users.company,
            occupation: users.occupation,
            yearsOfExperience: users.yearsOfExperience,
            interests: users.interests,
            learningPreferences: users.learningPreferences,
            careerGoals: users.careerGoals,
            targetCompanies: users.targetCompanies,
            openToWork: users.openToWork,
            hasResume: users.hasResume,
            credits: users.credits,
            currentLevel: users.currentLevel,
            totalXp: users.totalXp,
            streak: users.streak,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!row) return { error: "Profile not found." };
    return row;
};

// ── get_my_resume ────────────────────────────────────────────────────────────

/**
 * The user's default resume, as structured content.
 *
 * This is the tool that makes "tailor this for me" work without the user pasting
 * their background into the chat. It reads the resume they marked as default;
 * failing that, their most recently updated one; failing that, the raw text
 * extracted from whatever they uploaded, which is all a user who has only ever
 * dropped in a PDF will have until the structuring job lands.
 *
 * Bullets are capped rather than returned whole: a long resume is several
 * thousand tokens of context on every turn that mentions it, and the tail of a
 * ten-bullet role is not what the model is reasoning about.
 */
const getMyResume: Handler = async (_args, userId) => {
    const [draft] = await db
        .select({
            name: resumeDraft.name,
            content: resumeDraft.content,
            isDefault: resumeDraft.isDefault,
            tailoredFor: resumeDraft.tailoredFor,
            updatedAt: resumeDraft.updatedAt,
        })
        .from(resumeDraft)
        .where(eq(resumeDraft.userId, userId))
        // Default first, then most recently touched - the same order
        // `getDefaultResumeDraft` uses, so the assistant and the app never
        // disagree about which resume is "theirs".
        .orderBy(desc(resumeDraft.isDefault), desc(resumeDraft.updatedAt))
        .limit(1);

    if (draft) {
        const content = (draft.content ?? {}) as {
            header?: Record<string, unknown>;
            experience?: Array<{ company?: string; role?: string; startDate?: string; endDate?: string; current?: boolean; bullets?: string[] }>;
            projects?: Array<{ name?: string; description?: string; technologies?: string[] }>;
            education?: Array<{ institution?: string; degree?: string; field?: string; endDate?: string }>;
            skills?: Array<{ category?: string; items?: string[] }>;
            certifications?: Array<{ name?: string; issuer?: string }>;
        };
        const header = (content.header ?? {}) as Record<string, string | null>;
        return {
            source: "resume",
            resumeName: draft.name,
            isDefault: draft.isDefault,
            tailoredFor: draft.tailoredFor,
            headline: header.title ?? null,
            summary: header.summary ?? null,
            location: header.location ?? null,
            experience: (content.experience ?? []).slice(0, 8).map((e) => ({
                company: e.company,
                role: e.role,
                startDate: e.startDate,
                endDate: e.current ? "Present" : e.endDate,
                bullets: (e.bullets ?? []).slice(0, 5),
            })),
            projects: (content.projects ?? []).slice(0, 6).map((p) => ({
                name: p.name,
                description: p.description,
                technologies: p.technologies,
            })),
            education: (content.education ?? []).slice(0, 4),
            skills: content.skills ?? [],
            certifications: (content.certifications ?? []).slice(0, 6),
        };
    }

    // No structured resume yet. The raw upload is still better than nothing, and
    // saying so lets the model explain why its answer is rougher than usual.
    const [row] = await db
        .select({ hasResume: users.hasResume, resumeText: users.resumeText })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (row?.resumeText) {
        return {
            source: "uploaded_text",
            note: "Raw text from the user's uploaded resume. It has not been parsed into sections yet, so treat the structure loosely.",
            text: row.resumeText.slice(0, 6000),
        };
    }

    return {
        source: "none",
        hasResume: row?.hasResume ?? false,
        note: "This user has no resume on ShipItHQ yet. Suggest they upload one or build one at /ai/resume before giving resume-specific advice.",
    };
};

// ── list_my_projects ─────────────────────────────────────────────────────────

const PROJECT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const listMyProjects: Handler = async (args, userId) => {
    const limit = limitArg(args.limit, 10, 25);
    const status = stringArg(args.status, 20)?.toUpperCase();
    const wanted = PROJECT_STATUSES.includes(status as ProjectStatus)
        ? (status as ProjectStatus)
        : null;

    const rows = await db
        .select({
            title: projectsV2.title,
            slug: projectsV2.slug,
            difficulty: projectsV2.difficulty,
            technologies: projectsV2.technologies,
            estimatedHours: projectsV2.estimatedHours,
            status: userProjectV2Progress.status,
            progressPercentage: userProjectV2Progress.progressPercentage,
            tasksCompleted: userProjectV2Progress.tasksCompleted,
            totalTasks: userProjectV2Progress.totalTasks,
            totalScore: userProjectV2Progress.totalScore,
            startedAt: userProjectV2Progress.startedAt,
        })
        .from(userProjectV2Progress)
        .innerJoin(projectsV2, eq(projectsV2.id, userProjectV2Progress.projectId))
        .where(
            wanted
                ? and(eq(userProjectV2Progress.userId, userId), eq(userProjectV2Progress.status, wanted))
                : eq(userProjectV2Progress.userId, userId),
        )
        .orderBy(desc(userProjectV2Progress.updatedAt))
        .limit(limit);

    return { count: rows.length, projects: rows };
};

// ── list_my_goals ────────────────────────────────────────────────────────────

const listMyGoals: Handler = async (args, userId) => {
    const limit = limitArg(args.limit, 10, 25);
    const includeCompleted = args.include_completed === true;

    const rows = await db
        .select({
            title: pathfinderGoals.title,
            slug: pathfinderGoals.slug,
            category: pathfinderGoals.category,
            level: pathfinderGoals.level,
            status: pathfinderGoals.status,
            progressPercent: pathfinderGoals.progressPercent,
            completedSubGoals: pathfinderGoals.completedSubGoals,
            totalSubGoals: pathfinderGoals.totalSubGoals,
            streakDays: pathfinderGoals.streakDays,
            targetDate: pathfinderGoals.targetDate,
            lastActivityAt: pathfinderGoals.lastActivityAt,
        })
        .from(pathfinderGoals)
        .where(
            includeCompleted
                ? eq(pathfinderGoals.userId, userId)
                : and(
                    eq(pathfinderGoals.userId, userId),
                    inArray(pathfinderGoals.status, ["ACTIVE", "VERIFICATION"]),
                ),
        )
        .orderBy(desc(pathfinderGoals.lastActivityAt))
        .limit(limit);

    return { count: rows.length, goals: rows };
};

// ── get_my_practice_stats ────────────────────────────────────────────────────

const getMyPracticeStats: Handler = async (_args, userId) => {
    const rows = await db
        .select({
            module: practiceModuleProgress.module,
            completed: practiceModuleProgress.completed,
            inProgress: practiceModuleProgress.inProgress,
            totalProblems: practiceModuleProgress.totalProblems,
            easyCompleted: practiceModuleProgress.easyCompleted,
            mediumCompleted: practiceModuleProgress.mediumCompleted,
            hardCompleted: practiceModuleProgress.hardCompleted,
            currentStreak: practiceModuleProgress.currentStreak,
            longestStreak: practiceModuleProgress.longestStreak,
            averageScore: practiceModuleProgress.averageScore,
            lastPracticedAt: practiceModuleProgress.lastPracticedAt,
        })
        .from(practiceModuleProgress)
        .where(eq(practiceModuleProgress.userId, userId));

    if (rows.length === 0) {
        return { modules: [], note: "The user has not started any practice module yet." };
    }
    return { modules: rows };
};

// ── search_project_ideas ─────────────────────────────────────────────────────

const searchProjectIdeas: Handler = async (args) => {
    const limit = limitArg(args.limit, 6, 15);
    const query = stringArg(args.query, 80);
    const technology = stringArg(args.technology, 40);
    const difficulty = stringArg(args.difficulty, 20)?.toUpperCase();

    // Only APPROVED ideas are visible platform-wide; the rest are queued for
    // moderation and must never surface through a chat answer.
    const filters = [eq(projectIdeas.status, "APPROVED")];
    if (technology) {
        filters.push(
            or(
                ilike(projectIdeas.technology, `%${technology}%`),
                sql`${technology} = ANY(${projectIdeas.technologies})`,
            )!,
        );
    }
    if (difficulty && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(difficulty)) {
        filters.push(eq(projectIdeas.difficulty, difficulty));
    }
    if (query) {
        filters.push(
            or(
                ilike(projectIdeas.projectTitle, `%${query}%`),
                ilike(projectIdeas.projectDescription, `%${query}%`),
            )!,
        );
    }

    const rows = await db
        .select({
            title: projectIdeas.projectTitle,
            description: sql<string>`left(${projectIdeas.projectDescription}, 280)`,
            difficulty: projectIdeas.difficulty,
            technologies: projectIdeas.technologies,
            recruiterSignal: projectIdeas.recruiterSignal,
            upvotes: projectIdeas.upvotes,
            buildCount: projectIdeas.buildCount,
        })
        .from(projectIdeas)
        .where(and(...filters))
        .orderBy(desc(projectIdeas.upvotes))
        .limit(limit);

    return { count: rows.length, ideas: rows };
};

// ── search_jobs ──────────────────────────────────────────────────────────────

const searchJobs: Handler = async (args) => {
    const limit = limitArg(args.limit, 6, 15);
    const query = stringArg(args.query, 80);
    const locationType = stringArg(args.location_type, 20)?.toUpperCase();

    // ACTIVE + PUBLIC only: drafts, paused/closed/filled roles and invite-only
    // postings are not the assistant's to hand out.
    const filters = [eq(jobs.status, "ACTIVE"), eq(jobs.visibility, "PUBLIC")];
    if (query) {
        filters.push(
            or(ilike(jobs.title, `%${query}%`), ilike(jobs.description, `%${query}%`))!,
        );
    }
    if (locationType && ["REMOTE", "ONSITE", "HYBRID"].includes(locationType)) {
        filters.push(eq(jobs.locationType, locationType as "REMOTE" | "ONSITE" | "HYBRID"));
    }

    const rows = await db
        .select({
            title: jobs.title,
            slug: jobs.slug,
            company: companies.name,
            location: jobs.location,
            locationType: jobs.locationType,
            employmentType: jobs.employmentType,
            experienceMin: jobs.experienceMin,
            experienceMax: jobs.experienceMax,
            salaryMin: jobs.salaryMin,
            salaryMax: jobs.salaryMax,
            salaryCurrency: jobs.salaryCurrency,
            salaryDisclosed: jobs.salaryDisclosed,
            skillsRequired: jobs.skillsRequired,
        })
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(and(...filters))
        .orderBy(desc(jobs.featured), desc(jobs.createdAt))
        .limit(limit);

    // Undisclosed salary is a deliberate employer choice - strip the numbers
    // rather than let the model read them off the row and quote them.
    const jobsOut = rows.map(({ salaryDisclosed, salaryMin, salaryMax, ...rest }) => ({
        ...rest,
        salaryMin: salaryDisclosed ? salaryMin : null,
        salaryMax: salaryDisclosed ? salaryMax : null,
    }));

    return { count: jobsOut.length, jobs: jobsOut };
};

// ── Registry ─────────────────────────────────────────────────────────────────

interface Tool {
    spec: ToolSpec;
    handler: Handler;
}

const TOOLS: Tool[] = [
    {
        spec: {
            type: "function",
            function: {
                name: "get_my_profile",
                description:
                    "Read the signed-in user's ShipItHQ profile: name, headline, university, experience, stated interests and career goals, credit balance, level, XP and streak. Call this before giving personalised advice instead of asking the user to repeat things they have already told the platform.",
                parameters: { type: "object", properties: {}, additionalProperties: false },
            },
        },
        handler: getMyProfile,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "get_my_resume",
                description:
                    "Read the signed-in user's default resume on ShipItHQ: work experience with bullet points, projects, education, skills and certifications. Call this whenever the answer depends on the user's actual background - tailoring a resume or cover letter, judging fit for a job, suggesting what to learn or build next, or preparing them for an interview. Prefer it over asking the user to describe their experience.",
                parameters: { type: "object", properties: {}, additionalProperties: false },
            },
        },
        handler: getMyResume,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "list_my_projects",
                description:
                    "List the projects the signed-in user has started on ShipItHQ, with progress, task counts and score. Use when the user asks what they are working on, what to finish next, or how far along something is.",
                parameters: {
                    type: "object",
                    properties: {
                        status: {
                            type: "string",
                            enum: [...PROJECT_STATUSES],
                            description: "Only return projects in this state. Omit for all.",
                        },
                        limit: { type: "number", description: "Max projects to return (default 10, max 25)." },
                    },
                    additionalProperties: false,
                },
            },
        },
        handler: listMyProjects,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "list_my_goals",
                description:
                    "List the signed-in user's Pathfinder learning goals with progress, sub-goal counts and streak. Active and in-verification goals only unless include_completed is true.",
                parameters: {
                    type: "object",
                    properties: {
                        include_completed: {
                            type: "boolean",
                            description: "Include completed, failed and abandoned goals too.",
                        },
                        limit: { type: "number", description: "Max goals to return (default 10, max 25)." },
                    },
                    additionalProperties: false,
                },
            },
        },
        handler: listMyGoals,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "get_my_practice_stats",
                description:
                    "Read the signed-in user's practice progress per module (DSA, system design, frontend, backend): problems completed by difficulty, streaks and average score. Use before recommending what to practise next.",
                parameters: { type: "object", properties: {}, additionalProperties: false },
            },
        },
        handler: getMyPracticeStats,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "search_project_ideas",
                description:
                    "Search ShipItHQ's approved project ideas by free text, technology and difficulty, ranked by upvotes. Use when the user asks what to build next. Prefer this over inventing project ideas, so the suggestion is something they can actually start on the platform.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Free-text match on title and description." },
                        technology: { type: "string", description: "A technology such as 'React' or 'Go'." },
                        difficulty: {
                            type: "string",
                            enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
                            description: "Difficulty filter.",
                        },
                        limit: { type: "number", description: "Max ideas to return (default 6, max 15)." },
                    },
                    additionalProperties: false,
                },
            },
        },
        handler: searchProjectIdeas,
    },
    {
        spec: {
            type: "function",
            function: {
                name: "search_jobs",
                description:
                    "Search published, publicly visible job postings on ShipItHQ by free text and location type. Use when the user asks about roles they could apply to.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Free-text match on job title and description." },
                        location_type: {
                            type: "string",
                            enum: ["REMOTE", "HYBRID", "ONSITE"],
                            description: "Location arrangement filter.",
                        },
                        limit: { type: "number", description: "Max jobs to return (default 6, max 15)." },
                    },
                    additionalProperties: false,
                },
            },
        },
        handler: searchJobs,
    },
];

export const TOOL_SPECS: ToolSpec[] = TOOLS.map((t) => t.spec);

const HANDLERS = new Map(TOOLS.map((t) => [t.spec.function.name, t.handler]));

/**
 * Run one tool call on behalf of `userId` and return the JSON string that goes
 * back to the model as the tool message.
 *
 * Never throws: an unknown name, malformed arguments and a failed query all come
 * back as `{ error }` so the model can say what went wrong and carry on.
 */
export async function runTool(
    name: string,
    rawArgs: string,
    userId: string,
): Promise<string> {
    const handler = HANDLERS.get(name);
    if (!handler) return JSON.stringify({ error: `Unknown tool "${name}".` });

    let args: Record<string, unknown> = {};
    if (rawArgs?.trim()) {
        try {
            const parsed: unknown = JSON.parse(rawArgs);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                args = parsed as Record<string, unknown>;
            }
        } catch {
            return JSON.stringify({ error: "Tool arguments were not valid JSON." });
        }
    }

    try {
        const result = await handler(args, userId);
        return JSON.stringify(result);
    } catch (error: unknown) {
        console.error(`[ai/tools] ${name} failed:`, error);
        return JSON.stringify({ error: "That lookup failed. Answer without it." });
    }
}
