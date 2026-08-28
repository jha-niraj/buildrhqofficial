"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import {
    db,
    jobs,
    jobApplications,
    savedJobs,
    companyFollowers,
    skills,
} from "@repo/db"
import { eq, and, inArray, notInArray, count } from "drizzle-orm"

export interface TabCounts {
    spark: number
    following: number
    saved: number
    applied: number
    browse: number
}

/**
 * Get counts for all job tabs
 * Used to display badge counts on tabs
 */
export async function getJobsTabCounts(): Promise<{
    success: boolean
    data?: TabCounts
    error?: string
}> {
    try {
        const session = await getSession(headers())
        const userId = session?.user?.id

        // Total active jobs (for browse and spark)
        const [totalJobsRow] = await db
            .select({ totalJobs: count() })
            .from(jobs)
            .where(and(eq(jobs.status, "ACTIVE"), eq(jobs.visibility, "PUBLIC")))
        const totalJobs = totalJobsRow?.totalJobs ?? 0

        const total = Number(totalJobs)

        // If not authenticated, return basic counts
        if (!userId) {
            return {
                success: true,
                data: {
                    spark: total,
                    following: 0,
                    saved: 0,
                    applied: 0,
                    browse: total
                }
            }
        }

        // Get user's followed company IDs
        const followedCompanies = await db.query.companyFollowers.findMany({
            where: eq(companyFollowers.userId, userId),
            columns: { companyId: true },
        })
        const followedCompanyIds = followedCompanies.map(f => f.companyId)

        // Get user's applied job IDs for spark count
        const appliedJobs = await db.query.jobApplications.findMany({
            where: eq(jobApplications.userId, userId),
            columns: { jobId: true },
        })
        const appliedJobIds = appliedJobs.map(a => a.jobId)

        const [followingJobsCount, savedJobsCount, appliedJobsCount] = await Promise.all([
            // Following: Jobs from followed companies
            followedCompanyIds.length > 0
                ? db.select({ val: count() })
                    .from(jobs)
                    .where(and(
                        inArray(jobs.companyId, followedCompanyIds),
                        eq(jobs.status, "ACTIVE"),
                        eq(jobs.visibility, "PUBLIC")
                    ))
                    .then(rows => Number(rows[0]?.val ?? 0))
                : Promise.resolve(0),

            // Saved: User's saved jobs
            db.select({ val: count() })
                .from(savedJobs)
                .where(eq(savedJobs.userId, userId))
                .then(rows => Number(rows[0]?.val ?? 0)),

            // Applied: Active applications
            db.select({ val: count() })
                .from(jobApplications)
                .where(and(
                    eq(jobApplications.userId, userId),
                    notInArray(jobApplications.status, ["WITHDRAWN", "REJECTED", "HIRED"])
                ))
                .then(rows => Number(rows[0]?.val ?? 0)),
        ])

        const sparkCount = total - appliedJobIds.length

        return {
            success: true,
            data: {
                spark: Math.max(0, sparkCount),
                following: followingJobsCount,
                saved: savedJobsCount,
                applied: appliedJobsCount,
                browse: total
            }
        }
    } catch (error) {
        console.error("Error fetching tab counts:", error)
        return {
            success: false,
            error: "Failed to fetch tab counts"
        }
    }
}

/**
 * Get jobs for Spark (swipe) mode
 * Returns jobs the user hasn't interacted with yet
 */
