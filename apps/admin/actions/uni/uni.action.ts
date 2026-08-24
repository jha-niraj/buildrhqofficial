"use server"

import { db, universities, universityMembers, studentUniversityLinks, departments, universityClasses } from "@repo/db"
import { eq, count } from "drizzle-orm"
import { logAdminAudit } from "@/lib/audit-log"
import { checkModuleAccess } from "@/lib/module-access"
import type { PermissionLevel } from "@/lib/navigation"

// ============================================
// UNIVERSITY PLATFORM ADMIN SERVER ACTIONS
// ============================================

/**
 * Every function below used to call the shared `checkAdminAccess()` from
 * `admin.action.ts`, which only asks "is this any active admin" - not "does
 * this admin have `university` access at all, and does it cover the level
 * this mutation needs." See plan/admin/tasks.md, "Found and fixed during
 * ADM-1."
 */
function checkUniversityAccess(requiredLevel: PermissionLevel) {
    return checkModuleAccess("university", requiredLevel)
}

/**
 * Get university platform dashboard stats
 * Note: StudentUniversityLink is the model that represents students linked to universities
 */
export async function getUniversityDashboardStats(): Promise<{
    success: true
    data: {
        totalUniversities: number
        verifiedUniversities: number
        pendingVerifications: number
        rejectedVerifications: number
        totalDepartments: number
        totalFaculty: number
        totalStudents: number
        verifiedStudents: number
        totalClasses: number
        totalCreditsAllocated: number
    }
} | { success: false; error: string }> {
    try {
        const accessCheck = await checkUniversityAccess("read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }
        const [
            totalUniversitiesResult,
            verifiedUniversitiesResult,
            pendingVerificationsResult,
            rejectedVerificationsResult,
            totalDepartmentsResult,
            totalFacultyResult,
            totalStudentsResult,
            verifiedStudentsResult,
            totalClassesResult,
        ] = await Promise.all([
            db.select({ totalUniversities: count() }).from(universities),
            db.select({ verifiedUniversities: count() }).from(universities).where(eq(universities.verificationStatus, "VERIFIED")),
            db.select({ pendingVerifications: count() }).from(universities).where(eq(universities.verificationStatus, "PENDING")),
            db.select({ rejectedVerifications: count() }).from(universities).where(eq(universities.verificationStatus, "REJECTED")),
            db.select({ totalDepartments: count() }).from(departments),
            db.select({ totalFaculty: count() }).from(universityMembers),
            db.select({ totalStudents: count() }).from(studentUniversityLinks),
            db.select({ verifiedStudents: count() }).from(studentUniversityLinks).where(eq(studentUniversityLinks.verificationStatus, "VERIFIED")),
            db.select({ totalClasses: count() }).from(universityClasses),
        ])
        const totalUniversities = totalUniversitiesResult[0]?.totalUniversities ?? 0
        const verifiedUniversities = verifiedUniversitiesResult[0]?.verifiedUniversities ?? 0
        const pendingVerifications = pendingVerificationsResult[0]?.pendingVerifications ?? 0
        const rejectedVerifications = rejectedVerificationsResult[0]?.rejectedVerifications ?? 0
        const totalDepartments = totalDepartmentsResult[0]?.totalDepartments ?? 0
        const totalFaculty = totalFacultyResult[0]?.totalFaculty ?? 0
        const totalStudents = totalStudentsResult[0]?.totalStudents ?? 0
        const verifiedStudents = verifiedStudentsResult[0]?.verifiedStudents ?? 0
        const totalClasses = totalClassesResult[0]?.totalClasses ?? 0

        // Calculate total credits allocated
        const allUnis = await db.query.universities.findMany({
            columns: { totalCreditsAllocated: true }
        })
        const totalCreditsAllocated = allUnis.reduce((sum, u) => sum + (u.totalCreditsAllocated || 0), 0)

        return {
            success: true,
            data: {
                totalUniversities,
                verifiedUniversities,
                pendingVerifications,
                rejectedVerifications,
                totalDepartments,
                totalFaculty,
                totalStudents,
                verifiedStudents,
                totalClasses,
                totalCreditsAllocated,
            },
        }
    } catch (error) {
        console.error("Error fetching university dashboard stats:", error)
        return { success: false, error: "Failed to fetch university dashboard stats" }
    }
}

/**
 * Get universities list with pagination
 */
export async function getUniversities(page = 1, limit = 20, status?: string) {
    try {
        const accessCheck = await checkUniversityAccess("read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }
        const offset = (page - 1) * limit

        const whereClause = status && status !== "all"
            ? eq(universities.verificationStatus, status as "PENDING" | "VERIFIED" | "REJECTED")
            : undefined

        const [universityList, uniTotalResult] = await Promise.all([
            db.query.universities.findMany({
                where: whereClause,
                offset,
                limit,
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                with: {
                    members: true,
                    studentLinks: true,
                    departments: true,
                    classes: true,
                }
            }),
            db.select({ total: count() }).from(universities).where(whereClause)
        ])
        const total = uniTotalResult[0]?.total ?? 0

        return {
            success: true,
            data: universityList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Error fetching universities:", error)
        return { success: false, error: "Failed to fetch universities" }
    }
}

/**
 * Get pending university verifications
 */
export async function getPendingUniversityVerifications() {
    try {
        const accessCheck = await checkUniversityAccess("read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }
        const pendingUniversities = await db.query.universities.findMany({
            where: eq(universities.verificationStatus, "PENDING"),
            orderBy: (t, { asc }) => [asc(t.createdAt)],
            with: {
                members: true,
                studentLinks: true,
                departments: true,
            }
        })

        return { success: true, data: pendingUniversities }
    } catch (error) {
        console.error("Error fetching pending verifications:", error)
        return { success: false, error: "Failed to fetch pending verifications" }
    }
}

/**
 * Verify a university
 */
export async function verifyUniversity(universityId: string, adminUserId: string) {
    try {
        const accessCheck = await checkUniversityAccess("write")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }
        const [university] = await db.update(universities)
            .set({
                verificationStatus: "VERIFIED",
                verifiedAt: new Date(),
                verifiedBy: adminUserId,
            })
            .where(eq(universities.id, universityId))
            .returning()

        const adminAccessId = accessCheck.adminAccess.id
        if (university) {
            await logAdminAudit({
                adminId: adminAccessId,
                action: "UPDATE",
                module: "university",
                resourceType: "University",
                resourceId: universityId,
                description: `Verified university: ${university.name}`,
            })
        }

        return { success: true, data: university }
    } catch (error) {
        console.error("Error verifying university:", error)
        return { success: false, error: "Failed to verify university" }
    }
}

/**
 * Reject a university verification
 */
export async function rejectUniversityVerification(universityId: string, adminUserId: string, reason?: string) {
    try {
        const accessCheck = await checkUniversityAccess("write")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }
        const [university] = await db.update(universities)
            .set({
                verificationStatus: "REJECTED",
                verifiedBy: adminUserId,
                rejectionReason: reason,
            })
            .where(eq(universities.id, universityId))
            .returning()

        const adminAccessId = accessCheck.adminAccess.id
        if (university) {
            await logAdminAudit({
                adminId: adminAccessId,
                action: "UPDATE",
                module: "university",
                resourceType: "University",
                resourceId: universityId,
                description: `Rejected university: ${university.name}${reason ? ` - ${reason}` : ""}`,
                metadata: reason ? { reason } : undefined,
            })
        }

        return { success: true, data: university }
    } catch (error) {
        console.error("Error rejecting university:", error)
        return { success: false, error: "Failed to reject university" }
    }
}

// getUniversityById, getUniversityFaculty, getUniversityStudents,
// getDepartments, getUniversityClasses, getUniversityRecentActivity,
// updateUniversityCredits, verifyStudent, rejectStudentVerification and
// bulkImportStudents removed (2026-08-24, approved by Niraj): each backed a
// Departments/Faculty/Students/Classes/Placements/Credits/Analytics page that
// was never built, and the university overview page
// (app/(console)/uni/_components/uni-overview-client.tsx) had its dead links
// to those routes removed in the same pass. `getUniversityDashboardStats`
// above still counts departments/faculty/students/classes for the overview's
// stat tiles, so the `departments` and `universityClasses` imports stay.
