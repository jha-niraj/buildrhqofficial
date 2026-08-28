"use client";

import { useEffect, useState } from "react";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet";
import {
    Activity, FolderKanban, BookOpen, Code2, MessageSquare, Trophy,
    Users, Zap
} from "lucide-react";
import { getActivitiesByDate } from "@/actions/(main)/home/home.action";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string | null;
    xpEarned: number;
    createdAt: Date;
}

interface ActivityDaySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date | null;
}

function getActivityIcon(type: string) {
    switch (type?.toLowerCase()) {
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
}

function getActivityColor(type: string) {
    switch (type?.toLowerCase()) {
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
}

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function ActivityDaySheet({
    open,
    onOpenChange,
    date,
}: ActivityDaySheetProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open || !date) return;
        const dateString = date.toISOString().split("T")[0] ?? "";
        setIsLoading(true);
        getActivitiesByDate(dateString)
            .then((result) => {
                if (result.success && result.data) {
                    setActivities(result.data);
                } else {
                    setActivities([]);
                }
            })
            .catch(() => setActivities([]))
            .finally(() => setIsLoading(false));
    }, [open, date]);

    const formattedDate = date
        ? date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : "";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Activity on {formattedDate}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-6 overflow-y-auto">
                    {
                        isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <InlineLoader size="lg" className="text-muted-foreground" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-12 space-y-2">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground">
                                    No activity on this day
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {
                                    activities.map((activity) => {
                                        const Icon = getActivityIcon(activity.type);
                                        const colorClass = getActivityColor(activity.type);

                                        return (
                                            <div
                                                key={activity.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium">{activity.title}</p>
                                                    {
                                                        activity.description && (
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {activity.description}
                                                            </p>
                                                        )
                                                    }
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatTime(activity.createdAt)}
                                                    </p>
                                                </div>
                                                {
                                                    activity.xpEarned > 0 && (
                                                        <span className="font-medium text-neutral-900 dark:text-neutral-100 shrink-0">
                                                            +{activity.xpEarned} XP
                                                        </span>
                                                    )
                                                }
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                </div>
            </SheetContent>
        </Sheet>
    );
}