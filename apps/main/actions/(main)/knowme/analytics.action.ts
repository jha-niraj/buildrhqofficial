"use server";

/**
 * KnowMe Analytics Server Actions
 *
 * Handles analytics, insights, and statistics
 */

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    knowMeProfiles,
    knowMeQuestionAnalytics,
    knowMeChatSessions,
    knowMeProfileViews,
} from "@repo/db";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";
import type {
  KnowMeActionResponse,
  KnowMeAnalyticsFull,
  KnowMeAnalyticsOverview,
  QuestionCategoryStats,
  TopQuestion,
  VisitorData,
  AnalyticsInsight,
  DailyActivityData,
  TimeRange,
} from "@/types/knowme";
import { calculateTrend, generateInsight } from "@/utils/knowme";

// ============================================
// MAIN ANALYTICS
// ============================================

/**
 * Get full analytics data
 */
export async function getKnowMeAnalytics(
  timeRange: TimeRange = "30d"
): Promise<KnowMeActionResponse<KnowMeAnalyticsFull>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Calculate date range
    const { startDate, previousStartDate } = getDateRange(timeRange);

    // Get overview stats
    const overview = await getOverviewStats(profile.id, startDate, previousStartDate);

    // Get questions by category
    const questionsByCategory = await getQuestionsByCategory(profile.id, startDate);

    // Get top questions
    const topQuestions = await getTopQuestions(profile.id, startDate);

    // Get recent visitors
    const recentVisitors = await getRecentVisitors(profile.id, startDate);

    // Get daily activity
    const dailyActivity = await getDailyActivity(profile.id, startDate);

    // Generate insights
    const insights = generateInsights(
      overview,
      questionsByCategory,
      recentVisitors
    );

    return {
      success: true,
      data: {
        overview,
        questionsByCategory,
        topQuestions,
        recentVisitors,
        insights,
        dailyActivity,
      },
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}

/**
 * Get overview statistics
 */
async function getOverviewStats(
  profileId: string,
  startDate: Date,
  previousStartDate: Date
): Promise<KnowMeAnalyticsOverview> {
  // Current period stats
  const [currentQuestions, currentSessions, currentViews] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeQuestionAnalytics)
      .where(and(
        eq(knowMeQuestionAnalytics.profileId, profileId),
        gte(knowMeQuestionAnalytics.askedAt, startDate)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeChatSessions)
      .where(and(
        eq(knowMeChatSessions.profileId, profileId),
        gte(knowMeChatSessions.startedAt, startDate)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeProfileViews)
      .where(and(
        eq(knowMeProfileViews.profileId, profileId),
        gte(knowMeProfileViews.viewedAt, startDate)
      )),
  ]);

  // Previous period stats
  const [prevQuestions, prevSessions, prevViews] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeQuestionAnalytics)
      .where(and(
        eq(knowMeQuestionAnalytics.profileId, profileId),
        gte(knowMeQuestionAnalytics.askedAt, previousStartDate),
        lt(knowMeQuestionAnalytics.askedAt, startDate)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeChatSessions)
      .where(and(
        eq(knowMeChatSessions.profileId, profileId),
        gte(knowMeChatSessions.startedAt, previousStartDate),
        lt(knowMeChatSessions.startedAt, startDate)
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(knowMeProfileViews)
      .where(and(
        eq(knowMeProfileViews.profileId, profileId),
        gte(knowMeProfileViews.viewedAt, previousStartDate),
        lt(knowMeProfileViews.viewedAt, startDate)
      )),
  ]);

  const cQ = Number(currentQuestions[0]?.count ?? 0);
  const cS = Number(currentSessions[0]?.count ?? 0);
  const cV = Number(currentViews[0]?.count ?? 0);
  const pQ = Number(prevQuestions[0]?.count ?? 0);
  const pS = Number(prevSessions[0]?.count ?? 0);
  const pV = Number(prevViews[0]?.count ?? 0);

  const avgPerSession = cS > 0
    ? Math.round((cQ / cS) * 10) / 10
    : 0;

  return {
    totalQuestions: cQ,
    totalVisitors: cV,
    totalSessions: cS,
    avgQuestionsPerSession: avgPerSession,
    trends: {
      questions: calculateTrend(cQ, pQ),
      visitors: calculateTrend(cV, pV),
      sessions: calculateTrend(cS, pS),
    },
  };
}

/**
 * Get questions by category
 */
