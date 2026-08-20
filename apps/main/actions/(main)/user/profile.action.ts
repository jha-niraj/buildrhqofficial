"use server"

import { getSession } from '@repo/auth';
import { headers } from 'next/headers';
import {
    db, users, workExperiences, portfolioProjects, projectLinks, projectMedia,
    socialLinks, userEducations, skills, skillEndorsements, certifications,
    userProfiles, profileViews, achievements, recentActivities,
    follow, userProjectV2Progress,
    withTransaction
} from "@repo/db";
import { revalidatePath } from "next/cache";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export type ProfileTheme = "OCEAN_BLUE" | "SUNSET_ORANGE" | "FOREST_GREEN" | "PURPLE_DREAM" | "DARK_MODE";
export type ProfileLayout = "DEFAULT" | "MINIMAL" | "SHOWCASE" | "PORTFOLIO";
export type ProfileVisibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

// ================= WORK EXPERIENCE ACTIONS =================

export async function getWorkExperiences() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", data: [] };
        }

        const experiences = await db.query.workExperiences.findMany({
            where: eq(workExperiences.userId, session.user.id),
            orderBy: [desc(workExperiences.isCurrentlyWorking), desc(workExperiences.startDate)]
        });

        return { success: true, data: experiences };
    } catch (error) {
        console.error("Error fetching work experiences:", error);
        return { success: false, message: "Failed to fetch work experiences", data: [] };
    }
}

export async function addWorkExperience(data: {
    companyName: string;
    companyLogo?: string;
    roleTitle: string;
    companyWebsite?: string;
    description?: string;
    bulletPoints?: string[];
    startDate: Date;
    endDate?: Date;
    isCurrentlyWorking: boolean;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const [experience] = await db.insert(workExperiences).values({
            userId: session.user.id,
            ...data
        }).returning();

        revalidatePath("/profile");
        return { success: true, message: "Work experience added successfully", data: experience };
    } catch (error) {
        console.error("Error adding work experience:", error);
        return { success: false, message: "Failed to add work experience" };
    }
}

