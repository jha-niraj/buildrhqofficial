"use client"

import { useEffect, useRef, useState } from "react"
import { Send, X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { cn } from "@repo/ui/lib/utils"
import { COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH } from "@/types/comments"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface CommentComposerProps {
    onSubmit: (body: string) => Promise<void>
    onCancel?: () => void
    placeholder?: string
    submitLabel?: string
    /** Pre-fills the box - used by the edit flow. */
    initialValue?: string
    autoFocus?: boolean
    compact?: boolean
}

/**
 * The single text-entry surface for the comment system: root composer, reply box
 * and edit box are all this component with different labels. Enforces the same
 * length bounds the server does, so Submit is never enabled for input that is
 * going to bounce.
 */
export function CommentComposer({
    onSubmit,
    onCancel,
    placeholder = "Add a comment…",
    submitLabel = "Comment",
    initialValue = "",
    autoFocus = false,
    compact = false,
}: CommentComposerProps) {
    const [value, setValue] = useState(initialValue)
    const [submitting, setSubmitting] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (autoFocus) {
            const timer = setTimeout(() => textareaRef.current?.focus(), 60)
            return () => clearTimeout(timer)
        }
    }, [autoFocus])

    const trimmed = value.trim()
    const tooShort = trimmed.length < COMMENT_MIN_LENGTH
    const tooLong = trimmed.length > COMMENT_MAX_LENGTH
    const canSubmit = !tooShort && !tooLong && !submitting

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSubmitting(true)
        try {
            await onSubmit(trimmed)
            // Only clear on success - a rejected comment keeps the user's text so
            // they can fix it rather than retype it.
            setValue("")
        } finally {
            setSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            void handleSubmit()
        }
        if (e.key === "Escape" && onCancel) {
            e.preventDefault()
            onCancel()
        }
    }

    // Only warn near the ceiling - a counter on an empty box is noise.
    const showCounter = trimmed.length > COMMENT_MAX_LENGTH - 200

    return (
        <div className={cn("w-full", compact ? "space-y-1.5" : "space-y-2")}>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={compact ? 2 : 3}
                disabled={submitting}
                className="resize-none text-sm"
            />
            <div className="flex items-center justify-between gap-2">
                <span className={cn(
                    "text-xs",
                    tooLong ? "text-red-500" : "text-neutral-600 dark:text-neutral-400",
                )}>
                    {showCounter
                        ? `${trimmed.length} / ${COMMENT_MAX_LENGTH}`
                        : "⌘/Ctrl + Enter to post"}
                </span>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleSubmit()}
                        disabled={!canSubmit}
                        className="bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
                    >
                        {submitting ? (
                            <><InlineLoader size="sm" className="mr-1" />Posting…</>
                        ) : (
                            <><Send className="h-3.5 w-3.5 mr-1" />{submitLabel}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CommentComposer
