'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import {
    db,
    resumeDraft,
    resumeTemplate,
    users,
    workExperiences,
    portfolioProjects,
    userEducations,
    socialLinks,
    skills,
} from '@repo/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { ResumeDraftContent, emptyResumeDraftContent, PLATFORM_TEMPLATES } from '@/types/resume-draft'
import { openai } from '@/lib/openai-client'
import { withCredits, OperationFailed } from '@/lib/credits/charge'

// ─────────────────────────────────────────────────────────────────────────────
// Seed platform templates (call once or on demand)
// ─────────────────────────────────────────────────────────────────────────────
export async function ensurePlatformTemplates() {
    for (const tpl of PLATFORM_TEMPLATES) {
        const existing = await db.query.resumeTemplate.findFirst({
            where: eq(resumeTemplate.slug, tpl.slug),
        });

        if (existing) {
            await db.update(resumeTemplate)
                .set({
                    name: tpl.name,
                    description: tpl.description,
                    tags: tpl.tags,
                    sectionOrder: tpl.sectionOrder,
                    config: tpl.config as any,
                    isPlatform: true,
                    isDefault: tpl.slug === 'clean-minimal',
                    creditsCost: 0,
                    isMarketplace: false,
                    previewImageUrl: '',
                })
                .where(eq(resumeTemplate.slug, tpl.slug));
        } else {
            await db.insert(resumeTemplate).values({
                slug: tpl.slug,
                name: tpl.name,
                description: tpl.description,
                tags: tpl.tags,
                sectionOrder: tpl.sectionOrder,
                config: tpl.config as any,
                isPlatform: true,
                isDefault: tpl.slug === 'clean-minimal',
                creditsCost: 0,
                isMarketplace: false,
                previewImageUrl: '',
            });
        }
    }
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET all templates (platform + marketplace + user's own)
// ─────────────────────────────────────────────────────────────────────────────
export async function getResumeTemplates() {
    await ensurePlatformTemplates()
    const templates = await db.query.resumeTemplate.findMany({
        orderBy: [desc(resumeTemplate.isPlatform), desc(resumeTemplate.totalSales), resumeTemplate.createdAt],
        with: { createdBy: { columns: { name: true, username: true, image: true } } },
    })
    return { success: true, templates }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET all resume drafts for current user
// ─────────────────────────────────────────────────────────────────────────────
export async function getResumeDrafts() {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // Explicit columns, and NOT `content`. This selected every column, which meant
    // the full resume JSON of every draft was serialised into the page payload for
    // cards that show a name, a badge and a date. With six resumes that is a lot of
    // bytes nobody renders.
    //
    // Primaries sort first so the resume every other feature reads is the one at the
    // top of the list.
    const drafts = await db.query.resumeDraft.findMany({
        where: eq(resumeDraft.userId, session.user.id),
        columns: {
            id: true,
            name: true,
            templateSlug: true,
            isPublic: true,
            shareSlug: true,
            viewCount: true,
            isDefault: true,
            sourceDraftId: true,
            tailoredFor: true,
            tailoredForCompany: true,
            atsScore: true,
            importedFrom: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [desc(resumeDraft.isDefault), desc(resumeDraft.updatedAt)],
    })
    return { success: true, drafts }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET single draft
// ─────────────────────────────────────────────────────────────────────────────
export async function getResumeDraft(id: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const draft = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.id, id), eq(resumeDraft.userId, session.user.id)),
    })
    if (!draft) return { success: false, error: 'Not found' }
    return { success: true, draft }
}

// GET by share slug (public)
export async function getResumeDraftBySlug(slug: string) {
    const draft = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.shareSlug, slug), eq(resumeDraft.isPublic, true)),
        with: { user: { columns: { name: true, username: true, image: true } } },
    })
    if (!draft) return { success: false, error: 'Not found or private' }
    // Increment view count
    await db.update(resumeDraft)
        .set({ viewCount: sql`${resumeDraft.viewCount} + 1` })
        .where(eq(resumeDraft.id, draft.id))
    return { success: true, draft }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE a new draft
