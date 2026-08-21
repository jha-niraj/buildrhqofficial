"use client";
import {
	Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";
import {
	Target, User, Briefcase, FolderKanban, GraduationCap, Award,
	Link2, Check, ArrowRight, Sparkles
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

interface ProfileStrengthSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	completionScore: number;
	user: {
		name: string | null;
		image?: string | null;
		bio: string | null;
		location?: string | null;
		careerGoals?: string[];
		targetCompanies?: string[];
		expectedSalary?: string | null;
		experiences?: Array<unknown>;
		portfolioProjects?: Array<unknown>;
		university?: string | null;
		certifications?: Array<unknown>;
		educations?: Array<unknown>;
		skills?: Array<unknown>;
		socialLinks?: Array<unknown>;
		website?: string | null;
		userProfile?: Record<string, unknown> | null;
	};
}

const defaultImage = "https://tse4.mm.bing.net/th?id=OIP.-BS8Y2nH1k93GJiitUVBCAHaHa&pid=Api&P=0";

const RESUME_CREATOR_LINK = "/ai/resume";

export function ProfileStrengthSheet({
	open,
	onOpenChange,
	completionScore: _completionScore,
	user,
}: ProfileStrengthSheetProps) {
	const hasBasicInfo = !!(user.name && user.bio && user.image && user.image !== defaultImage);
	const hasLocation = !!user.location;
	const hasProfileCustom = !!(user.userProfile?.coverGradient || user.userProfile?.tagline || user.userProfile?.theme);
	const hasCareerDetails = !!(
		(user.careerGoals && user.careerGoals.length > 0) ||
		(user.targetCompanies && user.targetCompanies.length > 0) ||
		user.expectedSalary
	);
	const hasSkills = !!(user.skills && user.skills.length > 0);
	const hasExperience = !!(user.experiences && user.experiences.length > 0);
	const hasEducation = !!(
		(user.educations && user.educations.length > 0) ||
		user.university ||
		(user.certifications && user.certifications.length > 0)
	);
	const hasProjects = !!(user.portfolioProjects && user.portfolioProjects.length > 0);
	const hasSocials = !!(user.socialLinks && user.socialLinks.length > 0 || user.website);

	const items = [
		{
			id: "basic",
			label: "Basic Information",
			description: "Name, bio, profile picture, location",
			completed: hasBasicInfo && hasLocation,
			icon: User,
			link: "/profile",
			tab: "Edit Profile",
		},
		{
			id: "profile",
			label: "Profile Customization",
			description: "Cover gradient, tagline, theme",
			completed: hasProfileCustom,
			icon: Target,
			link: "/profile",
			tab: "Edit Profile",
		},
		{
			id: "career",
			label: "Career Details",
			description: "Career goals, target companies, expected salary",
			completed: hasCareerDetails,
			icon: Target,
			link: "/profile",
			tab: "Edit Profile",
		},
		{
			id: "experience",
			label: "Work Experience",
			description: "Add your work history",
			completed: hasExperience,
			icon: Briefcase,
			link: "/profile",
			tab: "Work Experience tab",
		},
		{
			id: "education",
			label: "Education & Certifications",
			description: "University, degree, certifications",
			completed: hasEducation,
			icon: GraduationCap,
			link: "/profile",
			tab: "Education tab",
		},
		{
			id: "projects",
			label: "Portfolio Projects",
			description: "Showcase your projects",
			completed: hasProjects,
			icon: FolderKanban,
			link: "/profile",
			tab: "Projects tab",
		},
		{
			id: "skills",
			label: "Skills",
			description: "Technical skills",
			completed: hasSkills,
			icon: Award,
			link: "/profile",
			tab: "Skills tab",
		},
		{
			id: "socials",
			label: "Social Links & Website",
			description: "GitHub, LinkedIn, portfolio",
			completed: hasSocials,
			icon: Link2,
			link: "/profile",
			tab: "Socials tab",
		},
	];

	// Calculate score from actual completion status (overrides DB value for accuracy)
	const calculatedScore = Math.round((items.filter(i => i.completed).length / items.length) * 100);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col">
				<div className="w-full flex flex-col h-full">
					<SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
						<SheetTitle className="flex items-center gap-2">
							<Target className="w-5 h-5 text-primary" />
							Profile Strength
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto px-6 py-6">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
								<span className="text-3xl font-bold text-primary">{calculatedScore}%</span>
							</div>
							<Progress value={calculatedScore} className="h-3 max-w-xs mx-auto" />
							<p className="text-sm text-muted-foreground mt-2">
								{calculatedScore >= 100
									? "Your profile is complete! 🎉"
									: `${items.filter(i => i.completed).length} of ${items.length} sections complete`}
							</p>
						</div>
						<div className="space-y-3">
							{items.map((item) => {
								const Icon = item.icon;
								return (
									<div
										key={item.id}
										className={cn(
											"flex items-center gap-4 p-4 rounded-xl border transition-colors",
											item.completed
												? "bg-neutral-900/5 border-neutral-900/20"
												: "bg-muted/30 border-border hover:bg-muted/50"
										)}
									>
										<div
											className={cn(
												"w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
												item.completed ? "bg-neutral-900/20" : "bg-muted"
											)}
										>
											{item.completed ? (
												<Check className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
											) : (
												<Icon className="w-5 h-5 text-muted-foreground" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium">{item.label}</p>
											<p className="text-xs text-muted-foreground">{item.description}</p>
										</div>
										{!item.completed && (
											<Button variant="outline" size="sm" asChild>
												<Link href={item.link} onClick={() => onOpenChange(false)}>
													Add
													<ArrowRight className="w-4 h-4 ml-1" />
												</Link>
											</Button>
										)}
									</div>
								);
							})}
						</div>
						<div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
							<p className="text-sm flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-primary" />
								<strong>Tip:</strong> Head to your{" "}
								<Link href="/profile" onClick={() => onOpenChange(false)} className="text-primary hover:underline font-medium">
									Profile
								</Link>{" "}
								tabs to add work experience, education, projects, and skills. Use the{" "}
								<Link href={RESUME_CREATOR_LINK} onClick={() => onOpenChange(false)} className="text-primary hover:underline font-medium">
									Resume Builder
								</Link>{" "}
								to export your data as a polished PDF.
							</p>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
