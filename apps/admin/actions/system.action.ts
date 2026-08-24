"use server"

import { db, adminSystemSettings, adminNotifications, users } from "@repo/db"
import { eq, and, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { AdminResponse } from "@/types/admin"
import { logAdminAudit } from "@/lib/audit-log"
import { checkModuleAccess as checkAdminAccess, requireAnyActiveAdmin } from "@/lib/module-access"

type SystemSettingRow = typeof adminSystemSettings.$inferSelect
type NotificationRow = typeof adminNotifications.$inferSelect

// Get all system settings
export async function getSystemSettings(): Promise<AdminResponse<SystemSettingRow[]>> {
    try {
        const check = await checkAdminAccess("system", "read")
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        const settings = await db.query.adminSystemSettings.findMany({
            orderBy: (t, { desc }) => [desc(t.updatedAt)]
        })

        return { success: true, data: settings }
    } catch (error) {
        console.error("Get system settings error:", error)
        return { success: false, error: "Failed to fetch system settings" }
    }
}

// Get system setting by key
export async function getSystemSetting(key: string): Promise<AdminResponse<SystemSettingRow>> {
    try {
        const check = await checkAdminAccess("system", "read")
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        const setting = await db.query.adminSystemSettings.findFirst({
            where: eq(adminSystemSettings.key, key)
        })

        if (!setting) {
            return { success: false, error: "Setting not found" }
        }

        return { success: true, data: setting }
    } catch (error) {
        console.error("Get system setting error:", error)
        return { success: false, error: "Failed to fetch system setting" }
    }
}

// Update system setting
export async function updateSystemSetting(key: string, data: {
    value: unknown
    description?: string
}): Promise<AdminResponse<SystemSettingRow>> {
    try {
        const check = await checkAdminAccess("system", "write")
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        // Upsert: try update first, then insert
        const existing = await db.query.adminSystemSettings.findFirst({
            where: eq(adminSystemSettings.key, key)
        })

        let setting
        if (existing) {
            const [updated] = await db.update(adminSystemSettings)
                .set({ value: data.value, description: data.description })
                .where(eq(adminSystemSettings.key, key))
                .returning()
            setting = updated
        } else {
            const [inserted] = await db.insert(adminSystemSettings)
                .values({ key, value: data.value, description: data.description })
                .returning()
            setting = inserted
        }

        if (!setting) return { success: false, error: "Failed to save system setting" }

        await logAdminAudit({
            adminId: check.adminAccess!.id,
            action: "UPDATE",
            module: "system",
            resourceType: "SystemSettings",
            resourceId: key,
            description: `Updated system setting: ${key}`
        })

        revalidatePath("/system")

        return { success: true, data: setting }
    } catch (error) {
        console.error("Update system setting error:", error)
        return { success: false, error: "Failed to update system setting" }
    }
}

// `getDatabaseStats` and `getSystemHealth` were removed here along with the
// /system/database page they existed for (2026-08-24 nav removal, page and server code
// removed on request). Nothing else called either one.
//
// The rest of this file is still live: settings, cache clearing and admin notifications all
// have callers elsewhere in the console.

// Clear cache
export async function clearCache(cacheKeys?: string[]): Promise<AdminResponse<{ cleared: string[] }>> {
    try {
        const check = await checkAdminAccess("system", "write")
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        // Revalidate paths
        if (cacheKeys && cacheKeys.length > 0) {
            cacheKeys.forEach(key => revalidatePath(key))
        } else {
            // Clear all common paths - /projects and /communities removed
            // (2026-08-24): neither route has existed in this app since the
            // dead project.action.ts/mock.action.ts deletion (ADM-5).
            revalidatePath("/")
            revalidatePath("/dashboard")
            revalidatePath("/users")
            revalidatePath("/feedback")
            revalidatePath("/analytics")
        }

        await logAdminAudit({
            adminId: check.adminAccess!.id,
            action: "UPDATE",
            module: "system",
            resourceType: "Cache",
            resourceId: "cache",
            description: `Cleared cache: ${cacheKeys?.join(", ") || "all"}`
        })

        return { success: true, data: { cleared: cacheKeys || ["all"] } }
    } catch (error) {
        console.error("Clear cache error:", error)
        return { success: false, error: "Failed to clear cache" }
    }
}

// Get admin notifications
export async function getAdminNotifications(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
}): Promise<AdminResponse<{
    notifications: NotificationRow[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
}>> {
    try {
        const check = await requireAnyActiveAdmin()
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        const page = params?.page || 1
        const limit = params?.limit || 20
        const offset = (page - 1) * limit

        const whereConditions = [eq(adminNotifications.adminId, check.adminAccess.id)]

        if (params?.unreadOnly) {
            whereConditions.push(eq(adminNotifications.isRead, false))
        }

        const whereClause = and(...whereConditions)

        const [notificationList, totalResult] = await Promise.all([
            db.query.adminNotifications.findMany({
                where: whereClause,
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                limit,
                offset
            }),
            db.select({ total: count() }).from(adminNotifications).where(whereClause)
        ])
        const total = totalResult[0]?.total ?? 0

        return {
            success: true,
            data: {
                notifications: notificationList,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }
    } catch (error) {
        console.error("Get admin notifications error:", error)
        return { success: false, error: "Failed to fetch notifications" }
    }
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<AdminResponse<null>> {
    try {
        const check = await requireAnyActiveAdmin()
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        // Scoped to the caller's own notification - `id` alone would let any
        // admin mark (or probe the existence of) another admin's notification.
        await db.update(adminNotifications)
            .set({ isRead: true, readAt: new Date() })
            .where(and(eq(adminNotifications.id, id), eq(adminNotifications.adminId, check.adminAccess.id)))

        return { success: true, data: null }
    } catch (error) {
        console.error("Mark notification as read error:", error)
        return { success: false, error: "Failed to mark notification as read" }
    }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<AdminResponse<null>> {
    try {
        const check = await requireAnyActiveAdmin()
        if (!check.authorized) {
            return { success: false, error: check.error }
        }

        await db.update(adminNotifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(adminNotifications.adminId, check.adminAccess!.id),
                    eq(adminNotifications.isRead, false)
                )
            )

        return { success: true, data: null }
    } catch (error) {
        console.error("Mark all notifications as read error:", error)
        return { success: false, error: "Failed to mark all notifications as read" }
    }
}
