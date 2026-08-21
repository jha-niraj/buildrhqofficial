/**
 * One illustration per hero slide.
 *
 * ── Why these exist ──
 *
 * The rotating panel below the hero fold put its copy in the left third and left the right
 * two thirds empty at desktop width. It is the first thing a visitor sees below the fold on
 * the highest-traffic page on the site, and it was mostly whitespace.
 *
 * ── Server-rendered SVG on `currentColor` ──
 *
 * Same rule as `topic-glyph.tsx`. No `use client`, no motion library, no raster. A drawing
 * that inherits the surrounding text colour needs no second palette for dark mode and
 * cannot drift from the monochrome rule.
 *
 * ── The animation is CSS, and it is decoration ──
 *
 * Each drawing has a small looping motion defined in `@repo/ui`'s globals.css under
 * `.sh-art-*`. That is deliberate: a scroll- or state-driven animation would need
 * JavaScript, and this panel already costs a client component for the rotation itself.
 * Adding an animation runtime for decoration is what the performance budget exists to stop.
 *
 * Every animation is disabled under `prefers-reduced-motion`, in the same stylesheet.
 *
 * ── They say what the slide says ──
 *
 * Each one draws the actual mechanic in the copy beside it - a brief becoming a deployment,
 * a spoken answer with a follow-up, a hint that narrows rather than reveals, a resume being
 * parsed into fields. Decorative shapes would have filled the space without earning it.
 */

const S = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 1.5,
} as const

/** Projects: a brief, broken into tasks, ending as something deployed. */
function ProjectsArt() {
    return (
        <>
            {/* The brief */}
            <rect x="14" y="26" width="86" height="108" rx="8" {...S} />
            <path d="M28 46h58M28 60h44" {...S} />
            <g className="sh-art-tick">
                <path d="M28 78l6 6 12-12" {...S} strokeWidth={2} />
                <path d="M56 78h30" {...S} opacity={0.5} />
                <path d="M28 100l6 6 12-12" {...S} strokeWidth={2} />
                <path d="M56 100h30" {...S} opacity={0.5} />
            </g>
            <path d="M28 118h18" {...S} opacity={0.35} />

            {/* Flow */}
            <path d="M108 80h34" {...S} strokeDasharray="4 5" className="sh-art-flow" />
            <path d="M136 74l7 6-7 6" {...S} />

            {/* The deployed thing */}
            <rect x="152" y="34" width="114" height="92" rx="8" {...S} />
            <path d="M152 54h114" {...S} />
            <circle cx="164" cy="44" r="2" fill="currentColor" />
            <circle cx="173" cy="44" r="2" fill="currentColor" />
            <path d="M170 104l20-22 16 16 14-18 20 24" {...S} />
            <circle cx="238" cy="70" r="6" {...S} className="sh-art-pulse" />
        </>
    )
}

/** Mock interviews: a spoken answer, and the follow-up that comes back. */
function MockArt() {
    return (
        <>
            <path d="M22 40h128a8 8 0 018 8v54a8 8 0 01-8 8H68l-24 20v-20H22a8 8 0 01-8-8V48a8 8 0 018-8z" {...S} />
            {/* A waveform, because the differentiator is that you say it out loud. */}
            <g className="sh-art-wave" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round">
                <path d="M38 75v10" />
                <path d="M52 66v28" />
                <path d="M66 58v44" />
                <path d="M80 70v20" />
                <path d="M94 62v36" />
                <path d="M108 72v16" />
                <path d="M122 66v28" />
                <path d="M136 76v8" />
            </g>

            {/* The follow-up */}
            <path d="M186 74h68a8 8 0 018 8v40a8 8 0 01-8 8h-6v16l-18-16h-36a8 8 0 01-8-8V82a8 8 0 018-8z" {...S} className="sh-art-rise" />
            <path d="M202 96h32M202 110h20" {...S} opacity={0.6} />
        </>
    )
}

/** Practice: a hint that narrows the space rather than handing over the answer. */
function PracticeArt() {
    return (
        <>
            <rect x="14" y="30" width="150" height="100" rx="8" {...S} />
            <path d="M14 50h150" {...S} />
            <circle cx="26" cy="40" r="2" fill="currentColor" />
            <circle cx="35" cy="40" r="2" fill="currentColor" />
            <g {...S} opacity={0.75}>
                <path d="M30 68l8 7-8 7" />
                <path d="M50 82h26" />
                <path d="M30 100h14" />
                <path d="M54 100h44" />
                <path d="M30 114h60" />
            </g>
            <path d="M110 66h40" {...S} strokeWidth={2} className="sh-art-caret" />

            {/* The hint: three options, one narrowing to the answer. */}
            <rect x="182" y="42" width="82" height="24" rx="12" {...S} opacity={0.4} />
            <rect x="182" y="76" width="82" height="24" rx="12" {...S} strokeWidth={2} className="sh-art-pulse" />
            <rect x="182" y="110" width="82" height="24" rx="12" {...S} opacity={0.4} />
            <path d="M196 88l5 5 9-10" {...S} strokeWidth={2} />
        </>
    )
}

/** Resume: a document parsed into fields, then matched against a posting. */
function ResumeArt() {
    return (
        <>
            <path d="M28 22h56l26 26v96a8 8 0 01-8 8H28a8 8 0 01-8-8V30a8 8 0 018-8z" {...S} />
            <path d="M84 22v26h26" {...S} />
            <g {...S} opacity={0.7}>
                <path d="M36 66h50M36 80h62M36 94h38M36 108h56M36 122h30" />
            </g>
            {/* The scan line: what a parser is doing to the file. */}
            <path d="M20 92h90" {...S} strokeWidth={2} className="sh-art-scan" />

            {/* Extracted fields */}
            <path d="M124 60h28" {...S} strokeDasharray="4 5" className="sh-art-flow" />
            <g className="sh-art-rise">
                <rect x="162" y="44" width="102" height="26" rx="6" {...S} />
                <path d="M176 57h32" {...S} opacity={0.6} />
                <path d="M232 51l5 5 9-10" {...S} strokeWidth={2} />
                <rect x="162" y="82" width="102" height="26" rx="6" {...S} />
                <path d="M176 95h48" {...S} opacity={0.6} />
                <path d="M232 89l5 5 9-10" {...S} strokeWidth={2} />
                <rect x="162" y="120" width="102" height="26" rx="6" {...S} />
                <path d="M176 133h24" {...S} opacity={0.6} />
                <path d="M232 127l5 5 9-10" {...S} strokeWidth={2} />
            </g>
        </>
    )
}

const ART = [ProjectsArt, MockArt, PracticeArt, ResumeArt] as const

/**
 * `index` matches the slide's position in `SLIDES`. `aria-hidden` because the copy beside
 * it already says everything the drawing does - a screen reader announcing "image, diagram
 * of a resume being parsed" after reading that sentence has been told it twice.
 */
export function HeroSlideArt({ index, className = '' }: { index: number; className?: string }) {
    const Art = ART[index % ART.length]
    if (!Art) return null

    return (
        <svg
            viewBox="0 0 280 160"
            className={className}
            aria-hidden
            focusable="false"
        >
            <Art />
        </svg>
    )
}

export default HeroSlideArt
