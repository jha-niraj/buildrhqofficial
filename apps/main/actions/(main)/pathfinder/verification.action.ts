'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import {
    db,
    pathfinderGoals,
    pathfinderVerifications,
    pathfinderQuizAttempts,
    pathfinderCodingSubmissions,
    users,
    creditTransactions,
} from '@repo/db'
import { eq, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { VerificationAIPlan } from '@/types/pathfinder'
import { PATHFINDER_CREDITS, PATHFINDER_XP } from '@/lib/constants/pricing'
import { addXpToUser } from '@/actions/(main)/user/level.action'

// ================================================================================
// TYPES
// ================================================================================

export type VerificationSectionStatus = 'LOCKED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface VerificationQuizSubmission {
    goalId: string
    answers: {
        questionId: string
        selectedAnswer: number
        isCorrect: boolean
        timeTaken: number
    }[]
    totalTime: number
}

export interface VerificationCodingSubmission {
    goalId: string
    problemId: string
    code: string
    language: string
    passed: boolean
    testsPassed: number
    totalTests: number
    testResults?: {
        testId: string
        passed: boolean
        input: string
        expected: string
        actual: string
        error?: string
    }[]
}

// ================================================================================
// START VERIFICATION
// ================================================================================

export async function startVerification(goalId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal) {
            return { success: false, error: 'Goal not found' }
        }

        if (goal.status !== 'ACTIVE') {
            return { success: false, error: 'Goal is not in active status' }
        }

        await db.update(pathfinderGoals)
            .set({
                status: 'VERIFICATION',
                verificationStartedAt: new Date(),
            })
            .where(eq(pathfinderGoals.id, goalId))

        revalidatePath(`/pathfinder/${goalId}`)
        return { success: true }
    } catch (error) {
        console.error('Error starting verification:', error)
        return { success: false, error: 'Failed to start verification' }
    }
}

// ================================================================================
// GET VERIFICATION STATUS
// ================================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUID_REGEX = /^c[a-z0-9]{24}$/i

export async function getVerificationStatus(slugOrId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized', verification: null }
        }

        const isId = UUID_REGEX.test(slugOrId) || CUID_REGEX.test(slugOrId)
        const goal = await db.query.pathfinderGoals.findFirst({
            where: isId
                ? and(eq(pathfinderGoals.id, slugOrId), eq(pathfinderGoals.userId, session.user.id))
                : and(eq(pathfinderGoals.userId, session.user.id), eq(pathfinderGoals.slug, slugOrId)),
            with: { verification: true },
        })

        if (!goal) {
            return { success: false, error: 'Goal not found', verification: null }
        }

        const verification = goal.verification ?? null
        return { success: true, verification }
    } catch (error) {
        console.error('Error fetching verification status:', error)
        return { success: false, error: 'Failed to fetch status', verification: null }
    }
}

// ================================================================================
// GENERATE VERIFICATION CONTENT — moved to the generation worker
// ================================================================================
//
// This ran the OpenAI Assistants API inline and polled it up to 90 times at one
// second apart — up to 90 seconds of blocking sleep in a server action, which
// Cloudflare kills long before it finishes, after the user has been charged.
//
// It now runs on a Durable Object with an Alarm:
//   dispatch/poll  actions/(main)/workers/verificationworker.action.ts
//   worker         apps/worker/src/jobs/verification-generation.ts
//
// Verified 2026-08-02 against the deployed worker: the client disconnected 45s
// in and never polled again; the run still completed and wrote a 22-question
// plan to the verification row. That is the behaviour this file could not have.

// ================================================================================
// SUBMIT VERIFICATION QUIZ
// ================================================================================

export async function submitVerificationQuiz(submission: VerificationQuizSubmission) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, submission.goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal || !goal.verification) {
            return { success: false, error: 'Goal not found' }
        }

        const correctCount = submission.answers.filter((a) => a.isCorrect).length
        const score = Math.round((correctCount / submission.answers.length) * 100)

        await db.insert(pathfinderQuizAttempts).values({
            goalId: submission.goalId,
            userId: session.user.id,
            quizType: 'VERIFICATION',
            score,
            correctCount,
            totalQuestions: submission.answers.length,
            timeTaken: submission.totalTime,
            answers: submission.answers,
            startedAt: new Date(Date.now() - submission.totalTime * 1000),
        })

        const passed = score >= 70
        const newStatus: VerificationSectionStatus = passed ? 'COMPLETED' : 'FAILED'

        await db.update(pathfinderVerifications)
            .set({
                quizStatus: newStatus,
                quizScore: score,
                quizAttempts: goal.verification.quizAttempts + 1,
                quizCompletedAt: passed ? new Date() : undefined,
                ...(passed ? { codingStatus: 'PENDING' as VerificationSectionStatus } : {}),
            })
            .where(eq(pathfinderVerifications.id, goal.verification.id))

        if (passed) {
            await checkVerificationCompletion(goal.verification.id)
        }

        revalidatePath(`/pathfinder/${submission.goalId}/verify`)
        return { success: true, score, passed }
    } catch (error) {
        console.error('Error submitting verification quiz:', error)
        return { success: false, error: 'Failed to submit quiz' }
    }
}

