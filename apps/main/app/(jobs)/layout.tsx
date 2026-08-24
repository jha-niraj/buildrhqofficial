'use client'

import React from 'react'
import Script from 'next/script'
import JobsSidebar from '@/components/common/jobssidebar'
import {
    useSidebar, SidebarProvider
} from '@/components/common/sidebarprovider'
import { 
    WifiOff, RotateCcw 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { cn } from '@repo/ui/lib/utils'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'

interface LayoutProps {
    children: React.ReactNode
}

const JobsContent = ({ children }: { children: React.ReactNode }) => {
    const { isCollapsed } = useSidebar()

    return (
        <>
            <JobsSidebar />
            <div className="flex flex-col flex-1 h-dvh overflow-hidden bg-neutral-100 dark:bg-black transition-colors duration-300">
                <main className={cn(
                    "h-full relative transition-all duration-300 ease-in-out",
                    "ml-0",
                    isCollapsed ? "lg:ml-[70px]" : "lg:ml-[240px]"
                )}>
                    <div className="h-full w-full bg-white dark:bg-neutral-950 lg:rounded-l-3xl lg:border-l border-neutral-200 dark:border-neutral-800 shadow-xl relative">
                        {/* `reflow` pins this to vertical-only, same as the (main) shell's
                            ScrollArea - without it Radix's shrink-to-fit content box sizes
                            to a wide descendant (a table, a chart) and the page silently
                            scrolls sideways under this card's rounded corner instead of the
                            descendant scrolling on its own. See docs/responsiveness.md
                            section 2. */}
                        <ScrollArea className="h-full min-w-0 w-full" reflow>
                            {children}
                        </ScrollArea>
                    </div>
                </main>
            </div>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
            />
        </>
    )
}

const JobsLayout = ({ children }: LayoutProps) => {
    const isOnline = useNetworkStatus()

    if (!isOnline) return <OfflineFallback />

    return (
        <SidebarProvider>
            <div className="flex h-dvh bg-neutral-100 dark:bg-black overflow-hidden">
                <JobsContent>{children}</JobsContent>
            </div>
        </SidebarProvider>
    )
}

const OfflineFallback = () => {
    const handleRefresh = () => window.location.reload()

    return (
        <div className="h-dvh flex items-center justify-center bg-background px-4 overflow-hidden">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center text-center max-w-md"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="mb-6"
                    >
                        <WifiOff className="w-16 h-16 text-muted-foreground" />
                    </motion.div>
                    <h2 className="text-2xl font-semibold mb-2 text-foreground">You&apos;re Offline</h2>
                    <p className="text-muted-foreground mb-6">
                        It looks like you&apos;ve lost your internet connection. Please check your network settings and try again.
                    </p>
                    <motion.button
                        onClick={handleRefresh}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default JobsLayout;