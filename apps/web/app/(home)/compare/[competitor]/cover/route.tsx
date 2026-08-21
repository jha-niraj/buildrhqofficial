import { versusImage, OG_SIZE } from '@/lib/og'
import { COMPARISON_SLUGS, getComparison } from '../../_components/comparisons'

/**
 * The generated cover for one comparison, at a URL that does not move.
 *
 * Same reasoning as the blog's `cover` route: Next serves metadata images from a
 * content-hashed path, which is right for a social card and unusable as an `<img src>`.
 * The index cards need a URL somebody can write down, so this is a route handler.
 *
 * `force-static` plus `generateStaticParams` means all ten render at BUILD time and are
 * served from the assets CDN.
 */

export const dynamic = 'force-static'

export function generateStaticParams() {
    return COMPARISON_SLUGS.map((competitor) => ({ competitor }))
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ competitor: string }> },
) {
    const { competitor } = await params
    const c = getComparison(competitor)

    if (!c) {
        return versusImage({
            against: 'the alternatives',
            stance: 'Honest comparisons, and we will tell you when to use the other one.',
            glyph: 'list',
        })
    }

    return versusImage({ against: c.name, stance: c.stance, glyph: c.glyph })
}

export const coverSize = OG_SIZE
