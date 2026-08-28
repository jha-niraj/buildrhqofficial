"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    BarChart3, ArrowLeft, MessageSquare, Users, Clock, TrendingUp,
    TrendingDown, Minus, Download, Calendar, HelpCircle, Lightbulb,
    AlertTriangle, Info, ExternalLink, User, Sparkles
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Avatar, AvatarFallback, AvatarImage
} from "@repo/ui/components/ui/avatar";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";
import toast from "@repo/ui/components/ui/sonner";
import type { KnowMeAnalyticsFull, TimeRange } from "@/types/knowme";
import { exportAnalyticsData } from "@/actions/(main)/knowme";

interface KnowMeAnalyticsProps {
    analytics: KnowMeAnalyticsFull;
    initialRange: TimeRange;
}

const categoryLabels: Record<string, string> = {
    TECHNICAL_SKILLS: "Technical Skills",
    PROJECTS: "Projects",
    WORK_EXPERIENCE: "Work Experience",
    EDUCATION: "Education",
    ASSESSMENTS: "Assessments",
    AVAILABILITY: "Availability",
    COMPENSATION: "Compensation",
    SOFT_SKILLS: "Soft Skills",
    GENERAL: "General",
    OTHER: "Other",
};

const categoryColors: Record<string, string> = {
    TECHNICAL_SKILLS: "bg-neutral-900",
    PROJECTS: "bg-neutral-900",
    WORK_EXPERIENCE: "bg-neutral-900",
    EDUCATION: "bg-neutral-900",
    ASSESSMENTS: "bg-pink-500",
    AVAILABILITY: "bg-neutral-900",
    COMPENSATION: "bg-red-500",
    SOFT_SKILLS: "bg-neutral-900",
    GENERAL: "bg-slate-500",
    OTHER: "bg-gray-500",
};

const insightIcons: Record<string, React.ReactNode> = {
    strength: <Sparkles className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />,
    suggestion: <Lightbulb className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />,
    warning: <AlertTriangle className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />,
};

