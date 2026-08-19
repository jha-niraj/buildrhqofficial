'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import {
    db,
    resumeDraft,
    users,
    workExperiences,
    portfolioProjects,
    userEducations,
    socialLinks,
    skills,
    certifications,
} from '@repo/db'
import { and, asc, desc, eq } from 'drizzle-orm'
import type {
    ResumeDraftContent,
    ResumeExperienceEntry,
    ResumeProjectEntry,
    ResumeEducationEntry,
    ResumeSkillGroup,
    ResumeCertificationEntry,
} from '@/types/resume-draft'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate a short cuid-style id for array items
// ─────────────────────────────────────────────────────────────────────────────
function shortId(): string {
    return crypto.randomUUID().slice(0, 8)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: group Skills by category
// ─────────────────────────────────────────────────────────────────────────────
function buildSkillGroups(
    skills: Array<{ name: string; category: string }>
): ResumeSkillGroup[] {
    if (!skills.length) return []

    const map = new Map<string, string[]>()
    for (const s of skills) {
        const cat = s.category || 'Technical Skills'
        if (!map.has(cat)) map.set(cat, [])
        map.get(cat)!.push(s.name)
    }

    return Array.from(map.entries()).map(([category, items]) => ({
        category,
        items,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// syncProfileToResumeDraft
//
// Reads the user's ShipItHQ profile data and maps it into ResumeDraftContent.
// Optionally persists to an existing draft when `draftId` is supplied.
// ─────────────────────────────────────────────────────────────────────────────
export async function syncProfileToResumeDraft(draftId?: string): Promise<
    | { success: true; content: ResumeDraftContent }
    | { success: false; error: string }
> {
    try {
        const session = await getSession(headers())
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized. Please sign in.' }
        }

        const userId = session.user.id

        // ── 1. Fetch user and all profile data in parallel ────────────────────
        const [
            user,
            userSocialLinks,
            userExperiences,
            userProjects,
            userEdus,
            userSkills,
            userCertifications,
        ] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.socialLinks.findMany({ where: eq(socialLinks.userId, userId) }),
            db.query.workExperiences.findMany({
                where: eq(workExperiences.userId, userId),
                orderBy: [desc(workExperiences.startDate)],
            }),
            db.query.portfolioProjects.findMany({
                where: eq(portfolioProjects.userId, userId),
                orderBy: [desc(portfolioProjects.startDate)],
                with: { links: true },
            }),
            db.query.userEducations.findMany({
                where: eq(userEducations.userId, userId),
                orderBy: [desc(userEducations.startDate)],
            }),
            db.query.skills.findMany({
                where: eq(skills.userId, userId),
                orderBy: [asc(skills.category), asc(skills.order)],
            }),
            db.query.certifications.findMany({
                where: eq(certifications.userId, userId),
                orderBy: [desc(certifications.issuedDate)],
            }),
        ])

        if (!user) {
            return { success: false, error: 'User not found.' }
        }

        // ── 2. Fetch ProjectV2 submissions ───────────────────────────────────
        // Note: Using raw query since projectV2Submission may not be in the typed relations
        const projectSubmissions: any[] = []
        try {
            const { projectV2Submissions } = await import('@repo/db')
            const subs = await db.query.projectV2Submissions.findMany({
                where: eq((projectV2Submissions as any).userId, userId),
                orderBy: (s: any, { desc }: any) => [desc(s.createdAt)],
                with: {
                    project: {
                        columns: {
                            title: true,
                            slug: true,
                            technologies: true,
                            shortDescription: true,
                        },
                    },
                },
            })
            projectSubmissions.push(...subs)
        } catch {
            // projectV2Submissions may not exist - skip silently
        }

        // ── 3. Resolve social links ───────────────────────────────────────────
        const socialMap = new Map<string, string | null>(
            userSocialLinks.map((s) => [s.platform.toUpperCase(), s.url])
        )
        const github = socialMap.get('GITHUB') ?? null
        const linkedin = socialMap.get('LINKEDIN') ?? null
        const portfolio = socialMap.get('PORTFOLIO') ?? null
        const website = (user as any).website ?? socialMap.get('WEBSITE') ?? null

        // ── 4. Map header ─────────────────────────────────────────────────────
        const toOptionalString = (v: string | null | undefined): string | undefined =>
            v === null || v === undefined ? undefined : v
        const header = {
            name: user.name ?? '',
            email: user.email ?? '',
            title: user.occupation ?? '',
            summary: user.bio ?? '',
            linkedin: toOptionalString(linkedin),
            github: toOptionalString(github),
            website: toOptionalString(website),
            portfolio: toOptionalString(portfolio),
            phone: undefined,
            location: undefined,
        }

        // ── 5. Map experience ─────────────────────────────────────────────────
        const experience: ResumeExperienceEntry[] = userExperiences.map((e) => {
            let bullets: string[] = (e as any).bulletPoints ?? []
            if (!bullets.length && e.description) {
                bullets = e.description
                    .split('\n')
                    .map((b: string) => b.trim())
                    .filter(Boolean)
            }
            if (!bullets.length && e.description) {
                bullets = [e.description]
            }
            return {
                id: e.id,
                company: e.companyName,
                role: e.roleTitle,
                location: undefined,
                startDate: e.startDate.toISOString(),
                endDate: e.endDate?.toISOString(),
                current: e.isCurrentlyWorking,
                bullets,
            }
        })

        // ── 6. Map portfolio projects ─────────────────────────────────────────
        type ProjectLink = { linkType: string; url: string }
        const portfolioProjectsMapped: ResumeProjectEntry[] = userProjects.map((p) => {
            let bullets: string[] = (p as any).bulletPoints ?? []
            if (!bullets.length && p.description) {
                bullets = [p.description]
            }
            const pLinks = (p as any).links as ProjectLink[] ?? []
            const githubLink =
                pLinks.find(
                    (l: ProjectLink) =>
                        l.linkType.toUpperCase() === 'GITHUB' ||
                        l.linkType.toUpperCase() === 'GITHUB_REPO'
                )?.url ?? undefined
            const liveLink =
                pLinks.find(
                    (l: ProjectLink) =>
                        l.linkType.toUpperCase() === 'LIVE_SITE' ||
                        l.linkType.toUpperCase() === 'DEMO' ||
                        l.linkType.toUpperCase() === 'LIVE'
                )?.url ?? undefined
            return {
                id: p.id,
                name: p.projectName,
                description: p.description ?? '',
                technologies: (p as any).technologies ?? [],
                github: githubLink,
                liveUrl: liveLink,
                bullets,
            }
        })

        // ── 7. Map ShipItHQ platform project submissions ──────────────────────
        const platformProjectsMapped: ResumeProjectEntry[] = projectSubmissions.map((sub: any) => ({
            id: shortId(),
            name: sub.project.title,
            description: sub.project.shortDescription ?? 'Built on ShipItHQ',
            technologies: sub.project.technologies ?? [],
            github: sub.githubUrl ?? undefined,
            liveUrl: sub.liveUrl ?? undefined,
            bullets: ['Built on ShipItHQ'],
        }))

        const projects: ResumeProjectEntry[] = [
            ...portfolioProjectsMapped,
            ...platformProjectsMapped,
        ]

        // ── 8. Map education ──────────────────────────────────────────────────
        const education: ResumeEducationEntry[] = userEdus.map((e) => ({
            id: e.id,
            institution: e.institution,
            degree: e.degree ?? undefined,
            field: undefined,
            startDate: e.startDate?.toISOString() ?? '',
            endDate: e.endDate?.toISOString(),
            bullets: (e as any).bulletPoints ?? [],
        }))

        // ── 9. Map skills ─────────────────────────────────────────────────────
        const skillGroups: ResumeSkillGroup[] = buildSkillGroups(userSkills)

        // ── 10. Map certifications ────────────────────────────────────────────
        const certs: ResumeCertificationEntry[] = userCertifications.map((c) => ({
            id: c.id,
            name: c.name,
            issuer: c.issuer ?? undefined,
            date: c.issuedDate ? c.issuedDate.toISOString().slice(0, 10) : undefined,
            url: c.link ?? undefined,
        }))

        // ── 11. Compose final content ─────────────────────────────────────────
        const mappedContent: ResumeDraftContent = {
            header,
            experience,
            projects,
            education,
            skills: skillGroups,
            certifications: certs,
        }

        // ── 12. Optionally persist to an existing draft ───────────────────────
        if (draftId) {
            // Scoped to the caller. `draftId` arrives from the client, so without
            // the userId predicate this action would overwrite ANY user's resume
            // with the caller's profile data.
            await db.update(resumeDraft)
                .set({ content: JSON.parse(JSON.stringify(mappedContent)) })
                .where(and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, userId)))
        }

        return { success: true, content: mappedContent }
    } catch (err: unknown) {
        console.error('[syncProfileToResumeDraft] error:', err)
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to sync profile data.',
        }
    }
}