export async function updateWorkExperience(id: string, data: {
    companyName?: string;
    companyLogo?: string;
    roleTitle?: string;
    companyWebsite?: string;
    description?: string;
    bulletPoints?: string[];
    startDate?: Date;
    endDate?: Date;
    isCurrentlyWorking?: boolean;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        // Verify ownership
        const existing = await db.query.workExperiences.findFirst({
            where: eq(workExperiences.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        const [experience] = await db.update(workExperiences).set(data).where(eq(workExperiences.id, id)).returning();

        revalidatePath("/profile");
        return { success: true, message: "Work experience updated successfully", data: experience };
    } catch (error) {
        console.error("Error updating work experience:", error);
        return { success: false, message: "Failed to update work experience" };
    }
}

export async function deleteWorkExperience(id: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        // Verify ownership
        const existing = await db.query.workExperiences.findFirst({
            where: eq(workExperiences.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.delete(workExperiences).where(eq(workExperiences.id, id));

        revalidatePath("/profile");
        return { success: true, message: "Work experience deleted successfully" };
    } catch (error) {
        console.error("Error deleting work experience:", error);
        return { success: false, message: "Failed to delete work experience" };
    }
}

// ================= PORTFOLIO PROJECT ACTIONS =================

export async function getPortfolioProjects() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", data: [] };
        }

        const projects = await db.query.portfolioProjects.findMany({
            where: eq(portfolioProjects.userId, session.user.id),
            with: {
                links: true,
                media: true
            },
            orderBy: [desc(portfolioProjects.startDate)]
        });

        return { success: true, data: projects };
    } catch (error) {
        console.error("Error fetching portfolio projects:", error);
        return { success: false, message: "Failed to fetch portfolio projects", data: [] };
    }
}

export async function addPortfolioProject(data: {
    projectName: string;
    projectType: string;
    description?: string;
    bulletPoints?: string[];
    status: string;
    visibility: string;
    technologies: string[];
    startDate: Date;
    endDate?: Date;
    thumbnailUrl?: string;
    links?: { linkType: string; url: string; description?: string | null }[];
    media?: { mediaUrl: string; mediaType: string; caption?: string | null }[];
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const { links, media, ...projectData } = data;

        const [project] = await db.insert(portfolioProjects).values({
            userId: session.user.id,
            ...projectData
        }).returning();

        if (links && links.length > 0) {
            await db.insert(projectLinks).values(
                links.map(l => ({ projectId: project!.id, linkType: l.linkType, url: l.url, description: l.description || null }))
            );
        }

        if (media && media.length > 0) {
            await db.insert(projectMedia).values(
                media.map(m => ({ projectId: project!.id, mediaUrl: m.mediaUrl, mediaType: m.mediaType, caption: m.caption || null }))
            );
        }

        const fullProject = await db.query.portfolioProjects.findFirst({
            where: eq(portfolioProjects.id, project!.id),
            with: { links: true, media: true }
        });

        revalidatePath("/profile");
        return { success: true, message: "Project added successfully", data: fullProject };
    } catch (error) {
        console.error("Error adding portfolio project:", error);
        return { success: false, message: "Failed to add project" };
    }
}

export async function updatePortfolioProject(id: string, data: {
    projectName?: string;
    projectType?: string;
    description?: string;
    bulletPoints?: string[];
    status?: string;
    visibility?: string;
    technologies?: string[];
    startDate?: Date;
    endDate?: Date;
    thumbnailUrl?: string;
    links?: { linkType: string; url: string; description?: string | null }[];
    media?: { mediaUrl: string; mediaType: string; caption?: string | null }[];
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const existing = await db.query.portfolioProjects.findFirst({
            where: eq(portfolioProjects.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        const { links, media, ...projectData } = data;

        await withTransaction(async (tx) => {
            if (Object.keys(projectData).length > 0) {
                await tx.update(portfolioProjects).set(projectData).where(eq(portfolioProjects.id, id));
            }

            if (links !== undefined) {
                await tx.delete(projectLinks).where(eq(projectLinks.projectId, id));
                const validLinks = links.filter((l) => l.url?.trim());
                if (validLinks.length > 0) {
                    await tx.insert(projectLinks).values(
                        validLinks.map((l) => ({
                            projectId: id,
                            linkType: l.linkType,
                            url: l.url,
                            description: l.description || null,
                        }))
                    );
                }
            }

            if (media !== undefined) {
                await tx.delete(projectMedia).where(eq(projectMedia.projectId, id));
                const validMedia = media.filter((m) => m.mediaUrl?.trim());
                if (validMedia.length > 0) {
                    await tx.insert(projectMedia).values(
                        validMedia.map((m) => ({
                            projectId: id,
                            mediaUrl: m.mediaUrl,
                            mediaType: m.mediaType,
                            caption: m.caption || null,
                        }))
                    );
                }
            }
        });

        const project = await db.query.portfolioProjects.findFirst({
            where: eq(portfolioProjects.id, id),
            with: { links: true, media: true }
        });

        revalidatePath("/profile");
        revalidatePath("/ai/resume");
        return { success: true, message: "Project updated successfully", data: project };
    } catch (error) {
        console.error("Error updating portfolio project:", error);
        return { success: false, message: "Failed to update project" };
    }
}

export async function deletePortfolioProject(id: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        // Verify ownership
        const existing = await db.query.portfolioProjects.findFirst({
            where: eq(portfolioProjects.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));

        revalidatePath("/profile");
        return { success: true, message: "Project deleted successfully" };
    } catch (error) {
        console.error("Error deleting portfolio project:", error);
        return { success: false, message: "Failed to delete project" };
    }
}

// ================= SOCIAL LINK ACTIONS =================

export async function getSocialLinks() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", data: [] };
        }

        const links = await db.query.socialLinks.findMany({
            where: eq(socialLinks.userId, session.user.id),
            orderBy: [asc(socialLinks.order), desc(socialLinks.createdAt)]
        });

        return { success: true, data: links };
    } catch (error) {
        console.error("Error fetching social links:", error);
        return { success: false, message: "Failed to fetch social links", data: [] };
    }
}

export async function addSocialLink(data: {
    platform: string;
    url: string;
    label?: string;
    order?: number;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const [socialLink] = await db.insert(socialLinks).values({
            userId: session.user.id,
            ...data
        }).returning();

        revalidatePath("/profile");
        return { success: true, message: "Social link added successfully", data: socialLink };
    } catch (error) {
        console.error("Error adding social link:", error);
        return { success: false, message: "Failed to add social link" };
    }
}

export async function updateSocialLink(id: string, data: {
    platform?: string;
    url?: string;
    label?: string;
    order?: number;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        // Verify ownership
        const existing = await db.query.socialLinks.findFirst({
            where: eq(socialLinks.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        const [socialLink] = await db.update(socialLinks).set(data).where(eq(socialLinks.id, id)).returning();

        revalidatePath("/profile");
        return { success: true, message: "Social link updated successfully", data: socialLink };
    } catch (error) {
        console.error("Error updating social link:", error);
        return { success: false, message: "Failed to update social link" };
    }
}

export async function deleteSocialLink(id: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        // Verify ownership
        const existing = await db.query.socialLinks.findFirst({
            where: eq(socialLinks.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.delete(socialLinks).where(eq(socialLinks.id, id));

        revalidatePath("/profile");
        return { success: true, message: "Social link deleted successfully" };
    } catch (error) {
        console.error("Error deleting social link:", error);
        return { success: false, message: "Failed to delete social link" };
    }
}

// ================= USER EDUCATION ACTIONS =================

export async function getUserEducations() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", data: [] };
        }

        const educations = await db.query.userEducations.findMany({
            where: eq(userEducations.userId, session.user.id),
            orderBy: [asc(userEducations.order), desc(userEducations.startDate)]
        });

        return { success: true, data: educations };
    } catch (error) {
        console.error("Error fetching educations:", error);
        return { success: false, message: "Failed to fetch educations", data: [] };
    }
}

export async function addUserEducation(data: {
    degree?: string;
    institution: string;
    startDate: Date;
    endDate?: Date;
    bulletPoints?: string[];
    order?: number;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const [education] = await db.insert(userEducations).values({
            userId: session.user.id,
            ...data
        }).returning();

        revalidatePath("/profile");
        revalidatePath("/ai/resume");
        return { success: true, message: "Education added successfully", data: education };
    } catch (error) {
        console.error("Error adding education:", error);
        return { success: false, message: "Failed to add education" };
    }
}

export async function updateUserEducation(id: string, data: {
    degree?: string;
    institution?: string;
    startDate?: Date;
    endDate?: Date;
    bulletPoints?: string[];
    order?: number;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const existing = await db.query.userEducations.findFirst({
            where: eq(userEducations.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        const [education] = await db.update(userEducations).set(data).where(eq(userEducations.id, id)).returning();

        revalidatePath("/profile");
        revalidatePath("/ai/resume");
        return { success: true, message: "Education updated successfully", data: education };
    } catch (error) {
        console.error("Error updating education:", error);
        return { success: false, message: "Failed to update education" };
    }
}

export async function deleteUserEducation(id: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        const existing = await db.query.userEducations.findFirst({
            where: eq(userEducations.id, id),
            columns: { userId: true }
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await db.delete(userEducations).where(eq(userEducations.id, id));

        revalidatePath("/profile");
        revalidatePath("/ai/resume");
        return { success: true, message: "Education deleted successfully" };
    } catch (error) {
        console.error("Error deleting education:", error);
        return { success: false, message: "Failed to delete education" };
    }
}

/**
 * Get public resume by username (shareable URL: /resume/[username])
 */
export async function getPublicResumeByUsername(username: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
            columns: {
                id: true,
                name: true,
                username: true,
                occupation: true,
                location: true,
                image: true,
            },
        });
        if (!user) return { success: false, error: "Resume not found" };

        const [experiences, projects, userSkills, educations, certs, links] = await Promise.all([
            db.query.workExperiences.findMany({
                where: eq(workExperiences.userId, user.id),
                orderBy: [desc(workExperiences.isCurrentlyWorking), desc(workExperiences.startDate)]
            }),
            db.query.portfolioProjects.findMany({
                where: eq(portfolioProjects.userId, user.id),
                with: { links: true },
                orderBy: [desc(portfolioProjects.startDate)]
            }),
            db.query.skills.findMany({
                where: eq(skills.userId, user.id),
                orderBy: [asc(skills.order), asc(skills.name)]
            }),
            db.query.userEducations.findMany({
                where: eq(userEducations.userId, user.id),
                orderBy: [asc(userEducations.order), desc(userEducations.startDate)]
            }),
            db.query.certifications.findMany({
                where: eq(certifications.userId, user.id),
                orderBy: [desc(certifications.issuedDate)]
            }),
            db.query.socialLinks.findMany({
                where: eq(socialLinks.userId, user.id),
                orderBy: [asc(socialLinks.order)]
            }),
        ]);

        return {
            success: true,
            user: {
                ...user,
                experiences,
                portfolioProjects: projects,
                skills: userSkills,
                educations,
                certifications: certs,
                socialLinks: links,
            }
        };
    } catch (error) {
        console.error("Error fetching public resume:", error);
        return { success: false, error: "Failed to load resume" };
    }
}

// ================= PROFILE COMPLETION =================

export async function getProfileCompletion() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", completion: 0 };
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user) {
            return { success: false, message: "User not found", completion: 0 };
        }

        const [userExperiences, userProjects, userSocialLinks, userSkills] = await Promise.all([
            db.query.workExperiences.findMany({ where: eq(workExperiences.userId, user.id) }),
            db.query.portfolioProjects.findMany({ where: eq(portfolioProjects.userId, user.id) }),
            db.query.socialLinks.findMany({ where: eq(socialLinks.userId, user.id) }),
            db.query.skills.findMany({ where: eq(skills.userId, user.id) }),
        ]);

        // Calculate completion percentage based on 6 key items shown in dialog
        let completed = 0;
        const total = 7;

        const defaultImage = "https://tse4.mm.bing.net/th?id=OIP.-BS8Y2nH1k93GJiitUVBCAHaHa&pid=Api&P=0";

        // 1. Basic Information (name, bio, profile picture)
        const hasBasicInfo = !!(user.name && user.bio && user.image && user.image !== defaultImage);
        if (hasBasicInfo) completed++;

        // 2. Resume
        const hasResume = !!user.resume;
        if (hasResume) completed++;

        // 3. Work Experience
        const hasExperience = userExperiences.length > 0;
        if (hasExperience) completed++;

        // 4. Portfolio Projects
        const hasProjects = userProjects.length > 0;
        if (hasProjects) completed++;

        // 5. Social Links
        const hasSocials = userSocialLinks.length > 0;
        if (hasSocials) completed++;

        // 6. Skills
        const hasSkills = userSkills && userSkills.length > 0;
        if (hasSkills) completed++;

        // 7. Career Details
        const hasCareerDetails = !!(user.careerGoals?.length > 0 || user.targetCompanies?.length > 0 || user.expectedSalary);
        if (hasCareerDetails) completed++;

        const completionPercentage = Math.round((completed / total) * 100);

        return {
            success: true,
            completion: completionPercentage,
            details: {
                hasBasicInfo,
                hasResume,
                hasExperience,
                hasProjects,
                hasSocials,
                hasSkills,
                hasCareerDetails
            }
        };
    } catch (error) {
        console.error("Error calculating profile completion:", error);
        return { success: false, message: "Failed to calculate profile completion", completion: 0 };
    }
}

// ============================================
// PROFILE REDESIGN - NEW FEATURES
// ============================================

/**
 * Get user's own profile (full access)
 */
export async function getOwnProfile() {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const [
            userProfile,
            userPortfolioProjects,
            projectProgressList,
            userSkills,
            userRecentActivities,
            userAchievementsList,
            userExperiences,
            userCertifications,
            userSocialLinks,
            userEdus,
        ] = await Promise.all([
            db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) }),
            db.query.portfolioProjects.findMany({
                where: eq(portfolioProjects.userId, user.id),
                with: { links: true },
                orderBy: [desc(portfolioProjects.startDate)]
            }),
            db.query.userProjectV2Progress.findMany({
                where: eq(userProjectV2Progress.userId, user.id),
                with: {
                    project: {
                        columns: {
                            id: true,
                            slug: true,
                            title: true,
                            shortDescription: true,
                            description: true,
                            technologies: true,
                            generationType: true,
                            difficulty: true,
                        }
                    }
                },
                orderBy: (t, { desc }) => [desc(t.createdAt)]
            }),
            db.query.skills.findMany({
                where: eq(skills.userId, user.id),
                with: { endorsements: true }
            }),
            db.query.recentActivities.findMany({
                where: eq(recentActivities.userId, user.id),
                orderBy: [desc(recentActivities.createdAt)],
                limit: 20
            }),
            db.query.achievements.findMany({
                where: eq(achievements.userId, user.id),
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                limit: 10
            }),
            db.query.workExperiences.findMany({
                where: eq(workExperiences.userId, user.id),
                orderBy: [desc(workExperiences.startDate)]
            }),
            db.query.certifications.findMany({
                where: eq(certifications.userId, user.id),
                orderBy: [desc(certifications.issuedDate)]
            }),
            db.query.socialLinks.findMany({
                where: eq(socialLinks.userId, user.id),
                orderBy: [asc(socialLinks.order), desc(socialLinks.createdAt)]
            }),
            db.query.userEducations.findMany({
                where: eq(userEducations.userId, user.id),
                orderBy: [asc(userEducations.order), desc(userEducations.startDate)]
            }),
        ]);

        const achievementsList = userAchievementsList.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
        }));

        return {
            success: true,
            user: {
                ...user,
                userProfile,
                portfolioProjects: userPortfolioProjects,
                UserProjectV2Progress: projectProgressList,
                skills: userSkills,
                recentActivity: userRecentActivities,
                achievements: achievementsList,
                experiences: userExperiences,
                certifications: userCertifications,
                socialLinks: userSocialLinks,
                educations: userEdus,
            }
        };
    } catch (error) {
        console.error("Error fetching own profile:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}

/**
 * Get public profile by username with access control
 */
export async function getPublicProfile(username: string) {
    try {
        const session = await getSession(headers());
        const viewerId = session?.user?.id;

        // Find the profile owner
        const profileOwner = await db.query.users.findFirst({
            where: eq(users.username, username),
        });

        if (!profileOwner) {
            return { success: false, error: "User not found" };
        }

        // Check if viewer is the owner
        const isOwnProfile = viewerId === profileOwner.id;

        // Get or create profile settings
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, profileOwner.id)
        });

        if (!profile) {
            // Create default profile if doesn't exist
            const [newProfile] = await db.insert(userProfiles).values({
                userId: profileOwner.id,
            }).returning();
            profile = newProfile!;
        }

        // Check access based on privacy settings
        if (!isOwnProfile) {
            if (profile.visibility === "PRIVATE") {
                return { success: false, error: "This profile is private" };
            }

            if (profile.visibility === "FOLLOWERS") {
                // Check if viewer is following the profile owner
                const isFollowing = viewerId ? await db.query.follow.findFirst({
                    where: and(
                        eq(follow.followerId, viewerId),
                        eq(follow.followingId, profileOwner.id)
                    )
                }) : null;

                if (!isFollowing) {
                    return {
                        success: false,
                        error: "This profile is only visible to followers",
                    };
                }
            }

            // Track profile view
            await trackProfileView(profile.id, viewerId || null, "direct");
        }

        const [
            userPortfolioProjects,
            projectProgressList,
            userSkills,
            userRecentActivities,
            userAchievementsList,
            userExperiences,
            userCertifications,
            userSocialLinks,
            userEdus,
        ] = await Promise.all([
            db.query.portfolioProjects.findMany({
                where: eq(portfolioProjects.userId, profileOwner.id),
                with: { links: true },
                orderBy: [desc(portfolioProjects.startDate)]
            }),
            db.query.userProjectV2Progress.findMany({
                where: eq(userProjectV2Progress.userId, profileOwner.id),
                with: {
                    project: {
                        columns: {
                            id: true,
                            slug: true,
                            title: true,
                            shortDescription: true,
                            description: true,
                            technologies: true,
                            generationType: true,
                            difficulty: true,
                        }
                    }
                },
                orderBy: (t, { desc }) => [desc(t.createdAt)]
            }),
            db.query.skills.findMany({
                where: eq(skills.userId, profileOwner.id),
                with: { endorsements: true }
            }),
            db.query.recentActivities.findMany({
                where: eq(recentActivities.userId, profileOwner.id),
                orderBy: [desc(recentActivities.createdAt)],
                limit: 20
            }),
            db.query.achievements.findMany({
                where: eq(achievements.userId, profileOwner.id),
                orderBy: (t, { desc }) => [desc(t.createdAt)],
                limit: 10
            }),
            db.query.workExperiences.findMany({
                where: eq(workExperiences.userId, profileOwner.id),
                orderBy: [desc(workExperiences.startDate)]
            }),
            db.query.certifications.findMany({
                where: eq(certifications.userId, profileOwner.id),
                orderBy: [desc(certifications.issuedDate)]
            }),
            db.query.socialLinks.findMany({
                where: eq(socialLinks.userId, profileOwner.id),
                orderBy: [asc(socialLinks.order), desc(socialLinks.createdAt)]
            }),
            db.query.userEducations.findMany({
                where: eq(userEducations.userId, profileOwner.id),
                orderBy: [asc(userEducations.order), desc(userEducations.startDate)]
            }),
        ]);

        const achievementsList = userAchievementsList.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
        }));

        const fullProfileOwner = {
            ...profileOwner,
            userProfile: profile,
            portfolioProjects: userPortfolioProjects,
            UserProjectV2Progress: projectProgressList,
            skills: userSkills,
            recentActivity: userRecentActivities,
            achievements: achievementsList,
            experiences: userExperiences,
            certifications: userCertifications,
            socialLinks: userSocialLinks,
            educations: userEdus,
        };

        if (!isOwnProfile) {
            const filteredUser = {
                ...fullProfileOwner,
                email: profile.showEmail ? profileOwner.email : null,
                phone: null,
                resume: profile.showResume ? profileOwner.resume : null,
                resumeText: null,
                recentActivity: profile.showActivity ? userRecentActivities : [],
            };

            return {
                success: true,
                user: filteredUser,
                isOwnProfile: false,
                canEdit: false,
            };
        }

        return {
            success: true,
            user: fullProfileOwner,
            isOwnProfile: true,
            canEdit: true,
        };
    } catch (error) {
        console.error("Error fetching public profile:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}

/**
 * Track a profile view for analytics
 */
export async function trackProfileView(
    profileId: string,
    viewerId: string | null,
    source: string = "direct"
) {
    try {
        // Don't track owner's own views
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.id, profileId),
            columns: { userId: true },
        });

        if (profile?.userId === viewerId) {
            return { success: true };
        }

        await db.insert(profileViews).values({
            profileId,
            viewerId,
            source,
        });

        // Increment profile view count
        await db.update(userProfiles).set({
            profileViews: sql`${userProfiles.profileViews} + 1`
        }).where(eq(userProfiles.id, profileId));

        return { success: true };
    } catch (error) {
        console.error("Error tracking profile view:", error);
        return { success: false, error: "Failed to track view" };
    }
}

