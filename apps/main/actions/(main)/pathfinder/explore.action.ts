'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import {
    db,
    pathfinderGoals,
    pathfinderVerifications,
    pathfinderDailySessions,
    pathfinderSubGoals,
    pathfinderGoalPurchases,
    users,
    creditTransactions,
    subTransactions,
    earnings,
    withTransaction
} from '@repo/db'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ================================================================================
// GET PUBLIC GOALS (for explore page)
// ================================================================================

export async function getPublicPathfinderGoals() {
    try {
        const goals = await db.query.pathfinderGoals.findMany({
            where: eq(pathfinderGoals.isPublic, true),
            orderBy: [desc(pathfinderGoals.createdAt)],
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                dailySessions: true,
                subGoals: true,
            },
        })

        return { success: true, goals }
    } catch (error) {
        console.error('Error fetching public goals:', error)
        return { success: false, goals: [] }
    }
}

// ================================================================================
// GET PUBLIC GOAL BY ID/SLUG (for preview - no auth required)
// ================================================================================

export async function getPublicPathfinderGoalById(goalId: string) {
    try {
        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.isPublic, true)),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                dailySessions: {
                    orderBy: [asc(pathfinderDailySessions.date)],
                    with: {
                        subGoals: {
                            orderBy: [asc(pathfinderSubGoals.order)],
                            columns: {
                                id: true,
                                title: true,
                                description: true,
                                status: true,
                                hasCoding: true,
                            },
                        },
                    },
                },
            },
        })

        if (!goal) return { success: false, goal: null }

        const subGoals = goal.dailySessions.flatMap((s) => s.subGoals)
        return {
            success: true,
            goal: {
                ...goal,
                subGoals,
            },
        }
    } catch (error) {
        console.error('Error fetching public goal:', error)
        return { success: false, goal: null }
    }
}

/** Fetch a public goal by slug (for explore URL). If multiple creators have same slug, returns first match. */
export async function getPublicPathfinderGoalBySlugOnly(slug: string) {
    try {
        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.slug, slug), eq(pathfinderGoals.isPublic, true)),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                dailySessions: {
                    orderBy: [asc(pathfinderDailySessions.date)],
                    with: {
                        subGoals: {
                            orderBy: [asc(pathfinderSubGoals.order)],
                            columns: {
                                id: true,
                                title: true,
                                description: true,
                                status: true,
                                hasCoding: true,
                                isAIGenerated: true,
                            },
                        },
                    },
                },
            },
        })

        if (!goal) return { success: false, goal: null }

        const subGoals = goal.dailySessions.flatMap((s) => s.subGoals)
        return {
            success: true,
            goal: {
                ...goal,
                subGoals,
            },
        }
    } catch (error) {
        console.error('Error fetching public goal by slug:', error)
        return { success: false, goal: null }
    }
}

export async function getPublicPathfinderGoalBySlug(slug: string, creatorId: string) {
    try {
        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(
                eq(pathfinderGoals.slug, slug),
                eq(pathfinderGoals.userId, creatorId),
                eq(pathfinderGoals.isPublic, true)
            ),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                dailySessions: {
                    orderBy: [asc(pathfinderDailySessions.date)],
                    with: {
                        subGoals: {
                            orderBy: [asc(pathfinderSubGoals.order)],
                            columns: {
                                id: true,
                                title: true,
                                description: true,
                                status: true,
                                hasCoding: true,
                            },
                        },
                    },
                },
            },
        })

        if (!goal) return { success: false, goal: null }

        const subGoals = goal.dailySessions.flatMap((s) => s.subGoals)
        return {
            success: true,
            goal: {
                ...goal,
                subGoals,
            },
        }
    } catch (error) {
        console.error('Error fetching public goal:', error)
        return { success: false, goal: null }
    }
}

// ================================================================================
// COPY/FORK GOAL (free or paid)
// ================================================================================

