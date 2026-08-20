"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    AlertCircle, RefreshCw, Pencil, Share2, Settings, Plus, MapPin, Building2,
    Globe, GraduationCap, Briefcase, Sparkles, Zap, FolderKanban, Users,
    ExternalLink, Calendar, FileText, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import toast from "@repo/ui/components/ui/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useUserStore } from "@/app/store/useUserStore";
import { ShareProfileModal, EditProfileModal } from "@/components/profile";
import {
    ProfileView, type ProfileViewData, type ProfileViewStats,
} from "@/components/profile/profile-view";
import { AddSkillsSheet } from "@/components/profile/sheets/add-skills-sheet";
import { AddWorkExperienceSheet } from "@/components/profile/sheets/add-work-experience-sheet";
import { AddEducationSheet } from "@/components/profile/sheets/add-education-sheet";
import { AddProjectSheet } from "@/components/profile/sheets/add-project-sheet";
import { getOwnProfile, getUserProfileStats } from "@/actions/(main)/user/profile.action";
import { uploadResume, deleteResume, getResumeSignedUrl } from "@/actions/(main)/user/resume.action";
import { ProfileSkeleton } from "@/components/profile/profile-view-skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
    projectsCount: number;
    skillsCount: number;
    followersCount: number;
    followingCount: number;
    xp: number;
    level: number;
    credits: number;
}

interface Skill { id: string; name: string; level: string; category: string }

