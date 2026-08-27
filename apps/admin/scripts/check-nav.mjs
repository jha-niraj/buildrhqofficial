/**
 * Fails if any path in `lib/navigation.ts` has no route behind it.
 *
 * ── Why this exists here ──
 *
 * `plan/admin/overview.md` records that this console "links to 11 routes that do not exist",
 * and definition-of-done 5 is "Every nav link resolves. Clicking through every item in the
 * sidebar, in both roles, produces zero 404s." A click-through is not a check anybody re-runs,
 * so ADM-3 was left open on it. This is the same rule expressed as something that fails.
 *
 * It is a port of `apps/main/scripts/check-nav.mjs`, which exists for the same reason and was
 * written after two dead nav entries shipped there. Ported rather than shared: the two configs
 * have the same `path:` shape by coincidence of style, not by a contract, and a shared script
 * would need a package and a build step to earn its keep. The duplication is 100 lines and the
 * alternative is a dependency between two apps that have none.
 *
 * ── Why it parses the file instead of importing it ──
 *
 * `lib/navigation.ts` is TypeScript and imports lucide icons, so plain `node` cannot load it
 * without a build step. The only thing this check needs is the `path:` strings, and a regex
 * gets those with no toolchain at all.
 *
 * ── Route groups ──
 *
 * `(group)` segments do not appear in the URL. Every console route lives under
 * `app/(console)/`, so *every* path in this config depends on that being handled - unlike in
 * apps/main, where it mattered for one entry. Resolution walks the tree and treats a
 * `(group)` directory as transparent.
 *
 * Run: `pnpm check-nav`
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const APP = join(root, "app")

/** Every `path: '...'` in the nav config, in file order. */
function navPaths() {
	const src = readFileSync(join(root, "lib", "navigation.ts"), "utf8")
	return [...src.matchAll(/\bpath:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
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

// ── Literal, not dynamic. This distinction IS the check ──
//
// A path that only matches a `[dynamic]` segment renders that page's not-found, which reads as
// a broken record rather than a broken link - so the failure is disguised, which is worse than
// a plain 404. apps/main shipped exactly that (`ai/resume/cover-letter` swallowed by
// `ai/resume/[username]`) and its version of this script passed on it until the literal rule
// was added. A check that passes on the bug it exists to catch is worse than no check.
//
// Every path in the admin config is a fixed destination; none is meant to be dynamic.
const paths = navPaths()
const dead = []
const dynamicOnly = []

for (const p of paths) {
	const segments = p.split("/").filter(Boolean)
	if (resolves(APP, segments, { literal: true })) continue
	if (resolves(APP, segments, { literal: false })) dynamicOnly.push(p)
	else dead.push(p)
}

if (dead.length > 0 || dynamicOnly.length > 0) {
	console.error(`\ncheck-nav: ${dead.length + dynamicOnly.length} navigation path(s) are wrong.\n`)
	for (const p of dead) {
		console.error(`  /${p}  - no route at all`)
	}
	for (const p of dynamicOnly) {
		console.error(`  /${p}  - only matches a [dynamic] segment, so it renders that page's`)
		console.error(`  ${" ".repeat(p.length)}    not-found instead of the page you meant`)
	}
	console.error(`\nEvery path in lib/navigation.ts must resolve to its own page.tsx under app/.\n`)
	process.exit(1)
}

console.log(`check-nav: all ${paths.length} navigation paths resolve literally.`)
