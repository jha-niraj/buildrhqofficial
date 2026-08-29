'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from "next/navigation";
import Sidebar from '@/components/common/mainsidebar';
import {
    useSidebar, SidebarProvider
} from '@/components/common/sidebarprovider';
import {
    WifiOff, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@repo/ui/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@repo/ui/components/ui/sheet';
import { AIPanel } from '@/components/ai/ai-panel';
import {
    useAIPanelStore, AI_MIN_WIDTH, AI_MAX_WIDTH, clampPanelWidth,
} from '@/app/store/aiPanelStore';
import { AppBackdrop } from '@/components/common/app-backdrop';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';

interface LayoutProps {
    children: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell geometry.
//
// Three surfaces float as separate rounded cards on a neutral backdrop: the
// sidebar, the page, and the AI rail. That separation is the point of the
// rounding - you can see where one surface ends and the next begins, instead of
// three regions sharing one flat white plane.
//
// When the AI rail is open the page rounds only on its LEFT (`rounded-l-2xl`)
// and the rail only on its RIGHT, so the pair reads as one card split in two
// rather than two cards butted together with a seam between them.
// ─────────────────────────────────────────────────────────────────────────────

const MainContent = ({ children }: { children: React.ReactNode }) => {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const {
        isOpen: aiOpen, close: closeAI, width: aiWidth, setWidth: setAIWidth,
        isMaximized: aiMaximized,
    } = useAIPanelStore();
    const [isMobile, setIsMobile] = useState(false);

    // Below lg the rail would leave no page worth assisting with, so it becomes a
    // Sheet instead. On lg+ it is a real docked column - never a Sheet.
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    // Opening the rail collapses the sidebar: three full-width columns do not fit
    // on a laptop, and the nav is the one the user is least likely to be reading
    // while they type a question. Only on the OPEN transition - otherwise the
    // user could never expand the sidebar again while the rail stayed open.
    const wasAIOpen = useRef(aiOpen);
    useEffect(() => {
        if (isMobile) return;
        if (aiOpen && !wasAIOpen.current) setIsCollapsed(true);
        wasAIOpen.current = aiOpen;
    }, [aiOpen, isMobile, setIsCollapsed]);

    const isDocked = aiOpen && !isMobile;

    // ── Drag to resize ────────────────────────────────────────────────────────
    // Width is committed to the store on every move (a cheap set, and the store
    // is the single source of truth for the rail width), and the listeners live
    // on `window` so the drag survives the cursor leaving the handle.
    // ── Why the drag needs its own flag ──
    //
    // The rail's width is a framer `animate` prop with a spring on it. That is right when
    // the rail opens and closes, and wrong during a drag: every mousemove set a new target
    // and started a NEW spring toward it, so the panel chased the cursor, overshot, and
    // sprang back on its own. That is the "it goes to the side and comes again
    // automatically" - nothing was repositioning it, the spring was still settling.
    //
    // The inner content div is pinned to the target width while the aside is mid-spring, so
    // during that lag the chat was laid out wider than its own container and spilled left
    // under the page card, which is the other half of what Niraj saw.
    //
    // While `isResizing`, width is applied with no transition at all - the drag IS the
    // animation. The spring comes back the moment the pointer is released.
    const [isResizing, setIsResizing] = useState(false);

    const handleResizeStart = useCallback((startX: number, startWidth: number) => {
        setIsResizing(true);
        // The rail is docked RIGHT, so dragging left (smaller clientX) widens it.
        const onMove = (clientX: number) => setAIWidth(clampPanelWidth(startWidth + (startX - clientX)));
        const onMouseMove = (e: MouseEvent) => { e.preventDefault(); onMove(e.clientX); };
        const onTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) onMove(touch.clientX);
        };
        const stop = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stop);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', stop);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', stop);
        // Without these the drag selects page text and the cursor flickers back
        // to the default whenever it crosses a child element.
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [setAIWidth]);

    // Maximized is a reading mode, not a different layout: the rail takes most of
    // the window and the page keeps a sliver, rather than disappearing.
    const railWidth = aiMaximized ? 'min(1100px, 72vw)' : `${aiWidth}px`;

    return (
        <>
            <Sidebar />

            <div
                className={cn(
                    // `relative` is load-bearing, not cosmetic: the shell's backdrop is
                    // an absolutely positioned sibling, and a positioned element paints
                    // above a STATIC one whatever the DOM order. Without this the
                    // photograph covers the cards instead of sitting behind them.
                    "relative min-w-0 flex-1 transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-[106px]" : "lg:ml-[17rem]",
                )}
            >
                {/* The card row. `ring` rather than `border`: this element is height
                    constrained with border-box sizing, so a 1px border would eat 2px of
                    inner height that a full-height page below does not account for,
                    leaving it 2px too tall and scrolling the shell. A ring is a
                    box-shadow - same look, zero layout cost. */}
                {/* m-3, not m-2. The gutter is the only place the photograph shows now that the
                    page is opaque, and 8px of it is a hairline rather than a frame. 12px is
                    enough to read as deliberate. `--page-h` below is derived from this, so
                    the two cannot drift. */}
                {/* `--app-bottom-nav-h` is 4rem plus the safe-area inset below lg, and 0px
                    above it - see the note beside its definition in globals.css. Subtracting
                    it here is what stops the fixed bottom bar covering the last row of every
                    page, and because the token is already 0 on desktop this one expression is
                    correct at every width. */}
                <main className="m-3 flex h-[calc(100dvh-1.5rem-var(--app-bottom-nav-h))] overflow-hidden lg:ml-0">
                    {/* Page surface */}
                    <div
                        data-app-page
                        className={cn(
                            // min-w-0 so a wide child (a table, a chart) shrinks with the
                            // column instead of pushing the row past the viewport.
                            //
                            // TRANSPARENT, on purpose: the photographic backdrop is meant
                            // to read through the page, not just around it.
                            //
                            // This was briefly opaque, on contrast grounds - bare text
                            // sitting directly on the photo measured badly in the darker
                            // regions. Niraj's call, twice asked for, is that seeing the
                            // image matters more, and the reason it is safe in practice is
                            // that page CONTENT lives in cards which carry their own opaque
                            // surface (`bg-white dark:bg-neutral-900`), so the photo shows in
                            // the margins around them rather than behind any paragraph.
                            //
                            // The thing to watch when building a new page under (main):
                            // do not put small grey text directly on this surface. Put it in
                            // a card. `text-neutral-500 dark:text-neutral-400` on the bare backdrop measures around
                            // 1.3:1 over the photo's darker regions, which is unreadable.
                            //
                            // NO RING. There was a `ring-1 ring-inset ring-neutral-200/70
                            // dark:ring-white/10` here, from when this card had its own opaque
                            // surface and the outline said where the surface ended.
                            //
                            // The surface is gone, so the outline delineates nothing - and
                            // worse, a 1px hairline at 10% white sitting directly on a
                            // photograph is only visible over the photo's darker regions. It
                            // read as a line down the right of the page that stopped halfway,
                            // which is exactly how Niraj described it. A border that is present
                            // for part of its length looks like a bug, because it is one.
                            //
                            // The sidebar and the AI rail keep theirs: both are opaque, so
                            // their outlines still mark a real edge.
                            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300",
                            // Always fully rounded now. This was `rounded-l-2xl` while docked
                            // so its square right edge met the rail's square left one; the rail
                            // is a separate rounded card with a gutter now, so both stay round.
                            "rounded-2xl",
                        )}
                        // The card is inset by the shell's 0.5rem margin, so "full
                        // height" inside it is 1.5rem short of the viewport. `--page-h`
                        // is the single source of truth for that; a rule in
                        // globals.css retargets `h-screen` / `min-h-screen` inside
                        // [data-app-page] at it. Without that, the ~49 full-height
                        // pages under (main) would each overflow by exactly 24px and
                        // show a scrollbar over a strip of nothing.
                        style={{ ["--page-h" as string]: "calc(100dvh - 1.5rem - var(--app-bottom-nav-h))" }}
                    >
                        {/* ScrollArea, not native overflow. The native scrollbar is an
                            OS control: it paints outside the card's rounded corner on
                            Windows, reserves gutter width on some platforms and not
                            others, and cannot be styled to match a surface that is now
                            transparent. `min-w-0` on the viewport keeps a wide child
                            (a table, a chart) shrinking with the column. */}
                        {/* `reflow` is load-bearing, not tidiness. Without it Radix's content
                            box is `display: table` and sizes to its own content, so opening the
                            AI rail narrowed this card but left the page inside it at full width,
                            sliding under the panel. See the prop's note in scroll-area.tsx. */}
                        <ScrollArea className="min-h-0 min-w-0 flex-1" reflow>
                            {children}
                        </ScrollArea>
                    </div>

                    {/* AI rail - a real column, not an overlay. The page narrows to make
                        room for it, so nothing the user was reading gets covered. */}
                    <AnimatePresence initial={false}>
                        {isDocked && (
                            <motion.aside
                                key="ai-rail"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: railWidth, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={isResizing ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 }}
                                // Rounded on ALL four corners, and separated from the page by
                                // `ml-3`. It used to be `rounded-r-2xl` with a `border-l`, on
                                // the reasoning that the page and the rail should read as one
                                // card split in two - but a hard square edge butted against
                                // the page looked like a seam rather than a join, and the AI
                                // panel is its own surface, not half of the page's.
                                className="relative ml-3 h-full shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-background dark:border-neutral-800"
                            >
                                {/* Resize handle. Keyboard-operable too - a drag handle
                                    that only works with a mouse is not a control everyone
                                    can reach. Pointless while maximized. */}
                                {!aiMaximized && (
                                    <div
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label="Resize AI panel"
                                        aria-valuenow={aiWidth}
                                        aria-valuemin={AI_MIN_WIDTH}
                                        aria-valuemax={AI_MAX_WIDTH}
                                        tabIndex={0}
                                        onMouseDown={(e) => { e.preventDefault(); handleResizeStart(e.clientX, aiWidth); }}
                                        onTouchStart={(e) => {
                                            const touch = e.touches[0];
                                            if (touch) handleResizeStart(touch.clientX, aiWidth);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowLeft') { e.preventDefault(); setAIWidth(aiWidth + 24); }
                                            if (e.key === 'ArrowRight') { e.preventDefault(); setAIWidth(aiWidth - 24); }
                                        }}
                                        className="group absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-neutral-900/50 focus:bg-neutral-900/50 focus:outline-none dark:hover:bg-white/40 dark:focus:bg-white/40"
                                    >
                                        <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-600" />
                                    </div>
                                )}
                                {/* The animated width runs to 0 on exit, so the chat is
                                    pinned to its full width here and clipped by the
                                    parent - otherwise the composer and messages would
                                    reflow through every intermediate width on the way out. */}
                                <div className="h-full" style={{ width: railWidth }}>
                                    <AIPanel />
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Below lg, the same panel in a Sheet. */}
            <Sheet open={aiOpen && isMobile} onOpenChange={(v) => { if (!v) closeAI() }}>
                <SheetContent
                    side="right"
                    className="w-full max-w-full border-0 p-0 [&>button]:hidden"
                >
                    <SheetTitle className="sr-only">ShipItHQ AI</SheetTitle>
                    <AIPanel />
                </SheetContent>
            </Sheet>

            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
            />
        </>
    );
};

