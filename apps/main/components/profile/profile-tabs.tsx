"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import {
	LayoutGrid, FolderKanban, Code2, Briefcase, GraduationCap
} from "lucide-react";

export type ProfileTab =
	| "at_a_glance"
	| "projects"
	| "skills"
	| "work_experience"
	| "education";

interface ProfileTabsProps {
	activeTab: ProfileTab;
	onTabChange: (tab: ProfileTab) => void;
	isOwnProfile?: boolean;
}

const tabs: {
	id: ProfileTab;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	description: string;
}[] = [
		{
			id: "at_a_glance",
			label: "At a Glance",
			icon: LayoutGrid,
			description: "Profile summary and highlights",
		},
		{
			id: "projects",
			label: "Projects",
			icon: FolderKanban,
			description: "Completed and ongoing projects",
		},
		{
			id: "skills",
			label: "Skills",
			icon: Code2,
			description: "Technical skills and endorsements",
		},
		{
			id: "work_experience",
			label: "Work Experience",
			icon: Briefcase,
			description: "Work experience and platform resume",
		},
		{
			id: "education",
			label: "Education",
			icon: GraduationCap,
			description: "Education and qualifications",
		},
	];

export function ProfileTabs({
	activeTab,
	onTabChange,
}: ProfileTabsProps) {
	const [hoveredTab, setHoveredTab] = useState<ProfileTab | null>(null);

	return (
		<div className="sticky top-0 w-full z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
			<div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
				<nav className="flex items-center gap-1 px-4 md:px-8 min-w-max" role="tablist">
					{
						tabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							const isHovered = hoveredTab === tab.id;

							return (
								<button
									key={tab.id}
									role="tab"
									aria-selected={isActive}
									aria-controls={`tab-panel-${tab.id}`}
									onClick={() => onTabChange(tab.id)}
									onMouseEnter={() => setHoveredTab(tab.id)}
									onMouseLeave={() => setHoveredTab(null)}
									className={cn(
										"relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
										"hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
										isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground/80"
									)}
								>
									<Icon
										className={cn(
											"w-4 h-4 transition-colors",
											isActive ? "text-primary" : ""
										)}
									/>
									<span className="hidden sm:inline">{tab.label}</span>
									{
										isActive && (
											<motion.div
												layoutId="activeTabIndicator"
												className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neutral-900 to-neutral-900"
												initial={false}
												transition={{
													type: "spring",
													stiffness: 500,
													damping: 30,
												}}
											/>
										)
									}
									{
										isHovered && !isActive && (
											<motion.div
												className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/20"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.15 }}
											/>
										)
									}
								</button>
							);
						})
					}
				</nav>
			</div>
			<div className="sr-only" aria-live="polite">
				{tabs.find((t) => t.id === activeTab)?.description}
			</div>
		</div>
	);
}

// Mobile-friendly tab selector (dropdown alternative)
export function ProfileTabsDropdown({
	activeTab,
	onTabChange,
}: ProfileTabsProps) {


	return (
		<div className="sm:hidden">
			{/* A native <select> renders the OS dropdown - its own font, its own
			    highlight colour, unstyleable from the page. Same defect as the native
			    checkbox and date picker this sweep replaced. */}
			<Select value={activeTab} onValueChange={(v) => onTabChange(v as ProfileTab)}>
				<SelectTrigger className="w-full p-3 text-sm font-medium">
					<SelectValue placeholder="Select a tab" />
				</SelectTrigger>
				<SelectContent>
					{
						tabs.map((tab) => (
							<SelectItem key={tab.id} value={tab.id}>
								{tab.label}
							</SelectItem>
						))
					}
				</SelectContent>
			</Select>
		</div>
	);
}