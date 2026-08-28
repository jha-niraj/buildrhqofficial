"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	X, Send, SquarePen, Sparkles, History, Maximize2, Minimize2, Copy, Check, StopCircle, FileText, ArrowRight, Paperclip,
} from "lucide-react";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import MarkdownRenderer from "@/components/common/markdown-renderer";
import { useAIPanelStore, type AIChatMessage, type AIChatAttachment } from "@/app/store/aiPanelStore";
import { createFrameParser } from "@/lib/ai/protocol";
import { ToolSteps, type ToolStep } from "@/components/ai/tool-steps";
import { ChatHistoryDialog } from "@/components/ai/chat-history-dialog";
import { useContextTags, activeContextTags, removePinnedTag } from "@/components/ai/context-tags";
import { AssistantMark, SuggestionGlyph, type GlyphKind } from "@/components/ai/ai-art";

/**
 * The four openers.
 *
 * `prompt` is what actually gets sent and is unchanged from the plain-text version. `title`
 * and `hint` exist because a card needs a scannable line and a line that says what you get -
 * four full sentences at the same weight read as a list of terms rather than a menu.
 */
const SUGGESTIONS: { prompt: string; title: string; hint: string; glyph: GlyphKind }[] = [
	{
		prompt: "Review my resume for a backend role",
		title: "Review my resume",
		hint: "Gaps, phrasing and what a backend screen looks for",
		glyph: "resume",
	},
	{
		prompt: "Give me a 4-week DSA plan",
		title: "Plan my DSA prep",
		hint: "Four weeks, starting from where you actually are",
		glyph: "plan",
	},
	{
		prompt: "Design a URL shortener - walk me through it",
		title: "Design a URL shortener",
		hint: "Walked through the way an interviewer would",
		glyph: "design",
	},
	{
		prompt: "What project should I build next?",
		title: "What should I build next?",
		hint: "Something matched to the gaps in your profile",
		glyph: "build",
	},
];

/**
 * A lightweight, human-readable label for the page the user is on, so the
 * assistant is page-aware without anyone having to tag anything. Pointer, not
 * payload: only the route + title are sent.
 */
