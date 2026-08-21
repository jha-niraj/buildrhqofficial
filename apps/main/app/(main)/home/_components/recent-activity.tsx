"use client";

import { motion } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
    Activity, FolderKanban, BookOpen, Code2, MessageSquare, Trophy, Zap,
    Users, ArrowRight
} from "lucide-react";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string | null;
    xpEarned: number;
    createdAt: Date;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
    const getActivityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "project":
            case "project_completed":
            case "project_started":
                return FolderKanban;
            case "studio":
            case "studio_created":
            case "note_created":
                return BookOpen;
            case "dsa":
            case "problem_solved":
                return Code2;
            case "chat":
            case "ai_chat":
                return MessageSquare;
            case "achievement":
            case "achievement_unlocked":
                return Trophy;
            case "follow":
            case "followed":
                return Users;
            default:
                return Zap;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "project":
            case "project_completed":
            case "project_started":
                return "text-neutral-900 bg-neutral-900/10";
            case "studio":
            case "studio_created":
            case "note_created":
                return "text-neutral-900 bg-neutral-900/10";
            case "dsa":
            case "problem_solved":
                return "text-neutral-900 bg-neutral-900/10";
            case "chat":
            case "ai_chat":
                return "text-neutral-900 bg-neutral-900/10";
            case "achievement":
            case "achievement_unlocked":
                return "text-neutral-900 bg-neutral-900/10";
            default:
                return "text-primary bg-primary/10";
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "Just now";
    };

    return (
        <Card className="border-primary/10 h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/profile?tab=activity">
                            View all <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {
                    activities.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <Activity className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">
                                No recent activity. Start learning to track your progress!
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                            <div className="space-y-4">
                                {
                                    activities.map((activity, index) => {
                                        const Icon = getActivityIcon(activity.type);
                                        const colorClass = getActivityColor(activity.type);

                                        return (
                                            <motion.div
                                                key={activity.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="relative pl-10"
                                            >
                                                <div
                                                    className={`absolute left-1.5 top-1 w-5 h-5 rounded-full ${colorClass} flex items-center justify-center`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                </div>

                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {activity.title}
                                                        </p>
                                                        {
                                                            activity.description && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {activity.description}
                                                                </p>
                                                            )
                                                        }
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        {
                                                            activity.xpEarned > 0 && (
                                                                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                                                                    +{activity.xpEarned} XP
                                                                </span>
                                                            )
                                                        }
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTimeAgo(activity.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    )
                }
            </CardContent>
        </Card>
    );
}