"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import { db, coverLetter as coverLetters, users, skills, workExperiences, portfolioProjects, resumeDraft } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";
import { CoverLetterGenerationData } from "@/types/aitools/cover-letter";
import { startBackgroundJob } from "@/actions/(main)/workers/jobs.action";
import { priceOf } from "@/lib/credits/pricing";
import { scrapeJobDescription } from "@/utils/jobs/extract-job-description";

export async function currentUser(): Promise<{ id: string; name?: string | null; email?: string | null; username?: string | null; image?: string | null } | null | undefined> {
    const session = await getSession(headers());
    return session?.user;
}

export async function extractJobDescription(url: string): Promise<
    | { success: true; description: string; title: string; company: string }
    | { success: false; error: string }
> {
    const user = await currentUser();
    if (!user) {
        // `success: false` must be the LITERAL false, not `boolean`. Without the
        // annotation above, TypeScript widens this object's `success` to
        // `boolean`, the union stops discriminating, and every caller that does
        // `if (result.success) result.description` fails to compile against a
        // function whose behaviour did not change at all.
        return { success: false, error: "Unauthorized" };
    }
    // The scrape itself, its login-wall guard and its cleaners moved to
    // utils/jobs/extract-job-description.ts so Pathfinder's interview-prep
    // generation can use the same one. What stays here is the part that is
    // genuinely this action's job: authentication.
    return scrapeJobDescription(url);
}

// The question shape used to be a zod schema here, handed to OpenAI as a strict
// structured-output format. It moved into `apps/worker/src/jobs/cover-letter-
// questions.ts` as prompt text plus a validator, because `zodResponseFormat` is
// a Node SDK helper and the worker has no Node SDK. Its one hard-won note is
// worth keeping: OpenAI structured outputs do not support `.optional()`, which
// is why `options` was `.nullable()` and why the worker still insists the key is
// present rather than merely allowed.

/**
 * Start question generation on the worker (`cover_letter_questions`, RES-9).
 *
 * Moved for the same reason `generateAndSaveCoverLetter` was, and it should have
 * gone in the same pass: this is the step immediately before it in the same
 * screen. Leaving one inline and one queued gave the user two different waiting
 * experiences one click apart, and only the queued one could refund - a request
 * killed mid-completion leaves nothing running to notice it failed.
 *
 * The instruction and the model are unchanged. The `zodResponseFormat` schema is
 * not: it is an OpenAI Node SDK helper the worker does not have, so the shape
 * moved into the prompt and is validated on the way out instead. That validation
 * is stricter than the schema was in one respect - `options` on a SINGLE question
 * is the field the model actually drops, and a choice with nothing to choose is
 * now downgraded to free text rather than rendered empty.
 *
 * Returns a jobId; `cover-letter-client.tsx` polls it.
 */
export async function generateCoverLetterQuestions(jobDescription: string): Promise<{
    success: boolean
    jobId?: string
    error?: string
    code?: string
    required?: number
    available?: number
}> {
    try {
        const user = await currentUser();
        if (!user?.id) return { success: false, error: "Unauthorized" };

        if (!jobDescription?.trim()) {
            return { success: false, error: "Add the job description first" };
        }

        const started = await startBackgroundJob(
            "cover_letter_questions",
            { jobDescription },
            {
                cost: priceOf("cover_letter_questions"),
                reason: "Cover letter: tailored questions",
            },
        );

        if (!started.success) {
            return {
                success: false,
                error: started.error ?? "Could not start generating questions",
                code: started.code,
                required: started.required,
                available: started.available,
            };
        }

        return { success: true, jobId: started.jobId };
    } catch (e: unknown) {
        console.error("[coverLetter] questions failed:", e);
        return { success: false, error: e instanceof Error ? e.message : "Failed to generate questions." };
    }
}

export async function saveCoverLetterDraft(data: {
    jobUrl: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    tone: string;
    questions: unknown[];
}) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const [draft] = await db.insert(coverLetters).values({
            userId: user.id!,
            jobUrl: data.jobUrl,
            companyName: data.companyName || null,
            jobTitle: data.jobTitle || null,
            jobDescription: data.jobDescription,
            tone: data.tone,
            questions: data.questions as any,
            answers: {} as any,
        }).returning();

        return { success: true, draftId: draft!.id };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to save draft" };
    }
}

/**
 * Flatten a resume draft's stored content into the prompt.
 *
 * Not exported: a `"use server"` module may only export async functions, and
 * this is a pure formatter.
 */
