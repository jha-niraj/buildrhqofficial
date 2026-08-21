"use client";

import { motion } from "framer-motion";
import {
	Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
	User, Mail, Phone, MapPin, Calendar, Globe, Briefcase, GraduationCap,
	Target, Heart, Building, Edit2, ExternalLink, Banknote, Clock,
	Github, Linkedin, Twitter, Instagram, Youtube
} from "lucide-react";
import Link from "next/link";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
	github: Github,
	linkedin: Linkedin,
	twitter: Twitter,
	instagram: Instagram,
	youtube: Youtube,
	portfolio: Globe,
	website: Globe,
};

interface PortfolioProject {
	id: string;
	projectName: string;
	projectType: string;
	description: string | null;
	status: string;
	visibility: string;
	technologies: string[];
	startDate: Date;
	endDate: Date | null;
	thumbnailUrl: string | null;
}

interface AtAGlanceTabProps {
	user: {
		id: string;
		name: string | null;
		username?: string | null;
		email?: string | null;
		phone?: string | null;
		bio: string | null;
		location?: string | null;
		website?: string | null;
		company?: string | null;
		occupation?: string | null;
		university?: string | null;
		semester?: string | null;
		gender?: string | null;
		yearofbirth?: string | null;
		interests?: string[];
		careerGoals?: string[];
		targetCompanies?: string[];
		expectedSalary?: string | null;
		noticePeriod?: string | null;
		workExperience?: string | null;
		createdAt: Date;
		currentLevel: number;
		currentXp: number;
		totalXp: number;
		portfolioProjects?: PortfolioProject[];
		achievements: Array<{
			id: string;
			title: string;
			description: string;
			createdAt?: Date | null;
		} | null>;
		socialLinks?: Array<{
			id: string;
			platform: string;
			url: string;
		}>;
		userProfile?: {
			showEmail?: boolean;
		} | null;
	};
	stats: {
		projectsCount: number;
		skillsCount: number;
		level: number;
		xp: number;
	};
	isOwnProfile: boolean;
	onEditProfile?: () => void;
}

