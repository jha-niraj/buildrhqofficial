"use client"

import { Briefcase } from "lucide-react"
import { AppSidebar } from "@repo/ui/components/app-sidebar"
import { useSidebar } from "@/components/navigation/sidebarprovider"
import { hiringModuleNav } from "@/lib/navigation"
import { formatAdminRole } from "@/lib/role-labels"
import { useConsoleSidebar } from "./use-console-sidebar"
import { AskAIFooter, AskAIFooterCollapsed } from "./ask-ai-footer"

/**
 * Module-sidebar takeover for `/hiring/*` (ADM-21) - the same pattern
 * apps/main uses for `/jobs/*` via its own JobsSidebar, built here on top of
 * the shared `AppSidebar` instead of a bespoke component so the console
 * keeps its command palette, notifications, Ask AI and profile row while
 * inside the module. Rendered instead of `AdminSidebar` by
 * `_components/layout-client.tsx` based on the current path.
 */
export function HiringSidebar({
    user,
}: {
    user: { name: string; email: string; image: string | null }
}) {
    const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, adminRole } = useSidebar()
    const {
        notifs, unreadCount, notifsLoading, loadNotifications,
        handleNotificationClick, handleMarkAllRead, handleSignOut, openAI, aiOpen,
    } = useConsoleSidebar()

    return (
        <AppSidebar
            brand={{
                name: "Hiring",
                subtitle: "Admin Console",
                homeHref: "hiring",
                logo: (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                        <Briefcase className="h-[18px] w-[18px]" />
                    </div>
                ),
            }}
            backLink={{ label: "Back to console", href: "dashboard" }}
            primary={hiringModuleNav}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            user={{ name: user.name, image: user.image, role: formatAdminRole(adminRole) }}
            onSignOut={handleSignOut}
            profileHref="/admins/profile"
            profileLinks={[]}
            footerExtra={<AskAIFooter onOpen={openAI} isOpen={aiOpen} />}
            footerExtraCollapsed={<AskAIFooterCollapsed onOpen={openAI} isOpen={aiOpen} />}
            notifications={{
                items: notifs,
                unreadCount,
                loading: notifsLoading,
                onOpen: loadNotifications,
                onItemClick: handleNotificationClick,
                onMarkAllRead: unreadCount > 0 ? handleMarkAllRead : undefined,
            }}
        />
    )
}

export default HiringSidebar
