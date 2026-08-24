"use client"

import { Check, X } from "lucide-react"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { cn } from "@repo/ui/lib/utils"

// Ported from apps/main's components/ai/tool-steps.tsx - see the note there for
// why this exists instead of a spinner: it shows the agent's activity timeline
// above a reply, not just that something is happening.

export interface ToolStep {
    id: string
    name: string
    status: "running" | "done" | "error"
    summary?: string
}

/** Present-tense while running, past-tense when done - written out per tool,
 *  matching the seven tools in lib/ai/tools.ts. */
const TOOL_LABELS: Record<string, { running: string; done: string }> = {
    search_users: { running: "Searching users", done: "Searched users" },
    get_user: { running: "Looking up user", done: "Looked up user" },
    get_credit_summary: { running: "Reading credit summary", done: "Read credit summary" },
    search_feedback: { running: "Searching feedback", done: "Searched feedback" },
    get_platform_stats: { running: "Reading platform stats", done: "Read platform stats" },
    search_companies: { running: "Searching companies", done: "Searched companies" },
    search_universities: { running: "Searching universities", done: "Searched universities" },
}

function toolLabel(name: string): { running: string; done: string } {
    return TOOL_LABELS[name] ?? { running: "Working", done: "Done" }
}

export function ToolSteps({ steps }: { steps: ToolStep[] }) {
    if (!steps.length) return null

    return (
        <div
            className="flex w-full max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-900/60"
            role="status"
            aria-live="polite"
        >
            {steps.map((s) => (
                <div key={s.id} className="flex min-w-0 max-w-full items-center gap-1.5 text-[12px] font-medium">
                    {s.status === "running" ? (
                        <InlineLoader size="sm" className="shrink-0 text-neutral-400" />
                    ) : s.status === "error" ? (
                        <X className="h-3 w-3 shrink-0 text-red-500" />
                    ) : (
                        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    )}
                    <span
                        className={cn(
                            "truncate",
                            s.status === "running"
                                ? "text-neutral-500 dark:text-neutral-400"
                                : "text-neutral-700 dark:text-neutral-200",
                        )}
                    >
                        {s.summary ??
                            (s.status === "running"
                                ? `${toolLabel(s.name).running}…`
                                : s.status === "error"
                                    ? `${toolLabel(s.name).done} - failed`
                                    : toolLabel(s.name).done)}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default ToolSteps
