"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
    X, Send, SquarePen, Sparkles, History, Maximize2, Minimize2, Copy, Check, StopCircle,
    Users, Coins, MessageCircle, BarChart3,
} from "lucide-react"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "@repo/ui/components/ui/sonner"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useAIPanelStore, type AIChatMessage } from "@/stores/ai-panel.store"
import { createFrameParser } from "@/lib/ai/protocol"
import { ToolSteps, type ToolStep } from "@/components/ai/tool-steps"
import { ChatHistoryDialog } from "@/components/ai/chat-history-dialog"

/**
 * The console's AI panel - ported from apps/main's components/ai/ai-panel.tsx.
 * Structure, streaming, resize and history are 1:1; attachments and
 * page-context tags are cut (nothing in the console maps to them), and the
 * four opener cards use plain lucide icons instead of the custom glyph art.
 * See plan/admin/tasks.md ADM-19.
 */
const SUGGESTIONS: { prompt: string; title: string; hint: string; icon: typeof Users }[] = [
    { prompt: "How many users signed up this week?", title: "This week's signups", hint: "New users, at a glance", icon: BarChart3 },
    { prompt: "What's the platform-wide credit balance outstanding?", title: "Credit balance", hint: "Total credits owed across all users", icon: Coins },
    { prompt: "Summarize the feedback that's still under review", title: "Pending feedback", hint: "What's waiting on a decision", icon: MessageCircle },
    { prompt: "Are there any companies waiting on verification?", title: "Verification queue", hint: "Companies not yet reviewed", icon: Users },
]

function buildPageContext(pathname: string): { route: string; title: string } {
    let title = ""
    if (typeof document !== "undefined" && document.title) {
        title = document.title.replace(/\s*[|\-\u2013\u2014]\s*ShipItHQ.*$/i, "").trim()
    }
    if (!title) {
        const segments = pathname.split("/").filter(Boolean)
        title = segments.map((s) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" › ") || "Dashboard"
    }
    return { route: pathname || "/", title }
}

function MessageBubble({ message, isStreaming }: { message: AIChatMessage; isStreaming: boolean }) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === "user"

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            toast.error("Couldn't copy to clipboard")
        }
    }

    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-neutral-900 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-white dark:text-neutral-900">
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className="group flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900/10">
                    <Sparkles className="h-3 w-3 text-neutral-900 dark:text-neutral-100" />
                </span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Console Assistant</span>
            </div>
            <div className="min-w-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {message.content ? (
                    <MarkdownRenderer content={message.content} />
                ) : isStreaming ? (
                    <span className="inline-flex items-baseline text-neutral-500 dark:text-neutral-400" aria-label="Thinking">
                        <span className="sh-thinking text-sm">Thinking</span>
                        <span aria-hidden className="ml-px inline-flex">
                            <span className="sh-thinking-dot">.</span>
                            <span className="sh-thinking-dot">.</span>
                            <span className="sh-thinking-dot">.</span>
                        </span>
                    </span>
                ) : null}
            </div>
            {message.content && !isStreaming && (
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-400 opacity-0 transition-opacity hover:text-neutral-600 group-hover:opacity-100 dark:hover:text-neutral-200"
                >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            )}
        </div>
    )
}

function IconButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={cn(
                "cursor-pointer rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                active && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
            )}
        >
            {children}
        </button>
    )
}

