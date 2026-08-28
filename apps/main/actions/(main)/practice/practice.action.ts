"use server";

import { db, users, practiceProblem, practiceUserSession, practiceModuleProgress, practiceLeaderboard } from "@repo/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import type {
    PracticeProblemListItem, PracticeProblemDetail, PracticeCategory,
    PracticeProgressData, PracticeLeaderboardEntry, PracticeUserStats,
    PracticeRecentSession, PracticeSessionData, PracticeChatMessage,
} from "@/types/practice";
import { MODULE_CONFIG } from "@/types/practice";

// Re-export the PracticeModule and PracticeSessionStatus types from db schema enums
// for backward compatibility with callers that import from this file
type PracticeModule = "DSA" | "SYSTEM_DESIGN" | "WEB_FRONTEND" | "WEB_BACKEND";
type PracticeSessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

// ─────────────────────────────────────────────
// PROBLEMS
// ─────────────────────────────────────────────

export async function getProblemsForModule(
    module: PracticeModule,
    category?: string
): Promise<PracticeProblemListItem[]> {
    const session = await getSession(headers());
    const userId = session?.user?.id;

    const problems = await db.query.practiceProblem.findMany({
        where: and(
            eq(practiceProblem.module, module),
            eq(practiceProblem.isActive, true),
            ...(category ? [eq(practiceProblem.category, category)] : [])
        ),
        orderBy: (p, { asc }) => [asc(p.category), asc(p.sortOrder)],
        columns: {
            id: true,
            slug: true,
            title: true,
            module: true,
            category: true,
            difficulty: true,
            tags: true,
            sortOrder: true,
        },
        with: userId ? {
            sessions: {
                where: eq(practiceUserSession.userId, userId),
                columns: { status: true, bestScore: true },
                limit: 1,
            },
        } : undefined,
    });

    // `with` above is conditional on `userId`, so Drizzle types the row WITHOUT
    // `sessions` - it cannot know which branch ran. The runtime guard below was
    // already correct; it was `: any` on the callback that let `p.sessions`
    // compile at all. This narrows the type to match the guard instead, and the
    // session shape is DERIVED from the table rather than hand-written, so it
    // cannot drift from the columns actually selected.
    type ProblemSession = Pick<typeof practiceUserSession.$inferSelect, 'status' | 'bestScore'>;

    return problems.map((p) => {
        const sessions = (p as typeof p & { sessions?: ProblemSession[] }).sessions;
        const userSession = sessions && sessions.length > 0 ? sessions[0] : null;
        return {
            id: p.id,
            slug: p.slug,
            title: p.title,
            module: p.module,
            category: p.category,
            difficulty: p.difficulty,
            tags: p.tags,
            sortOrder: p.sortOrder,
            userStatus: userSession?.status ?? undefined,
            userBestScore: userSession?.bestScore ?? undefined,
        };
    });
}

export async function getProblemBySlug(slug: string): Promise<PracticeProblemDetail | null> {
    const problem = await db.query.practiceProblem.findFirst({
        where: eq(practiceProblem.slug, slug),
        columns: {
            id: true,
            slug: true,
            title: true,
            description: true,
            module: true,
            category: true,
            difficulty: true,
            requirements: true,
            hints: true,
            starterCode: true,
            starterCss: true,
            testCases: true,
            tags: true,
        },
    });

    if (!problem) return null;

    return {
        ...problem,
        testCases: problem.testCases as PracticeProblemDetail["testCases"],
    };
}

// ─────────────────────────────────────────────
// CATEGORIES (derived from problems)
// ─────────────────────────────────────────────

export async function getCategoriesForModule(module: PracticeModule): Promise<PracticeCategory[]> {
    const session = await getSession(headers());
    const userId = session?.user?.id;

    const problems = await db.query.practiceProblem.findMany({
        where: and(
            eq(practiceProblem.module, module),
            eq(practiceProblem.isActive, true)
        ),
        columns: { category: true },
        with: userId ? {
            sessions: {
                where: eq(practiceUserSession.userId, userId),
                columns: { status: true },
                limit: 1,
            },
        } : undefined,
    });

    const categoryMap = new Map<string, { total: number; completed: number; inProgress: number }>();

    for (const p of problems) {
        const cat = p.category;
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { total: 0, completed: 0, inProgress: 0 });
        }
        const entry = categoryMap.get(cat)!;
        entry.total++;

        if ("sessions" in p && Array.isArray(p.sessions) && p.sessions.length > 0) {
            const status = p.sessions[0]?.status;
            if (status === "COMPLETED") entry.completed++;
            else if (status === "IN_PROGRESS") entry.inProgress++;
        }
    }

    const categories = MODULE_CONFIG[module]?.categories ?? {};

    return Array.from(categoryMap.entries()).map(([slug, data]) => ({
        slug,
        name: categories[slug]?.name ?? slug,
        icon: categories[slug]?.icon ?? "📁",
        problemCount: data.total,
        completedCount: data.completed,
        inProgressCount: data.inProgress,
    }));
}

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