function formatResumeForPrompt(raw: unknown): string {
    if (!raw || typeof raw !== "object") return "";
    const content = raw as {
        header?: { title?: string; summary?: string; location?: string };
        experience?: Array<{ company?: string; role?: string; startDate?: string; endDate?: string; current?: boolean; bullets?: string[] }>;
        projects?: Array<{ name?: string; description?: string; technologies?: string[]; bullets?: string[] }>;
        education?: Array<{ institution?: string; degree?: string; field?: string; endDate?: string }>;
        skills?: Array<{ category?: string; items?: string[] }>;
        certifications?: Array<{ name?: string; issuer?: string }>;
    };

    const out: string[] = [];
    const { header, experience, projects, education, skills: skillGroups, certifications } = content;

    if (header?.title || header?.summary) {
        out.push("From the applicant's resume:");
        if (header.title) out.push(`Current title: ${header.title}`);
        if (header.location) out.push(`Location: ${header.location}`);
        if (header.summary) out.push(`Summary: ${header.summary}`);
        out.push("");
    }

    if (experience?.length) {
        out.push("Resume - Work Experience:");
        for (const e of experience.slice(0, 8)) {
            const end = e.current ? "Present" : (e.endDate ?? "");
            out.push(`- ${e.role ?? ""} at ${e.company ?? ""} (${e.startDate ?? ""} to ${end})`);
            for (const b of (e.bullets ?? []).slice(0, 5)) out.push(`  * ${b}`);
        }
        out.push("");
    }

    if (projects?.length) {
        out.push("Resume - Projects:");
        for (const p of projects.slice(0, 6)) {
            out.push(`- ${p.name ?? ""}${p.technologies?.length ? ` (${p.technologies.join(", ")})` : ""}`);
            if (p.description) out.push(`  ${p.description}`);
            for (const b of (p.bullets ?? []).slice(0, 3)) out.push(`  * ${b}`);
        }
        out.push("");
    }

    if (education?.length) {
        out.push("Resume - Education:");
        for (const e of education.slice(0, 4)) {
            out.push(`- ${e.degree ?? ""}${e.field ? ` in ${e.field}` : ""}, ${e.institution ?? ""}${e.endDate ? ` (${e.endDate})` : ""}`);
        }
        out.push("");
    }

    if (skillGroups?.length) {
        out.push("Resume - Skills:");
        for (const g of skillGroups) out.push(`- ${g.category ?? "Other"}: ${(g.items ?? []).join(", ")}`);
        out.push("");
    }

    if (certifications?.length) {
        out.push("Resume - Certifications:");
        for (const c of certifications.slice(0, 6)) out.push(`- ${c.name ?? ""}${c.issuer ? ` (${c.issuer})` : ""}`);
        out.push("");
    }

    return out.length ? out.join("\n") + "\n" : "";
}

/**
 * Assemble everything the model should know about the applicant.
 *
 * Pulled out of the generator so the composition happens in the app, where the
 * profile tables and the resume live, and the worker receives one finished
 * string. The ORDER is load-bearing and unchanged: hand-entered profile rows
 * first as the confirmed account, the resume last as the fuller one. Whichever
 * of the two the user actually maintains, the letter has something concrete.
 *
 * Not exported - a `"use server"` module may only export async functions, and
 * this is called from one place.
 */
async function buildApplicantProfile(userId: string): Promise<string | null> {
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!dbUser) return null;

    const [userSkills, userExperiences, userProjects, defaultResume] = await Promise.all([
        db.query.skills.findMany({ where: eq(skills.userId, userId) }),
        db.query.workExperiences.findMany({ where: eq(workExperiences.userId, userId), orderBy: [desc(workExperiences.startDate)] }),
        db.query.portfolioProjects.findMany({ where: eq(portfolioProjects.userId, userId), orderBy: [desc(portfolioProjects.startDate)] }),
        // The resume the user marked as default, else their newest. A cover
        // letter written from an empty profile is the single most common way
        // this feature disappoints: most people upload a resume and never
        // re-type its contents into the profile tabs.
        db.query.resumeDraft.findFirst({
            where: eq(resumeDraft.userId, userId),
            orderBy: [desc(resumeDraft.isDefault), desc(resumeDraft.updatedAt)],
        }),
    ]);

    let out = `Name: ${dbUser.name || ''}\nEmail: ${dbUser.email || ''}\n\n`;

    if (userSkills.length > 0) {
        out += "Skills:\n";
        userSkills.forEach((s) => out += `- ${s.name} (${s.level})\n`);
        out += "\n";
    }

    if (userExperiences.length > 0) {
        out += "Work Experience:\n";
        userExperiences.forEach((e) => {
            out += `- ${e.roleTitle} at ${e.companyName} (${e.startDate} to ${e.isCurrentlyWorking ? 'Present' : e.endDate ?? ''})\n`;
            if (e.bulletPoints && (e.bulletPoints as string[]).length > 0) {
                (e.bulletPoints as string[]).forEach((b) => out += `  * ${b}\n`);
            }
        });
        out += "\n";
    }

    if (userProjects.length > 0) {
        out += "Projects:\n";
        userProjects.forEach((p) => {
            out += `- ${p.projectName} (${(p.technologies as string[]).join(', ')})\n`;
            if (p.bulletPoints && (p.bulletPoints as string[]).length > 0) {
                (p.bulletPoints as string[]).forEach((b) => out += `  * ${b}\n`);
            }
        });
        out += "\n";
    }

    out += formatResumeForPrompt(defaultResume?.content);
    return out;
}

