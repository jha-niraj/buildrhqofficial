"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import {
    db,
    jobs,
    jobApplications,
    users,
    interviewPrepProgress,
    interviewProcesses,
} from "@repo/db"
import { eq, and, sql, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Show interest in a job (first step - adds to "My Jobs")
export async function showInterest(jobId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return {
                success: false,
                error: "Please sign in to show interest"
            }
        }

        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, jobId),
            columns: { id: true, status: true, interviewProcessId: true },
        })

        if (!job || job.status !== "ACTIVE") {
            return { success: false, error: "Job not found or no longer available" }
        }

        // Check if already applied
        const existing = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.jobId, jobId),
                eq(jobApplications.userId, session.user.id)
            ),
        })

        if (existing) {
            return { success: true, data: existing, message: "Already in your list" }
        }

        // Create application in INTERESTED state
        const [application] = await db.insert(jobApplications).values({
            jobId,
            userId: session.user.id,
            status: "INTERESTED",
        }).returning()

        revalidatePath("/jobs")
        revalidatePath("/jobs/applications")

        return { success: true, data: application }
    } catch (error) {
        console.error("Error showing interest:", error)
        return { success: false, error: "Failed to process request" }
    }
}

// Start preparing for a job
export async function startPreparing(applicationId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        if (application.status !== "INTERESTED") {
            return { success: false, error: "Cannot start preparing from current status" }
        }

        const [updated] = await db.update(jobApplications)
            .set({ status: "PREPARING" })
            .where(eq(jobApplications.id, applicationId))
            .returning()

        revalidatePath("/jobs/applications")

        return { success: true, data: updated }
    } catch (error) {
        console.error("Error starting preparation:", error)
        return { success: false, error: "Failed to update status" }
    }
}

// Custom Question Response Type
interface CustomQuestionResponse {
    questionId: string
    answer: string | string[] | number | boolean
    answeredAt: string
}

// Commitment Check - Validates candidate is ready to apply
export async function performCommitmentCheck(applicationId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
            with: {
                job: {
                    with: {
                        company: { columns: { name: true } },
                    },
                },
            },
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        const checks = {
            profileComplete: false,
            matchScoreOk: (application.matchScore ?? 0) >= 60,
            hasReviewedRequirements: true,
            understoodsCompetition: application.job.applicationsCount > 0,
            canProceedWithCaution: (application.matchScore ?? 0) >= 40 && (application.matchScore ?? 0) < 60
        }

        // Get user profile to check completeness
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { name: true, email: true },
        })

        if (user) {
            checks.profileComplete = !!(user.name && user.email)
        }

        const isReadyToApply = checks.profileComplete && (checks.matchScoreOk || checks.canProceedWithCaution)

        const recommendations = []
        if (!checks.profileComplete) {
            recommendations.push({
                type: "warning",
                message: "Complete your profile to increase your chances"
            })
        }
        if (!checks.matchScoreOk && !checks.canProceedWithCaution) {
            recommendations.push({
                type: "caution",
                message: `Your match score (${application.matchScore ?? 0}%) is low for this role. Consider improving your skills first.`
            })
        }
        if (checks.canProceedWithCaution) {
            recommendations.push({
                type: "info",
                message: "Your match score is moderate. You can still apply, but improving relevant skills may help."
            })
        }
        if (application.job.applicationsCount > 20) {
            recommendations.push({
                type: "info",
                message: `This role has ${application.job.applicationsCount}+ applicants. Stand out with a strong cover letter!`
            })
        }

        return {
            success: true,
            data: {
                checks,
                isReadyToApply,
                recommendations,
                job: {
                    title: application.job.title,
                    company: application.job.company.name,
                    applicationsCount: application.job.applicationsCount
                },
                matchScore: application.matchScore ?? 0
            }
        }
    } catch (error) {
        console.error("Error performing commitment check:", error)
        return { success: false, error: "Failed to perform commitment check" }
    }
}

