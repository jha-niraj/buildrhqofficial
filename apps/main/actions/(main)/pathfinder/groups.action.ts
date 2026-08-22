'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import { db, pathfinderGroups, pathfinderGoals } from '@repo/db'
import { eq, and, asc, max } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ================================================================================
// TYPES
// ================================================================================

export interface CreateGroupInput {
    name: string
    emoji?: string
    color?: string
    description?: string
}

export interface UpdateGroupInput {
    id: string
    name?: string
    emoji?: string
    color?: string
    description?: string
}

// ================================================================================
// CREATE GROUP
// ================================================================================

export async function createPathfinderGroup(input: CreateGroupInput) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if group with same name exists
        const existing = await db.query.pathfinderGroups.findFirst({
            where: and(eq(pathfinderGroups.userId, session.user.id), eq(pathfinderGroups.name, input.name)),
        })

        if (existing) {
            return { success: false, error: 'A group with this name already exists' }
        }

        // Get max order
        const [maxResult] = await db
            .select({ maxOrder: max(pathfinderGroups.order) })
            .from(pathfinderGroups)
            .where(eq(pathfinderGroups.userId, session.user.id))

        const [group] = await db.insert(pathfinderGroups).values({
            userId: session.user.id,
            name: input.name,
            emoji: input.emoji || '📁',
            color: input.color || '#525252',
            description: input.description,
            order: (maxResult?.maxOrder || 0) + 1,
        }).returning()

        revalidatePath('/pathfinder')
        return { success: true, group }
    } catch (error) {
        console.error('Error creating group:', error)
        return { success: false, error: 'Failed to create group' }
    }
}

// ================================================================================
// GET USER GROUPS
// ================================================================================

export async function getUserPathfinderGroups() {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized', groups: [] }
        }

        const groups = await db.query.pathfinderGroups.findMany({
            where: eq(pathfinderGroups.userId, session.user.id),
            orderBy: [asc(pathfinderGroups.order)],
            with: {
                goals: {
                    columns: {
                        id: true,
                        title: true,
                        status: true,
                        progressPercent: true,
                    },
                },
            },
        })

        return { success: true, groups }
    } catch (error) {
        console.error('Error fetching groups:', error)
        return { success: false, error: 'Failed to fetch groups', groups: [] }
    }
}

// ================================================================================
// UPDATE GROUP
// ================================================================================

export async function updatePathfinderGroup(input: UpdateGroupInput) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const group = await db.query.pathfinderGroups.findFirst({
            where: and(eq(pathfinderGroups.id, input.id), eq(pathfinderGroups.userId, session.user.id)),
        })

        if (!group) {
            return { success: false, error: 'Group not found' }
        }

        // Check name uniqueness if changing name
        if (input.name && input.name !== group.name) {
            const existing = await db.query.pathfinderGroups.findFirst({
                where: and(eq(pathfinderGroups.userId, session.user.id), eq(pathfinderGroups.name, input.name)),
            })

            if (existing) {
                return { success: false, error: 'A group with this name already exists' }
            }
        }

        const [updated] = await db.update(pathfinderGroups)
            .set({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.emoji !== undefined && { emoji: input.emoji }),
                ...(input.color !== undefined && { color: input.color }),
                ...(input.description !== undefined && { description: input.description }),
            })
            .where(eq(pathfinderGroups.id, input.id))
            .returning()

        revalidatePath('/pathfinder')
        return { success: true, group: updated }
    } catch (error) {
        console.error('Error updating group:', error)
        return { success: false, error: 'Failed to update group' }
    }
}

// ================================================================================
// DELETE GROUP
// ================================================================================

export async function deletePathfinderGroup(groupId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const group = await db.query.pathfinderGroups.findFirst({
            where: and(eq(pathfinderGroups.id, groupId), eq(pathfinderGroups.userId, session.user.id)),
        })

        if (!group) {
            return { success: false, error: 'Group not found' }
        }

        // Move all goals in this group to ungrouped
        await db.update(pathfinderGoals)
            .set({ groupId: null })
            .where(eq(pathfinderGoals.groupId, groupId))

        await db.delete(pathfinderGroups).where(eq(pathfinderGroups.id, groupId))

        revalidatePath('/pathfinder')
        return { success: true }
    } catch (error) {
        console.error('Error deleting group:', error)
        return { success: false, error: 'Failed to delete group' }
    }
}

// ================================================================================
// ASSIGN GOAL TO GROUP
// ================================================================================

export async function assignGoalToGroup(goalId: string, groupId: string | null) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
        })

        if (!goal) {
            return { success: false, error: 'Goal not found' }
        }

        // Verify group belongs to user if not null
        if (groupId) {
            const group = await db.query.pathfinderGroups.findFirst({
                where: and(eq(pathfinderGroups.id, groupId), eq(pathfinderGroups.userId, session.user.id)),
            })

            if (!group) {
                return { success: false, error: 'Group not found' }
            }
        }

        await db.update(pathfinderGoals)
            .set({ groupId })
            .where(eq(pathfinderGoals.id, goalId))

        revalidatePath('/pathfinder')
        return { success: true }
    } catch (error) {
        console.error('Error assigning goal to group:', error)
        return { success: false, error: 'Failed to assign goal' }
    }
}

// ================================================================================
// REORDER GROUPS
// ================================================================================

export async function reorderPathfinderGroups(groupIds: string[]) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        await Promise.all(
            groupIds.map((id, index) =>
                db.update(pathfinderGroups)
                    .set({ order: index })
                    .where(and(eq(pathfinderGroups.id, id), eq(pathfinderGroups.userId, session.user.id)))
            )
        )

        revalidatePath('/pathfinder')
        return { success: true }
    } catch (error) {
        console.error('Error reordering groups:', error)
        return { success: false, error: 'Failed to reorder groups' }
    }
}