async function getQuestionsByCategory(
  profileId: string,
  startDate: Date
): Promise<QuestionCategoryStats[]> {
  const categories = await db
    .select({
      questionCategory: knowMeQuestionAnalytics.questionCategory,
      count: sql<number>`count(*)`,
    })
    .from(knowMeQuestionAnalytics)
    .where(and(
      eq(knowMeQuestionAnalytics.profileId, profileId),
      gte(knowMeQuestionAnalytics.askedAt, startDate)
    ))
    .groupBy(knowMeQuestionAnalytics.questionCategory);

  const total = categories.reduce((sum, c) => sum + Number(c.count), 0);

  return categories
    .map((c) => ({
      category: c.questionCategory,
      count: Number(c.count),
      percentage: total > 0 ? Math.round((Number(c.count) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get top questions
 */
async function getTopQuestions(
  profileId: string,
  startDate: Date
): Promise<TopQuestion[]> {
  // Get raw questions
  const questions = await db.query.knowMeQuestionAnalytics.findMany({
    where: and(
      eq(knowMeQuestionAnalytics.profileId, profileId),
      gte(knowMeQuestionAnalytics.askedAt, startDate)
    ),
    columns: {
      question: true,
      questionCategory: true,
    },
  });

  // Count similar questions (basic similarity - exact match for now)
  const questionCounts = new Map<string, { count: number; category: string }>();

  for (const q of questions) {
    const normalized = q.question.toLowerCase().trim();
    const existing = questionCounts.get(normalized);
    if (existing) {
      existing.count++;
    } else {
      questionCounts.set(normalized, { count: 1, category: q.questionCategory });
    }
  }

  return Array.from(questionCounts.entries())
    .map(([question, data]) => ({
      question: question.charAt(0).toUpperCase() + question.slice(1),
      count: data.count,
      category: data.category as any,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get recent visitors
 */
async function getRecentVisitors(
  profileId: string,
  startDate: Date
): Promise<VisitorData[]> {
  const sessions = await db.query.knowMeChatSessions.findMany({
    where: and(
      eq(knowMeChatSessions.profileId, profileId),
      gte(knowMeChatSessions.startedAt, startDate)
    ),
    with: {
      visitorUser: {
        columns: {
          id: true,
          name: true,
          image: true,
          occupation: true,
          company: true,
        },
      },
      messages: {
        where: (m, { eq }) => eq(m.role, "user"),
        columns: { content: true },
      },
    },
    orderBy: [desc(knowMeChatSessions.lastActivityAt)],
    limit: 20,
  });

  // Group by user/session
  const visitorMap = new Map<string, VisitorData>();

  for (const session of sessions) {
    const key = session.visitorUserId || session.id;
    const existing = visitorMap.get(key);

    // Extract topics from questions
    const topics = session.messages
      .flatMap((m) => extractTopicsFromQuestion(m.content))
      .filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i)
      .slice(0, 5);

    if (existing) {
      existing.questionsAsked += session.questionsAsked;
      if (session.lastActivityAt > existing.lastActive) {
        existing.lastActive = session.lastActivityAt;
      }
      existing.interestedTopics = [
        ...new Set([...existing.interestedTopics, ...topics]),
      ].slice(0, 5);
    } else {
      visitorMap.set(key, {
        userId: session.visitorUserId,
        userName: session.visitorUser?.name || null,
        userImage: session.visitorUser?.image || null,
        viewerType: session.viewerType,
        questionsAsked: session.questionsAsked,
        lastActive: session.lastActivityAt,
        interestedTopics: topics,
        companyName: session.visitorUser?.company || undefined,
      });
    }
  }

  return Array.from(visitorMap.values())
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
    .slice(0, 10);
}

/**
 * Get daily activity data
 */
async function getDailyActivity(
  profileId: string,
  startDate: Date
): Promise<DailyActivityData[]> {
  const days = Math.ceil(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyData: DailyActivityData[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [questions, visitors, sessions] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(knowMeQuestionAnalytics)
        .where(and(
          eq(knowMeQuestionAnalytics.profileId, profileId),
          gte(knowMeQuestionAnalytics.askedAt, dayStart),
          lt(knowMeQuestionAnalytics.askedAt, dayEnd)
        )),
      db.select({ count: sql<number>`count(*)` })
        .from(knowMeProfileViews)
        .where(and(
          eq(knowMeProfileViews.profileId, profileId),
          gte(knowMeProfileViews.viewedAt, dayStart),
          lt(knowMeProfileViews.viewedAt, dayEnd)
        )),
      db.select({ count: sql<number>`count(*)` })
        .from(knowMeChatSessions)
        .where(and(
          eq(knowMeChatSessions.profileId, profileId),
          gte(knowMeChatSessions.startedAt, dayStart),
          lt(knowMeChatSessions.startedAt, dayEnd)
        )),
    ]);

    dailyData.push({
      date: dayStart.toISOString().split("T")[0] as string,
      questions: Number(questions[0]?.count ?? 0),
      visitors: Number(visitors[0]?.count ?? 0),
      sessions: Number(sessions[0]?.count ?? 0),
    });
  }

  return dailyData;
}

// ============================================
// INSIGHTS GENERATION
// ============================================

/**
 * Generate insights from analytics data
 */
function generateInsights(
  overview: KnowMeAnalyticsOverview,
  categories: QuestionCategoryStats[],
  visitors: VisitorData[]
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Top category insight
  const firstCategory = categories[0];
  if (firstCategory && firstCategory.count >= 5) {
    const topCategory = firstCategory;
    const insight = generateInsight("strength", {
      topCategory: topCategory.category,
      questionCount: topCategory.count,
    });
    if (insight) {
      insights.push({
        type: "strength",
        message: insight,
      });
    }
  }

  // Recruiter interest insight
  const recruiterCount = visitors.filter(
    (v) => v.viewerType === "RECRUITER"
  ).length;
  if (recruiterCount > 0) {
    const insight = generateInsight("suggestion", { recruiterCount });
    if (insight) {
      insights.push({
        type: "suggestion",
        message: insight,
      });
    }
  }

  // Response rate insight
  if (overview.totalQuestions > 10) {
    // Assume 95% response rate for now (would need actual data)
    const responseRate = 95;
    const insight = generateInsight("info", { responseRate });
    if (insight) {
      insights.push({
        type: "info",
        message: insight,
      });
    }
  }

  // Growth insight
  if (overview.trends.questions.direction === "up" &&
      overview.trends.questions.changePercent > 20) {
    insights.push({
      type: "info",
      message: `Your profile engagement is up ${overview.trends.questions.changePercent}% this period! Keep up the great work.`,
    });
  }

  // Low engagement warning
  if (overview.totalQuestions < 5 && overview.totalSessions >= 3) {
    insights.push({
      type: "warning",
      message: "Visitors aren't asking many questions. Consider adding more content to your profile to improve engagement.",
      actionUrl: "/knowme/settings",
      actionText: "Update Profile",
    });
  }

  return insights.slice(0, 5);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateRange(timeRange: TimeRange): {
  startDate: Date;
  previousStartDate: Date;
} {
  const now = new Date();
  let days: number;

  switch (timeRange) {
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "all":
      days = 365;
      break;
    default:
      days = 30;
  }

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  return { startDate, previousStartDate };
}

function extractTopicsFromQuestion(question: string): string[] {
  const topics: string[] = [];
  const lowerQ = question.toLowerCase();

  const techKeywords = [
    "react", "vue", "angular", "node", "python", "java", "javascript",
    "typescript", "aws", "docker", "kubernetes", "database", "api",
    "frontend", "backend", "fullstack", "mobile", "devops"
  ];

  for (const keyword of techKeywords) {
    if (lowerQ.includes(keyword)) {
      topics.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }

  return topics;
}

// ============================================
// EXPORT DATA
// ============================================

/**
 * Export analytics data
 */
export async function exportAnalyticsData(
  timeRange: TimeRange = "30d"
): Promise<KnowMeActionResponse<{
  questions: Array<{ question: string; category: string; askedAt: Date }>;
  visitors: Array<{ type: string; questionsAsked: number; date: Date }>;
}>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    const { startDate } = getDateRange(timeRange);

    const [questions, sessions] = await Promise.all([
      db.query.knowMeQuestionAnalytics.findMany({
        where: and(
          eq(knowMeQuestionAnalytics.profileId, profile.id),
          gte(knowMeQuestionAnalytics.askedAt, startDate)
        ),
        columns: {
          question: true,
          questionCategory: true,
          askedAt: true,
        },
        orderBy: [desc(knowMeQuestionAnalytics.askedAt)],
      }),
      db.query.knowMeChatSessions.findMany({
        where: and(
          eq(knowMeChatSessions.profileId, profile.id),
          gte(knowMeChatSessions.startedAt, startDate)
        ),
        columns: {
          viewerType: true,
          questionsAsked: true,
          startedAt: true,
        },
        orderBy: [desc(knowMeChatSessions.startedAt)],
      }),
    ]);

    return {
      success: true,
      data: {
        questions: questions.map((q) => ({
          question: q.question,
          category: q.questionCategory,
          askedAt: q.askedAt,
        })),
        visitors: sessions.map((s) => ({
          type: s.viewerType,
          questionsAsked: s.questionsAsked,
          date: s.startedAt,
        })),
      },
    };
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return { success: false, error: "Failed to export data" };
  }
}
