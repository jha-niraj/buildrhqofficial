"use server"

import { db, withTransaction, users, accounts, adminAccess, adminInvitations, adminAuditLogs, adminNotifications } from "@repo/db"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import type { AdminResponse } from "@/types/admin"
import type { AdminPermissions } from "@/lib/navigation"

// ─────────────────────────────────────────────────────────────────────────────
// The public half of the invitation flow - the two functions here are the only
// ones in the whole app deliberately reachable with no session. Everything else
// under actions/ opens with checkAdminAccess(); these two are the replacement
// for the old, unauthenticated /api/auth/verify-access-code route (ADM-2): the
// invitation CODE is the credential, so the trust boundary is "do you have the
// link", the same as any invite-by-email flow, and the actual account grant
// happens inside one transaction rather than six independent statements with
// no atomicity between them. See plan/admin/tasks.md ADM-13.
// ─────────────────────────────────────────────────────────────────────────────

export interface InvitationPreview {
    email: string
    name: string | null
    adminRole: string
    invitedByName: string | null
    expiresAt: Date
}

/** Public lookup - no admin_access check, no session required. Read-only:
 *  the only mutation is flipping a stale PENDING row to EXPIRED, which is
 *  just bookkeeping. */
export async function getInvitationByCode(code: string): Promise<AdminResponse<InvitationPreview>> {
    try {
        const invitation = await db.query.adminInvitations.findFirst({
            where: eq(adminInvitations.code, code),
        })

        if (!invitation) return { success: false, error: "This invitation link is invalid." }
        if (invitation.status === "USED") return { success: false, error: "This invitation has already been used." }
        if (invitation.status === "REVOKED") return { success: false, error: "This invitation has been revoked." }

        if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
            if (invitation.status === "PENDING") {
                await db.update(adminInvitations).set({ status: "EXPIRED" }).where(eq(adminInvitations.id, invitation.id))
            }
            return { success: false, error: "This invitation has expired. Ask a super admin to send a new one." }
        }

        let invitedByName: string | null = null
        const creator = await db.query.adminAccess.findFirst({ where: eq(adminAccess.id, invitation.createdById) })
        if (creator) {
            const creatorUser = await db.query.users.findFirst({
                where: eq(users.id, creator.userId),
                columns: { name: true, email: true },
            })
            invitedByName = creatorUser?.name ?? creatorUser?.email ?? null
        }

        return {
            success: true,
            data: {
                email: invitation.email,
                name: invitation.name,
                adminRole: invitation.adminRole,
                invitedByName,
                expiresAt: invitation.expiresAt,
            },
        }
    } catch (error) {
        console.error("Get invitation error:", error)
        return { success: false, error: "Failed to load this invitation." }
    }
}

/**
 * Accept an invitation: find-or-create the user, write their credential, grant
 * admin_access, and mark the invitation used - as one transaction, so a
 * failure partway through cannot leave a redeemed code attached to no admin
 * account (or the reverse).
 */
export async function acceptAdminInvitation(
    code: string,
    password: string,
    name?: string,
): Promise<AdminResponse<null>> {
    if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." }
    }

    try {
        const joined = await withTransaction(async (tx) => {
            const invitation = await tx.query.adminInvitations.findFirst({
                where: eq(adminInvitations.code, code),
            })
            if (!invitation) throw new Error("This invitation link is invalid.")
            if (invitation.status !== "PENDING") throw new Error("This invitation is no longer valid.")
            if (new Date() > invitation.expiresAt) throw new Error("This invitation has expired.")

            let user = await tx.query.users.findFirst({ where: eq(users.email, invitation.email) })

            if (user) {
                const existingAdmin = await tx.query.adminAccess.findFirst({ where: eq(adminAccess.userId, user.id) })
                if (existingAdmin) throw new Error("This account already has console access - sign in instead.")
            }

            const hashedPassword = await bcrypt.hash(password, 12)

            if (!user) {
                const [newUser] = await tx.insert(users).values({
                    email: invitation.email,
                    name: name?.trim() || invitation.name || invitation.email.split("@")[0],
                    emailVerified: true,
                    role: "Admin",
                }).returning()
                user = newUser
            } else {
                await tx.update(users).set({ role: "Admin" }).where(eq(users.id, user.id))
            }
            if (!user) throw new Error("Failed to create the account.")

            // better-auth verifies credential sign-in against the `account` row,
            // never `users.hashedPassword` - same note as admin.action.ts's
            // writeCredentialPassword.
            const existingCredential = await tx.query.accounts.findFirst({
                where: and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")),
            })
            if (existingCredential) {
                await tx.update(accounts).set({ password: hashedPassword }).where(eq(accounts.id, existingCredential.id))
            } else {
                await tx.insert(accounts).values({
                    userId: user.id,
                    accountId: user.id,
                    providerId: "credential",
                    password: hashedPassword,
                })
            }

            const [adminRecord] = await tx.insert(adminAccess).values({
                userId: user.id,
                adminRole: invitation.adminRole,
                permissions: (invitation.permissions ?? {}) as AdminPermissions,
                status: "ACTIVE",
            }).returning()
            if (!adminRecord) throw new Error("Failed to grant console access.")

            await tx.update(adminInvitations)
                .set({ status: "USED", usedBy: user.id, usedAt: new Date() })
                .where(eq(adminInvitations.id, invitation.id))

            await tx.insert(adminAuditLogs).values({
                adminId: adminRecord.id,
                action: "LOGIN",
                module: "admin_management",
                resourceType: "AdminAccess",
                resourceId: adminRecord.id,
                description: `${user.email} accepted an admin invitation (role: ${invitation.adminRole})`,
            })

            return { name: user.name, email: user.email, adminId: adminRecord.id }
        })

        revalidatePath("/admins")

        // Best-effort - notifying the team that someone joined must never fail
        // the join itself, so this runs after the transaction has already
        // committed and its own errors are swallowed.
        try {
            const superAdmins = await db.query.adminAccess.findMany({
                where: and(eq(adminAccess.adminRole, "SUPER_ADMIN"), eq(adminAccess.status, "ACTIVE")),
                columns: { id: true },
            })
            if (superAdmins.length > 0) {
                await db.insert(adminNotifications).values(
                    superAdmins
                        .filter((a) => a.id !== joined.adminId)
                        .map((a) => ({
                            adminId: a.id,
                            title: "New team member",
                            message: `${joined.name || joined.email} accepted their invitation and joined the console.`,
                            type: "INFO",
                            actionUrl: "/admins",
                            actionLabel: "View team",
                        })),
                )
            }
        } catch (notifyError) {
            console.error("Failed to notify super admins of new team member:", notifyError)
        }

        return { success: true, data: null }
    } catch (error: unknown) {
        console.error("Accept invitation error:", error)
        const message = error instanceof Error ? error.message : "Failed to accept this invitation."
        return { success: false, error: message }
    }
}
