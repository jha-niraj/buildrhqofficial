// Project V2 Types based on Prisma Schema

import {
    projectV2VisibilityEnum,
    projectV2DifficultyEnum,
    userProjectV2StatusEnum,
    taskKanbanStatusEnum,
} from '@repo/db';

type ProjectV2Visibility = typeof projectV2VisibilityEnum.enumValues[number];
type ProjectV2Difficulty = typeof projectV2DifficultyEnum.enumValues[number];
type UserProjectV2Status = typeof userProjectV2StatusEnum.enumValues[number];
type TaskKanbanStatus = typeof taskKanbanStatusEnum.enumValues[number];

// Database return types
export interface UserFromDB {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
}

export interface ProjectV2TaskFromDB {
    id: string;
    projectId: string;
    title: string;
    description: string[];
    criteria: string[];
    hints: string[];
    badges: string[];
    tags: string[];
    difficulty: ProjectV2Difficulty;
    orderIndex: number;
    terminalCommand?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserTaskV2StatusFromDB {
    id: string;
    userId: string;
    projectId: string;
    taskId: string;
    progressId: string;
    status: TaskKanbanStatus;
    completedAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProjectV2ProgressFromDB {
    id: string;
    userId: string;
    projectId: string;
    status: UserProjectV2Status;
    tasksCompleted: number;
    totalTasks: number;
    progressPercentage: number;
    totalScore: number;
    tasksScore: number;
    quizScore: number;
    mockScore: number;
    startedAt?: Date | null;
    submittedAt?: Date | null;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectV2LeaderboardFromDB {
    id: string;
    userId: string;
    projectId: string;
    rank: number;
    score: number;
    tasksCompleted: number;
    totalTasks: number;
    progressPercent: number;
    tasksScore: number;
    quizScore: number;
    mockScore: number;
    lastUpdated: Date;
    createdAt: Date;
}

// Application types
export interface TaskWithStatus {
    id: string;
    title: string;
    description: string[];
    criteria: string[];
    hints: string[];
    badges: string[];
    tags: string[];
    difficulty: ProjectV2Difficulty;
    terminalCommand?: string | null;
    status: TaskKanbanStatus;
    completedAt?: Date | null;
    notes?: string | null;
}

export interface CompletedTask {
    taskId: string;
    difficulty: ProjectV2Difficulty;
}

export interface ScoreCalculation {
    totalScore: number;
    tasksScore: number;
    quizScore: number;
    mockScore: number;
}

export interface LeaderboardEntry {
    id: string;
    userId: string;
    projectId: string;
    rank: number;
    score: number;
    tasksCompleted: number;
    totalTasks: number;
    progressPercent: number;
    tasksScore: number;
    quizScore: number;
    mockScore: number;
    lastUpdated: Date;
    createdAt: Date;
    user: {
        id: string;
        username?: string | null;
        name?: string | null;
        image?: string | null;
    };
}

export interface ProjectInfo {
    id: string;
    title: string;
    slug: string;
    visibility: ProjectV2Visibility;
    createdBy: string;
}

export interface UserProgress {
    id: string;
    status: UserProjectV2Status;
    startedAt?: Date | null;
    completedAt?: Date | null;
    totalScore: number;
    tasksScore: number;
    quizScore: number;
    mockScore: number;
    tasksCompleted: number;
    totalTasks: number;
    progressPercentage: number;
}

export interface TaskDetail {
    id: string;
    title: string;
    description: string[];
    difficulty: ProjectV2Difficulty;
    badges: string[];
    completedAt?: Date | null;
}

export interface UserProjectProgressDetail {
    user: UserFromDB;
    project: {
        title: string;
        slug: string;
    };
    progress: UserProgress;
    tasks: {
        completed: TaskDetail[];
        inProgress: TaskDetail[];
        todo: TaskDetail[];
    };
}

export interface ActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface LeaderboardResponse {
    project: ProjectInfo;
    leaderboard: LeaderboardEntry[];
    pagination: PaginationInfo;
}

export interface GlobalLeaderboardEntry {
    id: string;
    userId: string;
    rank: number;
    totalScore: number;
    projectsStarted: number;
    projectsCompleted: number;
    averageScore: number;
    totalTasksCompleted: number;
    totalQuizzesCompleted: number;
    totalMocksCompleted: number;
    lastUpdated: Date;
    createdAt: Date;
    user: UserFromDB;
}

export interface GlobalLeaderboardResponse {
    leaderboard: GlobalLeaderboardEntry[];
    pagination: PaginationInfo;
}