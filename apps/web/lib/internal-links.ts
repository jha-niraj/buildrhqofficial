import { BLOG_CATEGORY_KEYS, BLOG_POSTS, publishedPosts, type BlogCategory } from '@/content/blog'

/**
 * The blog's cluster structure, and the checks that keep it honest.
 *
 * ── Why this file exists ──
 *
 * Internal linking is the one SEO lever that is entirely within our control and the one
 * that degrades silently. A post gets written, links outward to three siblings, and nothing
 * ever links back to it. It is reachable, it is in the sitemap, and it accumulates no
 * authority because nothing on the site points at it.
 *
 * That happened here, measurably: thirteen posts shipped with outbound links and **zero**
 * inbound ones from the existing corpus. Nothing flagged it, because nothing was looking.
 *
 * ── The structure ──
 *
 * There is no separate pillar page per cluster, and that is a decision rather than an
 * omission (see `resolvePillarQuestion` below). Each `BLOG_CATEGORIES` entry is a topic hub
 * at `/blogs/topics/<key>`, and the hub IS the pillar:
 *
 *   hub  ->  every post in the category   (the hub lists them)
 *   post ->  hub                          (via the breadcrumb)
 *   post ->  3 siblings                   (relatedSlugs, hand-picked)
 *   post ->  2-5 siblings                 (contextual links in the body)
 *
 * ── What is checked ──
 *
 * `auditInternalLinks` returns the problems rather than throwing, so a caller can decide
 * whether a warning or a failure is appropriate. It is deliberately cheap enough to run in
 * a build step or a test.
 */

export interface LinkAudit {
    /** Posts that no other post links to via `relatedSlugs`. These accumulate no authority. */
    orphans: string[]
    /** `relatedSlugs` pointing at a slug that does not exist. */
    brokenRelated: { from: string; to: string }[]
    /** A post listing itself as related. */
    selfReferences: string[]
    /** Categories with fewer than this many published posts - a thin hub. */
    thinClusters: { category: BlogCategory; count: number }[]
    /** Inbound `relatedSlugs` count per post, ascending. Useful for spotting near-orphans. */
    inboundCounts: { slug: string; inbound: number }[]
}

/** A hub with fewer posts than this is thin enough that it should probably not be indexed. */
export const MIN_CLUSTER_SIZE = 2

export function auditInternalLinks(): LinkAudit {
    const published = publishedPosts
    const slugs = new Set(published.map((p) => p.slug))

    const inbound = new Map<string, number>()
    for (const s of slugs) inbound.set(s, 0)

    const brokenRelated: { from: string; to: string }[] = []
    const selfReferences: string[] = []

    for (const post of published) {
        for (const target of BLOG_POSTS[post.slug]?.relatedSlugs ?? []) {
            if (target === post.slug) {
                selfReferences.push(post.slug)
                continue
            }
            if (!slugs.has(target)) {
                // Not necessarily broken: a post can point at one that exists but is not
                // published yet, which renders and is noindex. Only a slug with no metadata
                // at all is a real break.
                if (!BLOG_POSTS[target]) brokenRelated.push({ from: post.slug, to: target })
                continue
            }
            inbound.set(target, (inbound.get(target) ?? 0) + 1)
        }
    }

    const thinClusters = BLOG_CATEGORY_KEYS.map((category) => ({
        category,
        count: published.filter((p) => p.category === category).length,
    })).filter((c) => c.count > 0 && c.count < MIN_CLUSTER_SIZE)

    const inboundCounts = [...inbound.entries()]
        .map(([slug, n]) => ({ slug, inbound: n }))
        .sort((a, b) => a.inbound - b.inbound)

    return {
        orphans: inboundCounts.filter((x) => x.inbound === 0).map((x) => x.slug),
        brokenRelated,
        selfReferences,
        thinClusters,
        inboundCounts,
    }
}

/**
 * ── The pillar question, resolved ──
 *
 * `05-content-clusters.md` left open whether each cluster needs a dedicated pillar page
 * separate from its topic hub. The answer here is **no**, for two reasons specific to this
 * site rather than to clusters in general.
 *
 * **A pillar and a hub would compete for the same query.** `/blogs/topics/dsa` and a
 * hypothetical `/blogs/dsa-guide` both target roughly "DSA interview preparation". Two of
 * our own pages splitting the same intent is the definition of cannibalisation, and the
 * hub already exists, is already linked from every post's breadcrumb, and already collects
 * the cluster.
 *
 * **The hubs are thin, not the posts.** A pillar page is worth building when the supporting
 * posts are too granular to rank for the head term. Here the individual posts are
 * substantial - 1,400 to 2,650 words each - and the thing that is thin is the hub's own
 * copy: a heading and one intro paragraph.
 *
 * So the work that a pillar page would have done is better spent making each hub a real
 * page: a genuine introduction to the topic, the posts grouped by where a reader is rather
 * than by date, and a next step. That is a change to `topics/[topic]/page.tsx`, not a new
 * route.
 *
 * This function exists so the decision is discoverable from the code rather than only from
 * a plan file that a future reader may not know exists.
 */
export function resolvePillarQuestion(): 'hubs-are-the-pillars' {
    return 'hubs-are-the-pillars'
}
