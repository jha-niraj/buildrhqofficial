"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Shared ShipItHQ app sidebar. One design across every app (main, uni, hiring,
// admin) - a floating rounded card that collapses to an icon rail, with a
// command-palette search (⌘K), collapsible nav sections, a theme toggle,
// notifications, and a profile/sign-out footer. Each app renders a thin wrapper
// that feeds this its own nav config, session, and notifications.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
    LogOut, PanelLeftClose, PanelLeftOpen, ChevronDown, Bell, X, CheckCheck,
    Inbox, Menu, AlertCircle, Info, CheckCircle2, AlertTriangle, XCircle,
    ListFilter, ArrowDownUp, Check, ArrowLeft,
} from "lucide-react"
import { cn } from "../lib/utils"
import {
    Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@repo/ui/components/ui/tooltip"
import {
    Popover, PopoverTrigger, PopoverContent,
} from "@repo/ui/components/ui/popover"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@repo/ui/components/ui/sheet"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { ThemeToggle } from "@repo/ui/components/themetoggle"
import { MobileBottomNav, type BottomNavItem, type BottomNavCentreAction } from "./ui/mobile-bottom-nav"
import {
    CommandPalette, SidebarSearchButton, useCommandPaletteShortcut,
    type CommandPaletteGroup,
} from "@repo/ui/components/ui/command-palette"
import { motion, AnimatePresence } from "framer-motion"

// ── Public types ──────────────────────────────────────────────────────────────
export interface AppSidebarNavItem {
    name: string
    /** Stored with or without a leading slash; a leading slash is added if missing. */
    path: string
    icon: React.ComponentType<{ className?: string }>
    children?: AppSidebarNavItem[]
    badge?: string | number
    isImportant?: boolean
    comingSoon?: boolean
}

export type AppSidebarNotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR"

export interface AppSidebarNotification {
    id: string
    title: string
    description?: string | null
    read: boolean
    /** Category used for the module filter + per-item icon. Defaults to INFO. */
    type?: AppSidebarNotificationType | string | null
    actionUrl?: string | null
    createdAt: Date | string
    sender?: { name?: string | null; image?: string | null } | null
}

export interface AppSidebarProfileLink {
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ComponentType<{ className?: string }>
}

export interface AppSidebarProps {
    brand: {
        name: string
        subtitle?: string
        /** Optional custom logo node; falls back to a lettered orange tile. */
        logo?: React.ReactNode
        homeHref?: string
    }
    primary: AppSidebarNavItem[]
    secondary?: AppSidebarNavItem[]
    secondaryLabel?: string

    /**
     * A module-sidebar takeover (ADM-21 in shipithq's admin app; apps/main's
     * `(jobs)` route does the same thing with its own JobsSidebar). When set,
     * a distinct "back" row renders between the brand header and the search
     * bar - a bordered block with an arrow, not just another `primary` item,
     * so it reads as an exit from the current section rather than a fourth
     * nav destination.
     */
    backLink?: { label: string; href: string }

    isCollapsed: boolean
    setIsCollapsed: (v: boolean) => void
    /**
     * Small-screen bottom bar. Optional, and OPT-IN on purpose.
     *
     * When present it replaces the floating hamburger below `lg`: the bar's own "More" tab
     * opens the same sheet the hamburger did, so having both would be two controls for one
     * job, one of them floating over the page.
     *
     * Consumers that do not pass this keep the hamburger exactly as before - apps/admin does,
     * and its nav has no four destinations that would earn a permanent bar.
     *
     * The items are the app's call: it has the pathname and the nav shape, so it decides
     * which four are worth a thumb-reach tap and what counts as active.
     */
    bottomNav?: {
        items: BottomNavItem[]
        centreAction?: BottomNavCentreAction
    }
    isMobileOpen: boolean
    setIsMobileOpen: (v: boolean) => void

    user?: { name?: string | null; image?: string | null; role?: string | null } | null
    isPending?: boolean
    onSignOut: () => void
    profileHref?: string
    profileLinks?: AppSidebarProfileLink[]

    /** Optional notifications integration; omit to hide the bell. */
    notifications?: {
        items: AppSidebarNotification[]
        unreadCount: number
        loading?: boolean
        onOpen?: () => void
        onItemClick?: (n: AppSidebarNotification) => void
        onMarkAllRead?: () => void
        viewAllHref?: string
    }

    /** Extra footer content (e.g. a credits pill) rendered above the profile row. */
    footerExtra?: React.ReactNode

    /**
     * The collapsed-rail form of `footerExtra` - icon buttons in a vertical
     * stack. Supplied separately rather than derived, because a row of labelled
     * pills does not shrink into a 84px rail; it has to be re-laid-out. Without
     * this the tools simply vanish when the sidebar collapses, which is exactly
     * when the user is most likely to be reaching for them.
     */
    footerExtraCollapsed?: React.ReactNode
}

const normalize = (p: string) => (p.startsWith("/") ? p : `/${p}`)
const basePath = (p: string) => normalize(p).split("?")[0] ?? normalize(p)

// Notification categories ("modules") used for the filter + per-item icon.
// Palette stays warm/neutral (no blue/indigo/purple) per the brand rule.
const NOTIF_TYPES: {
    value: AppSidebarNotificationType
    label: string
    icon: React.ComponentType<{ className?: string }>
    tint: string
}[] = [
    { value: "INFO", label: "Updates", icon: Info, tint: "text-neutral-900 bg-neutral-900/10" },
    { value: "SUCCESS", label: "Success", icon: CheckCircle2, tint: "text-neutral-800 bg-neutral-800/10" },
    { value: "WARNING", label: "Warnings", icon: AlertTriangle, tint: "text-neutral-900 bg-neutral-900/10" },
    { value: "ERROR", label: "Alerts", icon: XCircle, tint: "text-red-500 bg-red-500/10" },
]

const notifTypeMeta = (t?: string | null) =>
    NOTIF_TYPES.find(x => x.value === (t ?? "INFO")) ?? NOTIF_TYPES[0]!

function timeAgo(d: Date | string): string {
    const date = typeof d === "string" ? new Date(d) : d
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 60) return "just now"
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
}

