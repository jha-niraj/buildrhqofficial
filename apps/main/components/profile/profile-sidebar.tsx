"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
	Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";
import { Badge } from "@repo/ui/components/ui/badge";
import {
	Github, Linkedin, Twitter, Globe, Zap, Share2, BookOpen, 
	Target, ArrowRight
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { ProfileStrengthSheet } from "./sheets/profile-strength-sheet";

interface ProfileSidebarProps {
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image?: string | null;
		bio: string | null;
		location?: string | null;
		skills: Array<{
			id: string;
			name: string;
			level: string;
			category: string;
			endorsements?: Array<{ id: string }>;
		}>;
		socialLinks?: Array<{
			id: string;
			platform: string;
			url: string;
		}>;
		userProfile?: {
			completionScore: number;
			profileViews: number;
		} | null;
		experiences?: Array<unknown>;
		portfolioProjects?: Array<unknown>;
		university?: string | null;
		certifications?: Array<unknown>;
		educations?: Array<unknown>;
		careerGoals?: string[];
		targetCompanies?: string[];
		expectedSalary?: string | null;
		website?: string | null;
	};
	stats?: {
		projectsCount: number;
		skillsCount: number;
		followersCount: number;
		followingCount: number;
		level: number;
		xp: number;
	};
	isOwnProfile: boolean;
}

// Social platform icons
const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
	github: Github,
	linkedin: Linkedin,
	twitter: Twitter,
	portfolio: Globe,
	website: Globe,
};

export function ProfileSidebar({ user, isOwnProfile }: ProfileSidebarProps) {
	const [strengthSheetOpen, setStrengthSheetOpen] = useState(false);
	const completionScore = user.userProfile?.completionScore || 0;
	const topSkills = user.skills?.slice(0, 6) || [];

	return (
		<div className="space-y-4">
			{
				isOwnProfile && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Target className="w-4 h-4 text-primary" />
										Profile Strength
									</span>
									<span className="text-primary font-bold">{completionScore}%</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Progress
									value={completionScore}
									className="h-2"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									{
										completionScore < 100 ? (
											<>
												Complete your profile to unlock more features{" "}
												<Button
													variant="link"
													size="sm"
													className="h-auto p-0 ml-0 text-xs text-primary font-normal"
													onClick={() => setStrengthSheetOpen(true)}
												>
													Complete now <ArrowRight className="w-3 h-3 ml-1 inline" />
												</Button>
											</>
										) : (
											"🎉 Your profile is complete!"
										)
									}
								</p>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			<ProfileStrengthSheet
				open={strengthSheetOpen}
				onOpenChange={setStrengthSheetOpen}
				completionScore={completionScore}
				user={user}
			/>
			{
				isOwnProfile && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Zap className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
									Quick Actions
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Button variant="outline" size="sm" className="w-full justify-start gap-2">
									<Share2 className="w-4 h-4" />
									Share Profile
								</Button>
								<Button variant="outline" size="sm" className="w-full justify-start gap-2">
									<BookOpen className="w-4 h-4" />
									View as Public
								</Button>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				topSkills.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Tech Stack</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{
										topSkills.map((skill) => (
											<Badge
												key={skill.id}
												variant="secondary"
												className={cn(
													"text-xs",
													skill.endorsements && skill.endorsements.length > 0 &&
													"border border-primary/30 bg-primary/5"
												)}
											>
												{skill.name}
												{
													skill.endorsements && skill.endorsements.length > 0 && (
														<span className="ml-1 text-primary">+{skill.endorsements.length}</span>
													)
												}
											</Badge>
										))
									}
								</div>
								{
									user.skills && user.skills.length > 6 && (
										<Button
											variant="link"
											size="sm"
											className="h-auto p-0 mt-2 text-xs"
										>
											+{user.skills.length - 6} more skills
										</Button>
									)
								}
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				user.socialLinks && user.socialLinks.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Connect</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{
										user.socialLinks.map((link) => {
											const Icon = socialIcons[link.platform.toLowerCase()] || Globe;
											return (
												<Link
													key={link.id}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
												>
													<Icon className="w-4 h-4" />
													<span className="capitalize">{link.platform}</span>
												</Link>
											);
										})
									}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
		</div>
	);
}