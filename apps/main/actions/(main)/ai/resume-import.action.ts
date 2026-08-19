'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import Exa from 'exa-js'
import { openai } from '@/lib/openai-client'
import { ResumeDraftContent } from '@/types/resume-draft'
import { createResumeDraft } from './resume-draft.action'
import { z } from 'zod'
import { zodResponseFormat } from "@/lib/openai-client"
import { withCredits, OperationFailed } from '@/lib/credits/charge'

// ── Exa client (lazy singleton) ──────────────────────────────────────────────
let _exa: Exa | null = null
const exa = new Proxy({} as Exa, {
    get(_, prop) {
        if (!_exa) _exa = new Exa(process.env.EXA_API_KEY!)
        return Reflect.get(_exa, prop)
    }
})

async function fetchPageText(url: string): Promise<string> {
    const result = await exa.getContents([url], { text: true, livecrawlTimeout: 10000 })
    return result?.results?.[0]?.text?.trim() ?? ''
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema for structured extraction
// ─────────────────────────────────────────────────────────────────────────────
const ResumeContentSchema = z.object({
    header: z.object({
        name: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        location: z.string().nullable(),
        title: z.string().nullable(),
        summary: z.string().nullable(),
        website: z.string().nullable(),
        linkedin: z.string().nullable(),
        github: z.string().nullable(),
        portfolio: z.string().nullable(),
    }),
    experience: z.array(z.object({
        id: z.string(),
        company: z.string(),
        role: z.string(),
        location: z.string().nullable(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        current: z.boolean(),
        bullets: z.array(z.string()),
    })),
    projects: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        technologies: z.array(z.string()),
        github: z.string().nullable(),
        liveUrl: z.string().nullable(),
        bullets: z.array(z.string()),
    })),
    education: z.array(z.object({
        id: z.string(),
        institution: z.string(),
        degree: z.string().nullable(),
        field: z.string().nullable(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        bullets: z.array(z.string()),
    })),
    skills: z.array(z.object({
        category: z.string(),
        items: z.array(z.string()),
    })),
    certifications: z.array(z.object({
        id: z.string(),
        name: z.string(),
        issuer: z.string().nullable(),
        date: z.string().nullable(),
        url: z.string().nullable(),
    })),
})

// ─────────────────────────────────────────────────────────────────────────────
// Extract structured resume content from raw text using GPT
// ─────────────────────────────────────────────────────────────────────────────
async function extractStructuredContent(rawText: string, sourceHint: string): Promise<ResumeDraftContent> {
    const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a resume parser. Extract structured resume data from ${sourceHint} content.
Use cuid-style IDs (random 8-char strings) for array items.
Dates should be ISO strings (YYYY-MM-DD).
Group skills by category (Programming Languages, Frameworks, Tools, Databases, Cloud, etc.).
All nullable fields should be null if not found, never undefined.`,
            },
            {
                role: 'user',
                content: `Extract resume data from this content:\n\n${rawText.slice(0, 8000)}`,
            },
        ],
        response_format: zodResponseFormat(ResumeContentSchema, 'resume_content'),
    })

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}')
    return parsed as ResumeDraftContent
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED: Scrape multiple sources and merge into one draft
// ─────────────────────────────────────────────────────────────────────────────
export async function importAndCreateDraft(input: {
    name: string
    templateSlug: string
    linkedinUrl?: string
    githubUrl?: string
    pastedText?: string
}) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        const parts: string[] = []
        const usedSources: string[] = []

        if (input.linkedinUrl) {
            const raw = await fetchPageText(input.linkedinUrl)
            if (raw) { parts.push(`=== LinkedIn Profile ===\n${raw}`); usedSources.push('linkedin') }
        }

        if (input.githubUrl) {
            const username = input.githubUrl.replace(/https?:\/\/(www\.)?github\.com\/?/, '').split('/')[0]
            const raw = await fetchPageText(`https://github.com/${username}`)
            if (raw) { parts.push(`=== GitHub Profile ===\n${raw}`); usedSources.push('github') }
        }

        if (input.pastedText?.trim()) {
            parts.push(`=== Pasted Resume/Text ===\n${input.pastedText}`)
            usedSources.push('text')
        }

        // Charged only once at least one source produced text. A user who typed a
        // dead URL pays nothing, because no model call was made.
        if (parts.length === 0) return { success: false, error: 'Please provide at least one source (LinkedIn, GitHub, or resume text).' }

        const combined = parts.join('\n\n')

        // The model call AND the insert are inside the hold. Unlike a cover
        // letter, the product of an import is the saved draft - an import that
        // generates content and then fails to save leaves the user with nothing,
        // so it must refund.
        const charged = await withCredits(
            { userId: session.user.id, operation: 'resume_import', reason: `Resume import: ${usedSources.join(' + ')}` },
            async () => {
                const content = await extractStructuredContent(combined, `${usedSources.join(' + ')} sources`)
                const result = await createResumeDraft({
                    name: input.name,
                    templateSlug: input.templateSlug,
                    content,
                    importedFrom: usedSources.join(','),
                    importedUrl: input.linkedinUrl ?? input.githubUrl,
                })
                if (!result.success || !result.draft) {
                    throw new OperationFailed('We read your profile but could not save the resume.')
                }
                return result.draft
            },
        )

        if (!charged.success) {
            return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available }
        }
        return { success: true, draft: charged.data }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Import failed' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PROFILE IMPORT - uses GitHub REST API + Exa for LinkedIn/portfolio
