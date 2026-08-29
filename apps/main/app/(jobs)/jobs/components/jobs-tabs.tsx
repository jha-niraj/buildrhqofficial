"use client"
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Sparkles, UserCheck, Bookmark, FileText, LayoutList,
    ChevronDown, Check
} from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@repo/ui/components/ui/dropdown-menu"
import { cn } from "@repo/ui/lib/utils"

export interface TabCounts {
    spark: number
    following: number
    saved: number
    applied: number
    browse: number
}

interface JobsTabsProps {
    counts: TabCounts
    isAuthenticated: boolean
}

interface TabConfig {
    id: string
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    countKey: keyof TabCounts
    requiresAuth: boolean
}

// NO `color` field, deliberately.
//
// Every tab carried `color: "text-neutral-900"` with no `dark:` pair, applied to
// the icon ONLY when the tab was active. So in dark mode the active tab's icon
// became near-black on a `neutral-800` pill and vanished - while its label stayed
// white, because the label inherits the link's own colour, which IS paired. That
// is the screenshot: "Saved" readable, its bookmark invisible.
//
// This is the same defect as the pathfinder stat tiles: a colour written in a
// DATA ARRAY rather than in a `className`, so every repo-wide contrast sweep
// that greps `className=` walks straight past it. A colour is a colour wherever
// it is written down.
//
// The icon now inherits from the link, which already handles active, inactive,
// light and dark correctly - and it was the only thing `color` was ever used for.

const tabs: TabConfig[] = [
    {
        id: "spark",
        label: "Spark",
        href: "/jobs",
        icon: Sparkles,
        countKey: "spark",
        requiresAuth: false
    },
    {
        id: "following",
        label: "Following",
        href: "/jobs/following",
        icon: UserCheck,
        countKey: "following",
        requiresAuth: true
    },
    {
        id: "saved",
        label: "Saved",
        href: "/jobs/saved",
        icon: Bookmark,
        countKey: "saved",
        requiresAuth: true
    },
    {
        id: "applied",
        label: "Applied",
        href: "/jobs/applications",
        icon: FileText,
        countKey: "applied",
        requiresAuth: true
    },
    {
        id: "browse",
        label: "Browse All",
        href: "/jobs/browse",
        icon: LayoutList,
        countKey: "browse",
        requiresAuth: false
    }
]

export function JobsTabs({ counts, isAuthenticated }: JobsTabsProps) {
    const pathname = usePathname()
    const router = useRouter()

    // Determine active tab from pathname
    const getActiveTab = () => {
        if (pathname === "/jobs" || pathname === "/jobs/spark") return "spark"
        if (pathname.startsWith("/jobs/following")) return "following"
        if (pathname.startsWith("/jobs/saved")) return "saved"
        if (pathname.startsWith("/jobs/applications")) return "applied"
        if (pathname.startsWith("/jobs/browse")) return "browse"
        return "spark"
    }

    const activeTab = getActiveTab()
    const activeTabConfig = tabs.find(t => t.id === activeTab) ?? tabs[0]!

    return (
        <>
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    const count = counts[tab.countKey]
                    const showCount = count > 0 && (isAuthenticated || !tab.requiresAuth)

                    return (
                        <Link href={tab.href} key={tab.id} className={cn(
                                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                isActive
                                    ? "text-neutral-900 dark:text-white"
                                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-white dark:text-neutral-400"
                            )}>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                                {showCount && (
                                    <Badge 
                                        variant="secondary" 
                                        className={cn(
                                            "text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center",
                                            isActive && "bg-neutral-200 dark:bg-neutral-700"
                                        )}
                                    >
                                        {count > 99 ? "99+" : count}
                                    </Badge>
                                )}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden w-full">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="w-full justify-between rounded-xl h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                        >
                            <span className="flex items-center gap-2">
                                <activeTabConfig.icon className="h-4 w-4" />
                                <span className="font-medium">{activeTabConfig.label}</span>
                                {counts[activeTabConfig.countKey] > 0 && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                        {counts[activeTabConfig.countKey]}
                                    </Badge>
                                )}
                            </span>
                            <ChevronDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="start" 
                        className="w-[calc(100vw-2rem)] max-w-md"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            const count = counts[tab.countKey]
                            const showCount = count > 0 && (isAuthenticated || !tab.requiresAuth)

                            return (
                                <DropdownMenuItem
                                    key={tab.id}
                                    onClick={() => router.push(tab.href)}
                                    className={cn(
                                        "flex items-center justify-between py-3 cursor-pointer",
                                        isActive && "bg-neutral-100 dark:bg-neutral-800"
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="h-5 w-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {showCount && (
                                            <Badge variant="secondary" className="text-xs">
                                                {count}
                                            </Badge>
                                        )}
                                        {isActive && (
                                            <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                        )}
                                    </span>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}
