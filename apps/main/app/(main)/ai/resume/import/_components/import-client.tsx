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
    CheckCircle2, AlertCircle
} from "lucide-react"
import toast from "@repo/ui/components/ui/sonner"
import { importProfileAndCreateDraft } from "@/actions/(main)/ai/resume-import.action"
import { awaitBackgroundJob } from "@/hooks/use-background-job"
import { useResumeHubStore } from "@/app/store/resumeHubStore"
import { creditErrorMessage, priceSuffix } from "@/lib/credits/notify"
import { saveMyProfileLinks } from "@/actions/(main)/user/profile-links.action"
import { githubUsernameFrom, twitterHandleFrom, type ProfileLinks } from "@/lib/profile-links"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

/**
 * The four stages the import job actually reports, and the progress percentage
 * each one starts at.
 *
 * These used to be five invented captions advanced by a `setInterval` every four
 * seconds, which is a progress bar that describes a schedule rather than a job:
 * on a fast import it claimed to be scraping LinkedIn after the resume was
 * already saved, and on a slow one it sat at "Finalising" for a minute. Since
 * RES-9 the work runs on the worker and reports real phases, so the checklist
 * shows where it genuinely is.
 *
 * The thresholds mirror the `progress()` calls in
 * `apps/worker/src/jobs/resume-import.ts`. They are read as "at least", so a
 * phase the job skips still advances the list rather than stalling it.
 */
const STAGES = [
    { at: 0, label: "Reading your profiles…" },
    { at: 30, label: "Reading your code…" },
    { at: 55, label: "Writing your resume with AI…" },
    { at: 85, label: "Saving your draft…" },
] as const

function stageIndexFor(progress: number): number {
    let idx = 0
    for (let i = 0; i < STAGES.length; i++) {
        if (progress >= STAGES[i]!.at) idx = i
    }
    return idx
}

/**
 * `links` is what the user already has on their profile. The page is a server component, so
 * these arrive as the INITIAL state rather than being fetched here - which is what makes the
 * fields render already filled instead of blank-then-populated a moment later.
 */

/**
 * "Filled in from your profile."
 *
 * A field that arrives already populated, with nothing saying why, reads as the form having
 * invented a value - so people delete it and retype the same thing. One line removes that.
 */
function FromProfile() {
    return (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Filled in from your profile - edit it here and we will remember the change.
        </p>
    )
}

