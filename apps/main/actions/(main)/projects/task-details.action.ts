"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db, projectV2TaskDetails, userTaskV2DetailAccesses, projectV2Tasks,
    users, creditTransactions,
    withTransaction
} from "@repo/db";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openai-client";
import { toErrorMessage } from "@/lib/errors"
import { debitCredits, insufficientCreditsMessage } from '@/lib/credits/debit'

interface ActionResponse {
    success: boolean;
    data?: any;
    error?: string;
}

async function getCurrentUser() {
    const session = await getSession(headers());
    if (!session?.user?.id) throw new Error("Not authenticated");

    const [user] = await db
        .select({ id: users.id, credits: users.credits })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    if (!user) throw new Error("User not found");
    return user;
}

async function deductCredits(userId: string, amount: number, description: string) {
    const result = await debitCredits({ userId, amount, description });
    // Same contract the callers already rely on: throw when the balance is short.
    // What changed is that the check and the write are now one guarded statement,
    // so two concurrent calls cannot both pass it.
    if (!result.ok) throw new Error(insufficientCreditsMessage(result));
}

// ========================================
// CHECK IF TASK DETAIL EXISTS
// ========================================

export async function checkTaskDetailExists(taskId: string): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();

        const existingDetail = await db.query.projectV2TaskDetails.findFirst({
            where: eq(projectV2TaskDetails.taskId, taskId),
            columns: { id: true, accessCount: true },
            with: {
                accesses: {
                    where: (access, { eq }) => eq(access.userId, user.id),
                    columns: { id: true },
                }
            }
        });

        if (!existingDetail) {
            return {
                success: true,
                data: {
                    exists: false,
                    hasAccess: false,
                    needsGeneration: true,
                },
            };
        }

        const userHasAccess = existingDetail.accesses.length > 0;

        return {
            success: true,
            data: {
                exists: true,
                hasAccess: userHasAccess,
                needsGeneration: false,
                taskDetailId: existingDetail.id,
            },
        };
    } catch (error: unknown) {
        console.error("[CHECK_TASK_DETAIL]", error);
        return { success: false, error: toErrorMessage(error) };
    }
}

// ========================================
// GENERATE TASK DETAIL WITH OPENAI
// ========================================

