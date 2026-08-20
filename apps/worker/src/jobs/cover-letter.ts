import { and, eq } from "drizzle-orm"
import { renderResumeText } from "@repo/db/resume"
import type { RunnableJobType } from "../env"
import { schema } from "../db"
import { chatText } from "../openai"
import { JobDurableObject, type ProgressFn, type StoredJob } from "./base"

const { coverLetter, resumeDraft } = schema

/**
 * Cover letter generation, moved off
 * `cover-letter.action.ts:generateAndSaveCoverLetter`.
 *
 * One change beyond moving it, and it is the reason this was worth doing:
 * **the letter is now written from the user's resume.**
 *
 * The inline version assembled an "applicant profile" out of the raw profile
 * tables - skills, work_experience, portfolio_project - while the user's actual
 * resume said something else. So the letter could contradict the document it was
 * stapled to, and it discarded every editorial decision the user had made in the
 * resume builder: which jobs to lead with, which bullets to keep, how to describe
 * themselves. A cover letter that disagrees with the resume is worse than no cover
 * letter.
 *
 * The resume text is resolved by the APP (see `lib/resume/primary.ts`) and passed
 * in, so what the letter is written from is exactly what the user was shown before
 * they pressed generate. Where a structured draft was the source, this job re-reads
 * it by id instead, so an edit made between dispatch and the alarm is picked up.
 *
 * Tone, structure instructions and the model (`gpt-4o`, temperature 0.7) are
 * unchanged from the inline version.
 */

interface CoverLetterInput {
    coverLetterId: string
    /** Set when the resume came from a `resume_draft`; re-read for freshness. */
    resumeDraftId?: string | null
    /** The resolved rendering, used when there is no structured draft behind it. */
    resumeText: string
    /** How the resume was resolved, recorded in the result for the UI. */
    resumeSource: string
}

interface StoredQuestion {
    id: string
    text: string
}

export class CoverLetter extends JobDurableObject<CoverLetterInput> {
    protected readonly jobType: RunnableJobType = "cover_letter"
    protected override get initialPhaseLabel() {
        return "Reading the job description"
    }

    protected async run(job: StoredJob<CoverLetterInput>, progress: ProgressFn): Promise<unknown> {
        const db = this.db()
        const { coverLetterId, resumeDraftId } = job.input

        // Scoped to the job's userId, which came from the signed token.
        const letter = await db.query.coverLetter.findFirst({
            where: and(eq(coverLetter.id, coverLetterId), eq(coverLetter.userId, job.userId)),
        })
        if (!letter) throw new Error("This cover letter no longer exists")
        if (!letter.jobDescription?.trim()) throw new Error("This cover letter has no job description to work from")

        // Prefer the live draft over the snapshot the app sent: minutes can pass
        // before this alarm fires, and if the user fixed a typo in their resume in
        // between, the letter should use the fix.
        let resumeText = job.input.resumeText
        if (resumeDraftId) {
            const draft = await db.query.resumeDraft.findFirst({
                where: and(eq(resumeDraft.id, resumeDraftId), eq(resumeDraft.userId, job.userId)),
            })
            if (draft) resumeText = renderResumeText(draft.content)
        }
        if (!resumeText.trim()) {
            throw new Error("Add a resume or fill in your profile first - there is nothing to write from")
        }

        await progress(35, "Writing your letter")

        const questions = (letter.questions ?? []) as StoredQuestion[]
        const answers = (letter.answers ?? {}) as Record<string, string | string[]>

        let qaStr = ""
        if (Array.isArray(questions) && questions.length) {
            qaStr = "Applicant Responses to Targeted Questions:\n"
            for (const q of questions) {
                const a = answers[q.id]
                const answer = Array.isArray(a) ? a.join(", ") : (a || "No answer provided.")
                qaStr += `Q: ${q.text}\nA: ${answer}\n\n`
            }
        }

        const prompt = `
            You are an expert career coach writing a highly compelling, professional, yet personalized cover letter.
            Write a cover letter using markdown format.

            Context:
            Job Title: ${letter.jobTitle ?? ""}
            Company: ${letter.companyName ?? ""}
            Tone: ${letter.tone ?? "Professional"}

            Job Description:
            ${letter.jobDescription}

            Applicant Resume:
            ${resumeText}

            ${qaStr}

            Instructions:
            1. Do not include placeholders like "[Your Name]" if possible, use the applicant resume.
            2. Structure it well: header, greeting, strong opening, well-articulated body paragraphs highlighting specific relevant achievements based on the applicant resume and their answers, and a call-to-action closing.
            3. Be concise (max 3-4 paragraphs) and directly map the applicant's experience to the specific needs found in the job description.
            4. Include relevant links (e.g. to projects) if they are in the resume or answers.
            5. Every claim must be supported by the resume. Do NOT invent employers, titles, dates, metrics or skills - if the job asks for something the resume does not show, do not claim it.
            6. Return ONLY markdown content. No preamble.
            `

        const generatedContent = await chatText({
            apiKey: this.env.OPENAI_API_KEY,
            model: "gpt-4o",
            system: "You are an expert copywriter and career coach.",
            user: prompt,
            temperature: 0.7,
        })

        if (!generatedContent.trim()) throw new Error("The model returned an empty letter")

        await progress(90, "Saving")

        await db
            .update(coverLetter)
            .set({ generatedContent, resumeDraftId: resumeDraftId ?? null })
            .where(eq(coverLetter.id, coverLetterId))

        return {
            coverLetterId,
            resumeSource: job.input.resumeSource,
            resumeDraftId: resumeDraftId ?? null,
            // The letter itself is persisted on the row; returning it here too lets
            // the client render the moment the poll completes, without a second
            // round trip.
            content: generatedContent,
        }
    }
}
