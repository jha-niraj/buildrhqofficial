"use client";

/**
 * The KnowMe conversation surface - ONE definition, two callers.
 *
 * `/knowme` (the owner testing their own assistant) and `/knowme/[username]`
 * (a stranger asking about them) were two hand-written copies of the same box.
 * They drifted, as copies do: only one showed sources, only one showed feedback,
 * and both were a fixed `h-[400px]` scroller inside a page that already
 * scrolled. See KM-8.
 *
 * ── Why it looks like the assistant rail ─────────────────────────────────────
 * `components/ai/ai-panel.tsx` is the house style for a chat in this product,
 * and the parts of it that matter here are not decoration:
 *
 *  - the assistant is LABELLED, not bubbled. A bubble caps at 80% width and
 *    fights every list, table and code block a model returns.
 *  - replies go through `MarkdownRenderer`. Both copies used
 *    `whitespace-pre-wrap`, so `## Heading` and `- item` arrived on screen as
 *    literal `#` and `-` characters.
 *  - the composer is a textarea in a bordered box, Enter to send. An `<input>`
 *    cannot hold a second line, and a question worth asking often needs one.
 *  - `.sh-thinking` rather than a spinner - the project has no spinners.
 *
 * It deliberately does NOT copy the rail's header. The two are different
 * products (`plan/knowme/overview.md` says why at length) and the owner has to
 * be able to tell, at a glance, which one is answering: this one answers the way
 * a stranger would be answered.
 *
 * ── Why the height works ─────────────────────────────────────────────────────
 * The component is `h-full` and its parent decides how tall that is. The
 * scroller is `min-h-0 flex-1`, which is the only combination that lets it
 * shrink: a flex child defaults to `min-height: auto` and refuses to go below
 * its content, which is how a growing conversation pushes a composer off the
 * bottom of the screen. There is no `max-h` on the ScrollArea root, ever - the
 * Radix viewport is `h-full`, and `h-full` against an auto-height parent
 * resolves to `auto`, which clips rather than scrolls.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { cn } from "@repo/ui/lib/utils";
import MarkdownRenderer from "@/components/common/markdown-renderer";
import type { ChatMessageSource } from "@/types/knowme";

export interface KnowMeChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources?: ChatMessageSource[];
    wasHelpful?: boolean | null;
    createdAt: Date;
}

interface KnowMeChatProps {
    messages: KnowMeChatMessage[];
    isLoading: boolean;
    onSend: (message: string) => void;
    /** Shown as cards on an empty conversation. Trimmed to four. */
    suggestions?: string[];
    emptyTitle: string;
    emptyHint: string;
    /** The small mark beside every reply, sized by the caller at h-4/h-5. */
    mark: React.ReactNode;
    /** The larger mark above the empty state. */
    emptyMark: React.ReactNode;
    /** The name this assistant answers under, e.g. "Niraj's AI". */
    assistantName: string;
    placeholder: string;
    /** Omitted by the owner's own test chat - rating your own AI is noise. */
    onFeedback?: (messageId: string, helpful: boolean) => void;
    /** Sits under the composer: rate limit on the public page, hints on the dashboard. */
    footer?: React.ReactNode;
    /** Set while the session is still being created - sending would be dropped. */
    disabled?: boolean;
    className?: string;
}

