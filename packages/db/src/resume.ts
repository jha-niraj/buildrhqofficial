// ─────────────────────────────────────────────────────────────────────────────
// The shape of `resume_draft.content`, and how to render it as text.
//
// This lives in @repo/db rather than in an app because BOTH apps/main and
// apps/worker read and write that column. The column is jsonb, so the database
// enforces nothing about its shape - this file is the only contract there is, and
// a copy of it in each consumer is a copy that will drift.
//
// `renderResumeText` is here for the same reason. The app renders a resume to text
// to show the user what a prompt will see; the worker renders it to build that
// prompt. If those two produced different text, the preview would be a lie.
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumeHeader {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    title?: string;
    summary?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
}

export interface ResumeExperienceEntry {
    id: string;
    company: string;
    /** The company's official site. OPTIONAL: every draft written before this
     *  field existed lacks it, and apps/worker reads the same jsonb column. */
    companyUrl?: string;
    role: string;
    location?: string;
    /** ISO date string. */
    startDate: string;
    endDate?: string;
    current: boolean;
    bullets: string[];
}

export interface ResumeProjectEntry {
    id: string;
    name: string;
    description?: string;
    technologies: string[];
    github?: string;
    liveUrl?: string;
    bullets: string[];
}

export interface ResumeEducationEntry {
    id: string;
    institution: string;
    degree?: string;
    field?: string;
    startDate: string;
    endDate?: string;
    bullets: string[];
}

export interface ResumeSkillGroup {
    category: string;
    items: string[];
}

export interface ResumeCertificationEntry {
    id: string;
    name: string;
    issuer?: string;
    date?: string;
    url?: string;
}

export interface ResumeDraftContent {
    header: ResumeHeader;
    experience: ResumeExperienceEntry[];
    projects: ResumeProjectEntry[];
    education: ResumeEducationEntry[];
    skills: ResumeSkillGroup[];
    certifications: ResumeCertificationEntry[];
}

/** Blank content, to start a new resume. */
export function emptyResumeDraftContent(): ResumeDraftContent {
    return {
        header: { name: "", email: "" },
        experience: [],
        projects: [],
        education: [],
        skills: [],
        certifications: [],
    };
}

/**
 * True if the value is usable as resume content.
 *
 * Worth checking before handing a `jsonb` column to anything that indexes into
 * its arrays: the column has no schema, so a row written by an older version of
 * the app - or by a model that returned the wrong shape - can be missing whole
 * sections. Every array access downstream assumes these six keys exist.
 */
export function isResumeDraftContent(value: unknown): value is ResumeDraftContent {
    if (!value || typeof value !== "object") return false;
    const c = value as Partial<ResumeDraftContent>;
    return (
        !!c.header &&
        typeof c.header === "object" &&
        Array.isArray(c.experience) &&
        Array.isArray(c.projects) &&
        Array.isArray(c.education) &&
        Array.isArray(c.skills) &&
        Array.isArray(c.certifications)
    );
}

/**
 * Coerce a `jsonb` value into content that is safe to index into.
 *
 * Missing sections become empty arrays rather than throwing, because the caller is
 * usually building a prompt or a preview and a half-populated resume is still
 * worth something.
 */
export function coerceResumeDraftContent(value: unknown): ResumeDraftContent {
    const base = emptyResumeDraftContent();
    if (!value || typeof value !== "object") return base;
    const c = value as Partial<ResumeDraftContent>;
    return {
        header: { ...base.header, ...(c.header ?? {}) },
        experience: Array.isArray(c.experience) ? c.experience : [],
        projects: Array.isArray(c.projects) ? c.projects : [],
        education: Array.isArray(c.education) ? c.education : [],
        skills: Array.isArray(c.skills) ? c.skills : [],
        certifications: Array.isArray(c.certifications) ? c.certifications : [],
    };
}

/** `2023-01` style. A resume never needs the day. */
function fmtRange(start: string, end: string | undefined, current: boolean): string {
    const s = (start || "").slice(0, 7);
    if (current) return `${s} - Present`;
    const e = (end || "").slice(0, 7);
    return e ? `${s} - ${e}` : s;
}

/**
 * Render resume content as the plain text that goes into a prompt.
 *
 * NOT `JSON.stringify`, which is what the resume actions used to send. Handing a
 * model raw JSON spends a large share of the token budget on braces, quotes and
 * key names, and it nudges the model toward answering in JSON shape instead of
 * reasoning about the content. This is the same information at roughly half the
 * tokens, in the form a human reviewer would read it.
 */
export function renderResumeText(input: unknown): string {
    const c = coerceResumeDraftContent(input);
    const out: string[] = [];
    const h = c.header;

    if (h.name) out.push(h.name);
    const contact = [h.email, h.phone, h.location].filter(Boolean).join(" | ");
    if (contact) out.push(contact);
    const links = [h.github, h.linkedin, h.portfolio, h.website].filter(Boolean).join(" | ");
    if (links) out.push(links);
    if (h.title) out.push(`Title: ${h.title}`);
    if (h.summary) out.push(`\nSUMMARY\n${h.summary}`);

    if (c.experience.length) {
        out.push("\nEXPERIENCE");
        for (const e of c.experience) {
            const loc = e.location ? `, ${e.location}` : "";
            out.push(`${e.role} - ${e.company}${loc} (${fmtRange(e.startDate, e.endDate, e.current)})`);
            for (const b of e.bullets ?? []) out.push(`  - ${b}`);
        }
    }

    if (c.projects.length) {
        out.push("\nPROJECTS");
        for (const p of c.projects) {
            const tech = p.technologies?.length ? ` [${p.technologies.join(", ")}]` : "";
            out.push(`${p.name}${tech}`);
            if (p.description) out.push(`  ${p.description}`);
            for (const b of p.bullets ?? []) out.push(`  - ${b}`);
        }
    }

    if (c.education.length) {
        out.push("\nEDUCATION");
        for (const e of c.education) {
            const deg = [e.degree, e.field].filter(Boolean).join(", ");
            out.push(`${deg ? `${deg} - ` : ""}${e.institution} (${fmtRange(e.startDate, e.endDate, false)})`);
            for (const b of e.bullets ?? []) out.push(`  - ${b}`);
        }
    }

    if (c.skills.length) {
        out.push("\nSKILLS");
        for (const g of c.skills) out.push(`${g.category}: ${(g.items ?? []).join(", ")}`);
    }

    if (c.certifications.length) {
        out.push("\nCERTIFICATIONS");
        for (const cert of c.certifications) {
            const issuer = cert.issuer ? ` - ${cert.issuer}` : "";
            const date = cert.date ? ` (${cert.date.slice(0, 7)})` : "";
            out.push(`${cert.name}${issuer}${date}`);
        }
    }

    return out.join("\n").trim();
}
