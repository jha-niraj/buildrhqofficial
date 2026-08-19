"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import { db, coverLetter as coverLetters, users, skills, workExperiences, portfolioProjects, resumeDraft } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";
import Exa from "exa-js";
import { openai, zodResponseFormat } from '@/lib/openai-client'
import { z } from "zod";
import { CoverLetterGenerationData } from "@/types/aitools/cover-letter";
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

export async function generateAndSaveCoverLetter(data: CoverLetterGenerationData) {
    try {
        const user = await currentUser();
        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Fetch User profile
        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id!),
        });

        if (!dbUser) {
            return { success: false, error: "User not found" };
        }

        const [userSkills, userExperiences, userProjects, defaultResume] = await Promise.all([
            db.query.skills.findMany({ where: eq(skills.userId, user.id!) }),
            db.query.workExperiences.findMany({ where: eq(workExperiences.userId, user.id!), orderBy: [desc(workExperiences.startDate)] }),
            db.query.portfolioProjects.findMany({ where: eq(portfolioProjects.userId, user.id!), orderBy: [desc(portfolioProjects.startDate)] }),
            // The resume the user marked as default, else their newest. A cover
            // letter written from an empty profile is the single most common way
            // this feature disappoints: most people upload a resume and never
            // re-type its contents into the profile tabs.
            db.query.resumeDraft.findFirst({
                where: eq(resumeDraft.userId, user.id!),
                orderBy: [desc(resumeDraft.isDefault), desc(resumeDraft.updatedAt)],
            }),
        ]);

        // Format user info
        let userInfoStr = `Name: ${dbUser.name || ''}\nEmail: ${dbUser.email || ''}\n\n`;

        if (userSkills.length > 0) {
            userInfoStr += "Skills:\n";
            userSkills.forEach((s) => userInfoStr += `- ${s.name} (${s.level})\n`);
            userInfoStr += "\n";
        }

        if (userExperiences.length > 0) {
            userInfoStr += "Work Experience:\n";
            userExperiences.forEach((e) => {
                userInfoStr += `- ${e.roleTitle} at ${e.companyName} (${e.startDate} to ${e.isCurrentlyWorking ? 'Present' : e.endDate ?? ''})\n`;
                if (e.bulletPoints && (e.bulletPoints as string[]).length > 0) {
                    (e.bulletPoints as string[]).forEach((b) => userInfoStr += `  * ${b}\n`);
                }
            });
            userInfoStr += "\n";
        }

        if (userProjects.length > 0) {
            userInfoStr += "Projects:\n";
            userProjects.forEach((p) => {
                userInfoStr += `- ${p.projectName} (${(p.technologies as string[]).join(', ')})\n`;
                if (p.bulletPoints && (p.bulletPoints as string[]).length > 0) {
                    (p.bulletPoints as string[]).forEach((b) => userInfoStr += `  * ${b}\n`);
                }
            });
            userInfoStr += "\n";
        }

        // The resume goes in last so the model reads it as the fuller account and
        // the hand-entered profile rows above as the confirmed one. Whichever the
        // user maintains, the letter has something concrete to work from.
        userInfoStr += formatResumeForPrompt(defaultResume?.content);

        // Format Q&A
        let qaStr = "Applicant Responses to Targeted Questions:\n";
        data.questions.forEach((q: any) => {
            let answer = data.answers[q.id] || "No answer provided.";
            if (Array.isArray(answer)) {
                answer = answer.join(", ");
            }
            qaStr += `Q: ${q.text}\nA: ${answer}\n\n`;
        });

        const prompt = `
            You are an expert career coach writing a highly compelling, professional, yet personalized cover letter.
            Write a cover letter using markdown format.

            Context:
            Job Title: ${data.jobTitle}
            Company: ${data.companyName}
            Tone: ${data.tone}

            Job Description:
            ${data.jobDescription}

            Applicant Profile:
            ${userInfoStr}

            ${qaStr}

            Instructions:
            1. Do not include placeholders like "[Your Name]" if possible, use the applicant profile.
            2. Structure it well: header, greeting, strong opening, well-articulated body paragraphs highlighting specific relevant achievements based on the applicant profile and their answers, and a call-to-action closing.
            3. Be concise (max 3-4 paragraphs) and directly map the applicant's experience to the specific needs found in the job description.
            4. Include relevant links (e.g. to projects) if they are in the profile or answers.
            5. Return ONLY markdown content. No preamble.
            `;

        // Only the model call is inside the hold. The letter is returned to the
        // user in this response, so a later failure to SAVE it must not refund -
        // they received what they paid for, and refunding delivered work would
        // make the letter free on every retry.
        const charged = await withCredits(
            { userId: user.id!, operation: "cover_letter_generate", reason: `Cover letter: ${data.jobTitle || "generation"}` },
            async () => {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert copywriter and career coach."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                });

                const text = completion?.choices?.[0]?.message?.content?.trim() || "";
                // A completion can succeed with empty content. Keeping the charge
                // for a blank letter is exactly the failure holds exist to stop.
                if (!text) throw new OperationFailed("The cover letter came back empty.");
                return text;
            },
        );

        if (!charged.success) {
            return { success: false, error: charged.error, code: charged.code, required: charged.required, available: charged.available };
        }
        const generatedContent = charged.data;

        // Save to DB - update draft if draftId provided, otherwise create new
        let letter;
        if (data.draftId) {
            const [updated] = await db.update(coverLetters)
                .set({
                    answers: data.answers as any,
                    generatedContent,
                })
                .where(and(eq(coverLetters.id, data.draftId), eq(coverLetters.userId, user.id!)))
                .returning();
            letter = updated!;
        } else {
            const [created] = await db.insert(coverLetters).values({
                userId: user.id!,
                jobUrl: data.jobUrl,
                companyName: data.companyName,
                jobTitle: data.jobTitle,
                jobDescription: data.jobDescription,
                tone: data.tone,
                questions: data.questions as any,
                answers: data.answers as any,
                generatedContent,
            }).returning();
            letter = created!;
        }

        return { success: true, coverLetterId: letter.id, content: generatedContent };

    } catch (e: unknown) {
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