export async function getOrCreateSession(
    problemSlug: string,
    mode: "EXAM" | "ASSIST"
): Promise<PracticeSessionData | null> {
    const session = await getSession(headers());
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const problem = await db.query.practiceProblem.findFirst({ where: eq(practiceProblem.slug, problemSlug) });
    if (!problem) return null;

    const existing = await db.query.practiceUserSession.findFirst({
        where: and(
            eq(practiceUserSession.userId, userId),
            eq(practiceUserSession.problemId, problem.id),
            eq(practiceUserSession.mode, mode)
        ),
    });

    if (existing) {
        return {
            id: existing.id,
            userId: existing.userId,
            problemId: existing.problemId,
            module: existing.module,
            mode: existing.mode,
            status: existing.status,
            code: existing.code,
            cssCode: existing.cssCode,
            canvasData: existing.canvasData,
            language: existing.language,
            attempts: existing.attempts,
            bestScore: existing.bestScore,
            lastFeedback: existing.lastFeedback,
            requirementsMet: existing.requirementsMet as Record<string, boolean> | null,
            totalTimeSeconds: existing.totalTimeSeconds,
            startedAt: existing.startedAt,
            completedAt: existing.completedAt,
            voiceUsed: existing.voiceUsed,
            chatHistory: existing.chatHistory as PracticeChatMessage[] | null,
            xpAwarded: existing.xpAwarded,
        };
    }

    const [created] = await db.insert(practiceUserSession).values({
        userId,
        problemId: problem.id,
        module: problem.module,
        mode,
        code: problem.starterCode ?? "",
        cssCode: problem.starterCss ?? "",
        language: "javascript",
    }).returning();

    return {
        id: created!.id,
        userId: created!.userId,
        problemId: created!.problemId,
        module: created!.module,
        mode: created!.mode,
        status: created!.status,
        code: created!.code,
        cssCode: created!.cssCode,
        canvasData: created!.canvasData,
        language: created!.language,
        attempts: created!.attempts,
        bestScore: created!.bestScore,
        lastFeedback: created!.lastFeedback,
        requirementsMet: null,
        totalTimeSeconds: created!.totalTimeSeconds,
        startedAt: created!.startedAt,
        completedAt: created!.completedAt,
        voiceUsed: created!.voiceUsed,
        chatHistory: null,
        xpAwarded: created!.xpAwarded,
    };
}

export async function saveSessionProgress(
    sessionId: string,
    data: {
        code?: string;
        cssCode?: string;
        canvasData?: unknown;
        language?: string;
        chatHistory?: PracticeChatMessage[];
        totalTimeSeconds?: number;
    }
): Promise<boolean> {
    const session = await getSession(headers());
    if (!session?.user?.id) return false;

    try {
        await db.update(practiceUserSession)
            .set({
                ...(data.code !== undefined ? { code: data.code } : {}),
                ...(data.cssCode !== undefined ? { cssCode: data.cssCode } : {}),
                ...(data.canvasData !== undefined ? { canvasData: data.canvasData as object } : {}),
                ...(data.language !== undefined ? { language: data.language } : {}),
                ...(data.chatHistory !== undefined ? { chatHistory: data.chatHistory as object[] } : {}),
                ...(data.totalTimeSeconds !== undefined ? { totalTimeSeconds: data.totalTimeSeconds } : {}),
            })
            .where(and(
                eq(practiceUserSession.id, sessionId),
                eq(practiceUserSession.userId, session.user.id)
            ));
        return true;
    } catch {
        return false;
    }
}

