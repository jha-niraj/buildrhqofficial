import type { Metadata } from 'next'
import { publishedPosts } from '@/content/blog'
import { SITE, BRAND } from '@/lib/site'
import BlogsClient from './_components/BlogsClient'

// 38 chars. The template appends " | ShipItHQ" (11), so this must stay under 49 or
// Google truncates the end - which is where the differentiator lives.
const TITLE = 'Developer Blog: Interviews & Careers'
const DESCRIPTION =
    'Practical guides on engineering careers, interview prep, DSA, system design, portfolios and resumes, for CS students and working engineers.'

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${SITE}/blogs` },
    openGraph: {
        type: 'website',
        url: `${SITE}/blogs`,
        siteName: BRAND.name,
        title: `${TITLE} | ${BRAND.name}`,
        description: DESCRIPTION,
    },
    twitter: {
        card: 'summary_large_image',
        title: `${TITLE} | ${BRAND.name}`,
        description: DESCRIPTION,
    },
}

export default function BlogsPage() {
    const blogSchema = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `${BRAND.name} Blog`,
        description: DESCRIPTION,
        url: `${SITE}/blogs`,
        publisher: {
            '@type': 'Organization',
            name: BRAND.name,
            url: SITE,
            logo: { '@type': 'ImageObject', url: BRAND.logo },
        },
        blogPost: publishedPosts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            url: `${SITE}/blogs/${post.slug}`,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
        })),
    }

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blogs` },
        ],
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <BlogsClient posts={publishedPosts} />
        </>
    )
}
