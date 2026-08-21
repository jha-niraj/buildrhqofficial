"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, Send, ArrowLeft, User, ThumbsUp, ThumbsDown, ExternalLink,
    Sparkles, MessageSquare, Info, Loader2, Share2, Check
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Avatar, AvatarFallback, AvatarImage
} from "@repo/ui/components/ui/avatar";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import type {
    KnowMeProfilePublic, ChatMessageSource
} from "@/types/knowme";
import {
    getOrCreateChatSession, sendChatMessage, submitMessageFeedback,
} from "@/actions/(main)/knowme";

interface PublicChatInterfaceProps {
    profile: KnowMeProfilePublic;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources?: ChatMessageSource[];
    wasHelpful?: boolean | null;
    createdAt: Date;
}

export default function PublicChatInterface({ profile }: PublicChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [rateLimitRemaining, setRateLimitRemaining] = useState(20);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userName = profile.user.name || profile.user.username || "User";
    const suggestedQuestions = profile.suggestedQuestions.length > 0
        ? profile.suggestedQuestions
        : [
            "What are your technical skills?",
            "Tell me about your projects",
            "What's your experience?",
        ];

    // Initialize chat session
    useEffect(() => {
        async function initSession() {
            const result = await getOrCreateChatSession(profile.id);
            if (result.success && result.data) {
                setSessionId(result.data.id);
                setRateLimitRemaining(result.data.rateLimitRemaining);
                // Load existing messages
                if (result.data.messages.length > 0) {
                    setMessages(result.data.messages.map(m => ({
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (question?: string) => {
        const messageText = question || inputValue.trim();
        if (!messageText || isLoading || !sessionId) return;

        if (rateLimitRemaining <= 0) {
            toast.error("Rate limit reached. Please try again later.");
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: messageText,
            createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const result = await sendChatMessage(sessionId, messageText);

            if (result.success && result.answer) {
                const aiMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: result.answer,
                    sources: result.sources,
                    wasHelpful: null,
                    createdAt: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
                if (result.rateLimit) {
                    setRateLimitRemaining(result.rateLimit.remaining);
                }
            } else {
                toast.error(result.error || "Failed to get response");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (messageId: string, helpful: boolean) => {
        try {
            await submitMessageFeedback(messageId, helpful);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId ? { ...m, wasHelpful: helpful } : m
                )
            );
            toast.success("Thanks for your feedback!");
        } catch {
            toast.error("Failed to submit feedback");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8">
            <div className="w-full max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <Link href={`/profile/${profile.user.username}`}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Profile
                        </Button>
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-xl"
                >
                    <div className="p-6 border-b border-slate-200 dark:border-neutral-800 bg-gradient-to-r from-slate-50 to-white dark:from-neutral-800/50 dark:to-neutral-900">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-14 h-14 border-2 border-white dark:border-neutral-700 shadow-lg">
                                    <AvatarImage src={profile.user.image || undefined} />
                                    <AvatarFallback className="text-lg">
                                        {userName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Chat with {userName}&apos;s AI
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {profile.user.occupation || "Ask about skills, projects & experience"}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                                {
                                    copied ? (
                                        <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                    ) : (
                                        <Share2 className="w-4 h-4" />
                                    )
                                }
                            </Button>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1.5 text-xs">
                                <Sparkles className="w-3 h-3" />
                                Powered by KnowMe
                            </Badge>
                        </div>
                    </div>

                    {
                        messages.length === 0 && (
                            <div className="p-6 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Suggested questions:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {
                                        suggestedQuestions.slice(0, 4).map((question, index) => (
                                            <motion.button
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => handleSendMessage(question)}
                                                disabled={isLoading}
                                                className="px-4 py-2 text-sm bg-white dark:bg-neutral-700 text-slate-700 dark:text-slate-200 rounded-full border border-slate-200 dark:border-neutral-600 hover:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-all"
                                            >
                                                {question}
                                            </motion.button>
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }

                    <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-slate-50/50 dark:from-neutral-900 dark:to-neutral-900">
                        {
                            messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center mb-4">
                                        <Bot className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                        Hi! I&apos;m {userName}&apos;s AI assistant
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                                        {profile.welcomeMessage || `Ask me anything about ${userName}'s skills, projects, and experience.`}
                                    </p>
                                </div>
                            )
                        }

                        <AnimatePresence>
                            {
                                messages.map((message, index) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "flex gap-3",
                                            message.role === "user" && "justify-end"
                                        )}
                                    >
                                        {
                                            message.role === "assistant" && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            )
                                        }
                                        <div className={cn("max-w-[80%] space-y-2")}>
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-4 py-3",
                                                    message.role === "user"
                                                        ? "bg-neutral-800 text-white rounded-tr-none"
                                                        : "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white rounded-tl-none shadow-sm border border-slate-200 dark:border-neutral-700"
                                                )}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            </div>
                                            {
                                                message.sources && message.sources.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 px-1">
                                                        {
                                                            message.sources.slice(0, 3).map((source, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="secondary"
                                                                    className="text-xs gap-1"
                                                                >
                                                                    {
                                                                        source.url ? (
                                                                            <Link href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                                {source.title}
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </Link>
                                                                        ) : (
                                                                            source.title
                                                                        )
                                                                    }
                                                                </Badge>
                                                            ))
                                                        }
                                                    </div>
                                                )
                                            }
                                            {
                                                message.role === "assistant" && message.wasHelpful === null && (
                                                    <div className="flex items-center gap-2 px-1">
                                                        <span className="text-xs text-slate-500">Was this helpful?</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleFeedback(message.id, true)}
                                                        >
                                                            <ThumbsUp className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => handleFeedback(message.id, false)}
                                                        >
                                                            <ThumbsDown className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )
                                            }
                                            {
                                                message.role === "assistant" && message.wasHelpful !== null && (
                                                    <p className="text-xs text-slate-400 px-1">
                                                        {message.wasHelpful ? "👍 Helpful" : "👎 Not helpful"}
                                                    </p>
                                                )
                                            }
                                        </div>
                                        {
                                            message.role === "user" && (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                                </div>
                                            )
                                        }
                                    </motion.div>
                                ))
                            }
                        </AnimatePresence>

                        {
                            isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-neutral-700">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }

                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex gap-3"
                        >
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={`Ask ${userName} anything...`}
                                className="flex-1 rounded-xl"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700"
                            >
                                {
                                    isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )
                                }
                            </Button>
                        </form>
                        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                            <span>Questions remaining: {rateLimitRemaining}</span>
                            <Link href={`/profile/${profile.user.username}`} className="flex items-center gap-1 hover:text-neutral-800">
                                <Info className="w-3 h-3" />
                                View full profile
                            </Link>
                        </div>
                    </div>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-xs text-slate-400 mt-4"
                >
                    This is an AI assistant. For detailed discussions,{" "}
                    <Link href={`/profile/${profile.user.username}`} className="text-neutral-900 dark:text-neutral-100 hover:underline">
                        contact {userName} directly
                    </Link>
                    .
                </motion.p>
            </div>
        </div>
    );
}