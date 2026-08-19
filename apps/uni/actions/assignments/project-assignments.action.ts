"use server"

import { db, projectsV2, universityClasses, classEnrollments, users, userProjectV2Progress, projectV2Submissions, backgroundJobs } from "@repo/db"
import { eq, and, inArray, desc, asc } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import crypto from 'crypto';
import type { UniversityPermission } from "@/types";
import { callWorker } from "@/lib/workers/client";

// ============================================
// TYPES
// ============================================

interface CreateProjectAssignmentPayload {
    projectTitle: string;
    projectDescription: string;
    generationType: "FULL_STACK" | "FRONTEND" | "APP" | "PROGRAMS" | "AI/ML" | "AI_AGENT" | "OTHER";
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    visibility: "PUBLIC" | "PRIVATE";
    includeAssessment: boolean;
    stacks: {
        frontend?: string;
        backend?: string;
        database?: string;
        deployment?: string;
        aiProvider?: string;
    };
    classIds: string[];
    deadline?: Date;
    credits?: number;
    instructions?: string;
}

interface AssignExistingProjectPayload {
    projectId: string;
    classIds: string[];
    deadline?: Date;
    credits?: number;
    instructions?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCurrentMember() {
    const session = await getSession(headers());
    if (!session?.user?.id) throw new Error("Not authenticated");

    const member = await db.query.universityMembers.findFirst({
        where: (tbl, { eq }) => eq(tbl.userId, session.user.id),
        with: {
            university: { columns: { id: true, name: true } },
        },
    });

    if (!member) throw new Error("Not a university member");
    return member;
}

async function hasPermission(member: { permissions: unknown }, permission: UniversityPermission): Promise<boolean> {
    if (!member.permissions) return false;
    try {
        const permissions = typeof member.permissions === "string"
            ? JSON.parse(member.permissions)
            : member.permissions;
        return Array.isArray(permissions) && permissions.includes(permission);
    } catch {
        return false;
    }
}

async function issueWorkerToken(action: string, jobId?: string) {
    const session = await getSession(headers());
    if (!session?.user?.id) throw new Error("Not authenticated");

    const secret = process.env.WORKER_SECRET;
    if (!secret) throw new Error("Worker secret not configured");

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        userId: session.user.id,
        action,
        jobId,
        iat: now,
        exp: now + 300 // 5 minutes
    };

    const data = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    const encodedPayload = Buffer.from(data).toString('base64url');

    return `${encodedPayload}.${signature}`;
}

// ============================================
// PROJECT ASSIGNMENT ACTIONS
// ============================================

/**
 * Create a new project assignment using AI generation
 */
export async function createProjectAssignment(payload: CreateProjectAssignmentPayload) {
    try {
        const member = await getCurrentMember();

        if (!await hasPermission(member, "create_assignments")) {
            return { success: false, error: "You don't have permission to create assignments" };
        }

        if (payload.classIds.length === 0) {
            return { success: false, error: "Please select at least one class" };
        }

        const validClasses = await db.query.universityClasses.findMany({
            where: and(
                inArray(universityClasses.id, payload.classIds),
                eq(universityClasses.universityId, member.universityId),
            ),
        });

        if (validClasses.length !== payload.classIds.length) {
            return { success: false, error: "Invalid class selection" };
        }

        // Transform stacks for worker API
        const stacksArray: Array<{ name: string; category: string }> = [];
        if (payload.stacks?.frontend) stacksArray.push({ name: payload.stacks.frontend, category: 'FRONTEND' });
        if (payload.stacks?.backend) stacksArray.push({ name: payload.stacks.backend, category: 'BACKEND' });
        if (payload.stacks?.database) stacksArray.push({ name: payload.stacks.database, category: 'DATABASE' });
        if (payload.stacks?.deployment) stacksArray.push({ name: payload.stacks.deployment, category: 'DEPLOYMENT' });
        if (payload.stacks?.aiProvider) stacksArray.push({ name: payload.stacks.aiProvider, category: 'AI' });

        const workerPayload = {
            projectTitle: payload.projectTitle,
            description: payload.projectDescription,
            generationType: payload.generationType,
            visibility: payload.visibility,
            includeAssessment: payload.includeAssessment,
            stacks: stacksArray,
            userId: member.userId,
            universityId: member.universityId,
            teacherMemberId: member.id,
            classIds: payload.classIds,
            isUniversityProject: true,
        };

        // The job id is minted HERE, and the row is inserted BEFORE dispatch.
        // The previous version posted the payload bare and then read a `jobId`
        // out of the response - but the worker requires `{ jobId, input }` and
        // has never minted ids, so every dispatch from this app got a 400 and
        // then failed on a jobId that was undefined.
        const jobId = crypto.randomUUID();

        await db.insert(backgroundJobs).values({
            jobId,
            type: 'project_generation',
            status: 'waiting',
            progress: 0,
            userId: member.userId,
            input: {
                ...payload,
                universityId: member.universityId,
                teacherMemberId: member.id,
                isUniversityProject: true,
            } as Record<string, unknown>,
        });

        const workerToken = await issueWorkerToken('generate_project', jobId);

        const response = await callWorker('/api/v1/generateproject', {
            token: workerToken,
            body: { jobId, input: workerPayload },
        });

        if (!response.ok) {
            const error = await response.text();
            await db.update(backgroundJobs)
                .set({ status: 'failed', error: `Worker error: ${error}` })
                .where(eq(backgroundJobs.jobId, jobId));
            throw new Error(`Worker API error: ${error}`);
        }

        return {
            success: true,
            jobId,
            message: "Project generation started",
        };
    } catch (error: unknown) {
        console.error("Create project assignment error:", error);
        return { success: false, error: (error as Error).message || "Failed to create project assignment" };
    }
}

