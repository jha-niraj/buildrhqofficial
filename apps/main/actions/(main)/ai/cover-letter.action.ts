"use server";

import { getSession } from "@repo/auth";
import { headers } from "next/headers";
import { db, coverLetter as coverLetters, users, skills, workExperiences, portfolioProjects, resumeDraft } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";
import Exa from "exa-js";
import { CoverLetterGenerationData } from "@/types/aitools/cover-letter";
import { startBackgroundJob } from "@/actions/(main)/workers/jobs.action";
import { priceOf } from "@/lib/credits/pricing";

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

/**
 * What a scrape has to clear before it counts as a job description.
 *
 * ── The failure this exists to catch ──
 *
 * Exa fetched a LinkedIn jobs URL and got back LinkedIn's LOGIN PAGE:
 *
 *     "LinkedIn Login, Sign in | LinkedIn  # Sign in  Stay updated on your
 *      professional world.  Show"
 *
 * That is not empty, so the only check here - `if (!jd)` - passed, the action returned
 * `success: true`, and the login wall was pasted into the job-description box. The user
 * then had a Tailor button offering to spend 20 credits rewriting their resume against
 * the words "Sign in".
 *
 * A wall is the NORMAL outcome for LinkedIn, Glassdoor and Indeed, which all serve one to
 * anything without a session. So this is the common path, not an edge case, and it has to
 * fail loudly and say what to do instead.
 */
const WALL_MARKERS = [
    "sign in", "signin", "log in", "login", "join now", "create an account",
    "enable javascript", "captcha", "are you a robot", "access denied",
    "verify you are human", "please enable cookies", "403 forbidden",
]

/** Real postings are long. Most walls we had seen were a few hundred characters. */
const MIN_JD_CHARS = 400

/**
 * Wall text that identifies itself in the OPENING of the document, in any of the
 * languages LinkedIn serves it in.
 *
 * Two things this fixes, found 2026-08-27 by fetching a real LinkedIn job URL:
 *
 * 1. **A long wall was never checked at all.** The body-marker test below only ran
 *    when the text was under `MIN_JD_CHARS`, on the assumption above that walls are
 *    short. LinkedIn returned **4,357 characters** of sign-in wall, sailed past the
 *    length gate, had no marker in its `<title>` (LinkedIn serves the real role name
 *    there even on the wall), and was handed back as a job description with
 *    "Job description pulled in - check it before tailoring".
 * 2. **The markers were English-only.** What came back was Dutch - "Akkoord en lid
 *    worden van LinkedIn", "Door op Doorgaan te klikken om deel te nemen of u aan te
 *    melden". Not one English marker matched. Exa serves whatever localisation the
 *    edge decides, so the language of the wall is not ours to predict.
 *
 * Matched against the OPENING only, not the whole body, and that is deliberate: a
 * real posting can legitimately say "sign in to our portal" somewhere in the middle,
 * and rejecting it would be worse than the bug. No real posting OPENS by asking you
 * to agree to a user agreement and join.
 */
const WALL_OPENERS: RegExp[] = [
    // English
    /agree\s*&?\s*join linkedin/i,
    /by clicking continue to join or sign in/i,
    /join linkedin to (see|view|apply)/i,
    // Dutch - the one actually observed
    /akkoord en lid worden van linkedin/i,
    /door op doorgaan te klikken om deel te nemen of u aan te melden/i,
    // German
    /stimmen sie zu und treten sie linkedin bei/i,
    // French
    /accepter et rejoindre linkedin/i,
    // Spanish / Portuguese
    /aceptar y unirse a linkedin/i,
    /concordar e ingressar no linkedin/i,
    // Structural, language-independent: LinkedIn's wall always names its own
    // agreement documents together, and a job posting never does.
    /(user agreement|gebruikersovereenkomst|nutzungsvereinbarung|contrat d.utilisateur)[\s\S]{0,120}(privacy policy|privacybeleid|datenschutzrichtlinie|politique de confidentialit)/i,
]

/** How much of the front of the document counts as "the opening". */
const WALL_OPENER_WINDOW = 400