/**
 * Update profile settings
 */
export async function updateProfileSettings(data: {
    coverGradient?: string;
    theme?: ProfileTheme;
    layout?: ProfileLayout;
    tagline?: string;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        // Get or create profile
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, session.user.id),
        });

        if (!profile) {
            const [newProfile] = await db.insert(userProfiles).values({
                userId: session.user.id,
            }).returning();
            profile = newProfile!;
        }

        // Update profile
        const [updatedProfile] = await db.update(userProfiles).set({
            ...(data.coverGradient && { coverGradient: data.coverGradient }),
            ...(data.theme && { theme: data.theme }),
            ...(data.layout && { layout: data.layout }),
            ...(data.tagline !== undefined && { tagline: data.tagline }),
        }).where(eq(userProfiles.id, profile.id)).returning();

        // Recalculate completion score
        await calculateNewProfileCompletion(session.user.id);

        revalidatePath("/profile");
        return { success: true, profile: updatedProfile };
    } catch (error) {
        console.error("Error updating profile settings:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

/**
 * Update profile privacy settings
 */
export async function updatePrivacySettings(data: {
    visibility?: ProfileVisibility;
    showEmail?: boolean;
    showResume?: boolean;
    showActivity?: boolean;
    showStats?: boolean;
    allowEndorsements?: boolean;
    allowMessages?: boolean;
}) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        // Get or create profile
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, session.user.id),
        });

        if (!profile) {
            const [newProfile] = await db.insert(userProfiles).values({
                userId: session.user.id,
            }).returning();
            profile = newProfile!;
        }

        // Update privacy settings
        const [updatedProfile] = await db.update(userProfiles).set(data).where(
            eq(userProfiles.id, profile.id)
        ).returning();

        revalidatePath("/profile");
        return { success: true, profile: updatedProfile };
    } catch (error) {
        console.error("Error updating privacy settings:", error);
        return { success: false, error: "Failed to update privacy settings" };
    }
}

