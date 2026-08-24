"use server"

import { db, users, accounts, adminAccess, adminInvitations, adminAuditLogs } from "@repo/db"
import { eq, and, gte, count } from "drizzle-orm"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { AdminResponse } from "@/types/admin"
import { logAdminAudit } from "@/lib/audit-log"
import { checkModuleAccess } from "@/lib/module-access"

// Types
interface CreateInvitationInput {
    email: string
    name?: string
    adminRole: "SUPER_ADMIN" | "CONTENT_ADMIN" | "FINANCE_ADMIN" | "COMMUNITY_ADMIN" | "MODULE_MANAGER" | "VIEWER"
    permissions?: Record<string, string[]>
}

type AdminAccessRow = typeof adminAccess.$inferSelect
type AdminInvitationRow = typeof adminInvitations.$inferSelect
type PublicUser = { id: string; name: string | null; email: string; image: string | null }
type AuditLogRow = typeof adminAuditLogs.$inferSelect

// Generate a unique access code
function generateAccessCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed ambiguous chars
    let code = "ADMIN-"
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// Check if current user is admin
export async function checkAdminAccess(): Promise<AdminResponse<{ isAdmin: boolean; adminAccess: AdminAccessRow }>> {
    try {
        const session = await getSession(headers())

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminRecord = await db.query.adminAccess.findFirst({
            where: eq(adminAccess.userId, session.user.id)
        })

        if (!adminRecord || adminRecord.status !== "ACTIVE") {
            return { success: false, error: "Not authorized" }
        }

        return {
            success: true,
            data: {
                isAdmin: true,
                adminAccess: adminRecord
            }
        }
    } catch (error) {
        console.error("Admin access check error:", error)
        return { success: false, error: "Failed to check admin access" }
    }
}

// Get current admin info
export async function getCurrentAdmin(): Promise<AdminResponse<{ adminRole: string; status: string; permissions: unknown; lastLoginAt: Date | null; createdAt: Date; user: PublicUser | undefined }>> {
    try {
        const session = await getSession(headers())

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminRecord = await db.query.adminAccess.findFirst({
            where: eq(adminAccess.userId, session.user.id),
            columns: { adminRole: true, status: true, permissions: true, lastLoginAt: true, createdAt: true }
        })

        if (!adminRecord) {
            return { success: false, error: "Not an admin" }
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true, name: true, email: true, image: true }
        })

        return {
            success: true,
            data: {
                ...adminRecord,
                user
            }
        }
    } catch (error) {
        console.error("Get current admin error:", error)
        return { success: false, error: "Failed to get admin info" }
    }
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminResponse<Array<AdminAccessRow & { invitations: AdminInvitationRow[]; user: PublicUser | undefined }>>> {
    try {
        const accessCheck = await checkModuleAccess("admin_management", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const admins = await db.query.adminAccess.findMany({
            with: {
                invitations: true,
            },
            orderBy: (t, { desc }) => [desc(t.createdAt)]
        })

        // Get user details for each admin
        const adminWithUsers = await Promise.all(
            admins.map(async (admin) => {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, admin.userId),
                    columns: { id: true, name: true, email: true, image: true }
                })
                return { ...admin, user }
            })
        )

        return { success: true, data: adminWithUsers }
    } catch (error) {
        console.error("Get admin users error:", error)
        return { success: false, error: "Failed to fetch admin users" }
    }
}

// Create admin invitation
export async function createAdminInvitation(input: CreateInvitationInput): Promise<AdminResponse<AdminInvitationRow>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.data?.adminAccess

        // Only SUPER_ADMIN can create invitations
        if (!adminRecord || adminRecord.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can create invitations" }
        }

        // Check if email already has admin access
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, input.email)
        })

        if (existingUser) {
            const existingAdmin = await db.query.adminAccess.findFirst({
                where: eq(adminAccess.userId, existingUser.id)
            })
            if (existingAdmin) {
                return { success: false, error: "User already has admin access" }
            }
        }

        // Check for existing pending invitation
        const existingInvite = await db.query.adminInvitations.findFirst({
            where: (t, { and, eq: eqOp }) => and(eqOp(t.email, input.email), eqOp(t.status, "PENDING"))
        })

        if (existingInvite) {
            return { success: false, error: "Pending invitation already exists for this email" }
        }

        // Create invitation
        const invitations = await db.insert(adminInvitations).values({
            email: input.email,
            name: input.name,
            code: generateAccessCode(),
            adminRole: input.adminRole,
            permissions: input.permissions || {},
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdById: adminRecord.id
        }).returning()
        const invitation = invitations[0]
        if (!invitation) return { success: false, error: "Failed to create invitation" }

        // Log the action
        await logAdminAudit({
            adminId: adminRecord.id,
            action: "CREATE",
            module: "admin_management",
            resourceType: "AdminInvitation",
            resourceId: invitation.id,
            description: `Created invitation for ${input.email} with role ${input.adminRole}`
        })

        revalidatePath("/admins")
        revalidatePath("/admins/invitations")

        return { success: true, data: invitation }
    } catch (error) {
        console.error("Create invitation error:", error)
        return { success: false, error: "Failed to create invitation" }
    }
}

// verifyAccessCode() removed (ADM-2, 2026-08-24): it granted admin_access to an
// unauthenticated caller who knew an invitation's email + code, with no rate
// limit and no transaction across its six writes. actions/invitations.action.ts
// (getInvitationByCode / acceptAdminInvitation, used by app/join/[token]) is the
// replacement - same "the link is the credential" trust model, but rate-limited
// by the codebase having exactly one unauthenticated entry point left to worry
// about, and atomic via withTransaction.

// Get pending invitations
export async function getPendingInvitations(): Promise<AdminResponse<AdminInvitationRow[]>> {
    try {
        const accessCheck = await checkModuleAccess("admin_management", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const invitations = await db.query.adminInvitations.findMany({
            where: eq(adminInvitations.status, "PENDING"),
            orderBy: (t, { desc }) => [desc(t.createdAt)]
        })

        return { success: true, data: invitations }
    } catch (error) {
        console.error("Get invitations error:", error)
        return { success: false, error: "Failed to fetch invitations" }
    }
}

// Revoke invitation
export async function revokeInvitation(invitationId: string): Promise<AdminResponse<null>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.data?.adminAccess

        if (!adminRecord || adminRecord.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can revoke invitations" }
        }

        await db.update(adminInvitations)
            .set({ status: "REVOKED" })
            .where(eq(adminInvitations.id, invitationId))

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "DELETE",
            module: "admin_management",
            resourceType: "AdminInvitation",
            resourceId: invitationId,
            description: "Revoked admin invitation"
        })

        revalidatePath("/admins/invitations")

        return { success: true, data: null }
    } catch (error) {
        console.error("Revoke invitation error:", error)
        return { success: false, error: "Failed to revoke invitation" }
    }
}

// Update admin status
export async function updateAdminStatus(adminId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED"): Promise<AdminResponse<null>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.data?.adminAccess

        if (!adminRecord || adminRecord.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update admin status" }
        }

        await db.update(adminAccess)
            .set({ status })
            .where(eq(adminAccess.id, adminId))

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "UPDATE",
            module: "admin_management",
            resourceType: "AdminAccess",
            resourceId: adminId,
            description: `Updated admin status to ${status}`
        })

        revalidatePath("/admins")

        return { success: true, data: null }
    } catch (error) {
        console.error("Update admin status error:", error)
        return { success: false, error: "Failed to update admin status" }
    }
}

// Update admin permissions
export async function updateAdminPermissions(adminId: string, permissions: Record<string, string[]>): Promise<AdminResponse<null>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminRecord = accessCheck.data?.adminAccess

        if (!adminRecord || adminRecord.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update permissions" }
        }

        const previousAdmin = await db.query.adminAccess.findFirst({
            where: eq(adminAccess.id, adminId)
        })

        await db.update(adminAccess)
            .set({ permissions })
            .where(eq(adminAccess.id, adminId))

        await logAdminAudit({
            adminId: adminRecord.id,
            action: "UPDATE",
            module: "admin_management",
            resourceType: "AdminAccess",
            resourceId: adminId,
            description: "Updated admin permissions",
            changes: {
                before: previousAdmin?.permissions,
                after: permissions
            }
        })

        revalidatePath("/admins")

        return { success: true, data: null }
    } catch (error) {
        console.error("Update admin permissions error:", error)
        return { success: false, error: "Failed to update permissions" }
    }
}

