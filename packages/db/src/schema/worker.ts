import {
    pgTable,
    text,
    integer,
    timestamp,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./schema";

// ===========================
// Tables
// ===========================

/**
 * Every kind of work that runs on a Cloudflare Worker Durable Object.
 *
 * Declared in one place and imported by BOTH the app and the workers, because a
 * job written with a type string the poller does not recognise is a job nobody
 * can ever observe finishing — it just sits at `queued` forever.
 */
export const JOB_TYPES = [
    "project_generation",
    "project_quiz",
    "project_assessment",
    "project_mock",
    "sprint_generation",
    "task_details",
    "standup_voice",
    "verification_generation",
    "subgoal_generation",
    "goal_creation",
    "resource_generation",
    "voice_transcription",
    // The two halves of a mock interview: waiting for ElevenLabs to produce the
    // transcript, then scoring it. Separate job types because they are separate
    // waits with separate failure modes - a transcript can arrive and the
    // scoring still fail, and the user should be told which.
    "mock_conversation",
    "mock_feedback",
    // Turning an uploaded resume's raw extracted text into structured content.
    // A job rather than an inline call because it runs behind an upload the user
    // is not watching - at onboarding they have already moved on by the time it
    // finishes.
    "resume_structure",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

/**
 * The status vocabulary actually in use — read off the code, not invented:
 *
 *   waiting    written by the app when it inserts the row, before dispatch
 *              (`projectsworker.action.ts`)
 *   active     written by the worker on start and on every progress tick
 *              (`project-generator.ts:29,58`)
 *   completed  worker, on success (`:60`)
 *   failed     worker, on error (`:66`)
 *
 * `completed` and `failed` are terminal — a poller must stop on either, or it
 * will spin forever against a job that will never change again.
 */
export const JOB_STATUSES = ["waiting", "active", "completed", "failed"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** True once the job will never change again. */
export function isTerminalJobStatus(status: string): boolean {
    return status === "completed" || status === "failed";
}

export const backgroundJobs = pgTable(
    "background_job",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        jobId: text("job_id").notNull().unique(),
        // Which kind of work this row represents. Added because the table was
        // built when project generation was the only writer; the moment a second
        // job type appeared, nothing could tell them apart — not the status
        // poller, not an admin view, not a retry. Stored as text rather than a
        // pgEnum so adding a job type is a code change, not a migration.
        type: text("type").notNull().default("project_generation").$type<JobType>(),
        status: text("status").notNull().$type<JobStatus>(),
        progress: integer("progress").notNull().default(0),
        // Free-form per job type. Keep it small — a pointer (ids) rather than a
        // payload, so the worker re-reads current data instead of acting on a
        // snapshot that may be minutes stale by the time the alarm fires.
        input: jsonb("input").notNull(),
        result: jsonb("result"),
        error: text("error"),
        userId: text("user_id").references(() => users.id),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .$onUpdateFn(() => new Date()),
    },
    (table) => [
        index("idx_background_job_job_id").on(table.jobId),
        index("idx_background_job_status").on(table.status),
        index("idx_background_job_user_id").on(table.userId),
        // The poller's query shape: "this user's jobs of this type in this state".
        index("idx_background_job_user_type_status").on(table.userId, table.type, table.status),
    ],
);

// ===========================
// Relations
// ===========================

export const backgroundJobsRelations = relations(backgroundJobs, ({ one }) => ({
    user: one(users, {
        fields: [backgroundJobs.userId],
        references: [users.id],
        relationName: "BackgroundJobs",
    }),
}));
