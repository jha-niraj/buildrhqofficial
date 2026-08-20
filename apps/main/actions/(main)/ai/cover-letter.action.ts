"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import { db, coverLetter as coverLetters, users, skills, workExperiences, portfolioProjects, resumeDraft } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";
import Exa from "exa-js";
import { openai, zodResponseFormat } from '@/lib/openai-client'
import { z } from "zod";
import { CoverLetterGenerationData } from "@/types/aitools/cover-letter";
import { startBackgroundJob } from "@/actions/(main)/workers/jobs.action";
import { priceOf } from "@/lib/credits/pricing";
import { withCredits, OperationFailed } from "@/lib/credits/charge";

// ── Exa client (lazy singleton) ──────────────────────────────────────────────
let _exa: Exa | null = null
const exa = new Proxy({} as Exa, {
    get(_, prop) {
        if (!_exa) _exa = new Exa(process.env.EXA_API_KEY!)
        return Reflect.get(_exa, prop)
    }
})

export async function currentUser(): Promise<{ id: string; name?: string | null; email?: string | null; username?: string | null; image?: string | null } | null | undefined> {
    const session = await getSession(headers());
    return session?.user;
}

export async function extractJobDescription(url: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const result = await exa.getContents([url], {
            text: true,
            livecrawlTimeout: 8000,
        })

        if (!result?.results?.length) {
            return { success: false, error: "Failed to extract job description. Try pasting it manually." };
        }

        const firstResult = result.results[0]
        const jd = firstResult?.text?.trim() || ""
        const title = firstResult?.title || ""

        if (!jd) {
            return { success: false, error: "Extracted content was empty. Try pasting the job description manually." };
        }

        return { success: true, description: jd, title }
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to extract job description." };
    }
}

// NOTE: OpenAI structured outputs do not support .optional() - use .nullable() instead.
const QuestionsSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        text: z.string(),
        type: z.enum(["TEXTAREA", "SINGLE", "MULTIPLE"]),
        options: z.array(z.string()).nullable(), // null for TEXTAREA, array for SINGLE/MULTIPLE
    }))
});

export async function generateCoverLetterQuestions(jobDescription: string) {
    try {
        const user = await currentUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const charged = await withCredits(
            { userId: user.id!, operation: "cover_letter_questions", reason: "Cover letter: tailored questions" },
            async () => {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert technical recruiter and career coach. Review the provided Job Description and generate 3 to 5 targeted questions for the applicant. These questions should help customize their cover letter based on specific job requirements. The questions should ask for specific metrics, examples of experience with required tools, or how their past work aligns with core responsibilities.

IMPORTANT: Always include the "options" field in every question. Set it to null for TEXTAREA questions and to an array of 3-4 choices for SINGLE or MULTIPLE questions. Never omit the field.`
                        },
                        {
                            role: "user",
                            content: `Job Description:\n\n${jobDescription}`
                        }
                    ],
                    response_format: zodResponseFormat(QuestionsSchema, "questions_schema"),
                });

                const content = completion.choices[0]?.message?.content;
                // No questions is a failed generation, not an empty result. Both a
                // missing completion and output that will not parse mean the user
                // has nothing to answer, so both refund rather than returning [].
                if (!content) throw new OperationFailed("The question generator returned nothing.");

                let questions: unknown[] = [];
                try {
                    questions = JSON.parse(content).questions ?? [];
                } catch {
                    throw new OperationFailed("Could not read the generated questions.");
                }
                if (!questions.length) throw new OperationFailed("No questions could be generated from that job description.");
                return questions;
            },
        );

        if (!charged.success) {
            return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available };
        }
        return { success: true, questions: charged.data };
    } catch (e: unknown) {
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
