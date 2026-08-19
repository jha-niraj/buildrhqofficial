"use client"
import Link from "next/link";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Badge } from "@repo/ui/components/ui/badge"
import {
    ArrowLeft, Linkedin, Github, Twitter, Globe, Sparkles,
    CheckCircle2, AlertCircle, Loader2
} from "lucide-react"
import toast from "@repo/ui/components/ui/sonner"
import { importProfileAndCreateDraft } from "@/actions/(main)/ai/resume-import.action"
import { useResumeHubStore } from "@/app/store/resumeHubStore"
import { creditErrorMessage, priceSuffix } from "@/lib/credits/notify"

const STAGES = [
    "Scraping LinkedIn profile…",
    "Fetching GitHub repositories…",
    "Analysing portfolio & socials…",
    "Building resume with AI…",
    "Finalising and saving draft…",
]

export function ImportClient() {
    const router = useRouter()
    const { setImportProgress } = useResumeHubStore()

    const [linkedinUrl, setLinkedinUrl] = useState("")
    const [githubUsername, setGithubUsername] = useState("")
    const [twitterHandle, setTwitterHandle] = useState("")
    const [portfolioUrl, setPortfolioUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [stageIdx, setStageIdx] = useState(0)

    const handleImport = async () => {
        if (!linkedinUrl.trim()) return toast.error("LinkedIn URL is required")
        if (!githubUsername.trim()) return toast.error("GitHub username is required")

        if (!linkedinUrl.includes("linkedin.com/in/")) {
            return toast.error("Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)")
        }

        setLoading(true)
        setStageIdx(0)

        // Animate through stages while waiting
        const interval = setInterval(() => {
            setStageIdx((i) => {
                const next = Math.min(i + 1, STAGES.length - 1)
                setImportProgress({ stage: STAGES[next]!, percent: Math.round(((next + 1) / STAGES.length) * 100) })
                return next
            })
        }, 4000)

        try {
            const res = await importProfileAndCreateDraft({
                linkedinUrl: linkedinUrl.trim(),
                githubUsername: githubUsername.replace(/^@/, "").trim(),
                twitterHandle: twitterHandle.replace(/^@/, "").trim() || undefined,
                portfolioUrl: portfolioUrl.trim() || undefined,
            })

            clearInterval(interval)
            setImportProgress(null)

            if (!res.success) {
                toast.error(creditErrorMessage(res, "Import failed"))
                setLoading(false)
                return
            }

            toast.success("AI resume created! Redirecting to editor…")
            router.push(`/ai/resume/draft/${res.draft!.id}`)
        } catch {
            clearInterval(interval)
            setImportProgress(null)
            toast.error("Something went wrong. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back */}
            <Link href="/ai/resume" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
            </Link>

            {/* Hero */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">AI Profile Import</h1>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 ml-13">
                    Paste your LinkedIn and GitHub links - AI builds your full resume automatically.
                    No manual entry required.
                </p>
                <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="text-xs gap-1 text-neutral-800 border-neutral-200">
                        <Linkedin className="w-3 h-3" /> LinkedIn
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1 text-neutral-700 dark:text-neutral-300">
                        <Github className="w-3 h-3" /> GitHub
                    </Badge>
                    <Badge variant="outline" className="text-xs text-neutral-400">Optional: Twitter · Portfolio</Badge>
                </div>
            </div>

            {loading ? (
                /* ── Loading state ── */
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-800/30 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-neutral-800 dark:text-neutral-100 animate-spin" />
                        </div>
                    </div>
                    <div>
                        <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                            {STAGES[stageIdx]}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">This takes 20-40 seconds. Please wait…</p>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-neutral-900 to-neutral-900 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.round(((stageIdx + 1) / STAGES.length) * 100)}%` }}
                        />
                    </div>
                    <div className="space-y-2">
                        {STAGES.map((s, i) => (
                            <div key={s} className={`flex items-center gap-2 text-xs transition-colors ${i <= stageIdx ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-300 dark:text-neutral-600"}`}>
                                {i < stageIdx ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                                ) : i === stageIdx ? (
                                    <Loader2 className="w-3.5 h-3.5 text-neutral-900 animate-spin shrink-0" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-200 dark:border-neutral-700 shrink-0" />
                                )}
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── Form ── */
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6">
                    {/* Required */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Required</p>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                <Linkedin className="w-3.5 h-3.5 text-neutral-800" />
                                LinkedIn Profile URL
                                <span className="text-red-500 text-xs">*</span>
                            </Label>
                            <Input
                                placeholder="https://linkedin.com/in/yourname"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <p className="text-[11px] text-neutral-400">Make sure your LinkedIn profile is set to public.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                <Github className="w-3.5 h-3.5" />
                                GitHub Username
                                <span className="text-red-500 text-xs">*</span>
                            </Label>
                            <div className="flex items-center gap-0">
                                <span className="h-9 flex items-center px-3 rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500">
                                    github.com/
                                </span>
                                <Input
                                    placeholder="yourusername"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    className="rounded-l-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700" />

                    {/* Optional */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Optional (improves accuracy)</p>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Twitter className="w-3.5 h-3.5 text-neutral-900" />
                                Twitter / X Handle
                            </Label>
                            <div className="flex items-center">
                                <span className="h-9 flex items-center px-3 rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500">
                                    @
                                </span>
                                <Input
                                    placeholder="yourhandle"
                                    value={twitterHandle}
                                    onChange={(e) => setTwitterHandle(e.target.value)}
                                    className="rounded-l-none font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Globe className="w-3.5 h-3.5 text-neutral-900" />
                                Portfolio URL
                            </Label>
                            <Input
                                placeholder="https://yourportfolio.com"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* What we import */}
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 space-y-2">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">What AI extracts:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                "Name & contact info", "Work experience", "GitHub projects",
                                "Technical skills", "Education", "Professional summary",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                    <CheckCircle2 className="w-3 h-3 text-neutral-900 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-800/20 p-3">
                        <AlertCircle className="w-4 h-4 text-neutral-800 dark:text-neutral-100 shrink-0 mt-0.5" />
                        <p className="text-xs text-neutral-700 dark:text-neutral-100">
                            AI-generated resumes are a starting point. Always review and personalise before sending to employers.
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 h-11 text-sm font-semibold gap-2"
                        onClick={handleImport}
                        disabled={loading}
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Resume with AI{priceSuffix("resume_import")}
                    </Button>
                </div>
            )}
        </div>
    )
}
