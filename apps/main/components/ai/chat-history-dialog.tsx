"use client"

import { useMemo, useState } from "react"
import { History, Search, SquarePen, Trash2 } from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@repo/ui/components/ui/dialog"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { cn } from "@repo/ui/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Past conversations.
//
// A dialog, not the drawer that was here before. The drawer pushed itself in
// between the header and the messages, so opening history shoved the whole
// conversation down the panel - and it was capped at ~56px of scroll inside an
// already narrow rail, which is room for three titles. History is a thing you go
// looking for, and it deserves the width to be searchable rather than a sliver
// that displaces what you were reading.
//
// Search matters more here than it looks: chat titles are auto-derived from the
// first message, so after a fortnight a user has fifteen conversations all
// starting "how do I". Scrolling for the right one is not a viable interface.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatHistorySession {
    id: string
    title: string
    updatedAt?: number
}

export interface ChatHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessions: ChatHistorySession[]
    activeSessionId: string | null
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onNew: () => void
}

function formatWhen(ts?: number): string {
    if (!ts) return ""
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(ts).toLocaleDateString()
}

export function ChatHistoryDialog({
    open, onOpenChange, sessions, activeSessionId, onSelect, onDelete, onNew,
}: ChatHistoryDialogProps) {
    const [query, setQuery] = useState("")

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return sessions
        return sessions.filter((s) => s.title.toLowerCase().includes(q))
    }, [sessions, query])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg gap-0 p-0">
                <DialogHeader className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <History className="h-4 w-4" /> Conversations
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Search and reopen a past conversation, or start a new one.
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-white">
                        <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search conversations"
                            autoFocus
                            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
                        />
                    </div>
                </div>

                <ScrollArea className="max-h-[52dvh]">
                    <div className="p-2">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-8 text-center text-sm text-neutral-400">
                                {sessions.length === 0 ? "No conversations yet" : "Nothing matches that"}
                            </p>
                        ) : (
                            filtered.map((s) => (
                                <div
                                    key={s.id}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                                        s.id === activeSessionId
                                            ? "bg-neutral-900/10 dark:bg-white/10"
                                            : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => { onSelect(s.id); onOpenChange(false) }}
                                        className="min-w-0 flex-1 cursor-pointer text-left"
                                    >
                                        <span className="block truncate text-sm text-neutral-800 dark:text-neutral-200">
                                            {s.title}
                                        </span>
                                        {s.updatedAt && (
                                            <span className="block text-[11px] text-neutral-400">{formatWhen(s.updatedAt)}</span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(s.id)}
                                        aria-label={`Delete "${s.title}"`}
                                        // Visible on focus as well as hover: a delete you
                                        // can only reach with a mouse is not reachable.
                                        className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
                    <button
                        type="button"
                        onClick={() => { onNew(); onOpenChange(false) }}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                    >
                        <SquarePen className="h-3.5 w-3.5" /> New conversation
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ChatHistoryDialog
