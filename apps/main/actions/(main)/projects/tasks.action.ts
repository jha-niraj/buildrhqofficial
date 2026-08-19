'use server'

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    projectV2Tasks,
    userProjectV2Progress,
    userTaskV2Statuses,
} from "@repo/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from 'next/cache'

type ActionResult = {
    success: boolean
    error?: string
    data?: any
}

export async function updateTaskStatus(
    taskId: string,
    status: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED',
    path?: string
): Promise<ActionResult> {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const task = await db.query.projectV2Tasks.findFirst({
            where: eq(projectV2Tasks.id, taskId),
            with: { sprint: true }
        });

        if (!task) {
            return { success: false, error: 'Task not found' }
        }

        const projectId = task.sprint.projectId;

        // Find user progress
        const progress = await db.query.userProjectV2Progress.findFirst({
            where: and(
                eq(userProjectV2Progress.userId, session.user.id),
                eq(userProjectV2Progress.projectId, projectId)
            )
        });

        if (!progress) {
            return { success: false, error: 'Project progress not found (Please start the project first)' }
        }

        // Upsert user status
        const existingStatus = await db.query.userTaskV2Statuses.findFirst({
            where: and(
                eq(userTaskV2Statuses.userId, session.user.id),
                eq(userTaskV2Statuses.taskId, taskId)
            )
        });

        if (existingStatus) {
            await db.update(userTaskV2Statuses)
                .set({
                    status,
                    completedAt: status === 'COMPLETED' ? new Date() : null
                })
                .where(eq(userTaskV2Statuses.id, existingStatus.id));
        } else {
            await db.insert(userTaskV2Statuses).values({
                userId: session.user.id,
                taskId,
                projectId,
                progressId: progress.id,
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null
            });
        }

        if (path) revalidatePath(path)
        return { success: true }
    } catch (error) {
        console.error('Error updating task status:', error)
        return { success: false, error: 'Failed to update task status' }
    }
}

export async function addTaskToSprint(
    projectId: string,
    sprintId: string,
    data: {
        title: string
        description: string
        difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
        estimatedTime?: string
        category?: string
    },
    path?: string
): Promise<ActionResult> {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        // Get max order index
        const lastTask = await db.query.projectV2Tasks.findFirst({
            where: eq(projectV2Tasks.sprintId, sprintId),
            orderBy: (tasks: any, { desc }: any) => [desc(tasks.orderIndex)],
            columns: { orderIndex: true }
        });
        const newOrderIndex = (lastTask?.orderIndex ?? -1) + 1;

        await db.insert(projectV2Tasks).values({
            sprintId,
            projectV2Id: projectId,
            title: data.title,
            description: [data.description],
            difficulty: data.difficulty,
            orderIndex: newOrderIndex,
            estimatedTime: data.estimatedTime,
            category: data.category
        });

        if (path) revalidatePath(path)
        return { success: true }
    } catch (error) {
        console.error('Error adding task:', error)
        return { success: false, error: 'Failed to add task' }
    }
}