// ─────────────────────────────────────────────────────────────────────────────
export async function createResumeDraft(input: {
    name: string
    templateSlug?: string
    content?: ResumeDraftContent
    importedFrom?: string
    importedUrl?: string
}) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    // The first resume a user creates becomes their default, so the AI features
    // that ask for "this user's resume" without naming one have an answer from
    // the moment there is anything to answer with. Later resumes do not steal
    // the slot - switching is an explicit act (`setDefaultResumeDraft`).
    const existingDefault = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.userId, session.user.id), eq(resumeDraft.isDefault, true)),
        columns: { id: true },
    })

    const [draft] = await db.insert(resumeDraft).values({
        userId: session.user.id,
        name: input.name,
        templateSlug: input.templateSlug ?? 'clean-minimal',
        content: (input.content ?? emptyResumeDraftContent()) as any,
        importedFrom: input.importedFrom,
        importedUrl: input.importedUrl,
        isDefault: !existingDefault,
    }).returning()
    revalidatePath('/ai/resume')
    revalidatePath('/profile')
    return { success: true, draft }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT RESUME
//
// One resume per user is the one the AI reaches for when a feature needs "their
// resume" and was never told which: cover letters, mock interview context, the
// assistant's `get_my_resume` tool. Without it those features silently fall back
// to whatever the user happened to type into their profile, which for someone
// who only ever uploaded a PDF is nothing at all.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make one draft the user's default, clearing the flag from the rest.
 *
 * Both statements go through `db.batch` so a reader can never see two defaults
 * or none. `db.transaction()` is not an option here - the neon-http driver
 * throws on it, and the surrounding catch would turn that into a silent
 * `{ success: false }`.
 */
export async function setDefaultResumeDraft(id: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
    const userId = session.user.id

    // Ownership is checked before the write, not assumed from the id: this is a
    // server action, so `id` is whatever the caller sent.
    const owned = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.id, id), eq(resumeDraft.userId, userId)),
        columns: { id: true },
    })
    if (!owned) return { success: false, error: 'Resume not found' }

    await db.batch([
        db.update(resumeDraft)
            .set({ isDefault: false })
            .where(and(eq(resumeDraft.userId, userId), eq(resumeDraft.isDefault, true))),
        db.update(resumeDraft)
            .set({ isDefault: true })
            .where(and(eq(resumeDraft.id, id), eq(resumeDraft.userId, userId))),
    ])

    revalidatePath('/ai/resume')
    revalidatePath('/profile')
    return { success: true }
}

/**
 * The resume every AI feature should read when it needs the user's background.
 *
 * Falls back to the most recently updated draft when nothing is flagged, so a
 * user whose drafts predate this feature still gets an answer instead of an
 * empty one. Returns null only when they genuinely have no resume.
 */