export function AIPanel() {
    const {
        close, isMaximized, toggleMaximized,
        sessions, activeSessionId, newSession, selectSession, deleteSession,
        addUserMessage, addAssistantPlaceholder, appendToLastAssistant, replaceLastAssistant,
        isStreaming, setStreaming,
    } = useAIPanelStore()

    const pathname = usePathname()
    const [input, setInput] = useState("")
    const [historyOpen, setHistoryOpen] = useState(false)
    const [steps, setSteps] = useState<ToolStep[]>([])
    const [isMobile, setIsMobile] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
    const messages = useMemo(() => activeSession?.messages ?? [], [activeSession?.messages])

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)")
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    useEffect(() => {
        const el = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]")
        if (el) el.scrollTop = el.scrollHeight
    }, [messages, isStreaming])

    useEffect(() => {
        const t = setTimeout(() => textareaRef.current?.focus(), 250)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => () => abortRef.current?.abort(), [])

    const send = useCallback(async (text: string) => {
        const content = text.trim()
        if (!content || isStreaming) return

        setInput("")
        addUserMessage(content)
        addAssistantPlaceholder()
        setStreaming(true)
        setSteps([])

        const state = useAIPanelStore.getState()
        const session = state.sessions.find((s) => s.id === state.activeSessionId)
        const history = (session?.messages ?? [])
            .map((m) => ({ role: m.role, content: m.content.trim() }))
            .filter((m) => m.content.length > 0)

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history, page: buildPageContext(pathname) }),
                signal: controller.signal,
            })

            if (!res.ok || !res.body) {
                const detail = (await res.json().catch(() => null)) as { error?: string } | null
                replaceLastAssistant(detail?.error ?? "Something went wrong. Please try again.")
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            const parse = createFrameParser()

            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                for (const frame of parse(decoder.decode(value, { stream: true }))) {
                    if (frame.t === "text") {
                        appendToLastAssistant(frame.v)
                    } else if (frame.t === "tool") {
                        setSteps((prev) => {
                            if (frame.phase === "call") {
                                if (prev.some((s) => s.id === frame.id)) return prev
                                return [...prev, { id: frame.id, name: frame.name, status: "running" as const }]
                            }
                            return prev.map((s) =>
                                s.id === frame.id
                                    ? { ...s, status: frame.phase === "error" ? ("error" as const) : ("done" as const), summary: frame.summary ?? s.summary }
                                    : s,
                            )
                        })
                    } else if (frame.t === "error") {
                        appendToLastAssistant(`\n\n_${frame.message}_`)
                    }
                }
            }
        } catch (error) {
            if ((error as Error)?.name !== "AbortError") {
                replaceLastAssistant("The assistant couldn't be reached. Please try again.")
            }
        } finally {
            abortRef.current = null
            setStreaming(false)
        }
    }, [isStreaming, pathname, addUserMessage, addAssistantPlaceholder, appendToLastAssistant, replaceLastAssistant, setStreaming])

    const stop = () => abortRef.current?.abort()

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void send(input)
        }
    }

    return (
        <div className="flex h-full w-full min-w-0 flex-col bg-white dark:bg-neutral-950">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900/10">
                        <Sparkles className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                    </span>
                    <span className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {activeSession?.messages.length ? activeSession.title : "Console Assistant"}
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton label="Chat history" onClick={() => setHistoryOpen((v) => !v)} active={historyOpen}>
                        <History className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="New chat" onClick={() => { newSession(); setHistoryOpen(false) }}>
                        <SquarePen className="h-4 w-4" />
                    </IconButton>
                    {!isMobile && (
                        <IconButton label={isMaximized ? "Restore panel" : "Maximize panel"} onClick={toggleMaximized}>
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </IconButton>
                    )}
                    <IconButton label="Close" onClick={close}>
                        <X className="h-4 w-4" />
                    </IconButton>
                </div>
            </header>

            <ChatHistoryDialog
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={selectSession}
                onDelete={deleteSession}
                onNew={newSession}
            />

            <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
                <div className={cn("space-y-5 px-4 py-5", isMaximized && "mx-auto max-w-3xl")}>
                    {messages.length === 0 ? (
                        <div className="@container flex flex-col items-center py-8 text-center">
                            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900/10">
                                <Sparkles className="h-6 w-6 text-neutral-900 dark:text-white" />
                            </span>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">How can I help?</h2>
                            <p className="mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
                                Ask about users, credits, feedback, or platform stats.
                            </p>
                            <div className="mt-6 grid w-full gap-2.5 @[26rem]:grid-cols-2">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.prompt}
                                        type="button"
                                        onClick={() => void send(s.prompt)}
                                        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-600"
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors group-hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:text-white">
                                            <s.icon className="h-[18px] w-[18px]" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold leading-snug text-neutral-900 dark:text-white">{s.title}</span>
                                            <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{s.hint}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <div key={m.id} className="flex flex-col gap-1.5">
                                {m.role === "assistant" && i === messages.length - 1 && steps.length > 0 && <ToolSteps steps={steps} />}
                                <MessageBubble message={m} isStreaming={isStreaming && i === messages.length - 1} />
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className={cn("shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800", isMaximized && "mx-auto w-full max-w-3xl")}>
                <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 transition-colors focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={1}
                        placeholder="Ask anything…"
                        disabled={isStreaming}
                        className="max-h-40 min-h-[24px] w-full resize-none bg-transparent py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60 dark:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={stop}
                            aria-label="Stop generating"
                            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-neutral-500 transition-colors hover:text-red-500 dark:text-neutral-400"
                        >
                            <StopCircle className="h-4.5 w-4.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void send(input)}
                            disabled={!input.trim()}
                            aria-label="Send message"
                            className="shrink-0 cursor-pointer rounded-lg bg-neutral-900 p-1.5 text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <p className="mt-1.5 px-1 text-center text-xs text-neutral-400">Enter to send · Shift+Enter for a new line</p>
            </div>
        </div>
    )
}

export default AIPanel