/**
 * Start cover letter generation on the worker.
 *
 * This was an inline `gpt-4o` completion over a whole job description plus a
 * whole profile - one of the longest calls in the product, on a request
 * Cloudflare kills before a long letter finishes. The user watched a spinner
 * until it did.
 *
 * The prompt, the model and the temperature are UNCHANGED; only where the call
 * runs has moved.
 *
 * Credits move with it. `withCredits` settled or refunded around the inline
 * call; the hold is now taken by `startBackgroundJob` and settled or released by
 * `getBackgroundJobStatus` when the app first sees a terminal status. Same
 * `cover_letter_generate` price, same one place that decides
 * (`lib/credits/hold.ts`), and a job that dies mid-flight now refunds - which the
 * inline version could not do, because nothing was left running to notice.
 *
 * Returns a `jobId`; the client polls it and renders when it completes.
 */
export async function generateAndSaveCoverLetter(data: CoverLetterGenerationData): Promise<{
    success: boolean
    coverLetterId?: string
    jobId?: string
    error?: string
    code?: string
    required?: number
    available?: number
}> {
    try {
        const user = await currentUser();
        if (!user?.id) return { success: false, error: "Unauthorized" };

        if (!data.jobDescription?.trim()) {
            return { success: false, error: "Add the job description first" };
        }

        const applicantProfile = await buildApplicantProfile(user.id);
        if (applicantProfile === null) return { success: false, error: "User not found" };

        // The row exists before the job so the client has something to poll and
        // to open, exactly as with every other job type.
        let coverLetterId: string;
        if (data.draftId) {
            const [updated] = await db.update(coverLetters)
                .set({
                    jobUrl: data.jobUrl || null,
                    companyName: data.companyName,
                    jobTitle: data.jobTitle,
                    jobDescription: data.jobDescription,
                    tone: data.tone,
                    questions: data.questions as unknown as object,
                    answers: data.answers as unknown as object,
                })
                .where(and(eq(coverLetters.id, data.draftId), eq(coverLetters.userId, user.id)))
                .returning({ id: coverLetters.id });
            if (!updated) return { success: false, error: "That draft was not found" };
            coverLetterId = updated.id;
        } else {
            const [created] = await db.insert(coverLetters).values({
                userId: user.id,
                jobUrl: data.jobUrl || null,
                companyName: data.companyName,
                jobTitle: data.jobTitle,
                jobDescription: data.jobDescription,
                tone: data.tone,
                questions: data.questions as unknown as object,
                answers: data.answers as unknown as object,
            }).returning({ id: coverLetters.id });
            if (!created) return { success: false, error: "Could not create the cover letter" };
            coverLetterId = created.id;
        }

        const started = await startBackgroundJob(
            "cover_letter",
            { coverLetterId, applicantProfile },
            {
                cost: priceOf("cover_letter_generate"),
                reason: `Cover letter: ${data.jobTitle || "generation"}`,
            },
        );

        if (!started.success) {
            return {
                success: false,
                coverLetterId,
                error: started.error ?? "Could not start generation",
                code: started.code,
                required: started.required,
                available: started.available,
            };
        }

        return { success: true, coverLetterId, jobId: started.jobId };
    } catch (e: unknown) {
        console.error("[coverLetter] generate failed:", e);
        return { success: false, error: e instanceof Error ? e.message : "Failed to generate cover letter." };
    }
}

export async function getCoverLetters() {
    try {
        const user = await currentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const letters = await db.query.coverLetter.findMany({
            where: eq(coverLetters.userId, user.id!),
            orderBy: [desc(coverLetters.createdAt)],
            columns: {
                id: true,
                companyName: true,
                jobTitle: true,
                createdAt: true,
                generatedContent: true,
            },
        });

        return {
            success: true,
            coverLetters: letters.map(l => ({
                id: l.id,
                companyName: l.companyName,
                jobTitle: l.jobTitle,
                createdAt: l.createdAt,
                isDraft: !l.generatedContent,
            }))
        };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to get cover letters" };
    }
}

export async function getCoverLetter(id: string) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const letter = await db.query.coverLetter.findFirst({
            where: and(eq(coverLetters.id, id), eq(coverLetters.userId, user.id!)),
        });

        if (!letter) return { success: false, error: "Not found" };

        return { success: true, coverLetter: letter };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to get cover letter" };
    }
}

export async function deleteCoverLetter(id: string) {
    try {
        const user = await currentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        await db.delete(coverLetters)
            .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, user.id!)));

        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
}