// Supports: LinkedIn (required), GitHub username (required),
//           Twitter handle (optional), Portfolio URL (optional)
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileImportInput {
    linkedinUrl: string
    githubUsername: string
    twitterHandle?: string
    portfolioUrl?: string
    templateSlug?: string
}

async function fetchGitHubData(username: string): Promise<string> {
    const ghHeaders: HeadersInit = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    if (process.env.GITHUB_NIRAJ_JHA_TOKEN) {
        (ghHeaders as Record<string, string>)['Authorization'] = `Bearer ${process.env.GITHUB_NIRAJ_JHA_TOKEN}`
    }

    const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers: ghHeaders }),
        fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=8&type=owner`, { headers: ghHeaders }),
    ])

    if (!userRes.ok) throw new Error(`GitHub profile not found: ${username}`)

    const user = await userRes.json() as {
        name?: string; bio?: string; company?: string; location?: string
        blog?: string; email?: string; public_repos?: number; followers?: number
    }
    const repos = reposRes.ok ? (await reposRes.json() as Array<{
        name: string; description?: string; language?: string; stargazers_count: number
        html_url: string; topics?: string[]
    }>) : []

    // Fetch languages for top 3 repos
    const topRepos = repos.slice(0, 3)
    const langResults = await Promise.allSettled(
        topRepos.map(r =>
            fetch(`https://api.github.com/repos/${username}/${r.name}/languages`, { headers: ghHeaders })
                .then(res => res.json() as Promise<Record<string, number>>)
        )
    )

    const repoDetails = topRepos.map((r, i) => {
        const result = langResults[i]!
        const langs = result.status === 'fulfilled' ? Object.keys((result as PromiseFulfilledResult<Record<string, number>>).value) : []
        return `- ${r.name}: ${r.description || 'No description'} | Stars: ${r.stargazers_count} | Languages: ${[r.language, ...langs].filter(Boolean).join(', ')}`
    })

    const otherRepos = repos.slice(3).map(r => `- ${r.name} (${r.language || 'Unknown'})`)

    return [
        `=== GitHub Profile: ${user.name || username} ===`,
        `Bio: ${user.bio || 'N/A'}`,
        `Company: ${user.company || 'N/A'}`,
        `Location: ${user.location || 'N/A'}`,
        `Website: ${user.blog || 'N/A'}`,
        `Public Repos: ${user.public_repos || 0} | Followers: ${user.followers || 0}`,
        '',
        '=== Top Projects ===',
        ...repoDetails,
        '',
        '=== Other Repos ===',
        ...otherRepos.slice(0, 5),
    ].join('\n')
}

export async function importProfileAndCreateDraft(input: ProfileImportInput) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        const parts: string[] = []

        // 1. LinkedIn via Exa
        const linkedinRaw = await fetchPageText(input.linkedinUrl).catch(() => '')
        if (linkedinRaw) parts.push(`=== LinkedIn Profile ===\n${linkedinRaw.slice(0, 5000)}`)

        // 2. GitHub via official REST API
        const ghUsername = input.githubUsername.replace(/^@/, '').trim()
        const githubText = await fetchGitHubData(ghUsername).catch(e => {
            console.warn('[import] GitHub fetch failed:', e)
            return ''
        })
        if (githubText) parts.push(githubText)

        // 3. Twitter (optional) - just add the handle for context
        if (input.twitterHandle) {
            const handle = input.twitterHandle.replace(/^@/, '')
            const twitterRaw = await fetchPageText(`https://twitter.com/${handle}`).catch(() => '')
            if (twitterRaw) parts.push(`=== Twitter/X Profile ===\n${twitterRaw.slice(0, 2000)}`)
        }

        // 4. Portfolio (optional)
        if (input.portfolioUrl) {
            const portfolioRaw = await fetchPageText(input.portfolioUrl).catch(() => '')
            if (portfolioRaw) parts.push(`=== Portfolio Website ===\n${portfolioRaw.slice(0, 3000)}`)
        }

        // Every source is best-effort. All of them failing means no model call was
        // made and there is nothing to charge for - the return below happens
        // before the hold. Some succeeding means the model ran: that is charged,
        // even though the import is thinner than the user hoped.
        if (parts.length === 0) return { success: false, error: 'Could not extract data from any source. Make sure profiles are public.' }

        const combined = parts.join('\n\n')

        const charged = await withCredits(
            { userId: session.user.id, operation: 'resume_import', reason: 'Resume import: LinkedIn + GitHub' },
            async () => {
                const content = await extractStructuredContent(
                    combined,
                    'LinkedIn profile, GitHub repositories, and additional sources'
                )
                const result = await createResumeDraft({
                    name: `${content.header.name || 'My'} AI-Generated Resume`,
                    templateSlug: input.templateSlug ?? 'clean-minimal',
                    content,
                    importedFrom: 'linkedin_github_ai_import',
                    importedUrl: input.linkedinUrl,
                })
                if (!result.success || !result.draft) {
                    throw new OperationFailed('We read your profiles but could not save the resume.')
                }
                return result.draft
            },
        )

        if (!charged.success) {
            return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available }
        }
        return { success: true, draft: charged.data }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Profile import failed' }
    }
}
