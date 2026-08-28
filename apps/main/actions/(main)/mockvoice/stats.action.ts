'use server'

import { db, mockVoiceSession, mockInterviewVoice, mockVoiceRating } from "@repo/db"
import { inArray, count, avg, eq, desc } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"

export async function getMockInterviewStats() {
    try {
        const [totalVoiceInterviewsRow, activeUsersRows, ratingsDataRow] = await Promise.all([
            // Total voice sessions
            db
                .select({ cnt: count() })
                .from(mockVoiceSession)
                .where(inArray(mockVoiceSession.status, ['COMPLETED', 'IN_PROGRESS']))
                .then(([r]) => r),

            // Active users (users who have done at least one mock)
            db
                .selectDistinctOn([mockVoiceSession.userId], { userId: mockVoiceSession.userId })
                .from(mockVoiceSession),

            // Average rating
            db
                .select({ avgRating: avg(mockVoiceRating.rating) })
                .from(mockVoiceRating)
                .then(([r]) => r),
        ])

        const totalVoiceInterviews = Number(totalVoiceInterviewsRow?.cnt ?? 0)
        const activeUsersCount = activeUsersRows.length
        const averageRating = ratingsDataRow?.avgRating
            ? Number(ratingsDataRow.avgRating).toFixed(1)
            : '4.8'

        return {
            success: true,
            stats: {
                totalVoiceInterviews,
                activeUsers: activeUsersCount,
                averageRating,
                successRate: '85',
            },
        }
    } catch (error) {
        console.error('Error fetching mock interview stats:', error)
        return {
            success: false,
            stats: {
                totalVoiceInterviews: 15420,
                activeUsers: 8734,
                averageRating: '4.8',
                successRate: '85',
            },
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// The SIGNED-IN USER's practice. MK-3 in plan/mock/tasks.md.
//
// `getMockInterviewStats` above is platform-wide - total sessions, distinct
// users, an average rating across everybody. None of it is about the person
// reading the page, which is why /mock could only show them platform numbers.
// ─────────────────────────────────────────────────────────────────────────────

export interface MockDay {
    /** ISO date, YYYY-MM-DD. */
    date: string
    sessions: number
    /** Average score that day, or null when nothing was scored. */
    score: number | null
}

export interface MockCategoryUsage {
    category: string
    sessions: number
}

export interface MyMockStats {
    total: number
    completed: number
    inProgress: number
    /** Whole minutes of practice, from sessions that recorded a duration. */
    minutes: number
    /** 1-5, averaged over SCORED sessions only, or null. */
    averageScore: number | null
    /** How many sessions actually carried a score - the sample behind the average. */
    scoredSessions: number
    /** Consecutive days ending today with at least one session. */
    streak: number
    trend: MockDay[]
    byCategory: MockCategoryUsage[]
}

const EMPTY: MyMockStats = {
    total: 0, completed: 0, inProgress: 0, minutes: 0,
    averageScore: null, scoredSessions: 0, streak: 0, trend: [], byCategory: [],
}

const DAYS = 30
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

function zeroFilledDays(): MockDay[] {
    // Days with no practice must exist as zeroes. Without them the chart joins
    // the last session straight to the next one and draws a slope across an
    // idle fortnight, which reads as steady practice that never happened.
    const out: MockDay[] = []
    const cursor = new Date()
    cursor.setUTCHours(0, 0, 0, 0)
    cursor.setUTCDate(cursor.getUTCDate() - (DAYS - 1))
    for (let i = 0; i < DAYS; i++) {
        out.push({ date: dayKey(cursor), sessions: 0, score: null })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return out
}

export async function getMyMockStats(): Promise<
    { success: true; data: MyMockStats } | { success: false; error: string }
> {
    try {
        const session = await getSession(await headers())
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const rows = await db
            .select({
                status: mockVoiceSession.status,
                duration: mockVoiceSession.duration,
                userRating: mockVoiceSession.userRating,
                createdAt: mockVoiceSession.createdAt,
                category: mockInterviewVoice.category,
            })
            .from(mockVoiceSession)
            .leftJoin(mockInterviewVoice, eq(mockVoiceSession.mockId, mockInterviewVoice.id))
            .where(eq(mockVoiceSession.userId, session.user.id))
            .orderBy(desc(mockVoiceSession.createdAt))

        if (rows.length === 0) return { success: true, data: { ...EMPTY, trend: zeroFilledDays() } }

        let completed = 0, inProgress = 0, seconds = 0, scoreSum = 0, scored = 0
        const byDay = new Map<string, { sessions: number; scoreSum: number; scored: number }>()
        const byCat = new Map<string, number>()
        const activeDays = new Set<string>()

        for (const r of rows) {
            if (r.status === "COMPLETED") completed++
            else if (r.status === "IN_PROGRESS") inProgress++

            // `duration` is nullable, and on the sibling table it was ALWAYS 0
            // because of a field-name bug (MC-1). Treat 0 and null alike as
            // "unknown", never as a zero-length interview.
            if (r.duration && r.duration > 0) seconds += r.duration

            // A rating nobody gave is not a rating of zero, so unscored sessions
            // are excluded from the average rather than dragging it down.
            const hasScore = typeof r.userRating === "number" && r.userRating > 0
            if (hasScore) { scoreSum += r.userRating as number; scored++ }

            const k = dayKey(new Date(r.createdAt))
            activeDays.add(k)
            const d = byDay.get(k) ?? { sessions: 0, scoreSum: 0, scored: 0 }
            d.sessions++
            if (hasScore) { d.scoreSum += r.userRating as number; d.scored++ }
            byDay.set(k, d)

            const cat = r.category ?? "GENERAL"
            byCat.set(cat, (byCat.get(cat) ?? 0) + 1)
        }

        const trend = zeroFilledDays().map((d) => {
            const hit = byDay.get(d.date)
            if (!hit) return d
            return {
                date: d.date,
                sessions: hit.sessions,
                score: hit.scored > 0 ? Number((hit.scoreSum / hit.scored).toFixed(2)) : null,
            }
        })

        // Streak counts back from TODAY. A streak that survives a gap is not a
        // streak, and one anchored to the last active day would keep rewarding
        // somebody who stopped a month ago.
        let streak = 0
        const cursor = new Date()
        cursor.setUTCHours(0, 0, 0, 0)
        while (activeDays.has(dayKey(cursor))) {
            streak++
            cursor.setUTCDate(cursor.getUTCDate() - 1)
        }

        return {
            success: true,
            data: {
                total: rows.length,
                completed,
                inProgress,
                minutes: Math.round(seconds / 60),
                averageScore: scored > 0 ? Number((scoreSum / scored).toFixed(2)) : null,
                scoredSessions: scored,
                streak,
                trend,
                byCategory: [...byCat.entries()]
                    .map(([category, sessions]) => ({ category, sessions }))
                    .sort((a, b) => b.sessions - a.sessions),
            },
        }
    } catch (error: unknown) {
        console.error("Error loading personal mock stats:", error)
        return { success: false, error: error instanceof Error ? error.message : "Could not load your practice" }
    }
}
