"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    knowMeProfiles,
    knowMeEmbeddings,
    knowMeEmbeddingJobs,
    users,
    knowMeCreditTransactions,
    skills,
} from "@repo/db";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type {
	KnowMeActionResponse, KnowMeEmbeddingJobData
} from "@/types/knowme";
import {
	generateEmbeddingsBatch,
	upsertVectorsBatch,
	deleteNamespace,
	createProfileChunks,
	createProjectChunks,
	createAssessmentChunks,
	createGitHubRepoChunks,
	createBioChunks,
	generateVectorId,
	calculateNextUpdate,
	createContentHash,
} from "@/utils/knowme";

// ============================================
// MAIN EMBEDDING GENERATION
// ============================================

/**
 * Generate embeddings for user's profile data
 * This is the main function that processes all user data and creates embeddings
 */
export async function generateProfileEmbeddings(): Promise<
	KnowMeActionResponse<KnowMeEmbeddingJobData>
> {
	try {
		const session = await getSession(headers());
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Get profile with all related data, and skills separately
		const [profile, userSkills] = await Promise.all([
			db.query.knowMeProfiles.findFirst({
				where: eq(knowMeProfiles.userId, session.user.id),
				with: {
					user: true,
					personalData: {
						where: (pd: any, { eq }: any) => eq(pd.isActive, true),
					},
					platformConnections: {
						where: (pc: any, { eq }: any) => eq(pc.isConnected, true),
					},
					externalData: {
						where: (ed: any, { eq }: any) => eq(ed.isActive, true),
					},
				},
			}),
			db.query.skills.findMany({ where: eq(skills.userId, session.user.id) }),
		]);

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		// Fetch user's portfolio projects (personal projects they've added)
		let portfolioProjects: any[] = [];
		try {
			const { portfolioProjects: ppTable } = await import('@repo/db');
			portfolioProjects = await db.query.portfolioProjects.findMany({
				where: eq((ppTable as any).userId, session.user.id),
				with: { links: true },
				limit: 50,
			});
		} catch {
			// Table may not exist or have different name
		}

		// Fetch user's projects from ProjectV2 model (platform guided projects)
		let platformProjects: any[] = [];
		try {
			const { projectsV2 } = await import('@repo/db');
			platformProjects = await db.query.projectsV2.findMany({
				where: eq((projectsV2 as any).createdBy, session.user.id),
				columns: { id: true, title: true, description: true, technologies: true, slug: true, createdAt: true },
				limit: 50,
			});
		} catch {
			// Table may not exist or have different name
		}

		// Fetch user's passed assessments
		let examAttempts: any[] = [];
		try {
			const { examAttempts: examAttemptsTable } = await import('@repo/db');
			examAttempts = await db.query.examAttempts.findMany({
				where: and(
					eq((examAttemptsTable as any).userId, session.user.id),
					eq((examAttemptsTable as any).passed, true)
				),
				with: { topic: { columns: { name: true, language: true } } },
				limit: 20,
			});
		} catch {
			// Table may not exist or have different name
		}

		// Create embedding job
		const [job] = await db.insert(knowMeEmbeddingJobs).values({
			profileId: profile.id,
			jobType: "FULL_SYNC",
			status: "PROCESSING",
			priority: 1,
			scope: {
				includePersonalData: profile.includePersonalData,
				includePlatformData: profile.includePlatformData,
				includeProjects: profile.includeProjects,
				includeAssessments: profile.includeAssessments,
			},
		}).returning();

		// Update profile status
		await db.update(knowMeProfiles)
			.set({ status: "PROCESSING" })
			.where(eq(knowMeProfiles.id, profile.id));

		try {
			// Process embeddings with fetched data
			const result = await processEmbeddings({
				...profile,
				user: { ...profile.user, skills: userSkills },
				portfolioProjects,
				platformProjects,
				examAttempts,
			});

			// Update job with results
			await db.update(knowMeEmbeddingJobs)
				.set({
					status: "COMPLETED",
					progress: 100,
					totalItems: result.totalItems,
					processedItems: result.processedItems,
					failedItems: result.failedItems,
					completedAt: new Date(),
					result: {
						success: true,
						chunksCreated: result.processedItems,
					},
				})
				.where(eq(knowMeEmbeddingJobs.id, job!.id));

			// Update profile
			await db.update(knowMeProfiles)
				.set({
					status: "ACTIVE",
					lastUpdatedAt: new Date(),
					nextScheduledUpdate: calculateNextUpdate(profile.updateCycleDays),
					totalEmbeddingsCount: result.processedItems,
					lastEmbeddingVersion: "v1",
				})
				.where(eq(knowMeProfiles.id, profile.id));

			revalidatePath("/knowme");

			return {
				success: true,
				data: {
					id: job!.id,
					jobType: job!.jobType,
					status: "COMPLETED",
					progress: 100,
					totalItems: result.totalItems,
					processedItems: result.processedItems,
					failedItems: result.failedItems,
					startedAt: job!.createdAt,
					completedAt: new Date(),
					errorLogs: [],
				},
				message: `Successfully created ${result.processedItems} embeddings`,
			};
		} catch (processError) {
			// Update job with error
			await db.update(knowMeEmbeddingJobs)
				.set({
					status: "FAILED",
					result: { error: (processError as Error).message },
					errorLogs: [(processError as Error).message],
				})
				.where(eq(knowMeEmbeddingJobs.id, job!.id));

			// Reset profile status
			await db.update(knowMeProfiles)
				.set({ status: "ERROR" })
				.where(eq(knowMeProfiles.id, profile.id));

			throw processError;
		}
	} catch (error) {
		console.error("Error generating embeddings:", error);
		return { success: false, error: "Failed to generate embeddings" };
	}
}