export async function updateSessionAfterAssess(
    sessionId: string,
    data: {
        score: number;
        feedback: string;
        requirementsMet: Record<string, boolean>;
        xpAwarded: number;
    }
): Promise<boolean> {
    const session = await getSession(headers());
    if (!session?.user?.id) return false;

    try {
        const current = await db.query.practiceUserSession.findFirst({
            where: and(
                eq(practiceUserSession.id, sessionId),
                eq(practiceUserSession.userId, session.user.id)
            ),
        });
        if (!current) return false;

        const newBestScore = Math.max(current.bestScore, data.score);
        const allMet = Object.values(data.requirementsMet).every(Boolean);
        const newStatus: PracticeSessionStatus = allMet && data.score >= 80 ? "COMPLETED" : "IN_PROGRESS";

        await db.update(practiceUserSession)
            .set({
                attempts: sql`${practiceUserSession.attempts} + 1`,
                bestScore: newBestScore,
                lastFeedback: data.feedback,
                requirementsMet: data.requirementsMet,
                status: newStatus,
                xpAwarded: sql`${practiceUserSession.xpAwarded} + ${data.xpAwarded}`,
                ...(newStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
            })
            .where(eq(practiceUserSession.id, sessionId));

        if (newStatus === "COMPLETED" && current.status !== "COMPLETED") {
            await updateModuleProgress(session.user.id, current.module, current.problemId);
        }

        return true;
    } catch {
        return false;
    }
}

// ─────────────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────────────

async function updateModuleProgress(userId: string, module: PracticeModule, completedProblemId: string) {
    const problem = await db.query.practiceProblem.findFirst({ where: eq(practiceProblem.id, completedProblemId) });
    if (!problem) return;

    const difficultyXP: Record<string, number> = { EASY: 25, MEDIUM: 50, HARD: 100 };
    const xp = difficultyXP[problem.difficulty] ?? 25;

    const existing = await db.query.practiceModuleProgress.findFirst({
        where: and(
            eq(practiceModuleProgress.userId, userId),
            eq(practiceModuleProgress.module, module)
        ),
    });

    const diffKey = `${problem.difficulty.toLowerCase()}Completed` as any;

    if (existing) {
        await db.update(practiceModuleProgress)
            .set({
                completed: sql`${practiceModuleProgress.completed} + 1`,
                totalXP: sql`${practiceModuleProgress.totalXP} + ${xp}`,
                lastPracticedAt: new Date(),
                [diffKey]: sql`${(practiceModuleProgress as any)[diffKey]} + 1`,
            })
            .where(eq(practiceModuleProgress.id, existing.id));
    } else {
        await db.insert(practiceModuleProgress).values({
            userId,
            module,
            completed: 1,
            totalXP: xp,
            lastPracticedAt: new Date(),
            currentStreak: 1,
            longestStreak: 1,
            [diffKey]: 1,
        });
    }

    // Calculate streak
    const streakProgress = await db.query.practiceModuleProgress.findFirst({
        where: and(
            eq(practiceModuleProgress.userId, userId),
            eq(practiceModuleProgress.module, module)
        ),
    });
    if (streakProgress) {
        const lastPracticed = streakProgress.lastPracticedAt;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let newStreak = streakProgress.currentStreak;
        if (lastPracticed) {
            const lastDate = new Date(lastPracticed.getFullYear(), lastPracticed.getMonth(), lastPracticed.getDate());
            const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak = streakProgress.currentStreak + 1;
            } else if (diffDays > 1) {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        const newLongest = Math.max(streakProgress.longestStreak, newStreak);

        await db.update(practiceModuleProgress)
            .set({ currentStreak: newStreak, longestStreak: newLongest })
            .where(eq(practiceModuleProgress.id, streakProgress.id));
    }

    // Update leaderboard
    const progress = await db.query.practiceModuleProgress.findFirst({
        where: and(
            eq(practiceModuleProgress.userId, userId),
            eq(practiceModuleProgress.module, module)
        ),
    });
    if (progress) {
        const existingLb = await db.query.practiceLeaderboard.findFirst({
            where: and(
                eq(practiceLeaderboard.userId, userId),
                eq(practiceLeaderboard.module, module)
            ),
        });

        if (existingLb) {
            await db.update(practiceLeaderboard)
                .set({
                    totalXP: progress.totalXP,
                    completed: progress.completed,
                    averageScore: progress.averageScore,
                    streak: progress.currentStreak,
                })
                .where(eq(practiceLeaderboard.id, existingLb.id));
        } else {
            await db.insert(practiceLeaderboard).values({
                userId,
                module,
                totalXP: progress.totalXP,
                completed: progress.completed,
                averageScore: progress.averageScore,
                streak: progress.currentStreak,
            });
        }
    }

    // Award XP to user
    await db.update(users)
        .set({
            currentXp: sql`${users.currentXp} + ${xp}`,
            totalXp: sql`${users.totalXp} + ${xp}`,
        })
        .where(eq(users.id, userId));
}

export async function getModuleProgress(module: PracticeModule): Promise<PracticeProgressData | null> {
    const session = await getSession(headers());
    if (!session?.user?.id) return null;

    const progress = await db.query.practiceModuleProgress.findFirst({
        where: and(
            eq(practiceModuleProgress.userId, session.user.id),
            eq(practiceModuleProgress.module, module)
        ),
    });

    const totalProblemsArr = await db.select({ count: sql<number>`count(*)` })
        .from(practiceProblem)
        .where(and(eq(practiceProblem.module, module), eq(practiceProblem.isActive, true)));
    const totalProblems = Number(totalProblemsArr[0]?.count ?? 0);

    if (!progress) {
        return {
            module,
            totalProblems,
            completed: 0,
            inProgress: 0,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastPracticedAt: null,
            easyCompleted: 0,
            mediumCompleted: 0,
            hardCompleted: 0,
            averageScore: 0,
        };
    }

    const inProgressArr = await db.select({ count: sql<number>`count(*)` })
        .from(practiceUserSession)
        .where(and(
            eq(practiceUserSession.userId, session.user.id),
            eq(practiceUserSession.module, module),
            eq(practiceUserSession.status, "IN_PROGRESS")
        ));
    const inProgress = Number(inProgressArr[0]?.count ?? 0);

    return {
        module,
        totalProblems,
        completed: progress.completed,
        inProgress,
        totalXP: progress.totalXP,
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        lastPracticedAt: progress.lastPracticedAt,
        easyCompleted: progress.easyCompleted,
        mediumCompleted: progress.mediumCompleted,
        hardCompleted: progress.hardCompleted,
        averageScore: progress.averageScore,
    };
}

// ─────────────────────────────────────────────
// DAILY CHALLENGE
// ─────────────────────────────────────────────

export async function getDailyChallenge(): Promise<{
    problem: {
        slug: string;
        title: string;
        module: PracticeModule;
        difficulty: "EASY" | "MEDIUM" | "HARD";
        category: string;
    } | null;
}> {
    try {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

        const problems = await db.query.practiceProblem.findMany({
            where: eq(practiceProblem.isActive, true),
            columns: { slug: true, title: true, module: true, difficulty: true, category: true },
        });

        if (problems.length === 0) return { problem: null };

        const index = seed % problems.length;
        const p = problems[index]!;
        return {
            problem: {
                slug: p.slug,
                title: p.title,
                module: p.module as PracticeModule,
                difficulty: p.difficulty as "EASY" | "MEDIUM" | "HARD",
                category: p.category,
            },
        };
    } catch {
        return { problem: null };
    }
}

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────

export async function getLeaderboard(
    module: PracticeModule,
    limit: number = 25
): Promise<PracticeLeaderboardEntry[]> {
    const entries = await db.query.practiceLeaderboard.findMany({
        where: eq(practiceLeaderboard.module, module),
        orderBy: (lb, { desc }) => [desc(lb.totalXP)],
        limit,
        with: {
            user: {
                columns: { name: true, image: true },
            },
        },
    });

    return entries.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        userName: e.user.name,
        userImage: e.user.image,
        totalXP: e.totalXP,
        completed: e.completed,
        averageScore: e.averageScore,
        streak: e.streak,
    }));
}

