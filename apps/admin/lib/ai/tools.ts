import { and, desc, eq, ilike, count, sql } from "drizzle-orm"
import {
    db, users, feedbacks, creditTransactions, payments, companies, universities, feedbackStatusEnum,
} from "@repo/db"
import { getEffectivePermissions, hasPermission, type AdminPermission, type AdminPermissions } from "@/lib/navigation"

// ─────────────────────────────────────────────────────────────────────────────
// Agent tools for the ShipItHQ admin console assistant.
//
// Ported from apps/main's lib/ai/tools.ts, cut down for v1 - see
// plan/admin/tasks.md ADM-19. The design rules are the same, with one added:
//
//  1. Every tool is scoped to the CALLING ADMIN'S permissions, not just their
//     identity. `apps/main`'s tools only need a userId because every user reads
//     their own data; here a TEAM_MEMBER without a `feedback` grant asking the
//     agent about feedback must get the same refusal the page would give them.
//     The route binds `adminRole` and `permissions` from the session - a
//     hallucinated argument cannot request a module the model was not told
//     about, because the tool checks the REAL grant, not anything the model
//     passes.
//  2. READ ONLY. No write tool ships in this pass - see the ADM-19 note on why
//     apps/main's one write tool clears a bar nothing here does yet.
//  3. Results are capped and projected to the few columns worth the tokens.
//  4. Every handler returns a plain object, never throws.
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolSpec {
    type: "function"
    function: {
        name: string
        description: string
        parameters: {
            type: "object"
            properties: Record<string, unknown>
            required?: string[]
            additionalProperties: false
        }
    }
}

export interface ToolCaller {
    adminRole: string
    permissions: AdminPermissions
}

type Handler = (args: Record<string, unknown>, caller: ToolCaller) => Promise<unknown>

export interface ToolOutcome {
    result: unknown
}

function stringArg(raw: unknown, max = 120): string | null {
    const s = typeof raw === "string" ? raw.trim().slice(0, max) : ""
    return s.length ? s : null
}

function limitArg(raw: unknown, fallback: number, max: number): number {
    const n = typeof raw === "number" ? Math.floor(raw) : Number.parseInt(String(raw ?? ""), 10)
    if (!Number.isFinite(n) || n < 1) return fallback
    return Math.min(n, max)
}

/** Every handler below calls this first. A denial is a normal tool result (the
 *  model gets told plainly, not an exception that would abort the turn), so
 *  the assistant can say "I don't have access to that" instead of pretending
 *  the tool doesn't exist. */
function denyUnless(caller: ToolCaller, module: AdminPermission): { error: string } | null {
    const effective = getEffectivePermissions(caller.adminRole, caller.permissions)
    if (hasPermission(effective, module, "read")) return null
    return {
        error: "forbidden",
    } as { error: string }
}

// ── search_users ─────────────────────────────────────────────────────────────

const searchUsers: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "users")
    if (denied) return denied

    const query = stringArg(args.query)
    const limit = limitArg(args.limit, 10, 25)

    const rows = await db
        .select({
            id: users.id, name: users.name, email: users.email, role: users.role,
            credits: users.credits, createdAt: users.createdAt,
        })
        .from(users)
        .where(query ? ilike(users.email, `%${query}%`) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limit)

    return {
        _summary: `Found ${rows.length} user${rows.length === 1 ? "" : "s"}`,
        users: rows,
    }
}

// ── get_user ──────────────────────────────────────────────────────────────────