/**
 * Process all embeddings for a profile
 */
async function processEmbeddings(profile: {
	id: string;
	userId: string;
	includePersonalData: boolean;
	includePlatformData: boolean;
	includeProjects: boolean;
	includeAssessments: boolean;
	includeResume: boolean;
	user: {
		name: string | null;
		email: string | null;
		bio: string | null;
		occupation: string | null;
		location: string | null;
		skills: { name: string }[];
	};
	personalData: {
		id: string;
		dataType: string;
		contentText: string | null;
		title: string | null;
	}[];
	externalData: {
		id: string;
		dataType: string;
		title: string | null;
		description: string | null;
		url: string | null;
		techStack: string[];
	}[];
	portfolioProjects: any[];
	platformProjects: any[];
	examAttempts: any[];
}): Promise<{
	totalItems: number;
	processedItems: number;
	failedItems: number;
}> {
	const allChunks: {
		id: string;
		text: string;
		metadata: Record<string, unknown>;
	}[] = [];

	let totalItems = 0;
	let failedItems = 0;

	// 1. Process user profile/bio
	const bioChunks = createBioChunks(profile.id, {
		name: profile.user.name,
		bio: profile.user.bio,
		occupation: profile.user.occupation,
		location: profile.user.location,
		skills: profile.user.skills.map((s) => s.name),
		email: profile.user.email,
	});

	bioChunks.forEach((chunk: any, index: number) => {
		allChunks.push({
			id: generateVectorId(profile.id, "PROFILE", profile.id, index),
			text: chunk.text,
			metadata: { ...chunk.metadata, text: chunk.text },
		});
	});
	totalItems += bioChunks.length;

	// 2. Process personal data (resume, etc.)
	if (profile.includePersonalData) {
		for (const data of profile.personalData) {
			if (!data.contentText) continue;
			try {
				const chunks = createProfileChunks(
					profile.id,
					data.dataType as any,
					data.id,
					data.contentText,
					{ title: data.title || undefined }
				);
				chunks.forEach((chunk: any, index: number) => {
					allChunks.push({
						id: generateVectorId(profile.id, data.dataType as any, data.id, index),
						text: chunk.text,
						metadata: { ...chunk.metadata, text: chunk.text },
					});
				});
				totalItems += chunks.length;
			} catch {
				failedItems++;
			}
		}
	}

	// 3. Process portfolio projects (user's personal projects)
	if (profile.includeProjects && profile.portfolioProjects.length > 0) {
		for (const project of profile.portfolioProjects) {
			try {
				const githubLink = project.links?.find((l: any) => l.linkType.toLowerCase() === 'github')?.url;
				const liveLink = project.links?.find((l: any) => l.linkType.toLowerCase() === 'live demo')?.url;

				const chunks = createProjectChunks(profile.id, project.id, {
					title: project.projectName,
					description: project.description || `${project.projectType} project`,
					technologies: project.technologies,
					url: githubLink || liveLink || undefined,
				});

				chunks.forEach((chunk: any, index: number) => {
					allChunks.push({
						id: generateVectorId(profile.id, "PROJECT", `portfolio_${project.id}`, index),
						text: chunk.text,
						metadata: { ...chunk.metadata, text: chunk.text, projectType: "portfolio", status: project.status },
					});
				});
				totalItems += chunks.length;
			} catch {
				failedItems++;
			}
		}
	}

	// 4. Process platform projects (ProjectV2 model - guided projects)
	if (profile.includeProjects && profile.platformProjects.length > 0) {
		for (const project of profile.platformProjects) {
			try {
				const chunks = createProjectChunks(profile.id, project.id, {
					title: project.title,
					description: project.description || "Platform guided project",
					technologies: project.technologies,
					url: `/projects/${project.slug}`,
				});

				chunks.forEach((chunk: any, index: number) => {
					allChunks.push({
						id: generateVectorId(profile.id, "PROJECT", `platform_${project.id}`, index),
						text: chunk.text,
						metadata: { ...chunk.metadata, text: chunk.text, projectType: "platform" },
					});
				});
				totalItems += chunks.length;
			} catch {
				failedItems++;
			}
		}
	}

	// 5. Process assessments (passed exams)
	if (profile.includeAssessments && profile.examAttempts.length > 0) {
		for (const attempt of profile.examAttempts) {
			try {
				const chunks = createAssessmentChunks(profile.id, attempt.id, {
					title: attempt.topic.name,
					technology: attempt.topic.language,
					score: attempt.score ?? 0,
					maxScore: 100,
					completedAt: attempt.completedAt || new Date(),
				});

				chunks.forEach((chunk: any, index: number) => {
					allChunks.push({
						id: generateVectorId(profile.id, "ASSESSMENT", attempt.id, index),
						text: chunk.text,
						metadata: { ...chunk.metadata, text: chunk.text },
					});
				});
				totalItems += chunks.length;
			} catch {
				failedItems++;
			}
		}
	}

	// 6. Process external platform data
	if (profile.includePlatformData) {
		for (const data of profile.externalData) {
			try {
				let chunks: any[];

				if (data.dataType === "GITHUB_REPO") {
					chunks = createGitHubRepoChunks(profile.id, {
						id: data.id,
						name: data.title || "Unknown",
						description: data.description,
						url: data.url || "",
						languages: data.techStack,
						stars: 0,
						forks: 0,
					});
				} else {
					const text = `${data.title || ""}\n${data.description || ""}`.trim();
					if (!text) continue;
					chunks = createProfileChunks(profile.id, data.dataType as any, data.id, text, {
						title: data.title || undefined,
						techStack: data.techStack,
						url: data.url || undefined,
					});
				}

				chunks.forEach((chunk: any, index: number) => {
					allChunks.push({
						id: generateVectorId(profile.id, data.dataType as any, data.id, index),
						text: chunk.text,
						metadata: { ...chunk.metadata, text: chunk.text },
					});
				});
				totalItems += chunks.length;
			} catch {
				failedItems++;
			}
		}
	}

	if (allChunks.length === 0) {
		return { totalItems: 0, processedItems: 0, failedItems };
	}

	// Generate embeddings in batches
	const batchSize = 50;
	const vectorsToUpsert: {
		id: string;
		text: string;
		embedding: number[];
		metadata: Record<string, unknown>;
	}[] = [];

	for (let i = 0; i < allChunks.length; i += batchSize) {
		const batch = allChunks.slice(i, i + batchSize);
		const texts = batch.map((c) => c.text);

		try {
			const embeddings = await generateEmbeddingsBatch(texts);

			batch.forEach((chunk, index) => {
				if (embeddings[index] && embeddings[index].length > 0) {
					vectorsToUpsert.push({
						id: chunk.id,
						text: chunk.text,
						embedding: embeddings[index],
						metadata: chunk.metadata as Record<string, unknown>,
					});
				}
			});
		} catch (error) {
			console.error("Error generating batch embeddings:", error);
			failedItems += batch.length;
		}
	}

	// Upsert to vector database
	if (vectorsToUpsert.length > 0) {
		await upsertVectorsBatch(
			vectorsToUpsert.map((v) => ({
				id: v.id,
				text: v.text,
				embedding: v.embedding,
				metadata: v.metadata as unknown as import("@/types/knowme").EmbeddingMetadata,
			})),
			profile.id
		);

		// Save embedding metadata to database
		const embeddingRecords = vectorsToUpsert.map((v) => ({
			profileId: profile.id,
			sourceType: (v.metadata.sourceType as any) || "OTHER",
			sourceId: (v.metadata.sourceId as string) || v.id,
			chunkIndex: (v.metadata.chunkIndex as number) || 0,
			chunkText: v.metadata.text as string,
			chunkHash: createContentHash(v.metadata.text as string),
			vectorId: v.id,
			vectorNamespace: profile.id,
			metadata: v.metadata as any,
			isActive: true,
		}));

		// Delete existing embeddings for this profile
		await db.delete(knowMeEmbeddings).where(eq(knowMeEmbeddings.profileId, profile.id));

		// Insert new embeddings
		await db.insert(knowMeEmbeddings).values(embeddingRecords);
	}

	return {
		totalItems,
		processedItems: vectorsToUpsert.length,
		failedItems,
	};
}