/**
 * Poll a generation job.
 *
 * Reads `background_job`, which the worker's Durable Object writes to as it goes.
 * The sheet used to fetch `NEXT_PUBLIC_WORKER_URL/api/v1/job/:id` directly from
 * the browser - an unauthenticated call, to a route that does not exist, on the
 * code-execution worker's URL rather than the job worker's. It could only ever
 * time out.
 */
export async function getProjectAssignmentJobStatus(jobId: string): Promise<{
    success: boolean
    status?: string
    progress?: number
    phaseLabel?: string
    data?: { projectId: string; slug: string; title: string }
    error?: string
}> {
    try {
        const member = await getCurrentMember();

        const job = await db.query.backgroundJobs.findFirst({
            where: eq(backgroundJobs.jobId, jobId),
        });
        if (!job) return { success: false, error: 'Job not found' };
        // Scoped to the teacher who started it.
        if (job.userId !== member.userId) return { success: false, error: 'Job not found' };

        const result = (job.result ?? {}) as {
            phaseLabel?: string
            projectId?: string
            slug?: string
            title?: string
        };

        return {
            success: true,
            status: job.status,
            progress: job.progress,
            phaseLabel: result.phaseLabel,
            data: result.projectId && result.slug
                ? { projectId: result.projectId, slug: result.slug, title: result.title ?? '' }
                : undefined,
            error: job.error ?? undefined,
        };
    } catch (error: unknown) {
        console.error("Read project assignment job status error:", error);
        return { success: false, error: "Failed to read job status" };
    }
}

/**
 * Finalize a generated project with university assignment details
 */
export async function finalizeProjectAssignment(jobId: string, workerData: { projectId: string; slug: string; title: string }) {
    try {
        const member = await getCurrentMember();

        const job = await db.query.backgroundJobs.findFirst({
            where: eq(backgroundJobs.jobId, jobId),
        });

        if (!job) {
            return { success: false, error: 'Job not found' };
        }

        const inputData = job.input as Record<string, unknown>;

        await db.update(projectsV2).set({
            isUniversityProject: true,
            universityId: (inputData.universityId as string | null) || member.universityId,
            teacherMemberId: (inputData.teacherMemberId as string | null) || member.id,
            classIds: (inputData.classIds as string[] | null) || [],
            assignmentDeadline: inputData.deadline ? new Date(inputData.deadline as string | number) : null,
            assignmentCredits: (inputData.credits as number | null) || null,
            assignmentInstructions: (inputData.instructions as string | null) || null,
        }).where(eq(projectsV2.id, workerData.projectId));

        await db.update(backgroundJobs).set({
            status: 'completed',
            progress: 100,
        }).where(eq(backgroundJobs.jobId, jobId));

        return {
            success: true,
            message: 'Project assignment created',
            data: {
                projectSlug: workerData.slug,
                projectId: workerData.projectId,
            },
        };
    } catch (error: unknown) {
        console.error("Finalize project assignment error:", error);
        return { success: false, error: (error as Error).message || "Failed to finalize project assignment" };
    }
}

/**
 * Assign an existing project to classes
 */
