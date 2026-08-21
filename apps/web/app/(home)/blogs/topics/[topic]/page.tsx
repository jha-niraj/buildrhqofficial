import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    BLOG_CATEGORIES,
    BLOG_CATEGORY_KEYS,
    BLOG_CATEGORY_INTROS,
    BLOG_POSTS,
    getPostsByCategory,
    type BlogCategory,
} from '@/content/blog'
import { SITE, BRAND } from '@/lib/site'
import { TOPIC_HUBS } from '@/content/topic-hubs'
import { faqSchema, jsonLd } from '@/lib/schema'
import { FaqAccordion } from '@/components/faq-accordion'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'
import { PostCard } from '../../_components/post-card'
import { TopicGlyph } from '../../_components/topic-glyph'

interface Props { params: Promise<{ topic: string }> }

export function generateStaticParams() {
    return BLOG_CATEGORY_KEYS.map((topic) => ({ topic }))
}

// The category list is a closed set - anything else is a 404, resolved statically rather
// than by invoking the Worker.
export const dynamicParams = false

function isCategory(value: string): value is BlogCategory {
    return (BLOG_CATEGORY_KEYS as string[]).includes(value)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { topic } = await params
    if (!isCategory(topic)) return {}

    const name = BLOG_CATEGORIES[topic]
    const url = `${SITE}/blogs/topics/${topic}`

    return {
        title: `${name} Articles`,
        description: BLOG_CATEGORY_INTROS[topic],
        alternates: { canonical: url },
        // A hub with no published posts yet would be a thin page - keep it crawlable for
        // link equity but out of the index until it has something to say.
        robots: getPostsByCategory(topic).length === 0 ? { index: false, follow: true } : undefined,
        openGraph: {
            type: 'website',
            url,
            siteName: BRAND.name,
            title: `${name} Articles | ${BRAND.name}`,
            description: BLOG_CATEGORY_INTROS[topic],
            // The hub had no og:image at all, so every shared topic link rendered as a bare
            // text preview. It has a generated cover now - same builder as the post cards.
            images: [{ url: `${url}/cover`, width: 1200, height: 630, alt: `${name} articles` }],
        },
    }
}

