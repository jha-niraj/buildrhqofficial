'use client'

import React from 'react'
import Script from 'next/script'
import Sidebar from '@/components/common/mainsidebar'
import { jobsNavigation } from '@/lib/navigation'
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
            {/* The SAME sidebar the rest of the app uses, with a different set of
                links. What stood here was `jobssidebar.tsx`, a 319-line copy with its
                own brand block, collapse control, theme toggle and user footer - all
                of which looked subtly unlike the real one, because a copy always
                does. Niraj: "the content only needs to change not the full side."
                See JB-8. */}
            <Sidebar primary={jobsNavigation} />
            {/* The offsets MATCH `app/(main)/layout.tsx`, and that is the whole point.
                They were `lg:ml-[70px]` / `lg:ml-[240px]`, measured against the
                deleted `jobssidebar.tsx`. The shared `AppSidebar` is wider - 106px
                collapsed, 17rem open - so after JB-8 swapped the component in, the
                shell reserved 36px and 32px too little and the sidebar sat ON TOP of
                the job list. That is the overlap in Niraj's screenshot: not a new
                bug, an old number that stopped being true.
                Any change to the sidebar's width has to change both shells. */}
            <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-neutral-100 transition-colors duration-300 dark:bg-black">
                <main className={cn(
                    "relative h-full transition-all duration-300 ease-in-out",
                    "ml-0",
                    isCollapsed ? "lg:ml-[106px]" : "lg:ml-[17rem]",
                )}>
                    <div className="relative h-full w-full border-neutral-200 bg-white shadow-xl lg:rounded-l-3xl lg:border-l dark:border-neutral-800 dark:bg-neutral-950">
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