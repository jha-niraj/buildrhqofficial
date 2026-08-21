/**
 * The 404 illustration: the brand mark with one tile missing.
 *
 * Server-rendered SVG on `currentColor`, animated in CSS - the same contract as
 * `topic-glyph.tsx`, `hero-slide-art.tsx` and `about-art.tsx`.
 *
 * The shape is `public/logo.svg`'s staircase, drawn at scale, with the top tile detached
 * and drifting. It is the one illustration on the site that is allowed to be a small joke,
 * and it is legible as the logo first and the joke second - which is the right order for a
 * page somebody arrives at by accident.
 */
export function NotFoundArt({ className = '' }: { className?: string }) {
    // Mirrors the six <rect> elements in logo.svg: a 3x3 grid, lower-right triangle filled.
    // The top-right tile is rendered separately so it can drift.
    const TILES = [
        { x: 118, y: 118 },
        { x: 186, y: 118 },
        { x: 254, y: 118 },
        { x: 186, y: 50 },
        { x: 254, y: 50 },
    ]

    return (
        <svg viewBox="0 0 372 220" className={className} aria-hidden focusable="false">
            {TILES.map((t) => (
                <rect key={`${t.x}-${t.y}`} x={t.x} y={t.y} width="54" height="54" rx="10" fill="currentColor" opacity={0.9} />
            ))}

            {/* The missing tile: the one that would sit at the top of the climb. */}
            <g className="sh-art-drift">
                <rect
                    x="254"
                    y="-18"
                    width="54"
                    height="54"
                    rx="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="7 6"
                    opacity={0.55}
                />
            </g>

            {/* The gap it left. */}
            <rect
                x="254"
                y="50"
                width="54"
                height="54"
                rx="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 6"
                opacity={0.3}
            />
        </svg>
    )
}

export default NotFoundArt
