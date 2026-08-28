"use server";

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import { db, pathfinderGoals, pathfinderSubGoals, studios } from '@repo/db'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from "next/cache";

// ==========================================
// Create or get Studio for a Pathfinder Sub-Goal
// ==========================================

export async function createOrGetStudioForSubGoal(subGoalId: string, subGoalTitle: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const subGoal = await db.query.pathfinderSubGoals.findFirst({
            where: eq(pathfinderSubGoals.id, subGoalId),
            with: { goal: { columns: { userId: true } } },
        });

        if (!subGoal || subGoal.goal.userId !== session.user.id) {
            return { error: "Sub-goal not found" };
        }

        if (subGoal.studioId) {
            return { studioId: subGoal.studioId, isNew: false };
        }

        const studioSlug = `subgoal-${subGoalId}-${Date.now().toString(36)}`;
        const [studio] = await db.insert(studios).values({
            slug: studioSlug,
            title: `📝 ${subGoalTitle}`,
            description: `Study notes for: ${subGoalTitle}`,
            source: 'PATHFINDER',
            sourceId: subGoalId,
            visibility: 'PRIVATE',
            userId: session.user.id,
            stepCount: 0,
        }).returning();

        if (!studio) throw new Error("Failed to create studio")

        await db.update(pathfinderSubGoals)
            .set({ studioId: studio.id })
            .where(eq(pathfinderSubGoals.id, subGoalId));

        revalidatePath(`/pathfinder`);
        return { studioId: studio.id, isNew: true };
    } catch (error) {
        console.error("Error creating studio for sub-goal:", error);
        return { error: "Failed to create studio" };
    }
}
