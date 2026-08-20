import { BLOG_CATEGORIES, type BlogCategory } from '@/content/blog'
import { TopicGlyph } from './topic-glyph'

/**
 * The article hero: the post's own generated cover, plus a caption line naming the topic.
 *
 * ── What this used to be ──
 *
 * Two branches. Posts with a `heroImage` rendered a hand-made `.webp`; the other ten
 * rendered a gradient with the title typeset over it. So a reader moving between articles
 * met two different kinds of page, and the gradient carried a per-category accent - rose,
 * emerald, teal - in a brand that is monochrome everywhere else.
 *
 * There is one branch now. `/blogs/<slug>/cover` is generated from the post's own title,
 * so it exists for every post and is unique to each. The rasters are gone.
 *
 * ── `<img>`, not `next/image` ──
 *
 * The cover is a prerendered PNG at a fixed 1200x630, served from the assets CDN. There is
 * nothing for the image optimiser to do - no source set to pick from, no format to
 * negotiate, no unknown intrinsic size - and routing it through `/_next/image` on a
 * Cloudflare deploy adds a Worker invocation per article to re-encode an image that is
 * already exactly the size and format it will be displayed at.
 *
 * ── The alt is the title, and the caption is not ──
 *
 * The cover is a picture OF the title, and the `<h1>` above it already carries that text
 * to a screen reader. So the image is `aria-hidden` here - unlike on `PostCard`, where the
 * cover is the ONLY place the title appears and the alt has to carry it.
 */
export function PostCover({
    slug,
    title,
    category,
    priority = false,
}: {
    slug: string
    title: string
    category: BlogCategory
    priority?: boolean
}) {
    return (
        <figure className="m-0">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`/blogs/${slug}/cover`}
                    alt=""
                    aria-hidden
                    width={1200}
                    height={630}
                    loading={priority ? 'eager' : 'lazy'}
                    // fetchPriority high: on an article this is the LCP element.
                    fetchPriority={priority ? 'high' : 'auto'}
                    className="aspect-[1200/630] w-full object-cover"
                />
            </div>
            <figcaption className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                <TopicGlyph category={category} className="h-4 w-4" />
                {BLOG_CATEGORIES[category]}
                <span aria-hidden className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="sr-only">Article: </span>
                <span className="normal-case tracking-normal">{title}</span>
            </figcaption>
        </figure>
    )
}
