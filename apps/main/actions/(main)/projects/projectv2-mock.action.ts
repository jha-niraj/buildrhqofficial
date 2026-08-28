"use server"

import { getSession } from "@repo/auth";
import { fetchConversation, conversationDurationSecs } from "@/utils/elevenlabs/conversations";
import { headers } from "next/headers";
import {
    db,
    users,
    creditTransactions,
    projectsV2,
    projectV2MockSessions,
    projectV2KnowledgeBases,
    withTransaction
} from "@repo/db";
import { eq, and, sql } from "drizzle-orm";
import { openai } from '@/lib/openai-client'

import { MOCK_CREDIT_COST } from "@/lib/credits/pricing"

interface MockKnowledgeBase {
    overview: string
    keyTopics: string[]
    technicalLearns: string[]
    interviewQuestions: {
        question: string
        expectedPoints: string[]
        difficulty: 'easy' | 'medium' | 'hard'
    }[]
    practicalScenarios: string[]
}

/**
 * Generate mock interview knowledge base from project data
 */
export async function generateProjectMockKnowledgeBase(projectSlug: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.slug, projectSlug),
            with: {
                sprints: {
                    orderBy: (sprints, { asc }) => [asc(sprints.orderIndex)],
                    limit: 3,
                    with: {
                        tasks: {
                            with: {
                                taskDetail: {
                                    columns: { subTasks: true }
                                }
                            },
                            orderBy: (tasks, { asc }) => [asc(tasks.orderIndex)],
                            limit: 5
                        }
                    }
                },
                knowledgeBase: true
            }
        });

        if (!project) {
            return { success: false, error: "Project not found" }
        }

        if (!project.includeAssessment) {
            return { success: false, error: "This project does not include assessments" }
        }

        const knowledgeData = project.knowledgeBase as any
        if (knowledgeData?.mockKnowledgeBase) {
            return {
                success: true,
                mockData: {
                    knowledgeBase: knowledgeData.mockKnowledgeBase as string,
                    hasKnowledgeBase: true
                }
            }
        }

        const [user] = await db.select({ credits: users.credits, name: users.name, username: users.username })
            .from(users)
            .where(eq(users.id, session.user.id));

        if (!user || user.credits < MOCK_CREDIT_COST) {
            return { success: false, error: "Insufficient credits", requiredCredits: MOCK_CREDIT_COST }
        }

        const stacks = project.stacks as any
        const allTasks = project.sprints.flatMap((s) => s.tasks)
        const taskSummary = allTasks.slice(0, 10).map((t) => {
            const subtasksData = (t.taskDetail?.subTasks as any[]) || []
            return {
                title: t.title,
                subtasks: subtasksData.slice(0, 3).map((st) => st.title || st)
            }
        })

        const projectContext = `
            Project: ${project.title}
            Description: ${project.description?.substring(0, 300) || 'N/A'}
            Technologies: ${project.technologies.slice(0, 8).join(', ')}
            Stack: Frontend: ${stacks?.frontend || 'N/A'}, Backend: ${stacks?.backend || 'N/A'}, Database: ${stacks?.database || 'N/A'}
            Key Tasks: ${taskSummary.slice(0, 5).map((t) => `${t.title} (${t.subtasks.join(', ')})`).join('; ')}
        `

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a technical interviewer. Generate a concise knowledge base for a mock interview. Focus on practical, project-relevant questions. Return valid JSON only."
                },
                {
                    role: "user",
                    content: `Generate a mock interview knowledge base for this project. Include 8-10 technical questions, key Learns, and practical scenarios. Keep it concise.

${projectContext}

Return JSON with structure:
{
    "overview": "Brief project overview for interviewer context",
    "keyTopics": ["topic1", "topic2", ...max 6],
    "technicalLearns": ["Learn1", "Learn2", ...max 8],
    "interviewQuestions": [
        {"question": "...", "expectedPoints": ["point1", "point2"], "difficulty": "easy|medium|hard"}
    ],
    "practicalScenarios": ["scenario1", "scenario2", ...max 4]
}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
            return { success: false, error: "Failed to generate knowledge base" }
        }

        let knowledgeBase: MockKnowledgeBase
        try {
            knowledgeBase = JSON.parse(content)
        } catch (e) {
            console.error("Failed to parse knowledge base:", e)
            return { success: false, error: "Invalid response format from AI" }
        }

        const knowledgeBaseText = `
PROJECT OVERVIEW: ${knowledgeBase.overview}

KEY TOPICS TO ASSESS:
${knowledgeBase.keyTopics.map(t => `- ${t}`).join('\n')}

TECHNICAL LearnS:
${knowledgeBase.technicalLearns.map(c => `- ${c}`).join('\n')}

INTERVIEW QUESTIONS:
${knowledgeBase.interviewQuestions.map((q, i) => `
${i + 1}. [${q.difficulty.toUpperCase()}] ${q.question}
   Expected Points: ${q.expectedPoints.join('; ')}
`).join('')}

PRACTICAL SCENARIOS:
${knowledgeBase.practicalScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`

        await withTransaction(async (tx) => {
            // Guarded in SQL, not by the balance read above: two concurrent requests
                // both pass a read-then-write check and both debit. Zero rows updated
                // means the balance moved under us, and throwing rolls the whole
                // transaction back - so nothing is created that was not paid for.
            const debited = await tx.update(users)
                .set({ credits: sql`${users.credits} - ${MOCK_CREDIT_COST}` })
                .where(and(eq(users.id, session.user.id), sql`${users.credits} >= ${MOCK_CREDIT_COST}`))
                .returning({ credits: users.credits });
            if (debited.length === 0) throw new Error("Insufficient credits");

            await tx.insert(creditTransactions).values({
                userId: session.user.id,
                currency: "INR",
                // Negative: SPEND rows debit - see the note in projectv2-quiz.
                amount: -MOCK_CREDIT_COST,
                type: "SPEND",
                description: `Mock Interview generated for project: ${project.title}`
            });

            const existing = await tx.query.projectV2KnowledgeBases.findFirst({
                where: eq(projectV2KnowledgeBases.projectId, project.id)
            });

            if (existing) {
                await tx.update(projectV2KnowledgeBases)
                    .set({
                        mockKnowledgeBase: knowledgeBaseText,
                        mockQuestionsData: knowledgeBase as any
                    })
                    .where(eq(projectV2KnowledgeBases.id, existing.id));
            } else {
                await tx.insert(projectV2KnowledgeBases).values({
                    projectId: project.id,
                    mockKnowledgeBase: knowledgeBaseText,
                    mockQuestionsData: knowledgeBase as any
                });
            }
        });

        return {
            success: true,
            mockData: {
                knowledgeBase: knowledgeBaseText,
                hasKnowledgeBase: true
            }
        }

    } catch (error) {
        console.error("Error generating mock knowledge base:", error)
        return { success: false, error: "Failed to generate mock interview" }
    }
}

/**
 * Create a project mock interview session
 */
export async function createProjectMockSession(projectSlug: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.slug, projectSlug),
            with: { knowledgeBase: true }
        });

        if (!project) {
            return { success: false, error: "Project not found" }
        }

        const knowledgeData = (project.knowledgeBase as any)
        if (!knowledgeData?.mockKnowledgeBase) {
            return { success: false, error: "Mock interview knowledge base not generated yet" }
        }

        const [user] = await db.select({ name: users.name, username: users.username })
            .from(users)
            .where(eq(users.id, session.user.id));

        const [mockSession] = await db.insert(projectV2MockSessions).values({
            userId: session.user.id,
            projectId: project.id,
            agentId: process.env.NEXT_PUBLIC_ELEVENLABS_MOCKVOICE!,
            status: 'SCHEDULED',
            scheduledAt: new Date()
        }).returning();

        const mockKnowledgeBase = knowledgeData.mockKnowledgeBase as string

        return {
            success: true,
            sessionId: mockSession!.id,
            agentId: mockSession!.agentId,
            knowledgeBase: mockKnowledgeBase,
            variables: {
                username: user?.name?.split(' ')[0] || user?.username || 'there',
                position: `${project.title} Developer`,
                level: project.difficulty || 'INTERMEDIATE',
                description: project.description?.substring(0, 200) || '',
                knowledge_base: mockKnowledgeBase
            }
        }
    } catch (error) {
        console.error("Error creating mock session:", error)
        return { success: false, error: "Failed to create session" }
    }
}

/**
 * Update mock session status
 */
export async function updateProjectMockSessionStatus(
    sessionId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    conversationId?: string
) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        await db.update(projectV2MockSessions)
            .set({
                status,
                conversationId,
                startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
                completedAt: status === 'COMPLETED' ? new Date() : undefined
            })
            .where(and(
                eq(projectV2MockSessions.id, sessionId),
                eq(projectV2MockSessions.userId, session.user.id)
            ));

        return { success: true }
    } catch (error) {
        console.error("Error updating mock session:", error)
        return { success: false, error: "Failed to update session" }
    }
}

/**
 * Save conversation transcript and generate AI feedback
 */
export async function processProjectMockCompletion(
    sessionId: string,
    conversationId: string
) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        // The shared client - see plan/mock-consolidation/, MC-1. This block used
        // to be a second copy of the same fetch, and it carried four defects the
        // canonical copy did not:
        //
        //   1. It read `process.env.ELEVENLABS_AI_KEY`, which is set NOWHERE, so
        //      this function returned "ElevenLabs API not configured" on every
        //      single call. The whole completion path was dead.
        //   2. `if (response.ok)` had no else, so a failed fetch fell straight
        //      through to the write below and marked the session COMPLETED with
        //      an empty transcript.
        //   3. It read `metadata?.duration` and divided by 1000. The field is
        //      `metadata.call_duration_secs` and is already in seconds, so every
        //      duration was 0.
        //   4. No `cache: 'no-store'`, so a conversation still being finalised
        //      could come back from Next's fetch cache.
        const conversation = await fetchConversation(conversationId)

        // A failed fetch STOPS here. Writing a completed session with no
        // transcript loses the interview and then generates feedback from
        // nothing, which is worse than reporting the failure and retrying.
        if (!conversation.success) {
            return { success: false, error: conversation.error }
        }

        const transcript = conversation.data.transcript ?? []
        const duration = conversationDurationSecs(conversation.data)

        await db.update(projectV2MockSessions)
            .set({
                status: 'COMPLETED',
                completedAt: new Date(),
                conversationId,
                transcript: JSON.stringify(transcript),
                duration
            })
            .where(eq(projectV2MockSessions.id, sessionId));

        if (transcript.length > 0) {
            const transcriptText = transcript
                .map((t) => `${t.role}: ${t.message}`)
                .join('\n')

            const feedbackCompletion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Analyze this mock interview transcript and provide concise feedback. Return JSON only."
                    },
                    {
                        role: "user",
                        content: `Analyze this interview transcript and provide feedback:

${transcriptText.substring(0, 3000)}

Return JSON: {"overallScore": 0-100, "communication": {"score": 0-100, "feedback": "..."}, "technical": {"score": 0-100, "feedback": "..."}, "problemSolving": {"score": 0-100, "feedback": "..."}, "strengths": ["..."], "improvements": ["..."], "detailedFeedback": "..."}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            })

            const feedbackContent = feedbackCompletion.choices[0]?.message?.content
            if (feedbackContent) {
                try {
                    const feedback = JSON.parse(feedbackContent)
                    await db.update(projectV2MockSessions)
                        .set({
                            score: feedback.overallScore,
                            technicalScore: feedback.technical?.score,
                            communicationScore: feedback.communication?.score,
                            learnualScore: feedback.problemSolving?.score,
                            feedback: feedback.detailedFeedback,
                            strengths: feedback.strengths || [],
                            improvements: feedback.improvements || []
                        })
                        .where(eq(projectV2MockSessions.id, sessionId));

                    try {
                        const mockSessionRow = await db.query.projectV2MockSessions.findFirst({
                            where: eq(projectV2MockSessions.id, sessionId),
                            columns: { projectId: true }
                        });
                        if (mockSessionRow) {
                            const { updateProjectScore } = await import("./project-score.action")
                            await updateProjectScore(mockSessionRow.projectId, session.user.id)
                        }
                    } catch (e) {
                        console.error("Failed to update leaderboard:", e)
                    }

                    return { success: true, analysis: feedback }
                } catch (e) {
                    console.error("Failed to parse feedback:", e)
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error("Error processing mock completion:", error)
        return { success: false, error: "Failed to process interview" }
    }
}

/**
 * Get user's mock interview attempts for a project
 */
export async function getProjectMockAttempts(projectSlug: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.slug, projectSlug),
            columns: { id: true }
        });

        if (!project) {
            return { success: false, error: "Project not found" }
        }

        const attempts = await db.query.projectV2MockSessions.findMany({
            where: and(
                eq(projectV2MockSessions.userId, session.user.id),
                eq(projectV2MockSessions.projectId, project.id),
                eq(projectV2MockSessions.status, 'COMPLETED')
            ),
            orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
            limit: 10,
            columns: {
                id: true,
                score: true,
                duration: true,
                completedAt: true,
                createdAt: true
            }
        });

        return { success: true, attempts }
    } catch (error) {
        console.error("Error fetching mock attempts:", error)
        return { success: false, error: "Failed to fetch attempts" }
    }
}
