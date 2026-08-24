"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { useAIPanelStore } from "@/stores/ai-panel.store"

/** Floating launcher for the console's AI panel. Hides itself while the panel
 *  is open - ported from apps/main's components/ai/ai-trigger-button.tsx. */
export function AITriggerButton({ className }: { className?: string }) {
    const { isOpen, open } = useAIPanelStore()

    if (isOpen) return null

    return (
        <button
            type="button"
            onClick={open}
            aria-label="Open the console assistant"
            className={cn(
                "fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full",
                "bg-neutral-900 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-neutral-900 shadow-lg",
                "transition-all hover:bg-neutral-800 hover:shadow-xl active:scale-95 cursor-pointer",
                className,
            )}
        >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI</span>
        </button>
    )
}

export default AITriggerButton
