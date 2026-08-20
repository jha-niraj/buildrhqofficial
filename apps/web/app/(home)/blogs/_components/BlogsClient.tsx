'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import Footer from '@/components/landingpage/footer'
import { PostCard } from './post-card'
import { TopicGlyph } from './topic-glyph'
import { BLOG_CATEGORIES, BLOG_CATEGORY_KEYS, type BlogPostWithSlug, type BlogCategory } from '@/content/blog'

interface Props {
    posts: BlogPostWithSlug[]
}

const publishDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function BlogsClient({ posts }: Props) {
    // Only offer filters for categories that actually have published posts, so the bar
    // never advertises an empty result.
    const categories = useMemo(() => {
        const present = new Set(posts.map((p) => p.category))
        return BLOG_CATEGORY_KEYS.filter((k) => present.has(k))
    }, [posts])

    const [active, setActive] = useState<BlogCategory | 'all'>('all')

    const filtered = useMemo(
        () => (active === 'all' ? posts : posts.filter((p) => p.category === active)),
        [active, posts]
    )

    const featured = filtered.find((p) => p.featured) ?? filtered[0]
    const rest = filtered.filter((p) => p.slug !== featured?.slug)

    return (
        <div className="min-h-screen bg-white font-sans dark:bg-neutral-950">
            <div className="border-b border-neutral-100 dark:border-neutral-900">
                <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                            The ShipItHQ Blog
                        </p>
                        <h1 className="mb-6 text-5xl font-bold leading-[0.95] tracking-tight text-neutral-900 dark:text-white md:text-7xl">
                            Engineering<br />
                            <span className="text-neutral-500 dark:text-neutral-400">Intelligence.</span>
                        </h1>
                        <p className="max-w-xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Deep dives into software careers, interview prep, portfolio building, and the
                            tools that get developers hired. {posts.length} guides and counting.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Filter bar. This is a client-side convenience - the topic hub links further
                down are the real, crawlable URLs. */}
            <div className="mx-auto max-w-7xl px-6 pt-8">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setActive('all')}
                        aria-pressed={active === 'all'}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${active === 'all'
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                            : 'border-neutral-200 bg-transparent text-neutral-500 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((key) => (
                        <button
                            key={key}
                            onClick={() => setActive(key)}
                            aria-pressed={active === key}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${active === key
                                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                                : 'border-neutral-200 bg-transparent text-neutral-500 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600'
                                }`}
                        >
                            {BLOG_CATEGORIES[key]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-10 pb-24">
                {featured && (
                    <motion.div
                        key={featured.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-14"
                    >
                        <Link
                            href={`/blogs/${featured.slug}`}
                            className="group grid overflow-hidden rounded-3xl border border-neutral-200 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600 lg:grid-cols-2"
                        >
                            {/* The featured cover loads eagerly: it is the largest thing above
                                the fold and is almost certainly this page's LCP element. */}
                            <div className="overflow-hidden border-b border-neutral-200 dark:border-neutral-800 lg:border-b-0 lg:border-r">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`/blogs/${featured.slug}/cover`}
                                    alt={featured.title}
                                    width={1200}
                                    height={630}
                                    loading="eager"
                                    className="aspect-[1200/630] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                            </div>
                            <div className="flex flex-col justify-center p-8 md:p-12">
                                <div className="mb-5 flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                                        <TopicGlyph category={featured.category} className="h-3.5 w-3.5" />
                                        {BLOG_CATEGORIES[featured.category]}
                                    </span>
                                    <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {publishDate(featured.datePublished)} · {featured.readingTime} min read
                                    </span>
                                </div>
                                {/* Unlike the grid cards, the featured one DOES print its title.
                                    The cover is beside the copy here rather than above it, so the
                                    two are read together rather than one after the other, and a
                                    coverless column of description with no headline reads as a
                                    stray paragraph. */}
                                <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-neutral-900 group-hover:text-neutral-800 dark:text-white dark:group-hover:text-neutral-100">
                                    {featured.title}
                                </h2>
                                <p className="mb-6 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                                    {featured.description}
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white">
                                    Read the guide
                                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post, i) => (
                        <motion.div
                            key={post.slug}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                            className="flex"
                        >
                            {/* Shared with the topic hubs and the related-articles strip. The
                                three used to be separate copies of this markup and had drifted.

                                Every grid cover is lazy, including the first row. The featured
                                card above is full-bleed and is this page's LCP element; the grid
                                starts below the fold behind it, so marking the first three eager
                                would put ~220KB of covers in front of the one image the score is
                                actually measured on. */}
                            <PostCard post={post} />
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                        Browse by topic
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {BLOG_CATEGORY_KEYS.map((key) => (
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
                </div>
            </div>

            <Footer />
        </div>
    )
}
