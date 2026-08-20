import { ImageResponse } from 'next/og'
import { BLOG_POSTS, BLOG_CATEGORIES, BLOG_SLUGS } from '@/content/blog'
import { AUTHORS } from '@/content/authors'

// Per-post social card, rendered at build time (one static image per slug). This is why
// no post needs a hand-designed OG asset: every article gets a real, title-specific
// 1200x630 card instead of the whole blog sharing one generic image.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'ShipItHQ article'

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#171717',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0a0a0a',
                            fontSize: 26,
                            fontWeight: 700,
                        }}
                    >
                        B
                    </div>
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
                    <div style={{ width: 40, height: 3, background: '#171717' }} />
                    <span style={{ color: '#d4d4d4', fontSize: 22 }}>{author}</span>
                    {readingTime ? (
                        <span style={{ color: '#737373', fontSize: 22 }}>· {readingTime}</span>
                    ) : null}
                </div>
            </div>
        ),
        size,
    )
}
