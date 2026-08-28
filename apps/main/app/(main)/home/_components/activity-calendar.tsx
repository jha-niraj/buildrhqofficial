"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Flame } from "lucide-react";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@repo/ui/components/ui/tooltip";
import ActivityDaySheet from "./activity-day-sheet";

interface ActivityData {
    date: Date | string;
    totalXp: number;
    activitiesCount: number;
}

interface ActivityCalendarProps {
    data: ActivityData[];
}

export default function ActivityCalendar({ data }: ActivityCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Generate last 365 days
    const calendarData = useMemo(() => {
        const days: { date: Date; xp: number; count: number }[] = [];
        const today = new Date();
        const dataMap = new Map(
            data.map((d) => [new Date(d.date).toDateString(), d])
        );

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const activity = dataMap.get(date.toDateString());
            days.push({
                date,
                xp: activity?.totalXp || 0,
                count: activity?.activitiesCount || 0,
            });
        }

        return days;
    }, [data]);

    // Calculate contribution level (0-4)
    const getLevel = (xp: number): number => {
        if (xp === 0) return 0;
        if (xp < 50) return 1;
        if (xp < 100) return 2;
        if (xp < 200) return 3;
        return 4;
    };

    const getLevelColor = (level: number): string => {
        switch (level) {
            case 0:
                return "bg-muted";
            case 1:
                return "bg-neutral-200 dark:bg-neutral-800";
            case 2:
                return "bg-neutral-800 dark:bg-neutral-700";
            case 3:
                return "bg-neutral-900 dark:bg-neutral-200";
            case 4:
                return "bg-neutral-800 dark:bg-neutral-100";
            default:
                return "bg-muted";
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleDayClick = (day: { date: Date; xp: number; count: number }) => {
        setSelectedDate(day.date);
        setSheetOpen(true);
    };

    // Calculate streak
    const currentStreak = useMemo(() => {
        let streak = 0;
        for (let i = calendarData.length - 1; i >= 0; i--) {
            const day = calendarData[i];
            if (day && day.xp > 0) {
                streak++;
            } else if (i < calendarData.length - 1) {
                // Allow today to be empty, break on past empty days
                break;
            }
        }
        return streak;
    }, [calendarData]);

    // Group by weeks (52-53 weeks)
    const weeks = useMemo(() => {
        const result: typeof calendarData[] = [];
        let currentWeek: typeof calendarData = [];

        // Pad the beginning to align with week start
        const firstDayData = calendarData[0];
        const firstDay = firstDayData ? firstDayData.date.getDay() : 0;
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: new Date(0), xp: -1, count: 0 });
        }

        calendarData.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [calendarData]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // The cell FILLS its column instead of being a fixed 12px square.
    //
    // At `w-3 h-3` the grid was 53 weeks x 16px = about 850px, so inside a
    // 1500px card it stopped two thirds of the way across and left a large empty
    // block - which read as broken rather than as spare room. `aspect-square`
    // keeps the cells square whatever width they end up with, and `min-w-[7px]`
    // stops them vanishing on a phone, where the container can still scroll.
    const boxSize = "w-full aspect-square min-w-[7px] rounded-[2px]";
    const boxMinSize = "min-w-[12px]";

    return (
        <>
            <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900/10 flex items-center justify-center">
                            <CalendarDays className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                        </div>
                        <span className="font-semibold text-sm">Activity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                        <span className="font-bold text-sm">{currentStreak}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">day streak</span>
                    </div>
                </div>
                <div className="p-4">
                    <TooltipProvider delayDuration={100}>
                        <div className="overflow-x-auto pb-4">
                            <div className="flex w-full min-w-[560px] gap-1 mb-2 ml-8 text-xs text-neutral-600 dark:text-neutral-400">
                                {
                                    weeks.map((week, weekIndex) => {
                                        const firstValidDay = week.find((d) => d.xp !== -1);
                                        if (
                                            firstValidDay &&
                                            firstValidDay.date.getDate() <= 7 &&
                                            weekIndex % 4 === 0
                                        ) {
                                            return (
                                                <span key={weekIndex} className="min-w-0 flex-1 truncate">
                                                    {months[firstValidDay.date.getMonth()]}
                                                </span>
                                            );
                                        }
                                        return <span key={weekIndex} className="min-w-0 flex-1" />;
                                    })
                                }
                            </div>
                            <div className="flex w-full min-w-[560px] gap-1">
                                <div className="flex shrink-0 flex-col gap-1 pr-2 text-xs text-neutral-600 dark:text-neutral-400">
                                    {/* `flex-1`, not a fixed `h-4`. The cells are
                                        `aspect-square` now, so their height follows the
                                        column width - a fixed label height would drift out
                                        of step with the rows at any width but one. */}
                                    <span className="flex-1" />
                                    <span className="flex flex-1 items-center">Mon</span>
                                    <span className="flex-1" />
                                    <span className="flex flex-1 items-center">Wed</span>
                                    <span className="flex-1" />
                                    <span className="flex flex-1 items-center">Fri</span>
                                    <span className="flex-1" />
                                </div>
                                {
                                    weeks.map((week, weekIndex) => (
                                        <div key={weekIndex} className="flex min-w-0 flex-1 flex-col gap-1">
                                            {week.map((day, dayIndex) => {
                                                if (day.xp === -1) {
                                                    return (
                                                        <div
                                                            key={dayIndex}
                                                            className={`${boxSize} rounded`}
                                                        />
                                                    );
                                                }

                                                const level = getLevel(day.xp);
                                                return (
                                                    <Tooltip key={dayIndex}>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{
                                                                    delay:
                                                                        (weekIndex * 7 + dayIndex) * 0.001,
                                                                }}
                                                                onClick={() => handleDayClick(day)}
                                                                className={`${boxSize} rounded ${getLevelColor(
                                                                    level
                                                                )} cursor-pointer transition-transform hover:scale-110 ${boxMinSize}`}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="text-xs">
                                                            <p className="font-medium">
                                                                {formatDate(day.date)}
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                {day.xp > 0
                                                                    ? `${day.xp} XP • ${day.count} activities`
                                                                    : "No activity"}
                                                            </p>
                                                            <p className="text-muted-foreground/80 mt-0.5">
                                                                Click to view details
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })
                                        }
                                    </div>
                                ))
                            }
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                            <span>Less</span>
                            {
                                [0, 1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`${boxSize} rounded ${getLevelColor(
                                            level
                                        )}`}
                                    />
                                ))
                            }
                            <span>More</span>
                        </div>
                    </div>
                </TooltipProvider>
                </div>
            </div>

        <ActivityDaySheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            date={selectedDate}
        />
    </>
    );
}