export function AtAGlanceTab({
	user,
	stats: _stats,
	isOwnProfile,
	onEditProfile,
}: AtAGlanceTabProps) {
	const showEmail = isOwnProfile || user.userProfile?.showEmail;

	return (
		<div className="space-y-6">
			{
				user.bio && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg flex items-center gap-2">
										<User className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										About
									</CardTitle>
									{
										isOwnProfile && onEditProfile && (
											<Button variant="ghost" size="sm" onClick={onEditProfile}>
												<Edit2 className="w-4 h-4 mr-1" />
												Edit
											</Button>
										)
									}
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground whitespace-pre-line text-left">{user.bio}</p>
							</CardContent>
						</Card>
					</motion.div>
				)
			}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.12 }}
				>
					<Card className="h-full">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg">Personal Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-0 text-left pb-3">
							{
								user.name && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<User className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Full Name</p>
											<p className="font-medium truncate">{user.name}</p>
										</div>
									</div>
								)
							}
							{
								showEmail && user.email && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Mail className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1 overflow-hidden">
											<p className="text-xs text-muted-foreground">Email</p>
											<Link href={`mailto:${user.email}`} className="font-medium hover:text-primary transition-colors truncate block">
												{user.email}
											</Link>
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.phone && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Phone className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Phone</p>
											<p className="font-medium">{user.phone}</p>
										</div>
									</div>
								)
							}
							{
								user.location && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<MapPin className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Location</p>
											<p className="font-medium">{user.location}</p>
										</div>
									</div>
								)
							}
							{
								user.gender && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
											<User className="w-4 h-4 text-pink-500" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Gender</p>
											<p className="font-medium capitalize">{user.gender}</p>
										</div>
									</div>
								)
							}
							<div className="flex items-center gap-3 py-1.5">
								<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
									<Calendar className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-muted-foreground">Member Since</p>
									<p className="font-medium">
										{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
				>
					<Card className="h-full">
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">Professional Information</CardTitle>
								{isOwnProfile && onEditProfile && !(user.occupation || user.company || user.university || user.website || user.expectedSalary || user.noticePeriod) && (
									<Button variant="ghost" size="sm" onClick={onEditProfile}>
										<Edit2 className="w-4 h-4 mr-1" />
										Add
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-0 text-left pb-3">
							{
								!(user.occupation || user.company || user.university || user.website || (isOwnProfile && (user.expectedSalary || user.noticePeriod))) && (
									<div className="py-6 text-center">
										<Briefcase className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-30" />
										<p className="text-sm text-muted-foreground">No professional details yet</p>
										{isOwnProfile && onEditProfile && (
											<Button variant="link" size="sm" className="mt-2 text-primary" onClick={onEditProfile}>
												Add occupation, company & more
											</Button>
										)}
									</div>
								)
							}
							{
								user.occupation && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Briefcase className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Role</p>
											<p className="font-medium">{user.occupation}</p>
										</div>
									</div>
								)
							}
							{
								user.company && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Building className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Company</p>
											<p className="font-medium">{user.company}</p>
										</div>
									</div>
								)
							}
							{
								user.university && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<GraduationCap className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">University</p>
											<p className="font-medium">{user.university}</p>
											{user.semester && <p className="text-xs text-muted-foreground">Semester {user.semester}</p>}
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.expectedSalary && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Banknote className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Expected Salary</p>
											<p className="font-medium">{user.expectedSalary}</p>
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.noticePeriod && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
											<Clock className="w-4 h-4 text-red-500" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-xs text-muted-foreground">Notice Period</p>
											<p className="font-medium">{user.noticePeriod}</p>
										</div>
									</div>
								)
							}
							{
								user.website && (
									<div className="flex items-center gap-3 py-1.5">
										<div className="w-9 h-9 rounded-lg bg-neutral-900/10 flex items-center justify-center flex-shrink-0">
											<Globe className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div className="min-w-0 flex-1 overflow-hidden">
											<p className="text-xs text-muted-foreground">Website</p>
											<Link
												href={user.website}
												target="_blank"
												rel="noopener noreferrer"
												className="font-medium hover:text-primary transition-colors flex items-center gap-1 truncate"
											>
												{user.website.replace(/^https?:\/\//, "")}
												<ExternalLink className="w-3 h-3 flex-shrink-0" />
											</Link>
										</div>
									</div>
								)
							}
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{
				user.interests && user.interests.length > 0 && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Heart className="w-5 h-5 text-red-500" />
									Interests
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{
										user.interests.map((interest, index) => (
											<Badge key={index} variant="secondary">{interest}</Badge>
										))
									}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				(user.careerGoals?.length ?? 0) + (isOwnProfile ? (user.targetCompanies?.length ?? 0) : 0) > 0 && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Target className="w-4 h-4 text-muted-foreground" />
									Career Goals & Target Companies
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-3">
									{(user.careerGoals?.length ?? 0) > 0 && (
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-2">Career Goals</p>
											<div className="flex flex-wrap gap-1.5">
												{user.careerGoals?.map((goal, index) => (
													<Badge key={`goal-${index}`} variant="secondary" className="text-xs font-normal">
														{goal}
													</Badge>
												))}
											</div>
										</div>
									)}
									{isOwnProfile && (user.targetCompanies?.length ?? 0) > 0 && (
										<div>
											<p className="text-xs font-medium text-muted-foreground mb-2">Target Companies</p>
											<div className="flex flex-wrap gap-1.5">
												{user.targetCompanies?.map((company, index) => (
													<Badge key={`company-${index}`} variant="outline" className="text-xs font-normal">
														{company}
													</Badge>
												))}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				user.socialLinks && user.socialLinks.length > 0 && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Globe className="w-4 h-4 text-muted-foreground" />
									Social Links
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{
										user.socialLinks.map((link) => {
											const Icon = socialIcons[link.platform.toLowerCase()] || Globe;
											return (
												<Link
													key={link.id}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
												>
													<div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
														<Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
													</div>
													<div className="flex-1 min-w-0 text-left">
														<p className="text-sm font-medium capitalize leading-none">{link.platform}</p>
														<p className="text-xs text-muted-foreground truncate mt-0.5">{link.url.replace(/^https?:\/\//, "")}</p>
													</div>
													<ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
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
			{
				!user.bio &&
				(!user.interests || user.interests.length === 0) &&
				(!user.careerGoals || user.careerGoals.length === 0) && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
						<Card>
							<CardContent className="py-12 text-center">
								<User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
								<h3 className="font-medium mb-2">Tell us about yourself</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Add a bio, interests, and career goals to help others learn about you.
								</p>
								{
									isOwnProfile && onEditProfile && (
										<Button onClick={onEditProfile}>
											<Edit2 className="w-4 h-4 mr-2" />
											Complete Your Profile
										</Button>
									)
								}
							</CardContent>
						</Card>
					</motion.div>
				)
			}
		</div>
	);
}