function buildPageContext(pathname: string): { route: string; title: string } {
	let title = "";
	if (typeof document !== "undefined" && document.title) {
		title = document.title.replace(/\s*[|\---]\s*ShipItHQ.*$/i, "").trim();
	}
	if (!title) {
		const segments = pathname.split("/").filter(Boolean);
		// Drop trailing id-like segments (cuid/uuid/numeric) for a cleaner label.
		const readable = segments.filter(
			(s) => !/^[0-9]+$/.test(s) && !/^(c[a-z0-9]{20,}|[0-9a-f-]{16,})$/i.test(s),
		);
		title = readable
			.map((s) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
			.join(" › ") || "Dashboard";
	}
	return { route: pathname || "/", title };
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isStreaming }: { message: AIChatMessage; isStreaming: boolean }) {
	const [copied, setCopied] = useState(false);
	const isUser = message.role === "user";

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(message.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy to clipboard");
		}
	};

	if (isUser) {
		return (
			<div className="flex justify-end">
				<div className="flex max-w-[85%] flex-col items-end gap-1.5">
					{/* What was attached, so the turn still says so when it is scrolled back
						to. The text itself is not shown - it is the document, not the
						message. */}
					{!!message.attachments?.length && (
						<div className="flex flex-wrap justify-end gap-1.5">
							{message.attachments.map((a) => (
								<span
									key={a.id}
									className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
								>
									<FileText className="h-3 w-3 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
									<span className="min-w-0 truncate">{a.name}</span>
								</span>
							))}
						</div>
					)}
					{message.content && (
						<div className="rounded-2xl rounded-br-md bg-neutral-900 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-white dark:text-neutral-900">
							{message.content}
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="group flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5">
				<span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900/10">
					<Sparkles className="h-3 w-3 text-neutral-900 dark:text-neutral-100" />
				</span>
				<span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">ShipItHQ AI</span>
			</div>
			<div className="min-w-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
				{message.content ? (
					<MarkdownRenderer content={message.content} />
				) : isStreaming ? (
					// The word pulses; there is no spinner. A rotating ring is the affordance
					// every product uses, which makes it the one that says nothing about this
					// one - and it says the wrong thing besides. A spinner means "waiting on
					// something"; what is happening is a model composing a reply. See
					// `.sh-thinking` in globals.css.
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
				) : null}
			</div>
			{/* Things this turn MADE. Rendered as controls above the copy button, because a
				button that opens the cover letter is the answer to "write me a cover letter" -
				the prose beside it is commentary. */}
			{!!message.actions?.length && (
				<div className="mt-1 flex flex-wrap gap-2">
					{message.actions.map((action) => (
						<Link
							key={action.href}
							href={action.href}
							className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
						>
							<FileText className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
							<span className="min-w-0 truncate">{action.label}</span>
							<ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
						</Link>
					))}
				</div>
			)}

			{message.content && !isStreaming && (
				<button
					type="button"
					onClick={copy}
					className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400 opacity-0 transition-opacity hover:text-neutral-600 group-hover:opacity-100 dark:hover:text-neutral-200"
				>
					{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
					{copied ? "Copied" : "Copy"}
				</button>
			)}
		</div>
	);
}

// ─── Panel ────────────────────────────────────────────────────────────────────

/**
 * The chat surface - header, conversation, composer - and nothing about WHERE it
 * sits. It fills whatever box it is given.
 *
 * Placement is the app shell's job (`app/(main)/layout.tsx`): on lg+ it mounts
 * this as a real docked column beside the page, so the page narrows instead of
 * being covered; below lg it mounts the same component inside a Sheet. Keeping
 * the two concerns apart is what lets one implementation serve both without a
 * `variant` flag threading through every element.
 */
export function AIPanel() {
	const {
		close, isMaximized, toggleMaximized,
		sessions, activeSessionId, newSession, selectSession, deleteSession,
		addUserMessage, addAssistantPlaceholder, appendToLastAssistant, replaceLastAssistant,
		addActionToLastAssistant,
		isStreaming, setStreaming,
	} = useAIPanelStore();

	const pathname = usePathname();
	const [input, setInput] = useState("");
	const [historyOpen, setHistoryOpen] = useState(false);
	// The agent's activity for the turn in flight. Deliberately NOT in the message
	// store: these are transient, and persisting them would replay stale
	// "Reading…" lines every time an old session is reopened.
	const [steps, setSteps] = useState<ToolStep[]>([]);
	const tagState = useContextTags();
	const activeTags = useMemo(() => activeContextTags(tagState), [tagState]);
	const [isMobile, setIsMobile] = useState(false);
	// Documents attached to the turn being composed, already extracted to text. Cleared
	// into the message on send.
	const [pendingDocs, setPendingDocs] = useState<AIChatAttachment[]>([]);
	const [uploading, setUploading] = useState(0);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
	// Memoised so the empty-history case doesn't hand a fresh `[]` to the
	// scroll-to-bottom effect on every render (which would re-run it forever).
	const messages = useMemo(() => activeSession?.messages ?? [], [activeSession?.messages]);

	// Below lg the panel is a full-width sheet, so there is nothing to drag.
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 1023px)");
		const update = () => setIsMobile(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	// Keep the newest message in view as tokens arrive.
	useEffect(() => {
		const el = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages, isStreaming]);

	// The shell only mounts this while the panel is open, so mounting IS opening.
	useEffect(() => {
		const t = setTimeout(() => textareaRef.current?.focus(), 250);
		return () => clearTimeout(t);
	}, []);

	// Abort any in-flight response when the panel unmounts, so a closed panel
	// can't keep writing into a conversation nobody is looking at.
	useEffect(() => () => abortRef.current?.abort(), []);

	// ── Send ──────────────────────────────────────────────────────────────────
	/**
	 * Read a dropped or chosen file into the pending attachments.
	 *
	 * Extraction happens on the server (`/api/ai/upload-doc`) and nothing is stored - the
	 * text that comes back is the only copy, and it travels with the next message.
	 *
	 * `uploading` is a COUNT, not a boolean: a multi-file drop runs several of these at
	 * once, and a boolean would clear on the first one to finish while others were still
	 * in flight.
	 */
	const attachFile = useCallback(async (file: File) => {
		if (file.size > 10 * 1024 * 1024) {
			toast.error("That file is over 10MB.");
			return;
		}
		setUploading((n) => n + 1);
		try {
			const form = new FormData();
			form.append("file", file);
			const res = await fetch("/api/ai/upload-doc", { method: "POST", body: form });
			const data = (await res.json()) as
				| { id: string; name: string; chars: number; truncated?: boolean; text: string }
				| { error: string };
			if (!res.ok || "error" in data) {
				toast.error("error" in data ? data.error : "Could not read that file.");
				return;
			}
			setPendingDocs((docs) => [...docs, data]);
			if (data.truncated) {
				toast.success(`Attached ${data.name} (long - read the first part).`);
			}
		} catch {
			toast.error("Could not read that file.");
		} finally {
			setUploading((n) => Math.max(0, n - 1));
		}
	}, []);

	const send = useCallback(async (text: string) => {
		const content = text.trim();
		// An attachment alone is a valid turn - "here, read this" - so the guard is on
		// having SOMETHING, not on having typed something.
		if ((!content && pendingDocs.length === 0) || isStreaming) return;

		const docs = pendingDocs;
		setInput("");
		setPendingDocs([]);
		addUserMessage(content, docs.length ? docs : undefined);
		addAssistantPlaceholder();
		setStreaming(true);
		// Fresh timeline per turn: last turn's completed steps are history, and
		// leaving them up makes the new reply look like it already did the work.
		setSteps([]);

		// Read the history AFTER the user message is in the store, so the request
		// includes the turn we're answering.
		const state = useAIPanelStore.getState();
		const session = state.sessions.find((s) => s.id === state.activeSessionId);
		// Attachment text is folded into the message it was sent with, rather than
		// travelling as a separate field. Two reasons: the model needs no new concept to
		// understand it, and a document stays attached to the turn it belongs to when the
		// history is replayed - a `documents` array on the request would lose that pairing
		// the moment the conversation went past one turn.
		const history = (session?.messages ?? [])
			.map((m) => {
				const attached = (m.attachments ?? [])
					.map(
						(a) =>
							`\n\n--- Attached document: ${a.name} ---\n${a.text}` +
							(a.truncated ? "\n[truncated]" : "") +
							"\n--- end of document ---",
					)
					.join("");
				return { role: m.role, content: `${m.content}${attached}`.trim() };
			})
			.filter((m) => m.content.length > 0);

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			const res = await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: history,
					page: buildPageContext(pathname),
					// What the user pinned, plus whatever page they are on.
					tags: activeContextTags(tagState),
				}),
				signal: controller.signal,
			});

			if (!res.ok || !res.body) {
				const detail = await res.json().catch(() => null) as { error?: string } | null;
				replaceLastAssistant(detail?.error ?? "Something went wrong. Please try again.");
				return;
			}

			// NDJSON frames, not raw text - see lib/ai/protocol.ts. The parser is
			// incremental because a chunk boundary lands anywhere, including the
			// middle of a frame.
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			const parse = createFrameParser();

			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				for (const frame of parse(decoder.decode(value, { stream: true }))) {
					if (frame.t === "text") {
						appendToLastAssistant(frame.v);
					} else if (frame.t === "tool") {
						// Steps live outside the message store: they are transient
						// UI for the turn in flight, not conversation content, and
						// persisting them would replay stale "Reading…" lines every
						// time the session is reopened.
						setSteps((prev) => {
							if (frame.phase === "call") {
								if (prev.some((s) => s.id === frame.id)) return prev;
								return [...prev, { id: frame.id, name: frame.name, status: "running" as const }];
							}
							return prev.map((s) =>
								s.id === frame.id
									? {
										...s,
										status: frame.phase === "error" ? ("error" as const) : ("done" as const),
										summary: frame.summary ?? s.summary,
									}
									: s,
							);
						});
					} else if (frame.t === "action") {
						// A control for something a tool made. The href is written in
						// lib/ai/tools.ts and emitted by the route from the tool's own return
						// value, so it never passed through the model - but this is the code
						// that navigates, so it checks anyway. Internal paths only: no
						// scheme, no protocol-relative "//host".
						if (frame.href.startsWith("/") && !frame.href.startsWith("//")) {
							addActionToLastAssistant({
								label: frame.label,
								href: frame.href,
								kind: frame.kind,
							});
						}
					} else if (frame.t === "error") {
						appendToLastAssistant(`\n\n_${frame.message}_`);
					}
					// `done` needs no handling - the reader ending is the same signal.
				}
			}
		} catch (error) {
			// A user-initiated stop is not an error - keep whatever streamed in.
			if ((error as Error)?.name !== "AbortError") {
				replaceLastAssistant("The assistant couldn't be reached. Please try again.");
			}
		} finally {
			abortRef.current = null;
			setStreaming(false);
		}
	}, [
		isStreaming, pathname, addUserMessage, addAssistantPlaceholder,
		appendToLastAssistant, replaceLastAssistant, setStreaming,
		addActionToLastAssistant, pendingDocs, tagState,
	]);

	const stop = () => abortRef.current?.abort();

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void send(input);
		}
	};

	return (
		<div className="flex h-full w-full min-w-0 flex-col bg-white dark:bg-neutral-950">
			{/* Header */}
			<header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
				<div className="flex min-w-0 items-center gap-2">
					<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900/10">
						<Sparkles className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
					</span>
					<span className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
						{activeSession?.messages.length ? activeSession.title : "ShipItHQ AI"}
					</span>
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					<IconButton label="Chat history" onClick={() => setHistoryOpen((v) => !v)} active={historyOpen}>
						<History className="h-4 w-4" />
					</IconButton>
					<IconButton label="New chat" onClick={() => { newSession(); setHistoryOpen(false); }}>
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

			{/* Past conversations. A dialog rather than the drawer that used to
				sit here - see chat-history-dialog.tsx for why. */}
			<ChatHistoryDialog
				open={historyOpen}
				onOpenChange={setHistoryOpen}
				sessions={sessions}
				activeSessionId={activeSessionId}
				onSelect={selectSession}
				onDelete={deleteSession}
				onNew={newSession}
			/>

			{/* Conversation. `reflow` pins this to vertical-only - the AI rail is
				docked on every page in the app, so a stray wide descendant in any
				one message (a long unwrapped code line, a wide table) would
				otherwise widen this whole scroller and clip the rail's own
				border/rounding rather than scrolling. Code blocks already carry
				their own horizontal scroller in markdown-renderer.tsx, so nothing
				here legitimately needs to grow sideways. See
				docs/responsiveness.md section 2. */}
			<ScrollArea ref={scrollRef} className="min-h-0 min-w-0 flex-1" reflow>
				<div className={cn(
					"space-y-5 px-4 py-5",
					// A maximized panel is far wider than a comfortable reading
					// measure, so the column is capped and centred there.
					isMaximized && "mx-auto max-w-3xl",
				)}>
					{messages.length === 0 ? (
						<div className="@container flex flex-col items-center py-8 text-center">
							<AssistantMark className="mb-3 h-14 w-14 text-neutral-900 dark:text-white" />
							<h2 className="text-base font-semibold text-neutral-900 dark:text-white">
								How can I help?
							</h2>
							<p className="mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
								Ask about your projects, interview prep, DSA, or your resume.
							</p>

							{/* Two columns once the rail is wide enough for them.
								A CONTAINER query, not a viewport one: this rail is resizable
								between 360px and 900px on a viewport that never changes, so
								`sm:` would answer the wrong question entirely. */}
							<div className="mt-6 grid w-full gap-2.5 @[26rem]:grid-cols-2">
								{SUGGESTIONS.map((s) => (
									<button
										key={s.prompt}
										type="button"
										onClick={() => void send(s.prompt)}
										className="group flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-600"
									>
										<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors group-hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:text-white">
											<SuggestionGlyph kind={s.glyph} className="h-[22px] w-[22px]" />
										</span>
										<span className="min-w-0">
											<span className="block text-sm font-semibold leading-snug text-neutral-900 dark:text-white">
												{s.title}
											</span>
											<span className="mt-0.5 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
												{s.hint}
											</span>
										</span>
									</button>
								))}
							</div>
						</div>
					) : (
						messages.map((m, i) => (
							<div key={m.id} className="flex flex-col gap-1.5">
								{/* The agent's work for THIS turn, above the reply it
									produced. Rendered on the last assistant bubble only:
									steps are cleared per turn, so anywhere else would
									attach them to a message they did not belong to. */}
								{m.role === "assistant" && i === messages.length - 1 && steps.length > 0 && (
									<ToolSteps steps={steps} />
								)}
								<MessageBubble
									message={m}
									isStreaming={isStreaming && i === messages.length - 1}
								/>
							</div>
						))
					)}
				</div>
			</ScrollArea>

			{/* Composer */}
			<div className={cn("shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800", isMaximized && "mx-auto w-full max-w-3xl")}>
				{/* What the agent will be told about, above the box the user types in.
					Context the user cannot see is context they cannot correct - and the
					auto tag in particular has to say WHY it is there, or a chip they
					never added looks like a bug. */}
				{activeTags.length > 0 && (
					<div className="mb-2 flex flex-wrap items-center gap-1.5">
						{activeTags.map((tag) => {
							const isAuto = tagState.auto?.id === tag.id && tagState.auto?.kind === tag.kind
							return (
								<span
									key={`${tag.kind}:${tag.id}`}
									className="inline-flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 py-0.5 pl-2 pr-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
								>
									<span className="truncate">{tag.title}</span>
									{isAuto ? (
										<span className="shrink-0 text-neutral-600 dark:text-neutral-400">(this page)</span>
									) : (
										<button
											type="button"
											onClick={() => removePinnedTag(tag.id)}
											aria-label={`Remove ${tag.title} from context`}
											className="shrink-0 cursor-pointer rounded-full p-0.5 text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
										>
											<X className="h-3 w-3" />
										</button>
									)}
								</span>
							)
						})}
					</div>
				)}
				{/* Attached documents, above the composer. Shown as removable chips rather than
					as text in the box: the file is not something the user typed, and putting
					it in the textarea would mean they could half-delete it. */}
				{(pendingDocs.length > 0 || uploading > 0) && (
					<div className="mb-2 flex flex-wrap gap-1.5">
						{pendingDocs.map((doc) => (
							<span
								key={doc.id}
								className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
							>
								<FileText className="h-3 w-3 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
								<span className="min-w-0 truncate">{doc.name}</span>
								<span className="shrink-0 text-neutral-600 dark:text-neutral-400">
									{doc.truncated ? "part" : `${Math.round(doc.chars / 1000)}k`}
								</span>
								<button
									type="button"
									onClick={() => setPendingDocs((d) => d.filter((x) => x.id !== doc.id))}
									aria-label={`Remove ${doc.name}`}
									className="shrink-0 cursor-pointer rounded p-0.5 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-neutral-900 dark:hover:text-white"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}
						{uploading > 0 && (
							<span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
								<InlineLoader size="sm" />
								Reading {uploading > 1 ? `${uploading} files` : "file"}
							</span>
						)}
					</div>
				)}

				<div
					onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						for (const f of Array.from(e.dataTransfer.files)) void attachFile(f);
					}}
					className={cn(
						"flex items-end gap-2 rounded-2xl border bg-neutral-50 px-3 py-2 transition-colors focus-within:border-neutral-900 dark:bg-neutral-900",
						dragging
							? "border-neutral-900 border-dashed dark:border-white"
							: "border-neutral-200 dark:border-neutral-800",
					)}
				>
					{/* Hidden input, opened by the paperclip. `accept` matches the allow-list
						the route enforces, so the picker does not offer files it will refuse. */}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv"
						className="hidden"
						onChange={(e) => {
							for (const f of Array.from(e.target.files ?? [])) void attachFile(f);
							// Reset, or choosing the SAME file twice in a row fires no change event.
							e.target.value = "";
						}}
					/>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={isStreaming}
						aria-label="Attach a document"
						title="Attach a PDF, Word or text file"
						className="shrink-0 cursor-pointer rounded-lg p-1.5 text-neutral-500 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:text-white"
					>
						<Paperclip className="h-4 w-4" />
					</button>
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={onKeyDown}
						rows={1}
						placeholder="Ask anything…"
						disabled={isStreaming}
						className="max-h-40 min-h-[24px] w-full resize-none bg-transparent py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-600 dark:text-neutral-400 disabled:opacity-60 dark:text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					/>
					{isStreaming ? (
						<button
							type="button"
							onClick={stop}
							aria-label="Stop generating"
							className="shrink-0 cursor-pointer rounded-lg p-1.5 text-neutral-500 dark:text-neutral-400 transition-colors hover:text-red-500"
						>
							<StopCircle className="h-4.5 w-4.5" />
						</button>
					) : (
						<button
							type="button"
							onClick={() => void send(input)}
							disabled={(!input.trim() && pendingDocs.length === 0) || uploading > 0}
							aria-label="Send message"
							className="shrink-0 cursor-pointer rounded-lg bg-neutral-900 dark:bg-white p-1.5 text-white dark:text-neutral-900 transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Send className="h-4 w-4" />
						</button>
					)}
				</div>
				<p className="mt-1.5 px-1 text-center text-xs text-neutral-600 dark:text-neutral-400">
					Enter to send · Shift+Enter for a new line · attach or drop a document
				</p>
			</div>
		</div>
	);
}

function IconButton({ label, onClick, active, children }: {
	label: string;
	onClick: () => void;
	active?: boolean;
	children: React.ReactNode;
}) {
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
	);
}

export default AIPanel;
