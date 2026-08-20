import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import {
    BLOG_CATEGORIES,
    BLOG_CATEGORY_KEYS,
    BLOG_CATEGORY_INTROS,
    getPostsByCategory,
    type BlogCategory,
} from '@/content/blog'
import { SITE, BRAND } from '@/lib/site'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'

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
        },
    }
}

export default async function TopicPage({ params }: Props) {
    const { topic } = await params
    if (!isCategory(topic)) notFound()

    const name = BLOG_CATEGORIES[topic]
    const posts = getPostsByCategory(topic)
    const url = `${SITE}/blogs/topics/${topic}`

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

                        <h1 className="mb-5 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl">
                            {name}
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
                            {BLOG_CATEGORY_INTROS[topic]}
                        </p>
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
                                <Link
                                    href={`/blogs/${post.slug}`}
                                    className="group flex w-full flex-col rounded-2xl border border-neutral-200 p-6 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                                >
                                    <h2 className="mb-3 text-lg font-semibold leading-snug tracking-tight text-neutral-900 group-hover:text-neutral-800 dark:text-white dark:group-hover:text-neutral-100">
                                        {post.title}
                                    </h2>
                                    <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                                        {post.description}
                                    </p>
                                    <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                        <Clock className="h-3 w-3" aria-hidden />
                                        {post.readingTime} min read
                                    </span>
                                </Link>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    )}

                    <Reveal className="mt-16 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                            Other topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {BLOG_CATEGORY_KEYS.filter((k) => k !== topic).map((key) => (
                                <Link
                                    key={key}
                                    href={`/blogs/topics/${key}`}
                                    className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white"
                                >
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
