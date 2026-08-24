"use client"

import { Sparkles } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/ui/tooltip"
import { cn } from "@repo/ui/lib/utils"

/**
 * The sidebar's "Ask AI" row - `AppSidebar`'s `footerExtra` slot, expanded form.
 * Shared by all three console sidebars (ADM-21).
 *
 * Matched to `apps/main`'s footer button rather than being its own thing: this is the primary
 * action in the footer and the only way into the assistant, so it is a FILLED, CENTRED pill
 * there. Here it was a left-aligned plain-text row that read as one more nav link beside the
 * ones above it - which is exactly what it is not.
 *
 * `isOpen` drives a pressed ring, so the control shows whether the panel it toggles is
 * currently up. Optional, because a caller that does not track that still gets a correct
 * button rather than a lie about the state.
 */
export function AskAIFooter({ onOpen, isOpen = false }: { onOpen: () => void; isOpen?: boolean }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-pressed={isOpen}
            className={cn(
                "group flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-all min-w-0",
                "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 hover:shadow active:scale-[0.98]",
                "dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                isOpen && "ring-2 ring-neutral-900/20 dark:ring-white/30",
            )}
        >
            <Sparkles className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
            <span className="truncate">Ask AI</span>
        </button>
    )
}

/**
 * Same, collapsed to an icon for the rail - `footerExtraCollapsed`.
 *
 * Keeps the filled treatment. The entry point should not quietly demote itself to a plain
 * grey icon just because the nav narrowed.
 */
export function AskAIFooterCollapsed({ onOpen, isOpen = false }: { onOpen: () => void; isOpen?: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label="Ask AI"
                    aria-pressed={isOpen}
                    className={cn(
                        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                        "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 active:scale-95",
                        "dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                        isOpen && "ring-2 ring-neutral-900/20 dark:ring-white/30",
                    )}
                >
                    <Sparkles className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">
                Ask AI
            </TooltipContent>
        </Tooltip>
    )
}