const Layout = ({ children }: LayoutProps) => {
    const pathname = usePathname();

    // Routes that render OUTSIDE the shell - no sidebar, no page card, no AI rail.
    // All of them are full-window working surfaces (a code editor, a problem
    // workspace) where a 17rem nav column costs more than it gives.
    //
    // These are matched against real directories under app/(main). Two entries
    // here used to point at routes that do not exist:
    //   - '/ai/jobinterviewassistant/...' - the real route has no "job" prefix,
    //     so the coding-questions editor was silently rendering inside the card
    //     with the sidebar beside it. (Written out here deliberately: this is the
    //     WRONG path, kept as the example. A sweep that rewrites the string
    //     everywhere will corrupt this comment into nonsense - it did once.)
    //   - '/learn/[subcategorySlug]/[learnSlug]' - there is no learn module in
    //     this app at all
    // A stale path here fails silently, so it is worth checking against the
    // filesystem when adding one.
    const fullScreenPaths = [
        '/practice/dsa/[slug]',
        '/practice/system-design/[slug]',
        '/practice/web-frontend/[slug]',
        '/practice/web-backend/[slug]',
    ];

    // Check if current path should be in full-screen mode
    const isFullScreenMode = fullScreenPaths.some(path => {
        // Convert dynamic route patterns to regex
        const pattern = path.replace(/\[.*?\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathname);
    });

    const isOnline = useNetworkStatus();

    if (!isOnline) return <OfflineFallback />;

    // If in full-screen mode, render children without sidebar and navbar
    if (isFullScreenMode) {
        return (
            // Outside the shell, so it does not inherit the height above - but the bottom
            // bar is fixed to the viewport and covers this too.
            <ScrollArea className="w-screen bg-neutral-950 h-[calc(100dvh-var(--app-bottom-nav-h))]" reflow>
                {children}
            </ScrollArea>
        );
    }

    return (
        <SidebarProvider>
            {/* `relative` so the backdrop can be `absolute inset-0`, and the flat
                colour stays underneath it: the .webp is a network fetch, and
                without a base the first paint is a white flash in dark mode.
                The backdrop is what the three cards float on - it shows through
                the gutter between them, not through the page itself. */}
            <div className="relative flex h-dvh w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <AppBackdrop />
                <MainContent>{children}</MainContent>
            </div>
        </SidebarProvider>
    );
};

const OfflineFallback = () => {
    const handleRefresh = () => window.location.reload();

    return (
        <div className="h-dvh flex items-center justify-center bg-background px-4 overflow-hidden">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 100 }}
                    transition={{ duration: 0.6, ease: 'easeOut', type: 'spring', stiffness: 100 }}
                    className="bg-gradient-to-br from-primary/10 via-primary/5 to-background backdrop-blur-xl rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center border border-border"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="flex justify-center mb-6"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <WifiOff className="w-8 h-8 text-primary" />
                        </div>
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-3 text-foreground">
                        Connection Lost
                    </h2>
                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                        Your internet connection seems to have wandered off. Check your connection and let&apos;s get back to building amazing portfolios.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Layout;
