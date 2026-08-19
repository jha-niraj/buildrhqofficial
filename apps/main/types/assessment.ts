/**
 * Assessment Types and Interfaces
 * Used for Practice Sets and Exam Sets
 */

import {
    assessmentLanguageEnum,
    assessmentModeEnum,
    assessmentQuestionTypeEnum,
    userContentStatusEnum,
    QuestionDifficulty,
} from '@repo/db'

type AssessmentLanguage = typeof assessmentLanguageEnum.enumValues[number]
type AssessmentMode = typeof assessmentModeEnum.enumValues[number]
type AssessmentQuestionType = typeof assessmentQuestionTypeEnum.enumValues[number]
type UserContentStatus = typeof userContentStatusEnum.enumValues[number]

// ==================== INPUT TYPES ====================

export interface CreatePracticeSetInput {
    title: string
    description?: string
    language: AssessmentLanguage
    mode: AssessmentMode
    difficulty: QuestionDifficulty
    topicId?: string
    subModuleId?: string
    isPublic: boolean
    questionCount?: number
    customPrompt?: string // Additional context for AI generation
}

export interface CreateExamSetInput {
    title: string
    description?: string
    language: AssessmentLanguage
    mode: AssessmentMode
    difficulty: QuestionDifficulty
    topicId?: string
    isPublic: boolean
    questionCount?: number
    timeLimit?: number // in seconds
    customPrompt?: string
}

export interface PracticeSetFilters {
    language?: AssessmentLanguage
    mode?: AssessmentMode
    difficulty?: QuestionDifficulty
    topic?: string
    sortBy?: 'newest' | 'popular' | 'rating'
    page?: number
    limit?: number
}

export type ExamSetFilters = PracticeSetFilters

// ==================== QUESTION TYPES ====================

export interface QuestionOption {
    id: string
    text: string
    isCorrect: boolean
}

export interface TestCase {
    input: string
    expectedOutput: string
    isHidden: boolean
}

export interface GeneratedQuestion {
    question: string
    type: AssessmentQuestionType
    difficulty: QuestionDifficulty
    options?: QuestionOption[]
    correctAnswer: string
    answerExplanation: string | null
    codeSnippet: string | null
    starterCode: string | null
    solutionCode: string | null
    testCases?: TestCase[]
    points: number
    hints?: string[]
}

// ==================== SET TYPES ====================

// Using unknown for JSON fields as Prisma returns JsonValue which needs parsing
export interface PracticeSetQuestion {
    id: string
    practiceSetId: string
    question: string
    type: AssessmentQuestionType
    difficulty: QuestionDifficulty
    orderIndex: number
    options: unknown | null
    correctAnswer: string | null
    answerExplanation: string | null
    codeSnippet: string | null
    codeLanguage: string | null
    starterCode: string | null
    solutionCode: string | null
    testCases: unknown | null
    mockPrompt: string | null
    expectedTopics: unknown | null
    hints: unknown | null
    points: number
    createdAt: Date
}

export interface ExamSetQuestion extends Omit<PracticeSetQuestion, 'practiceSetId'> {
    examSetId: string
}

export interface UserInfo {
    id: string
    name: string | null
    username?: string | null
    image: string | null
}

export interface TopicInfo {
    id: string
    name: string
}

export interface SubModuleInfo {
    id: string
    name: string
}

export interface PracticeSetPreview {
    id: string
    slug: string
    title: string
    description: string | null
    language: AssessmentLanguage
    mode: AssessmentMode
    difficulty: QuestionDifficulty
    questionCount: number
    isPublic: boolean
    views: number
    avgScore: number
    status: UserContentStatus
    creditsCost: number
    totalAttempts: number
    completions: number
    likes: number
    timeLimit: number | null
    createdAt: Date
    updatedAt: Date
    creator: UserInfo
    creatorId: string
    topic: TopicInfo | null
    topicId: string | null
    _count: {
        questions?: number
        likedBy: number
        attempts: number
    }
}

export interface ExamSetPreview extends Omit<PracticeSetPreview, 'creditsCost'> {
    timeLimit: number
    passingScore: number
    creditsCost: number
    passCount: number
    failCount: number
}

export interface PracticeSetDetails extends PracticeSetPreview {
    subModule: SubModuleInfo | null
    subModuleId: string | null
    questions: PracticeSetQuestion[]
    isLiked: boolean
    isOwner: boolean
    creditsRefunded: number
    madePublicAt: Date | null
}

export interface ExamSetDetails extends Omit<ExamSetPreview, 'creditsCost'> {
    questions: ExamSetQuestion[]
    isLiked: boolean
    isOwner: boolean
    creditsCost: number
    creditsRefunded: number | null
    madePublicAt: Date | null
}

// ==================== ATTEMPT TYPES ====================

export interface PracticeAttemptAnswer {
    id: string
    attemptId: string
    questionId: string
    selectedOption: string | null
    codeAnswer: string | null
    textAnswer: string | null
    isCorrect: boolean
    pointsEarned: number
    timeTaken: number
    createdAt: Date
    question: PracticeSetQuestion
}

export interface ExamAttemptAnswer extends Omit<PracticeAttemptAnswer, 'question'> {
    question: ExamSetQuestion
}

// Simplified attempt type for listing (without answers)
export interface PracticeAttemptListItem {
    id: string
    practiceSetId: string
    userId: string
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    score: number | null
    totalPoints: number
    questionsAnswered: number
    correctAnswers: number
    creditsEarned: number
    startedAt: Date
    completedAt: Date | null
    practiceSet: {
        id: string
        title: string
        language: string
        mode: string
        difficulty: string
        slug: string
    }
}

