"use client"

import { useState } from "react"
import {
    MessageSquare, Pencil, Trash2, MoreHorizontal,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Button } from "@repo/ui/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import { cn } from "@repo/ui/lib/utils"
import { CommentComposer } from "./comment-composer"
import { COMMENT_MAX_INDENT_DEPTH } from "@/types/comments"
import type { OptimisticCommentNode } from "@/types/comments"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface CommentItemProps {
    comment: OptimisticCommentNode
    depth: number
    canReply: boolean
    onReply: (parentId: string, body: string) => Promise<void>
    onEdit: (id: string, body: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

function initials(name: string | null): string {
    if (!name) return "?"
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

/** "just now" / "3h" / "12 Mar" - compact enough for a dense thread. */
function timeAgo(date: Date | string): string {
    const then = new Date(date).getTime()
    const seconds = Math.floor((Date.now() - then) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function CommentItem({
    comment, depth, canReply, onReply, onEdit, onDelete,
}: CommentItemProps) {
    const [replying, setReplying] = useState(false)
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Indentation stops after COMMENT_MAX_INDENT_DEPTH levels. Nesting in the DATA
    // stays unlimited - this is purely so a 12-deep thread doesn't slide off a
    // phone screen. Deeper replies still render, just flush with their ancestor.
    const isIndented = depth > 0 && depth <= COMMENT_MAX_INDENT_DEPTH

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(comment.id)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div
            className={cn(
                "relative",
                isIndented && "pl-4 sm:pl-6 border-l border-neutral-200 dark:border-neutral-800",
                comment.pending && "opacity-60",
            )}
        >
            <div className="flex gap-2.5 py-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                    {comment.author.image && (
                        <AvatarImage src={comment.author.image} alt={comment.author.name ?? "User"} />
                    )}
                    <AvatarFallback className="text-xs bg-neutral-100 dark:bg-neutral-800">
                        {initials(comment.author.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {comment.author.name ?? "Anonymous"}
                        </span>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0">
                            {timeAgo(comment.createdAt)}
                        </span>
                        {comment.isEdited && !comment.isDeleted && (
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0">· edited</span>
                        )}
                        {comment.failed && (
                            <span className="text-xs text-red-500 shrink-0">· failed to post</span>
                        )}
                    </div>

                    {editing ? (
                        <div className="mt-1.5">
                            <CommentComposer
                                compact
                                autoFocus
                                initialValue={comment.body}
                                submitLabel="Save"
                                onCancel={() => setEditing(false)}
                                onSubmit={async (body) => {
                                    await onEdit(comment.id, body)
                                    setEditing(false)
                                }}
                            />
                        </div>
                    ) : comment.isDeleted ? (
                        // Tombstone. The row survives so its replies keep their place in
                        // the thread; the server never sent us the original body.
                        <p className="mt-0.5 text-sm italic text-neutral-600 dark:text-neutral-400">
                            This comment was deleted
                        </p>
                    ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                            {comment.body}
                        </p>
                    )}

                    {!editing && (
                        <div className="mt-1 flex items-center gap-1">
                            {canReply && !comment.pending && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900"
                                    onClick={() => setReplying((v) => !v)}
                                >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Reply
                                </Button>
                            )}
                            {comment.isMine && !comment.isDeleted && !comment.pending && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                            aria-label="Comment actions"
                                        >
                                            {deleting
                                                ? <InlineLoader size="sm" />
                                                : <MoreHorizontal className="h-3.5 w-3.5" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-36">
                                        <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer text-xs">
                                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => void handleDelete()}
                                            className="cursor-pointer text-xs text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}

                    {replying && (
                        <div className="mt-2">
                            <CommentComposer
                                compact
                                autoFocus
                                placeholder={`Reply to ${comment.author.name ?? "this comment"}…`}
                                submitLabel="Reply"
                                onCancel={() => setReplying(false)}
                                onSubmit={async (body) => {
                                    await onReply(comment.id, body)
                                    setReplying(false)
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {comment.replies.length > 0 && (
                <div className={cn(!isIndented && depth > 0 && "pl-0")}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            canReply={canReply}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentItem
