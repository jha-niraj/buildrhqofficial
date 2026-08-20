import Link from 'next/link'
import { Clock } from 'lucide-react'
import { BLOG_CATEGORIES, type BlogPostWithSlug } from '@/content/blog'
import { TopicGlyph } from './topic-glyph'

/**
 * The grid card for a blog post. Used by the index, every topic hub, and the related-articles
 * strip at the foot of an article.
 *
 * SHARED, not copied. There were three near-identical versions of this markup and they had
 * already drifted: the topic hub's card had no category line, the related-articles one had no
 * date, and the index one used an `h3` where the hub used an `h2`. The same post looked like a
 * different kind of thing depending on which page you found it from. One component means the
 * next change lands everywhere at once.
 *
 * ── The cover is the post's own generated image ──
 *
 * `/blogs/<slug>/cover` is rendered from the post's own title (see `lib/og.tsx`), so a card can
 * never point at artwork that was not produced, and the picture is unique per post.
 *
 * This is what the old cards got wrong. They led with `heroImage`, and SEVEN hand-made `.webp`
 * files covered seventeen posts, so a three-column grid regularly showed the same picture twice
 * in a row - which reads as duplicate articles rather than as illustration. Ten posts had no
 * hero at all and fell back to a plain gradient. Generating one per post fixes the cause rather
 * than the symptom.
 *
 * ── Why there is no separate visible title ──
 *
 * The cover already sets the title in large type. Printing it again underneath said the same
 * thing twice and squeezed the description into a truncated fragment. The heading is still in
 * the DOM - it WRAPS the cover and takes its text from that image's `alt` - so the link has
 * proper anchor text and the document still has one heading per card. The title has not gone,
 * it has moved up into the artwork, and the `alt` is what carries it to anything that cannot
 * see the image.
 *
 * An empty `alt` here would be a WCAG 1.1.1 failure specifically because the image IS text: it
 * would leave the card's only real content with no text equivalent.
 *
 * ── `<img loading="lazy">`, not a CSS background ──
 *
 * A `background-image` downloads as soon as the element renders, and every card in a grid
 * renders immediately. A real `<img>` with `loading="lazy"` looks identical and only fetches
 * what the reader scrolls to. `width` and `height` are set so the card reserves its space and
 * the grid does not shift when covers arrive (CLS is in the budget in `06-performance.md`).
 *
 * ── `neutral-500`, not `neutral-400`, for meta text on light ──
 *
 * neutral-400 measures 2.53:1 on white, under the 4.5:1 floor. This is the same failure the
 * hero and the auth panel already had.
 */

function publishDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function PostCard({
    post,
    headingLevel = 'h2',
    /** The first row of a grid is above the fold on desktop - let those covers load eagerly. */
    priority = false,
}: {
    post: BlogPostWithSlug
    /** `h3` inside an article's related-articles section, where an `h2` would break the outline. */
    headingLevel?: 'h2' | 'h3'
    priority?: boolean
}) {
    const Heading = headingLevel

    return (
        <Link
            href={`/blogs/${post.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-600"
        >
            <div className="overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                {/* Tailwind's preflight zeroes heading margin and font-size, so this wrapper is
                    layout-neutral - the card renders exactly as it would without it. */}
                <Heading>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/blogs/${post.slug}/cover`}
                        alt={post.title}
                        width={1200}
                        height={630}
                        loading={priority ? 'eager' : 'lazy'}
                        className="aspect-[1200/630] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </Heading>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                    <TopicGlyph category={post.category} className="h-4 w-4" />
                    {BLOG_CATEGORIES[post.category]}
                </p>
                <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {post.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-3 w-3" aria-hidden />
                    {post.readingTime} min read
                    <span aria-hidden className="text-neutral-300 dark:text-neutral-700">·</span>
                    {publishDate(post.datePublished)}
                </span>
            </div>
        </Link>
    )
}

export default PostCard
