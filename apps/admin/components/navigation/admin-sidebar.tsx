"use client"

import { Shield, Settings } from "lucide-react"
import { AppSidebar } from "@repo/ui/components/app-sidebar"
import { useSidebar } from "@/components/navigation/sidebarprovider"
import { getNavigationForPermissions } from "@/lib/navigation"
import { formatAdminRole } from "@/lib/role-labels"
import { useConsoleSidebar } from "./use-console-sidebar"
import { AskAIFooter, AskAIFooterCollapsed } from "./ask-ai-footer"

/**
 * The console's main sidebar - wraps `@repo/ui`'s shared `AppSidebar`, the
 * same component every other ShipItHQ app (main, uni, hiring) wraps for its
 * own nav. That is deliberate: gurukul's admin has its own bespoke sidebar
 * because gurukul has no shared `packages/ui` to draw on; shipithq does, and
 * forking a second implementation here would fight the one-design-per-app-
 * family contract that component's own header comment states. See
 * plan/admin/tasks.md ADM-3.
 *
 * `/hiring/*` and `/uni/*` render `HiringSidebar` / `UniversitySidebar`
 * instead of this one - see `_components/layout-client.tsx` and ADM-21.
 */
export function AdminSidebar({
    user,
}: {
    user: { name: string; email: string; image: string | null }
}) {
    const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, adminRole, permissions } = useSidebar()
    const nav = getNavigationForPermissions(permissions, adminRole)
    const {
        notifs, unreadCount, notifsLoading, loadNotifications,
        handleNotificationClick, handleMarkAllRead, handleSignOut, openAI,
    } = useConsoleSidebar()

    return (
        <AppSidebar
            brand={{
                name: "ShipItHQ",
                subtitle: "Admin Console",
                homeHref: "dashboard",
                logo: (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                        <Shield className="h-[18px] w-[18px]" />
                    </div>
                ),
            }}
            primary={nav.primary}
            secondary={nav.secondary}
            secondaryLabel="Administration"
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            user={{ name: user.name, image: user.image, role: formatAdminRole(adminRole) }}
            onSignOut={handleSignOut}
            profileHref="/admins/profile"
            profileLinks={[{ label: "My Profile", href: "/admins/profile", icon: Settings }]}
            footerExtra={<AskAIFooter onOpen={openAI} />}
            footerExtraCollapsed={<AskAIFooterCollapsed onOpen={openAI} />}
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

export default AdminSidebar