// Get dashboard stats
export async function getDashboardStats(): Promise<AdminResponse<{
    totalUsers: number
    newUsersThisMonth: number
    activeToday: number
    totalAdmins: number
    totalCredits: number
    growthRate: number
}>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const today = new Date(now.setHours(0, 0, 0, 0))

        const [
            totalUsersResult,
            newUsersThisMonthResult,
            totalAdminsResult,
            activeTodayResult,
        ] = await Promise.all([
            db.select({ totalUsers: count() }).from(users),
            db.select({ newUsersThisMonth: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
            db.select({ totalAdmins: count() }).from(adminAccess).where(eq(adminAccess.status, "ACTIVE")),
            db.select({ activeToday: count() }).from(users).where(gte(users.createdAt, today)),
        ])
        const totalUsers = totalUsersResult[0]?.totalUsers ?? 0
        const newUsersThisMonth = newUsersThisMonthResult[0]?.newUsersThisMonth ?? 0
        const totalAdmins = totalAdminsResult[0]?.totalAdmins ?? 0
        const activeToday = activeTodayResult[0]?.activeToday ?? 0

        // Calculate total credits
        let totalCredits = 0
        try {
            const result = await db.query.users.findMany({ columns: { credits: true } })
            totalCredits = result.reduce((sum, u) => sum + (u.credits || 0), 0)
        } catch {
            // ignore
        }

        return {
            success: true,
            data: {
                totalUsers,
                newUsersThisMonth,
                activeToday,
                totalAdmins,
                totalCredits,
                growthRate: totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0
            }
        }
    } catch (error) {
        console.error("Get dashboard stats error:", error)
        return { success: false, error: "Failed to fetch dashboard stats" }
    }
}

// Get audit logs
export async function getAuditLogs(page: number = 1, limit: number = 20, module?: string): Promise<AdminResponse<{
    logs: Array<AuditLogRow & { admin: { userId: string }; adminUser: PublicUser | undefined }>
    total: number
    pages: number
    currentPage: number
}>> {
    try {
        const accessCheck = await checkModuleAccess("admin_management", "read")
        if (!accessCheck.authorized) return { success: false, error: accessCheck.error }

        const whereClause = module && module !== "all" ? eq(adminAuditLogs.module, module) : undefined

        const [logs, totalResult] = await Promise.all([
            db.query.adminAuditLogs.findMany({
                where: whereClause,
                limit,
                offset: (page - 1) * limit,
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                with: {
                    admin: {
                        columns: { userId: true }
                    }
                }
            }),
            db.select({ total: count() }).from(adminAuditLogs).where(whereClause)
        ])
        const total = totalResult[0]?.total ?? 0

        // Get user details for each log
        const logsWithUser = await Promise.all(
            logs.map(async (log) => {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, log.admin.userId),
                    columns: { id: true, name: true, email: true, image: true }
                })
                return { ...log, adminUser: user }
            })
        )

        return {
            success: true,
            data: {
                logs: logsWithUser,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        }
    } catch (error) {
        console.error("Get audit logs error:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}

// better-auth verifies credential sign-in against the `account` row
// (providerId "credential"), never `users.hashedPassword`. Every password write
// in this file used to target that dead column, so an admin could be issued a
// password that could not sign them in. This routes the write to the record
// better-auth actually reads.
async function writeCredentialPassword(userId: string, hashedPassword: string): Promise<void> {
    const existing = await db.query.accounts.findFirst({
        where: and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
    })

    if (existing) {
        await db.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, existing.id))
    } else {
        await db.insert(accounts).values({
            userId,
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
        })
    }
}

/** The stored credential hash for a user, or null if they have no password. */
async function readCredentialPassword(userId: string): Promise<string | null> {
    const existing = await db.query.accounts.findFirst({
        where: and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
        columns: { password: true },
    })
    return existing?.password ?? null
}

// setAdminPassword() removed (2026-08-24, approved by Niraj): it set a
// password via `adminAccess.accessCode`, a login flow the invitation-link
// join page (app/join/[token]) never uses - `acceptAdminInvitation()` in
// invitations.action.ts hashes and stores the password itself during
// signup. Nothing set `accessCode` for this function to ever consume, so it
// had zero callers and zero code that could have driven it.

// Change password with current password verification
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<AdminResponse<null>> {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true }
        })
        if (!user) {
            return { success: false, error: "User not found" }
        }

        const currentHash = await readCredentialPassword(user.id)
        if (!currentHash) {
            return { success: false, error: "This account has no password set" }
        }

        const valid = await bcrypt.compare(currentPassword, currentHash)
        if (!valid) {
            return { success: false, error: "Current password is incorrect" }
        }

        const hashedNew = await bcrypt.hash(newPassword, 12)
        await writeCredentialPassword(user.id, hashedNew)

        const adminRecord = await db.query.adminAccess.findFirst({ where: eq(adminAccess.userId, user.id) })
        if (adminRecord) {
            await logAdminAudit({
                adminId: adminRecord.id,
                action: "UPDATE",
                module: "admin_management",
                resourceType: "User",
                resourceId: user.id,
                description: "Changed password"
            })
        }

        return { success: true, data: null }
    } catch (error) {
        console.error("Change password error:", error)
        return { success: false, error: "Failed to change password" }
    }
}