// ============================================
// SKILL ENDORSEMENTS
// ============================================

/**
 * Endorse a skill
 */
export async function endorseSkill(skillId: string, message?: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        // Check if skill exists
        const skill = await db.query.skills.findFirst({
            where: eq(skills.id, skillId),
            with: { user: true },
        });

        if (!skill) {
            return { success: false, error: "Skill not found" };
        }

        // Can't endorse own skills
        if (skill.userId === session.user.id) {
            return { success: false, error: "Cannot endorse your own skills" };
        }

        // Check if already endorsed
        const existingEndorsement = await db.query.skillEndorsements.findFirst({
            where: and(
                eq(skillEndorsements.skillId, skillId),
                eq(skillEndorsements.endorserId, session.user.id)
            ),
        });

        if (existingEndorsement) {
            return { success: false, error: "Already endorsed this skill" };
        }

        // Create endorsement
        await db.insert(skillEndorsements).values({
            skillId,
            endorserId: session.user.id,
            message,
        });

        revalidatePath(`/profile/${skill.user.username}`);
        return { success: true };
    } catch (error) {
        console.error("Error endorsing skill:", error);
        return { success: false, error: "Failed to endorse skill" };
    }
}

/**
 * Remove skill endorsement
 */
export async function removeEndorsement(skillId: string) {
    try {
        const session = await getSession(headers());
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        await db.delete(skillEndorsements).where(
            and(
                eq(skillEndorsements.skillId, skillId),
                eq(skillEndorsements.endorserId, session.user.id)
            )
        );

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error removing endorsement:", error);
        return { success: false, error: "Failed to remove endorsement" };
    }
}

