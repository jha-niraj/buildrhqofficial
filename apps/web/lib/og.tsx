import { ImageResponse } from 'next/og'

/**
 * The one 1200x630 branded card generator. Every generated image on this site comes from
 * here: blog post covers, topic hub covers, and the social cards for both.
 *
 * ── Why generate covers at all ──
 *
 * The blog used to lead its cards with `heroImage`, a hand-made `.webp` under
 * `public/og/blog/`. Seven of those existed for seventeen posts, so a three-column grid
 * showed the same picture two and three times in a row, which reads as duplicate articles
 * rather than as illustration. They also cost 1.7MB on the pages most likely to be a cold
 * first impression from search.
 *
 * A generated card is unique per post because it prints the post's own title, and it can
 * never be missing, because it is derived from data the post already has. Nobody draws
 * seventeen covers by hand and nobody has to draw the eighteenth.
 *
 * ── One builder, four call sites ──
 *
 * The card art and the social card were separate implementations of the same rectangle.
 * That is how a brand drifts: the OG card kept a logo tile reading "B" long after the
 * product stopped being called that, because nothing else rendered it. One function means
 * a change to the card lands on the grid, the article, the hub and the social preview at
 * once.
 *
 * ── No custom font, deliberately ──
 *
 * Satori cannot see `next/font`, so using the display face would mean checking a TTF into
 * the repo and reading it off disk at render time - and `process.cwd()` does not exist
 * inside a Worker. The bundled default is used instead. It is a picture of a headline, not
 * the headline itself, and the real one is in the HTML.
 *
 * ── It renders on Cloudflare Workers ──
 *
 * `@opennextjs/cloudflare` patches `@vercel/og` at build time, so `next/og` works on this
 * deploy target. Every route that calls this exports `generateStaticParams`, so the PNGs
 * are rendered at BUILD time and served from the assets CDN - a twenty-card grid costs
 * twenty asset reads, not twenty Worker invocations.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

// Monochrome, per the palette rule in the root CLAUDE.md. There is no accent colour here
// on purpose: a per-category tint was tried on the old covers and it pulled rose, emerald
// and teal into a brand that is black and neutral everywhere else.
const INK = '#ffffff'
const INK_MUTED = '#d4d4d4'
const INK_DIM = '#a3a3a3'
const GROUND = 'linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 55%, #0a0a0a 100%)'

// ── The mark ──
//
// `public/logo.svg` is the source of truth for the shape: a 3x3 grid with the lower-right
// triangle filled, so it climbs left to right. It is not imported. The file is
// `fill="currentColor"` so that one asset serves black-on-light and white-on-dark, and
// satori resolves neither `currentColor` nor an external file at build time. Six divs is a
// smaller price than a second, colour-baked copy of the logo that would silently stop
// matching the first.
//
// If `logo.svg` ever changes shape, this changes with it.
const CELL = 13
const GAP = 4
/** Row-major, top row first. Mirrors the six <rect> elements in logo.svg. */
const MARK_GRID = [
    [false, false, true],
    [false, true, true],
    [true, true, true],
]

function Mark() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {MARK_GRID.map((row, y) => (
                <div key={y} style={{ display: 'flex', gap: GAP }}>
                    {row.map((filled, x) => (
                        <div
                            key={x}
                            style={{
                                width: CELL,
                                height: CELL,
                                borderRadius: 4,
                                // Empty cells still occupy the grid, so the mark keeps its square
                                // footprint and the wordmark beside it does not shift.
                                background: filled ? INK : 'transparent',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

export interface OgOptions {
    /** The card's main line. Long titles step down a size rather than overflowing. */
    title: string
    /** Small line above the title - the category, or the section. */
    eyebrow?: string
    /** Bottom-left line. The author on a post, a description elsewhere. */
    footer?: string
}

export function ogImage({ title, eyebrow, footer }: OgOptions): ImageResponse {
    // Three steps rather than a formula: satori has no text measurement, so the only safe
    // way to keep a long headline inside the card is to pick a size from its length.
    const titleSize = title.length > 90 ? 46 : title.length > 70 ? 54 : 64

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: GROUND,
                    padding: 72,
                }}
            >
                {/* A soft wash in the top-right so the card is not a flat black rectangle.
                    White at 6% rather than a colour - see the palette note above. */}
                <div
                    style={{
                        position: 'absolute',
                        top: -240,
                        right: -180,
                        width: 660,
                        height: 660,
                        borderRadius: 660,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)',
                        display: 'flex',
                    }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <Mark />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: INK, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
                            ShipItHQ
                        </span>
                        {eyebrow ? (
                            <span style={{ color: INK_DIM, fontSize: 15, letterSpacing: 1.5 }}>
                                {eyebrow.toUpperCase()}
                            </span>
                        ) : null}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        color: INK,
                        fontSize: titleSize,
                        fontWeight: 700,
                        lineHeight: 1.14,
                        letterSpacing: -2,
                        maxWidth: 1000,
                    }}
                >
                    {title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* #737373, not the #171717 this used to be. On a near-black ground that
                        was 1.2:1 - a rule nobody could see. */}
                    <div style={{ width: 40, height: 3, background: '#737373' }} />
                    {footer ? <span style={{ color: INK_MUTED, fontSize: 22 }}>{footer}</span> : null}
                    <span style={{ color: INK_DIM, fontSize: 22 }}>shipithq.com</span>
                </div>
            </div>
        ),
        OG_SIZE,
    )
}
