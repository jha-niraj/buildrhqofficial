import { ImageResponse } from 'next/og'
import { BLOG_POSTS, BLOG_CATEGORIES, BLOG_SLUGS } from '@/content/blog'
import { AUTHORS } from '@/content/authors'

// Per-post social card, rendered at build time (one static image per slug). This is why
// no post needs a hand-designed OG asset: every article gets a real, title-specific
// 1200x630 card instead of the whole blog sharing one generic image.
//
// This file is also the reason the blog can drop its hero rasters (WEB-40): the card is
// built entirely from type and CSS and never reads `post.heroImage`. Deleting a hero
// image cannot break a social card, because no social card has ever looked at one.
//
// ── Keep it legible at feed size ──
//
// The card is authored at 1200x630 and shown at roughly 500px wide in a timeline, so
// everything on it renders at about 40% of the size it is written. That is why the
// smallest type here is 15px and why nothing is set in a mid-grey against the dark
// ground. Measured on the rendered PNG rather than reasoned about: the reading-time
// text was 3.7:1 and is now 7.0:1, and the mark went from 1.1:1 to 19.4:1.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'ShipItHQ article'

// The ShipItHQ mark, rebuilt out of divs.
//
// `public/logo.svg` is the source of truth for the shape - a 3x3 grid with the
// lower-right triangle filled, so it climbs left to right. It is not imported here:
// the file is `fill="currentColor"` so that one asset works black-on-light and
// white-on-dark, and satori resolves neither `currentColor` nor an external file at
// build time. Six divs is a smaller price than a second, colour-baked copy of the
// logo that would silently stop matching the first.
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
                                // Empty cells still occupy the grid, so the mark keeps its
                                // square footprint and the wordmark next to it does not shift.
                                background: filled ? '#ffffff' : 'transparent',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function generateStaticParams() {
    return BLOG_SLUGS.map((slug) => ({ slug }))
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = BLOG_POSTS[slug]

    const title = post?.title ?? 'ShipItHQ'
    const category = post ? BLOG_CATEGORIES[post.category] : 'Engineering Intelligence'
    const author = post ? AUTHORS[post.author].name : 'ShipItHQ'
    const readingTime = post ? `${post.readingTime} min read` : ''

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 55%, #0a0a0a 100%)',
                    padding: 72,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <Mark />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#ffffff', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
                            ShipItHQ
                        </span>
                        <span style={{ color: '#a3a3a3', fontSize: 15, letterSpacing: 1.5 }}>
                            {category.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        color: '#ffffff',
                        fontSize: title.length > 70 ? 54 : 64,
                        fontWeight: 700,
                        lineHeight: 1.14,
                        letterSpacing: -2,
                        maxWidth: 1000,
                    }}
                >
                    {title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Was #171717 on a near-black ground: 1.2:1, a rule nobody could see. */}
                    <div style={{ width: 40, height: 3, background: '#737373' }} />
                    <span style={{ color: '#d4d4d4', fontSize: 22 }}>{author}</span>
                    {readingTime ? (
                        <span style={{ color: '#a3a3a3', fontSize: 22 }}>· {readingTime}</span>
                    ) : null}
                </div>
            </div>
        ),
        size,
    )
}
