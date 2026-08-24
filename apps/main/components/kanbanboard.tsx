"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import {
    Avatar, AvatarFallback, AvatarImage
} from '@repo/ui/components/ui/avatar';
import {
    Calendar, GripVertical, MessageCircle, Paperclip, Eye
} from 'lucide-react';

export interface TaskCard {
    id: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    assignee?: {
        name: string;
        avatar: string;
    };
    tags?: string[]; // Learn tags
    dueDate?: string;
    attachments?: number;
    comments?: number;
}

export interface Column {
    id: string;
    title: string;
    tasks: TaskCard[];
    color?: string;
}

interface KanbanBoardProps {
    columns: Column[];
    onTaskClick?: (taskId: string) => void;
    onMoveTask?: (taskId: string, sourceColumnId: string, targetColumnId: string) => void;
}

export default function KanbanBoard({ columns: incoming, onTaskClick, onMoveTask }: KanbanBoardProps) {
    const [columns, setColumns] = useState<Column[]>(incoming || []);

    useEffect(() => {
        setColumns(incoming || []);
    }, [incoming]);

    const handleDragStart = (e: React.DragEvent, task: TaskCard, columnId: string) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ task, sourceColumnId: columnId }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const { task, sourceColumnId } = data;

        if (sourceColumnId === targetColumnId) return;

        // Optimistic UI update
        setColumns((prev) => {
            const removed = prev.map((col) => col.id === sourceColumnId ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) } : col);
            return removed.map((col) => col.id === targetColumnId ? { ...col, tasks: [...col.tasks, task] } : col);
        });

        onMoveTask?.(task.id, sourceColumnId, targetColumnId);
    };

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                    Kanban Board
                </h1>
                <p className="text-neutral-700 dark:text-neutral-300">Drag and drop task management</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:overflow-visible overflow-x-auto">
                {
                    columns.map((column) => (
                        <div
                            key={column.id}
                            className="bg-white/20 dark:bg-neutral-900/20 backdrop-blur-xl rounded-3xl p-5 border border-border dark:border-neutral-700/50 min-w-[280px] md:min-w-0"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
                                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {column.title}
                                    </h3>
                                    <Badge className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50">
                                        {column.tasks.length}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-4 max-h-[calc(100dvh-350px)] overflow-y-auto md:max-h-none md:overflow-y-visible">
                                {
                                    column.tasks.map((task) => (
                                        <Card
                                            key={task.id}
                                            className="cursor-move transition-all duration-300 border bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-neutral-700/70"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task, column.id)}
                                        >
                                            <CardContent className="p-5">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                                                                {task.title}
                                                            </h4>
                                                        </div>
                                                        <GripVertical className="w-5 h-5 text-neutral-500 dark:text-neutral-400 cursor-move flex-shrink-0" />
                                                    </div>

                                                    {
                                                        task.description && (
                                                            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )
                                                    }

                                                    {
                                                        task.tags && task.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {
                                                                    task.tags.slice(0, 3).map((tag) => (
                                                                        <Badge
                                                                            key={tag}
                                                                            className="text-xs bg-neutral-100/60 dark:bg-neutral-700/60 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50 backdrop-blur-sm"
                                                                        >
                                                                            {tag}
                                                                        </Badge>
                                                                    ))
                                                                }
                                                                {
                                                                    task.tags.length > 3 && (
                                                                        <Badge
                                                                            className="text-xs bg-neutral-100/60 dark:bg-neutral-700/60 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50 backdrop-blur-sm"
                                                                        >
                                                                            +{task.tags.length - 3}
                                                                        </Badge>
                                                                    )
                                                                }
                                                            </div>
                                                        )
                                                    }
                                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/30 dark:border-neutral-700/30">
                                                        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                                                            {
                                                                task.dueDate && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="w-4 h-4" />
                                                                        <span className="text-xs font-medium">Jan 15</span>
                                                                    </div>
                                                                )
                                                            }
                                                            {
                                                                task.comments && (
                                                                    <div className="flex items-center gap-1">
                                                                        <MessageCircle className="w-4 h-4" />
                                                                        <span className="text-xs font-medium">{task.comments}</span>
                                                                    </div>
                                                                )
                                                            }
                                                            {
                                                                task.attachments && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Paperclip className="w-4 h-4" />
                                                                        <span className="text-xs font-medium">{task.attachments}</span>
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                        {
                                                            task.assignee && (
                                                                <Avatar className="w-8 h-8 ring-2 ring-white/50 dark:ring-neutral-700/50">
                                                                    <AvatarImage src={task.assignee.avatar} />
                                                                    <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium">
                                                                        {
                                                                            task.assignee.name
                                                                                .split(' ')
                                                                                .map((n) => n[0])
                                                                                .join('')
                                                                        }
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            )
                                                        }
                                                    </div>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTaskClick?.(task.id);
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-2 gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}