// ================================================================================
// SUBMIT VERIFICATION CODING
// ================================================================================

export async function submitVerificationCoding(submission: VerificationCodingSubmission) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, submission.goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal || !goal.verification) {
            return { success: false, error: 'Goal not found' }
        }

        await db.insert(pathfinderCodingSubmissions).values({
            goalId: submission.goalId,
            userId: session.user.id,
            submissionType: 'VERIFICATION',
            problemId: submission.problemId,
            code: submission.code,
            language: submission.language,
            passed: submission.passed,
            testsPassed: submission.testsPassed,
            totalTests: submission.totalTests,
            testResults: submission.testResults,
        })

        const allSubmissions = await db.query.pathfinderCodingSubmissions.findMany({
            where: and(
                eq(pathfinderCodingSubmissions.goalId, submission.goalId),
                eq(pathfinderCodingSubmissions.submissionType, 'VERIFICATION')
            ),
        })

        const passedProblems = new Set(
            allSubmissions.filter((s) => s.passed).map((s) => s.problemId)
        )

        const aiPlan = (goal.verification as { generatedPlan?: { codingQuestions?: unknown[] } } | null)?.generatedPlan as { codingQuestions?: unknown[] } | null
        const totalProblems = aiPlan?.codingQuestions?.length || 5

        const score = Math.round((passedProblems.size / totalProblems) * 100)
        const allPassed = passedProblems.size >= totalProblems

        await db.update(pathfinderVerifications)
            .set({
                codingScore: score,
                codingAttempts: goal.verification.codingAttempts + 1,
                ...(allPassed
                    ? {
                        codingStatus: 'COMPLETED' as VerificationSectionStatus,
                        codingCompletedAt: new Date(),
                        mockStatus: 'PENDING' as VerificationSectionStatus,
                    }
                    : {}),
            })
            .where(eq(pathfinderVerifications.id, goal.verification.id))

        if (allPassed) {
            await checkVerificationCompletion(goal.verification.id)
        }

        revalidatePath(`/pathfinder/${submission.goalId}/verify`)
        return { success: true, passed: submission.passed, overallPassed: allPassed }
    } catch (error) {
        console.error('Error submitting verification coding:', error)
        return { success: false, error: 'Failed to submit coding' }
    }
}

// ================================================================================
// COMPLETE MOCK INTERVIEW
// ================================================================================

export async function completeMockInterview(
    goalId: string,
    mockSessionId: string,
    score: number
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal || !goal.verification) {
            return { success: false, error: 'Goal not found' }
        }

        const passed = score >= 70
        const newStatus: VerificationSectionStatus = passed ? 'COMPLETED' : 'FAILED'

        const aiPlan = (goal.verification as { generatedPlan?: { minorProject?: unknown; majorProject?: unknown } } | null)?.generatedPlan as { minorProject?: unknown; majorProject?: unknown } | null
        const hasProject = !!(aiPlan?.minorProject || aiPlan?.majorProject)

        await db.update(pathfinderVerifications)
            .set({
                mockStatus: newStatus,
                mockScore: score,
                mockAttempts: goal.verification.mockAttempts + 1,
                mockSessionId,
                mockCompletedAt: passed ? new Date() : undefined,
                ...(passed && hasProject ? { projectStatus: 'PENDING' as VerificationSectionStatus } : {}),
            })
            .where(eq(pathfinderVerifications.id, goal.verification.id))

        if (passed) {
            await checkVerificationCompletion(goal.verification.id)
        }

        revalidatePath(`/pathfinder/${goalId}/verify`)
        return { success: true, passed }
    } catch (error) {
        console.error('Error completing mock interview:', error)
        return { success: false, error: 'Failed to complete mock interview' }
    }
}

// ================================================================================
// SUBMIT PROJECT
// ================================================================================

export async function submitProject(
    goalId: string,
    projectType: 'CODERZ' | 'PORTFOLIO',
    projectId: string
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal || !goal.verification) {
            return { success: false, error: 'Goal not found' }
        }

        await db.update(pathfinderVerifications)
            .set({
                projectStatus: 'COMPLETED',
                projectComplete: true,
                projectType,
                projectId,
                projectCompletedAt: new Date(),
            })
            .where(eq(pathfinderVerifications.id, goal.verification.id))

        await checkVerificationCompletion(goal.verification.id)

        revalidatePath(`/pathfinder/${goalId}/verify`)
        return { success: true }
    } catch (error) {
        console.error('Error submitting project:', error)
        return { success: false, error: 'Failed to submit project' }
    }
}

