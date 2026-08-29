/**
 * KnowMe External API - Chat Endpoint
 *
 * This API endpoint is designed for external portfolio integration.
 * Developers can call this from their own portfolio websites to get
 * AI-powered answers about their profile.
 *
 * Usage:
 * POST /api/v1/knowme/chat
 * Headers:
 *   - Authorization: Bearer <API_KEY>
 *   - Content-Type: application/json
 * Body:
 *   - question: string (required)
 *   - sessionId: string (optional, for conversation continuity)
 *
 * Response:
 *   - success: boolean
 *   - answer: string
 *   - sources: array of sources
 *   - sessionId: string
 *   - rateLimit: { remaining, resetAt }
 *   - poweredBy: "ShipItHQ KnowMe"
 *   - profileUrl: string
 */

import { NextRequest, NextResponse } from "next/server";
import {
    db,
    knowMeProfiles,
    knowMeChatSessions,
    knowMeChatMessages,
    knowMeQuestionAnalytics,
} from "@repo/db";
import { eq, sql } from "drizzle-orm";
import { validateApiRequest, recordApiRequest } from "@/actions/(main)/knowme/api.action";
import {
    generateEmbedding,
    queryVectors,
    generateResponse,
    generateNoContextResponse,
    generateSessionToken,
    categorizeQuestion,
    extractKeywords,
} from "@/utils/knowme";
import { knowMeProfileUrl } from "@/lib/urls";

