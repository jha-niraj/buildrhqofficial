"use client";

/**
 * The public KnowMe surface: a stranger asking about someone else.
 *
 * The conversation itself is `KnowMeChat`, shared with the owner's dashboard, so
 * the two cannot drift again (KM-8). What is specific here is everything AROUND
 * it - whose profile this is, what the visitor is allowed to know, how many
 * questions they have left, and the standing reminder that they are talking to a
 * model rather than to the person.
 *
 * Full-height, one scroller. It was a centred 400px box on a page that also
 * scrolled, which meant a long answer scrolled inside a small window while the
 * window itself scrolled inside the page.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, ArrowLeft, Share2, Check, Sparkles } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Avatar, AvatarFallback, AvatarImage
} from "@repo/ui/components/ui/avatar";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import type { KnowMeProfilePublic } from "@/types/knowme";
import {
    getOrCreateChatSession, sendChatMessage, submitMessageFeedback,
} from "@/actions/(main)/knowme";
import { KnowMeChat, type KnowMeChatMessage } from "@/components/knowme/knowme-chat";

interface PublicChatInterfaceProps {
    profile: KnowMeProfilePublic;
    /**
     * Whether the VIEWER has a session. Links into the app - the owner's
     * profile, "contact them directly" - all sit behind CR-10's session gate, so
     * offering them to an anonymous visitor only leads to a sign-in wall.
     */
    viewerSignedIn: boolean;
}

function OwnerMark({ image, name, className }: { image?: string | null; name: string; className?: string }) {
    if (image) {
        return (
            <Avatar className={cn("shrink-0", className)}>
                <AvatarImage src={image} alt="" />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
        );
    }
    return (
        <span
            className={cn(
                "flex shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                className,
            )}
        >
            <Bot className="h-[60%] w-[60%]" />
        </span>
    );
}

export default function PublicChatInterface({ profile, viewerSignedIn }: PublicChatInterfaceProps) {
    const [messages, setMessages] = useState<KnowMeChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const userName = profile.user.name || profile.user.username || "this person";
    const suggestedQuestions = profile.suggestedQuestions.length > 0
        ? profile.suggestedQuestions
        : [
            "What are your technical skills?",
            "Tell me about your projects",
            "What is your experience?",
            "What are you looking for next?",
        ];

    useEffect(() => {
        async function initSession() {
            const result = await getOrCreateChatSession(profile.id);
            if (result.success && result.data) {
                setSessionId(result.data.id);
                setRateLimitRemaining(result.data.rateLimitRemaining);
                if (result.data.messages.length > 0) {
                    setMessages(result.data.messages.map((m) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        sources: m.sources || undefined,
                        wasHelpful: m.wasHelpful,
                        createdAt: m.createdAt,
                    })));
                }
            }
        }
        initSession();
    }, [profile.id]);

    const handleSend = useCallback(async (text: string) => {
        if (!sessionId) return;

        if (rateLimitRemaining !== null && rateLimitRemaining <= 0) {
            toast.error("You have used every question in this session. Try again later.");
            return;
        }

        setMessages((prev) => [...prev, {
            id: `local-${Date.now()}`,
            role: "user",
            content: text,
            createdAt: new Date(),
        }]);
        setIsLoading(true);

        try {
            const result = await sendChatMessage(sessionId, text);
            if (result.success && result.answer) {
                setMessages((prev) => [...prev, {
                    // The server's id, when it gives one. Feedback posts against this
                    // id, and a `Date.now()` placeholder would silently write nothing.
                    id: result.messageId ?? `local-${Date.now() + 1}`,
                    role: "assistant",
                    content: result.answer as string,
                    sources: result.sources,
                    wasHelpful: null,
                    createdAt: new Date(),
                }]);
                if (result.rateLimit) setRateLimitRemaining(result.rateLimit.remaining);
            } else {
                toast.error(result.error || "Failed to get a response");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, rateLimitRemaining]);

    const handleFeedback = useCallback(async (messageId: string, helpful: boolean) => {
        // Optimistic, then reverted if the write fails. Leaving the buttons live
        // while the request is in flight let the same message be rated twice.
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, wasHelpful: helpful } : m)));
        try {
            const result = await submitMessageFeedback(messageId, helpful);
            if (!result?.success) throw new Error(result?.error || "failed");
            toast.success("Thanks for the feedback");
        } catch {
            setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, wasHelpful: null } : m)));
            toast.error("Could not save that feedback");
        }
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto flex h-dvh min-h-0 w-full max-w-5xl flex-col px-4 py-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex shrink-0 items-center justify-between gap-3"
            >
                {viewerSignedIn ? (
                    <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
                        <Link href={`/profile/${profile.user.username}`}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to profile
                        </Link>
                    </Button>
                ) : (
                    // A stranger has nothing to go "back" to. What they get instead is
                    // who is answering them and where the answer comes from - this page
                    // has no other chrome now that it is outside the app shell.
                    <Link
                        href="/"
                        className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-neutral-900 dark:text-white"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                            <Bot className="h-3.5 w-3.5" />
                        </span>
                        ShipItHQ
                    </Link>
                )}
                {!viewerSignedIn && (
                    <Button asChild variant="outline" size="sm">
                        <Link href="/register">Make your own</Link>
                    </Button>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto flex w-full min-h-0 max-w-4xl flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-6 dark:border-neutral-800">
                    <div className="flex min-w-0 items-center gap-3">
                        <OwnerMark image={profile.user.image} name={userName} className="h-10 w-10 rounded-lg" />
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                                {userName}&apos;s AI
                            </h1>
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                {profile.user.occupation || "Ask about skills, projects and experience"}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <Badge variant="secondary" className="hidden gap-1.5 text-xs sm:inline-flex">
                            <Sparkles className="h-3 w-3" />
                            KnowMe
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copy link to this chat">
                            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col">
                    <KnowMeChat
                        messages={messages}
                        isLoading={isLoading}
                        onSend={handleSend}
                        disabled={!sessionId}
                        suggestions={suggestedQuestions}
                        onFeedback={handleFeedback}
                        mark={<OwnerMark image={profile.user.image} name={userName} className="h-5 w-5 rounded" />}
                        emptyMark={<OwnerMark image={profile.user.image} name={userName} className="h-14 w-14 rounded-xl" />}
                        assistantName={`${userName}'s AI`}
                        emptyTitle={`Ask about ${userName}`}
                        emptyHint={
                            profile.welcomeMessage ||
                            `This assistant answers from ${userName}'s own work. It will say so when it does not know.`
                        }
                        placeholder={`Ask about ${userName}...`}
                        footer={
                            <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                                <span>
                                    {rateLimitRemaining === null
                                        ? "Enter to send"
                                        : `${rateLimitRemaining} question${rateLimitRemaining === 1 ? "" : "s"} left in this session`}
                                </span>
                                <span aria-hidden>·</span>
                                <span>
                                    AI answers, not {userName}.
                                    {viewerSignedIn && (
                                        <>
                                            {" "}
                                            <Link
                                                href={`/profile/${profile.user.username}`}
                                                className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-white"
                                            >
                                                Contact them directly
                                            </Link>
                                        </>
                                    )}
                                </span>
                            </span>
                        }
                    />
                </div>
            </motion.div>
        </div>
    );
}
