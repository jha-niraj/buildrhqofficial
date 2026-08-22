/**
 * Fails if any destination in `lib/ai/destinations.ts` has no route behind it.
 *
 * Same reasoning as check-nav.mjs, which this shares its resolver with: a wrong path in a
 * table has no symptom until somebody taps it. The difference is who taps it - here the path
 * is handed to a user by the ASSISTANT, as a button, in the middle of an answer. A dead one
 * makes the product look like it is making things up, which is the exact impression the
 * `link_to` design exists to avoid.
 *
 * Literal resolution only, for the same reason as the nav check: a path that only matches a
 * [dynamic] segment renders that page's not-found, and passing on it would defeat the point.
 *
 * Run: `pnpm check-destinations`
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const APP = join(root, "app")

function destinations() {
    const src = readFileSync(join(root, "lib", "ai", "destinations.ts"), "utf8")
    return [...src.matchAll(/id:\s*"([^"]+)",\s*\n\s*href:\s*"([^"]+)"/g)].map((m) => ({
        id: m[1],
        href: m[2],
    }))
}

/**
 * Does `segments` resolve to a page, starting from directory `dir`?
 *
 * `literal` decides whether `[dynamic]` directories may be used. Nav destinations must
 * resolve LITERALLY - see the note below on why matching them dynamically defeats the check.
 * `(group)` and `@parallel` directories are transparent either way.
 */
function resolves(dir, segments, { literal }) {
    if (!existsSync(dir)) return false

    if (segments.length === 0) {
        return ["page.tsx", "page.ts", "page.jsx", "page.js"].some((f) => existsSync(join(dir, f)))
    }

    const [head, ...rest] = segments
    const entries = readdirSync(dir).filter((e) => statSync(join(dir, e)).isDirectory())

    if (entries.includes(head) && resolves(join(dir, head), rest, { literal })) return true

    if (!literal) {
        // A dynamic segment swallows one path segment: [slug], [...slug], [[...slug]].
        for (const e of entries) {
            if (e.startsWith("[") && resolves(join(dir, e), rest, { literal })) return true
        }
    }

    // Route groups and parallel routes do not consume a segment.
    for (const e of entries) {
        if ((e.startsWith("(") || e.startsWith("@")) && resolves(join(dir, e), segments, { literal })) return true
    }

    return false
}

const rows = destinations()
if (rows.length === 0) {
    console.error("check-destinations: parsed zero destinations - the regex no longer matches.")
    process.exit(1)
}

const bad = []
for (const d of rows) {
    const segments = d.href.split("/").filter(Boolean)
    if (resolves(APP, segments, { literal: true })) continue
    const dynamicOnly = resolves(APP, segments, { literal: false })
    bad.push({ ...d, dynamicOnly })
}

if (bad.length > 0) {
    console.error(`\ncheck-destinations: ${bad.length} assistant destination(s) are wrong.\n`)
    for (const b of bad) {
        console.error(
            `  ${b.id}  ->  ${b.href}  - ${b.dynamicOnly ? "only matches a [dynamic] segment" : "no route at all"}`,
        )
    }
    console.error(`\nThe assistant offers these to users as buttons. Every one must resolve.\n`)
    process.exit(1)
}

console.log(`check-destinations: all ${rows.length} assistant destinations resolve literally.`)
