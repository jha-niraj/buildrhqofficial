"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { db, users, notifications } from "@repo/db"
import { eq, and, desc, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"


async function getCurrentUser() {
    const session = await getSession(headers())
    if (!session?.user?.email) throw new Error("Not authenticated")
    const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
    if (!user) throw new Error("User not found")
    return user
}

export async function getNotifications(page = 1, limit = 20) {
    try {
        const user = await getCurrentUser()
        const offset = (page - 1) * limit

        const notificationList = await db.query.notifications.findMany({
            where: eq(notifications.userId, user.id),
            orderBy: desc(notifications.createdAt),
            limit,
            offset,
        })

        const [unreadRow] = await db
            .select({ totalUnread: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
        const totalUnread = unreadRow?.totalUnread ?? 0

        return {
            success: true,
            data: {
                notifications: notificationList,
                totalUnread,
                hasMore: notificationList.length === limit,
            },
        }
    } catch (error: unknown) {
        console.error("Failed to fetch notifications:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch notifications",
        }
    }
}

export async function markAsRead(notificationId: string) {
    try {
        const user = await getCurrentUser()

        await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))

        revalidatePath('/')
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Something went wrong" }
    }
}

export async function markAllAsRead() {
    try {
        const user = await getCurrentUser()

        await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))

        revalidatePath('/')
        return { success: true }
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Something went wrong" }
    }
}
