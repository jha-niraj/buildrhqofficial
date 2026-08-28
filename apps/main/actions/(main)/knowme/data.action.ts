"use server";

/**
 * KnowMe Data Management Server Actions
 *
 * Handles personal data and platform connections
 */

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import {
    db,
    knowMeProfiles,
    knowMePersonalData,
    knowMePlatformConnections,
    knowMeExternalData,
} from "@repo/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type {
  KnowMeActionResponse,
  KnowMePersonalDataItem,
  KnowMePlatformConnectionItem,
} from "@/types/knowme";
import {
  createContentHash,
  isValidProfileUrl,
  extractUsernameFromUrl,
  calculateNextUpdate,
} from "@/utils/knowme";
import { fetchGithubData } from "@/utils/truefolio/github";

// ============================================
// PERSONAL DATA MANAGEMENT
// ============================================

/**
 * Get all personal data items
 */
export async function getPersonalData(): Promise<
  KnowMeActionResponse<KnowMePersonalDataItem[]>
> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
      with: {
        personalData: {
          where: (pd, { eq }) => eq(pd.isActive, true),
          orderBy: (pd, { desc }) => [desc(pd.createdAt)],
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    return {
      success: true,
      data: profile.personalData.map((pd) => ({
        id: pd.id,
        dataType: pd.dataType,
        title: pd.title,
        fileName: pd.fileName,
        fileUrl: pd.fileUrl,
        fileSize: pd.fileSize,
        isActive: pd.isActive,
        isIndexed: pd.isIndexed,
        createdAt: pd.createdAt,
        updatedAt: pd.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error getting personal data:", error);
    return { success: false, error: "Failed to get personal data" };
  }
}

/**
 * Add personal data (resume, cover letter, etc.)
 */
export async function addPersonalData(data: {
  dataType: string;
  title?: string;
  contentText: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
}): Promise<KnowMeActionResponse<KnowMePersonalDataItem>> {
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

    // Check for duplicates by content hash
    const contentHash = createContentHash(data.contentText);
    const existing = await db.query.knowMePersonalData.findFirst({
      where: and(
        eq(knowMePersonalData.profileId, profile.id),
        eq(knowMePersonalData.contentHash, contentHash),
        eq(knowMePersonalData.isActive, true)
      ),
    });

    if (existing) {
      return { success: false, error: "This content already exists" };
    }

    const [personalData] = await db.insert(knowMePersonalData).values({
      profileId: profile.id,
      dataType: data.dataType as any,
      title: data.title,
      contentText: data.contentText,
      contentHash,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      isActive: true,
      isIndexed: false,
    }).returning();

    revalidatePath("/knowme");

    return {
      success: true,
      data: {
        id: personalData!.id,
        dataType: personalData!.dataType,
        title: personalData!.title,
        fileName: personalData!.fileName,
        fileUrl: personalData!.fileUrl,
        fileSize: personalData!.fileSize,
        isActive: personalData!.isActive,
        isIndexed: personalData!.isIndexed,
        createdAt: personalData!.createdAt,
        updatedAt: personalData!.updatedAt,
      },
      message: "Data added successfully",
    };
  } catch (error) {
    console.error("Error adding personal data:", error);
    return { success: false, error: "Failed to add data" };
  }
}

/**
 * Update personal data
 */
export async function updatePersonalData(
  dataId: string,
  updates: {
    title?: string;
    contentText?: string;
  }
): Promise<KnowMeActionResponse<void>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const personalDataItem = await db.query.knowMePersonalData.findFirst({
      where: eq(knowMePersonalData.id, dataId),
      with: { profile: true },
    });

    if (!personalDataItem || personalDataItem.profile.userId !== session.user.id) {
      return { success: false, error: "Data not found" };
    }

    await db.update(knowMePersonalData)
      .set({
        ...updates,
        contentHash: updates.contentText
          ? createContentHash(updates.contentText)
          : undefined,
        isIndexed: false, // Needs re-indexing
      })
      .where(eq(knowMePersonalData.id, dataId));

    revalidatePath("/knowme");

    return { success: true, message: "Data updated successfully" };
  } catch (error) {
    console.error("Error updating personal data:", error);
    return { success: false, error: "Failed to update data" };
  }
}

/**
 * Delete personal data
 */
export async function deletePersonalData(
  dataId: string
): Promise<KnowMeActionResponse<void>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const personalDataItem = await db.query.knowMePersonalData.findFirst({
      where: eq(knowMePersonalData.id, dataId),
      with: { profile: true },
    });

    if (!personalDataItem || personalDataItem.profile.userId !== session.user.id) {
      return { success: false, error: "Data not found" };
    }

    // Soft delete
    await db.update(knowMePersonalData)
      .set({ isActive: false })
      .where(eq(knowMePersonalData.id, dataId));

    revalidatePath("/knowme");

    return { success: true, message: "Data deleted successfully" };
  } catch (error) {
    console.error("Error deleting personal data:", error);
    return { success: false, error: "Failed to delete data" };
  }
}