export async function generateTaskDetail(taskId: string, projectSlug: string): Promise<ActionResponse> {
    const startTime = Date.now();
    console.log('🚀 [TASK DETAIL GENERATION START]', new Date().toISOString());

    try {
        const user = await getCurrentUser();

        if (user.credits < 1) {
            return { success: false, error: "Insufficient credits. You need 1 credit to generate task details." };
        }

        const task = await db.query.projectV2Tasks.findFirst({
            where: eq(projectV2Tasks.id, taskId),
            with: {
                sprint: {
                    with: {
                        project: {
                            columns: {
                                id: true,
                                title: true,
                                description: true,
                                technologies: true,
                                generationType: true,
                                primaryLanguageOrFramework: true,
                                keyOutcomes: true,
                            }
                        }
                    }
                }
            }
        });

        if (!task) {
            return { success: false, error: "Task not found" };
        }

        const project = task.sprint?.project;
        if (!project) {
            return { success: false, error: "Project not found for this task" };
        }

        const existingDetail = await db.query.projectV2TaskDetails.findFirst({
            where: eq(projectV2TaskDetails.taskId, taskId),
            with: {
                accesses: {
                    where: (access, { eq }) => eq(access.userId, user.id),
                }
            }
        });

        if (existingDetail && existingDetail.accesses.length > 0) {
            return {
                success: true,
                data: existingDetail,
                error: "You already have access to this task detail",
            };
        }

        if (existingDetail) {
            console.log('📦 [EXISTING_DETAIL] Granting access to existing detail');

            await deductCredits(user.id, 1, `Task Detail Access: ${task.title}`);

            await db.insert(userTaskV2DetailAccesses).values({
                userId: user.id,
                taskDetailId: existingDetail.id,
                creditsPaid: 1,
            });

            await db
                .update(projectV2TaskDetails)
                .set({ accessCount: sql`${projectV2TaskDetails.accessCount} + 1` })
                .where(eq(projectV2TaskDetails.id, existingDetail.id));

            revalidatePath(`/projects/${projectSlug}/tasks`);

            return { success: true, data: existingDetail };
        }

        console.log('🤖 [OPENAI] Generating new task detail');

        // openai imported from @/lib/openai-client

        const systemPrompt = `You are an expert coding mentor helping students break down complex development tasks into manageable sub-tasks.

Your goal is to provide detailed, actionable guidance WITHOUT giving away the actual code solution. Focus on:
- Clear step-by-step approach
- Terminal commands needed
- Learns to understand
- Common pitfalls and errors
- How to debug and validate

IMPORTANT: DO NOT provide actual code implementations. Guide the student's learning process instead.`;

        const userPrompt = `Project Context:
Title: ${project.title}
Type: ${project.generationType}
Tech Stack: ${project.technologies.join(', ')}
Primary: ${project.primaryLanguageOrFramework || 'N/A'}

Task to Break Down:
Title: ${task.title}
Description Steps:
${task.description.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

Success Criteria:
${task.criteria.map((c: string, _i: number) => `- ${c}`).join('\n')}

Existing Hints:
${task.hints.map((h: string, _i: number) => `- ${h}`).join('\n')}

Please generate a detailed breakdown with:

1. **SUB-TASKS** (4-8 sub-tasks):
   Each sub-task should have:
   - title: Clear, action-oriented title
   - description: What needs to be done (2-3 sentences, NO CODE)
   - command: Terminal command if applicable (or null)
   - approach: How to think about this step (3-5 bullet points)
   - tips: Practical tips for this specific sub-task (2-3 items)

2. **COMMON ERRORS** (3-5 errors):
   List common mistakes students make when working on this task

3. **ERRORS TO WATCH OUT FOR** (3-5 errors):
   Specific error messages or issues they might encounter and how to identify them (NOT how to fix them)

4. **RELATED PRACTICE TASKS** (2-4 tasks):
   Suggest additional main tasks (not sub-tasks) that would help practice similar Learns:
   - title: Task title
   - description: Brief description (1-2 sentences)
   - difficulty: BEGINNER | INTERMEDIATE | ADVANCED
   - why_related: Why this helps reinforce the Learns (1 sentence)

Format your response as valid JSON with this exact structure:
{
  "subTasks": [
    {
      "title": "string",
      "description": "string",
      "command": "string or null",
      "approach": ["string"],
      "tips": ["string"]
    }
  ],
  "commonErrors": ["string"],
  "errorsToWatchout": ["string"],
  "relatedTasks": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "string",
      "why_related": "string"
    }
  ]
}

Remember: Guide their learning journey, don't give them the solution!`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const generatedContent = completion.choices[0]?.message.content;
        if (!generatedContent) {
            throw new Error("Failed to generate task detail");
        }

        const parsedContent = JSON.parse(generatedContent);
        console.log('✅ [OPENAI] Task detail generated successfully');

        await deductCredits(user.id, 1, `Task Detail Generation: ${task.title}`);

        const [taskDetail] = await db
            .insert(projectV2TaskDetails)
            .values({
                taskId,
                subTasks: parsedContent.subTasks,
                commonErrors: parsedContent.commonErrors || [],
                errorsToWatchout: parsedContent.errorsToWatchout || [],
                relatedTasks: parsedContent.relatedTasks || [],
                generatedBy: user.id,
                generationCost: 1,
                accessCount: 1,
            })
            .returning();

        if (!taskDetail) throw new Error("Failed to create task detail")

        await db.insert(userTaskV2DetailAccesses).values({
            userId: user.id,
            taskDetailId: taskDetail.id,
            creditsPaid: 1,
        });

        const duration = Date.now() - startTime;
        console.log(`✅ [TASK DETAIL COMPLETE] Generated in ${duration}ms`);

        revalidatePath(`/projects/${projectSlug}/tasks`);

        return { success: true, data: taskDetail };

    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        console.error(`❌ [TASK DETAIL ERROR] Failed after ${duration}ms:`, error);
        return {
            success: false,
            error: toErrorMessage(error) || "Failed to generate task detail",
        };
    }
}

// ========================================
// GET TASK DETAIL
// ========================================

export async function getTaskDetail(taskId: string): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();

        const taskDetail = await db.query.projectV2TaskDetails.findFirst({
            where: eq(projectV2TaskDetails.taskId, taskId),
            with: {
                accesses: {
                    where: (access, { eq }) => eq(access.userId, user.id),
                    columns: { id: true, accessedAt: true },
                }
            }
        });

        if (!taskDetail) {
            return { success: false, error: "Task detail not found" };
        }

        if (taskDetail.accesses.length === 0) {
            return {
                success: false,
                error: "You don't have access to this task detail. Please purchase access first.",
            };
        }

        return { success: true, data: taskDetail };

    } catch (error: unknown) {
        console.error("[GET_TASK_DETAIL]", error);
        return { success: false, error: toErrorMessage(error) };
    }
}
