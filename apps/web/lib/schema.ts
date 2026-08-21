import { SITE, APP_URL, BRAND } from './site'

/**
 * The site's structured data, as one entity graph.
 *
 * ── Why this file exists ──
 *
 * `Organization` and `WebSite` were declared in `layout.tsx`, and then the landing page
 * declared `WebSite` again with the SAME `@id`. Two nodes sharing an `@id` is not a
 * duplicate that a parser merges politely - it is two competing definitions of one entity,
 * and which one wins is not something you get to choose.
 *
 * Everything is defined once here and referenced by `@id` everywhere else. Adding a page
 * should never mean re-declaring the company.
 *
 * ── The `@id` convention ──
 *
 *   `${SITE}/#organization`   the company. Declared once, in the root layout.
 *   `${SITE}/#website`        the site.    Declared once, in the root layout.
 *   `${SITE}/#service`        the product. Declared once, in the root layout.
 *   `<page url>#webpage`      one per page, referencing the three above.
 *
 * A reference is `{ "@id": "..." }` and nothing else. Restating `name` alongside an `@id`
 * is how the two copies start to drift.
 *
 * ── Never fabricate a rating ──
 *
 * There is no `aggregateRating` and no `review` anywhere in this file, on purpose. Google's
 * structured-data policy requires ratings to come from real, displayed, on-page reviews,
 * and inventing one is a fast route to a manual action against the whole domain.
 *
 * The reversal condition, so this is not re-litigated: real reviews rendered on the page
 * and a genuine `aggregateRating` computed from them land in the SAME commit, or neither
 * lands. A rating without visible reviews is the violation, not the absence of a rating.
 */

export const ORG_ID = `${SITE}/#organization`
export const SITE_ID = `${SITE}/#website`
export const SERVICE_ID = `${SITE}/#service`

/** A bare reference. Never restate a node's properties next to its `@id`. */
export const ref = (id: string) => ({ '@id': id })

export const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND.name,
    url: SITE,
    logo: BRAND.logo,
    email: BRAND.email,
    description:
        'Interview preparation and portfolio platform for computer science students and software engineers.',
    sameAs: [BRAND.social.twitter, BRAND.social.github, BRAND.social.linkedin],
    foundingDate: '2024',
    founder: { '@type': 'Person', name: 'Niraj Kumar Jha' },
}

export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: BRAND.name,
    url: SITE,
    description: BRAND.tagline,
    publisher: ref(ORG_ID),
    inLanguage: 'en',
}

/**
 * The product.
 *
 * ── `Service`, not `SoftwareApplication` ──
 *
 * The root layout used to emit `SoftwareApplication` with `name` and `offers.price` and no
 * `aggregateRating` or `review`. Google requires one of those two for that type, so it
 * failed validation on **every page inheriting the root layout** - which is all of them.
 * A validation error sitting on the homepage is not a cosmetic problem: it colours how the
 * validator reads the rest of the domain's structured data.
 *
 * `Service` describes the product accurately, carries the offer, and is not a Google
 * rich-result type - so it has no required properties that cannot honestly be supplied.
 * That is the entire reason it is the right choice here: it asks for nothing we would have
 * to invent.
 *
 * `featureList` is deliberately not used - it is a `SoftwareApplication` property and means
 * nothing on `Service`. The modules are an `OfferCatalog` of nested `Service` nodes instead,
 * which is the correct shape and also survives the type change.
 *
 * ── The description is checked against the product ──
 *
 * The old one advertised "open source tracking", a module whose tables exist but whose route
 * does not - so the site was making a false claim inside its own machine-readable data,
 * where nobody would have looked for it. Same rule as the visible copy: see
 * `plan/web/polish/01-content-truth.md`.
 */
export const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': SERVICE_ID,
    name: BRAND.name,
    url: APP_URL,
    serviceType: 'Interview preparation and software engineering portfolio platform',
    provider: ref(ORG_ID),
    description:
        'Practice DSA and system design with code that runs in a real Linux container, build portfolio projects with interviews generated from your own build, rehearse voice mock interviews, and fix the resume an applicant tracking system is actually reading.',
    areaServed: 'Worldwide',
    audience: {
        '@type': 'Audience',
        audienceType: 'Computer science students and software engineers',
    },
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to start - 100 credits on signup, no card required, no subscription.',
        url: `${SITE}/pricing`,
    },
    hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'What the platform does',
        itemListElement: [
            ['Practice', 'DSA, system design, web frontend and web backend, executed in a real Linux container'],
            ['Projects', 'Portfolio briefs, with a quiz and mock interview generated from what you built'],
            ['Mock interviews', 'Voice mock interviews with follow-up questions and scored feedback'],
            ['AI tools', 'ATS resume scoring, resume tailoring to a job description, and cover letters'],
            ['Jobs', 'Role discovery scored against your profile, with application tracking'],
        ].map(([name, description]) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name, description },
        })),
    },
}

/**
 * A `WebPage` node for one page, wired into the graph above.
 *
 * Use it on every indexable page. It is what makes a page part of the site's entity graph
 * rather than an island that happens to share a domain.
 */
export function webPageSchema({
    url,
    name,
    description,
    breadcrumb,
}: {
    url: string
    name: string
    description: string
    /** Pass the `@id` of a BreadcrumbList emitted on the same page. */
    breadcrumb?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: ref(SITE_ID),
        about: ref(SERVICE_ID),
        publisher: ref(ORG_ID),
        inLanguage: 'en',
        ...(breadcrumb ? { breadcrumb: ref(breadcrumb) } : {}),
    }
}

/**
 * A BreadcrumbList for one page.
 *
 * Breadcrumbs are one of the few rich results a marketing page can honestly earn, and they
 * replace the URL in the search result with a readable path - which is worth more on
 * `/compare/interviewing-io` than the URL is.
 *
 * `trail` is ordered root-first and EXCLUDES the current page, which is appended here. That
 * split exists because every caller was otherwise going to forget whether the current page
 * was included, and half of them would have been wrong.
 */
export function breadcrumbSchema(
    trail: readonly { name: string; path: string }[],
    current: { name: string; path: string },
) {
    const items = [{ name: 'Home', path: '/' }, ...trail, current]
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${SITE}${current.path}#breadcrumb`,
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: `${SITE}${item.path === '/' ? '' : item.path}`,
        })),
    }
}

/** Build a `FAQPage` from a list the page actually renders. Never from a second copy. */
export function faqSchema(faqs: readonly { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    }
}

/** Serialise for a `<script type="application/ld+json">` tag. */
export function jsonLd(schema: unknown): { __html: string } {
    return { __html: JSON.stringify(schema) }
}