const getUser: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "users")
    if (denied) return denied

    const email = stringArg(args.email)
    if (!email) return { error: "invalid_arguments", message: "email is required" }

    const [user] = await db
        .select({
            id: users.id, name: users.name, email: users.email, role: users.role,
            credits: users.credits, totalCredits: users.totalCredits,
            currentXp: users.currentXp, currentLevel: users.currentLevel,
            createdAt: users.createdAt, lastActiveDate: users.lastActiveDate,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

    if (!user) return { error: "not_found", message: `No user with email ${email}` }
    return { _summary: `Found ${user.name ?? user.email}`, user }
}

// ── get_credit_summary ────────────────────────────────────────────────────────

const getCreditSummary: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "credits")
    if (denied) return denied

    const email = stringArg(args.email)

    if (email) {
        const [user] = await db
            .select({ id: users.id, name: users.name, credits: users.credits, totalCredits: users.totalCredits })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
        if (!user) return { error: "not_found", message: `No user with email ${email}` }

        const recent = await db
            .select({ amount: creditTransactions.amount, type: creditTransactions.type, description: creditTransactions.description, createdAt: creditTransactions.createdAt })
            .from(creditTransactions)
            .where(eq(creditTransactions.userId, user.id))
            .orderBy(desc(creditTransactions.createdAt))
            .limit(10)

        return {
            _summary: `${user.name ?? "This user"} has ${user.credits} credits`,
            user: { name: user.name, currentBalance: user.credits, lifetimeEarned: user.totalCredits },
            recentTransactions: recent,
        }
    }

    const [totals] = await db
        .select({ totalOutstanding: sql<number>`coalesce(sum(${users.credits}), 0)`, userCount: count() })
        .from(users)
    const [paymentTotals] = await db
        .select({ totalPayments: count(), totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(eq(payments.status, "COMPLETED"))

    return {
        _summary: `${totals?.totalOutstanding ?? 0} credits outstanding across ${totals?.userCount ?? 0} users`,
        platform: {
            totalCreditsOutstanding: totals?.totalOutstanding ?? 0,
            totalUsers: totals?.userCount ?? 0,
            completedPayments: paymentTotals?.totalPayments ?? 0,
            totalRevenue: paymentTotals?.totalRevenue ?? 0,
        },
    }
}

// ── search_feedback ───────────────────────────────────────────────────────────

const searchFeedback: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "feedback")
    if (denied) return denied

    const status = stringArg(args.status, 40)
    const limit = limitArg(args.limit, 10, 25)

    const rows = await db
        .select({
            id: feedbacks.id, title: feedbacks.title, category: feedbacks.category,
            status: feedbacks.status, upvotes: feedbacks.upvotes, createdAt: feedbacks.createdAt,
        })
        .from(feedbacks)
        .where(
            status && (feedbackStatusEnum.enumValues as readonly string[]).includes(status)
                ? eq(feedbacks.status, status as (typeof feedbackStatusEnum.enumValues)[number])
                : undefined,
        )
        .orderBy(desc(feedbacks.createdAt))
        .limit(limit)

    return { _summary: `Found ${rows.length} feedback item${rows.length === 1 ? "" : "s"}`, feedback: rows }
}

// ── get_platform_stats ────────────────────────────────────────────────────────

const getPlatformStats: Handler = async (_args, caller) => {
    const denied = denyUnless(caller, "analytics")
    if (denied) return denied

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [userTotals] = await db.select({ total: count() }).from(users)
    const [newThisWeek] = await db.select({ total: count() }).from(users).where(sql`${users.createdAt} >= ${since}`)
    const [feedbackTotals] = await db.select({ total: count() }).from(feedbacks)
    const [pendingFeedback] = await db.select({ total: count() }).from(feedbacks).where(eq(feedbacks.status, "UNDER_REVIEW"))

    return {
        _summary: `${userTotals?.total ?? 0} total users, ${newThisWeek?.total ?? 0} new this week`,
        totalUsers: userTotals?.total ?? 0,
        newUsersThisWeek: newThisWeek?.total ?? 0,
        totalFeedback: feedbackTotals?.total ?? 0,
        pendingFeedback: pendingFeedback?.total ?? 0,
    }
}

// ── search_companies ──────────────────────────────────────────────────────────

