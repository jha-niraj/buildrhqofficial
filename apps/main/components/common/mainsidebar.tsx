"use client"

import { useCallback, useEffect, useState } from "react"
import { Logo } from "@repo/ui/components/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Zap, Sparkles, User, Settings } from "lucide-react"
import { useSession, signOut } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { cn } from "@repo/ui/lib/utils"
import { AppSidebar, type AppSidebarNotification } from "@repo/ui/components/app-sidebar"
import { useSidebar } from "@/components/common/sidebarprovider"
import { mainNavigation } from "@/lib/navigation"
import { useUserStore } from "@/app/store/useUserStore"
import { useAIPanelStore } from "@/app/store/aiPanelStore"
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/(main)/notifications/notification.action"

export default function Sidebar() {
    const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
    const { data: session, isPending } = useSession()
    const router = useRouter()

    const credits = useUserStore((s) => s.credits)
    const fetchCreditsAndXp = useUserStore((s) => s.fetchCreditsAndXp)
    // The AI control lives in the sidebar footer rather than only in the floating
    // launcher, so the panel has a permanent home the user can find twice.
    const aiOpen = useAIPanelStore((s) => s.isOpen)
    const toggleAI = useAIPanelStore((s) => s.toggle)

    const [notifs, setNotifs] = useState<AppSidebarNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => { if (session?.user) fetchCreditsAndXp() }, [session?.user, fetchCreditsAndXp])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const r = await getNotifications(1, 50)
            const data = (r as { data?: { notifications?: unknown[]; totalUnread?: number } }).data
            if (r.success && data?.notifications) {
                setNotifs((data.notifications as Array<Record<string, unknown>>).map(n => ({
                    id: n.id as string,
                    title: n.title as string,
                    description: (n.message as string) ?? null,
                    read: Boolean(n.read),
                    type: (n.type as string) ?? "INFO",
                    actionUrl: (n.actionUrl as string) ?? null,
                    createdAt: n.createdAt as Date,
                })))
                setUnreadCount(data.totalUnread ?? 0)
            }
        } catch { /* silent */ } finally { setLoading(false) }
    }, [])

    useEffect(() => { if (session?.user) load() }, [session?.user, load])

    const onItemClick = async (n: AppSidebarNotification) => {
        if (!n.read) {
            await markAsRead(n.id)
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
            setUnreadCount(c => Math.max(0, c - 1))
        }
        if (n.actionUrl) router.push(n.actionUrl)
    }

    const handleSignOut = async () => {
        await signOut()
        toast.success("Signed out")
        router.push("/")
    }

    return (
        <AppSidebar
            brand={{
                name: "ShipItHQ",
                subtitle: "Developer Suite",
                homeHref: "/home",
                logo: (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"><Logo className="h-[19px] w-[19px]" /></div>
                ),
            }}
            primary={mainNavigation.primary}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            user={session?.user ? { name: session.user.name, image: session.user.image, role: (session.user as { role?: string }).role ?? "Developer" } : null}
            isPending={isPending}
            onSignOut={handleSignOut}
            profileHref="/profile"
            profileLinks={[
                { label: "Profile", href: "/profile", icon: User },
                { label: "Settings", href: "/settings", icon: Settings },
            ]}
            notifications={{
                items: notifs,
                unreadCount,
                loading,
                onItemClick,
                onMarkAllRead: async () => { await markAllAsRead(); setNotifs(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0) },
                viewAllHref: "/home",
            }}
            footerExtra={
                <div className="flex items-center gap-1.5">
                    <Link href="/purchase" className="flex flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors min-w-0">
                        <Zap className="h-3.5 w-3.5 text-neutral-900 dark:text-white shrink-0" />
                        <span className="truncate">{typeof credits === "number" ? `${credits.toLocaleString()} credits` : "Credits"}</span>
                    </Link>
                    {/* A button, not a Link: this opens the docked panel in place.
                        Sending the user to /ai instead would navigate away from the
                        page they wanted help with. */}
                    <button
                        type="button"
                        onClick={toggleAI}
                        aria-pressed={aiOpen}
                        // The primary action in this footer, and now the ONLY way in -
                        // the floating launcher that used to sit bottom-right is gone.
                        // Filled rather than tinted: beside a muted credits pill it has
                        // to read as the thing to press, not as a second chip.
                        className={cn(
                            "group flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-all min-w-0",
                            "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 hover:shadow active:scale-[0.98]",
                            "dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                            aiOpen && "ring-2 ring-neutral-900/20 dark:ring-white/30",
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
                        <span className="truncate">Ask AI</span>
                    </button>
                </div>
            }
            footerExtraCollapsed={
                <>
                    <Link
                        href="/purchase"
                        title={typeof credits === "number" ? `${credits.toLocaleString()} credits` : "Credits"}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        <Zap className="h-5 w-5" />
                    </Link>
                    <button
                        type="button"
                        onClick={toggleAI}
                        aria-pressed={aiOpen}
                        title="Ask AI"
                        // Collapsed rail: same promotion, so the entry point does not
                        // quietly demote itself to a plain icon when the nav narrows.
                        className={cn(
                            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                            "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 active:scale-95",
                            "dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                            aiOpen && "ring-2 ring-neutral-900/20 dark:ring-white/30",
                        )}
                    >
                        <Sparkles className="h-5 w-5" />
                    </button>
                </>
            }
        />
    )
}