export async function getDefaultResumeDraft() {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const draft =
        (await db.query.resumeDraft.findFirst({
            where: and(eq(resumeDraft.userId, session.user.id), eq(resumeDraft.isDefault, true)),
        })) ??
        (await db.query.resumeDraft.findFirst({
            where: eq(resumeDraft.userId, session.user.id),
            orderBy: [desc(resumeDraft.updatedAt)],
        }))

    return { success: true, draft: draft ?? null }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE draft from current user profile
// ─────────────────────────────────────────────────────────────────────────────
export async function createDraftFromProfile(name: string, templateSlug = 'clean-minimal') {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    })
    if (!user) return { success: false, error: 'User not found' }

    const [userExperiences, userProjects, userEdus, userSocialLinks, userSkills] = await Promise.all([
        db.query.workExperiences.findMany({ where: eq(workExperiences.userId, user.id), orderBy: [desc(workExperiences.startDate)] }),
        db.query.portfolioProjects.findMany({
            where: eq(portfolioProjects.userId, user.id),
            orderBy: [desc(portfolioProjects.startDate)],
            with: { links: true },
        }),
        db.query.userEducations.findMany({ where: eq(userEducations.userId, user.id), orderBy: [desc(userEducations.startDate)] }),
        db.query.socialLinks.findMany({ where: eq(socialLinks.userId, user.id) }),
        db.query.skills.findMany({ where: eq(skills.userId, user.id) }),
    ])

    const content: ResumeDraftContent = {
        header: {
            name: user.name ?? '',
            email: user.email ?? '',
            title: user.occupation ?? '',
            location: user.location ?? '',
            // `users.phone` is a real column. It was the one header field this mapper
            // never read, so a draft created from a profile started with an empty phone
            // number however complete the profile was.
            phone: user.phone ?? '',
            summary: user.bio ?? '',
            github: userSocialLinks.find((s) => s.platform === 'GITHUB')?.url,
            linkedin: userSocialLinks.find((s) => s.platform === 'LINKEDIN')?.url,
            portfolio: userSocialLinks.find((s) => s.platform === 'PORTFOLIO')?.url,
            website: userSocialLinks.find((s) => s.platform === 'WEBSITE')?.url,
        },
        experience: userExperiences.map((e) => ({
            id: e.id,
            company: e.companyName,
            role: e.roleTitle,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate?.toISOString(),
            current: e.isCurrentlyWorking,
            bullets: (e.bulletPoints as string[]) ?? [],
        })),
        projects: userProjects.map((p) => ({
            id: p.id,
            name: p.projectName,
            description: p.description ?? '',
            technologies: (p.technologies as string[]) ?? [],
            github: p.links.find((l) => l.linkType === 'GITHUB')?.url,
            liveUrl: p.links.find((l) => l.linkType === 'LIVE_SITE' || l.linkType === 'DEMO')?.url,
            bullets: (p.bulletPoints as string[]) ?? [],
        })),
        education: userEdus.map((e) => ({
            id: e.id,
            institution: e.institution,
            degree: e.degree ?? '',
            startDate: e.startDate?.toISOString() ?? '',
            endDate: e.endDate?.toISOString(),
            bullets: (e.bulletPoints as string[]) ?? [],
        })),
        skills: buildSkillGroups(userSkills),
        certifications: [],
    }

    // Collect missing fields so the caller can show toasts
    const missingFields: string[] = []
    if (!userExperiences.length) missingFields.push('Work Experience')
    if (!userProjects.length) missingFields.push('Projects')
    if (!userSkills.length) missingFields.push('Skills')
    if (!userEdus.length) missingFields.push('Education')
    if (!user.name) missingFields.push('Full Name')
    if (!user.occupation) missingFields.push('Job Title')

    const result = await createResumeDraft({ name, templateSlug, content, importedFrom: 'profile' })
    if (!result.success) return result
    return { ...result, missingFields }
}

function buildSkillGroups(skills: { name: string; category: string }[]) {
    const map = new Map<string, string[]>()
    for (const s of skills) {
        if (!map.has(s.category)) map.set(s.category, [])
        map.get(s.category)!.push(s.name)
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE a draft
// ─────────────────────────────────────────────────────────────────────────────
export async function updateResumeDraft(id: string, data: {
    name?: string
    templateSlug?: string
    content?: ResumeDraftContent
    isPublic?: boolean
    tailoredFor?: string
    jdSnapshot?: string
    atsScore?: number
}) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const _result = await db.update(resumeDraft)
        .set({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.templateSlug !== undefined && { templateSlug: data.templateSlug }),
            ...(data.content !== undefined && { content: data.content as any }),
            ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
            ...(data.tailoredFor !== undefined && { tailoredFor: data.tailoredFor }),
            ...(data.jdSnapshot !== undefined && { jdSnapshot: data.jdSnapshot }),
            ...(data.atsScore !== undefined && { atsScore: data.atsScore }),
        })
        .where(and(eq(resumeDraft.id, id), eq(resumeDraft.userId, session.user.id)))
    revalidatePath('/ai/resume')
    return { success: true, updated: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE a draft
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteResumeDraft(id: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
    const userId = session.user.id

    const [deleted] = await db.delete(resumeDraft)
        .where(and(eq(resumeDraft.id, id), eq(resumeDraft.userId, userId)))
        .returning({ wasDefault: resumeDraft.isDefault })

    // Deleting the default must not leave the user without one, or every AI
    // feature that reads "their resume" quietly goes back to answering with
    // nothing. The most recently touched survivor takes over.
    if (deleted?.wasDefault) {
        const next = await db.query.resumeDraft.findFirst({
            where: eq(resumeDraft.userId, userId),
            orderBy: [desc(resumeDraft.updatedAt)],
            columns: { id: true },
        })
        if (next) {
            await db.update(resumeDraft)
                .set({ isDefault: true })
                .where(and(eq(resumeDraft.id, next.id), eq(resumeDraft.userId, userId)))
        }
    }

    revalidatePath('/ai/resume')
    revalidatePath('/profile')
    return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// DUPLICATE a draft
// ─────────────────────────────────────────────────────────────────────────────
export async function duplicateResumeDraft(id: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const original = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.id, id), eq(resumeDraft.userId, session.user.id)),
    })
    if (!original) return { success: false, error: 'Not found' }

    const [copy] = await db.insert(resumeDraft).values({
        userId: session.user.id,
        name: `${original.name} (Copy)`,
        templateSlug: original.templateSlug,
        content: original.content ?? {} as any,
        tailoredFor: original.tailoredFor,
    }).returning()
    revalidatePath('/ai/resume')
    return { success: true, draft: copy }
}