interface ProfileData {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    totalXp: number;
    currentXp: number;
    currentLevel: number;
    credits?: number;
    location: string | null;
    company: string | null;
    occupation: string | null;
    website: string | null;
    university: string | null;
    semester: string | null;
    hasResume: boolean;
    resume: string | null;
    createdAt: Date;
    skills: Skill[];
    experiences: Array<{
        id: string;
        companyName: string;
        roleTitle: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        isCurrentlyWorking: boolean;
        companyWebsite: string | null;
    }>;
    educations?: Array<{
        id: string;
        institution: string;
        degree: string | null;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    portfolioProjects?: Array<{
        id: string;
        projectName: string;
        projectType: string;
        description: string | null;
        status: string;
        technologies: string[];
        thumbnailUrl: string | null;
    }>;
    socialLinks?: Array<{ id: string; platform: string; url: string }>;
    userProfile?: {
        showEmail: boolean;
        coverGradient: string | null;
        tagline: string | null;
        theme: string;
        profileViews: number;
        completionScore: number;
    } | null;
    _count?: { followers: number; following: number };
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Section({ title, icon: Icon, action, children }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    action?: { label: string; onClick: () => void };
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-neutral-900" />
                    <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                {action && (
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-900"
                    >
                        <Plus className="h-3.5 w-3.5" /> {action.label}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className="cursor-pointer text-sm font-medium text-neutral-900 hover:underline"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

function dateRange(start: Date | string | null, end: Date | string | null, current?: boolean) {
    const fmt = (d: Date | string) =>
        new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!start) return current ? "Present" : "";
    return `${fmt(start)} - ${current ? "Present" : end ? fmt(end) : "Present"}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user: storeUser, isLoading: storeLoading, error: storeError, fetchUser } = useUserStore();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [shareOpen, setShareOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [skillsOpen, setSkillsOpen] = useState(false);
    const [experienceOpen, setExperienceOpen] = useState(false);
    const [educationOpen, setEducationOpen] = useState(false);
    const [projectOpen, setProjectOpen] = useState(false);
    const [resumeBusy, setResumeBusy] = useState(false);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await fetchUser();
            const profileResult = await getOwnProfile();
            if (!profileResult.success) {
                setError(profileResult.error || "Failed to load profile");
                return;
            }
            setProfileData((profileResult.user as ProfileData) || null);
            if (profileResult.user?.id) {
                const statsResult = await getUserProfileStats(profileResult.user.id);
                if (statsResult.success && statsResult.stats) setStats(statsResult.stats);
            }
        } catch (err) {
            console.error("Error loading profile:", err);
            setError("Failed to load profile data");
        } finally {
            setIsLoading(false);
        }
    }, [fetchUser]);

    // No spinner: used after an edit, where the page is already on screen and a
    // flash back to the loading state would be worse than a beat of stale data.
    const refreshProfileData = useCallback(async () => {
        try {
            const profileResult = await getOwnProfile();
            if (profileResult.success && profileResult.user) {
                setProfileData(profileResult.user as ProfileData);
                const statsResult = await getUserProfileStats(profileResult.user.id);
                if (statsResult.success && statsResult.stats) setStats(statsResult.stats);
            }
        } catch (err) {
            console.error("Error refreshing profile:", err);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    // ── Resume ────────────────────────────────────────────────────────────────
    // The SAME pipeline onboarding uses: `uploadResume` stores the file on R2,
    // extracts its text with unpdf (PDF) or mammoth (DOCX), and dispatches the
    // `resume_structure` worker job that turns that text into a structured,
    // editable draft - defaulted if the user has none yet.
    //
    // The third argument is what names that draft. Omitting it is not an error,
    // it just produces "Imported resume" instead of something recognisable.
    const handleUploadResume = useCallback(async (file: File) => {
        setResumeBusy(true);
        try {
            const result = await uploadResume(file, undefined, { draftName: "My resume" });
            if (!result.success) {
                toast.error(result.message ?? "Could not upload that file");
                return;
            }
            if (result.structureJobId) {
                // The parse runs off the request path and lands minutes later. Say
                // so, or the structured draft appearing at /ai/resume looks like
                // something the user did not ask for.
                toast.success("Resume uploaded. We're reading it now - an editable version will appear in your Resume Builder shortly.");
            } else {
                // Stored and viewable, but no text came out of it - almost always a
                // scanned or image-only PDF. Silently succeeding here is how a user
                // ends up wondering why their AI resume never showed up.
                toast.warning("Resume saved, but we could not read any text from it. If it is a scanned PDF, upload a text-based export to use the AI features.");
            }
            await refreshProfileData();
        } catch {
            toast.error("Failed to upload resume");
        } finally {
            setResumeBusy(false);
        }
    }, [refreshProfileData]);

    // Fetched on click rather than held on the page: the URL is time-limited and
    // would expire while an open tab sat idle.
    const handleViewResume = useCallback(async () => {
        const res = await getResumeSignedUrl();
        if (res?.url) window.open(res.url, "_blank");
        else toast.error("Could not open your resume");
    }, []);

    const handleDeleteResume = useCallback(async () => {
        // Removes the stored file AND the extracted text, and is not undoable.
        if (!window.confirm("Delete your resume? This removes the file and the text we extracted from it.")) return;
        setResumeBusy(true);
        try {
            await deleteResume();
            toast.success("Resume deleted");
            await refreshProfileData();
        } catch {
            toast.error("Failed to delete resume");
        } finally {
            setResumeBusy(false);
        }
    }, [refreshProfileData]);

    const onSheetSuccess = useCallback(() => {
        void refreshProfileData();
        toast.success("Profile updated");
    }, [refreshProfileData]);

    // Merge the store user over the fetched profile so an Edit Profile save shows
    // instantly without waiting for the refetch to land.
    const profile = useMemo(() => {
        if (!profileData) return null;
        if (!storeUser) return profileData;
        return {
            ...profileData,
            name: storeUser.name ?? profileData.name,
            bio: storeUser.bio ?? profileData.bio,
            location: storeUser.location ?? profileData.location,
            company: storeUser.company ?? profileData.company,
            occupation: storeUser.occupation ?? profileData.occupation,
            website: storeUser.website ?? profileData.website,
        };
    }, [profileData, storeUser]);

    if ((isLoading || storeLoading) && !profileData) return <ProfileSkeleton />;

    if (error || storeError) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-7 w-7 text-destructive" />
                        </div>
                        <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
                        <p className="mb-6 text-muted-foreground">{error || storeError}</p>
                        <Button onClick={() => void loadProfile()} className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="py-10 text-center">
                        <h2 className="mb-2 text-xl font-semibold">Sign in to view your profile</h2>
                        <p className="mb-6 text-muted-foreground">
                            Create an account or sign in to access your developer profile.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" asChild><Link href="/register">Create account</Link></Button>
                            <Button asChild><Link href="/signin">Sign in</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Normalised for the shared view. The two profile routes come from different
    // sources with different shapes, so each one maps at its own boundary and the
    // view gets one explicit interface.
    const view: ProfileViewData = {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        image: profile.image,
        bio: profile.bio,
        headline: profile.userProfile?.tagline || profile.occupation || null,
        location: profile.location,
        company: profile.company,
        university: profile.university,
        website: profile.website,
        hasResume: profile.hasResume,
        skills: profile.skills ?? [],
        experiences: profile.experiences ?? [],
        educations: profile.educations ?? [],
        projects: (profile.portfolioProjects ?? []).map((p) => ({
            id: p.id,
            projectName: p.projectName,
            description: p.description,
            status: p.status,
            technologies: p.technologies,
        })),
        socialLinks: profile.socialLinks ?? [],
    };

    const viewStats: ProfileViewStats = {
        xp: stats?.xp ?? profile.totalXp ?? profile.currentXp ?? 0,
        level: stats?.level ?? profile.currentLevel ?? 1,
        projectsCount: stats?.projectsCount ?? profile.portfolioProjects?.length ?? 0,
        skillsCount: stats?.skillsCount ?? profile.skills?.length ?? 0,
        followersCount: stats?.followersCount ?? profile._count?.followers ?? 0,
    };

    return (
        <>
            <ProfileView
                profile={view}
                stats={viewStats}
                isOwn
                onEdit={() => setEditOpen(true)}
                onShare={() => setShareOpen(true)}
                onAddSkills={() => setSkillsOpen(true)}
                onAddExperience={() => setExperienceOpen(true)}
                onAddEducation={() => setEducationOpen(true)}
                onAddProject={() => setProjectOpen(true)}
                onUploadResume={handleUploadResume}
                onViewResume={handleViewResume}
                onDeleteResume={handleDeleteResume}
                resumeBusy={resumeBusy}
            />

            {/* ── Modals & sheets ── */}
            <ShareProfileModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                username={profile.username || ""}
                name={profile.name}
                image={profile.image}
            />
            <EditProfileModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                user={profile}
                onUpdate={refreshProfileData}
            />
            <AddSkillsSheet
                open={skillsOpen}
                onOpenChange={setSkillsOpen}
                onSuccess={onSheetSuccess}
                existingSkills={profile.skills ?? []}
            />
            <AddWorkExperienceSheet
                open={experienceOpen}
                onOpenChange={setExperienceOpen}
                onSuccess={onSheetSuccess}
            />
            <AddEducationSheet
                open={educationOpen}
                onOpenChange={setEducationOpen}
                onSuccess={onSheetSuccess}
            />
            <AddProjectSheet
                open={projectOpen}
                onOpenChange={setProjectOpen}
                onSuccess={onSheetSuccess}
            />
        </>
    );
}