export async function copyPathfinderGoal(goalId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized', slug: null }
        }

        const source = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.isPublic, true)),
            with: {
                dailySessions: {
                    orderBy: [asc(pathfinderDailySessions.date)],
                    with: {
                        subGoals: {
                            orderBy: [asc(pathfinderSubGoals.order)],
                        },
                    },
                },
            },
        })

        if (!source) {
            return { success: false, error: 'Goal not found or not public', slug: null }
        }

        if (source.userId === session.user.id) {
            return { success: false, error: "You can't copy your own goal", slug: null }
        }

        const price = source.creditPrice ?? 0

        if (price > 0) {
            const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, session.user.id))
            if (!user || user.credits < price) {
                return {
                    success: false,
                    error: `Insufficient credits. This goal costs ${price} credits.`,
                    code: 'INSUFFICIENT_CREDITS',
                    required: price,
                    available: user?.credits ?? 0,
                    slug: null,
                }
            }
        }

        // Find available slug
        const slug = await (async () => {
            const base = source.slug
            let s = base
            let i = 0
            while (true) {
                const exists = await db.query.pathfinderGoals.findFirst({
                    where: and(eq(pathfinderGoals.userId, session.user!.id!), eq(pathfinderGoals.slug, s)),
                })
                if (!exists) return s
                i++
                s = `${base}-${i}`
            }
        })()

        const result = await withTransaction(async (tx) => {
            const [newGoal] = await tx.insert(pathfinderGoals).values({
                userId: session.user!.id!,
                title: source.title,
                slug,
                category: source.category,
                level: source.level,
                focusAreas: source.focusAreas,
                targetDate: source.targetDate,
                duration: source.duration,
                estimatedDays: source.estimatedDays,
                overview: source.overview,
                learningObjectives: source.learningObjectives,
                prerequisites: source.prerequisites,
                isPublic: false,
                forkedFromId: source.id,
                status: 'ACTIVE',
                startedAt: new Date(),
            }).returning()

            if (!newGoal) throw new Error("Failed to create goal")

            await tx.insert(pathfinderVerifications).values({
                goalId: newGoal.id,
                quizStatus: 'PENDING',
                codingStatus: 'LOCKED',
                mockStatus: 'LOCKED',
                projectStatus: 'PENDING',
            })

            for (const ds of source.dailySessions) {
                const [newSession] = await tx.insert(pathfinderDailySessions).values({
                    goalId: newGoal.id,
                    userId: session.user!.id!,
                    date: ds.date,
                    totalSubGoals: ds.totalSubGoals,
                    totalQuizQuestions: ds.totalQuizQuestions,
                    totalCodingProblems: ds.totalCodingProblems,
                }).returning()

                if (!newSession) throw new Error("Failed to create daily session")

                for (const sg of ds.subGoals) {
                    await tx.insert(pathfinderSubGoals).values({
                        goalId: newGoal.id,
                        sessionId: newSession.id,
                        title: sg.title,
                        description: sg.description,
                        source: sg.source,
                        order: sg.order,
                        hasCoding: sg.hasCoding,
                        status: 'PENDING',
                    })
                }
            }

            if (price > 0) {
                // Guarded in SQL, not by the balance read above: two concurrent requests
                // both pass a read-then-write check and both debit. Zero rows updated
                // means the balance moved under us, and throwing rolls the whole
                // transaction back - so nothing is created that was not paid for.
                const debited = await tx.update(users)
                    .set({ credits: sql`${users.credits} - ${price}` })
                    .where(and(eq(users.id, session.user!.id!), sql`${users.credits} >= ${price}`))
                    .returning({ credits: users.credits })
                if (debited.length === 0) throw new Error("Insufficient credits")

                const [buyerTx] = await tx.insert(creditTransactions).values({
                    userId: session.user!.id!,
                    amount: -price,
                    type: 'SPEND',
                    description: `Pathfinder: Copy "${source.title}" from creator`,
                    currency: 'INR',
                }).returning()

                if (!buyerTx) throw new Error("Failed to create credit transaction")

                await tx.insert(subTransactions).values({
                    creditTransactionId: buyerTx.id,
                    module: 'PATHFINDER',
                    referenceId: source.id,
                    metadata: {
                        goalTitle: source.title,
                        creatorId: source.userId,
                        buyerId: session.user!.id!,
                    },
                })

                await tx.update(users)
                    .set({ credits: sql`${users.credits} + ${price}` })
                    .where(eq(users.id, source.userId))

                const [creatorTx] = await tx.insert(creditTransactions).values({
                    userId: source.userId,
                    amount: price,
                    type: 'REWARD',
                    description: `Pathfinder: Sale of goal "${source.title}"`,
                    currency: 'INR',
                }).returning()

                if (!creatorTx) throw new Error("Failed to create creator transaction")

                await tx.insert(subTransactions).values({
                    creditTransactionId: creatorTx.id,
                    module: 'PATHFINDER',
                    referenceId: source.id,
                    metadata: {
                        goalTitle: source.title,
                        buyerId: session.user!.id!,
                    },
                })

                await tx.insert(earnings).values({
                    userId: source.userId,
                    module: 'PATHFINDER',
                    referenceId: source.id,
                    amount: price,
                    sourceUserId: session.user!.id!,
                })

                await tx.insert(pathfinderGoalPurchases).values({
                    goalId: source.id,
                    buyerId: session.user!.id!,
                    creditsPaid: price,
                })
            }

            return newGoal
        })

        revalidatePath('/pathfinder')
        revalidatePath('/pathfinder/explore')
        return { success: true, slug: result.slug, goalId: result.id }
    } catch (error) {
        console.error('Error copying goal:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to copy goal',
            slug: null,
        }
    }
}