export default function KnowMeAnalytics({ analytics, initialRange }: KnowMeAnalyticsProps) {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
    const [isExporting, setIsExporting] = useState(false);

    const { overview, questionsByCategory, topQuestions, recentVisitors, insights, dailyActivity } = analytics;

    const handleRangeChange = (range: string) => {
        setTimeRange(range as TimeRange);
        router.push(`/knowme/analytics?range=${range}`);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await exportAnalyticsData(timeRange);
            if (result.success && result.data) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `knowme-analytics-${timeRange}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Data exported!");
            } else {
                toast.error("Failed to export data");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/knowme">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <BarChart3 className="w-6 h-6" />
                                KnowMe Analytics
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Insights about your AI assistant
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={timeRange} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-40 rounded-xl">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                                <SelectItem value="all">All time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
                <StatCard
                    label="Total Questions"
                    value={overview.totalQuestions}
                    trend={overview.trends.questions}
                    icon={<MessageSquare className="w-5 h-5" />}
                    color="blue"
                />
                <StatCard
                    label="Total Visitors"
                    value={overview.totalVisitors}
                    trend={overview.trends.visitors}
                    icon={<Users className="w-5 h-5" />}
                    color="purple"
                />
                <StatCard
                    label="Sessions"
                    value={overview.totalSessions}
                    trend={overview.trends.sessions}
                    icon={<Clock className="w-5 h-5" />}
                    color="emerald"
                />
                <StatCard
                    label="Avg per Session"
                    value={overview.avgQuestionsPerSession.toFixed(1)}
                    icon={<HelpCircle className="w-5 h-5" />}
                    color="amber"
                />
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6"
                >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Questions by Category
                    </h2>

                    {
                        questionsByCategory.length > 0 ? (
                            <div className="space-y-4">
                                {
                                    questionsByCategory.map((cat) => (
                                        <div key={cat.category} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    {categoryLabels[cat.category] || cat.category}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {cat.count} ({cat.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cat.percentage}%` }}
                                                    transition={{ duration: 0.5, delay: 0.3 }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        categoryColors[cat.category] || "bg-slate-500"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <EmptyState message="No questions asked yet" />
                        )
                    }
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6"
                >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Top Questions
                    </h2>

                    {
                        topQuestions.length > 0 ? (
                            <div className="space-y-3">
                                {
                                    topQuestions.slice(0, 8).map((q, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center text-neutral-800 dark:text-neutral-100 text-xs font-bold flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                                    {q.question}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    Asked {q.count} time{q.count > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <EmptyState message="No questions asked yet" />
                        )
                    }
                </motion.div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6"
                >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Who&apos;s Asking?
                    </h2>

                    {
                        recentVisitors.length > 0 ? (
                            <div className="space-y-4">
                                {
                                    recentVisitors.slice(0, 6).map((visitor, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={visitor.userImage || undefined} />
                                                    <AvatarFallback>
                                                        {visitor.userName?.charAt(0) || <User className="w-4 h-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {visitor.userName || "Anonymous Visitor"}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {visitor.viewerType.replace("_", " ")}
                                                        </Badge>
                                                        {
                                                            visitor.companyName && (
                                                                <span>• {visitor.companyName}</span>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {visitor.questionsAsked} questions
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatRelativeTime(visitor.lastActive)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <EmptyState message="No visitors yet" />
                        )
                    }
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6"
                >
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                        Insights
                    </h2>

                    {
                        insights.length > 0 ? (
                            <div className="space-y-4">
                                {
                                    insights.map((insight, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-4 rounded-xl border",
                                                insight.type === "strength" && "bg-neutral-50 dark:bg-neutral-800/10 border-neutral-200 dark:border-neutral-800/30",
                                                insight.type === "suggestion" && "bg-neutral-50 dark:bg-neutral-800/10 border-neutral-200 dark:border-neutral-800/30",
                                                insight.type === "warning" && "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30",
                                                insight.type === "info" && "bg-neutral-50 dark:bg-neutral-800/10 border-neutral-200 dark:border-neutral-800/30"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                {insightIcons[insight.type]}
                                                <div className="flex-1">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {insight.message}
                                                    </p>
                                                    {
                                                        insight.actionUrl && (
                                                            <Link href={insight.actionUrl}>
                                                                <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                                                                    {insight.actionText || "Learn more"}
                                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Not enough data for insights yet</p>
                            </div>
                        )
                    }
                </motion.div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6"
            >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                    Daily Activity
                </h2>

                {
                    dailyActivity.length > 0 ? (
                        <div className="h-64 flex items-end gap-1">
                            {
                                dailyActivity.slice(-30).map((day, index) => {
                                    const maxQuestions = Math.max(...dailyActivity.map(d => d.questions), 1);
                                    const height = (day.questions / maxQuestions) * 100;

                                    return (
                                        <div
                                            key={day.date}
                                            className="flex-1 flex flex-col items-center justify-end gap-1 group"
                                        >
                                            <div className="hidden group-hover:block absolute -mt-16 bg-slate-900 text-white text-xs px-2 py-1 rounded">
                                                {day.date}: {day.questions} questions
                                            </div>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(height, 4)}%` }}
                                                transition={{ duration: 0.3, delay: index * 0.01 }}
                                                className={cn(
                                                    "w-full rounded-t-sm transition-colors",
                                                    height > 0 ? "bg-neutral-900 hover:bg-neutral-800" : "bg-slate-200 dark:bg-neutral-700"
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <EmptyState message="No activity data yet" />
                    )
                }
            </motion.div>
        </div>
    );
}

function StatCard({
    label,
    value,
    trend,
    icon,
    color,
}: {
    label: string;
    value: number | string;
    trend?: { changePercent: number; direction: "up" | "down" | "stable" };
    icon: React.ReactNode;
    color: "blue" | "purple" | "emerald" | "amber";
}) {
    const colorClasses = {
        blue: "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
        purple: "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
        emerald: "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
        amber: "bg-neutral-50 dark:bg-neutral-800/20 text-neutral-800 dark:text-neutral-100",
    };

    const getTrendIcon = (direction: "up" | "down" | "stable") => {
        switch (direction) {
            case "up":
                return <TrendingUp className="w-3 h-3" />;
            case "down":
                return <TrendingDown className="w-3 h-3" />;
            default:
                return <Minus className="w-3 h-3" />;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses[color])}>
                    {icon}
                </div>
                {
                    trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            trend.direction === "up" && "text-neutral-800 dark:text-neutral-200",
                            trend.direction === "down" && "text-red-600",
                            trend.direction === "stable" && "text-slate-400"
                        )}>
                            {getTrendIcon(trend.direction)}
                            {trend.changePercent}%
                        </div>
                    )
                }
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {label}
            </p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}