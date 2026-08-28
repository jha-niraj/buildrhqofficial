/**
 * KnowMe Helper Utilities
 * 
 * General helper functions for KnowMe module
 */

import { createHash, randomBytes } from "crypto";
import type { KnowMeQuestionCategory } from "@repo/db";

// Pure formatters live in `format.ts` so a client component can import them
// without dragging this module's `node:crypto` dependency - or, through the
// barrel, `@repo/db` - into the browser bundle. Re-exported so every existing
// server-side import of `helpers` keeps working unchanged.
export { formatRelativeDate, truncateText } from "./format";

/**
 * Generate a unique API key for external integrations
 */
export function generateApiKey(): { key: string; hash: string } {
	// Generate a random 32-byte key
	const keyBuffer = randomBytes(32);
	const key = `coderz_km_live_${keyBuffer.toString("hex")}`;

	// Create hash for storage (never store plain key)
	const hash = hashApiKey(key);

	return { key, hash };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
	return createHash("sha256").update(key).digest("hex");
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
	return hashApiKey(key) === hash;
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
	return randomBytes(16).toString("hex");
}

/**
 * Create a content hash to detect changes
 */
export function createContentHash(content: string): string {
	return createHash("md5").update(content).digest("hex");
}

/**
 * Check if rate limit should reset (24-hour window)
 */
export function shouldResetRateLimit(lastResetAt: Date): boolean {
	const now = new Date();
	const hoursSinceReset =
		(now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);
	return hoursSinceReset >= 24;
}

/**
 * Calculate next scheduled update date
 */
export function calculateNextUpdate(
	cycleDays: number,
	fromDate: Date = new Date()
): Date {
	const nextUpdate = new Date(fromDate);
	nextUpdate.setDate(nextUpdate.getDate() + cycleDays);
	return nextUpdate;
}

/**
 * Sanitize text for embedding (remove special chars, normalize whitespace)
 */