function wallReason(text: string, title: string, url: string): string | null {
    const body = text.toLowerCase()
    const head = title.toLowerCase()

    // A LinkedIn SEARCH url is the wrong page even with a session - it lists jobs, it is
    // not one. Worth its own message because it is the URL people actually copy.
    if (/linkedin\.com\/jobs\/(search|search-results|collections)/i.test(url)) {
        return "That is a LinkedIn search page, not a single posting. Open the job itself - the URL looks like linkedin.com/jobs/view/1234567890 - or paste the description below."
    }

    // Checked BEFORE the length gate and regardless of length - a wall that is long
    // is still a wall, and that is exactly what slipped through before.
    if (WALL_OPENERS.some(re => re.test(text.slice(0, WALL_OPENER_WINDOW)))) {
        return "That page returned its sign-in wall rather than the posting - LinkedIn serves one to readers that are not signed in. Open the job yourself and paste the description below."
    }

    if (body.length < MIN_JD_CHARS) {
        const marker = WALL_MARKERS.find(m => body.includes(m) || head.includes(m))
        if (marker) {
            return "That page asked us to sign in, so we only got its login screen. Sites like LinkedIn, Glassdoor and Indeed block automated readers - open the posting yourself and paste the description below."
        }
        return `We only got ${body.length} characters back, which is too short to be a job description. Paste it below instead.`
    }

    // Long but still a wall: a marker in the TITLE is the giveaway, because a real
    // posting's title is the role.
    if (WALL_MARKERS.some(m => head.includes(m))) {
        return "That page returned its sign-in screen rather than the posting. Paste the description below instead."
    }
    return null
}

/**
 * Strip a job board's own furniture off a scraped page.
 *
 * ── The failure this exists to catch ──
 *
 * The wall check now lets a real LinkedIn posting through, and what comes back is the whole
 * PAGE: the posting itself, then "Similar jobs" with twenty-five other listings, then
 * "People also viewed", then twenty-five "Similar Searches" links, then a footer. On the
 * reported fetch the actual advert was about a tenth of the text.
 *
 * That text is not just untidy - it is the INPUT to gpt-4o for both ATS scoring and
 * tailoring, and both are priced. Scoring a resume against twenty-five unrelated adverts is
 * what returned 0/100 with "missing keywords" like "based in Bangalore", "immediate
 * joiners" and "2 to 6 years of experience": recruiter boilerplate and other companies'
 * roles, none of which belongs on anyone's resume. The user was being charged 5 credits for
 * an answer computed from noise, and offered a 20-credit rewrite against the same noise.
 *
 * ── How it cuts ──
 *
 * Everything from the first TRAILER marker onward is dropped: those headings only ever
 * appear after the advert has ended. Whole-line chrome goes, inline fragments like
 * "Over 200 applicants" are removed from otherwise-real lines, and the role and company
 * headings that LinkedIn repeats three times are de-duplicated.
 *
 * Conservative by design: an unrecognised layout keeps its text. Losing part of a real
 * posting is worse than leaving some boilerplate in, because the user can see and delete
 * boilerplate but cannot restore a requirement that was silently cut.
 */
const JD_TRAILERS = [
    "similar jobs", "people also viewed", "similar searches", "explore top content",
    "referrals increase your chances", "get notified about new", "sign in to create job alert",
    "show more jobs like this", "more searches", "related jobs", "recommended for you",
    "jobs you may be interested in", "you may also like", "set alert for similar jobs",
]

/** Whole lines that are chrome wherever they appear. Tested AFTER the markdown marker is stripped. */
const JD_NOISE_LINES = [
    /^agree & join linkedin$/i, /^by clicking continue to join or sign in/i,
    /^apply$/i, /^easy apply$/i, /^save$/i, /^show more show less$/i,
    /^show more$/i, /^show less$/i, /^see who you know$/i, /^sign in$/i,
    /^join now$/i, /^continue$/i, /^\d+ (days?|weeks?|months?|hours?) ago$/i,
    /^over \d+ applicants$/i,
    /^(seniority level|employment type|job function|industries|base pay range|benefits found in job post)$/i,
]