export function KnowMeChat({
    messages,
    isLoading,
    onSend,
    suggestions = [],
    emptyTitle,
    emptyHint,
    mark,
    emptyMark,
    assistantName,
    placeholder,
    onFeedback,
    footer,
    disabled = false,
    className,
}: KnowMeChatProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll the ScrollArea's own viewport, not the window. `scrollIntoView` on a
    // sentinel is what both copies did, and inside a nested scroller it scrolls
    // every ancestor that can scroll - which on the dashboard meant the whole page
    // jumped every time a message arrived.
    useEffect(() => {
        const viewport = scrollRef.current?.querySelector<HTMLElement>(
            "[data-radix-scroll-area-viewport]",
        );
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, [messages, isLoading]);

    // Grow with the text, up to a cap. Reset to `auto` first or the box only ever
    // gets taller: `scrollHeight` of an already-tall element includes the height
    // it was given last time.
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [input]);

    const send = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading || disabled) return;
        onSend(trimmed);
        setInput("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    return (
        <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col", className)}>
            {/* `reflow` pins this to vertical-only scrolling. Without it Radix's
                content box is `display: table` and sizes to its own content, so one
                long unwrapped line in one reply widens the whole scroller and the
                card's rounded edge gets clipped. Code blocks carry their own
                horizontal scroller in markdown-renderer.tsx. */}
            <ScrollArea ref={scrollRef} className="min-h-0 min-w-0 flex-1" reflow>
                <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">
                    {messages.length === 0 ? (
                        <div className="@container flex flex-col items-center py-10 text-center">
                            <div className="mb-3">{emptyMark}</div>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                                {emptyTitle}
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                                {emptyHint}
                            </p>

                            {/* A CONTAINER query, not a viewport one. This chat sits in a
                                column that narrows when the AI rail opens, on a viewport
                                that never changed - `sm:` would answer the wrong question. */}
                            {suggestions.length > 0 && (
                                <div className="mt-6 grid w-full gap-2.5 @[30rem]:grid-cols-2">
                                    {suggestions.slice(0, 4).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => send(s)}
                                            disabled={disabled || isLoading}
                                            className="group flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white/60 p-3 text-left text-sm leading-snug font-medium text-neutral-900 transition-all hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-white dark:hover:border-neutral-600"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatTurn
                                key={message.id}
                                message={message}
                                mark={mark}
                                assistantName={assistantName}
                                onFeedback={onFeedback}
                            />
                        ))
                    )}

                    {isLoading && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-5 w-5 items-center justify-center">{mark}</span>
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                    {assistantName}
                                </span>
                            </div>
                            {/* The word pulses; there is no spinner. See `.sh-thinking` in
                                globals.css - a rotating ring means "waiting on something",
                                and what is happening is a model composing a reply. */}
                            <span
                                className="inline-flex items-baseline text-neutral-500 dark:text-neutral-400"
                                aria-label="Thinking"
                            >
                                <span className="sh-thinking text-sm">Thinking</span>
                                <span aria-hidden className="ml-px inline-flex">
                                    <span className="sh-thinking-dot">.</span>
                                    <span className="sh-thinking-dot">.</span>
                                    <span className="sh-thinking-dot">.</span>
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="mx-auto w-full max-w-3xl shrink-0 border-t border-neutral-200 p-3 sm:px-6 dark:border-neutral-800">
                <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 transition-colors focus-within:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-white">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={1}
                        placeholder={placeholder}
                        disabled={isLoading || disabled}
                        className="max-h-40 min-h-[24px] w-full resize-none bg-transparent py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 disabled:opacity-60 dark:text-white dark:placeholder:text-neutral-400 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    />
                    <button
                        type="button"
                        onClick={() => send(input)}
                        disabled={!input.trim() || isLoading || disabled}
                        aria-label="Send message"
                        className="shrink-0 cursor-pointer rounded-lg bg-neutral-900 p-1.5 text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <div className="mt-1.5 px-1 text-center text-xs text-neutral-600 dark:text-neutral-400">
                    {footer ?? "Enter to send · Shift+Enter for a new line"}
                </div>
            </div>
        </div>
    );
}

function ChatTurn({
    message,
    mark,
    assistantName,
    onFeedback,
}: {
    message: KnowMeChatMessage;
    mark: React.ReactNode;
    assistantName: string;
    onFeedback?: (messageId: string, helpful: boolean) => void;
}) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-neutral-900 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-white dark:text-neutral-900">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center">{mark}</span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {assistantName}
                </span>
            </div>
            <div className="min-w-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                <MarkdownRenderer content={message.content} />
            </div>

            {/* What the answer was drawn from. On a profile of a real person this is
                not decoration: it is the difference between a claim and a citation. */}
            {!!message.sources?.length && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                    {message.sources.slice(0, 4).map((source, idx) => (
                        <span
                            key={idx}
                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                            {source.url ? (
                                <Link
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-w-0 items-center gap-1 hover:underline"
                                >
                                    <span className="truncate">{source.title}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                </Link>
                            ) : (
                                <span className="truncate">{source.title}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {onFeedback && (
                <div className="mt-0.5 flex items-center gap-1">
                    {message.wasHelpful === null || message.wasHelpful === undefined ? (
                        <>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Was this helpful?
                            </span>
                            <button
                                type="button"
                                onClick={() => onFeedback(message.id, true)}
                                aria-label="Helpful"
                                className="cursor-pointer rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                                <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onFeedback(message.id, false)}
                                aria-label="Not helpful"
                                className="cursor-pointer rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                                <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {message.wasHelpful ? "Marked helpful" : "Marked not helpful"}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default KnowMeChat;
