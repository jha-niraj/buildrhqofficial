"use client";

import { useState } from "react";
import { useKnowmeSheet } from "./knowme-sheet-provider";
import { motion } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Sparkles, FolderKanban, Mic, Briefcase, FileText, BookOpen,
    ClipboardCheck, Bot, Layout, Users, Map, Lock,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@repo/ui/components/ui/dialog";

interface Feature {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: string;
    bgColor: string;
    status: "available" | "coming-soon" | "locked";
}

const features: Feature[] = [
    {
        title: "Projects",
        description: "Build real-world projects with guidance",
        icon: FolderKanban,
        href: "/projects",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "Mock Interview",
        description: "Practice with AI voice interviewer",
        icon: Mic,
        href: "/mock/voice",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "Job Interview Assistant",
        description: "AI-powered interview preparation",
        icon: Briefcase,
        href: "/ai/jobinterviewassistant",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "Resume Creator",
        description: "Create ATS-friendly resumes",
        icon: FileText,
        href: "/ai/resume",
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        status: "available",
    },
    {
        title: "Open Source Learn",
        description: "Learn Git & contribute to projects",
        icon: BookOpen,
        href: "/opensource/learn",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "Open Source Exam",
        description: "Get certified in Git",
        icon: ClipboardCheck,
        href: "/opensource/exam",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "KnowMe",
        description: "AI portfolio assistant",
        icon: Bot,
        href: "/knowme",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "available",
    },
    {
        title: "Studio",
        description: "AI notes & dashboards",
        icon: Layout,
        href: "#",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "locked",
    },
    {
        title: "Spaces",
        description: "Collaborative workspaces",
        icon: Users,
        href: "#",
        color: "text-slate-500",
        bgColor: "bg-slate-500/10",
        status: "locked",
    },
    {
        title: "Pathfinder",
        description: "Learning paths & goals",
        icon: Map,
        href: "#",
        color: "text-neutral-900",
        bgColor: "bg-neutral-900/10",
        status: "locked",
    },
];

export default function FeatureDiscovery({
    onKnowmeClick: onKnowmeClickProp,
}: {
    onKnowmeClick?: () => void;
}) {
    const onKnowmeFromContext = useKnowmeSheet();
    const onKnowmeClick = onKnowmeClickProp ?? onKnowmeFromContext ?? undefined;
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonTitle, setComingSoonTitle] = useState("");

    const getStatusBadge = (status: string) => {
        if (status === "coming-soon") {
            return (
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-neutral-900/50 text-neutral-900 dark:text-neutral-100 bg-neutral-900/10"
                >
                    Coming Soon
                </Badge>
            );
        }
        if (status === "locked") {
            return (
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-muted-foreground/50 text-muted-foreground bg-muted/50"
                >
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Locked
                </Badge>
            );
        }
        return null;
    };

    const handleFeatureClick = (feature: Feature, e: React.MouseEvent) => {
        if (feature.status === "locked") {
            e.preventDefault();
            setComingSoonTitle(feature.title);
            setShowComingSoon(true);
        }
        if (feature.title === "KnowMe" && onKnowmeClick) {
            e.preventDefault();
            onKnowmeClick();
        }
    };

    return (
        <>
            <Card className="border-primary/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-neutral-900/10">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Discover Features</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex-shrink-0 w-[200px]"
                                >
                                    <Link
                                        href={feature.status === "locked" ? "#" : feature.href}
                                        onClick={(e) => handleFeatureClick(feature, e)}
                                        className={
                                            feature.status === "locked"
                                                ? "cursor-not-allowed"
                                                : ""
                                        }
                                    >
                                        <div
                                            className={`p-4 rounded-xl border ${
                                                feature.status === "locked"
                                                    ? "opacity-60"
                                                    : "hover:shadow-lg"
                                            } transition-all group ${feature.bgColor}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                                                    <feature.icon
                                                        className={`h-5 w-5 ${feature.color}`}
                                                    />
                                                </div>
                                                {getStatusBadge(feature.status)}
                                            </div>
                                            <h3 className="font-semibold text-sm mb-1">
                                                {feature.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {feature.description}
                                            </p>
                                            {feature.status !== "locked" && feature.title !== "KnowMe" && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span>Explore</span>
                                                    <ChevronRight className="h-3 w-3" />
                                                </div>
                                            )}
                                            {feature.status !== "locked" && feature.title === "KnowMe" && onKnowmeClick && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span>Chat</span>
                                                    <ChevronRight className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                        <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Coming Soon</DialogTitle>
                        <DialogDescription>
                            {comingSoonTitle} is under development. Stay tuned!
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