export interface ExamAttemptListItem {
    id: string
    examSetId: string
    userId: string
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT'
    score: number | null
    totalPoints: number
    questionsAnswered: number
    correctAnswers: number
    creditsEarned: number
    passed: boolean | null
    startedAt: Date
    completedAt: Date | null
    timeRemaining: number | null
    examSet: {
        id: string
        title: string
        language: string
        mode: string
        difficulty: string
        slug: string
        timeLimit: number
        passingScore: number
    }
}

export interface PracticeAttempt {
    id: string
    practiceSetId: string
    userId: string
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    score: number | null
    totalPoints: number
    questionsAnswered: number
    correctAnswers: number
    creditsEarned: number
    startedAt: Date
    completedAt: Date | null
    practiceSet: PracticeSetPreview
    answers: PracticeAttemptAnswer[]
}

export interface ExamAttempt {
    id: string
    examSetId: string
    userId: string
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'TIMED_OUT'
    score: number | null
    totalPoints: number
    questionsAnswered: number
    correctAnswers: number
    creditsEarned: number
    passed: boolean | null
    startedAt: Date
    completedAt: Date | null
    timeRemaining: number | null
    examSet: ExamSetPreview
    answers: ExamAttemptAnswer[]
}

// ==================== RESPONSE TYPES ====================

export interface ActionResponse<T = unknown> {
    success: boolean
    error?: string
    data?: T
}

export interface PaginatedResponse<T> extends ActionResponse<T[]> {
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface CreateSetResponse {
    success: boolean
    error?: string
    practiceSetId?: string
    examSetId?: string
    slug?: string
    creditsUsed?: number
}

export interface AttemptStartResponse {
    success: boolean
    error?: string
    attemptId?: string
}

export interface SubmitAnswerResponse {
    success: boolean
    error?: string
    isCorrect?: boolean
    pointsEarned?: number
    correctAnswer?: string
    explanation?: string
}

export interface CompleteAttemptResponse {
    success: boolean
    error?: string
    score?: number
    totalPoints?: number
    correctAnswers?: number
    totalQuestions?: number
    creditsEarned?: number
    passed?: boolean
}

export interface LikeResponse {
    success: boolean
    error?: string
    liked?: boolean
}

// ==================== AI GENERATION TYPES ====================

export interface AIGenerationConfig {
    language: AssessmentLanguage
    mode: AssessmentMode
    difficulty: QuestionDifficulty
    topicName: string
    subModuleName?: string
    questionCount: number
    customPrompt?: string
}

export interface MockInterviewConfig extends AIGenerationConfig {
    role?: string // e.g., "Frontend Developer", "Backend Developer"
    experienceLevel?: 'junior' | 'mid' | 'senior'
    companyType?: string // e.g., "startup", "FAANG", "enterprise"
}

// ==================== CONSTANTS ====================

// Prices live in lib/credits/pricing.ts. Re-exported here so the existing
// importers of this module keep working; new code should read them from there.
export { PRACTICE_SET_CREDIT_COST, EXAM_SET_CREDIT_COST } from '@/lib/credits/pricing'
export const PUBLIC_CREDIT_REFUND_PERCENT = 50

export const LANGUAGE_CONFIG: Record<AssessmentLanguage, { label: string; icon: string }> = {
    JAVASCRIPT: { label: 'JavaScript', icon: '🟨' },
    PYTHON: { label: 'Python', icon: '🐍' },
    C: { label: 'C', icon: '🔷' },
    CPP: { label: 'C++', icon: '🔶' },
    REACTJS: { label: 'React.js', icon: '⚛️' },
    TYPESCRIPT: { label: 'TypeScript', icon: '🔵' },
    JAVA: { label: 'Java', icon: '☕' },
    GO: { label: 'Go', icon: '🐹' },
    RUST: { label: 'Rust', icon: '🦀' },
}

export const DIFFICULTY_CONFIG: Record<QuestionDifficulty, { label: string; bg: string; text: string }> = {
    EASY: {
        label: 'Easy',
        bg: 'bg-neutral-100 dark:bg-neutral-800/30',
        text: 'text-neutral-700 dark:text-neutral-100'
    },
    INTERMEDIATE: {
        label: 'Intermediate',
        bg: 'bg-neutral-100 dark:bg-neutral-800/30',
        text: 'text-neutral-700 dark:text-neutral-100'
    },
    HARD: {
        label: 'Hard',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400'
    },
}

export const MODE_CONFIG: Record<AssessmentMode, { label: string; description: string }> = {
    QUIZ: {
        label: 'Quiz',
        description: 'Multiple choice and theory questions'
    },
    CODE: {
        label: 'Coding',
        description: 'Write and debug code'
    },
    MOCK: {
        label: 'Mock Interview',
        description: 'Real interview scenario questions'
    },
    MIXED: {
        label: 'Mixed',
        description: 'Combination of all question types'
    },
}
// Answer with question included
export interface PracticeAttemptAnswerWithQuestion extends PracticeAttemptAnswer {
    question: PracticeSetQuestion
}

export interface ExamAttemptAnswerWithQuestion extends ExamAttemptAnswer {
    question: ExamSetQuestion
}

// Full attempt details for taking/resume assessment
export interface PracticeAttemptDetails {
    id: string
    userId: string
    practiceSetId: string
    mode: AssessmentMode
    totalQuestions: number
    answeredCount: number
    correctCount: number
    score: number | null
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
    startedAt: Date
    completedAt: Date | null
    creditsEarned: number
    practiceSet: {
        id: string
        title: string
        language: string // AssessmentLanguage
        difficulty: QuestionDifficulty
        timeLimit: number | null
        questions: PracticeSetQuestion[]
        topic?: { name: string } | null
        subModule?: { name: string } | null
    }
    answers: PracticeAttemptAnswerWithQuestion[]
}
