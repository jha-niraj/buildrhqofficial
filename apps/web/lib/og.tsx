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

function Mark({ scale = 1 }: { scale?: number } = {}) {
    const cell = CELL * scale
    const gap = GAP * scale
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {MARK_GRID.map((row, y) => (
                <div key={y} style={{ display: 'flex', gap }}>
                    {row.map((filled, x) => (
                        <div
                            key={x}
                            style={{
                                width: cell,
                                height: cell,
                                borderRadius: 4 * scale,
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

/**
 * The comparison card: our mark on the left, theirs on the right, VS between them.
 *
 * ── Why not their logo ──
 *
 * A competitor's logo is their trademark. Putting it on a card that argues against them,
 * on our own domain, is the kind of thing that generates a letter - and it would have to be
 * fetched, cached and kept current for ten different companies. Their NAME is a factual
 * reference to the subject of the page and is what a reader recognises anyway.
 *
 * So the right-hand tile is a drawn glyph plus the name. It signals "this is a comparison"
 * without borrowing anybody's brand, and it works identically for the four pages that
 * compare a category rather than a company - a bootcamp has no logo to borrow.
 *
 * ── The glyph is drawn, not imported ──
 *
 * Satori renders a subset of CSS and no React icon library, so each glyph is plain divs and
 * inline SVG paths. Six shapes cover ten pages; `glyph` picks one.
 */

export type VersusGlyph = 'grid' | 'cap' | 'spark' | 'book' | 'people' | 'list'

/** Simple drawn marks. Each is a few absolutely-positioned divs - satori handles no more. */
function Glyph({ kind }: { kind: VersusGlyph }) {
    const bar = (w: number, h: number, o = 1) => ({
        width: w,
        height: h,
        borderRadius: 3,
        background: INK,
        opacity: o,
        display: 'flex',
    })
    // 76px, not 52. Our mark fills roughly 80px of the 128px tile at scale 1.9, and a
    // glyph at 52 made the right-hand tile read as lighter than the left - which on a
    // versus card is a visual claim nobody intended to make.
    const wrap = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        width: 76,
        height: 76,
    } as const

    if (kind === 'grid') {
        // A problem bank: rows of equal cells.
        return (
            <div style={{ ...wrap, flexDirection: 'column' }}>
                {[0.9, 0.6, 0.35].map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: 5 }}>
                        <div style={bar(19, 13, o)} />
                        <div style={bar(19, 13, o)} />
                        <div style={bar(19, 13, o)} />
                    </div>
                ))}
            </div>
        )
    }
    if (kind === 'cap') {
        // A programme: a stack that steps up.
        return (
            <div style={{ ...wrap, alignItems: 'flex-end' }}>
                <div style={bar(17, 32, 0.45)} />
                <div style={bar(17, 50, 0.7)} />
                <div style={bar(17, 67, 1)} />
            </div>
        )
    }
    if (kind === 'spark') {
        // An assistant: a caret and a spark.
        return (
            <div style={{ ...wrap, flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <div style={bar(13, 13, 1)} />
                    <div style={bar(38, 13, 0.5)} />
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <div style={bar(26, 13, 0.7)} />
                    <div style={bar(25, 13, 0.35)} />
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <div style={bar(41, 13, 0.5)} />
                    <div style={bar(10, 13, 1)} />
                </div>
            </div>
        )
    }
    if (kind === 'book') {
        // Written material: stacked pages.
        return (
            <div style={{ ...wrap, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={bar(68, 15, 1)} />
                <div style={bar(56, 15, 0.6)} />
                <div style={bar(44, 15, 0.35)} />
            </div>
        )
    }
    if (kind === 'people') {
        // A person, or a pair of them.
        return (
            <div style={{ ...wrap, gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 23, height: 23, borderRadius: 23, background: INK, display: 'flex' }} />
                    <div style={bar(34, 23, 0.75)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.45 }}>
                    <div style={{ width: 23, height: 23, borderRadius: 23, background: INK, display: 'flex' }} />
                    <div style={bar(34, 23, 1)} />
                </div>
            </div>
        )
    }
    // list: a plan, with one item ticked.
    return (
        <div style={{ ...wrap, flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
            {[1, 0.6, 0.35].map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: INK, opacity: o, display: 'flex' }} />
                    <div style={bar(46, 12, o * 0.7)} />
                </div>
            ))}
        </div>
    )
}

export interface VersusOptions {
    /** The alternative's name, exactly as the page titles it. */
    against: string
    /** The one-line stance, shown small under the title. */
    stance: string
    glyph: VersusGlyph
}

export function versusImage({ against, stance, glyph }: VersusOptions): ImageResponse {
    // Satori cannot measure text, so the stance is truncated by length rather than by width.
    const line = stance.length > 118 ? `${stance.slice(0, 115)}...` : stance

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
                    <span style={{ color: INK, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>ShipItHQ</span>
                    <span style={{ color: INK_DIM, fontSize: 15, letterSpacing: 1.5, marginLeft: 8 }}>COMPARISON</span>
                </div>

                {/* The versus row: two tiles, one rule, one word. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 128,
                            height: 128,
                            borderRadius: 26,
                            border: '2px solid rgba(255,255,255,0.22)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <Mark scale={1.9} />
                    </div>

                    <span style={{ color: INK_DIM, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>VS</span>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 128,
                            height: 128,
                            borderRadius: 26,
                            border: '2px solid rgba(255,255,255,0.22)',
                            background: 'rgba(255,255,255,0.05)',
                        }}
                    >
                        <Glyph kind={glyph} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 560, marginLeft: 6 }}>
                        <span
                            style={{
                                color: INK,
                                fontSize: against.length > 22 ? 40 : 50,
                                fontWeight: 700,
                                lineHeight: 1.1,
                                letterSpacing: -1.5,
                            }}
                        >
                            {against}
                        </span>
                        <span style={{ color: INK_MUTED, fontSize: 20, lineHeight: 1.35, marginTop: 12 }}>{line}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 3, background: '#737373' }} />
                    <span style={{ color: INK_DIM, fontSize: 22 }}>shipithq.com/compare</span>
                </div>
            </div>
        ),
        OG_SIZE,
    )
}
