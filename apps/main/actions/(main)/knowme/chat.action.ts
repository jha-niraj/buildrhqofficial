"use server";

/**
 * KnowMe Chat Server Actions
 *
 * Handles AI chat functionality with RAG (Retrieval-Augmented Generation)
 */

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    knowMeProfiles,
    knowMeChatSessions,
    knowMeChatMessages,
    knowMeQuestionAnalytics,
    knowMePersonalData,
} from "@repo/db";
import { eq, sql } from "drizzle-orm";
import type {
	KnowMeActionResponse, KnowMeChatSessionData, ChatResponse,
	ChatMessageSource, EmbeddingMetadata
} from "@/types/knowme";
import {
	generateEmbedding, queryVectors, generateResponse,
	generateNoContextResponse, categorizeQuestion,
	generateSessionToken, extractKeywords,
	enhanceResponseWithCTAs, createOwnerTrainingChunks,
	generateVectorId, upsertVectorsBatch,
} from "@/utils/knowme";

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create or get chat session
 */
export async function getOrCreateChatSession(
	profileId: string,
	sessionToken?: string
): Promise<KnowMeActionResponse<KnowMeChatSessionData>> {
	try {
		const session = await getSession(headers());
		const currentUserId = session?.user?.id;

		// Try to find existing session
		if (sessionToken) {
			const existingSession = await db.query.knowMeChatSessions.findFirst({
				where: eq(knowMeChatSessions.sessionToken, sessionToken),
				with: {
					messages: {
						orderBy: (m, { asc }) => [asc(m.createdAt)],
						limit: 50,
					},
				},
			});

			if (existingSession && existingSession.profileId === profileId) {
				return {
					success: true,
					data: formatChatSession(existingSession),
				};
			}
		}

		// Get profile to determine viewer type
		const profile = await db.query.knowMeProfiles.findFirst({
			where: eq(knowMeProfiles.id, profileId),
			with: { privacySettings: true },
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		// Determine viewer type
		let viewerType: "OWNER" | "REGISTERED_USER" | "RECRUITER" | "ANONYMOUS" | "EXTERNAL_API" = "ANONYMOUS";
		if (currentUserId) {
			if (currentUserId === profile.userId) {
				viewerType = "OWNER";
			} else {
				// Every signed-in non-owner is a REGISTERED_USER. `RECRUITER` is a
				// viewer type nothing can produce, and that is DELIBERATE, not an
				// unfinished branch - see KM-4 in plan/knowme/.
				//
				// Decided 2026-08-28: a public persona is public. The owner's
				// controls are `allowAnonymous` and `allowRegisteredUsers` on
				// their privacy settings, plus the per-session rate limit below.
				// Gating on "verified recruiter" would need a recruiter identity
				// this product does not have: no recruiter role, no verification
				// flow, no way to become one. A gate that nobody can pass is not
				// a gate, it is a locked door with no key.
				//
				// `know_me_privacy_settings.allow_recruiters` is dormant for the
				// same reason. It is not surfaced in the settings UI and is read
				// by nothing, so it promises the user nothing. Leave it until
				// there is a recruiter identity to attach it to.
				viewerType = "REGISTERED_USER";
			}
		}

		// Check privacy settings
		const privacySettings = profile.privacySettings;
		if (privacySettings) {
			if (viewerType === "ANONYMOUS" && !privacySettings.allowAnonymous) {
				return { success: false, error: "Anonymous access is not allowed" };
			}
			if (viewerType === "REGISTERED_USER" && !privacySettings.allowRegisteredUsers) {
				return { success: false, error: "Access is restricted" };
			}
		}

		// Create new session
		const [newSession] = await db.insert(knowMeChatSessions).values({
			profileId,
			visitorUserId: currentUserId,
			viewerType,
			sessionToken: generateSessionToken(),
			rateLimitRemaining: privacySettings?.maxQuestionsPerSession || 20,
			rateLimitResetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
			source: "direct",
		}).returning();

		// Update profile stats
		await db.update(knowMeProfiles)
			.set({
				totalSessions: sql`${knowMeProfiles.totalSessions} + 1`,
				totalVisitors: viewerType !== "OWNER"
					? sql`${knowMeProfiles.totalVisitors} + 1`
					: knowMeProfiles.totalVisitors,
			})
			.where(eq(knowMeProfiles.id, profileId));

		const sessionWithMessages = await db.query.knowMeChatSessions.findFirst({
			where: eq(knowMeChatSessions.id, newSession!.id),
			with: { messages: true },
		});

		return {
			success: true,
			data: formatChatSession(sessionWithMessages!),
		};
	} catch (error) {
		console.error("Error getting/creating chat session:", error);
		return { success: false, error: "Failed to create session" };
	}
}

/**
 * Send a message and get AI response
 */
export async function sendChatMessage(
	sessionId: string,
	question: string
): Promise<ChatResponse> {
	const startTime = Date.now();

	try {
		// Get session and profile
		const chatSession = await db.query.knowMeChatSessions.findFirst({
			where: eq(knowMeChatSessions.id, sessionId),
			with: {
				profile: {
					with: {
						user: {
							columns: {
								name: true,
								username: true,
								occupation: true,
								bio: true,
							},
						},
					},
				},
			},
		});

		if (!chatSession) {
			return { success: false, error: "Session not found" };
		}

		// Check rate limit
		if (chatSession.rateLimitRemaining <= 0) {
			const resetTime = chatSession.rateLimitResetAt;
			if (new Date() < resetTime) {
				return {
					success: false,
					error: "Rate limit exceeded. Please try again later.",
					rateLimit: {
						remaining: 0,
						resetAt: resetTime,
					},
				};
			}
			// Reset rate limit
			await db.update(knowMeChatSessions)
				.set({
					rateLimitRemaining: 20,
					rateLimitResetAt: new Date(Date.now() + 60 * 60 * 1000),
				})
				.where(eq(knowMeChatSessions.id, sessionId));
		}

		const profile = chatSession.profile;
		const user = profile.user;

		// Save user message
		await db.insert(knowMeChatMessages).values({
			sessionId,
			role: "user",
			content: question,
		});

		// Generate embedding for the question
		const questionEmbedding = await generateEmbedding(question);

		// Search for relevant context in vector DB
		const relevantChunks = await queryVectors(
			questionEmbedding,
			profile.id,
			{
				topK: 5,
				minScore: 0.5,
				includeMetadata: true,
			}
		);

		let answer: string;
		let sources: ChatMessageSource[] = [];
		let tokensUsed = 0;
		let responseTimeMs = Date.now() - startTime;

		if (relevantChunks.length > 0) {
			// Generate response with context (RAG)
			const result = await generateResponse(
				question,
				relevantChunks,
				{
					name: user.name || user.username || "User",
					occupation: user.occupation,
				},
				chatSession.viewerType
			);

			answer = result.answer;
			sources = result.sources;
			tokensUsed = result.tokensUsed;
			responseTimeMs = result.responseTimeMs;

			// Enhance with CTAs
			const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/knowme/${user.username}`;
			answer = enhanceResponseWithCTAs(answer, chatSession.viewerType, profileUrl);
		} else {
			// No context found
			answer = await generateNoContextResponse(
				question,
				user.name || user.username || "User"
			);
		}

		// Save AI response
		await db.insert(knowMeChatMessages).values({
			sessionId,
			role: "assistant",
			content: answer,
			sources: sources as any,
			tokensUsed,
			responseTimeMs,
			retrievedChunks: relevantChunks.map((c) => ({
				id: c.id,
				score: c.score,
			})) as any,
		});

		// Update session stats
		await db.update(knowMeChatSessions)
			.set({
				questionsAsked: sql`${knowMeChatSessions.questionsAsked} + 1`,
				messagesCount: sql`${knowMeChatSessions.messagesCount} + 2`,
				rateLimitRemaining: sql`${knowMeChatSessions.rateLimitRemaining} - 1`,
				lastActivityAt: new Date(),
			})
			.where(eq(knowMeChatSessions.id, sessionId));

		// Update profile stats
		await db.update(knowMeProfiles)
			.set({
				totalQuestionsAnswered: sql`${knowMeProfiles.totalQuestionsAnswered} + 1`,
			})
			.where(eq(knowMeProfiles.id, profile.id));

		// Log analytics
		const questionCategory = categorizeQuestion(question);
		const keywords = extractKeywords(question);

		await db.insert(knowMeQuestionAnalytics).values({
			profileId: profile.id,
			question,
			questionCategory,
			questionKeywords: keywords,
			askedByUserId: chatSession.visitorUserId,
			askedByType: chatSession.viewerType,
			responseGenerated: true,
			responseTimeMs,
			responseTokens: tokensUsed,
		});

		return {
			success: true,
			answer,
			sources,
			sessionId: chatSession.sessionToken,
			rateLimit: {
				remaining: chatSession.rateLimitRemaining - 1,
				resetAt: chatSession.rateLimitResetAt,
			},
		};
	} catch (error) {
		console.error("Error sending chat message:", error);
		return { success: false, error: "Failed to generate response" };
	}
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(
	sessionToken: string
): Promise<KnowMeActionResponse<KnowMeChatSessionData>> {
	try {
		const chatSession = await db.query.knowMeChatSessions.findFirst({
			where: eq(knowMeChatSessions.sessionToken, sessionToken),
			with: {
				messages: {
					orderBy: (m, { asc }) => [asc(m.createdAt)],
				},
			},
		});

		if (!chatSession) {
			return { success: false, error: "Session not found" };
		}

		return {
			success: true,
			data: formatChatSession(chatSession),
		};
	} catch (error) {
		console.error("Error getting chat history:", error);
		return { success: false, error: "Failed to get chat history" };
	}
}

/**
 * Submit feedback for a message
 */
export async function submitMessageFeedback(
	messageId: string,
	wasHelpful: boolean,
	feedback?: string
): Promise<KnowMeActionResponse<void>> {
	try {
		await db.update(knowMeChatMessages)
			.set({ wasHelpful, feedback })
			.where(eq(knowMeChatMessages.id, messageId));

		return { success: true, message: "Feedback submitted" };
	} catch (error) {
		console.error("Error submitting feedback:", error);
		return { success: false, error: "Failed to submit feedback" };
	}
}

/**
 * End chat session
 */
export async function endChatSession(
	sessionToken: string
): Promise<KnowMeActionResponse<void>> {
	try {
		await db.update(knowMeChatSessions)
			.set({ endedAt: new Date() })
			.where(eq(knowMeChatSessions.sessionToken, sessionToken));

		return { success: true };
	} catch (error) {
		console.error("Error ending session:", error);
		return { success: false, error: "Failed to end session" };
	}
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * The row this formats, DERIVED from the schema rather than hand-written, so it
 * cannot drift from the columns. `messages` is optional because the two callers
 * differ: one loads the session with its messages, the other without.
 *
 * This parameter was `any`, which is why `.map((m) => ...)` below had nothing to
 * infer from and every field access in here went unchecked.
 */
type ChatSessionRow = typeof knowMeChatSessions.$inferSelect & {
    messages?: (typeof knowMeChatMessages.$inferSelect)[]
}

function formatChatSession(session: ChatSessionRow): KnowMeChatSessionData {
	return {
		id: session.id,
		profileId: session.profileId,
		visitorUserId: session.visitorUserId,
		viewerType: session.viewerType,
		questionsAsked: session.questionsAsked,
		rateLimitRemaining: session.rateLimitRemaining,
		startedAt: session.startedAt,
		lastActivityAt: session.lastActivityAt,
		messages: (session.messages ?? []).map((m) => ({
			id: m.id,
			role: m.role as "user" | "assistant" | "system",
			content: m.content,
			sources: m.sources as ChatMessageSource[] | null,
			responseTimeMs: m.responseTimeMs,
			wasHelpful: m.wasHelpful,
			createdAt: m.createdAt,
		})),
	};
}

// ============================================
// OWNER TRAINING
// ============================================

/**
 * Save an owner's chat interaction as training data
 * This creates an embedding for the Q&A pair so the AI learns from owner corrections/answers
 */
export async function saveOwnerTraining(
	profileId: string,
	question: string,
	approvedAnswer: string,
	context?: string
): Promise<KnowMeActionResponse<{ trainingId: string }>> {
	try {
		const session = await getSession(headers());
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Verify the user owns this profile
		const profile = await db.query.knowMeProfiles.findFirst({
			where: eq(knowMeProfiles.id, profileId),
		});

		if (!profile || profile.userId !== session.user.id) {
			return { success: false, error: "Not authorized to train this profile" };
		}

		// Generate a unique training ID
		const trainingId = `training_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		// Create chunks for the training data
		const chunks = createOwnerTrainingChunks(profileId, trainingId, {
			question,
			answer: approvedAnswer,
			context,
		});

		// Generate embeddings for the chunks
		const vectorsToUpsert: {
			id: string;
			text: string;
			embedding: number[];
			metadata: EmbeddingMetadata;
		}[] = [];

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			if (!chunk) continue;

			const embedding = await generateEmbedding(chunk.text);

			vectorsToUpsert.push({
				id: generateVectorId(profileId, "OWNER_TRAINING", trainingId, i),
				text: chunk.text,
				embedding,
				metadata: {
					profileId,
					sourceType: "OWNER_TRAINING",
					sourceId: trainingId,
					chunkIndex: i,
					text: chunk.text,
					title: `Training: ${question.slice(0, 50)}`,
				},
			});
		}

		// Upsert to vector DB
		await upsertVectorsBatch(vectorsToUpsert, profileId);

		// Save training record to database for tracking
		await db.insert(knowMePersonalData).values({
			profileId,
			dataType: "OWNER_TRAINING",
			title: `Training: ${question.slice(0, 100)}`,
			contentText: `Q: ${question}\n\nA: ${approvedAnswer}${context ? `\n\nContext: ${context}` : ""}`,
			isActive: true,
		});

		// Update profile embedding count
		await db.update(knowMeProfiles)
			.set({
				totalEmbeddingsCount: sql`${knowMeProfiles.totalEmbeddingsCount} + ${chunks.length}`,
				lastUpdatedAt: new Date(),
			})
			.where(eq(knowMeProfiles.id, profileId));

		return {
			success: true,
			data: { trainingId },
			message: "Training data saved successfully. The AI will now use this information.",
		};
	} catch (error) {
		console.error("Error saving owner training:", error);
		return { success: false, error: "Failed to save training data" };
	}
}

/**
 * Mark a chat response as training-worthy (owner approves the AI response)
 * This saves the Q&A pair as training data automatically
 */
export async function approveResponseAsTraining(
	messageId: string
): Promise<KnowMeActionResponse<{ trainingId: string }>> {
	try {
		const session = await getSession(headers());
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Get the message and its session
		const message = await db.query.knowMeChatMessages.findFirst({
			where: eq(knowMeChatMessages.id, messageId),
			with: {
				session: {
					with: {
						profile: true,
						messages: {
							orderBy: (m, { asc }) => [asc(m.createdAt)],
						},
					},
				},
			},
		});

		if (!message || message.role !== "assistant") {
			return { success: false, error: "Invalid message" };
		}

		// Verify the user owns this profile
		if (message.session.profile.userId !== session.user.id) {
			return { success: false, error: "Not authorized" };
		}

		// Find the user's question that preceded this response
		const messages = message.session.messages;
		const messageIndex = messages.findIndex((m) => m.id === messageId);

		if (messageIndex <= 0) {
			return { success: false, error: "Could not find the original question" };
		}

		const userQuestion = messages[messageIndex - 1];
		if (!userQuestion || userQuestion.role !== "user") {
			return { success: false, error: "Could not find the original question" };
		}

		// Save as training data
		return saveOwnerTraining(
			message.session.profileId,
			userQuestion.content,
			message.content
		);
	} catch (error) {
		console.error("Error approving response as training:", error);
		return { success: false, error: "Failed to save training data" };
	}
}
