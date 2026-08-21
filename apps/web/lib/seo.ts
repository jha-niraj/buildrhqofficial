import type { Metadata } from 'next'
import { SITE, BRAND } from './site'

/**
 * One helper for every public page's `<title>`, description, canonical and OG tags.
 *
 * ── Why it exists ──
 *
 * Six pages hand-wrote their own metadata block, and they disagreed on all four things
 * that matter. Some set an absolute canonical, some a relative one, and some none at all -
 * and a page with no canonical is a page that lets the crawler decide which of
 * `/pricing`, `/pricing/`, `?ref=x` and `www.` is the real one.
 *
 * ── The title rules, enforced in dev ──
 *
 * Google truncates a title around 60 characters. A truncated title is not a small cost:
 * the part that gets cut is the end, which is where the differentiator usually is. The
 * template appends " | ShipItHQ" (11 characters), so the page's own title has 49 to work
 * with. `pageMeta` warns in development when that is exceeded, because a title nobody
 * measured is a title that will be too long.
 *
 * Descriptions are checked the same way at 160.
 *
 * These are warnings and not errors on purpose - a build should not fail because a
 * description is 162 characters, but nobody should be able to say they did not know.
 */

/** Google truncates near here. The template costs 11 of them. */
const TITLE_MAX = 49
const DESCRIPTION_MAX = 160

export interface PageMetaOptions {
    /** Page title WITHOUT the brand suffix - the template adds it. */
    title: string
    description: string
    /** Absolute path from the site root, e.g. `/features`. */
    path: string
    /** Defaults to the shared home card. Pass a per-page one where it exists. */
    image?: string
    /** Set for pages that should stay out of the index but keep passing link equity. */
    noindex?: boolean
}

export function pageMeta({
    title,
    description,
    path,
    image = '/og/home.webp',
    noindex = false,
}: PageMetaOptions): Metadata {
    if (process.env.NODE_ENV === 'development') {
        if (title.length > TITLE_MAX) {
            console.warn(
                `[seo] title is ${title.length} chars for ${path} (max ${TITLE_MAX} before the "| ${BRAND.name}" suffix pushes it past Google's ~60 char cut): "${title}"`,
            )
        }
        if (description.length > DESCRIPTION_MAX) {
            console.warn(
                `[seo] description is ${description.length} chars for ${path} (max ${DESCRIPTION_MAX}): "${description}"`,
            )
        }
    }

    const url = `${SITE}${path === '/' ? '' : path}`

    return {
        title,
        description,
        // ABSOLUTE, always. A relative canonical resolves against whatever host served the
        // page, which is how www and apex end up claiming to be canonical for each other.
        alternates: { canonical: url },
        openGraph: {
            type: 'website',
            url,
            siteName: BRAND.name,
            title: `${title} | ${BRAND.name}`,
            description,
            images: [{ url: image, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | ${BRAND.name}`,
            description,
            images: [image],
        },
        ...(noindex ? { robots: { index: false, follow: true } } : {}),
    }
}