// ============================================
// PLATFORM CONNECTIONS
// ============================================

/**
 * Get all platform connections
 */
export async function getPlatformConnections(): Promise<
  KnowMeActionResponse<KnowMePlatformConnectionItem[]>
> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
      with: {
        platformConnections: {
          orderBy: (pc, { desc }) => [desc(pc.createdAt)],
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    return {
      success: true,
      data: profile.platformConnections.map((pc) => ({
        id: pc.id,
        platform: pc.platform,
        platformUsername: pc.platformUsername,
        profileUrl: pc.profileUrl,
        connectionStatus: pc.connectionStatus,
        isConnected: pc.isConnected,
        lastSyncedAt: pc.lastSyncedAt,
        nextSyncAt: pc.nextSyncAt,
        metadata: pc.metadata as Record<string, unknown> | null,
        createdAt: pc.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error getting platform connections:", error);
    return { success: false, error: "Failed to get connections" };
  }
}

/**
 * Connect a platform
 */
export async function connectPlatform(data: {
  platform: string;
  profileUrl: string;
}): Promise<KnowMeActionResponse<KnowMePlatformConnectionItem>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate URL
    if (!isValidProfileUrl(data.platform as any, data.profileUrl)) {
      return { success: false, error: "Invalid profile URL" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Check if already connected
    const existing = await db.query.knowMePlatformConnections.findFirst({
      where: and(
        eq(knowMePlatformConnections.profileId, profile.id),
        eq(knowMePlatformConnections.platform, data.platform as any)
      ),
    });

    if (existing) {
      return { success: false, error: "Platform already connected" };
    }

    // Extract username
    const username = extractUsernameFromUrl(data.platform as any, data.profileUrl);

    // Create connection
    const [connection] = await db.insert(knowMePlatformConnections).values({
      profileId: profile.id,
      platform: data.platform as any,
      platformUsername: username,
      profileUrl: data.profileUrl,
      connectionStatus: "PENDING",
      isConnected: false,
      syncFrequencyDays: 10,
    }).returning();

    // Trigger initial sync
    await syncPlatformData(connection!.id);

    // Fetch updated connection
    const updatedConnection = await db.query.knowMePlatformConnections.findFirst({
      where: eq(knowMePlatformConnections.id, connection!.id),
    });

    if (!updatedConnection) {
      return { success: false, error: "Connection not found after sync" };
    }

    revalidatePath("/knowme");

    return {
      success: true,
      data: {
        id: updatedConnection.id,
        platform: updatedConnection.platform,
        platformUsername: updatedConnection.platformUsername,
        profileUrl: updatedConnection.profileUrl,
        connectionStatus: updatedConnection.connectionStatus,
        isConnected: updatedConnection.isConnected,
        lastSyncedAt: updatedConnection.lastSyncedAt,
        nextSyncAt: updatedConnection.nextSyncAt,
        metadata: updatedConnection.metadata as Record<string, unknown> | null,
        createdAt: updatedConnection.createdAt,
      },
      message: "Platform connected successfully",
    };
  } catch (error) {
    console.error("Error connecting platform:", error);
    return { success: false, error: "Failed to connect platform" };
  }
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(
  connectionId: string
): Promise<KnowMeActionResponse<void>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const connection = await db.query.knowMePlatformConnections.findFirst({
      where: eq(knowMePlatformConnections.id, connectionId),
      with: { profile: true },
    });

    if (!connection || connection.profile.userId !== session.user.id) {
      return { success: false, error: "Connection not found" };
    }

    // Delete external data for this connection
    await db.delete(knowMeExternalData)
      .where(eq(knowMeExternalData.connectionId, connectionId));

    // Delete connection
    await db.delete(knowMePlatformConnections)
      .where(eq(knowMePlatformConnections.id, connectionId));

    revalidatePath("/knowme");

    return { success: true, message: "Platform disconnected" };
  } catch (error) {
    console.error("Error disconnecting platform:", error);
    return { success: false, error: "Failed to disconnect platform" };
  }
}

/**
 * Sync platform data
 */
export async function syncPlatformData(
  connectionId: string
): Promise<KnowMeActionResponse<void>> {
  try {
    const connection = await db.query.knowMePlatformConnections.findFirst({
      where: eq(knowMePlatformConnections.id, connectionId),
      with: { profile: true },
    });

    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    // Update status
    await db.update(knowMePlatformConnections)
      .set({ connectionStatus: "SYNCING" })
      .where(eq(knowMePlatformConnections.id, connectionId));

    try {
      let externalDataItems: Array<{
        dataType: string;
        externalId: string;
        title: string;
        description: string | null;
        url: string;
        techStack: string[];
        dateCreated: Date | null;
        metrics: Record<string, unknown>;
      }> = [];

      switch (connection.platform) {
        case "GITHUB":
          if (connection.platformUsername) {
            const githubData = await fetchGithubData(connection.platformUsername);

            // Convert repos to external data
            externalDataItems = githubData.repositories.map((repo) => ({
              dataType: "GITHUB_REPO",
              externalId: repo.name,
              title: repo.name,
              description: repo.description,
              url: repo.url,
              techStack: repo.techStack,
              dateCreated: repo.lastCommit ? new Date(repo.lastCommit) : null,
              metrics: {
                commits: repo.commitsCount,
              },
            }));

            // Update connection metadata
            await db.update(knowMePlatformConnections)
              .set({
                metadata: {
                  github: {
                    repos: githubData.profile.public_repos,
                    followers: githubData.profile.followers,
                    following: githubData.profile.following,
                    bio: githubData.profile.bio,
                    languages: Object.keys(githubData.summary.primaryLanguages),
                  },
                },
              })
              .where(eq(knowMePlatformConnections.id, connectionId));
          }
          break;

        // Everything except GITHUB has no handler, and it now FAILS rather than
        // falling through to `break`.
        //
        // The silent break was the bug: the connection was created, marked
        // synced, and produced zero external data - so the settings screen said
        // "connected" about a platform that had contributed nothing to the
        // profile, and the user had no way to tell.
        //
        // On LINKEDIN specifically, do NOT reach for
        // `utils/truefolio/linkedin.ts`. Despite its name and signature,
        // `fetchLinkedInData` returns MOCK DATA - a hardcoded fake profile. It
        // has no callers, and wiring it here would fill a real person's public,
        // strangers-can-query-it persona with invented employment history. The
        // real LinkedIn path in this repo is the Exa-backed scrape in the
        // `resume_import` worker job; that is what to reuse if LinkedIn is ever
        // connected here.
        default:
          throw new Error(
            `${connection.platform} cannot be synced yet - only GitHub is connected to a real data source.`,
          );
      }

      // Save external data
      for (const item of externalDataItems) {
        const existingData = await db.query.knowMeExternalData.findFirst({
          where: and(
            eq(knowMeExternalData.profileId, connection.profileId),
            eq(knowMeExternalData.connectionId, connection.id),
            eq(knowMeExternalData.externalId, item.externalId)
          ),
        });

        if (existingData) {
          await db.update(knowMeExternalData)
            .set({
              title: item.title,
              description: item.description,
              url: item.url,
              techStack: item.techStack,
              dateUpdated: new Date(),
              metrics: item.metrics as any,
              isActive: true,
            })
            .where(eq(knowMeExternalData.id, existingData.id));
        } else {
          await db.insert(knowMeExternalData).values({
            profileId: connection.profileId,
            connectionId: connection.id,
            dataType: item.dataType as any,
            externalId: item.externalId,
            title: item.title,
            description: item.description,
            url: item.url,
            techStack: item.techStack,
            dateCreated: item.dateCreated,
            metrics: item.metrics as any,
            isActive: true,
          });
        }
      }

      // Update connection status
      await db.update(knowMePlatformConnections)
        .set({
          connectionStatus: "COMPLETED",
          isConnected: true,
          lastSyncedAt: new Date(),
          nextSyncAt: calculateNextUpdate(connection.syncFrequencyDays),
          lastSyncError: null,
        })
        .where(eq(knowMePlatformConnections.id, connectionId));

      return { success: true, message: "Sync completed" };
    } catch (syncError) {
      // Update connection with error
      await db.update(knowMePlatformConnections)
        .set({
          connectionStatus: "FAILED",
          lastSyncError: (syncError as Error).message,
        })
        .where(eq(knowMePlatformConnections.id, connectionId));

      throw syncError;
    }
  } catch (error) {
    console.error("Error syncing platform:", error);
    return { success: false, error: "Failed to sync platform" };
  }
}

/**
 * Trigger sync for all connected platforms
 */
export async function syncAllPlatforms(): Promise<KnowMeActionResponse<void>> {
  try {
    const session = await getSession(headers());
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const profile = await db.query.knowMeProfiles.findFirst({
      where: eq(knowMeProfiles.userId, session.user.id),
      with: {
        platformConnections: {
          where: (pc, { eq }) => eq(pc.isConnected, true),
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Sync each connection
    for (const connection of profile.platformConnections) {
      await syncPlatformData(connection.id);
    }

    revalidatePath("/knowme");

    return { success: true, message: "All platforms synced" };
  } catch (error) {
    console.error("Error syncing all platforms:", error);
    return { success: false, error: "Failed to sync platforms" };
  }
}
