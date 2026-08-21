"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    AlertCircle, Check, ExternalLink, GitBranch,
    GitPullRequest, Link2, Loader2, RefreshCw, Star, Unlink
} from "lucide-react";
import { signIn } from "@repo/auth/client";
import toast from "@repo/ui/components/ui/sonner";
import {
    getGitHubProfile, disconnectGitHub, syncGitHubContributions
} from "@/actions/(main)/user/integrations.action";
import Image from "next/image";

interface GitHubProfileData {
    id: string;
    githubId: string;
    username: string;
    avatarUrl: string | null;
    profileUrl: string | null;
    accessToken?: string;
    connectedAt: Date;
    lastSyncAt: Date | null;
}

interface GitHubContributionSummary {
    totalPRs: number;
    mergedPRs: number;
    openPRs: number;
    totalRepos: number;
    totalCommits: number;
}

interface IntegrationsTabProps {
    isOwnProfile: boolean;
}

export function IntegrationsTab({ isOwnProfile }: IntegrationsTabProps) {
    const [githubProfile, setGitHubProfile] = useState<GitHubProfileData | null>(null);
    const [contributionSummary, setContributionSummary] = useState<GitHubContributionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        loadGitHubProfile();
    }, []);

    const loadGitHubProfile = async () => {
        setLoading(true);
        try {
            const result = await getGitHubProfile();
            if (result.success && result.profile) {
                setGitHubProfile(result.profile as GitHubProfileData);
                if (result.contributionSummary) {
                    setContributionSummary(result.contributionSummary as GitHubContributionSummary);
                }
            }
        } catch (error) {
            console.error("Error loading GitHub profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGitHub = async () => {
        try {
            await signIn.social({ provider: "github", callbackURL: "/profile?tab=integrations&connected=github" });
        } catch {
            toast.error("Failed to connect GitHub");
        }
    };

    const handleDisconnectGitHub = async () => {
        if (!confirm("Are you sure you want to disconnect your GitHub account? Your open source contribution data will be preserved.")) {
            return;
        }

        setDisconnecting(true);
        try {
            const result = await disconnectGitHub();
            if (result.success) {
                setGitHubProfile(null);
                setContributionSummary(null);
                toast.success("GitHub disconnected successfully");
            } else {
                toast.error(result.error || "Failed to disconnect GitHub");
            }
        } catch {
            toast.error("Failed to disconnect GitHub");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSyncContributions = async () => {
        setSyncing(true);
        try {
            const result = await syncGitHubContributions();
            if (result.success) {
                toast.success("Contributions synced successfully!");
                await loadGitHubProfile();
            } else {
                toast.error(result.error || "Failed to sync contributions");
            }
        } catch {
            toast.error("Failed to sync contributions");
        } finally {
            setSyncing(false);
        }
    };

    if (!isOwnProfile) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Integrations are only visible to the profile owner.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-muted-foreground">Loading integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center">
                                    <svg className="w-7 h-7 text-white dark:text-neutral-900" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">GitHub</CardTitle>
                                    <CardDescription>
                                        Connect your GitHub to track open source contributions
                                    </CardDescription>
                                </div>
                            </div>
                            {
                                githubProfile ? (
                                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                        Not Connected
                                    </Badge>
                                )
                            }
                        </div>
                    </CardHeader>
                    <CardContent>
                        {
                            githubProfile ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                        <Image
                                            width={56}
                                            height={56}
                                            src={githubProfile.avatarUrl || `https://github.com/${githubProfile.username}.png`}
                                            alt={githubProfile.username}
                                            className="rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                    @{githubProfile.username}
                                                </h3>
                                                <a
                                                    href={githubProfile.profileUrl || `https://github.com/${githubProfile.username}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                Connected {new Date(githubProfile.connectedAt).toLocaleDateString()}
                                            </p>
                                            {
                                                githubProfile.lastSyncAt && (
                                                    <p className="text-xs text-neutral-400 mt-1">
                                                        Last synced: {new Date(githubProfile.lastSyncAt).toLocaleString()}
                                                    </p>
                                                )
                                            }
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSyncContributions}
                                                disabled={syncing}
                                                className="gap-1.5"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                                {syncing ? 'Syncing...' : 'Sync'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleDisconnectGitHub}
                                                disabled={disconnecting}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            >
                                                <Unlink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {
                                        contributionSummary && (
                                            <div>
                                                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                                    Open Source Contributions
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-900/30 rounded-xl">
                                                        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 mb-1">
                                                            <GitPullRequest className="w-4 h-4" />
                                                            <span className="text-xs font-medium">PRs Created</span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                                            {contributionSummary.totalPRs}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-900/30 rounded-xl">
                                                        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 mb-1">
                                                            <Check className="w-4 h-4" />
                                                            <span className="text-xs font-medium">PRs Merged</span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                                            {contributionSummary.mergedPRs}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-900/30 rounded-xl">
                                                        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 mb-1">
                                                            <GitBranch className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Open PRs</span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                                            {contributionSummary.openPRs}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-900/30 rounded-xl">
                                                        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 mb-1">
                                                            <Star className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Repos</span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                                            {contributionSummary.totalRepos}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 rounded-xl">
                                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                                                            <GitBranch className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Commits</span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                                            {contributionSummary.totalCommits}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-neutral-800/50 dark:to-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Benefits of GitHub Integration
                                        </h4>
                                        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                Track your open source contributions automatically
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                Claim and submit issues directly from the platform
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                Get notified about PR reviews and merge status
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                Showcase your contributions on your profile
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Connect your GitHub account to unlock powerful open source features and track your contributions across all ShipItHQ projects.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                            <GitPullRequest className="w-6 h-6 text-neutral-800 dark:text-neutral-200 mb-2" />
                                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                                                Track PRs
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Automatic PR tracking and status updates
                                            </p>
                                        </div>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                            <Link2 className="w-6 h-6 text-neutral-800 dark:text-neutral-200 mb-2" />
                                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                                                Claim Issues
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Claim and work on issues directly
                                            </p>
                                        </div>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                            <Star className="w-6 h-6 text-neutral-800 dark:text-neutral-200 mb-2" />
                                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                                                Earn Recognition
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Get badges and XP for contributions
                                            </p>
                                        </div>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                            <GitBranch className="w-6 h-6 text-neutral-800 dark:text-neutral-200 mb-2" />
                                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                                                Profile Integration
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Showcase work on your profile
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleConnectGitHub}
                                        className="w-full gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        Connect GitHub
                                    </Button>
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Link2 className="w-6 h-6 text-neutral-400" />
                        </div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                            More Integrations Coming Soon
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                            We&apos;re working on integrations with LinkedIn, GitLab, Bitbucket, and more. Stay tuned!
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}