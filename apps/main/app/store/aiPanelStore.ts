"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * A control attached to an assistant message - a link to something a tool MADE.
 *
 * Persisted with the message rather than held in transient turn state, unlike the tool
 * steps: the steps describe work that is over, but "open the cover letter you asked me to
 * write" is still true when the session is reopened tomorrow.
 */
export interface AIChatAction {
	label: string;
	href: string;
	kind?: string;
}

/**
 * A document the user attached to a turn.
 *
 * `text` is the EXTRACTED text, not the file - `/api/ai/upload-doc` stores nothing, so this
 * is the only copy. It is capped at 20k characters there, which matters here too: this store
 * persists to localStorage, so anything kept is kept in every future page load.
 */
export interface AIChatAttachment {
	id: string;
	name: string;
	chars: number;
	truncated?: boolean;
	text: string;
}

export interface AIChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: number;
	actions?: AIChatAction[];
	attachments?: AIChatAttachment[];
}

export interface AIChatSession {
	id: string;
	title: string;
	messages: AIChatMessage[];
	updatedAt: number;
}

// ── Panel width ───────────────────────────────────────────────────────────────
// Bounds, not preferences: below MIN the composer and message bubbles stop being
// usable; above MAX the panel starts eating the page it is meant to assist with.
export const AI_MIN_WIDTH = 360;
export const AI_MAX_WIDTH = 900;
export const AI_DEFAULT_WIDTH = 460;

export function clampPanelWidth(width: number): number {
	return Math.min(Math.max(width, AI_MIN_WIDTH), AI_MAX_WIDTH);
}

interface AIPanelState {
	// Panel chrome
	isOpen: boolean;
	width: number;
	isMaximized: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
	setWidth: (width: number) => void;
	toggleMaximized: () => void;

	// Conversations
	sessions: AIChatSession[];
	activeSessionId: string | null;
	isStreaming: boolean;

	newSession: () => string;
	selectSession: (id: string) => void;
	deleteSession: (id: string) => void;
	addUserMessage: (content: string, attachments?: AIChatAttachment[]) => void;
	addAssistantPlaceholder: () => void;
	appendToLastAssistant: (chunk: string) => void;
	replaceLastAssistant: (content: string) => void;
	addActionToLastAssistant: (action: AIChatAction) => void;
	setStreaming: (streaming: boolean) => void;
}

function makeId(): string {
	// crypto.randomUUID isn't available in every browser we support, and this only
	// needs to be unique within one user's local history.
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** First line of the opening question, trimmed - good enough as a history label. */
function titleFrom(content: string): string {
	const firstLine = content.trim().split("\n")[0] ?? "";
	return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine || "New chat";
}

/** Apply `fn` to the active session and bump its updatedAt. */
function patchActive(
	state: AIPanelState,
	fn: (session: AIChatSession) => AIChatSession,
): Partial<AIPanelState> {
	const { activeSessionId, sessions } = state;
	if (!activeSessionId) return {};
	return {
		sessions: sessions.map((s) => (s.id === activeSessionId ? { ...fn(s), updatedAt: Date.now() } : s)),
	};
}

export const useAIPanelStore = create<AIPanelState>()(
	persist(
		(set, get) => ({
			isOpen: false,
			width: AI_DEFAULT_WIDTH,
			isMaximized: false,

			open: () => set({ isOpen: true }),
			close: () => set({ isOpen: false, isMaximized: false }),
			toggle: () => set((s) => ({ isOpen: !s.isOpen, isMaximized: s.isOpen ? false : s.isMaximized })),
			setWidth: (width) => set({ width: clampPanelWidth(width) }),
			toggleMaximized: () => set((s) => ({ isMaximized: !s.isMaximized })),

			sessions: [],
			activeSessionId: null,
			isStreaming: false,

			newSession: () => {
				const id = makeId();
				set((s) => ({
					sessions: [{ id, title: "New chat", messages: [], updatedAt: Date.now() }, ...s.sessions],
					activeSessionId: id,
				}));
				return id;
			},

			selectSession: (id) => set({ activeSessionId: id }),

			deleteSession: (id) =>
				set((s) => {
					const sessions = s.sessions.filter((x) => x.id !== id);
					return {
						sessions,
						// Deleting the open conversation falls back to the next most recent
						// rather than leaving the panel pointed at nothing.
						activeSessionId: s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId,
					};
				}),

			addUserMessage: (content, attachments) => {
				// Typing into an empty panel implicitly starts a conversation, so the
				// user never has to press "new chat" before their first question.
				if (!get().activeSessionId) get().newSession();
				set((s) =>
					patchActive(s, (session) => ({
						...session,
						// Attachments alone can start a turn ("here, read this"), so the
						// title falls back to the file name rather than being blank.
						title:
							session.messages.length === 0
								? titleFrom(content || attachments?.[0]?.name || "Document")
								: session.title,
						messages: [
							...session.messages,
							{
								id: makeId(),
								role: "user" as const,
								content,
								createdAt: Date.now(),
								...(attachments?.length ? { attachments } : {}),
							},
						],
					})),
				);
			},

			addAssistantPlaceholder: () =>
				set((s) =>
					patchActive(s, (session) => ({
						...session,
						messages: [
							...session.messages,
							{ id: makeId(), role: "assistant" as const, content: "", createdAt: Date.now() },
						],
					})),
				),

			appendToLastAssistant: (chunk) =>
				set((s) =>
					patchActive(s, (session) => {
						const messages = [...session.messages];
						const last = messages[messages.length - 1];
						if (!last || last.role !== "assistant") return session;
						messages[messages.length - 1] = { ...last, content: last.content + chunk };
						return { ...session, messages };
					}),
				),

			/**
			 * Attach a control to the assistant message in flight.
			 *
			 * Deduped by href: a tool round can re-run within one turn, and two identical
			 * "Open cover letter" buttons under one reply is a bug the user has to reason
			 * about ("did it make two?").
			 */
			addActionToLastAssistant: (action) =>
				set((s) =>
					patchActive(s, (session) => {
						const messages = [...session.messages];
						const last = messages[messages.length - 1];
						if (!last || last.role !== "assistant") return session;
						const existing = last.actions ?? [];
						if (existing.some((a) => a.href === action.href)) return session;
						messages[messages.length - 1] = { ...last, actions: [...existing, action] };
						return { ...session, messages };
					}),
				),

			replaceLastAssistant: (content) =>
				set((s) =>
					patchActive(s, (session) => {
						const messages = [...session.messages];
						const last = messages[messages.length - 1];
						if (!last || last.role !== "assistant") return session;
						messages[messages.length - 1] = { ...last, content };
						return { ...session, messages };
					}),
				),

			setStreaming: (isStreaming) => set({ isStreaming }),
		}),
		{
			name: "shipithq.ai-panel",
			storage: createJSONStorage(() => localStorage),
			// `isOpen`/`isStreaming` are deliberately NOT persisted: reopening the app
			// into a panel you don't remember opening is disorienting, and a persisted
			// `isStreaming: true` would leave the composer permanently disabled after a
			// refresh mid-response.
			partialize: (s) => ({
				width: s.width,
				sessions: s.sessions.slice(0, 30),
				activeSessionId: s.activeSessionId,
			}),
		},
	),
);