export default async function TopicPage({ params }: Props) {
    const { topic } = await params
    if (!isCategory(topic)) notFound()

    const name = BLOG_CATEGORIES[topic]
    const posts = getPostsByCategory(topic)
    const url = `${SITE}/blogs/topics/${topic}`
    const hub = TOPIC_HUBS[topic]

    // Every slug in the reading path must exist. This runs at build time (the route is
    // fully prerendered), so a typo or a deleted post fails the build loudly instead of
    // rendering a row that links nowhere - which is the exact failure mode a hand-curated
    // path is prone to, and it is silent without this.
    const pathPosts = hub.path.map((step) => {
        const post = BLOG_POSTS[step.slug]
        if (!post) {
            throw new Error(
                `TOPIC_HUBS['${topic}'].path references '${step.slug}', which is not in BLOG_POSTS.`,
            )
        }
        return { ...step, post }
    })

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${name} Articles`,
        description: BLOG_CATEGORY_INTROS[topic],
        url,
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: posts.map((post, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: post.title,
                url: `${SITE}/blogs/${post.slug}`,
            })),
        },
    }

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blogs` },
            { '@type': 'ListItem', position: 3, name, item: url },
        ],
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            {/* A second rich result the hub genuinely earns, now that it answers questions
                on the page rather than only listing posts. */}
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(hub.faqs))} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="border-b border-neutral-100 dark:border-neutral-900">
                    <Reveal className="mx-auto max-w-6xl px-6 py-16">
                        <nav aria-label="Breadcrumb" className="mb-8">
                            <ol className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                                <li><Link href="/" className="transition-colors hover:text-neutral-900 dark:hover:text-white">Home</Link></li>
                                <li aria-hidden className="text-neutral-300 dark:text-neutral-700">/</li>
                                <li><Link href="/blogs" className="transition-colors hover:text-neutral-900 dark:hover:text-white">Blog</Link></li>
                                <li aria-hidden className="text-neutral-300 dark:text-neutral-700">/</li>
                                <li aria-current="page" className="text-neutral-600 dark:text-neutral-300">{name}</li>
                            </ol>
                        </nav>

                        <h1 className="mb-5 flex items-center gap-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
                            <TopicGlyph category={topic} className="h-10 w-10 shrink-0 text-neutral-500 dark:text-neutral-400 md:h-12 md:w-12" />
                            {name}
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {BLOG_CATEGORY_INTROS[topic]}
                        </p>
                    </Reveal>
                </div>

                {/* ── The hub as a page, not a heading over a grid ──

                    SEO-44 resolved the pillar question as "the hubs ARE the pillars", which
                    left an obligation this section discharges. Each hub had fifteen to twenty
                    words of copy, and a pillar with twenty words is a category listing with an
                    intro sentence - it will not carry the head term the cluster is built on. */}
                <div className="border-b border-neutral-100 dark:border-neutral-900">
                    <Reveal className="mx-auto max-w-3xl px-6 py-14">
                        <div className="space-y-5">
                            {hub.body.map((para) => (
                                <p key={para.slice(0, 32)} className="text-[17px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </Reveal>
                </div>

                {/* ── The reading path ──

                    Ordered by where the READER is, not by publication date, with one line per
                    step saying why it comes at that point. This is the single most useful thing
                    a hub can do that the blog index cannot, and it is what a pillar page would
                    otherwise have been for. The full grid is still below, so nothing is hidden -
                    this is a recommendation, not a filter. */}
                <div className="border-b border-neutral-100 dark:border-neutral-900">
                    <Reveal className="mx-auto max-w-3xl px-6 py-14">
                        <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Where to start
                        </h2>
                        <p className="mb-8 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {pathPosts.length} guides, in the order they are worth reading.
                        </p>
                        <ol className="space-y-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800">
                            {pathPosts.map((step, i) => (
                                <li key={step.slug} className="bg-white dark:bg-neutral-950">
                                    <Link
                                        href={`/blogs/${step.slug}`}
                                        className="group flex gap-4 p-5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                                    >
                                        <span
                                            aria-hidden
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 font-mono text-[11px] tabular-nums text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-semibold leading-snug text-neutral-900 dark:text-white">
                                                {step.post.title}
                                            </span>
                                            <span className="mt-1 block text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                {step.why}
                                            </span>
                                            <span className="mt-2 block font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {step.post.readingTime} min read
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                        <Link
                            href={hub.nextStep.href}
                            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-900 dark:text-white dark:decoration-neutral-700 dark:hover:decoration-white"
                        >
                            Then: {hub.nextStep.label}
                        </Link>
                    </Reveal>
                </div>

                <div className="mx-auto max-w-6xl px-6 py-12 pb-24">
                    {posts.length === 0 ? (
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Nothing published in this topic yet.{' '}
                            <Link href="/blogs" className="underline underline-offset-4">Browse all posts</Link>.
                        </p>
                    ) : (
                        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post, i) => (
                                <RevealItem key={post.slug} index={i} className="flex">
                                    {/* The hubs have no featured card, so the first row IS the fold and its
                                        covers are what LCP measures. Eager for those three only. */}
                                    <PostCard post={post} priority={i < 3} />
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    )}

                    {/* Rendered, not only marked up. Google requires the FAQPage answer to
                        match what a visitor sees, and an assistant quoting the page needs the
                        text to be in the HTML. Plain details/summary - an accordion here would
                        cost a client component on a page that has none. */}
                    <Reveal className="mt-16 border-t border-neutral-200 pt-12 dark:border-neutral-800">
                        <h2 className="mb-8 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Common questions
                        </h2>
                        {/* Same accordion as the landing page. It was a plain details list,
                            which shipped no JavaScript and looked like a different component
                            from the one a visitor had just seen on the home page. */}
                        <FaqAccordion faqs={hub.faqs} idPrefix={`hub-${topic}`} />
                    </Reveal>

                    <Reveal className="mt-16 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                            Other topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {BLOG_CATEGORY_KEYS.filter((k) => k !== topic).map((key) => (
                                <Link
                                    key={key}
                                    href={`/blogs/topics/${key}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white"
                                >
                                    <TopicGlyph category={key} className="h-4 w-4" />
                                    {BLOG_CATEGORIES[key]}
                                </Link>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
        </>
    )
}