export async function assignExistingProject(payload: AssignExistingProjectPayload) {
    try {
        const member = await getCurrentMember();

        if (!await hasPermission(member, "create_assignments")) {
            return { success: false, error: "You don't have permission to create assignments" };
        }

        const project = await db.query.projectsV2.findFirst({
            where: eq(projectsV2.id, payload.projectId),
        });

        if (!project) {
            return { success: false, error: "Project not found or you don't have access" };
        }

        const validClasses = await db.query.universityClasses.findMany({
            where: and(
                inArray(universityClasses.id, payload.classIds),
                eq(universityClasses.universityId, member.universityId),
            ),
        });

        if (validClasses.length !== payload.classIds.length) {
            return { success: false, error: "Invalid class selection" };
        }

        const existingClassIds = project.classIds || [];
        const newClassIds = [...new Set([...existingClassIds, ...payload.classIds])];

        await db.update(projectsV2).set({
            isUniversityProject: true,
            universityId: member.universityId,
            teacherMemberId: member.id,
            classIds: newClassIds,
            assignmentDeadline: payload.deadline || project.assignmentDeadline,
            assignmentCredits: payload.credits || project.assignmentCredits,
            assignmentInstructions: payload.instructions || project.assignmentInstructions,
        }).where(eq(projectsV2.id, payload.projectId));

        return {
            success: true,
            message: "Project assigned to classes",
        };
    } catch (error: unknown) {
        console.error("Assign existing project error:", error);
        return { success: false, error: (error as Error).message || "Failed to assign project" };
    }
}

/**
 * Get all project assignments for the teacher's university
 */
export async function getProjectAssignments(filters?: {
    classId?: string;
    status?: "active" | "past" | "all";
}) {
    try {
        const member = await getCurrentMember();

        const projects = await db.query.projectsV2.findMany({
            where: (tbl, { and, eq }) => {
                const conditions = [
                    eq(tbl.isUniversityProject, true),
                    eq(tbl.universityId, member.universityId),
                ]
                if (member.role !== "HEAD") {
                    conditions.push(eq(tbl.teacherMemberId, member.id))
                }
                return and(...conditions)
            },
            orderBy: desc(projectsV2.createdAt),
        });

        // Apply class and status filters in-memory
        let filtered = projects
        if (filters?.classId) {
            filtered = filtered.filter(p => p.classIds.includes(filters.classId!))
        }
        if (filters?.status === "active") {
            filtered = filtered.filter(p => !p.assignmentDeadline || p.assignmentDeadline >= new Date())
        } else if (filters?.status === "past") {
            filtered = filtered.filter(p => p.assignmentDeadline && p.assignmentDeadline < new Date())
        }

        // Get class names
        const allClassIds = filtered.flatMap(p => p.classIds)
        const classes = allClassIds.length > 0
            ? await db.query.universityClasses.findMany({
                where: inArray(universityClasses.id, allClassIds),
                columns: { id: true, name: true, code: true },
            })
            : []
        const classMap = new Map(classes.map(c => [c.id, c]))

        const enrichedProjects = filtered.map(project => ({
            ...project,
            classes: project.classIds.map(id => classMap.get(id)).filter(Boolean),
        }));

        return {
            success: true,
            data: enrichedProjects,
        };
    } catch (error: unknown) {
        console.error("Get project assignments error:", error);
        return { success: false, error: (error as Error).message || "Failed to fetch project assignments" };
    }
}

/**
 * Get classes that the teacher can assign projects to
 */
export async function getTeacherClasses() {
    try {
        const member = await getCurrentMember();

        const classes = await db.query.universityClasses.findMany({
            where: and(
                eq(universityClasses.universityId, member.universityId),
                eq(universityClasses.isActive, true),
            ),
            with: {
                department: { columns: { name: true, code: true } },
            },
            orderBy: [asc(universityClasses.name)],
        });

        return {
            success: true,
            data: classes.map(c => ({
                id: c.id,
                name: c.name,
                code: c.code,
                semester: c.semester,
                academicYear: c.academicYear,
                studentCount: c.studentCount,
                department: c.department,
            })),
        };
    } catch (error: unknown) {
        console.error("Get teacher classes error:", error);
        return { success: false, error: (error as Error).message || "Failed to fetch classes" };
    }
}

/**
 * Update project assignment details
 */
