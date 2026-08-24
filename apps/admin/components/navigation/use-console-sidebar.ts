"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import type { AppSidebarNotification } from "@repo/ui/components/app-sidebar"
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/system.action"
import { useAIPanelStore } from "@/stores/ai-panel.store"

/**
 * Everything the console's three sidebars (main, Hiring, University - ADM-21)
 * need beyond their own nav config: notifications, sign-out, and the AI
 * trigger. Pulled out of `AdminSidebar` so the module sidebars don't each
 * carry a second copy of the same polling/session wiring.
 */
export function useConsoleSidebar() {
    const router = useRouter()
    const openAI = useAIPanelStore((s) => s.open)
    // Exposed so the footer button can show a pressed state. Selected separately rather than
    // taking the whole store, or every sidebar re-renders on each keystroke in the panel.
    const aiOpen = useAIPanelStore((s) => s.isOpen)

    const [notifs, setNotifs] = useState<AppSidebarNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifsLoading, setNotifsLoading] = useState(false)

    const loadNotifications = useCallback(async () => {
        setNotifsLoading(true)
        try {
            const res = await getAdminNotifications({ limit: 50 })
            if (res.success) {
                setNotifs(res.data.notifications.map((n) => ({
                    id: n.id,
                    title: n.title,
                    description: n.message,
                    read: n.isRead,
                    type: n.type.toUpperCase(),
                    actionUrl: n.actionUrl,
                    createdAt: n.createdAt,
                })))
                setUnreadCount(res.data.notifications.filter((n) => !n.isRead).length)
            }
        } finally {
            setNotifsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotifications()
        // Notifications are per-admin and there's no push channel yet, so a
        // 60s poll while the console is open is the cheap way to keep the
        // bell current without a socket.
        const interval = setInterval(loadNotifications, 60_000)
        return () => clearInterval(interval)
    }, [loadNotifications])

    const handleNotificationClick = async (n: AppSidebarNotification) => {
        if (!n.read) {
            await markNotificationAsRead(n.id)
            setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
            setUnreadCount((c) => Math.max(0, c - 1))
        }
        if (n.actionUrl) router.push(n.actionUrl)
    }

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead()
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const handleSignOut = async () => {
        await signOut()
        toast.success("Signed out")
        router.push("/")
    }

    return {
        notifs,
        unreadCount,
        notifsLoading,
        loadNotifications,
        handleNotificationClick,
        handleMarkAllRead,
        handleSignOut,
        openAI,
        aiOpen,
    }
}