const searchCompanies: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "hiring")
    if (denied) return denied

    const query = stringArg(args.query)
    const limit = limitArg(args.limit, 10, 25)

    const rows = await db
        .select({
            id: companies.id, name: companies.name, industry: companies.industry,
            verificationStatus: companies.verificationStatus, createdAt: companies.createdAt,
        })
        .from(companies)
        .where(query ? ilike(companies.name, `%${query}%`) : undefined)
        .orderBy(desc(companies.createdAt))
        .limit(limit)

    return { _summary: `Found ${rows.length} compan${rows.length === 1 ? "y" : "ies"}`, companies: rows }
}

// ── search_universities ───────────────────────────────────────────────────────

const searchUniversities: Handler = async (args, caller) => {
    const denied = denyUnless(caller, "university")
    if (denied) return denied

    const query = stringArg(args.query)
    const limit = limitArg(args.limit, 10, 25)

    const rows = await db
        .select({
            id: universities.id, name: universities.name, city: universities.city,
            verificationStatus: universities.verificationStatus, createdAt: universities.createdAt,
        })
        .from(universities)
        .where(query ? ilike(universities.name, `%${query}%`) : undefined)
        .orderBy(desc(universities.createdAt))
        .limit(limit)

    return { _summary: `Found ${rows.length} universit${rows.length === 1 ? "y" : "ies"}`, universities: rows }
}

// ── Registry ───────────────────────────────────────────────────────────────────

export const TOOL_SPECS: ToolSpec[] = [
    {
        type: "function",
        function: {
            name: "search_users",
            description: "Search ShipItHQ users by email fragment. Returns the most recent matches.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Email fragment to search for. Omit to list the most recent signups." },
                    limit: { type: "number", description: "Max results, default 10, capped at 25." },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_user",
            description: "Look up one user by their exact email address.",
            parameters: {
                type: "object",
                properties: { email: { type: "string", description: "The user's exact email address." } },
                required: ["email"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_credit_summary",
            description: "Get credit balance and recent transactions for one user by email, or platform-wide credit and revenue totals when no email is given.",
            parameters: {
                type: "object",
                properties: { email: { type: "string", description: "Omit for platform-wide totals." } },
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_feedback",
            description: "Search user feedback, optionally filtered by status (e.g. UNDER_REVIEW, PLANNED, COMPLETED, DECLINED).",
            parameters: {
                type: "object",
                properties: {
                    status: { type: "string", description: "Exact feedback status to filter on. Omit for all statuses." },
                    limit: { type: "number", description: "Max results, default 10, capped at 25." },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_platform_stats",
            description: "Get top-level platform stats: total users, new signups this week, total and pending feedback.",
            parameters: { type: "object", properties: {}, additionalProperties: false },
        },
    },
    {
        type: "function",
        function: {
            name: "search_companies",
            description: "Search hiring-platform companies by name.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Name fragment to search for. Omit to list the most recently added." },
                    limit: { type: "number", description: "Max results, default 10, capped at 25." },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_universities",
            description: "Search university-platform universities by name.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Name fragment to search for. Omit to list the most recently added." },
                    limit: { type: "number", description: "Max results, default 10, capped at 25." },
                },
                additionalProperties: false,
            },
        },
    },
]

const HANDLERS: Record<string, Handler> = {
    search_users: searchUsers,
    get_user: getUser,
    get_credit_summary: getCreditSummary,
    search_feedback: searchFeedback,
    get_platform_stats: getPlatformStats,
    search_companies: searchCompanies,
    search_universities: searchUniversities,
}

export async function runTool(name: string, rawArgs: string, caller: ToolCaller): Promise<ToolOutcome | null> {
    const handler = HANDLERS[name]
    if (!handler) return null

    let args: Record<string, unknown> = {}
    try {
        args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {}
    } catch {
        return { result: { error: "invalid_arguments", message: "Could not parse tool arguments." } }
    }

    const result = await handler(args, caller)
    return { result }
}
