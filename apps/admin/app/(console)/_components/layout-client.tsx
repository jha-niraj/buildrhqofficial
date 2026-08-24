"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet"
import { SidebarProvider, useSidebar } from "@/components/navigation/sidebarprovider"
import { AdminSidebar } from "@/components/navigation/admin-sidebar"
import { HiringSidebar } from "@/components/navigation/hiring-sidebar"
import { UniversitySidebar } from "@/components/navigation/uni-sidebar"
import { AIPanel } from "@/components/ai/ai-panel"
import { AITriggerButton } from "@/components/ai/ai-trigger-button"
import { useAIPanelStore, AI_MIN_WIDTH, AI_MAX_WIDTH, clampPanelWidth } from "@/stores/ai-panel.store"
import { getEffectivePermissions, hasPermission, type AdminPermissions } from "@/lib/navigation"

// ─────────────────────────────────────────────────────────────────────────────
// Console shell geometry - ported from apps/main's app/(main)/layout.tsx, the
// pattern gurukul's admin independently converged on too: sidebar, page and AI
// rail as three floating cards, the rail docking as a real column on lg+ (the
// page narrows, nothing gets covered) and becoming a bottom Sheet below it.
// See plan/admin/tasks.md ADM-4, ADM-19.
//
// `--page-h` is the single source of truth for a full-height page's height,
// defined HERE because this element owns every term in the sum:
//
//   100dvh   the viewport, SMALL form - mobile browser chrome makes bare
//            100vh taller than what's actually visible, hiding the last
//            rows and any pagination under the URL bar (see
//            docs/responsiveness.md section 1). dvh degrades to vh on
//            browsers that don't support it, so this has no floor to check.
// - 1.5rem   this element's m-3 (0.75rem each side)
//
// The outer shell div and this element's own `h-screen`/`100vh` both had to
// move to `dvh` too, not just this variable - the variable is the contract
// pages consume, but the shell is a box like any other and doesn't get the
// fix for free just by publishing it.
//
// A rule in packages/ui/src/styles/globals.css retargets `h-screen` /
// `min-h-screen` inside [data-app-page] at it. No `--app-bottom-nav-h` term:
// that variable is 0 whenever no MobileBottomNav is mounted, which is true
// here.
// ─────────────────────────────────────────────────────────────────────────────

