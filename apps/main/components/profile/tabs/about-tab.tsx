"use client";

import { motion } from "framer-motion";
import {
	Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
	User, Mail, Phone, MapPin, Calendar, Globe, Briefcase, GraduationCap, Target,
	Heart, Building, Edit2, ExternalLink, Github, Linkedin, Twitter, Instagram, Youtube,
	Banknote, Clock
} from "lucide-react";
import Link from "next/link";

interface AboutTabProps {
	user: {
		id: string;
		name: string | null;
		username: string | null;
		email: string | null;
		phone: string | null;
		bio: string | null;
		location: string | null;
		website: string | null;
		company: string | null;
		occupation: string | null;
		university: string | null;
		semester: string | null;
		gender: string | null;
		yearofbirth: string | null;
		interests: string[];
		careerGoals: string[];
		targetCompanies: string[];
		expectedSalary: string | null;
		noticePeriod: string | null;
		workExperience: string | null;
		createdAt: Date;
		socialLinks?: Array<{
			id: string;
			platform: string;
			url: string;
		}>;
		userProfile?: {
			showEmail: boolean;
		} | null;
	};
	isOwnProfile: boolean;
	onEditProfile?: () => void;
}

// Social platform icons
const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
	github: Github,
	linkedin: Linkedin,
	twitter: Twitter,
	instagram: Instagram,
	youtube: Youtube,
	portfolio: Globe,
	website: Globe,
};

export function AboutTab({ user, isOwnProfile, onEditProfile }: AboutTabProps) {
	const showEmail = isOwnProfile || user.userProfile?.showEmail;

	return (
		<div className="space-y-6">
			{
				user.bio && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg flex items-center gap-2">
										<User className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										About
									</CardTitle>
									{
										isOwnProfile && (
											<Button variant="ghost" size="sm" onClick={onEditProfile}>
												<Edit2 className="w-4 h-4 mr-1" />
												Edit
											</Button>
										)
									}
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground whitespace-pre-line">{user.bio}</p>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<Card className="h-full">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg">Personal Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{
								user.name && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<User className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Full Name</p>
											<p className="font-medium">{user.name}</p>
										</div>
									</div>
								)
							}
							{
								showEmail && user.email && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Mail className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Email</p>
											<Link
												href={`mailto:${user.email}`}
												className="font-medium hover:text-primary transition-colors"
											>
												{user.email}
											</Link>
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.phone && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Phone className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Phone</p>
											<p className="font-medium">{user.phone}</p>
										</div>
									</div>
								)
							}
							{
								user.location && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<MapPin className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Location</p>
											<p className="font-medium">{user.location}</p>
										</div>
									</div>
								)
							}
							{
								user.gender && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
											<User className="w-5 h-5 text-pink-500" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Gender</p>
											<p className="font-medium capitalize">{user.gender}</p>
										</div>
									</div>
								)
							}
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
									<Calendar className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Member Since</p>
									<p className="font-medium">
										{
											new Date(user.createdAt).toLocaleDateString("en-US", {
												month: "long",
												year: "numeric",
											})
										}
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
							<CardTitle className="text-lg">Professional Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{
								user.occupation && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Briefcase className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Role</p>
											<p className="font-medium">{user.occupation}</p>
										</div>
									</div>
								)
							}
							{
								user.company && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Building className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Company</p>
											<p className="font-medium">{user.company}</p>
										</div>
									</div>
								)
							}
							{
								user.university && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<GraduationCap className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">University</p>
											<p className="font-medium">{user.university}</p>
											{
												user.semester && (
													<p className="text-xs text-muted-foreground">
														Semester {user.semester}
													</p>
												)
											}
										</div>
									</div>
								)
							}
							{
								user.workExperience && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Calendar className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Experience</p>
											<p className="font-medium">{user.workExperience}</p>
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.expectedSalary && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Banknote className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Expected Salary</p>
											<p className="font-medium">{user.expectedSalary}</p>
										</div>
									</div>
								)
							}
							{
								isOwnProfile && user.noticePeriod && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
											<Clock className="w-5 h-5 text-red-500" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Notice Period</p>
											<p className="font-medium">{user.noticePeriod}</p>
										</div>
									</div>
								)
							}
							{
								user.website && (
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-neutral-900/10 flex items-center justify-center">
											<Globe className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground">Website</p>
											<Link
												href={user.website}
												target="_blank"
												rel="noopener noreferrer"
												className="font-medium hover:text-primary transition-colors flex items-center gap-1"
											>
												{user.website.replace(/^https?:\/\//, "")}
												<ExternalLink className="w-3 h-3" />
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
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
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
											<Badge key={index} variant="secondary">
												{interest}
											</Badge>
										))
									}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				user.careerGoals && user.careerGoals.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.25 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Target className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
									Career Goals
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{
										user.careerGoals.map((goal, index) => (
											<Badge key={index} variant="outline" className="bg-neutral-900/5">
												{goal}
											</Badge>
										))
									}
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)
			}
			{
				isOwnProfile && user.targetCompanies && user.targetCompanies.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Building className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
									Target Companies
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{
										user.targetCompanies.map((company, index) => (
											<Badge key={index} variant="secondary">
												{company}
											</Badge>
										))
									}
								</div>
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
						transition={{ delay: 0.35 }}
					>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg flex items-center gap-2">
									<Globe className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
									Social Links
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
									{
										user.socialLinks.map((link) => {
											const Icon = socialIcons[link.platform.toLowerCase()] || Globe;
											return (
												<Link
													key={link.id}
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-shadow group"
												>
													<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
														<Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
													</div>
													<div className="flex-1 min-w-0">
														<p className="font-medium capitalize">{link.platform}</p>
														<p className="text-xs text-muted-foreground truncate">
															{link.url.replace(/^https?:\/\//, "")}
														</p>
													</div>
													<ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Card>
							<CardContent className="py-12 text-center">
								<User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
								<h3 className="font-medium mb-2">Tell us about yourself</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Add a bio, interests, and career goals to help others learn about you.
								</p>
								{
									isOwnProfile && (
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