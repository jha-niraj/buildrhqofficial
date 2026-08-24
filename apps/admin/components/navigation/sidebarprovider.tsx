"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { AdminPermissions } from "@/lib/navigation"

interface SidebarContextType {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
    /** Set once, server-side, by app/(console)/layout.tsx - never fetched
     *  client-side, so the nav a team member sees can never race ahead of the
     *  permission check that already ran on the server. */
    adminRole: string
    permissions: AdminPermissions
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
    children,
    adminRole,
    permissions,
}: {
    children: React.ReactNode
    adminRole: string
    permissions: AdminPermissions
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("admin-sidebar-collapsed")
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved))
        }
    }, [])

    // Save collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(isCollapsed))
    }, [isCollapsed])

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                setIsCollapsed,
                isMobileOpen,
                setIsMobileOpen,
                adminRole,
                permissions,
            }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}