function ConsoleContent({
    children,
    user,
}: {
    children: React.ReactNode
    user: { name: string; email: string; image: string | null }
}) {
    const { isCollapsed, setIsCollapsed, adminRole, permissions } = useSidebar()
    const { isOpen: aiOpen, close: closeAI, width: aiWidth, setWidth: setAIWidth, isMaximized: aiMaximized } = useAIPanelStore()
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()

    // Module-sidebar takeover (ADM-21): /hiring/* and /uni/* get their own
    // focused sidebar instead of the main console tree, the same swap
    // apps/main does for /jobs/* via its own JobsSidebar. Falls back to the
    // main sidebar if the admin cannot even read that module - a TEAM_MEMBER
    // with no grant should see the (permission-filtered) main nav here, not
    // a module sidebar for a module they cannot open.
    const effectivePermissions = getEffectivePermissions(adminRole, permissions)
    const Sidebar = pathname.startsWith("/hiring") && hasPermission(effectivePermissions, "hiring", "read")
        ? HiringSidebar
        : pathname.startsWith("/uni") && hasPermission(effectivePermissions, "university", "read")
            ? UniversitySidebar
            : AdminSidebar

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)")
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    // Opening the rail collapses the sidebar - three full columns don't fit on
    // a laptop, and the nav is the one thing the admin is least likely to be
    // reading while typing a question. Only on the OPEN transition, or the
    // sidebar could never be re-expanded while the rail stayed open.
    const wasAIOpen = useRef(aiOpen)
    useEffect(() => {
        if (isMobile) return
        if (aiOpen && !wasAIOpen.current) setIsCollapsed(true)
        wasAIOpen.current = aiOpen
    }, [aiOpen, isMobile, setIsCollapsed])

    const isDocked = aiOpen && !isMobile

    const [isResizing, setIsResizing] = useState(false)

    const handleResizeStart = useCallback((startX: number, startWidth: number) => {
        setIsResizing(true)
        // The rail is docked RIGHT, so dragging left (smaller clientX) widens it.
        const onMove = (clientX: number) => setAIWidth(clampPanelWidth(startWidth + (startX - clientX)))
        const onMouseMove = (e: MouseEvent) => { e.preventDefault(); onMove(e.clientX) }
        const onTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0]
            if (touch) onMove(touch.clientX)
        }
        const stop = () => {
            setIsResizing(false)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", stop)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", stop)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
        }
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", stop)
        window.addEventListener("touchmove", onTouchMove, { passive: true })
        window.addEventListener("touchend", stop)
        document.body.style.cursor = "col-resize"
        document.body.style.userSelect = "none"
    }, [setAIWidth])

    const railWidth = aiMaximized ? "min(1100px, 72vw)" : `${aiWidth}px`

    return (
        <div className="h-dvh w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            <Sidebar user={user} />

            <div className={cn("min-w-0 transition-all duration-300 ease-in-out", isCollapsed ? "lg:ml-[106px]" : "lg:ml-[17rem]")}>
                <main className="m-3 flex h-[calc(100dvh-1.5rem)] overflow-hidden lg:ml-0">
                    <div
                        data-app-page
                        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950"
                        style={{ ["--page-h" as string]: "calc(100dvh - 1.5rem)" }}
                    >
                        <ScrollArea className="min-h-0 min-w-0 flex-1" reflow>
                            {children}
                        </ScrollArea>
                    </div>

                    {/* AI rail - a real column, not an overlay. The page narrows to
                        make room for it. */}
                    <AnimatePresence initial={false}>
                        {isDocked && (
                            <motion.aside
                                key="ai-rail"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: railWidth, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={isResizing ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
                                className="relative ml-3 h-full shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                            >
                                {!aiMaximized && (
                                    <div
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label="Resize AI panel"
                                        aria-valuenow={aiWidth}
                                        aria-valuemin={AI_MIN_WIDTH}
                                        aria-valuemax={AI_MAX_WIDTH}
                                        tabIndex={0}
                                        onMouseDown={(e) => { e.preventDefault(); handleResizeStart(e.clientX, aiWidth) }}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowLeft") setAIWidth(aiWidth + 20)
                                            if (e.key === "ArrowRight") setAIWidth(aiWidth - 20)
                                        }}
                                        className="group absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-700"
                                    >
                                        <div className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-600" />
                                    </div>
                                )}
                                <AIPanel />
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile: AI panel as a bottom sheet covering the full screen. */}
            <Sheet open={isMobile && aiOpen} onOpenChange={(v) => { if (!v) closeAI() }}>
                <SheetContent side="bottom" className="h-[100dvh] w-full max-w-full rounded-t-2xl border-0 p-0 [&>button]:hidden">
                    <AIPanel />
                </SheetContent>
            </Sheet>

            {/* Desktop reaches this from the sidebar's own "Ask AI" row (footerExtra
                in admin-sidebar.tsx) - a second floating trigger over the page would
                be a redundant control. Below `lg` the sidebar is a hidden Sheet, so
                this stays the only way in on mobile. */}
            <AITriggerButton className="lg:hidden" />
        </div>
    )
}

export function LayoutClient({
    children,
    adminRole,
    permissions,
    user,
}: {
    children: React.ReactNode
    adminRole: string
    permissions: AdminPermissions
    user: { name: string; email: string; image: string | null }
}) {
    return (
        <SidebarProvider adminRole={adminRole} permissions={permissions}>
            <ConsoleContent user={user}>{children}</ConsoleContent>
        </SidebarProvider>
    )
}