// Submit application (move from PREPARING to APPLIED)
export async function submitApplication(
    applicationId: string,
    data?: {
        coverLetter?: string
        customQuestionResponses?: CustomQuestionResponse[]
        acknowledgedCommitmentCheck?: boolean
    }
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
            with: {
                job: {
                    columns: { id: true, customQuestions: true },
                },
            },
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        if (!["INTERESTED", "PREPARING"].includes(application.status)) {
            return { success: false, error: "Application already submitted" }
        }

        // Validate required custom questions if any
        const customQuestions = application.job.customQuestions as Array<{
            id: string
            required: boolean
            question: string
        }> | null

        if (customQuestions && customQuestions.length > 0) {
            const requiredQuestions = customQuestions.filter(q => q.required)
            const responses = data?.customQuestionResponses || []

            for (const rq of requiredQuestions) {
                const response = responses.find(r => r.questionId === rq.id)
                if (!response || !response.answer ||
                    (Array.isArray(response.answer) && response.answer.length === 0) ||
                    (typeof response.answer === 'string' && response.answer.trim() === '')) {
                    return {
                        success: false,
                        error: `Please answer the required question: "${rq.question}"`
                    }
                }
            }
        }

        // Update application
        const [updated] = await db.update(jobApplications)
            .set({
                status: "APPLIED",
                appliedAt: new Date(),
                coverLetter: data?.coverLetter || application.coverLetter,
                customQuestionResponses: JSON.parse(JSON.stringify(data?.customQuestionResponses || [])),
            })
            .where(eq(jobApplications.id, applicationId))
            .returning()

        // Increment job applications count
        await db.update(jobs)
            .set({ applicationsCount: sql`${jobs.applicationsCount} + 1` })
            .where(eq(jobs.id, application.jobId))

        revalidatePath("/jobs/applications")

        return { success: true, data: updated }
    } catch (error) {
        console.error("Error submitting application:", error)
        return { success: false, error: "Failed to submit application" }
    }
}

// Withdraw application
export async function withdrawApplication(applicationId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        // Can only withdraw if not already rejected or hired
        if (["REJECTED", "HIRED", "WITHDRAWN"].includes(application.status)) {
            return { success: false, error: "Cannot withdraw this application" }
        }

        const [updated] = await db.update(jobApplications)
            .set({ status: "WITHDRAWN" })
            .where(eq(jobApplications.id, applicationId))
            .returning()

        revalidatePath("/jobs/applications")

        return { success: true, data: updated }
    } catch (error) {
        console.error("Error withdrawing application:", error)
        return { success: false, error: "Failed to withdraw application" }
    }
}

