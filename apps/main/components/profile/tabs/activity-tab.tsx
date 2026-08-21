"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Activity, Calendar, Flame, TrendingUp, Clock, Award, BookOpen, Code,
    MessageSquare, Star
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@repo/ui/components/ui/tooltip";

interface ActivityTabProps {
    user: {
        id: string;
        recentActivity: Array<{
            id: string;
            activityType: string | null;
            description: string | null;
            createdAt: Date;
        }>;
        dailyActivities?: Array<{
            date: Date;
            totalXp: number;
            activitiesCount: number;
        }>;
    };
    isOwnProfile?: boolean;
}

// Activity type config
const activityConfig: Record<
    string,
    {
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        label: string;
    }
> = {
    LESSON_COMPLETED: { icon: BookOpen, color: "text-neutral-900", label: "Lesson" },
    PROJECT_COMPLETED: { icon: Code, color: "text-neutral-900", label: "Project" },
    QUIZ_COMPLETED: { icon: Award, color: "text-neutral-900", label: "Quiz" },
    ACHIEVEMENT_UNLOCKED: { icon: Star, color: "text-neutral-900", label: "Achievement" },
    FEEDBACK_SUBMITTED: { icon: MessageSquare, color: "text-neutral-900", label: "Feedback" },
    DEFAULT: { icon: Activity, color: "text-gray-500", label: "Activity" },
};

// Generate contribution data for the last 52 weeks
function generateContributionData(
    activities: Array<{ createdAt: Date }>
): Map<string, number> {
    const contributions = new Map<string, number>();

    // Count activities per day
    activities.forEach((activity) => {
        const date = new Date(activity.createdAt).toISOString().split("T")[0] ?? "";
        if (date) contributions.set(date, (contributions.get(date) || 0) + 1);
    });

    return contributions;
}

// Get color intensity based on contribution count
function getContributionColor(count: number): string {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-neutral-200 dark:bg-neutral-800";
    if (count <= 3) return "bg-neutral-300 dark:bg-neutral-700";
    if (count <= 5) return "bg-neutral-800 dark:bg-neutral-300";
    return "bg-neutral-900 dark:bg-neutral-200";
}

