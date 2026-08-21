/**
 * Illustrations for the About page.
 *
 * Server-rendered SVG on `currentColor`, animated in CSS. Same contract as
 * `topic-glyph.tsx` and `hero-slide-art.tsx`: no `use client`, no motion library, no
 * raster, one drawing that works in both themes because it inherits the surrounding ink.
 *
 * The About page was just converted OFF framer-motion to a server component. Adding
 * illustration must not undo that, which is why the animation lives in the stylesheet
 * (`.sh-art-*` in `@repo/ui`'s globals.css) and is disabled under reduced motion.
 *
 * Each drawing carries the argument of the section it sits in rather than decorating it.
 */

const S = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 1.5,
} as const

/**
 * The gap. A finished course on the left, an interview on the right, and the distance
 * between them - which is the entire premise of the page.
 */
export function GapArt({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 320 150" className={className} aria-hidden focusable="false">
            {/* Finished course */}
            <rect x="10" y="34" width="104" height="82" rx="8" {...S} />
            <path d="M26 58h56M26 72h72M26 86h44" {...S} opacity={0.55} />
            <g className="sh-art-tick">
                <circle cx="88" cy="100" r="12" {...S} strokeWidth={2} />
                <path d="M82 100l4 4 8-9" {...S} strokeWidth={2} />
            </g>

            {/* The gap. Dashed, because it is the part nobody plans for. */}
            <path d="M126 75h68" {...S} strokeDasharray="3 7" opacity={0.5} />
            <text
                x="160"
                y="62"
                textAnchor="middle"
                fill="currentColor"
                fontSize="10"
                opacity={0.6}
                fontFamily="ui-monospace, monospace"
            >
                the gap
            </text>
            <path d="M144 88l-6 6 6 6M176 88l6 6-6 6" {...S} opacity={0.5} />

            {/* The interview */}
            <rect x="206" y="34" width="104" height="82" rx="8" {...S} />
            <path d="M222 56h34" {...S} opacity={0.55} />
            <g className="sh-art-wave" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round">
                <path d="M224 82v14" />
                <path d="M236 74v30" />
                <path d="M248 68v42" />
                <path d="M260 78v22" />
                <path d="M272 72v34" />
                <path d="M284 80v18" />
                <path d="M296 76v26" />
            </g>
        </svg>
    )
}

/**
 * What we refuse to do. A claim being checked against the codebase - the sourcing rule
 * that runs through the whole site, drawn.
 */
export function EvidenceArt({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 320 150" className={className} aria-hidden focusable="false">
            {/* The claim */}
            <rect x="10" y="30" width="128" height="34" rx="8" {...S} />
            <path d="M26 47h74" {...S} opacity={0.55} />

            {/* Checked against */}
            <path d="M74 72v14" {...S} strokeDasharray="4 5" className="sh-art-flow" />
            <path d="M68 82l6 6 6-6" {...S} />

            {/* The file it was read from */}
            <rect x="10" y="94" width="128" height="42" rx="8" {...S} />
            <path d="M24 108h12M24 120h12" {...S} opacity={0.4} />
            {/* Deliberately not a real path or identifier. The drawing needs to READ as
                source code; printing an actual filename would publish our layout for the
                sake of an illustration. */}
            <path d="M46 108h58M46 120h38" {...S} opacity={0.45} />

            {/* Passed */}
            <g className="sh-art-pulse">
                <circle cx="196" cy="83" r="18" {...S} strokeWidth={2} />
                <path d="M188 83l6 6 12-14" {...S} strokeWidth={2} />
            </g>

            {/* Rejected: the claim with no file behind it */}
            <rect x="232" y="42" width="78" height="30" rx="8" {...S} opacity={0.35} strokeDasharray="4 4" />
            <path d="M248 57h30" {...S} opacity={0.3} />
            <path d="M262 94l24 24M286 94l-24 24" {...S} strokeWidth={2} opacity={0.45} />
        </svg>
    )
}

/**
 * The container. The one differentiator that is a fact about infrastructure rather than a
 * claim about quality.
 */
export function ContainerArt({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 320 150" className={className} aria-hidden focusable="false">
            {/* Your code */}
            <rect x="10" y="38" width="96" height="74" rx="8" {...S} />
            <path d="M10 56h96" {...S} />
            <circle cx="22" cy="47" r="2" fill="currentColor" />
            <circle cx="30" cy="47" r="2" fill="currentColor" />
            <g {...S} opacity={0.6}>
                <path d="M24 72l7 6-7 6" />
                <path d="M42 84h26" />
                <path d="M24 98h44" />
            </g>

            <path d="M118 75h30" {...S} strokeDasharray="4 5" className="sh-art-flow" />
            <path d="M142 69l7 6-7 6" {...S} />

            {/* The container, built for this run and thrown away after it */}
            <rect x="160" y="26" width="98" height="98" rx="10" {...S} strokeWidth={2} className="sh-art-pulse" />
            <path d="M176 50h66M176 66h48M176 82h58" {...S} opacity={0.5} />
            <text
                x="209"
                y="108"
                textAnchor="middle"
                fill="currentColor"
                fontSize="8"
                opacity={0.65}
                fontFamily="ui-monospace, monospace"
            >
                gcc g++ jdk py3
            </text>

            {/* Destroyed */}
            <path d="M270 75h22" {...S} strokeDasharray="3 6" opacity={0.45} />
            <g {...S} opacity={0.45}>
                <path d="M296 62v26M290 66l12 18M302 66l-12 18" />
            </g>
        </svg>
    )
}