// ─────────────────────────────────────────────
// USER STATS (Dashboard)
// ─────────────────────────────────────────────

export async function getUserPracticeStats(): Promise<PracticeUserStats | null> {
    const session = await getSession(headers());
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    const [modules, sessions, _totalProblemsArr] = await Promise.all([
        db.query.practiceModuleProgress.findMany({ where: eq(practiceModuleProgress.userId, userId) }),
        db.query.practiceUserSession.findMany({
            where: eq(practiceUserSession.userId, userId),
            orderBy: (s, { desc }) => [desc(s.updatedAt)],
            limit: 10,
            with: {
                problem: {
                    columns: { title: true, slug: true, category: true, difficulty: true, module: true },
                },
            },
        }),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(eq(practiceProblem.isActive, true)),
    ]);

    const totalSolved = modules.reduce((acc, m) => acc + m.completed, 0);
    const totalXP = modules.reduce((acc, m) => acc + m.totalXP, 0);
    const longestStreak = Math.max(0, ...modules.map((m) => m.longestStreak));
    const currentStreak = Math.max(0, ...modules.map((m) => m.currentStreak));
    const avgScore = modules.length > 0
        ? Math.round(modules.reduce((acc, m) => acc + m.averageScore, 0) / modules.length)
        : 0;

    const [easyTotalArr, mediumTotalArr, hardTotalArr] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.isActive, true), eq(practiceProblem.difficulty, "EASY"))),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.isActive, true), eq(practiceProblem.difficulty, "MEDIUM"))),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.isActive, true), eq(practiceProblem.difficulty, "HARD"))),
    ]);

    const easyTotal = Number(easyTotalArr[0]?.count ?? 0);
    const mediumTotal = Number(mediumTotalArr[0]?.count ?? 0);
    const hardTotal = Number(hardTotalArr[0]?.count ?? 0);
    const easyCompleted = modules.reduce((acc, m) => acc + m.easyCompleted, 0);
    const mediumCompleted = modules.reduce((acc, m) => acc + m.mediumCompleted, 0);
    const hardCompleted = modules.reduce((acc, m) => acc + m.hardCompleted, 0);

    const [dsaCountArr, sdCountArr, wfCountArr, wbCountArr] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.module, "DSA"), eq(practiceProblem.isActive, true))),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.module, "SYSTEM_DESIGN"), eq(practiceProblem.isActive, true))),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.module, "WEB_FRONTEND"), eq(practiceProblem.isActive, true))),
        db.select({ count: sql<number>`count(*)` }).from(practiceProblem).where(and(eq(practiceProblem.module, "WEB_BACKEND"), eq(practiceProblem.isActive, true))),
    ]);

    const moduleProblemCounts: Record<string, number> = {
        DSA: Number(dsaCountArr[0]?.count ?? 0),
        SYSTEM_DESIGN: Number(sdCountArr[0]?.count ?? 0),
        WEB_FRONTEND: Number(wfCountArr[0]?.count ?? 0),
        WEB_BACKEND: Number(wbCountArr[0]?.count ?? 0),
    };

    const moduleBreakdown: PracticeProgressData[] = (["DSA", "SYSTEM_DESIGN", "WEB_FRONTEND", "WEB_BACKEND"] as PracticeModule[]).map((mod) => {
        const m = modules.find((mp) => mp.module === mod);
        return {
            module: mod,
            totalProblems: moduleProblemCounts[mod] ?? 0,
            completed: m?.completed ?? 0,
            inProgress: m?.inProgress ?? 0,
            totalXP: m?.totalXP ?? 0,
            currentStreak: m?.currentStreak ?? 0,
            longestStreak: m?.longestStreak ?? 0,
            lastPracticedAt: m?.lastPracticedAt ?? null,
            easyCompleted: m?.easyCompleted ?? 0,
            mediumCompleted: m?.mediumCompleted ?? 0,
            hardCompleted: m?.hardCompleted ?? 0,
            averageScore: m?.averageScore ?? 0,
        };
    });

    const recentSessions: PracticeRecentSession[] = sessions.map((s) => ({
        problemTitle: s.problem.title,
        problemSlug: s.problem.slug,
        module: s.problem.module,
        category: s.problem.category,
        difficulty: s.problem.difficulty,
        bestScore: s.bestScore,
        status: s.status,
        updatedAt: s.updatedAt,
    }));

    return {
        totalSolved,
        totalAttempted: sessions.length,
        totalXP,
        currentStreak,
        longestStreak,
        averageScore: avgScore,
        moduleBreakdown,
        recentSessions,
        difficultyBreakdown: {
            easy: { total: easyTotal, completed: easyCompleted },
            medium: { total: mediumTotal, completed: mediumCompleted },
            hard: { total: hardTotal, completed: hardCompleted },
        },
    };
}
