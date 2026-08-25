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
// Helper: merge profile data into an existing draft without destroying edits
//
// Header fields are per-resume: somebody tailors a job title or rewrites a
// summary for one application, and a sync must not undo that. So anything
// already filled in wins, and the profile only supplies what is blank.
//
// The list sections are the user's history, so a non-empty profile list does
// replace the draft's - that IS what syncing a new job into a resume means.
// But an EMPTY profile list never replaces anything: a user with no work
// experience recorded on their profile must not lose the roles they typed
// straight into the resume.
// ─────────────────────────────────────────────────────────────────────────────
function mergeProfileInto(prev: ResumeDraftContent, next: ResumeDraftContent): ResumeDraftContent {
    /** What the user typed wins; the profile fills the blank. Whitespace is blank. */
    const keep = (mine: string | null | undefined, fromProfile: string | null | undefined) => {
        const typed = (mine ?? '').trim()
        return typed.length ? (mine as string) : (fromProfile ?? undefined)
    }
    /** A list from the profile replaces one in the draft only if it has something in it. */
    const preferFull = <T,>(fromProfile: T[] | undefined, mine: T[] | undefined): T[] =>
        fromProfile && fromProfile.length ? fromProfile : (mine ?? [])

    const mine = prev.header ?? ({} as ResumeDraftContent['header'])
    return {
        header: {
            name: keep(mine.name, next.header.name) ?? '',
            email: keep(mine.email, next.header.email) ?? '',
            title: keep(mine.title, next.header.title) ?? '',
            summary: keep(mine.summary, next.header.summary) ?? '',
            phone: keep(mine.phone, next.header.phone),
            location: keep(mine.location, next.header.location),
            website: keep(mine.website, next.header.website),
            github: keep(mine.github, next.header.github),
            linkedin: keep(mine.linkedin, next.header.linkedin),
            portfolio: keep(mine.portfolio, next.header.portfolio),
        },
        experience: preferFull(next.experience, prev.experience),
        projects: preferFull(next.projects, prev.projects),
        education: preferFull(next.education, prev.education),
        skills: preferFull(next.skills, prev.skills),
        certifications: preferFull(next.certifications, prev.certifications),
    }
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
            // `users.phone` and `users.location` are real columns and always have been.
            // These two were hard-coded to `undefined`, which meant a sync could never
            // fill them in - and because the result replaced the draft wholesale, every
            // sync also DELETED whatever the user had typed into them by hand.
            phone: toOptionalString(user.phone),
            location: toOptionalString(user.location),
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

        // ── 12. Merge into the existing draft, and persist ────────────────────
        //
        // This used to assign `mappedContent` straight over the draft's content. The
        // button says "Auto-fill from your ShipItHQ profile", but what it did was
        // discard the resume and rebuild it from the profile - so a phone number, a
        // tailored job title, a hand-written summary or a bullet the user had edited
        // were all gone, with no warning and no undo. If the profile had no work
        // experience, three hand-typed roles were replaced with `[]`.
        //
        // `mergeProfileInto` fills the gaps and leaves everything else alone. The one
        // rule it enforces is that a sync must never turn something into nothing.
        let finalContent = mappedContent

        if (draftId) {
            // Scoped to the caller. `draftId` arrives from the client, so without
            // the userId predicate this action would overwrite ANY user's resume
            // with the caller's profile data.
            const existing = await db.query.resumeDraft.findFirst({
                where: and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, userId)),
                columns: { content: true },
            })
            if (!existing) return { success: false, error: 'Draft not found.' }

            const previous = existing.content as unknown as ResumeDraftContent | null
            finalContent = previous ? mergeProfileInto(previous, mappedContent) : mappedContent

            await db.update(resumeDraft)
                .set({ content: JSON.parse(JSON.stringify(finalContent)) })
                .where(and(eq(resumeDraft.id, draftId), eq(resumeDraft.userId, userId)))
        }

        return { success: true, content: finalContent }
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