// ============================================
// PROFILE ANALYTICS
// ============================================

/**
 * Get profile analytics
 */
export async function getProfileAnalytics(userId?: string) {
    try {
        const session = await getSession(headers());
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) {
            return { success: false, error: "User ID required" };
        }

        // Only allow viewing own analytics
        if (session?.user?.id !== targetUserId) {
            return { success: false, error: "Unauthorized" };
        }

        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, targetUserId),
            with: {
                views: {
                    orderBy: [desc(profileViews.viewedAt)],
                    limit: 100,
                },
            },
        });

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        // Calculate analytics
        const totalViews = profile.profileViews;
        const last7DaysViews = profile.views.filter(
            (v) =>
                new Date(v.viewedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;

        const last30DaysViews = profile.views.filter(
            (v) =>
                new Date(v.viewedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        // Source breakdown
        const sourceBreakdown = profile.views.reduce((acc: Record<string, number>, view) => {
            const source = view.source || "direct";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        // Geographic breakdown
        const geoBreakdown = profile.views.reduce((acc: Record<string, number>, view) => {
            if (view.country) {
                acc[view.country] = (acc[view.country] || 0) + 1;
            }
            return acc;
        }, {});

        return {
            success: true,
            analytics: {
                totalViews,
                last7DaysViews,
                last30DaysViews,
                sourceBreakdown,
                geoBreakdown,
                recentViews: profile.views.slice(0, 20),
            },
        };
    } catch (error) {
        console.error("Error fetching profile analytics:", error);
        return { success: false, error: "Failed to fetch analytics" };
    }
}

// ============================================
// NEW PROFILE COMPLETION (WITH PROFILE REDESIGN)
// ============================================

/**
 * Calculate profile completion score (new version with profile customization)
 */
export async function calculateNewProfileCompletion(userId: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const [userProfile, userSkills, userExperiences, userCertifications, userProjects, userSocialLinks] = await Promise.all([
            db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) }),
            db.query.skills.findMany({ where: eq(skills.userId, userId) }),
            db.query.workExperiences.findMany({ where: eq(workExperiences.userId, userId) }),
            db.query.certifications.findMany({ where: eq(certifications.userId, userId) }),
            db.query.portfolioProjects.findMany({ where: eq(portfolioProjects.userId, userId) }),
            db.query.socialLinks.findMany({ where: eq(socialLinks.userId, userId) }),
        ]);

        let score = 0;

        // Basic info (25 points)
        if (user.name) score += 5;
        if (user.image) score += 5;
        if (user.bio) score += 10;
        if (user.location) score += 5;

        // Profile customization (10 points)
        if (userProfile?.coverGradient) score += 5;
        if (userProfile?.tagline) score += 3;
        if (userProfile?.theme) score += 2;

        // Career Details (15 points)
        if (user.careerGoals && user.careerGoals.length > 0) score += 5;
        if (user.targetCompanies && user.targetCompanies.length > 0) score += 5;
        if (user.expectedSalary) score += 5;

        // Skills (15 points)
        if (userSkills.length > 0) score += 5;
        if (userSkills.length >= 5) score += 5;
        if (userSkills.length >= 10) score += 5;

        // Experience (10 points)
        if (userExperiences.length > 0) score += 10;

        // Education & Certifications (10 points)
        if (user.university) score += 5;
        if (userCertifications.length > 0) score += 5;

        // Projects (10 points)
        if (userProjects.length > 0) score += 5;
        if (userProjects.length >= 3) score += 5;

        // Social & Contact (5 points)
        if (userSocialLinks && userSocialLinks.length > 0) score += 3;
        if (user.website) score += 2;

        // Update profile with new score
        if (userProfile) {
            await db.update(userProfiles).set({
                completionScore: score
            }).where(eq(userProfiles.id, userProfile.id));
        }

        return { success: true, score };
    } catch (error) {
        console.error("Error calculating profile completion:", error);
        return { success: false, error: "Failed to calculate completion" };
    }
}

