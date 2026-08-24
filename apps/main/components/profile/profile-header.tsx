"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";
import {
	Camera, Edit2, Share2, Settings, MapPin, Briefcase, Calendar,
	Link as LinkIcon, Check, Copy, Eye, TrendingUp
} from "lucide-react";
import toast from "@repo/ui/components/ui/sonner";
import Link from "next/link";
import { publicProfileUrl } from "@/lib/urls";

interface ProfileHeaderProps {
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
		bio: string | null;
		location: string | null;
		company: string | null;
		occupation: string | null;
		website: string | null;
		createdAt: Date;
		currentLevel: number;
		totalXp: number;
		currentXp?: number;
		userProfile?: {
			coverGradient: string | null;
			tagline: string | null;
			theme: string;
			profileViews?: number;
			completionScore: number;
		} | null;
	};
	stats: {
		projectsCount: number;
		skillsCount: number;
		followersCount: number;
		followingCount: number;
		xp: number;
		level: number;
		credits: number;
	};
	isOwnProfile: boolean;
	isFollowing?: boolean;
	onEditProfile?: () => void;
	onShareProfile?: () => void;
	onOpenSettings?: () => void;
	onFollowToggle?: () => void;
}

export function ProfileHeader({
	user,
	stats,
	isOwnProfile,
	isFollowing,
	onEditProfile,
	onShareProfile,
	onOpenSettings,
	onFollowToggle,
}: ProfileHeaderProps) {
	const [copied, setCopied] = useState(false);

	const copyProfileLink = () => {
		// `username` is nullable, and the old template interpolated it straight in -
		// a user who had not picked one copied a link ending in `/null`. Say so
		// instead of handing over a broken link. (The path was wrong too: `/u/...`
		// is not a route in this app.)
		if (!user.username) {
			toast.error("Set a username in settings to get a shareable profile link");
			return;
		}
		navigator.clipboard.writeText(publicProfileUrl(user.username));
		setCopied(true);
		toast.success("Profile link copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const profileViews = user.userProfile?.profileViews ?? 0;
	const xpToNextLevel = (stats.level + 1) * 1000;
	const currentXp = user.currentXp ?? stats.xp;
	const xpProgress = Math.min((currentXp / xpToNextLevel) * 100, 100);

	const statItems = [
		{ label: "Projects", value: stats.projectsCount },
		{ label: "Skills", value: stats.skillsCount },
		{ label: "Followers", value: stats.followersCount },
		{ label: "Following", value: stats.followingCount },
		{ label: "XP", value: stats.xp.toLocaleString() },
		{ label: "Credits", value: stats.credits },
	];

	return (
		<div className="relative max-w-7xl mx-auto">
			<div className="relative px-4 md:px-8 pt-4 pb-4">
				<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="relative flex-shrink-0"
					>
						<div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden bg-background shadow-xl">
							<Image
								src={
									user.image ||
									"https://tse4.mm.bing.net/th?id=OIP.-BS8Y2nH1k93GJiitUVBCAHaHa&pid=Api&P=0"
								}
								alt={user.name || "User"}
								fill
								className="object-cover"
							/>
						</div>
						{
							isOwnProfile && onEditProfile && (
								<Button
									size="icon"
									variant="secondary"
									className="absolute bottom-0 left-0 w-8 h-8 rounded-full shadow-lg"
									onClick={onEditProfile}
								>
									<Camera className="w-4 h-4" />
								</Button>
							)
						}
					</motion.div>
					<div className="flex-1 min-w-0 pt-0 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
						<div className="flex-1 min-w-0">
							{/* flex-wrap lets the badge drop to its own line, but the h1 is
								still a flex item of THIS row with no min-width of its own -
								truncate's white-space:nowrap means it cannot shrink via
								wrapping either, so a long display name overflowed the header
								with no min-w-0 here. See docs/responsiveness.md section 2. */}
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="min-w-0 max-w-full truncate text-2xl font-bold text-foreground md:text-3xl">
									{user.name || "Anonymous User"}
								</h1>
								{
									user.userProfile?.completionScore === 100 && (
										<Badge
											variant="secondary"
											className="bg-neutral-900/10 text-neutral-800 dark:text-neutral-200 border-neutral-900/20"
										>
											<Check className="w-3 h-3 mr-1" />
											Verified
										</Badge>
									)
								}
							</div>
							{
								user.username && (
									<p className="text-muted-foreground">@{user.username}</p>
								)
							}
							{
								user.userProfile?.tagline && (
									<p className="text-sm md:text-base text-muted-foreground mt-1 max-w-xl">
										{user.userProfile.tagline}
									</p>
								)
							}
							<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
							{
								user.occupation && (
									<span className="flex items-center gap-1.5">
										<Briefcase className="w-4 h-4" />
										{user.occupation}
									</span>
								)
							}
							{
								user.company && (
									<span className="flex items-center gap-1.5">at {user.company}</span>
								)
							}
							{
								user.location && (
									<span className="flex items-center gap-1.5">
										<MapPin className="w-4 h-4" />
										{user.location}
									</span>
								)
							}
							{
								user.website && (
									<Link
										href={user.website}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1.5 hover:text-primary transition-colors"
									>
										<LinkIcon className="w-4 h-4" />
										Website
									</Link>
								)
							}
							<span className="flex items-center gap-1.5">
								<Calendar className="w-4 h-4" />
								Joined{" "}
								{
									new Date(user.createdAt).toLocaleDateString("en-US", {
										month: "short",
										year: "numeric",
									})
								}
							</span>
							</div>
						</div>
						<div className="flex items-center gap-2 flex-shrink-0">
						{
							isOwnProfile ? (
								<>
									<Button variant="outline" size="sm" onClick={onEditProfile}>
										<Edit2 className="w-4 h-4 mr-2" />
										Edit Profile
									</Button>
									<Button variant="outline" size="sm" onClick={copyProfileLink}>
										{
											copied ? (
												<Check className="w-4 h-4 mr-2" />
											) : (
												<Copy className="w-4 h-4 mr-2" />
											)
										}
										{copied ? "Copied!" : "Copy Link"}
									</Button>
									<Button variant="outline" size="icon" onClick={onShareProfile}>
										<Share2 className="w-4 h-4" />
									</Button>
									<Button variant="outline" size="icon" onClick={onOpenSettings}>
										<Settings className="w-4 h-4" />
									</Button>
								</>
							) : (
								<>
									<Button
										variant={isFollowing ? "outline" : "default"}
										onClick={onFollowToggle}
										className={
											!isFollowing
												? "bg-gradient-to-r from-neutral-900 to-neutral-900 text-white hover:from-neutral-800 hover:to-neutral-800"
												: ""
										}
									>
										{isFollowing ? "Following" : "Follow"}
									</Button>
									<Button variant="outline" size="icon" onClick={copyProfileLink}>
										{
											copied ? (
												<Check className="w-4 h-4" />
											) : (
												<Share2 className="w-4 h-4" />
											)
										}
									</Button>
								</>
							)
						}
					</div>
					</div>
				</div>
				<div className="mt-6 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-muted/50 border-y overflow-x-auto">
					<div className="flex items-center justify-between gap-4 min-h-[52px]">
						<div className="flex items-center gap-6 md:gap-8 min-w-max">
							{
								statItems.map((stat, index) => (
									<motion.div
										key={stat.label}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										className="flex flex-col items-center"
									>
										<span className="text-lg md:text-xl font-bold text-foreground">
											{stat.value}
										</span>
										<span className="text-xs text-muted-foreground">{stat.label}</span>
									</motion.div>
								))
							}
						</div>
						<div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 ml-auto">
							{
								isOwnProfile && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 border shadow-sm"
									>
										<Eye className="w-5 h-5 text-primary" />
										<div className="flex flex-col items-start">
											<span className="text-lg font-bold text-foreground leading-none">{profileViews}</span>
											<span className="text-[10px] text-muted-foreground uppercase tracking-wider">Views</span>
										</div>
									</motion.div>
								)
							}
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.35 }}
								className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-neutral-900/10 to-neutral-900/10 border border-neutral-900/20 min-w-[180px]"
							>
								<TrendingUp className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between text-xs mb-1">
										<span className="font-medium text-foreground">Level {stats.level}</span>
										<span className="font-semibold text-neutral-800 dark:text-neutral-200">{Math.round(xpProgress)}%</span>
									</div>
									<Progress value={xpProgress} className="h-2 bg-neutral-200/50" />
								</div>
							</motion.div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}