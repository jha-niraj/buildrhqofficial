"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, Loader2, LogIn } from "lucide-react"
import { useSession } from "@repo/auth/client"
import { Button } from "@repo/ui/components/ui/button"
import toast from "@repo/ui/components/ui/sonner"
import { cn } from "@repo/ui/lib/utils"
import {
    getComments, addComment, updateComment, deleteComment,
} from "@/actions/(main)/comments.action"
import type {
    CommentEntityType, CommentNode, OptimisticCommentNode,
} from "@/types/comments"
import { CommentComposer } from "./comment-composer"
import { CommentItem } from "./comment-item"

interface CommentThreadProps {
    entityType: CommentEntityType
    entityId: string
    /** Seed for the header count so it doesn't flash 0 while the thread loads. */
    initialCount?: number
    /** Called whenever the live count changes, so a parent can update its card badge. */
    onCountChange?: (count: number) => void
    className?: string
}

// ── Tree helpers ──────────────────────────────────────────────────────────────
// The thread is held as a tree, so every mutation is a recursive rewrite. Each
// helper returns new nodes rather than mutating, so React sees a changed
// reference and re-renders.

function insertNode(
    nodes: OptimisticCommentNode[],
    parentId: string | null,
    node: OptimisticCommentNode,
): OptimisticCommentNode[] {
    if (parentId === null) return [node, ...nodes]
    return nodes.map((n) =>
        n.id === parentId
            ? { ...n, replies: [...n.replies, node] }
            : { ...n, replies: insertNode(n.replies, parentId, node) },
    )
}

function replaceNode(
    nodes: OptimisticCommentNode[],
    targetId: string,
    replacement: OptimisticCommentNode,
): OptimisticCommentNode[] {
    return nodes.map((n) =>
        n.id === targetId
            // Keep the replies already under the optimistic node - the server's
            // response is a fresh comment and always carries an empty replies array.
            ? { ...replacement, replies: n.replies }
            : { ...n, replies: replaceNode(n.replies, targetId, replacement) },
    )
}

function patchNode(
    nodes: OptimisticCommentNode[],
    targetId: string,
    patch: Partial<OptimisticCommentNode>,
): OptimisticCommentNode[] {
    return nodes.map((n) =>
        n.id === targetId
            ? { ...n, ...patch }
            : { ...n, replies: patchNode(n.replies, targetId, patch) },
    )
}

function removeNode(nodes: OptimisticCommentNode[], targetId: string): OptimisticCommentNode[] {
    return nodes
        .filter((n) => n.id !== targetId)
        .map((n) => ({ ...n, replies: removeNode(n.replies, targetId) }))
}

/**
 * Generic threaded comment UI. Drop it under any entity:
 *
 *   <CommentThread entityType="PROJECT_IDEA" entityId={idea.id} />
 *
 * Reading never requires an account - a logged-out visitor gets the full thread
 * and a sign-in prompt where the composer would be.
 */
