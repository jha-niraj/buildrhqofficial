import {
    pgTable,
    text,
    integer,
    boolean,
    timestamp,
    jsonb,
    index,
    uniqueIndex,
    real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
    users,
    mockCategoryEnum,
    mockLevelEnum,
} from "./schema";

// ===========================
// Tables
// ===========================

export const mockInterviewVoice = pgTable(
    "mock_interview_voice",
    {
        id: text("id").primaryKey().$defaultFn(() => createId()),
        title: text("title").notNull(),
        description: text("description").notNull(),
        category: mockCategoryEnum("category").notNull().default("TECHNICAL"),
        level: mockLevelEnum("level").notNull().default("INTERMEDIATE"),
        duration: integer("duration").notNull().default(15),
        questionsCount: integer("questions_count").notNull().default(5),
        isPublic: boolean("is_public").notNull().default(true),
        isPredefined: boolean("is_predefined").notNull().default(false),
        byAdmin: boolean("by_admin").notNull().default(false),
        knowledgeBase: text("knowledge_base").notNull(),
        createdById: text("created_by_id").references(() => users.id, { onDelete: "cascade" }),
        includesResume: boolean("includes_resume").notNull().default(false),
        isFeatured: boolean("is_featured").notNull().default(false),
        baseCredits: integer("base_credits").notNull().default(15),
        creditsRequired: integer("credits_required").notNull().default(15),
        tags: text("tags").array().notNull().default([]),
        popularity: integer("popularity").notNull().default(0),
        totalSessions: integer("total_sessions").notNull().default(0),
        averageRating: real("average_rating"),
        predefinedId: text("predefined_id").unique(),
        isUniversityMock: boolean("is_university_mock").notNull().default(false),
        universityId: text("university_id"),
        teacherMemberId: text("teacher_member_id"),
        classIds: text("class_ids").array().notNull().default([]),
        assignmentDeadline: timestamp("assignment_deadline"),
        assignmentCredits: integer("assignment_credits"),
        assignmentInstructions: text("assignment_instructions"),
        pathfinderSubGoalId: text("pathfinder_sub_goal_id").unique(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().$onUpdateFn(() => new Date()),
    },
    (table) => [
        index("idx_mock_interview_voice_category").on(table.category),
        index("idx_mock_interview_voice_level").on(table.level),
        index("idx_mock_interview_voice_is_public").on(table.isPublic),
        index("idx_mock_interview_voice_is_predefined").on(table.isPredefined),
        index("idx_mock_interview_voice_created_by_id").on(table.createdById),
        index("idx_mock_interview_voice_popularity").on(table.popularity),
        index("idx_mock_interview_voice_university_id").on(table.universityId),
        index("idx_mock_interview_voice_is_university_mock").on(table.isUniversityMock),
    ],
);

/**
 * TWO mock-session tables exist, and that is a DECISION, not an accident.
 *
 * This one and `project_v2_mock_session` in ./projects.ts are deliberately
 * separate. Before merging them, read plan/mock-consolidation/overview.md.
 *
 * What they SHARE is the ElevenLabs session lifecycle - userId, agentId,
 * conversationId, duration, transcript, status, startedAt, completedAt - and
 * that half IS shared, through utils/elevenlabs/conversations.ts. One transport,
 * one place.
 *
 * What they do NOT share is what the interview is ABOUT.
 *   this table          : mockId, variables, creditsUsed, userRating, hasIssues
 *                         - an interview against a SCENARIO somebody authored,
 *                           which is priced, listed publicly and rated.
 *   project_v2_mock_session : projectId, sprintId, technicalScore,
 *                         communicationScore, strengths[], improvements[]
 *                         - an interview about the user's OWN project, scored on
 *                           work they actually did.
 *
 * Merging them makes half the columns null for half the rows: one table, two
 * entities. Share the transport, not the interpretation.
 */
export const mockVoiceSession = pgTable(
    "mock_voice_session",
    {
        id: text("id").primaryKey().$defaultFn(() => createId()),
        mockId: text("mock_id").notNull().references(() => mockInterviewVoice.id, { onDelete: "cascade" }),
        userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        status: text("status").notNull().default("SCHEDULED"),
        conversationId: text("conversation_id").unique(),
        agentId: text("agent_id"),
        variables: jsonb("variables").notNull(),
        scheduledFor: timestamp("scheduled_for"),
        startedAt: timestamp("started_at"),
        completedAt: timestamp("completed_at"),
        duration: integer("duration"),
        recordingUrl: text("recording_url"),
        transcriptUrl: text("transcript_url"),
        transcript: text("transcript"),
        aiAnalysis: jsonb("ai_analysis"),
        userRating: integer("user_rating"),
        userFeedback: text("user_feedback"),
        reviewedAt: timestamp("reviewed_at"),
        hasIssues: boolean("has_issues").notNull().default(false),
        reportedIssues: text("reported_issues").array().notNull().default([]),
        issueDetails: text("issue_details"),
        issueReportedAt: timestamp("issue_reported_at"),
        creditsUsed: integer("credits_used").notNull(),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().$onUpdateFn(() => new Date()),
    },
    (table) => [
        index("idx_mock_voice_session_mock_id").on(table.mockId),
        index("idx_mock_voice_session_user_id").on(table.userId),
        index("idx_mock_voice_session_status").on(table.status),
        index("idx_mock_voice_session_conversation_id").on(table.conversationId),
        index("idx_mock_voice_session_scheduled_for").on(table.scheduledFor),
    ],
);

export const mockVoiceRating = pgTable(
    "mock_voice_rating",
    {
        id: text("id").primaryKey().$defaultFn(() => createId()),
        mockId: text("mock_id").notNull().references(() => mockInterviewVoice.id, { onDelete: "cascade" }),
        userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull(),
        review: text("review"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().$onUpdateFn(() => new Date()),
    },
    (table) => [
        uniqueIndex("uq_mock_voice_rating_mock_id_user_id").on(table.mockId, table.userId),
        index("idx_mock_voice_rating_mock_id").on(table.mockId),
        index("idx_mock_voice_rating_user_id").on(table.userId),
    ],
);

// ===========================
// Relations
// ===========================

export const mockInterviewVoiceRelations = relations(mockInterviewVoice, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [mockInterviewVoice.createdById],
        references: [users.id],
        relationName: "MockVoiceCreator",
    }),
    sessions: many(mockVoiceSession),
    ratings: many(mockVoiceRating),
}));

export const mockVoiceSessionRelations = relations(mockVoiceSession, ({ one }) => ({
    mock: one(mockInterviewVoice, {
        fields: [mockVoiceSession.mockId],
        references: [mockInterviewVoice.id],
    }),
    user: one(users, {
        fields: [mockVoiceSession.userId],
        references: [users.id],
        relationName: "MockVoiceSessions",
    }),
}));

export const mockVoiceRatingRelations = relations(mockVoiceRating, ({ one }) => ({
    mock: one(mockInterviewVoice, {
        fields: [mockVoiceRating.mockId],
        references: [mockInterviewVoice.id],
    }),
    user: one(users, {
        fields: [mockVoiceRating.userId],
        references: [users.id],
        relationName: "MockVoiceRatings",
    }),
}));
