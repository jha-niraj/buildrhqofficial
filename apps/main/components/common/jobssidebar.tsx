"use client"

import React, { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "@repo/auth/client"
import Link from "next/link"
import Image from "next/image"
import toast from "@repo/ui/components/ui/sonner"
import {
    LogOut, User, ChevronLeft, ChevronRight,
    Sun, Moon, ArrowLeft, Briefcase
} from "lucide-react"
import {
    TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from "@repo/ui/components/ui/tooltip"
import { cn } from "@repo/ui/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { useTheme } from "@repo/ui/components/themeprovider"
import { jobsNavigation, NavigationItem } from "@/lib/jobs-navigation"
import { useSidebar } from "./sidebarprovider"

function JobsSidebarContent() {
    const { isCollapsed, setIsCollapsed } = useSidebar()
    const { data: session } = useSession()
    const { theme, setTheme } = useTheme()
    // next-themes cannot know the real theme until it has read localStorage, so
    // `theme` is undefined on the server and resolved on the client. Branching on
    // it directly in the markup below made the server emit one icon and the
    // client the other - a hydration mismatch React recovers from by discarding
    // and re-rendering this subtree, on every /jobs load. Same fix as
    // @repo/ui's ThemeToggle.
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const isDark = mounted && theme === "dark"
    const pathname = usePathname()
    const router = useRouter()
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleProfileMouseEnter = () => {
        if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current)
        setProfileDropdownOpen(true)
    }

    const handleProfileMouseLeave = () => {
        profileTimeoutRef.current = setTimeout(() => {
            setProfileDropdownOpen(false)
        }, 200)
    }

    const handleLogout = async () => {
        try {
            await signOut()
            toast.success("Logged out successfully")
            router.push("/")
        } catch {
            toast.error("Failed to logout")
        }
    }

    const isActive = (path: string) => {
        if (path === "jobs" && pathname === "/jobs") return true
        if (path === "companies" && pathname === "/companies") return true
        return pathname.startsWith(`/${path}`) && path !== "jobs" && path !== "companies"
    }

    const renderNavItem = (item: NavigationItem, _isSecondary = false) => {
        const Icon = item.icon
        const active = isActive(item.path)

        if (isCollapsed) {
            return (
                <TooltipProvider key={item.path} delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`/${item.path}`}
                                className={cn(
                                    "flex items-center justify-center p-2.5 rounded-xl transition-all duration-200",
                                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                    active && "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
                                    item.comingSoon && "opacity-50 pointer-events-none"
                                )}
                            >
                                <Icon className={cn(
                                    "w-5 h-5",
                                    active ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
                                )} />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-800">
                            <p>{item.name}</p>
                            {item.comingSoon && <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-1">(Coming Soon)</span>}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        return (
            <Link
                key={item.path}
                href={item.comingSoon ? "#" : `/${item.path}`}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    active && "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
                    item.comingSoon && "opacity-50 pointer-events-none"
                )}
            >
                <Icon className={cn(
                    "w-5 h-5",
                    active ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
                )} />
                <span className={cn(
                    "text-sm font-medium",
                    active ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"
                )}>
                    {item.name}
                </span>
                {item.comingSoon && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                        Soon
                    </span>
                )}
                {item.badge && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/30 text-neutral-800 dark:text-neutral-100 font-medium">
                        {item.badge}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <aside data-sidebar
            className={cn(
                "fixed top-0 left-0 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-50",
                "transition-all duration-300 ease-in-out",
                "hidden lg:flex lg:flex-col",
                isCollapsed ? "w-[70px]" : "w-[240px]"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-white">Jobs</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center mx-auto">
                        <Briefcase className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            {/* Back to Main */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                <Link
                    href="/home"
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                        "bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800",
                        "text-neutral-600 dark:text-neutral-400",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    {!isCollapsed && <span className="text-sm font-medium">Back to Main</span>}
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                {/* Jobs Section */}
                <div className="space-y-1 mb-6">
                    {!isCollapsed && (
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 px-3 mb-2">
                            Jobs
                        </p>
                    )}
                    {jobsNavigation.primary.map(item => renderNavItem(item))}
                </div>

                {/* Companies Section */}
                <div className="space-y-1">
                    {!isCollapsed && (
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 px-3 mb-2">
                            Companies
                        </p>
                    )}
                    {jobsNavigation.secondary.map(item => renderNavItem(item, true))}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl w-full",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    {isDark ? (
                        <Sun className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    ) : (
                        <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    )}
                    {!isCollapsed && (
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {isDark ? "Light Mode" : "Dark Mode"}
                        </span>
                    )}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl w-full mt-1",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    )}
                    {!isCollapsed && (
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Collapse</span>
                    )}
                </button>

                {/* Profile Section */}
                {session?.user && (
                    <div
                        className="relative mt-3"
                        onMouseEnter={handleProfileMouseEnter}
                        onMouseLeave={handleProfileMouseLeave}
                    >
                        <div className={cn(
                            "flex items-center gap-3 p-2 rounded-xl cursor-pointer",
                            "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all",
                            isCollapsed && "justify-center"
                        )}>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                                {session.user.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="Profile"
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                        {session.user.name || "User"}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        {session.user.email}
                                    </p>
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {profileDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={cn(
                                        "absolute bottom-full left-0 right-0 mb-2 p-2",
                                        "bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800"
                                    )}
                                >
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                                    >
                                        <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Profile</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg w-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        <LogOut className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-500">Logout</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default function JobsSidebar() {
    return <JobsSidebarContent />
}