// CORS headers for external requests
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let profileId: string | undefined;
    let apiKey: string | undefined;

    try {
        // Extract API key from Authorization header
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing or invalid Authorization header",
                    poweredBy: "ShipItHQ KnowMe",
                },
                { status: 401, headers: corsHeaders }
            );
        }

        apiKey = authHeader.replace("Bearer ", "").trim();

        // Validate API key
        const validation = await validateApiRequest(apiKey);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error,
                    rateLimit: validation.rateLimitRemaining !== undefined
                        ? { remaining: validation.rateLimitRemaining }
                        : undefined,
                    poweredBy: "ShipItHQ KnowMe",
                },
                {
                    status: validation.error === "Rate limit exceeded" ? 429 : 401,
                    headers: corsHeaders,
                }
            );
        }

        profileId = validation.profileId!;
        const username = validation.username;

        // Parse request body
        const body = await request.json();
        const { question, sessionId: inputSessionId } = body;

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Question is required",
                    poweredBy: "ShipItHQ KnowMe",
                },
                { status: 400, headers: corsHeaders }
            );
        }

        if (question.length > 1000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Question too long (max 1000 characters)",
                    poweredBy: "ShipItHQ KnowMe",
                },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get profile and user info
        const profile = await db.query.knowMeProfiles.findFirst({
            where: eq(knowMeProfiles.id, profileId),
            with: {
                user: {
                    columns: {
                        name: true,
                        username: true,
                        occupation: true,
                    },
                },
                privacySettings: true,
            },
        });

        if (!profile) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Profile not found",
                    poweredBy: "ShipItHQ KnowMe",
                },
                { status: 404, headers: corsHeaders }
            );
        }

        // Get or create session
        let session;
        if (inputSessionId) {
            session = await db.query.knowMeChatSessions.findFirst({
                where: eq(knowMeChatSessions.sessionToken, inputSessionId),
            });
        }

        if (!session) {
            const [newSession] = await db.insert(knowMeChatSessions).values({
                profileId,
                viewerType: "EXTERNAL_API",
                sessionToken: generateSessionToken(),
                rateLimitRemaining: profile.privacySettings?.maxQuestionsPerSession ?? 20,
                rateLimitResetAt: new Date(Date.now() + 60 * 60 * 1000),
                source: "external_api",
                visitorIp: request.headers.get("x-forwarded-for") ?? undefined,
            }).returning();
            session = newSession;
        }

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Failed to create session", poweredBy: "ShipItHQ KnowMe" },
                { status: 500, headers: corsHeaders }
            );
        }

        // Check session rate limit
        if (session.rateLimitRemaining <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Session rate limit exceeded",
                    sessionId: session.sessionToken,
                    rateLimit: {
                        remaining: 0,
                        resetAt: session.rateLimitResetAt.toISOString(),
                    },
                    poweredBy: "ShipItHQ KnowMe",
                },
                { status: 429, headers: corsHeaders }
            );
        }

        // Save user message
        await db.insert(knowMeChatMessages).values({
            sessionId: session.id,
            role: "user",
            content: question.trim(),
        });

        // Generate embedding for the question
        const questionEmbedding = await generateEmbedding(question.trim());

        // Search for relevant context
        const relevantChunks = await queryVectors(
            questionEmbedding,
            profileId,
            {
                topK: 5,
                minScore: 0.5,
                includeMetadata: true,
            }
        );

        let answer: string;
        let sources: Array<{
            type: string;
            title: string;
            url?: string;
        }> = [];
        let tokensUsed = 0;

        if (relevantChunks.length > 0) {
            // Generate response with context
            const result = await generateResponse(
                question.trim(),
                relevantChunks,
                {
                    name: profile.user.name || profile.user.username || "User",
                    occupation: profile.user.occupation,
                },
                "EXTERNAL_API"
            );

            answer = result.answer;
            sources = result.sources;
            tokensUsed = result.tokensUsed;

            // Add profile link
            answer += `\n\nView full profile: ${knowMeProfileUrl(username ?? "")}`;
        } else {
            // No context found
            answer = await generateNoContextResponse(
                question.trim(),
                profile.user.name || profile.user.username || "User"
            );
        }

        // Save AI response
        await db.insert(knowMeChatMessages).values({
            sessionId: session.id,
            role: "assistant",
            content: answer,
            sources: sources as unknown as undefined,
            tokensUsed,
            responseTimeMs: Date.now() - startTime,
        });

        // Update session stats
        await db.update(knowMeChatSessions)
            .set({
                questionsAsked: sql`${knowMeChatSessions.questionsAsked} + 1`,
                messagesCount: sql`${knowMeChatSessions.messagesCount} + 2`,
                rateLimitRemaining: sql`${knowMeChatSessions.rateLimitRemaining} - 1`,
                lastActivityAt: new Date(),
            })
            .where(eq(knowMeChatSessions.id, session.id));

        // Update profile stats
        await db.update(knowMeProfiles)
            .set({
                totalQuestionsAnswered: sql`${knowMeProfiles.totalQuestionsAnswered} + 1`,
            })
            .where(eq(knowMeProfiles.id, profileId));

        // Log analytics
        const questionCategory = categorizeQuestion(question.trim());
        const keywords = extractKeywords(question.trim());

        await db.insert(knowMeQuestionAnalytics).values({
            profileId,
            question: question.trim(),
            questionCategory,
            questionKeywords: keywords,
            askedByType: "EXTERNAL_API",
            responseGenerated: true,
            responseTimeMs: Date.now() - startTime,
            responseTokens: tokensUsed,
            source: "external_api",
        });

        // Record API request
        await recordApiRequest({
            profileId,
            apiKey,
            endpoint: "/api/v1/knowme/chat",
            method: "POST",
            requestIp: request.headers.get("x-forwarded-for") || undefined,
            responseStatus: 200,
            responseTimeMs: Date.now() - startTime,
            tokensUsed,
        });

        return NextResponse.json(
            {
                success: true,
                answer,
                sources,
                sessionId: session.sessionToken,
                rateLimit: {
                    remaining: Math.max(0, session.rateLimitRemaining - 1),
                    resetAt: session.rateLimitResetAt.toISOString(),
                },
                poweredBy: "ShipItHQ KnowMe",
                profileUrl: knowMeProfileUrl(username ?? ""),
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error("KnowMe API error:", error);

        // Record failed request
        if (profileId && apiKey) {
            await recordApiRequest({
                profileId,
                apiKey,
                endpoint: "/api/v1/knowme/chat",
                method: "POST",
                requestIp: request.headers.get("x-forwarded-for") || undefined,
                responseStatus: 500,
                responseTimeMs: Date.now() - startTime,
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                poweredBy: "ShipItHQ KnowMe",
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
