"use server";

/**
 * Per-day activity for one module, for the signed-in user only.
 *
 * ── Why one action instead of seven ──────────────────────────────────────────
 * Every module overview wants the same thing: "what did I do here, day by day,
 * over the last N days". Written seven times that is seven date-bucketing bugs
 * waiting to happen - off-by-one on the window, a missing day silently dropped
 * from the series, a timezone that shifts every label by one.
 *
 * ── The two things that are easy to get wrong, handled once ──────────────────
 *
 * 1. **Missing days must appear as zero, not vanish.** `GROUP BY date` returns
 *    only the days that HAVE rows, so a user with two active days gets a
 *    two-point series and a line chart that plots them adjacent - a week's gap
 *    rendered as a single step. The series is therefore built from a generated
 *    calendar and the counts are joined onto it.
 *
 * 2. **Bucket in UTC, and label in UTC.** `date_trunc('day', ts)` uses the
 *    database session's timezone. The chart labels its axis with
 *    `timeZone: "UTC"`, so anything else puts a count under the wrong tick for
 *    every reader east or west of the server.
 *
 * Nothing here reads another user's rows, and nothing is estimated. A module
 * with no rows returns a full-length series of zeros, which is a true answer and
 * is what the chart is built to draw.
 */

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import { db } from "@repo/db";
import { sql } from "drizzle-orm";

export type ActivityModule =
    | "projects"
    | "practice"
    | "mock"
    | "pathfinder"
    | "ai"
    | "jobs";

export interface ActivityDay {
    date: string;
    value: number;
}

/**
 * Where each module's "I did something" signal lives.
 *
 * Deliberately a raw fragment per module rather than a query builder: each one
 * is a different table with a differently-named timestamp, and the shared part
 * is the calendar join below, not the selection.
 *
 * `unit` is what one row means, and it is what the chart says in its tooltip -
 * so it has to be the truth about the row being counted, not a flattering name
 * for it.
 */
// NOTE ON THE NAMES BELOW: these are the SQL table names, not the drizzle export
// names, and the two differ. `jobApplications` is `job_application`;
// `pathfinderDailySessions` is `pathfinder_daily_session`. Guessing the plural
// from the export cost two silently-failing modules on the first run - silently,
// because the catch below degrades a broken query to a zero series, which is
// indistinguishable from a user who has done nothing. Verify a new entry against
// `information_schema.tables` before trusting it.
const SOURCES: Record<
    ActivityModule,
    { unit: string; table: string; userColumn: string; dateColumn: string; extra?: string }
> = {
    // A task is "done" per user, in their own status row.
    projects: {
        unit: "task",
        table: "user_task_v2_status",
        userColumn: "user_id",
        dateColumn: "completed_at",
        extra: "status = 'COMPLETED'",
    },
    practice: {
        unit: "session",
        table: "practice_user_session",
        userColumn: "user_id",
        dateColumn: "started_at",
    },
    mock: {
        unit: "interview",
        table: "mock_voice_session",
        userColumn: "user_id",
        dateColumn: "started_at",
    },
    pathfinder: {
        unit: "session",
        table: "pathfinder_daily_session",
        userColumn: "user_id",
        dateColumn: "created_at",
    },
    // Cover letters only. Resume drafts are edited in place rather than created
    // per session, so counting their `created_at` would report one point ever and
    // call it activity.
    ai: {
        unit: "cover letter",
        table: "cover_letter",
        userColumn: "user_id",
        dateColumn: "created_at",
    },
    jobs: {
        unit: "application",
        table: "job_application",
        userColumn: "user_id",
        dateColumn: "created_at",
    },
};

export async function getModuleActivity(
    module: ActivityModule,
    days = 30,
): Promise<{ series: ActivityDay[]; unit: string; total: number }> {
    const source = SOURCES[module];
    const empty = { series: emptySeries(days), unit: source.unit, total: 0 };

    try {
        const session = await getSession(headers());
        if (!session?.user?.id) return empty;

        const window = Math.min(Math.max(days, 1), 365);

        // The calendar is generated in SQL and LEFT JOINed, so every day in the
        // window comes back whether or not it has rows. See note 1 above.
        const rows = await db.execute<{ day: string; n: number }>(sql`
            WITH calendar AS (
                SELECT generate_series(
                    (CURRENT_DATE AT TIME ZONE 'UTC')::date - ${window - 1}::int,
                    (CURRENT_DATE AT TIME ZONE 'UTC')::date,
                    '1 day'::interval
                )::date AS day
            ),
            counted AS (
                SELECT (${sql.raw(`"${source.dateColumn}"`)} AT TIME ZONE 'UTC')::date AS day,
                       COUNT(*)::int AS n
                FROM ${sql.raw(`"${source.table}"`)}
                WHERE ${sql.raw(`"${source.userColumn}"`)} = ${session.user.id}
                  AND ${sql.raw(`"${source.dateColumn}"`)} IS NOT NULL
                  AND ${sql.raw(`"${source.dateColumn}"`)} >= NOW() - ${sql.raw(`INTERVAL '${window} days'`)}
                  ${source.extra ? sql.raw(`AND ${source.extra}`) : sql.raw("")}
                GROUP BY 1
            )
            SELECT to_char(calendar.day, 'YYYY-MM-DD') AS day,
                   COALESCE(counted.n, 0)::int AS n
            FROM calendar
            LEFT JOIN counted ON counted.day = calendar.day
            ORDER BY calendar.day ASC
        `);

        const series = (rows.rows ?? rows as unknown as { day: string; n: number }[]).map((r) => ({
            date: r.day,
            value: Number(r.n) || 0,
        }));

        if (series.length === 0) return empty;

        return {
            series,
            unit: source.unit,
            total: series.reduce((n, d) => n + d.value, 0),
        };
    } catch (error: unknown) {
        // A chart is not worth a 500. An overview that cannot read its activity
        // still has stats and content worth showing, so this degrades to the
        // honest zero series rather than taking the page down with it.
        console.error(`Error reading ${module} activity:`, error);
        return empty;
    }
}

/** A full-length run of zeros ending today, in UTC. */
function emptySeries(days: number): ActivityDay[] {
    const out: ActivityDay[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        out.push({ date: d.toISOString().slice(0, 10), value: 0 });
    }
    return out;
}