// ================================================================================
// RETRY SECTION
// ================================================================================

export async function retryVerificationSection(
    goalId: string,
    section: 'quiz' | 'coding' | 'mock' | 'project'
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        const goal = await db.query.pathfinderGoals.findFirst({
            where: and(eq(pathfinderGoals.id, goalId), eq(pathfinderGoals.userId, session.user.id)),
            with: { verification: true },
        })

        if (!goal || !goal.verification) {
            return { success: false, error: 'Goal not found' }
        }

        const statusField = `${section}Status` as const
        await db.update(pathfinderVerifications)
            .set({ [statusField]: 'PENDING' as VerificationSectionStatus })
            .where(eq(pathfinderVerifications.id, goal.verification.id))

        revalidatePath(`/pathfinder/${goalId}/verify`)
        return { success: true }
    } catch (error) {
        console.error('Error retrying section:', error)
        return { success: false, error: 'Failed to retry section' }
    }
}

// ================================================================================
// HELPER: CHECK VERIFICATION COMPLETION
// ================================================================================

async function checkVerificationCompletion(verificationId: string) {
    const verification = await db.query.pathfinderVerifications.findFirst({
        where: eq(pathfinderVerifications.id, verificationId),
        with: { goal: true },
    })

    if (!verification) return

    // Already completed. This helper runs after every section submission, so
    // once the fourth section lands it will be re-entered by any later submit
    // or retry — and everything below it pays the user (credits, and now XP).
    // Bail before any of that can happen twice.
    if (verification.passed) return

    const aiPlan = verification.generatedPlan as {
        minorProject?: unknown
        majorProject?: unknown
    } | null
    const projectRequired = !!(aiPlan?.minorProject || aiPlan?.majorProject)

    const quizComplete = verification.quizStatus === 'COMPLETED'
    const codingComplete = verification.codingStatus === 'COMPLETED'
    const mockComplete = verification.mockStatus === 'COMPLETED'
    const projectComplete = projectRequired
        ? verification.projectStatus === 'COMPLETED'
        : true

    if (quizComplete && codingComplete && mockComplete && projectComplete) {
        const w = PATHFINDER_CREDITS.verificationWeights
        const weightedScore = Math.round(
            (verification.quizScore || 0) * w.quiz +
            (verification.codingScore || 0) * w.coding +
            (verification.mockScore || 0) * w.mock
        )
        const overallScore = weightedScore

        const refundCredits = Math.floor(
            (verification.verificationCreditsCharged || 0) * (weightedScore / 100)
        )

        await db.update(pathfinderVerifications)
            .set({
                passed: true,
                overallScore,
                completedAt: new Date(),
            })
            .where(eq(pathfinderVerifications.id, verificationId))

        await db.update(pathfinderGoals)
            .set({
                status: 'COMPLETED',
                completedAt: new Date(),
                progressPercent: 100,
            })
            .where(eq(pathfinderGoals.id, verification.goalId))

        if (refundCredits > 0) {
            const goal = (verification as any).goal
            await db.update(users)
                .set({ credits: sql`${users.credits} + ${refundCredits}` })
                .where(eq(users.id, goal.userId))
            await db.insert(creditTransactions).values({
                userId: goal.userId,
                amount: refundCredits,
                type: 'REWARD',
                description: `Pathfinder Verification Refund: ${weightedScore}% score (${refundCredits} credits)`,
                currency: 'INR',
            })
        }

        // Verification is the module's payoff — a multi-week goal, four sections
        // passed. Until now it granted nothing; the reward half of the feature was
        // this comment.
        //
        // Scaled by the same `weightedScore` the performance refund uses rather
        // than inventing a second notion of "how well did they do", so the credits
        // returned and the XP granted can never tell different stories.
        const goalForXp = verification.goal
        if (goalForXp) {
            const xpAward = Math.max(
                PATHFINDER_XP.verificationMinimum,
                Math.round(PATHFINDER_XP.verificationBase * (weightedScore / 100)),
            )
            // addXpToUser owns the level recalculation and runs in its own
            // transaction; it logs and swallows its own failures, so a reward
            // problem cannot roll back a verification the user genuinely passed.
            await addXpToUser(
                goalForXp.userId,
                xpAward,
                `Pathfinder goal verified: ${goalForXp.title} (${weightedScore}%)`,
                'REWARD',
            )
        }
    }
}