export function ActivityTab({ user }: ActivityTabProps) {
    const activities = useMemo(() => {
        return user.recentActivity || [];
    }, [user.recentActivity]);
    // Generate contribution data
    const contributionData = useMemo(() => {
        return generateContributionData(activities);
    }, [activities]);

    // Generate weeks for the contribution graph (last 52 weeks)
    const weeks = useMemo(() => {
        const result: { date: Date; count: number }[][] = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364); // Go back ~52 weeks

        // Adjust to start on Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        for (let week = 0; week < 52; week++) {
            const weekData: { date: Date; count: number }[] = [];
            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + week * 7 + day);
                const dateStr = date.toISOString().split("T")[0];
                weekData.push({
                    date,
                    count: contributionData.get(dateStr!) || 0,
                });
            }
            result.push(weekData);
        }

        return result;
    }, [contributionData]);

    // Calculate stats
    const stats = useMemo(() => {
        const today = new Date();
        const last7Days = activities.filter(
            (a) => new Date(a.createdAt) > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        ).length;

        const last30Days = activities.filter(
            (a) => new Date(a.createdAt) > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        // Calculate current streak
        let streak = 0;
        const sortedDates = Array.from(contributionData.keys()).sort().reverse();
        for (const date of sortedDates) {
            if (contributionData.get(date)! > 0) streak++;
            else break;
        }

        const totalContributions = Array.from(contributionData.values()).reduce(
            (sum, count) => sum + count,
            0
        );

        return { last7Days, last30Days, streak, totalContributions };
    }, [activities, contributionData]);

    // Month labels for the graph
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Flame className="w-6 h-6 mx-auto mb-2 text-neutral-900 dark:text-neutral-100" />
                            <p className="text-2xl font-bold">{stats.streak}</p>
                            <p className="text-xs text-muted-foreground">Day Streak</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2 text-neutral-900 dark:text-neutral-100" />
                            <p className="text-2xl font-bold">{stats.last7Days}</p>
                            <p className="text-xs text-muted-foreground">This Week</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-neutral-900 dark:text-neutral-100" />
                            <p className="text-2xl font-bold">{stats.last30Days}</p>
                            <p className="text-xs text-muted-foreground">This Month</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Activity className="w-6 h-6 mx-auto mb-2 text-neutral-900 dark:text-neutral-100" />
                            <p className="text-2xl font-bold">{stats.totalContributions}</p>
                            <p className="text-xs text-muted-foreground">Total Activities</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            Contribution Graph
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto pb-2">
                            <TooltipProvider>
                                <div className="inline-flex flex-col gap-1 min-w-max">
                                    <div className="flex gap-1 text-xs text-muted-foreground ml-8 mb-1">
                                        {
                                            weeks.map((week, weekIndex) => {
                                                const firstDay = week[0]?.date;
                                                if (firstDay && firstDay.getDate() <= 7) {
                                                    return (
                                                        <span
                                                            key={weekIndex}
                                                            className="w-3 text-center"
                                                            style={{ marginLeft: weekIndex === 0 ? 0 : undefined }}
                                                        >
                                                            {months[firstDay.getMonth()]}
                                                        </span>
                                                    );
                                                }
                                                return <span key={weekIndex} className="w-3" />;
                                            })
                                        }
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground w-6">
                                            <span className="h-3" />
                                            <span className="h-3">Mon</span>
                                            <span className="h-3" />
                                            <span className="h-3">Wed</span>
                                            <span className="h-3" />
                                            <span className="h-3">Fri</span>
                                            <span className="h-3" />
                                        </div>
                                        <div className="flex gap-1">
                                            {
                                                weeks.map((week, weekIndex) => (
                                                    <div key={weekIndex} className="flex flex-col gap-1">
                                                        {
                                                            week.map((day, dayIndex) => (
                                                                <Tooltip key={dayIndex}>
                                                                    <TooltipTrigger>
                                                                        <div
                                                                            className={cn(
                                                                                "w-3 h-3 rounded-sm transition-colors",
                                                                                getContributionColor(day.count)
                                                                            )}
                                                                        />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="text-xs">
                                                                            <strong>{day.count} contribution{day.count !== 1 ? "s" : ""}</strong>
                                                                            <br />
                                                                            {
                                                                                day.date.toLocaleDateString("en-US", {
                                                                                    weekday: "long",
                                                                                    month: "short",
                                                                                    day: "numeric",
                                                                                    year: "numeric",
                                                                                })
                                                                            }
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ))
                                                        }
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 ml-8">
                                        <span>Less</span>
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-muted" />
                                            <div className="w-3 h-3 rounded-sm bg-neutral-200 dark:bg-neutral-800" />
                                            <div className="w-3 h-3 rounded-sm bg-neutral-300 dark:bg-neutral-700" />
                                            <div className="w-3 h-3 rounded-sm bg-neutral-800 dark:bg-neutral-300" />
                                            <div className="w-3 h-3 rounded-sm bg-neutral-900" />
                                        </div>
                                        <span>More</span>
                                    </div>
                                </div>
                            </TooltipProvider>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {
                            activities.length > 0 ? (
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                                    <div className="space-y-4">
                                        {
                                            activities.slice(0, 20).map((activity, index) => {
                                                const config =
                                                    activityConfig[activity.activityType || "DEFAULT"] ||
                                                    activityConfig.DEFAULT;
                                                const IconComponent = config?.icon || Activity;

                                                return (
                                                    <motion.div
                                                        key={activity.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.03 }}
                                                        className="relative flex gap-4 pl-10"
                                                    >
                                                        <div
                                                            className={cn(
                                                                "absolute left-2 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center",
                                                                config?.color
                                                            )}
                                                        >
                                                            <IconComponent className={cn("w-3 h-3", config?.color)} />
                                                        </div>
                                                        <div className="flex-1 pb-4 border-b last:border-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-sm">
                                                                        {activity.description ||
                                                                            activity.activityType?.replace(/_/g, " ")}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {config?.label}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                    {
                                                                        new Date(activity.createdAt).toLocaleDateString("en-US", {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                        })
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No activity to display</p>
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}