export function AppSidebar(props: AppSidebarProps) {
    const {
        brand, primary, secondary = [], secondaryLabel = "Management", backLink,
        isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, bottomNav,
        user, isPending, onSignOut, profileHref = "/profile", profileLinks = [],
        notifications, footerExtra, footerExtraCollapsed,
    } = props

    const pathname = usePathname()
    const router = useRouter()
    const [expandedItems, setExpandedItems] = React.useState<string[]>([])
    const [secondaryExpanded, setSecondaryExpanded] = React.useState(true)
    const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null)
    const [notifOpen, setNotifOpen] = React.useState(false)
    const [notifTab, setNotifTab] = React.useState<"unread" | "read">("unread")
    const [notifType, setNotifType] = React.useState<"ALL" | AppSidebarNotificationType>("ALL")
    const [notifSort, setNotifSort] = React.useState<"recent" | "oldest">("recent")
    const [notifFilterOpen, setNotifFilterOpen] = React.useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
    const [cmdOpen, setCmdOpen] = React.useState(false)
    useCommandPaletteShortcut(setCmdOpen)
    const activeItemRef = React.useRef<HTMLAnchorElement | null>(null)

    // Close menus on navigation.
    React.useEffect(() => {
        setIsMobileOpen(false); setOpenPopoverId(null); setProfileMenuOpen(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    // ── Most specific match wins ──
    //
    // Every nav path that the current URL is inside, longest first. A LEAF is active only if
    // it is the longest of those; a PARENT stays prefix-matched, because its highlight means
    // "you are somewhere in this group" rather than "you are here".
    //
    // The old rule prefix-matched everything, which lit up every ancestor at once. It shows
    // worst where an "Overview" entry sits AS A SIBLING of the pages beneath it - the admin
    // console does this three times:
    //
    //   Credits > [Overview /credits, Transactions /credits/transactions, ...]
    //   Hiring  > [Overview /hiring,  Companies /hiring/companies, Verification /hiring/companies/verification]
    //   Uni     > [Overview /uni,     ...]
    //
    // On /hiring/companies/verification that highlighted all THREE rows. Overview's path is a
    // prefix of its own siblings', so under a prefix rule it can never be switched off.
    const bestMatch = React.useMemo(() => {
        const candidates: string[] = []
        const walk = (items: AppSidebarNavItem[]) => {
            for (const it of items) {
                candidates.push(basePath(it.path))
                if (it.children?.length) walk(it.children)
            }
        }
        walk([...primary, ...secondary])
        return candidates
            .filter((c) => pathname === c || pathname.startsWith(`${c}/`))
            .sort((a, b) => b.length - a.length)[0]
    }, [pathname, primary, secondary])

    const isPathActive = React.useCallback((itemPath: string, hasChildren: boolean) => {
        const full = basePath(itemPath)
        const within = pathname === full || pathname.startsWith(`${full}/`)
        // A group header lights up for anything inside it.
        if (hasChildren) return within
        // A leaf lights up only when nothing more specific also matches.
        return within && full === bestMatch
    }, [pathname, bestMatch])

    // Auto-expand the active parent.
    React.useEffect(() => {
        for (const item of [...primary, ...secondary]) {
            if (item.children?.some(c => isPathActive(c.path, false))) {
                setExpandedItems(prev => prev.includes(item.path) ? prev : [...prev, item.path])
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    const toggleExpanded = React.useCallback((path: string) => {
        setExpandedItems(prev => prev.includes(path) ? prev.filter(p => p !== path) : [path])
    }, [])

    // Command palette groups from the nav tree.
    const commandGroups: CommandPaletteGroup[] = React.useMemo(() => {
        const build = (items: AppSidebarNavItem[]) => {
            const flat = items.flatMap(i => [i, ...(i.children ?? [])])
            const seen = new Set<string>()
            return flat
                .filter(i => i.path && !seen.has(i.path) && seen.add(i.path))
                .map(i => ({
                    id: i.path,
                    label: i.name,
                    icon: i.icon,
                    keywords: [i.path],
                    onSelect: () => router.push(normalize(i.path)),
                }))
        }
        return [
            { heading: "Navigation", items: build(primary) },
            { heading: secondaryLabel, items: build(secondary) },
        ].filter(g => g.items.length > 0)
    }, [primary, secondary, secondaryLabel, router])

    const renderNavItem = (item: AppSidebarNavItem, depth = 0, collapsed = isCollapsed) => {
        const hasChildren = !!item.children?.length
        const isActive = isPathActive(item.path, hasChildren)
        const isExpanded = expandedItems.includes(item.path)
        const Icon = item.icon
        const href = normalize(item.path)

        if (hasChildren) {
            if (collapsed) {
                return (
                    <Popover key={item.path} open={openPopoverId === item.path} onOpenChange={(o) => setOpenPopoverId(o ? item.path : null)}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center justify-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                                    isActive
                                        ? "bg-neutral-100 dark:bg-neutral-900 text-foreground dark:text-neutral-100"
                                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                )}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" sideOffset={12} className="w-52 p-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg rounded-xl">
                            <p className="px-2 pb-1.5 pt-0.5 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-500 select-none">{item.name}</p>
                            <div className="space-y-0.5">
                                <Link href={href} onClick={() => setOpenPopoverId(null)} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors", pathname === basePath(item.path) ? "bg-black text-white dark:bg-white dark:text-black" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800")}>
                                    <Icon className="h-4 w-4 flex-shrink-0" /><span>Overview</span>
                                </Link>
                                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                                {item.children?.map(child => {
                                    const ChildIcon = child.icon
                                    const childActive = isPathActive(child.path, false)
                                    return (
                                        <Link key={child.path} href={normalize(child.path)} onClick={() => setOpenPopoverId(null)} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors", childActive ? "bg-black text-white dark:bg-white dark:text-black" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800")}>
                                            <ChildIcon className="h-4 w-4 shrink-0" /><span>{child.name}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                )
            }
            return (
                <div key={item.path} className="space-y-1">
                    <div className={cn("flex items-center w-full rounded-lg text-sm font-medium transition-all", isActive ? "bg-neutral-100 dark:bg-neutral-900 text-foreground dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400")}>
                        <Link ref={isActive ? activeItemRef : undefined} href={href} onClick={() => { if (!isExpanded) toggleExpanded(item.path) }} className={cn("flex flex-1 min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-pointer", !isActive && "hover:text-foreground dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800")}>
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{item.name}</span>
                            {item.isImportant && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-neutral-900" />}
                        </Link>
                        <button type="button" aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpanded(item.path) }} className="cursor-pointer mr-1.5 flex items-center justify-center rounded-md p-1 text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-foreground dark:hover:text-white">
                            <ChevronDown className={cn("h-4 w-4 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                        </button>
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-l border-neutral-200 dark:border-neutral-800 ml-[22px] pl-3.5 space-y-1">
                                {item.children?.map(child => renderNavItem(child, depth + 1, collapsed))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )
        }

        const linkContent = (
            <Link
                key={item.path}
                ref={isActive ? activeItemRef : undefined}
                href={item.comingSoon ? "#" : href}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                    depth > 0 && "text-sm px-2.5 py-2",
                    isActive
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-foreground dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    collapsed && "justify-center px-3",
                )}
            >
                <Icon className={cn("flex-shrink-0", depth > 0 ? "h-4 w-4" : "h-5 w-5")} />
                {!collapsed && <span className="whitespace-nowrap overflow-hidden flex-1">{item.name}</span>}
                {!collapsed && item.comingSoon && <span className="ml-auto shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 text-xs font-bold text-neutral-500">Soon</span>}
                {!collapsed && item.badge != null && !item.comingSoon && (
                    <span className={cn("ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums", isActive ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200")}>{item.badge}</span>
                )}
                {!collapsed && item.isImportant && <AlertCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-neutral-900" />}
            </Link>
        )

        return collapsed ? (
            <Tooltip key={item.path}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800 dark:border-neutral-200">{item.name}</TooltipContent>
            </Tooltip>
        ) : linkContent
    }

    // Derived notification views: split by read state, filter by type/module, sort.
    const notifItems = React.useMemo(() => notifications?.items ?? [], [notifications?.items])
    const readCount = notifItems.filter(n => n.read).length
    const openUnread = notifItems.length - readCount
    const visibleNotifs = React.useMemo(() => {
        const byTab = notifItems.filter(n => (notifTab === "unread" ? !n.read : n.read))
        const byType = notifType === "ALL"
            ? byTab
            : byTab.filter(n => (n.type ?? "INFO") === notifType)
        return [...byType].sort((a, b) => {
            const ta = new Date(a.createdAt).getTime()
            const tb = new Date(b.createdAt).getTime()
            return notifSort === "recent" ? tb - ta : ta - tb
        })
    }, [notifItems, notifTab, notifType, notifSort])

    // Which types actually appear, so the filter only offers real modules.
    const availableTypes = React.useMemo(() => {
        const set = new Set<string>()
        notifItems.forEach(n => set.add(String(n.type ?? "INFO")))
        return NOTIF_TYPES.filter(t => set.has(t.value))
    }, [notifItems])

    const activeTypeMeta = notifType === "ALL"
        ? null
        : NOTIF_TYPES.find(t => t.value === notifType) ?? null

    const brandTile = brand.logo ?? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold">
            {brand.name?.[0]?.toUpperCase() ?? "B"}
        </div>
    )

    const renderContent = (collapsed = isCollapsed) => (
        <>
            {/* Header: brand + collapse toggle
                Collapsed puts the two side by side, not stacked. It used to be
                `flex-col`, which pushed the toggle under the mark and made the header
                twice as tall as every other collapsed row. Side by side fits: the rail is
                90px, `px-2` leaves 74, and 32 + 4 + 32 = 68. It does NOT fit at the `px-3`
                this used to carry, which is presumably why it was stacked. */}
            <div className={cn("shrink-0 border-b border-neutral-200 dark:border-neutral-800", collapsed ? "flex items-center justify-center gap-1 px-2 py-3" : "flex items-center gap-2 px-4 py-4 pr-3")}>
                <Link href={brand.homeHref ?? "/home"} className={cn("flex min-w-0 items-center gap-2.5", !collapsed && "flex-1")}>
                    {brandTile}
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground dark:text-white leading-tight">{brand.name}</p>
                            {/* Was `text-neutral-600 dark:text-neutral-500`, which measured
                                2.50:1 on white and 4.18:1 on neutral-950 - failing the 4.5:1
                                body floor in BOTH themes, not just the dark one Niraj spotted.
                                This pair is 4.74:1 and 7.85:1. */}
                            {brand.subtitle && <p className="truncate text-xs font-mono text-neutral-500 dark:text-neutral-400">{brand.subtitle}</p>}
                        </div>
                    )}
                </Link>
                <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 lg:inline-flex">
                    {isCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
                </button>
            </div>

            {/* Back link - a module-sidebar takeover, not a nav destination.
                Its own bordered block rather than a `primary` item so it
                reads as an exit, matching apps/main's JobsSidebar. */}
            {backLink && (
                <div className={cn("shrink-0 border-b border-neutral-200 dark:border-neutral-800", collapsed ? "flex justify-center px-2 py-2.5" : "px-3 py-2.5")}>
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={normalize(backLink.href)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">{backLink.label}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Link href={normalize(backLink.href)} className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800">
                            <ArrowLeft className="h-4 w-4" />
                            <span>{backLink.label}</span>
                        </Link>
                    )}
                </div>
            )}

            {/* Search → command palette */}
            <div className={cn("shrink-0 border-b border-neutral-200 dark:border-neutral-800", collapsed ? "flex justify-center px-2 py-2.5" : "px-3 py-2.5")}>
                <SidebarSearchButton collapsed={collapsed} onClick={() => setCmdOpen(true)} />
            </div>

            {/* Scrollable nav */}
            <ScrollArea className="flex-1 min-h-0 [&_[data-radix-scroll-area-viewport]>div]:block!">
                <nav className="px-3 py-4 space-y-1">
                    {primary.map(item => renderNavItem(item, 0, collapsed))}

                    {secondary.length > 0 && (
                        <>
                            <div className="pt-4 pb-1">
                                {!collapsed ? (
                                    <button type="button" onClick={() => setSecondaryExpanded(v => !v)} className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                        <p className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">{secondaryLabel}</p>
                                        <ChevronDown className={cn("h-3 w-3 text-neutral-600 dark:text-neutral-500 transition-transform duration-200", secondaryExpanded && "rotate-180")} />
                                    </button>
                                ) : (
                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-2" />
                                )}
                            </div>
                            <AnimatePresence initial={false}>
                                {(secondaryExpanded || collapsed) && (
                                    <motion.div key="secondary" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden space-y-1">
                                        {secondary.map(item => renderNavItem(item, 0, collapsed))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </nav>
            </ScrollArea>

            {/* Bottom bar */}
            <div className="mt-auto shrink-0 border-t border-neutral-200 dark:border-neutral-800">
                {!collapsed && footerExtra && (
                    <div className="border-b border-neutral-200 dark:border-neutral-800 px-3 py-2.5">{footerExtra}</div>
                )}
                {collapsed && footerExtraCollapsed && (
                    <div className="flex flex-col items-center gap-1 border-b border-neutral-200 py-2 dark:border-neutral-800">{footerExtraCollapsed}</div>
                )}

                {/* Theme + notifications */}
                <div className={cn("border-b border-neutral-200 dark:border-neutral-800", collapsed ? "flex flex-col items-center gap-1 py-2" : "flex items-center justify-between gap-2 px-3 py-2")}>
                    <div className={cn(collapsed && "flex h-9 w-9 items-center justify-center")}>
                        <ThemeToggle className={cn(collapsed && "scale-75 origin-center")} />
                    </div>
                    {notifications && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" onClick={() => { setNotifOpen(true); notifications.onOpen?.() }} className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                    <Bell className="h-4 w-4" />
                                    {notifications.unreadCount > 0 && (
                                        <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}</span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side={collapsed ? "right" : "top"} className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">Notifications{notifications.unreadCount > 0 ? ` (${notifications.unreadCount})` : ""}</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Profile */}
                {isPending ? (
                    <div className={cn("px-3 py-2", collapsed && "flex justify-center")}>
                        <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed ? "w-12" : "w-full")}>
                            <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                            {!collapsed && <div className="flex-1 space-y-1.5 min-w-0"><div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" /><div className="h-2.5 w-16 rounded bg-neutral-100 dark:bg-neutral-800/60 animate-pulse" /></div>}
                        </div>
                    </div>
                ) : user ? (
                    collapsed ? (
                        <div className="flex flex-col items-center gap-1 py-2 px-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={profileHref} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <Avatar user={user} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">{user.name || "Profile"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" onClick={onSignOut} aria-label="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors cursor-pointer"><LogOut className="h-4 w-4" /></button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">Sign out</TooltipContent>
                            </Tooltip>
                        </div>
                    ) : profileLinks.length > 1 ? (
                        // Multiple destinations - a popover disambiguates. See the
                        // single/zero-link branch below for why one or none does not.
                        <Popover open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
                            <div className="flex items-center gap-1 px-3 py-2">
                                <PopoverTrigger asChild>
                                    <button type="button" className="flex flex-1 items-center gap-3 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-w-0 cursor-pointer">
                                        <Avatar user={user} />
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-bold truncate text-foreground dark:text-white">{user.name || "User"}</p>
                                            {user.role && <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono capitalize">{user.role}</p>}
                                        </div>
                                        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
                                    </button>
                                </PopoverTrigger>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" onClick={onSignOut} aria-label="Sign out" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors cursor-pointer"><LogOut className="h-4 w-4" /></button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">Sign out</TooltipContent>
                                </Tooltip>
                            </div>
                            <PopoverContent side="top" align="start" className="w-52 p-1.5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg">
                                {profileLinks.map((l) => l.href ? (
                                    <Link key={l.label} href={l.href} onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        {l.icon && <l.icon className="h-4 w-4" />}<span>{l.label}</span>
                                    </Link>
                                ) : (
                                    <button key={l.label} type="button" onClick={() => { l.onClick?.(); setProfileMenuOpen(false) }} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        {l.icon && <l.icon className="h-4 w-4" />}<span>{l.label}</span>
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    ) : (
                        // Zero or one profile link: a popover whose only job is "go to
                        // profile" is a click that does nothing extra - it just delays the
                        // navigation the row already implies. Go there directly, same as the
                        // collapsed rail does above. Zero links (hiring/uni pass none today)
                        // falls back to `profileHref` so the row is never a dead click.
                        <div className="flex items-center gap-1 px-3 py-2">
                            <Link href={profileLinks[0]?.href ?? profileHref} className="flex flex-1 items-center gap-3 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-w-0">
                                <Avatar user={user} />
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-bold truncate text-foreground dark:text-white">{user.name || "User"}</p>
                                    {user.role && <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono capitalize">{user.role}</p>}
                                </div>
                            </Link>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" onClick={onSignOut} aria-label="Sign out" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors cursor-pointer"><LogOut className="h-4 w-4" /></button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">Sign out</TooltipContent>
                            </Tooltip>
                        </div>
                    )
                ) : (
                    <div className="px-3 py-2">
                        <Link href="/signin" className={cn("flex w-full items-center rounded-lg p-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white", collapsed && "justify-center")}>
                            <LogOut className="h-5 w-5" />{!collapsed && <span className="ml-3">Sign In</span>}
                        </Link>
                    </div>
                )}
            </div>
        </>
    )

    return (
        <TooltipProvider delayDuration={0}>
            {/* Bottom bar, where the app asked for one. See the `bottomNav` prop. */}
            {bottomNav && (
                <MobileBottomNav
                    linkComponent={Link}
                    items={bottomNav.items}
                    centreAction={bottomNav.centreAction}
                    onMore={() => setIsMobileOpen(true)}
                    moreActive={isMobileOpen}
                />
            )}

            {/* Mobile hamburger, only where there is no bottom bar. Hidden while the
                sheet is open: the sheet covers this corner, so the button is a target
                nothing can reach, and the sheet's own dismiss is the control at that
                point. */}
            {!bottomNav && !isMobileOpen && (
                <button onClick={() => setIsMobileOpen(true)} className="fixed top-3 right-3 z-50 lg:hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-foreground dark:text-white p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-lg cursor-pointer" aria-label="Open sidebar">
                    <Menu className="h-5 w-5" />
                </button>
            )}

            {/* Desktop sidebar - floating rounded card */}
            <aside data-sidebar className={cn(
                "fixed top-2 left-2 z-40 flex h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950",
                "hidden lg:flex",
                isCollapsed ? "lg:w-[90px]" : "lg:w-64",
            )}>
                {renderContent()}
            </aside>

            {/* Mobile sidebar sheet */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="w-full sm:max-w-sm border-neutral-200 bg-white p-0 dark:border-neutral-800 dark:bg-neutral-950">
                    <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
                    <div className="flex h-full flex-col">{renderContent(false)}</div>
                </SheetContent>
            </Sheet>

            {/* Notifications sheet */}
            {notifications && (
                <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
                    <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-lg border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <SheetHeader className="shrink-0 space-y-0 px-6 pt-5 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <SheetTitle className="text-lg font-bold tracking-tight text-foreground dark:text-white">My Notifications</SheetTitle>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Notifications sent to this inbox can be viewed for up to 30 days.</p>
                                </div>
                                <button type="button" onClick={() => setNotifOpen(false)} aria-label="Close" className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
                            </div>

                            {/* Controls: unread/read tabs + module filter + sort */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-900 p-0.5">
                                    {([["unread", "Unread", openUnread], ["read", "Read", readCount]] as const).map(([key, label, cnt]) => (
                                        <button key={key} type="button" onClick={() => setNotifTab(key)} className={cn(
                                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                                            notifTab === key ? "bg-white dark:bg-neutral-800 text-foreground dark:text-white shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-foreground dark:hover:text-white",
                                        )}>
                                            {label}
                                            {cnt > 0 && <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold tabular-nums", notifTab === key ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300")}>{cnt}</span>}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Module / type filter */}
                                    <Popover open={notifFilterOpen} onOpenChange={setNotifFilterOpen}>
                                        <PopoverTrigger asChild>
                                            <button type="button" className={cn(
                                                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                                                notifType === "ALL"
                                                    ? "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                    : "border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 bg-neutral-900/5",
                                            )}>
                                                <ListFilter className="h-3.5 w-3.5" />
                                                <span>{activeTypeMeta ? activeTypeMeta.label : "All modules"}</span>
                                                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent align="end" sideOffset={8} className="w-48 p-1.5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg">
                                            <p className="px-2 pb-1 pt-0.5 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">Filter by module</p>
                                            <button type="button" onClick={() => { setNotifType("ALL"); setNotifFilterOpen(false) }} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                <span className="flex items-center gap-2"><Inbox className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />All modules</span>
                                                {notifType === "ALL" && <Check className="h-4 w-4 text-neutral-900" />}
                                            </button>
                                            {(availableTypes.length ? availableTypes : NOTIF_TYPES).map(t => {
                                                const Icon = t.icon
                                                return (
                                                    <button key={t.value} type="button" onClick={() => { setNotifType(t.value); setNotifFilterOpen(false) }} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                        <span className="flex items-center gap-2"><span className={cn("flex h-5 w-5 items-center justify-center rounded", t.tint)}><Icon className="h-3.5 w-3.5" /></span>{t.label}</span>
                                                        {notifType === t.value && <Check className="h-4 w-4 text-neutral-900" />}
                                                    </button>
                                                )
                                            })}
                                        </PopoverContent>
                                    </Popover>

                                    {/* Sort toggle */}
                                    <button type="button" onClick={() => setNotifSort(s => (s === "recent" ? "oldest" : "recent"))} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 px-2.5 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                        <ArrowDownUp className="h-3.5 w-3.5" />
                                        <span>{notifSort === "recent" ? "Most recent" : "Oldest"}</span>
                                    </button>
                                </div>
                            </div>

                            {notifTab === "unread" && openUnread > 0 && notifications.onMarkAllRead && (
                                <div className="mt-2 flex justify-end">
                                    <button type="button" onClick={notifications.onMarkAllRead} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-foreground dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"><CheckCheck className="h-3.5 w-3.5" />Mark all as read</button>
                                </div>
                            )}
                        </SheetHeader>

                        <ScrollArea className="flex-1 min-h-0">
                            {notifications.loading ? (
                                <div className="flex flex-col gap-3 p-6">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex gap-3 animate-pulse"><div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" /><div className="flex-1 space-y-2 pt-1"><div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" /><div className="h-2.5 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800/60" /></div></div>))}</div>
                            ) : visibleNotifs.length === 0 ? (
                                <NotificationEmptyState tab={notifTab} filtered={notifType !== "ALL"} />
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {visibleNotifs.map(n => {
                                        const meta = notifTypeMeta(n.type)
                                        const Icon = meta.icon
                                        return (
                                            <button key={n.id} type="button" onClick={() => notifications.onItemClick?.(n)} className={cn("w-full flex items-start gap-3.5 px-6 py-4 text-left transition-colors cursor-pointer", n.read ? "hover:bg-neutral-50 dark:hover:bg-neutral-900" : "bg-neutral-900/[0.04] dark:bg-neutral-200/[0.06] hover:bg-neutral-900/[0.08]")}>
                                                <div className="relative shrink-0 mt-0.5">
                                                    {n.sender?.image || n.sender?.name ? (
                                                        <Avatar user={{ name: n.sender?.name, image: n.sender?.image }} size={38} />
                                                    ) : (
                                                        <span className={cn("flex h-[38px] w-[38px] items-center justify-center rounded-full", meta.tint)}><Icon className="h-[18px] w-[18px]" /></span>
                                                    )}
                                                    {(n.sender?.image || n.sender?.name) && (
                                                        <span className={cn("absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-neutral-950", meta.tint)}><Icon className="h-2.5 w-2.5" /></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn("text-sm leading-snug", n.read ? "font-medium text-neutral-700 dark:text-neutral-300" : "font-semibold text-foreground dark:text-white")}>{n.title}</p>
                                                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />}
                                                    </div>
                                                    {n.description && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{n.description}</p>}
                                                    <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-500">{timeAgo(n.createdAt)}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                        {notifications.viewAllHref && (
                            <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-6 py-3">
                                <Link href={notifications.viewAllHref} onClick={() => setNotifOpen(false)} className="text-sm font-medium text-neutral-500 hover:text-foreground dark:text-neutral-400 dark:hover:text-white transition-colors">View all notifications</Link>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            )}

            <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} groups={commandGroups} />
        </TooltipProvider>
    )
}

// Animated "nothing here" state - a bell resting inside expanding sonar rings
// with a few sparks drifting up. Warm/neutral palette, motion via framer-motion.
function NotificationEmptyState({ tab, filtered }: { tab: "unread" | "read"; filtered: boolean }) {
    const copy = filtered
        ? { title: "Nothing to see here", sub: "No notifications match this filter yet." }
        : tab === "read"
            ? { title: "No read notifications", sub: "Notifications you open will move here." }
            : { title: "You're all caught up", sub: "We'll ping you the moment something happens." }

    return (
        <div className="flex flex-col items-center justify-center gap-5 px-8 py-20 text-center">
            <div className="relative flex h-40 w-40 items-center justify-center">
                {/* Expanding sonar rings */}
                {[0, 1, 2].map(i => (
                    <motion.span
                        key={i}
                        className="absolute rounded-full border border-neutral-800/40 dark:border-neutral-200/30"
                        initial={{ width: 56, height: 56, opacity: 0 }}
                        animate={{ width: 156, height: 156, opacity: [0, 0.6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
                    />
                ))}

                {/* Soft breathing halo */}
                <motion.span
                    className="absolute h-24 w-24 rounded-full bg-neutral-900/10 blur-xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Drifting sparks */}
                {[
                    { x: -26, d: 0.2, s: 5 },
                    { x: 4, d: 1.1, s: 7 },
                    { x: 28, d: 1.9, s: 4 },
                ].map((p, i) => (
                    <motion.span
                        key={`spark-${i}`}
                        className="absolute rounded-full bg-neutral-800"
                        style={{ width: p.s, height: p.s, left: `calc(50% + ${p.x}px)` }}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: [-4, -46], opacity: [0, 1, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, delay: p.d, ease: "easeOut" }}
                    />
                ))}

                {/* Bell tile - gentle pendulum swing */}
                <motion.div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    style={{ transformOrigin: "top center" }}
                    animate={{ rotate: [0, -9, 9, -6, 6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                >
                    <Bell className="h-7 w-7 text-neutral-900" />
                    {/* Bell clapper dot */}
                    <motion.span
                        className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-neutral-900"
                        animate={{ x: [0, -3, 3, -2, 2, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                    />
                </motion.div>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground dark:text-white">{copy.title}</p>
                <p className="max-w-[240px] text-sm text-neutral-500 dark:text-neutral-400">{copy.sub}</p>
            </div>
        </div>
    )
}

function Avatar({ user, size = 32 }: { user: { name?: string | null; image?: string | null }; size?: number }) {
    if (user.image) {
        return <Image src={user.image} alt={user.name || "Profile"} width={size} height={size} className="rounded-full border border-neutral-200 dark:border-neutral-800" style={{ height: size, width: size }} />
    }
    return (
        <div className="rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center border border-neutral-200 dark:border-neutral-800" style={{ height: size, width: size }}>
            <span className="text-white dark:text-black text-sm font-bold">{user.name?.[0]?.toUpperCase() || "U"}</span>
        </div>
    )
}

export default AppSidebar