/**
 * Get profile by username (for public viewing)
 */
export async function getProfileByUsername(username: string) {
    try {
        const session = await getSession(headers());
        const viewerId = session?.user?.id;

        // First check if it's own profile
        const targetUser = await db.query.users.findFirst({
            where: eq(users.username, username),
            columns: { id: true },
        });

        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        const isOwnProfile = viewerId === targetUser.id;

        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const [
            userProfile,
            userPortfolioProjects,
            userSkills,
            userExperiences,
            userEducationsList,
            userCertifications,
            userAchievementsList,
            userSocialLinks,
            userRecentActivities,
        ] = await Promise.all([
            db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) }),
            db.query.portfolioProjects.findMany({
                where: isOwnProfile
                    ? eq(portfolioProjects.userId, user.id)
                    : and(eq(portfolioProjects.userId, user.id), eq(portfolioProjects.visibility, "Public")),
                with: { links: true, media: true },
                orderBy: [desc(portfolioProjects.startDate)],
                limit: 20,
            }),
            db.query.skills.findMany({
                where: eq(skills.userId, user.id),
                with: { endorsements: true }
            }),
            db.query.workExperiences.findMany({
                where: eq(workExperiences.userId, user.id),
                orderBy: [desc(workExperiences.startDate)]
            }),
            // Education was missing here while every other section was fetched,
            // so a public profile silently showed "No education listed" no matter
            // what the user had entered.
            db.query.userEducations.findMany({
                where: eq(userEducations.userId, user.id),
                orderBy: [desc(userEducations.startDate)]
            }),
            db.query.certifications.findMany({
                where: eq(certifications.userId, user.id),
                orderBy: [desc(certifications.issuedDate)]
            }),
            db.query.achievements.findMany({
                where: eq(achievements.userId, user.id),
            }),
            db.query.socialLinks.findMany({ where: eq(socialLinks.userId, user.id) }),
            db.query.recentActivities.findMany({
                where: eq(recentActivities.userId, user.id),
                orderBy: [desc(recentActivities.createdAt)],
                limit: 10
            }),
        ]);

        // Check if viewer is following the user
        let isFollowing = false;
        if (viewerId && !isOwnProfile) {
            const followRecord = await db.query.follow.findFirst({
                where: and(
                    eq(follow.followerId, viewerId),
                    eq(follow.followingId, user.id)
                ),
            });
            isFollowing = !!followRecord;
        }

        // Get follow counts
        const [followersResult, followingResult] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(follow).where(eq(follow.followingId, user.id)),
            db.select({ count: sql<number>`count(*)` }).from(follow).where(eq(follow.followerId, user.id)),
        ]);

        const followersCount = Number(followersResult[0]?.count ?? 0);
        const followingCount = Number(followingResult[0]?.count ?? 0);

        return {
            success: true,
            user: {
                ...user,
                userProfile,
                portfolioProjects: userPortfolioProjects,
                skills: userSkills,
                experiences: userExperiences,
                educations: userEducationsList,
                certifications: userCertifications,
                achievements: userAchievementsList,
                socialLinks: userSocialLinks,
                recentActivity: userRecentActivities,
                followersCount,
                followingCount,
            },
            isOwnProfile,
            isFollowing,
        };
    } catch (error) {
        console.error("Error fetching profile by username:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}

/**
 * Get user stats for profile
 */
export async function getUserProfileStats(userId: string) {
    try {
        const [
            portfolioCountResult,
            platformCountResult,
            skillsCountResult,
            achievementsCountResult,
            experienceCountResult,
            followersCountResult,
            followingCountResult,
            user,
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(portfolioProjects).where(eq(portfolioProjects.userId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(userProjectV2Progress).where(eq(userProjectV2Progress.userId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(skills).where(eq(skills.userId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(achievements).where(eq(achievements.userId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(workExperiences).where(eq(workExperiences.userId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(follow).where(eq(follow.followingId, userId)),
            db.select({ count: sql<number>`count(*)` }).from(follow).where(eq(follow.followerId, userId)),
            db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: {
                    currentXp: true,
                    totalXp: true,
                    currentLevel: true,
                    credits: true,
                },
            }),
        ]);

        const projectsCount = Number(portfolioCountResult[0]?.count ?? 0) + Number(platformCountResult[0]?.count ?? 0);

        return {
            success: true,
            stats: {
                projectsCount,
                skillsCount: Number(skillsCountResult[0]?.count ?? 0),
                achievementsCount: Number(achievementsCountResult[0]?.count ?? 0),
                experienceCount: Number(experienceCountResult[0]?.count ?? 0),
                followersCount: Number(followersCountResult[0]?.count ?? 0),
                followingCount: Number(followingCountResult[0]?.count ?? 0),
                xp: user?.currentXp || 0,
                totalXp: user?.totalXp || 0,
                level: user?.currentLevel || 1,
                credits: user?.credits || 0,
            },
        };
    } catch (error) {
        console.error("Error fetching user profile stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}
