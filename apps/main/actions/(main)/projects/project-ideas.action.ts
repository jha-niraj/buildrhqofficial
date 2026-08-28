"use server"

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    users,
    xpTransactions,
    projectIdeas,
    withTransaction
} from "@repo/db";
import { eq, and, or, desc, sql, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache"
import { toErrorMessage } from "@/lib/errors"

// ===============================================
// FETCH PROJECT IDEAS
// ===============================================

export async function getProjectIdeasByTechnology(technology: string) {
    try {
        const projects = await db.query.projectIdeas.findMany({
            where: and(
                eq(projectIdeas.technology, technology),
                eq(projectIdeas.status, 'APPROVED')
            ),
            orderBy: [desc(projectIdeas.views), desc(projectIdeas.createdAt)],
        });

        return { success: true, data: projects }
    } catch (error: unknown) {
        console.error('Failed to fetch project ideas:', error)
        return { success: false, error: toErrorMessage(error) || 'Failed to fetch project ideas' }
    }
}

export async function getProjectIdeaById(id: string) {
    try {
        const project = await db.query.projectIdeas.findFirst({
            where: eq(projectIdeas.id, id),
            with: {
                submittedBy: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        });

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        await db.update(projectIdeas)
            .set({ views: sql`${projectIdeas.views} + 1` })
            .where(eq(projectIdeas.id, id));

        return { success: true, data: project }
    } catch (error: unknown) {
        console.error('Failed to fetch project idea:', error)
        return { success: false, error: toErrorMessage(error) || 'Failed to fetch project idea' }
    }
}

export async function searchProjectIdeas(query: string, filters?: {
    technology?: string
    difficulty?: string
    category?: string
}) {
    try {
        const conditions: (SQL | undefined)[] = [eq(projectIdeas.status, 'APPROVED')];

        if (query) {
            conditions.push(
                or(
                    sql`${projectIdeas.projectTitle} ILIKE ${'%' + query + '%'}`,
                    sql`${projectIdeas.projectDescription} ILIKE ${'%' + query + '%'}`
                )
            );
        }

        if (filters?.technology) {
            conditions.push(eq(projectIdeas.technology, filters.technology));
        }

        if (filters?.difficulty) {
            conditions.push(eq(projectIdeas.difficulty, filters.difficulty));
        }

        if (filters?.category) {
            conditions.push(sql`${projectIdeas.categories} @> ARRAY[${filters.category}]::text[]`);
        }

        const projects = await db.query.projectIdeas.findMany({
            where: conditions.length > 1 ? and(...conditions) : conditions[0],
            orderBy: [desc(projectIdeas.views), desc(projectIdeas.createdAt)],
            limit: 50,
        });

        return { success: true, data: projects }
    } catch (error: unknown) {
        console.error('Failed to search project ideas:', error)
        return { success: false, error: toErrorMessage(error) || 'Failed to search project ideas' }
    }
}
// ===============================================
// ENGAGEMENT ACTIONS (UPVOTE & VIEWS)
// ===============================================

export async function incrementProjectView(projectId: string) {
    try {
        await db.update(projectIdeas)
            .set({ views: sql`${projectIdeas.views} + 1` })
            .where(eq(projectIdeas.id, projectId));

        return { success: true }
    } catch (error: unknown) {
        console.error('Failed to increment view:', error)
        return { success: false, error: toErrorMessage(error) || 'Failed to increment view' }
    }
}
// ===============================================
// PROBLEM STATEMENTS
// ===============================================

export async function getProblemStatements(options?: {
    limit?: number
    difficulty?: string
    search?: string
}) {
    try {
        const { limit = 50, difficulty, search } = options || {}

        const conditions: (SQL | undefined)[] = [
            eq(projectIdeas.ideaType, 'PROBLEM_STATEMENT'),
            eq(projectIdeas.status, 'APPROVED'),
        ];

        if (difficulty && difficulty !== 'all') {
            conditions.push(eq(projectIdeas.difficulty, difficulty));
        }

        if (search) {
            conditions.push(
                or(
                    sql`${projectIdeas.projectTitle} ILIKE ${'%' + search + '%'}`,
                    sql`${projectIdeas.projectDescription} ILIKE ${'%' + search + '%'}`,
                    sql`${projectIdeas.overview} ILIKE ${'%' + search + '%'}`
                )
            );
        }

        const ideas = await db.query.projectIdeas.findMany({
            where: and(...conditions),
            orderBy: [desc(projectIdeas.views), desc(projectIdeas.createdAt)],
            limit,
            with: {
                submittedBy: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        });

        return { success: true, data: ideas }
    } catch (error: unknown) {
        console.error('Failed to fetch problem statements:', error)
        return { success: false, error: toErrorMessage(error) || 'Failed to fetch problem statements' }
    }
}
