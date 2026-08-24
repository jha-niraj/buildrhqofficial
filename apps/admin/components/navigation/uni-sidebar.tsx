"use client"

import { School } from "lucide-react"
import { AppSidebar } from "@repo/ui/components/app-sidebar"
import { useSidebar } from "@/components/navigation/sidebarprovider"
import { universityModuleNav } from "@/lib/navigation"
import { formatAdminRole } from "@/lib/role-labels"
import { useConsoleSidebar } from "./use-console-sidebar"
import { AskAIFooter, AskAIFooterCollapsed } from "./ask-ai-footer"

/**
 * Module-sidebar takeover for `/uni/*` (ADM-21) - see hiring-sidebar.tsx for
 * the full reasoning, identical here.
 */
export function UniversitySidebar({
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
                name: "University",
                subtitle: "Admin Console",
                homeHref: "uni",
                logo: (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                        <School className="h-[18px] w-[18px]" />
                    </div>
                ),
            }}
            backLink={{ label: "Back to console", href: "dashboard" }}
            primary={universityModuleNav}
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

export default UniversitySidebar