export async function updateProjectAssignment(
    projectId: string,
    updates: {
        classIds?: string[];
        deadline?: Date | null;
        credits?: number | null;
        instructions?: string | null;
    }
) {
    try {
        const member = await getCurrentMember();

        const project = await db.query.projectsV2.findFirst({
            where: and(
                eq(projectsV2.id, projectId),
                eq(projectsV2.universityId, member.universityId),
            ),
        });

        if (!project) {
            return { success: false, error: "Project not found or you don't have access" };
        }

        const updateData: Record<string, unknown> = {};
        if (updates.classIds !== undefined) updateData.classIds = updates.classIds;
        if (updates.deadline !== undefined) updateData.assignmentDeadline = updates.deadline;
        if (updates.credits !== undefined) updateData.assignmentCredits = updates.credits;
        if (updates.instructions !== undefined) updateData.assignmentInstructions = updates.instructions;

        await db.update(projectsV2).set(updateData).where(eq(projectsV2.id, projectId));

        return { success: true, message: "Assignment updated" };
    } catch (error: unknown) {
        console.error("Update project assignment error:", error);
        return { success: false, error: (error as Error).message || "Failed to update assignment" };
    }
}

/**
 * Remove project assignment
 */
export async function removeProjectAssignment(projectId: string) {
    try {
        const member = await getCurrentMember();

        const project = await db.query.projectsV2.findFirst({
            where: and(
                eq(projectsV2.id, projectId),
                eq(projectsV2.universityId, member.universityId),
            ),
        });

        if (!project) {
            return { success: false, error: "Project not found or you don't have access" };
        }

        await db.update(projectsV2).set({
            isUniversityProject: false,
            universityId: null,
            teacherMemberId: null,
            classIds: [],
            assignmentDeadline: null,
            assignmentCredits: null,
            assignmentInstructions: null,
        }).where(eq(projectsV2.id, projectId));

        return { success: true, message: "Assignment removed" };
    } catch (error: unknown) {
        console.error("Remove project assignment error:", error);
        return { success: false, error: (error as Error).message || "Failed to remove assignment" };
    }
}

/**
 * Get student progress for a project assignment
 */
export async function getProjectStudentProgress(projectId: string) {
    try {
        const member = await getCurrentMember();

        const project = await db.query.projectsV2.findFirst({
            where: and(
                eq(projectsV2.id, projectId),
                eq(projectsV2.universityId, member.universityId),
            ),
            columns: { classIds: true },
        });

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Get students from the assigned classes
        const classEnrollmentRows = project.classIds.length > 0
            ? await db.query.classEnrollments.findMany({
                where: and(
                    inArray(classEnrollments.classId, project.classIds),
                    eq(classEnrollments.isActive, true),
                ),
                with: {
                    studentLink: { columns: { userId: true } },
                },
            })
            : []

        const studentUserIds = classEnrollmentRows.map(ce => ce.studentLink.userId)

        const userRows = studentUserIds.length > 0
            ? await db.query.users.findMany({
                where: inArray(users.id, studentUserIds),
                columns: { id: true, name: true, email: true, image: true },
            })
            : []
        const userMap = new Map(userRows.map(u => [u.id, u]))

        // Get progress
        const progressRows = studentUserIds.length > 0
            ? await db.query.userProjectV2Progress.findMany({
                where: and(
                    eq(userProjectV2Progress.projectId, projectId),
                    inArray(userProjectV2Progress.userId, studentUserIds),
                ),
                columns: { userId: true, progressPercentage: true, startedAt: true, completedAt: true, totalScore: true },
            })
            : []

        // Get submissions
        const submissionRows = studentUserIds.length > 0
            ? await db.query.projectV2Submissions.findMany({
                where: and(
                    eq(projectV2Submissions.projectId, projectId),
                    inArray(projectV2Submissions.userId, studentUserIds),
                ),
                columns: { userId: true, status: true, createdAt: true, scores: true },
            })
            : []

        const progressMap = new Map(progressRows.map(p => [p.userId, p]))
        const submissionMap = new Map(submissionRows.map(s => [s.userId, s]))

        const studentProgress = studentUserIds.map(userId => {
            const user = userMap.get(userId);
            const userProgress = progressMap.get(userId);
            const userSubmission = submissionMap.get(userId);

            return {
                user: user || { id: userId, name: null, email: null, image: null },
                progress: userProgress?.progressPercentage || 0,
                startedAt: userProgress?.startedAt || null,
                completedAt: userProgress?.completedAt || null,
                totalScore: userProgress?.totalScore || 0,
                submission: userSubmission || null,
                status: userSubmission?.status || (userProgress ? "in_progress" : "not_started"),
            };
        });

        return {
            success: true,
            data: studentProgress,
        };
    } catch (error: unknown) {
        console.error("Get project student progress error:", error);
        return { success: false, error: (error as Error).message || "Failed to fetch student progress" };
    }
}