export function sanitizeForEmbedding(text: string): string {
	return text
		.replace(/[^\w\s.,!?;:'"()-]/g, " ") // Remove special chars except common punctuation
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim();
}

/**
 * Extract keywords from text for analytics
 */
export function extractKeywords(text: string): string[] {
	const stopWords = new Set([
		"a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
		"have", "has", "had", "do", "does", "did", "will", "would", "could",
		"should", "may", "might", "must", "shall", "can", "need", "dare",
		"ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
		"from", "as", "into", "through", "during", "before", "after", "above",
		"below", "between", "under", "again", "further", "then", "once", "here",
		"there", "when", "where", "why", "how", "all", "each", "few", "more",
		"most", "other", "some", "such", "no", "nor", "not", "only", "own",
		"same", "so", "than", "too", "very", "just", "also", "now", "i", "you",
		"he", "she", "it", "we", "they", "what", "which", "who", "this", "that",
		"your", "their", "my", "me", "about", "tell", "know"
	]);

	const words = text
		.toLowerCase()
		.replace(/[^\w\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 2 && !stopWords.has(word));

	// Get unique words, sorted by frequency
	const wordCount = new Map<string, number>();
	words.forEach((word) => {
		wordCount.set(word, (wordCount.get(word) || 0) + 1);
	});

	return Array.from(wordCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([word]) => word);
}

/**
 * Categorize question based on keywords
 */
export function categorizeQuestion(question: string): KnowMeQuestionCategory {
	const lowerQuestion = question.toLowerCase();

	const categoryPatterns: [KnowMeQuestionCategory, string[]][] = [
		["TECHNICAL_SKILLS", [
			"experience", "skill", "know", "familiar", "proficient",
			"language", "framework", "technology", "tech stack", "expert"
		]],
		["PROJECTS", [
			"project", "built", "develop", "work on", "create",
			"application", "app", "website", "portfolio"
		]],
		["WORK_EXPERIENCE", [
			"company", "job", "work at", "employ", "career",
			"position", "role", "previous"
		]],
		["EDUCATION", [
			"degree", "university", "college", "study", "education",
			"school", "graduate", "major"
		]],
		["ASSESSMENTS", [
			"assessment", "test", "score", "rank", "certif",
			"exam", "quiz", "badge"
		]],
		["AVAILABILITY", [
			"available", "hire", "open to", "looking", "opportunity",
			"freelance", "contract"
		]],
		["COMPENSATION", [
			"salary", "compensation", "rate", "pay", "cost", "charge"
		]],
		["SOFT_SKILLS", [
			"team", "communicate", "lead", "manage", "collaborate",
			"problem solving", "work style"
		]],
	];

	for (const [category, keywords] of categoryPatterns) {
		if (keywords.some((kw) => lowerQuestion.includes(kw))) {
			return category;
		}
	}

	return "GENERAL";
}

/**
 * Calculate trend data (percentage change)
 */
export function calculateTrend(
	current: number,
	previous: number
): { current: number; previous: number; change: number; changePercent: number; direction: "up" | "down" | "stable" } {
	const change = current - previous;
	const changePercent = previous > 0
		? Math.round((change / previous) * 100)
		: current > 0 ? 100 : 0;

	return {
		current,
		previous,
		change,
		changePercent: Math.abs(changePercent),
		direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
	};
}

/**
 * Validate profile URL format
 */
export function isValidProfileUrl(platform: string, url: string): boolean {
	const patterns: Record<string, RegExp> = {
		GITHUB: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/i,
		LEETCODE: /^https?:\/\/(www\.)?leetcode\.com\/[\w-]+\/?$/i,
		STACKOVERFLOW: /^https?:\/\/(www\.)?stackoverflow\.com\/users\/\d+\/?/i,
		LINKEDIN: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i,
		DEVTO: /^https?:\/\/(www\.)?dev\.to\/[\w-]+\/?$/i,
	};

	const pattern = patterns[platform];
	return pattern ? pattern.test(url) : false;
}

/**
 * Extract username from profile URL
 */
export function extractUsernameFromUrl(platform: string, url: string): string | null {
	try {
		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split("/").filter(Boolean);

		switch (platform) {
			case "GITHUB":
			case "LEETCODE":
			case "DEVTO":
				return pathParts[0] || null;
			case "LINKEDIN":
				return pathParts[1] || null; // /in/username
			case "STACKOVERFLOW":
				return pathParts[1] || null; // /users/id
			default:
				return pathParts[0] || null;
		}
	} catch {
		return null;
	}
}

/**
 * Generate vector ID for embedding storage
 */
export function generateVectorId(
	profileId: string,
	sourceType: string,
	sourceId: string,
	chunkIndex: number
): string {
	// Cloudflare Vectorize caps a vector ID at 64 BYTES. The readable form this
	// used to return - `${profileId}_${sourceType}_${sourceId}_${chunkIndex}` -
	// is ~66+ bytes once profileId and sourceId are both cuids and sourceType is
	// something like GITHUB_REPO, so it was over the limit for essentially every
	// real row while looking perfectly reasonable.
	//
	// Hashing keeps the two properties that actually matter: it is deterministic
	// (the same chunk always lands on the same ID, so re-running the embedding
	// job updates rather than duplicates) and it is fixed-width. `km_` + 32 hex
	// characters is 35 bytes, well inside the cap.
	//
	// Nothing is lost by making the ID opaque: `know_me_embedding` already
	// stores profileId, sourceType, sourceId and chunkIndex as real columns, so
	// that is where you look a vector up from, not by reading its ID.
	return `km_${createContentHash(`${profileId}_${sourceType}_${sourceId}_${chunkIndex}`)}`;
}

/**
 * Parse vector ID to extract components
 */
export function parseVectorId(vectorId: string): {
	profileId: string;
	sourceType: string;
	sourceId: string;
	chunkIndex: number;
} | null {
	const parts = vectorId.split("_");
	if (parts.length < 4) return null;

	return {
		profileId: parts[0] ?? "",
		sourceType: parts[1] ?? "",
		sourceId: parts[2] ?? "",
		chunkIndex: parseInt(parts[3] ?? "0", 10),
	};
}

/**
 * Get credits required for action
 */
export function getCreditsRequired(action: string): number {
	const creditMap: Record<string, number> = {
		manual_update: 1,
		upgrade_5_days: 10, // Per month
		upgrade_3_days: 25, // Per month
		upgrade_daily: 50, // Per month
		platform_sync: 2,
		api_overage_100: 5, // Per 100 requests over limit
	};

	return creditMap[action] || 0;
}

/**
 * Check if user has enough credits
 */
export function hasEnoughCredits(
	userCredits: number,
	requiredCredits: number
): boolean {
	return userCredits >= requiredCredits;
}

/**
 * Generate insight message based on analytics
 */
export function generateInsight(
	type: "strength" | "suggestion" | "warning" | "info",
	data: {
		topCategory?: string;
		questionCount?: number;
		recruiterCount?: number;
		responseRate?: number;
	}
): string | null {
	switch (type) {
		case "strength":
			if (data.topCategory && data.questionCount && data.questionCount > 10) {
				return `High interest in your ${data.topCategory.toLowerCase().replace("_", " ")} skills! Consider adding more related content.`;
			}
			break;
		case "suggestion":
			if (data.recruiterCount && data.recruiterCount > 0) {
				return `${data.recruiterCount} recruiter${data.recruiterCount > 1 ? "s" : ""} asked questions this week. Your skills are in demand! 🎉`;
			}
			break;
		case "info":
			if (data.responseRate && data.responseRate >= 90) {
				return `Your AI answered ${data.responseRate}% of questions successfully. Great job keeping your profile updated!`;
			}
			break;
		case "warning":
			if (data.responseRate && data.responseRate < 70) {
				return `Your AI could only answer ${data.responseRate}% of questions. Consider adding more data to improve responses.`;
			}
			break;
	}
	return null;
}