/** Fragments that ride along inside a line that is otherwise worth keeping. */
const JD_NOISE_INLINE = [
    /\bsee who .{0,60}? has hired for this role\b/gi,
    /\bover \d+ applicants\b/gi,
    /\b\d+ (days?|weeks?|months?|hours?) ago\b/gi,
    /\bshow more show less\b/gi,
]

function cleanJobDescription(text: string, pageTitle: string): string {
    const titleBare = pageTitle.trim().toLowerCase()
    const out: string[] = []

    for (const line of text.split("\n")) {
        let t = line.trim()
        const bare = t.replace(/^#{1,6}\s*/, "").replace(/^[-*]\s+/, "").trim()
        const low = bare.toLowerCase()

        if (JD_TRAILERS.some(m => low === m || low.startsWith(m))) break
        if (!t) { if (out.length && out[out.length - 1] !== "") out.push(""); continue }
        if (JD_NOISE_LINES.some(re => re.test(bare))) continue
        // The page <title>, which Exa also emits as the first body line.
        if (titleBare && low === titleBare) continue

        for (const re of JD_NOISE_INLINE) t = t.replace(re, " ")
        t = t.replace(/\s{2,}/g, " ").trim()
        if (!t || t.replace(/^#{1,6}\s*/, "").trim() === "") continue
        out.push(t)
    }

    // LinkedIn prints the role and the company as headings three times over. Keep the first.
    const seen = new Set<string>()
    const kept: string[] = []
    for (const l of out) {
        const bare = l.replace(/^#{1,6}\s*/, "").trim().toLowerCase()
        if (bare && bare.length < 140 && seen.has(bare)) continue
        if (bare) seen.add(bare)
        kept.push(l)
    }
    return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/**
 * The ROLE, out of a page title.
 *
 * `res.title` was being written straight into the Job Title field, so it read
 * "Founding Backend Engineer at Mopid <emdash> Bengaluru, Karnataka, India | LinkedIn Jobs" -
 * and that whole string was then sent to the tailoring model as the job being applied for.
 *
 * The dash class is written with escapes on purpose: an em or en dash is banned in this
 * codebase's source, but scraped titles are full of them and the pattern has to match one.
 */
function cleanJobTitle(raw: string): string {
    let t = (raw ?? "").trim()
    t = t.replace(/\s*[|·]\s*(linkedin|indeed|glassdoor|wellfound|naukri|ziprecruiter)[^|]*$/i, "")
    t = t.split(/\s+[\u2014\u2013-]\s+/)[0] ?? t   // " - Bengaluru, Karnataka, India"
    t = t.split(/\s+\bat\b\s+/i)[0] ?? t           // " at Mopid"
    t = t.replace(/\s*[|·]\s*.*$/, "")
    return t.trim().slice(0, 120)
}

/** The COMPANY, if the title says "<role> at <company>". */
function companyFromTitle(raw: string): string {
    const m = /\s+\bat\b\s+([^|\u2014\u2013]+)/i.exec(raw ?? "")
    if (!m?.[1]) return ""
    return (m[1].split(/\s+[\u2014\u2013-]\s+/)[0] ?? "").trim().slice(0, 80)
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

        // Refuse a wall rather than handing it back as a description. Returning it would
        // put a login page in front of a 20-credit Tailor button.
        const reason = wallReason(jd, title, url)
        if (reason) return { success: false, error: reason }

        // Strip the board's own furniture. What is left is what gets priced.
        const description = cleanJobDescription(jd, title)
        if (description.length < 200) {
            // Cleaning took almost everything, which means the layout was not what it looked
            // like. Hand back the raw text rather than a stub - the user can edit it.
            return { success: true, description: jd, title: cleanJobTitle(title), company: companyFromTitle(title) }
        }

        return {
            success: true,
            description,
            title: cleanJobTitle(title),
            company: companyFromTitle(title),
        }
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to extract job description." };
    }
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
