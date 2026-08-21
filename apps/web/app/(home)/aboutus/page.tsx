import type { Metadata } from 'next'
import AboutUsClient from './AboutUsClient'
import { SITE, BRAND } from '@/lib/site'
import { pageMeta } from '@/lib/seo'
import { breadcrumbSchema, webPageSchema, jsonLd, ORG_ID } from '@/lib/schema'

export const metadata: Metadata = pageMeta({
    title: 'About ShipItHQ',
    description:
        'ShipItHQ is an interview preparation and portfolio platform for computer science students and software engineers. Who is building it, why, and what it deliberately does not do.',
    path: '/aboutus',
})

const crumbs = breadcrumbSchema([], { name: 'About', path: '/aboutus' })

/**
 * `AboutPage`, not a plain `WebPage`.
 *
 * This is the page an AI assistant reads when somebody asks "what is ShipItHQ", so it is
 * the one place where the entity has to be defined unambiguously, in the "X is Y" form
 * that is extractable without surrounding context. `mainEntity` points the whole page at
 * the Organization node rather than leaving a reader to infer the subject.
 *
 * The `description` here and the first sentence of the page body say the same thing on
 * purpose - a definition that only exists in the markup is a definition a human never sees,
 * and one that only exists in prose is one a parser has to guess at.
 */
const page = {
    ...webPageSchema({
        url: `${SITE}/aboutus`,
        name: `About ${BRAND.name}`,
        description:
            'ShipItHQ is an interview preparation and portfolio platform for computer science students and software engineers.',
        breadcrumb: crumbs['@id'],
    }),
    '@type': 'AboutPage',
    mainEntity: { '@id': ORG_ID },
}

export default function AboutUsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(page)} />
            <AboutUsClient />
        </>
    )
}
