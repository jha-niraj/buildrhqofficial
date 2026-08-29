// ============================================
// KNOWME MODULE - TypeScript Types & Interfaces
// ============================================

import {
	knowMeStatusEnum,
	knowMePrivacyEnum,
	knowMePlatformEnum,
	knowMeSyncStatusEnum,
	knowMeJobStatusEnum,
	knowMeJobTypeEnum,
	type KnowMeDataType,
	type KnowMeQuestionCategory,
	type KnowMeViewerType,
} from "@repo/db";

type KnowMeStatus = typeof knowMeStatusEnum.enumValues[number]
type KnowMePrivacy = typeof knowMePrivacyEnum.enumValues[number]
type KnowMePlatform = typeof knowMePlatformEnum.enumValues[number]
type KnowMeSyncStatus = typeof knowMeSyncStatusEnum.enumValues[number]
type KnowMeJobStatus = typeof knowMeJobStatusEnum.enumValues[number]
type KnowMeJobType = typeof knowMeJobTypeEnum.enumValues[number]

// ============================================
// PROFILE TYPES
// ============================================

export interface KnowMeProfileBasic {
	id: string;
	userId: string;
	status: KnowMeStatus;
	privacy: KnowMePrivacy;
	isPublic: boolean;
	includePersonalData: boolean;
	includePlatformData: boolean;
	includeProjects: boolean;
	includeAssessments: boolean;
	updateCycleDays: number;
	lastUpdatedAt: Date | null;
	nextScheduledUpdate: Date | null;
	totalQuestionsAnswered: number;
	totalSessions: number;
	totalVisitors: number;
	apiEnabled: boolean;
	apiRateLimit: number;
	/**
	 * Which step setup reached, 1-4, or 0 before it starts.
	 *
	 * `updateOnboardingStep` has always written this and nothing has ever read
	 * it, so a user who closed the wizard at step 3 restarted at step 1. It is
	 * exposed here so both entry points can resume. See CLN-49.
	 */
	onboardingStep: number;
	onboardingCompleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface KnowMeProfileFull extends KnowMeProfileBasic {
	user: {
		id: string;
		username: string | null;
		name: string | null;
		image: string | null;
		bio: string | null;
		occupation: string | null;
	};
	personalData: KnowMePersonalDataItem[];
	platformConnections: KnowMePlatformConnectionItem[];
	privacySettings: KnowMePrivacySettingsData | null;
	suggestedQuestions: string[];
	welcomeMessage: string | null;
	/**
	 * The most recent embedding job, or null if none has ever run.
	 *
	 * The dashboard needs this to be honest about `status`. A profile sitting at
	 * ERROR knows nothing about WHY on its own row - the reason is recorded two
	 * tables away in `know_me_embedding_job.result`, and without it the owner is
	 * told their assistant is broken and given nowhere to look. See KM-9.
	 */
	lastJob: KnowMeLastJob | null;
	/**
	 * How many chunks are actually indexed. This, not `status`, is the honest
	 * answer to "does my assistant know anything yet" - a profile can sit at
	 * ACTIVE with zero chunks and answer every question with "I do not know".
	 */
	indexedChunks: number;
}

export interface KnowMeLastJob {
	id: string;
	jobType: KnowMeJobType;
	status: KnowMeJobStatus;
	/** The operator-facing failure text, straight from the job row. May be long. */
	error: string | null;
	createdAt: Date;
	completedAt: Date | null;
}

export interface KnowMeProfilePublic {
	id: string;
	user: {
		username: string | null;
		name: string | null;
		image: string | null;
		bio: string | null;
		occupation: string | null;
	};
	isActive: boolean;
	welcomeMessage: string | null;
	suggestedQuestions: string[];
	privacy: KnowMePrivacy;
}

// ============================================
// PERSONAL DATA TYPES
// ============================================

export interface KnowMePersonalDataItem {
	id: string;
	dataType: KnowMeDataType;
	title: string | null;
	fileName: string | null;
	fileUrl: string | null;
	fileSize: number | null;
	isActive: boolean;
	isIndexed: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface KnowMeUploadData {
	dataType: KnowMeDataType;
	title?: string;
	contentText: string;
	fileName?: string;
	fileUrl?: string;
	fileSize?: number;
}

// ============================================
// PLATFORM CONNECTION TYPES
// ============================================

export interface KnowMePlatformConnectionItem {
	id: string;
	platform: KnowMePlatform;
	platformUsername: string | null;
	profileUrl: string | null;
	connectionStatus: KnowMeSyncStatus;
	isConnected: boolean;
	lastSyncedAt: Date | null;
	nextSyncAt: Date | null;
	metadata: PlatformMetadata | null;
	createdAt: Date;
}

export type PlatformMetadata = {
	github?: GitHubMetadata;
	leetcode?: LeetCodeMetadata;
	stackoverflow?: StackOverflowMetadata;
	linkedin?: LinkedInMetadata;
};

export interface GitHubMetadata {
	repos: number;
	stars: number;
	followers: number;
	following: number;
	contributions: number;
	languages: string[];
	bio: string | null;
}

export interface LeetCodeMetadata {
	problemsSolved: number;
	easyCount: number;
	mediumCount: number;
	hardCount: number;
	contestRating: number | null;
	ranking: number | null;
}

export interface StackOverflowMetadata {
	reputation: number;
	answers: number;
	questions: number;
	badges: {
		gold: number;
		silver: number;
		bronze: number;
	};
}

export interface LinkedInMetadata {
	headline: string | null;
	connections: number;
	experienceCount: number;
	educationCount: number;
}

// ============================================
// EXTERNAL DATA TYPES
// ============================================

export interface KnowMeExternalDataItem {
	id: string;
	dataType: KnowMeDataType;
	externalId: string | null;
	title: string | null;
	description: string | null;
	url: string | null;
	techStack: string[];
	dateCreated: Date | null;
	metrics: Record<string, unknown> | null;
	isActive: boolean;
	isIndexed: boolean;
}

export interface GitHubRepoData {
	id: string;
	name: string;
	description: string | null;
	url: string;
	languages: string[];
	stars: number;
	forks: number;
	commits: number;
	isForked: boolean;
	topics: string[];
	createdAt: string;
	updatedAt: string;
	readme: string | null;
}

// ============================================
// EMBEDDING TYPES
// ============================================

export interface KnowMeEmbeddingItem {
	id: string;
	sourceType: KnowMeDataType;
	sourceId: string;
	chunkIndex: number;
	chunkText: string;
	vectorId: string;
	embeddingModel: string;
	isActive: boolean;
	createdAt: Date;
}

export interface EmbeddingChunk {
	text: string;
	metadata: Record<string, unknown>;
}

export interface EmbeddingMetadata {
	profileId: string;
	sourceType: KnowMeDataType;
	sourceId: string;
	chunkIndex: number;
	text?: string;
	title?: string;
	techStack?: string[];
	dateCreated?: string;
	url?: string;
}

export interface VectorSearchResult {
	id: string;
	score: number;
	metadata: Record<string, unknown>;
	text: string;
}

// ============================================
// CHAT TYPES
// ============================================

export interface KnowMeChatSessionData {
	id: string;
	profileId: string;
	visitorUserId: string | null;
	viewerType: KnowMeViewerType;
	questionsAsked: number;
	rateLimitRemaining: number;
	startedAt: Date;
	lastActivityAt: Date;
	messages: KnowMeChatMessageData[];
}

export interface KnowMeChatMessageData {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	sources: ChatMessageSource[] | null;
	responseTimeMs: number | null;
	wasHelpful: boolean | null;
	createdAt: Date;
}

export interface ChatMessageSource {
	type: "project" | "assessment" | "github" | "leetcode" | "profile" | "resume";
	title: string;
	url?: string;
	description?: string;
}

export interface ChatRequest {
	question: string;
	sessionId?: string;
	context?: {
		viewerType?: KnowMeViewerType;
		source?: string;
	};
}

export interface ChatResponse {
	success: boolean;
	answer?: string;
	sources?: ChatMessageSource[];
	/**
	 * The row id of the assistant message that was just saved. Feedback is
	 * written against this - a client-invented id updates nothing and reports
	 * success. See KM-8.
	 */
	messageId?: string;
	sessionId?: string;
	rateLimit?: {
		remaining: number;
		resetAt: Date;
	};
	error?: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface KnowMeAnalyticsOverview {
	totalQuestions: number;
	totalVisitors: number;
	totalSessions: number;
	avgQuestionsPerSession: number;
	trends: {
		questions: TrendData;
		visitors: TrendData;
		sessions: TrendData;
	};
}

export interface TrendData {
	current: number;
	previous: number;
	change: number;
	changePercent: number;
	direction: "up" | "down" | "stable";
}

export interface QuestionCategoryStats {
	category: KnowMeQuestionCategory;
	count: number;
	percentage: number;
}

export interface TopQuestion {
	question: string;
	count: number;
	category: KnowMeQuestionCategory;
}

export interface VisitorData {
	userId: string | null;
	userName: string | null;
	userImage: string | null;
	viewerType: KnowMeViewerType;
	questionsAsked: number;
	lastActive: Date;
	interestedTopics: string[];
	companyName?: string;
}

export interface KnowMeAnalyticsFull {
	overview: KnowMeAnalyticsOverview;
	questionsByCategory: QuestionCategoryStats[];
	topQuestions: TopQuestion[];
	recentVisitors: VisitorData[];
	insights: AnalyticsInsight[];
	dailyActivity: DailyActivityData[];
}

export interface AnalyticsInsight {
	type: "strength" | "suggestion" | "warning" | "info";
	message: string;
	actionUrl?: string;
	actionText?: string;
}

export interface DailyActivityData {
	date: string;
	questions: number;
	visitors: number;
	sessions: number;
}

// ============================================
// API TYPES
// ============================================

export interface KnowMeApiConfig {
	apiKey: string;
	apiEnabled: boolean;
	apiRateLimit: number;
	apiUsageToday: number;
	apiUsageTotal: number;
	apiLastResetAt: Date;
}

export interface KnowMeApiUsageStats {
	today: number;
	thisMonth: number;
	total: number;
	rateLimit: number;
	remaining: number;
}

export interface ExternalApiRequest {
	apiKey: string;
	username: string;
	question: string;
	sessionId?: string;
}

export interface ExternalApiResponse {
	success: boolean;
	answer?: string;
	sources?: ChatMessageSource[];
	sessionId?: string;
	rateLimit?: {
		remaining: number;
		resetAt: string;
	};
	poweredBy: string;
	profileUrl: string;
	error?: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface KnowMePrivacySettingsData {
	allowAnonymous: boolean;
	allowRegisteredUsers: boolean;
	allowRecruiters: boolean;
	shareBasicInfo: boolean;
	shareProjects: boolean;
	shareAssessments: boolean;
	shareWorkHistory: boolean;
	shareEducation: boolean;
	shareSalary: boolean;
	shareExternalData: Record<string, boolean>;
	maxQuestionsPerSession: number;
	requireAuthForSensitive: boolean;
	blockedUserIds: string[];
	blockedCompanies: string[];
}

export interface KnowMeSettingsUpdate {
	privacy?: KnowMePrivacy;
	includePersonalData?: boolean;
	includePlatformData?: boolean;
	includeProjects?: boolean;
	includeAssessments?: boolean;
	includeResume?: boolean;
	updateCycleDays?: number;
	aiPersonality?: string;
	welcomeMessage?: string;
	suggestedQuestions?: string[];
}

// ============================================
// ONBOARDING TYPES
// ============================================

export interface OnboardingStep {
	step: number;
	title: string;
	description: string;
	isCompleted: boolean;
}

export interface OnboardingProgress {
	currentStep: number;
	totalSteps: number;
	completedSteps: number[];
	isCompleted: boolean;
}

export interface OnboardingData {
	useCoderData: boolean;
	uploadResume: boolean;
	resumeFile?: File;
	connectPlatforms: KnowMePlatform[];
	privacy: KnowMePrivacy;
}

// ============================================
// JOB TYPES
// ============================================

export interface KnowMeEmbeddingJobData {
	id: string;
	jobType: KnowMeJobType;
	status: KnowMeJobStatus;
	progress: number;
	totalItems: number;
	processedItems: number;
	failedItems: number;
	startedAt: Date | null;
	completedAt: Date | null;
	errorLogs: string[];
}

// ============================================
// FORM TYPES
// ============================================

export interface PlatformConnectForm {
	platform: KnowMePlatform;
	username: string;
	profileUrl?: string;
}

export interface ResumeUploadForm {
	file: File;
	title?: string;
}

// ============================================
// ACTION RESPONSE TYPES
// ============================================

export interface KnowMeActionResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// ============================================
// HIRING PLATFORM INTEGRATION TYPES
// (For future use when hiring module is built)
// ============================================

export interface RecruiterChatContext {
	recruiterId: string;
	companyName: string;
	companyId?: string;
	jobId?: string;
	jobTitle?: string;
}

export interface RecruiterAnalytics {
	recruiterUserId: string;
	recruiterName: string;
	companyName: string;
	questionsAsked: number;
	lastActive: Date;
	interestedSkills: string[];
	sessions: number;
}

export interface CandidateScore {
	overallMatch: number;
	technicalSkills: {
		score: number;
		matches: string[];
		gaps: string[];
	};
	projectRelevance: {
		score: number;
		highlights: string[];
		concerns: string[];
	};
	recommendation: {
		shouldInterview: boolean;
		focusAreas: string[];
		estimatedLevel: string;
	};
}

// ============================================
// UTILITY TYPES
// ============================================

export type KnowMeTab = "dashboard" | "settings" | "analytics" | "api";

export type TimeRange = "7d" | "30d" | "90d" | "all";

export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}