/**
 * Whether a model response is safe to store as a resume's `content`.
 *
 * Deliberately structural rather than deep: the six sections are what the editor
 * and every AI consumer index into, and a missing one is a crash rather than an
 * empty section. It does not vet individual entries - a slightly wrong bullet is
 * the user's to fix, an `undefined` where an array belongs is not.
 *
 * Not exported: `"use server"` modules may only export async functions.
 */
function isResumeDraftContent(value: unknown): value is ResumeDraftContent {
    if (!value || typeof value !== 'object') return false
    const c = value as Record<string, unknown>
    if (!c.header || typeof c.header !== 'object') return false
    return (
        Array.isArray(c.experience) &&
        Array.isArray(c.projects) &&
        Array.isArray(c.education) &&
        Array.isArray(c.skills) &&
        Array.isArray(c.certifications)
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI: Score resume against a job description
// ─────────────────────────────────────────────────────────────────────────────
export async function scoreResumeAgainstJD(draftId: string, jobDescription: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const draft = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, session.user.id)),
    })
    if (!draft) return { success: false, error: 'Draft not found' }

    const content = draft.content as unknown as ResumeDraftContent
    const resumeText = JSON.stringify(content)

    // Charged only after ownership is confirmed above - taking money for someone
    // else's draft id and then failing is a refund that should never have
    // needed to happen.
    const charged = await withCredits(
        { userId: session.user.id, operation: 'resume_ats_score', reason: 'Resume: ATS score against a job description' },
        async () => {
            const res = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an ATS expert. Score a resume against a job description 0-100. Return JSON only.',
                    },
                    {
                        role: 'user',
                        content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nReturn: {"score": number, "missing_keywords": string[], "matched_keywords": string[], "suggestions": string[]}`,
                    },
                ],
                response_format: { type: 'json_object' },
            })

            // `JSON.parse` on model output was previously unguarded and would
            // throw straight past the caller.
            let parsed: { score?: unknown; missing_keywords?: string[]; matched_keywords?: string[]; suggestions?: string[] }
            try {
                parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}')
            } catch {
                throw new OperationFailed('The ATS scorer returned output we could not read.')
            }
            // A score of 0 is a legitimate score, so this checks the type rather
            // than truthiness.
            if (typeof parsed.score !== 'number' || Number.isNaN(parsed.score)) {
                throw new OperationFailed('The ATS scorer did not return a score.')
            }
            return {
                score: parsed.score,
                missing_keywords: parsed.missing_keywords ?? [],
                matched_keywords: parsed.matched_keywords ?? [],
                suggestions: parsed.suggestions ?? [],
            }
        },
    )

    if (!charged.success) {
        return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available }
    }

    await db.update(resumeDraft)
        .set({ atsScore: charged.data.score, jdSnapshot: jobDescription })
        .where(and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, session.user.id)))
    revalidatePath('/ai/resume')
    return { success: true, ...charged.data }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI: Tailor resume bullets for a specific JD
//
// SUPERSEDED by `createTailoredResume` in `resume-primary.action.ts`. Do not call
// this from new code, and do not reintroduce it in the editor.
//
// Two reasons it was replaced rather than fixed in place:
//
//   1. It rewrites the draft it is given - see the comment at the update below.
//      Tailoring for one job therefore destroyed the user's master resume, and
//      tailoring again ran against the already-narrowed copy, compounding it.
//   2. It is an inline `gpt-4o` completion over a whole resume plus a whole job
//      description, which is one of the longest calls in the product and does not
//      survive a Cloudflare request.
//
// Kept, not deleted, per the "nothing is deleted" rule in
// `srs/core-modules/README.md` - the decision on what to cut is Niraj's.
// ─────────────────────────────────────────────────────────────────────────────
export async function tailorResumeForJD(draftId: string, jobDescription: string, jobTitle: string) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const draft = await db.query.resumeDraft.findFirst({
        where: and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, session.user.id)),
    })
    if (!draft) return { success: false, error: 'Draft not found' }

    // The model call and the validation are inside the hold; the WRITE is not.
    // A tailor that comes back malformed must refund AND leave the stored resume
    // exactly as it was, so nothing touches the draft until the charge settles.
    const charged = await withCredits(
        { userId: session.user.id, operation: 'resume_tailor_jd', reason: `Resume: tailored for ${jobTitle || 'a job description'}` },
        async () => {
        const content = draft.content as unknown as ResumeDraftContent

        const res = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert resume coach. Given a resume and a job description, do two things:
    1. Rewrite the experience bullet points to better match the JD language and keywords. Keep all facts accurate - only rephrase and reframe.
    2. Identify what important skills or experiences mentioned in the JD are MISSING from this resume and list them as suggestions.

    Return JSON in this exact format:
    {
      "updatedContent": { ...full updated resume content matching the original structure... },
      "suggestions": ["Missing: Kubernetes experience", "Add: mention of CI/CD pipelines", ...],
      "keywordsAdded": ["React", "TypeScript", ...],
      "summary": "Tailored 3 bullet points and updated skills order to match the JD."
    }`,
                },
                {
                    role: 'user',
                    content: `Job Title: ${jobTitle}\n\nJob Description:\n${jobDescription}\n\nCurrent Resume:\n${JSON.stringify(content, null, 2)}`,
                },
            ],
            response_format: { type: 'json_object' },
        })

        let result: { updatedContent?: unknown; suggestions?: string[]; keywordsAdded?: string[]; summary?: string }
        try {
            result = JSON.parse(res.choices[0]?.message?.content ?? '{}')
        } catch {
            throw new OperationFailed('The resume tailor returned output we could not read.')
        }

        // The tailored content OVERWRITES a working resume. Validate before writing:
        // the previous version set `content` to whatever came back, so a malformed
        // response wrote `undefined` over the user's resume - and kept the charge.
        // Destroying the resume and billing for it is the worst outcome in this
        // module, so a response that does not have the right shape refunds and
        // leaves the stored draft untouched.
        const updated = result.updatedContent as ResumeDraftContent | undefined
        if (!isResumeDraftContent(updated)) {
            throw new OperationFailed('The tailored resume came back malformed, so your existing resume was left unchanged.')
        }

        return {
            updated,
            suggestions: (result.suggestions ?? []) as string[],
            keywordsAdded: (result.keywordsAdded ?? []) as string[],
            summary: (result.summary ?? '') as string,
        }

        },
    )

    if (!charged.success) {
        return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available }
    }

    // Update THIS draft in place - do not create a new one.
    await db.update(resumeDraft)
        .set({
            content: charged.data.updated as any,
            tailoredFor: jobTitle,
            jdSnapshot: jobDescription,
        })
        .where(and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, session.user.id)))
    revalidatePath('/ai/resume')
    return {
        success: true,
        updatedContent: charged.data.updated,
        suggestions: charged.data.suggestions,
        keywordsAdded: charged.data.keywordsAdded,
        summary: charged.data.summary,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// User template upload (save config to DB)
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadUserTemplate(input: {
    name: string
    description: string
    config: Record<string, unknown>
    sectionOrder: string[]
    tags: string[]
    marketplacePrice?: number
}) {
    const session = await getSession(headers())
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const slug = `user-${session.user.id.slice(0, 8)}-${Date.now()}`
    const [template] = await db.insert(resumeTemplate).values({
        slug,
        name: input.name,
        description: input.description,
        previewImageUrl: '',
        sectionOrder: input.sectionOrder,
        config: input.config as any,
        tags: input.tags,
        isPlatform: false,
        isMarketplace: (input.marketplacePrice ?? 0) > 0,
        marketplacePrice: input.marketplacePrice ?? 0,
        creditsCost: 0,
        createdById: session.user.id,
    }).returning()
    revalidatePath('/ai/resume')
    revalidatePath('/blueprint/resume')
    return { success: true, template }
}
