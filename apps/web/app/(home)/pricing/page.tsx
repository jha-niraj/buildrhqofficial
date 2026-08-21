import type { Metadata } from 'next'
import PricingClient from './_components/pricing-client'
import { pricingFaqs } from './_components/pricing-faqs'
import { SITE } from '@/lib/site'
import { pageMeta } from '@/lib/seo'
import { faqSchema, breadcrumbSchema, webPageSchema, jsonLd } from '@/lib/schema'

export const metadata: Metadata = pageMeta({
    title: 'Pricing - Credits, Not Subscriptions',
    description:
        'Credit-based pricing with no subscription and no idle-time charges. 100 free credits at signup, no card, and credits never expire. Each operation shows its cost first.',
    path: '/pricing',
})

// FAQ rich-result data, built from the same list the page renders.
const pricingFaqSchema = faqSchema(pricingFaqs.map((f) => ({ question: f.q, answer: f.a })))

const crumbs = breadcrumbSchema([], { name: 'Pricing', path: '/pricing' })

const page = webPageSchema({
    url: `${SITE}/pricing`,
    name: 'Pricing',
    description: 'What credits cost and what each operation spends.',
    breadcrumb: crumbs['@id'],
})

export default function PricingPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(pricingFaqSchema)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(page)} />
            <PricingClient />
        </>
    )
}
