import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import fs from 'fs'
import path from 'path'

/**
 * Wrap every table in a scroll container.
 *
 * A markdown table has nowhere to hang a wrapper of its own, and the widest one on the
 * site is six columns - it cannot fit a 360px screen at a readable size. Without this the
 * whole document scrolls sideways, which is the failure `docs/responsiveness.md` names:
 * an overflow that becomes the page's problem instead of the element's.
 *
 * A regex over generated HTML is normally the wrong tool, but the input here is not
 * arbitrary HTML - it is remark's own output, which emits `<table>` and `</table>` exactly
 * once per table with no attributes and no nesting (GFM has no nested tables). The
 * alternative is a rehype plugin and two more dependencies to do one string replacement.
 *
 * The styling lives in `.blog-content .table-scroll` in `@repo/ui`'s globals.css.
 */
function wrapTables(html: string): string {
    return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => `<div class="table-scroll">${table}</div>`)
}

export async function getPostContent(slug: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'content', 'posts', `${slug}.md`)
    if (!fs.existsSync(filePath)) return ''
    const raw = fs.readFileSync(filePath, 'utf-8')
    // sanitize: false so the inline SVG diagrams in the posts survive. The input is our
    // own markdown in the repo, never user submissions.
    const result = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(raw)
    return wrapTables(result.toString())
}
