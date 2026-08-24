"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface AIChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: number
}

export interface AIChatSession {
    id: string
    title: string
    messages: AIChatMessage[]
    updatedAt: number
}

// Bounds, not preferences - ported from apps/main's app/store/aiPanelStore.ts.
// Below MIN the composer and bubbles stop being usable; above MAX the panel
// eats the page it's meant to assist with.
export const AI_MIN_WIDTH = 360
export const AI_MAX_WIDTH = 900
export const AI_DEFAULT_WIDTH = 460

export function clampPanelWidth(width: number): number {
    return Math.min(Math.max(width, AI_MIN_WIDTH), AI_MAX_WIDTH)
}

interface AIPanelState {
    isOpen: boolean
    width: number
    isMaximized: boolean
    open: () => void
    close: () => void
    toggle: () => void
    setWidth: (width: number) => void
    toggleMaximized: () => void

    sessions: AIChatSession[]
    activeSessionId: string | null
    isStreaming: boolean

    newSession: () => string
    selectSession: (id: string) => void
    deleteSession: (id: string) => void
    addUserMessage: (content: string) => void
    addAssistantPlaceholder: () => void
    appendToLastAssistant: (chunk: string) => void
    replaceLastAssistant: (content: string) => void
    setStreaming: (streaming: boolean) => void
}

function makeId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function titleFrom(content: string): string {
    const firstLine = content.trim().split("\n")[0] ?? ""
    return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine || "New chat"
}

function patchActive(state: AIPanelState, fn: (session: AIChatSession) => AIChatSession): Partial<AIPanelState> {
    const { activeSessionId, sessions } = state
    if (!activeSessionId) return {}
    return { sessions: sessions.map((s) => (s.id === activeSessionId ? { ...fn(s), updatedAt: Date.now() } : s)) }
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
                const id = makeId()
                set((s) => ({
                    sessions: [{ id, title: "New chat", messages: [], updatedAt: Date.now() }, ...s.sessions],
                    activeSessionId: id,
                }))
                return id
            },

            selectSession: (id) => set({ activeSessionId: id }),

            deleteSession: (id) =>
                set((s) => {
                    const sessions = s.sessions.filter((x) => x.id !== id)
                    return {
                        sessions,
                        activeSessionId: s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId,
                    }
                }),

            addUserMessage: (content) => {
                if (!get().activeSessionId) get().newSession()
                set((s) =>
                    patchActive(s, (session) => ({
                        ...session,
                        title: session.messages.length === 0 ? titleFrom(content) : session.title,
                        messages: [...session.messages, { id: makeId(), role: "user" as const, content, createdAt: Date.now() }],
                    })),
                )
            },

            addAssistantPlaceholder: () =>
                set((s) =>
                    patchActive(s, (session) => ({
                        ...session,
                        messages: [...session.messages, { id: makeId(), role: "assistant" as const, content: "", createdAt: Date.now() }],
                    })),
                ),

            appendToLastAssistant: (chunk) =>
                set((s) =>
                    patchActive(s, (session) => {
                        const messages = [...session.messages]
                        const last = messages[messages.length - 1]
                        if (!last || last.role !== "assistant") return session
                        messages[messages.length - 1] = { ...last, content: last.content + chunk }
                        return { ...session, messages }
                    }),
                ),

            replaceLastAssistant: (content) =>
                set((s) =>
                    patchActive(s, (session) => {
                        const messages = [...session.messages]
                        const last = messages[messages.length - 1]
                        if (!last || last.role !== "assistant") return session
                        messages[messages.length - 1] = { ...last, content }
                        return { ...session, messages }
                    }),
                ),

            setStreaming: (isStreaming) => set({ isStreaming }),
        }),
        {
            // Namespaced separately from apps/main's `shipithq.ai-panel`, so a
            // browser signed into both apps never merges an admin's console
            // conversations with their own student-app chat history.
            name: "shipithq-admin.ai-panel",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ width: s.width, sessions: s.sessions.slice(0, 30), activeSessionId: s.activeSessionId }),
        },
    ),
)