export function CommentThread({
    entityType, entityId, initialCount = 0, onCountChange, className,
}: CommentThreadProps) {
    const { data: session, isPending: sessionPending } = useSession()
    const isLoggedIn = !!session?.user

    const [nodes, setNodes] = useState<OptimisticCommentNode[]>([])
    const [count, setCount] = useState(initialCount)
    const [loading, setLoading] = useState(true)

    const applyCount = useCallback((next: number | undefined) => {
        if (typeof next !== "number") return
        setCount(next)
        onCountChange?.(next)
    }, [onCountChange])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getComments(entityType, entityId)
            if (result.success && result.data) {
                setNodes(result.data as OptimisticCommentNode[])
                applyCount(result.count)
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch {
            toast.error("Couldn't load comments")
        } finally {
            setLoading(false)
        }
    }, [entityType, entityId, applyCount])

    useEffect(() => { void load() }, [load])

    // ── Optimistic insert ─────────────────────────────────────────────────────
    // The comment appears immediately under a temporary id, then the server's real
    // row replaces it. On failure the placeholder is removed and the toast explains
    // why - the text is still in the composer, which does not clear on rejection.
    const submit = useCallback(async (parentId: string | null, body: string) => {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const now = new Date()

        const optimistic: OptimisticCommentNode = {
            id: tempId,
            entityType,
            entityId,
            parentId,
            body,
            isDeleted: false,
            isEdited: false,
            createdAt: now,
            updatedAt: now,
            author: {
                id: session?.user?.id ?? "",
                name: session?.user?.name ?? "You",
                image: session?.user?.image ?? null,
            },
            isMine: true,
            replies: [],
            pending: true,
        }

        setNodes((prev) => insertNode(prev, parentId, optimistic))
        setCount((c) => c + 1)

        const result = await addComment({ entityType, entityId, parentId, body })

        if (!result.success || !result.data) {
            setNodes((prev) => removeNode(prev, tempId))
            setCount((c) => Math.max(c - 1, 0))
            toast.error(result.error ?? "Failed to post comment")
            // Rethrow so the composer keeps the text instead of clearing it.
            throw new Error(result.error ?? "Failed to post comment")
        }

        setNodes((prev) => replaceNode(prev, tempId, { ...(result.data as CommentNode), pending: false }))
        applyCount(result.count)
    }, [entityType, entityId, session, applyCount])

    const handleRootSubmit = useCallback((body: string) => submit(null, body), [submit])
    const handleReply = useCallback((parentId: string, body: string) => submit(parentId, body), [submit])

    const handleEdit = useCallback(async (id: string, body: string) => {
        // Optimistic text swap, reverted from the server response either way.
        const previous = nodes
        setNodes((prev) => patchNode(prev, id, { body, isEdited: true }))

        const result = await updateComment(id, body)
        if (!result.success || !result.data) {
            setNodes(previous)
            toast.error(result.error ?? "Failed to update comment")
            throw new Error(result.error ?? "Failed to update comment")
        }
        setNodes((prev) => patchNode(prev, id, {
            body: result.data!.body,
            isEdited: result.data!.isEdited,
            updatedAt: result.data!.updatedAt,
        }))
    }, [nodes])

    const handleDelete = useCallback(async (id: string) => {
        // Soft delete on the server, so the node stays put and becomes a tombstone -
        // its replies must remain visible and readable.
        const result = await deleteComment(id)
        if (!result.success) {
            toast.error(result.error ?? "Failed to delete comment")
            return
        }
        setNodes((prev) => patchNode(prev, id, { isDeleted: true, body: "" }))
        applyCount(result.count)
        toast.success("Comment deleted")
    }, [applyCount])

    return (
        <section className={cn("w-full", className)}>
            <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {count === 1 ? "1 Comment" : `${count} Comments`}
                </h3>
            </div>

            {sessionPending ? (
                <div className="h-24 rounded-xl border border-neutral-200 dark:border-neutral-800 animate-pulse" />
            ) : isLoggedIn ? (
                <CommentComposer onSubmit={handleRootSubmit} />
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 px-4 py-3">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Sign in to join the discussion.
                    </p>
                    <Button asChild size="sm" className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shrink-0">
                        <Link href="/signin">
                            <LogIn className="h-3.5 w-3.5 mr-1.5" />
                            Sign in
                        </Link>
                    </Button>
                </div>
            )}

            <div className="mt-3">
                {loading ? (
                    <div className="flex items-center justify-center py-8 text-neutral-400">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Loading comments…</span>
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="py-8 text-center">
                        <MessageSquare className="h-6 w-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            No comments yet.{isLoggedIn ? " Be the first." : ""}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                        {nodes.map((node) => (
                            <CommentItem
                                key={node.id}
                                comment={node}
                                depth={0}
                                canReply={isLoggedIn}
                                onReply={handleReply}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default CommentThread
