// ─────────────────────────────────────────────────────────────────────────────
// Resume Draft Content
//
// The content types and the text renderer now live in @repo/db, because
// apps/worker reads and writes `resume_draft.content` too and the column is jsonb -
// this contract is the only thing enforcing its shape, so a second copy of it is a
// copy that will drift.
//
// Re-exported here so the existing `@/types/resume-draft` imports keep working.
// ─────────────────────────────────────────────────────────────────────────────

export type {
    ResumeHeader,
    ResumeExperienceEntry,
    ResumeProjectEntry,
    ResumeEducationEntry,
    ResumeSkillGroup,
    ResumeCertificationEntry,
    ResumeDraftContent,
} from "@repo/db/resume"

export {
    emptyResumeDraftContent,
    isResumeDraftContent,
    coerceResumeDraftContent,
    renderResumeText,
} from "@repo/db/resume"

// ─────────────────────────────────────────────────────────────────────────────
// Template config for user-customised or platform templates
// ─────────────────────────────────────────────────────────────────────────────
export interface ResumeTemplateConfig {
    primaryColor: string    // hex
    accentColor?: string
    fontFamily: string      // "inter" | "roboto" | "georgia" | "merriweather"
    layout: "single" | "two-column"
    showPhoto: boolean
    fontSize: "small" | "medium" | "large"
}

export const DEFAULT_TEMPLATE_CONFIG: ResumeTemplateConfig = {
    primaryColor: "#1a1a1a",
    fontFamily: "inter",
    layout: "single",
    showPhoto: false,
    fontSize: "medium",
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform template definitions (seeded to DB)
// ─────────────────────────────────────────────────────────────────────────────
export interface PlatformTemplate {
    slug: string
    name: string
    description: string
    tags: string[]
    sectionOrder: string[]
    config: ResumeTemplateConfig
    previewColor: string   // accent color shown in card preview
}

export const PLATFORM_TEMPLATES: PlatformTemplate[] = [
    {
        slug: "clean-minimal",
        name: "Clean Minimal",
        description: "A clean, ATS-friendly single-column resume. Best for most roles.",
        tags: ["ATS-friendly", "minimal", "general"],
        sectionOrder: ["header", "summary", "experience", "education", "skills", "projects"],
        config: { primaryColor: "#1a1a1a", fontFamily: "inter", layout: "single", showPhoto: false, fontSize: "medium" },
        previewColor: "#6366f1",
    },
    {
        slug: "developer-pro",
        name: "Developer Pro",
        description: "Two-column layout with skills and tech stack front and centre. Built for engineers.",
        tags: ["developer", "two-column", "tech"],
        sectionOrder: ["header", "skills", "experience", "projects", "education", "certifications"],
        config: { primaryColor: "#0f172a", accentColor: "#6366f1", fontFamily: "inter", layout: "two-column", showPhoto: false, fontSize: "small" },
        previewColor: "#6366f1",
    },
    {
        slug: "executive-classic",
        name: "Executive Classic",
        description: "Polished, results-driven layout for senior and leadership roles.",
        tags: ["executive", "leadership", "classic"],
        sectionOrder: ["header", "summary", "experience", "education", "skills", "certifications"],
        config: { primaryColor: "#1e293b", fontFamily: "georgia", layout: "single", showPhoto: false, fontSize: "medium" },
        previewColor: "#525252",
    },
    {
        slug: "ats-optimizer",
        name: "ATS Optimizer",
        description: "Zero decoration, maximum ATS compatibility. Every word counts.",
        tags: ["ATS-friendly", "simple", "safe"],
        sectionOrder: ["header", "experience", "skills", "education", "projects"],
        config: { primaryColor: "#000000", fontFamily: "roboto", layout: "single", showPhoto: false, fontSize: "small" },
        previewColor: "#10b981",
    },
    {
        slug: "modern-creative",
        name: "Modern Creative",
        description: "Subtle accent colours and strong visual hierarchy. Stand out from the pile.",
        tags: ["creative", "modern", "visual"],
        sectionOrder: ["header", "summary", "experience", "projects", "skills", "education"],
        config: { primaryColor: "#0f172a", accentColor: "#ec4899", fontFamily: "inter", layout: "single", showPhoto: false, fontSize: "medium" },
        previewColor: "#ec4899",
    },
]
