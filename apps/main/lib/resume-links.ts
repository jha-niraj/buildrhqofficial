/**
 * Shared formatting for anything that RENDERS a resume.
 *
 * There are three renderers - the HTML live preview in `resume-editor.tsx` and the two
 * `@react-pdf` templates in `lib/resume-pdf/` - and every one of them needs to turn the
 * same stored strings into the same displayed text. When each had its own copy, they
 * disagreed: the preview showed `jha-niraj` behind a GitHub icon while the PDF printed
 * `https://github.com/jha-niraj` as plain unclickable grey text, and the preview split the
 * summary into paragraphs while the PDF rendered its newlines raw and left ~30pt holes
 * down the page.
 *
 * No React in here, deliberately. `@react-pdf` has its own element types and cannot use a
 * DOM component, so the shared layer is the string handling and each renderer supplies its
 * own markup.
 */

/**
 * A resume shows a handle, not a URL.
 *
 * Deliberately not `new URL()`: people type `github.com/x`, `@x` and bare handles, and a
 * constructor that throws on all three would take a renderer down with it.
 */
export function handleFor(url: string | undefined | null, kind: "github" | "linkedin" | "site"): string {
    const raw = (url ?? "").trim()
    if (!raw) return ""
    const bare = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "")
    if (kind === "github") return bare.replace(/^github\.com\//i, "").replace(/^@/, "").split("/")[0] || bare
    if (kind === "linkedin") return bare.replace(/^([a-z]+\.)?linkedin\.com\/(in|company)\//i, "").split("/")[0] || bare
    // A site shows its host: "nirajjha.vercel.com", not the whole path.
    return bare.split("/")[0] || bare
}

/** Anything the user typed becomes something a link can actually navigate to. */
export function hrefFor(url: string | undefined | null): string {
    const raw = (url ?? "").trim()
    if (!raw) return ""
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

/**
 * Blank-line-separated blocks of a summary.
 *
 * Both renderers used to hand the raw string to one text node. HTML collapsed the newlines
 * to spaces until `pre-line` was set, and then rendered each blank line as a full empty
 * line; `@react-pdf` renders `\n` literally and always did. Splitting here means the gap
 * between paragraphs is a margin the template chooses, not whatever the user's Enter key
 * left behind.
 *
 * A SINGLE newline inside a block stays a soft wrap, which is what someone typing a long
 * sentence across two lines means by it.
 */
export function paragraphsOf(text: string | undefined | null): string[] {
    return (text ?? "")
        .split(/\n\s*\n/)
        .map(t => t.replace(/\s*\n\s*/g, " ").trim())
        .filter(Boolean)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * `2026-08-01` or `2026-08-01T00:00:00.000Z` -> `Aug 2026`.
 *
 * Parsed from the STRING, never through `new Date(iso)`. A bare ISO date parses as UTC
 * midnight, which is the previous day - and so possibly the previous MONTH - in any
 * negative offset. `new Date('2026-08-01')` prints "Jul 2026" in Los Angeles, so a resume
 * generated there dated every job a month early.
 */
export function formatMonth(iso: string | undefined | null): string {
    if (!iso) return ""
    const m = /^(\d{4})-(\d{2})/.exec(iso.trim())
    if (!m) return iso.trim()
    const month = Number(m[2]) - 1
    if (month < 0 || month > 11) return iso.trim()
    return `${MONTHS[month]} ${m[1]}`
}

/** `Aug 2026 - Present`, or whichever half exists. */
export function formatRange(start?: string | null, end?: string | null, current?: boolean): string {
    const a = formatMonth(start)
    const b = current ? "Present" : formatMonth(end)
    if (a && b) return `${a} - ${b}`
    return a || b
}