// Get user's applications
export async function getMyApplications(status?: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const applications = await db.query.jobApplications.findMany({
            where: status
                ? and(eq(jobApplications.userId, session.user.id), eq(jobApplications.status, status as typeof jobApplications.$inferSelect['status']))
                : eq(jobApplications.userId, session.user.id),
            with: {
                job: {
                    with: {
                        company: {
                            columns: {
                                id: true,
                                name: true,
                                logoUrl: true,
                                industry: true,
                            },
                        },
                    },
                },
                activities: true,
            },
            orderBy: (t, { desc }) => [desc(t.updatedAt)],
        })

        // Load interviewProcess + rounds + prepProgress separately
        const appIds = applications.map(a => a.id)
        const jobIds = [...new Set(applications.map(a => a.jobId))]

        const [allProcesses, allPrepProgress] = await Promise.all([
            jobIds.length > 0
                ? db.query.interviewProcesses.findMany({
                    where: inArray(interviewProcesses.id,
                        // Collect interviewProcessId from jobs if available
                        applications
                            .map(a => (a.job as any).interviewProcessId)
                            .filter(Boolean) as string[]
                    ),
                    with: { rounds: { orderBy: (r, { asc }) => [asc(r.roundNumber)] } },
                })
                : [],
            appIds.length > 0
                ? db.query.interviewPrepProgress.findMany({
                    where: inArray(interviewPrepProgress.applicationId, appIds),
                })
                : [],
        ])

        const processMap = new Map(allProcesses.map(p => [p.id, p]))
        const prepMap = new Map(allPrepProgress.map(p => [p.applicationId, p]))

        const enrichedApplications = applications.map(app => ({
            ...app,
            job: {
                ...app.job,
                interviewProcess: processMap.get((app.job as any).interviewProcessId ?? '') ?? null,
            },
            prepProgress: prepMap.get(app.id) ?? null,
        }))

        // Group by status
        const grouped = {
            interested: enrichedApplications.filter(a => a.status === "INTERESTED"),
            preparing: enrichedApplications.filter(a => a.status === "PREPARING"),
            applied: enrichedApplications.filter(a => a.status === "APPLIED"),
            inProgress: enrichedApplications.filter(a =>
                ["UNDER_REVIEW", "SHORTLISTED", "ASSIGNMENT_SENT", "ASSIGNMENT_SUBMITTED", "INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(a.status)
            ),
            completed: enrichedApplications.filter(a =>
                ["OFFER_EXTENDED", "HIRED", "REJECTED", "WITHDRAWN"].includes(a.status)
            )
        }

        return { success: true, data: { applications: enrichedApplications, grouped } }
    } catch (error) {
        console.error("Error fetching applications:", error)
        return { success: false, error: "Failed to fetch applications" }
    }
}

// Get single application details
export async function getApplicationDetails(applicationId: string) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
            with: {
                job: {
                    with: { company: true },
                },
                activities: {
                    orderBy: (t, { desc }) => [desc(t.createdAt)],
                },
            },
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        // Load interviewProcess + prepProgress separately
        const [process, prepProgress] = await Promise.all([
            (application.job as any).interviewProcessId
                ? db.query.interviewProcesses.findFirst({
                    where: eq(interviewProcesses.id, (application.job as any).interviewProcessId),
                    with: { rounds: { orderBy: (r, { asc }) => [asc(r.roundNumber)] } },
                })
                : null,
            db.query.interviewPrepProgress.findFirst({
                where: eq(interviewPrepProgress.applicationId, applicationId),
            }),
        ])

        const enriched = {
            ...application,
            job: {
                ...application.job,
                interviewProcess: process ?? null,
            },
            prepProgress: prepProgress ?? null,
        }

        return { success: true, data: enriched }
    } catch (error) {
        console.error("Error fetching application:", error)
        return { success: false, error: "Failed to fetch application" }
    }
}

// Update preparation status
export async function updatePreparationStatus(
    applicationId: string,
    updates: {
        profile_complete?: boolean
        resume_reviewed?: boolean
        mock_interview_done?: boolean
        Learns_reviewed?: boolean
        assignment_started?: boolean
        assignment_completed?: boolean
    }
) {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const application = await db.query.jobApplications.findFirst({
            where: and(
                eq(jobApplications.id, applicationId),
                eq(jobApplications.userId, session.user.id)
            ),
        })

        if (!application) {
            return { success: false, error: "Application not found" }
        }

        const currentStatus = application.preparationStatus as Record<string, boolean>
        const newStatus = { ...currentStatus, ...updates }

        // Calculate preparation score
        const totalSteps = Object.keys(newStatus).length
        const completedSteps = Object.values(newStatus).filter(v => v === true).length
        const preparationScore = Math.round((completedSteps / totalSteps) * 100)

        // Check if ready to apply (all steps complete or at least 80%)
        const isReadyToApply = preparationScore >= 80

        const [updated] = await db.update(jobApplications)
            .set({
                preparationStatus: newStatus,
                preparationScore,
                isReadyToApply,
            })
            .where(eq(jobApplications.id, applicationId))
            .returning()

        revalidatePath("/jobs/applications")

        return { success: true, data: updated }
    } catch (error) {
        console.error("Error updating preparation:", error)
        return { success: false, error: "Failed to update preparation status" }
    }
}
