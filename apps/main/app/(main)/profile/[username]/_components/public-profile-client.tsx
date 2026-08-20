"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "@repo/ui/components/ui/sonner";
import { ShareProfileModal } from "@/components/profile";
import {
    ProfileView, type ProfileViewData, type ProfileViewStats,
} from "@/components/profile/profile-view";
import { trackProfileView } from "@/actions/(main)/user/profile.action";
import { toggleFollow } from "@/actions/(main)/social/follow.action";

// ─────────────────────────────────────────────────────────────────────────────
// Somebody else's profile.
//
// Renders the SAME component as `/profile` - see `components/profile/profile-view.tsx`
// for why. This file owns only what is specific to viewing a profile that is not
// yours: the view-tracking ping, the follow button's state, and the mapping from
// the server query's shape onto the view's.
//
// It used to compose a header, a tab bar, a sidebar and five tab components,
// which made a visitor's view of a developer a visibly different page from that
// developer's own view of themselves.
// ─────────────────────────────────────────────────────────────────────────────

interface PublicProfileClientProps {
    // The server query result. Deliberately loose here and narrowed immediately
    // below - the alternative is threading `any` into the shared view, where
    // every field would silently become optional.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    isOwnProfile: boolean;
    isFollowing: boolean;
}

export function PublicProfileClient({
    user,
    isOwnProfile,
    isFollowing: initialIsFollowing,
}: PublicProfileClientProps) {
    const router = useRouter();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    // Counted once per mount, and never on your own profile - otherwise a user
    // refreshing their own page inflates their view count.
    useEffect(() => {
        if (!isOwnProfile && user.userProfile?.id) {
            trackProfileView(user.userProfile.id, null, "DIRECT");
        }
    }, [user.userProfile?.id, isOwnProfile]);

    const handleFollow = async () => {
        if (isFollowLoading) return;
        setIsFollowLoading(true);
        try {
            const result = await toggleFollow(user.id);
            if (result.success) {
                setIsFollowing(result.isFollowing ?? !isFollowing);
                toast.success(result.isFollowing ? "Now following!" : "Unfollowed");
            } else {
                toast.error(result.error || "Failed to update follow status");
            }
        } catch (error) {
            console.log("Failed to update follow status: " + error);
            toast.error("Failed to update follow status");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const view: ProfileViewData = {
        id: user.id,
        name: user.name ?? null,
        username: user.username ?? null,
        // Behind the owner's own setting, not merely behind "is it set".
        email: user.userProfile?.showEmail ? user.email ?? null : null,
        image: user.image ?? null,
        bio: user.bio ?? null,
        headline: user.userProfile?.tagline || user.occupation || null,
        location: user.location ?? null,
        company: user.company ?? null,
        university: user.university ?? null,
        website: user.website ?? null,
        skills: user.skills ?? [],
        experiences: user.experiences ?? [],
        educations: user.educations ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projects: (user.portfolioProjects ?? []).map((p: any) => ({
            id: p.id,
            projectName: p.projectName,
            description: p.description,
            status: p.status,
            technologies: p.technologies,
        })),
        socialLinks: user.socialLinks ?? [],
    };

    const stats: ProfileViewStats = {
        xp: user.totalXp ?? 0,
        level: user.currentLevel ?? 1,
        projectsCount: user.portfolioProjects?.length ?? 0,
        skillsCount: user.skills?.length ?? 0,
        followersCount: user._count?.followers ?? 0,
    };

    return (
        <>
            <ProfileView
                profile={view}
                stats={stats}
                // Visiting your OWN username URL gives you the owner's view, not a
                // read-only copy of it. Editing routes to /profile, which is where
                // the sheets and modals live.
                isOwn={isOwnProfile}
                onEdit={isOwnProfile ? () => router.push("/profile") : undefined}
                onShare={() => setShareModalOpen(true)}
                isFollowing={isFollowing}
                followPending={isFollowLoading}
                onFollow={isOwnProfile ? undefined : handleFollow}
            />

            <ShareProfileModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                username={user.username || ""}
                name={user.name}
                image={user.image}
            />
        </>
    );
}

export default PublicProfileClient;