// ============================================
// MANUAL UPDATE ACTIONS
// ============================================

/**
 * Trigger manual embedding update
 */
export async function triggerManualUpdate(): Promise<
	KnowMeActionResponse<void>
> {
	try {
		const session = await getSession(headers());
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Check if user has credits (if required)
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: { credits: true },
		});

		if (!user || (user.credits ?? 0) < 1) {
			return { success: false, error: "Insufficient credits" };
		}

		// Guarded in SQL rather than by the balance read above, which two
		// concurrent requests both pass. This one still writes its own
		// knowMeCreditTransactions row below, so it takes the guard directly
		// rather than going through `debitCredits`, which writes to the shared
		// creditTransactions ledger instead.
		const debited = await db.update(users)
			.set({ credits: sql`${users.credits} - 1` })
			.where(and(eq(users.id, session.user.id), sql`${users.credits} >= 1`))
			.returning({ credits: users.credits });
		if (debited.length === 0) {
			return { success: false, error: "Insufficient credits" };
		}

		// Log credit transaction
		await db.insert(knowMeCreditTransactions).values({
			userId: session.user.id,
			transactionType: "manual_update",
			amount: -1,
			reason: "Manual KnowMe embedding update",
			balanceBefore: user.credits ?? 0,
			balanceAfter: (user.credits ?? 0) - 1,
		});

		// Trigger embedding generation
		const result = await generateProfileEmbeddings();

		if (!result.success) {
			// Refund credit on failure
			await db.update(users)
				.set({ credits: sql`${users.credits} + 1` })
				.where(eq(users.id, session.user.id));
			return { success: false, error: result.error || "Failed to generate embeddings" };
		}

		return { success: true, message: "Update completed successfully" };
	} catch (error) {
		console.error("Error triggering manual update:", error);
		return { success: false, error: "Failed to trigger update" };
	}
}

