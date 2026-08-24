"use client"

import { Sparkles } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/components/ui/tooltip"

/** The sidebar's "Ask AI" row - `AppSidebar`'s `footerExtra` slot, expanded
 *  form. Shared by all three console sidebars (ADM-21). */
export function AskAIFooter({ onOpen }: { onOpen: () => void }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
            <Sparkles className="h-4 w-4" />
            Ask AI
        </button>
    )
}

/** Same, collapsed to an icon for the rail - `footerExtraCollapsed`. */
export function AskAIFooterCollapsed({ onOpen }: { onOpen: () => void }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label="Ask AI"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <Sparkles className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800">Ask AI</TooltipContent>
        </Tooltip>
    )
}