export async function getSparkJobs(page = 1, limit = 10) {
    try {
        const session = await getSession(headers())
        const skip = (page - 1) * limit

        const baseWhere = and(
            eq(jobs.status, "ACTIVE"),
            eq(jobs.visibility, "PUBLIC")
        )

        // For unauthenticated users, return all jobs
        if (!session?.user?.id) {
            const [jobRows, totalRowsAnon] = await Promise.all([
                db.query.jobs.findMany({
                    where: baseWhere,
                    with: {
                        company: {
                            columns: { id: true, name: true, logoUrl: true, industry: true, hasInterviewProcess: true },
                        },
                    },
                    orderBy: (t, { desc }) => [desc(t.featured), desc(t.publishedAt)],
                    offset: skip,
                    limit,
                }),
                db.select({ total: count() }).from(jobs).where(baseWhere),
            ])
            const total = totalRowsAnon[0]?.total ?? 0

            const formattedJobs = jobRows.map(job => {
                const skillsReq = (job.skillsRequired as string[]) || []
                const skillsPref = (job.skillsPreferred as string[]) || []
                return {
                    ...job,
                    skillsRequired: skillsReq,
                    skillsPreferred: skillsPref,
                    company: {
                        ...job.company,
                        hasTransparentProcess: job.company.hasInterviewProcess
                    },
                    matchScore: 70,
                    matchReasons: {
                        skillMatch: 0,
                        experienceMatch: 0,
                        locationMatch: 0,
                        industryMatch: 0
                    },
                    matchedSkills: [] as string[],
                    missingSkills: skillsReq,
                    isSaved: false,
                    hasApplied: false,
                    isFollowingCompany: false,
                    interviewProcess: null,
                }
            })

            return {
                success: true,
                data: {
                    jobs: formattedJobs,
                    pagination: {
                        page,
                        limit,
                        total: Number(total),
                        totalPages: Math.ceil(Number(total) / limit)
                    },
                    isAuthenticated: false
                }
            }
        }

        const userId = session.user.id

        // Get user's applied job IDs to exclude
        const appliedJobs = await db.query.jobApplications.findMany({
            where: eq(jobApplications.userId, userId),
            columns: { jobId: true },
        })
        const appliedJobIds = appliedJobs.map(a => a.jobId)

        // Get user data for matching
        const [userSkillRows, savedJobRows, followedCompanyRows] = await Promise.all([
            db.query.skills.findMany({
                where: eq(skills.userId, userId),
                columns: { name: true },
            }),
            db.query.savedJobs.findMany({
                where: eq(savedJobs.userId, userId),
                columns: { jobId: true },
            }),
            db.query.companyFollowers.findMany({
                where: eq(companyFollowers.userId, userId),
                columns: { companyId: true },
            }),
        ])

        const userSkillsList = userSkillRows.map(s => s.name.toLowerCase())
        const savedIds = savedJobRows.map(s => s.jobId)
        const followedIds = followedCompanyRows.map(f => f.companyId)

        const whereClause = appliedJobIds.length > 0
            ? and(baseWhere, notInArray(jobs.id, appliedJobIds))
            : baseWhere

        const [jobRows, totalRowsAuth] = await Promise.all([
            db.query.jobs.findMany({
                where: whereClause,
                with: {
                    company: {
                        columns: { id: true, name: true, logoUrl: true, industry: true, hasInterviewProcess: true },
                    },
                },
                orderBy: (t, { desc }) => [desc(t.featured), desc(t.publishedAt)],
                offset: skip,
                limit,
            }),
            db.select({ total: count() }).from(jobs).where(whereClause),
        ])
        const total = totalRowsAuth[0]?.total ?? 0

        const formattedJobs = jobRows.map(job => {
            const skillsRequired = (job.skillsRequired as string[]) || []
            const skillsPreferred = (job.skillsPreferred as string[]) || []

            const normalizedRequired = skillsRequired.map(s => s.toLowerCase())
            const matchedSkills = normalizedRequired.filter(skill =>
                userSkillsList.some(us => us.includes(skill) || skill.includes(us))
            )
            const missingSkills = normalizedRequired.filter(skill =>
                !userSkillsList.some(us => us.includes(skill) || skill.includes(us))
            )
            const matchScore = normalizedRequired.length > 0
                ? Math.round((matchedSkills.length / normalizedRequired.length) * 100)
                : 80

            return {
                ...job,
                skillsRequired,
                skillsPreferred,
                company: {
                    ...job.company,
                    hasTransparentProcess: job.company.hasInterviewProcess
                },
                matchScore,
                matchReasons: {
                    skillMatch: matchScore,
                    experienceMatch: 80,
                    locationMatch: 80,
                    industryMatch: 80
                },
                matchedSkills,
                missingSkills,
                isSaved: savedIds.includes(job.id),
                hasApplied: false,
                isFollowingCompany: followedIds.includes(job.companyId),
                interviewProcess: null,
            }
        })

        formattedJobs.sort((a, b) => b.matchScore - a.matchScore)

        return {
            success: true,
            data: {
                jobs: formattedJobs,
                pagination: {
                    page,
                    limit,
                    total: Number(total),
                    totalPages: Math.ceil(Number(total) / limit)
                },
                isAuthenticated: true
            }
        }
    } catch (error) {
        console.error("Error fetching spark jobs:", error)
        return { success: false, error: "Failed to fetch jobs" }
    }
}

/**
 * Record a swipe action (left = skip, right = interested)
 */
export async function recordSwipeAction(
    jobId: string,
    action: "left" | "right" | "save"
): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Please sign in to continue" }
        }

        const userId = session.user.id

        if (action === "right" || action === "save") {
            const existing = await db.query.savedJobs.findFirst({
                where: and(
                    eq(savedJobs.userId, userId),
                    eq(savedJobs.jobId, jobId)
                ),
            })

            if (!existing) {
                await db.insert(savedJobs).values({ userId, jobId })
            }
        }
        // For "left" swipes, we don't store anything for now

        return { success: true }
    } catch (error) {
        console.error("Error recording swipe:", error)
        return { success: false, error: "Failed to record action" }
    }
}