/**
 * Delete all embeddings for current user
 */
export async function deleteAllEmbeddings(): Promise<
	KnowMeActionResponse<void>
> {
	try {
		const session = await getSession(headers());
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		const profile = await db.query.knowMeProfiles.findFirst({
			where: eq(knowMeProfiles.userId, session.user.id),
		});

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		// Delete from vector database
		await deleteNamespace(profile.id);

		// Delete from database
		await db.delete(knowMeEmbeddings).where(eq(knowMeEmbeddings.profileId, profile.id));

		// Update profile
		await db.update(knowMeProfiles)
			.set({
				totalEmbeddingsCount: 0,
				lastUpdatedAt: null,
			})
			.where(eq(knowMeProfiles.id, profile.id));

		revalidatePath("/knowme");

		return { success: true, message: "All embeddings deleted" };
	} catch (error) {
		console.error("Error deleting embeddings:", error);
		return { success: false, error: "Failed to delete embeddings" };
	}
}

// ============================================
// JOB STATUS
// ============================================

/**
 * Get embedding job status
 */
export async function getEmbeddingJobStatus(
	jobId: string
): Promise<KnowMeActionResponse<KnowMeEmbeddingJobData>> {
	try {
		const job = await db.query.knowMeEmbeddingJobs.findFirst({
			where: eq(knowMeEmbeddingJobs.id, jobId),
		});

		if (!job) {
			return { success: false, error: "Job not found" };
		}

		return {
			success: true,
			data: {
				id: job.id,
				jobType: job.jobType,
				status: job.status,
				progress: job.progress,
				totalItems: job.totalItems,
				processedItems: job.processedItems,
				failedItems: job.failedItems,
				startedAt: job.startedAt,
				completedAt: job.completedAt,
				errorLogs: job.errorLogs,
			},
		};
	} catch (error) {
		console.error("Error getting job status:", error);
		return { success: false, error: "Failed to get job status" };
	}
}
