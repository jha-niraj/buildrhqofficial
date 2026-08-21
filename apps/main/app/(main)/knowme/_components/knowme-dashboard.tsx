"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, Send, Settings, BarChart3, Share2, Key, RefreshCw, Copy, Check,
    ExternalLink, MessageSquare, Zap, Github, FileText, ToggleLeft,
    ToggleRight, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import {
    Avatar, AvatarFallback, AvatarImage
} from "@repo/ui/components/ui/avatar";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import type { KnowMeProfileFull } from "@/types/knowme";
import {
    sendChatMessage, getOrCreateChatSession, triggerManualUpdate
} from "@/actions/(main)/knowme";
import { formatRelativeDate } from "@/utils/knowme";

interface KnowMeDashboardProps {
    profile: KnowMeProfileFull;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
}

export default function KnowMeDashboard({ profile }: KnowMeDashboardProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://shipithq.com"}/knowme/${profile.user.username}`;

    // Initialize chat session
    useEffect(() => {
        async function initSession() {
            const result = await getOrCreateChatSession(profile.id);
            if (result.success && result.data) {
                setSessionId(result.data.id);
                // Load existing messages
                if (result.data.messages.length > 0) {
                    setMessages(result.data.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
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

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !sessionId) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue.trim(),
            createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const result = await sendChatMessage(sessionId, inputValue.trim());

            if (result.success && result.answer) {
                const aiMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: result.answer,
                    createdAt: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
            } else {
                toast.error(result.error || "Failed to get response");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleManualUpdate = async () => {
        setIsUpdating(true);
        try {
            const result = await triggerManualUpdate();
            if (result.success) {
                toast.success("Knowledge base updated successfully!");
            } else {
                toast.error(result.error || "Failed to update");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center shadow-lg shadow-neutral-900/25">
                            <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                KnowMe Dashboard
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Manage your AI-powered portfolio assistant
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/knowme/analytics">
                            <Button variant="outline" className="gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Analytics
                            </Button>
                        </Link>
                        <Link href="/knowme/settings">
                            <Button variant="outline" className="gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
            <div className="grid lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            Test Your AI
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            See how your AI responds to questions
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={profile.status === "ACTIVE" ? "default" : "secondary"}
                                    className={cn(
                                        "gap-1",
                                        profile.status === "ACTIVE" && "bg-neutral-900/10 text-neutral-800 dark:text-neutral-100 border-neutral-900/20"
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {profile.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white dark:from-neutral-900 dark:to-neutral-900">
                            {
                                messages.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                                            <MessageSquare className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 mb-2">
                                            No messages yet
                                        </p>
                                        <p className="text-sm text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
                                            Try asking about your skills, projects, or experience
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
                                            <div
                                                className={cn(
                                                    "max-w-[80%] rounded-2xl px-4 py-3",
                                                    message.role === "user"
                                                        ? "bg-neutral-800 text-white rounded-tr-none"
                                                        : "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white rounded-tl-none shadow-sm border border-slate-200 dark:border-neutral-700"
                                                )}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            </div>
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
                                    placeholder="Ask a question about yourself..."
                                    className="flex-1 rounded-xl"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-800 hover:from-neutral-700 hover:to-neutral-700"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualUpdate}
                            disabled={isUpdating}
                            className="gap-2"
                        >
                            <RefreshCw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
                            {isUpdating ? "Updating..." : "Update Knowledge Base"}
                        </Button>
                        <Link href={profileUrl} target="_blank">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Preview Public Page
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Status
                                </span>
                                <Badge className="bg-neutral-900/10 text-neutral-800 dark:text-neutral-200 border-neutral-900/20">
                                    Active
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Last updated
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {
                                        profile.lastUpdatedAt
                                            ? formatRelativeDate(profile.lastUpdatedAt)
                                            : "Never"
                                    }
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Questions answered
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {profile.totalQuestionsAnswered}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Total visitors
                                </span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {profile.totalVisitors}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            Data Sources
                        </h3>
                        <div className="space-y-3">
                            <DataSourceItem
                                icon={<Avatar className="w-6 h-6">
                                    <AvatarImage src={profile.user.image || undefined} />
                                    <AvatarFallback className="text-xs">
                                        {profile.user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>}
                                label="ShipItHQ Profile"
                                enabled={profile.includePersonalData}
                            />
                            <DataSourceItem
                                icon={<FileText className="w-4 h-4" />}
                                label="Resume"
                                enabled={profile.personalData.some(d => d.dataType === "RESUME")}
                            />
                            {
                                profile.platformConnections.map((conn) => (
                                    <DataSourceItem
                                        key={conn.id}
                                        icon={<Github className="w-4 h-4" />}
                                        label={conn.platform}
                                        enabled={conn.isConnected}
                                        subtitle={conn.platformUsername || undefined}
                                    />
                                ))
                            }
                        </div>
                        <Link href="/knowme/settings">
                            <Button variant="ghost" size="sm" className="w-full mt-4 gap-2">
                                Manage Data Sources
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-5 text-white">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share Your AI
                        </h3>
                        <p className="text-sm text-white/80 mb-4">
                            Let people discover you through your AI assistant
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm font-mono truncate">
                                {profileUrl}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleCopyLink}
                                className="flex-shrink-0"
                            >
                                {
                                    copied ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )
                                }
                            </Button>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Key className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                            API Integration
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Embed your AI into your own portfolio
                        </p>
                        <Link href="/knowme/settings?tab=api">
                            <Button variant="outline" size="sm" className="w-full gap-2">
                                <Sparkles className="w-4 h-4" />
                                Get API Keys
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function DataSourceItem({
    icon,
    label,
    enabled,
    subtitle,
}: {
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
    subtitle?: string;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {label}
                    </span>
                    {
                        subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">@{subtitle}</p>
                        )
                    }
                </div>
            </div>
            {
                enabled ? (
                    <ToggleRight className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                )
            }
        </div>
    );
}