export function ImportClient({ links }: { links: ProfileLinks }) {
    const router = useRouter()
    const { setImportProgress } = useResumeHubStore()

    // Seeded from the profile. Someone who filled these in once should not be asked again -
    // and what they type here is saved back, so the next visit is prefilled too.
    const [linkedinUrl, setLinkedinUrl] = useState(links.linkedinUrl ?? "")
    const [githubUsername, setGithubUsername] = useState(githubUsernameFrom(links.githubUrl))
    const [twitterHandle, setTwitterHandle] = useState(twitterHandleFrom(links.twitterUrl))
    const [portfolioUrl, setPortfolioUrl] = useState(links.websiteUrl ?? "")

    // Which fields arrived from the profile rather than being typed. Used only to tell the
    // user where the value came from - a prefilled field with no explanation reads as the
    // form having invented something.
    const prefilled = {
        linkedin: Boolean(links.linkedinUrl),
        github: Boolean(links.githubUrl),
        twitter: Boolean(links.twitterUrl),
        portfolio: Boolean(links.websiteUrl),
    }
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

        try {
            // Save the links back BEFORE the import, not after: the import is the slow part
            // and the one that can fail, and there is no reason for a failed extraction to
            // also lose the four URLs the user just typed.
            void saveMyProfileLinks({
                linkedinUrl: linkedinUrl.trim() || null,
                githubUrl: githubUsername.trim() || null,
                twitterUrl: twitterHandle.trim() || null,
                websiteUrl: portfolioUrl.trim() || null,
            })

            const res = await importProfileAndCreateDraft({
                linkedinUrl: linkedinUrl.trim(),
                githubUsername: githubUsername.replace(/^@/, "").trim(),
                twitterHandle: twitterHandle.replace(/^@/, "").trim() || undefined,
                portfolioUrl: portfolioUrl.trim() || undefined,
            })

            if (!res.success || !res.jobId) {
                setImportProgress(null)
                toast.error(creditErrorMessage(res, "Import failed"))
                setLoading(false)
                return
            }

            // The scraping and the model call run on the worker; this follows the
            // job. The credit hold settles or refunds the first time this poll
            // sees a terminal status, so an import that dies against a private
            // LinkedIn or a rate-limited GitHub gives the 20 credits back instead
            // of charging for a request that never returned.
            const outcome = await awaitBackgroundJob<{ draftId?: string }>(
                res.jobId,
                (progress, phaseLabel) => {
                    const idx = stageIndexFor(progress)
                    setStageIdx(idx)
                    setImportProgress({ stage: phaseLabel || STAGES[idx]!.label, percent: progress })
                },
            )

            setImportProgress(null)

            if (!outcome.ok) {
                toast.error(outcome.error)
                setLoading(false)
                return
            }

            if (!outcome.result?.draftId) {
                toast.error("The import finished but no resume was saved. Please try again.")
                setLoading(false)
                return
            }

            toast.success("AI resume created! Redirecting to editor…")
            router.push(`/ai/resume/draft/${outcome.result.draftId}`)
        } catch {
            setImportProgress(null)
            toast.error("Something went wrong. Please try again.")
            setLoading(false)
        }
    }

    // 3xl and a two-column field grid, not 2xl stacked. Four inputs, an "extracts" panel, a
    // disclaimer and a submit button in one narrow column ran off the bottom of every laptop -
    // the button that finishes the task was the one thing you had to scroll to find. Paired
    // side by side, the same content is one screen at 900px tall.
    return (
        <div className="max-w-3xl mx-auto">
            {/* Back */}
            <Link href="/ai/resume" className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
            </Link>

            {/* Hero */}
            <div className="mb-5">
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
                    <Badge variant="outline" className="text-xs gap-1 text-neutral-800 dark:text-neutral-200 border-neutral-200">
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
                            <InlineLoader size="lg" className="text-neutral-800 dark:text-neutral-100" />
                        </div>
                    </div>
                    <div>
                        <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                            {STAGES[stageIdx]!.label}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">This takes 20-40 seconds. Please wait…</p>
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
                            <div key={s.label} className={`flex items-center gap-2 text-xs transition-colors ${i <= stageIdx ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-300 dark:text-neutral-400"}`}>
                                {i < stageIdx ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100 shrink-0" />
                                ) : i === stageIdx ? (
                                    <InlineLoader size="sm" className="text-neutral-900 dark:text-neutral-100 shrink-0" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-200 dark:border-neutral-700 shrink-0" />
                                )}
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── Form ── */
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5">
                    {/* Required */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Required</p>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                <Linkedin className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                                LinkedIn Profile URL
                                <span className="text-red-500 text-xs">*</span>
                            </Label>
                            <Input
                                placeholder="https://linkedin.com/in/yourname"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                className="font-mono text-sm"
                            />
                            {prefilled.linkedin
                                ? <FromProfile />
                                : <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Make sure your LinkedIn profile is set to public.</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                <Github className="w-3.5 h-3.5" />
                                GitHub Username
                                <span className="text-red-500 text-xs">*</span>
                            </Label>
                            <div className="flex items-center gap-0">
                                <span className="h-9 flex items-center px-3 rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400">
                                    github.com/
                                </span>
                                <Input
                                    placeholder="yourusername"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                    className="rounded-l-none font-mono text-sm"
                                />
                            </div>
                            {prefilled.github && <FromProfile />}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700" />

                    {/* Optional */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Optional (improves accuracy)</p>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Twitter className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                                Twitter / X Handle
                            </Label>
                            <div className="flex items-center">
                                <span className="h-9 flex items-center px-3 rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 dark:text-neutral-400">
                                    @
                                </span>
                                <Input
                                    placeholder="yourhandle"
                                    value={twitterHandle}
                                    onChange={(e) => setTwitterHandle(e.target.value)}
                                    className="rounded-l-none font-mono text-sm"
                                />
                            </div>
                            {prefilled.twitter && <FromProfile />}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Globe className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                                Portfolio URL
                            </Label>
                            <Input
                                placeholder="https://yourportfolio.com"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                            {prefilled.portfolio && <FromProfile />}
                    </div>

                    {/* What we import */}
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3.5 space-y-2">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">What AI extracts:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                "Name & contact info", "Work experience", "GitHub projects",
                                "Technical skills", "Education", "Professional summary",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                    <CheckCircle2 className="w-3 h-3 text-neutral-900 dark:text-neutral-100 shrink-0" />
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
