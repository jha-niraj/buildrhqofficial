import { PostCard } from './post-card'
import type { BlogPostWithSlug } from '@/content/blog'

// Hand-picked related posts, not an algorithmic "you may also like". This is the main
// internal-linking mechanism in the cluster - every post links to three siblings, so no
// article is ever more than a couple of hops from any other.
//
// The card itself is `PostCard`, shared with the index and the topic hubs. This file used
// to carry its own copy of that markup, which is how it ended up as the only one of the
// three with no publish date on it.
export function RelatedPosts({ posts }: { posts: BlogPostWithSlug[] }) {
    if (posts.length === 0) return null

    return (
        <section aria-labelledby="related-heading" className="pt-12">
            <h2
                id="related-heading"
                className="mb-8 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400"
            >
                Keep reading
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    // h3: this sits inside an article whose h2s are its own section headings,
                    // so an h2 here would break the document outline.
                    <PostCard key={post.slug} post={post} headingLevel="h3" />
                ))}
            </div>
        </section>
    )
}
