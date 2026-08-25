/**
 * A drawn preview of each resume template.
 *
 * ── Why drawn and not a screenshot ──
 *
 * The cards showed an empty tinted box with the template's name ghosted in the middle, which
 * told a reader nothing about the one thing they are choosing between: the LAYOUT. "Developer
 * Pro - two-column layout with skills front and centre" is a sentence; this is the thing
 * itself, and you can tell the five apart at a glance without reading any of them.
 *
 * A screenshot would be truer, but it needs a rendering pipeline, five PNGs to keep in sync
 * with five templates, and a story for dark mode. These are ~40 lines of SVG that inherit
 * `currentColor`, cost nothing to ship, and cannot go stale in the way an exported image can -
 * if a template's shape changes, this file is next to it in the same review.
 *
 * ── Contract ──
 *
 * Everything is `currentColor` at low opacity on a transparent ground, so one component works
 * on both themes with no `dark:` variant. The viewBox is a 3:4 page, and the shapes are the
 * template's real structural decisions: where the header sits, whether there is a sidebar,
 * how dense the body is.
 */

export type TemplateShape = "clean-minimal" | "developer-pro" | "executive-classic" | "ats-optimizer" | "modern-creative"

/** Slugs map to shapes; an unknown slug falls back to the plainest one. */
export function shapeForSlug(slug: string): TemplateShape {
    const known: TemplateShape[] = ["clean-minimal", "developer-pro", "executive-classic", "ats-optimizer", "modern-creative"]
    return (known as string[]).includes(slug) ? (slug as TemplateShape) : "clean-minimal"
}

export function TemplatePreview({ shape, className = "" }: { shape: TemplateShape; className?: string }) {
    // One page, 3:4. Everything below is drawn inside this box.
    const page = { x: 6, y: 4, w: 108, h: 144 }

    /** A run of body lines. `n` lines from `y`, each `w` wide, `gap` apart. */
    const lines = (x: number, y: number, w: number, n: number, gap = 6, o = 0.28) =>
        Array.from({ length: n }, (_, i) => (
            <rect key={`${x}-${y}-${i}`} x={x} y={y + i * gap} width={i === n - 1 ? w * 0.62 : w} height={2.4} rx={1.2} fill="currentColor" opacity={o} />
        ))

    return (
        <svg viewBox="0 0 120 152" className={className} aria-hidden focusable="false">
            {/* The page itself. A hairline, not a fill: the card behind it already provides
                the surface, and a second one just muddies both. */}
            <rect {...{ x: page.x, y: page.y, width: page.w, height: page.h }} rx="4" fill="currentColor" opacity={0.04} />
            <rect {...{ x: page.x, y: page.y, width: page.w, height: page.h }} rx="4" fill="none" stroke="currentColor" strokeWidth="0.8" opacity={0.16} />

            {shape === "clean-minimal" && (
                <>
                    {/* Centred name, a rule, then even single-column sections. */}
                    <rect x="38" y="14" width="44" height="5" rx="2.5" fill="currentColor" opacity={0.55} />
                    <rect x="46" y="23" width="28" height="2.4" rx="1.2" fill="currentColor" opacity={0.3} />
                    <rect x="16" y="31" width="88" height="0.8" fill="currentColor" opacity={0.22} />
                    <rect x="16" y="39" width="22" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(16, 46, 88, 3)}
                    <rect x="16" y="70" width="26" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(16, 77, 88, 4)}
                    <rect x="16" y="107" width="20" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(16, 114, 88, 3)}
                </>
            )}

            {shape === "developer-pro" && (
                <>
                    {/* Two columns: a filled sidebar for skills and stack, body on the right. */}
                    <rect x={page.x} y={page.y} width="38" height={page.h} rx="4" fill="currentColor" opacity={0.1} />
                    <rect x="12" y="14" width="26" height="4.5" rx="2.2" fill="currentColor" opacity={0.5} />
                    <rect x="12" y="27" width="18" height="2.6" rx="1.3" fill="currentColor" opacity={0.4} />
                    {lines(12, 34, 26, 5, 5.5, 0.24)}
                    <rect x="12" y="70" width="20" height="2.6" rx="1.3" fill="currentColor" opacity={0.4} />
                    {lines(12, 77, 26, 4, 5.5, 0.24)}
                    <rect x="52" y="14" width="40" height="5" rx="2.5" fill="currentColor" opacity={0.55} />
                    <rect x="52" y="24" width="26" height="2.4" rx="1.2" fill="currentColor" opacity={0.3} />
                    <rect x="52" y="36" width="24" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(52, 43, 52, 4)}
                    <rect x="52" y="74" width="22" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(52, 81, 52, 5)}
                </>
            )}

            {shape === "executive-classic" && (
                <>
                    {/* A banded header, generous leading, fewer and longer sections. */}
                    <rect x={page.x} y={page.y} width={page.w} height="30" rx="4" fill="currentColor" opacity={0.12} />
                    <rect x={page.x} y="30" width={page.w} height="0.8" fill="currentColor" opacity={0.2} />
                    <rect x="16" y="13" width="50" height="6" rx="3" fill="currentColor" opacity={0.55} />
                    <rect x="16" y="22" width="34" height="2.4" rx="1.2" fill="currentColor" opacity={0.32} />
                    <rect x="16" y="42" width="28" height="3.2" rx="1.6" fill="currentColor" opacity={0.45} />
                    {lines(16, 50, 88, 3, 7)}
                    <rect x="16" y="80" width="24" height="3.2" rx="1.6" fill="currentColor" opacity={0.45} />
                    {lines(16, 88, 88, 3, 7)}
                    <rect x="16" y="118" width="30" height="3.2" rx="1.6" fill="currentColor" opacity={0.45} />
                    {lines(16, 126, 88, 2, 7)}
                </>
            )}

            {shape === "ats-optimizer" && (
                <>
                    {/* Left-aligned, no ornament at all, uniform blocks. The point of this
                        template is that a parser never has to guess, and the preview says so
                        by having nothing decorative in it. */}
                    <rect x="16" y="13" width="42" height="4.5" rx="2.2" fill="currentColor" opacity={0.5} />
                    <rect x="16" y="21" width="60" height="2.4" rx="1.2" fill="currentColor" opacity={0.3} />
                    {[34, 66, 98].map((y) => (
                        <g key={y}>
                            <rect x="16" y={y} width="24" height="2.8" rx="1.4" fill="currentColor" opacity={0.42} />
                            {lines(16, y + 7, 88, 4, 5.5, 0.26)}
                        </g>
                    ))}
                </>
            )}

            {shape === "modern-creative" && (
                <>
                    {/* An accent rail and an offset header - the only template with an
                        asymmetric grid. */}
                    <rect x={page.x} y={page.y} width="5" height={page.h} rx="2.5" fill="currentColor" opacity={0.32} />
                    <circle cx="26" cy="22" r="9" fill="currentColor" opacity={0.18} />
                    <rect x="40" y="16" width="44" height="5" rx="2.5" fill="currentColor" opacity={0.55} />
                    <rect x="40" y="25" width="30" height="2.4" rx="1.2" fill="currentColor" opacity={0.3} />
                    <rect x="18" y="42" width="26" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(18, 49, 86, 3)}
                    <g>
                        {[18, 42, 62].map((x, i) => (
                            <rect key={x} x={x} y="74" width={i === 2 ? 30 : 20} height="7" rx="3.5" fill="currentColor" opacity={0.16} />
                        ))}
                    </g>
                    <rect x="18" y="90" width="24" height="3" rx="1.5" fill="currentColor" opacity={0.45} />
                    {lines(18, 97, 86, 4)}
                </>
            )}
        </svg>
    )
}
