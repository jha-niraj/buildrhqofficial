# SEO - tasks

Derived from `overview.md`. Every task traces to a line in the definition of done.

**Nothing here has been started.** This is the plan.

## Order

`SEO-50` (measurement) is **first**, before any change. Without a baseline there is
no way to tell whether the work did anything.

Then `SEO-1` (the schema type), because it is a live validation error on every
page and the fix is small and self-contained.

Then research (`SEO-30`, `SEO-20`, `SEO-40`) before content, because content
written before the research is content written from guesses.

## Status at a glance

| ID | Task | Serves | Status |
|---|---|---|---|
| **Measure first** | | | |
| SEO-50 | Set up GSC + Bing, record the day-zero baseline | 8 | **BLOCKED - needs Niraj's GSC/Bing access** |
| **Structured data** | | | |
| SEO-1 | `SoftwareApplication` -> `Service` | 1 | **done (2026-08-21)** |
| SEO-2 | `lib/schema.ts` - shared entity graph with `@id`s | 2 | **done (2026-08-21)** |
| SEO-3 | BreadcrumbList on marketing pages | 3 | **done (2026-08-21)** |
| SEO-4 | FAQPage on the landing FAQ | 3 | **done (2026-08-20, in WEB-33)** |
| SEO-5 | `lib/seo.ts` + `pageMeta()` | 4 | **done (2026-08-21)** |
| **Technical** | | | |
| SEO-6 | Canonical audit across public pages | 4 | **done (2026-08-21)** |
| SEO-7 | Title + description audit | 4 | **done (2026-08-21)** |
| SEO-8 | Sitemap contents audit | 1 | **done (2026-08-20/21)** |
| SEO-9 | Re-check `srs/seo/11-cloudflare-workers-seo.md` against the current adapter | 1 | **done (2026-08-21) - all clear** |
| **Research** | | | |
| SEO-30 | Build the keyword map | 6 | **BLOCKED - no keyword data source** |
| SEO-20 | Citation gap analysis across ChatGPT / Perplexity / AI Overviews | 5 | **BLOCKED - needs live engine access** |
| SEO-40 | Map the 22 existing posts to clusters | 7 | **done (2026-08-21) - 30 posts, 7 clusters** |
| SEO-43 | Content gap analysis vs competitors | 7 | **partial - see note** |
| **AEO** | | | |
| SEO-21 | Answer-first rewrites | 5 | **done for new posts + FAQs (2026-08-21)** |
| SEO-22 | Comparison tables with sourced cells | 5 | **done (2026-08-20, in WEB-11)** |
| SEO-23 | Source every statistic, or delete it | 5 | **done (2026-08-21)** |
| SEO-24 | Entity definition + schema on `/aboutus` | 5 | **done (2026-08-21)** |
| SEO-25 | Author credentials and Person schema | 5 | **already correct - verified 2026-08-21** |
| SEO-26 | Visible published + updated dates | 5 | **already correct - verified 2026-08-21** |
| **Content structure** | | | |
| SEO-41 | Write the pillar pages | 7 | **resolved as NOT NEEDED - see SEO-44** |
| SEO-42 | `lib/internal-links.ts` | 7 | **done (2026-08-21) - found a live orphan** |
| SEO-44 | Resolve pillar vs topic-hub targeting | 7 | **resolved (2026-08-21): hubs ARE the pillars** |
| **Agent surface (low priority)** | | | |
| SEO-10 | `.well-known/agents` + `agent-skills` | 5 | **not doing - see note** |
| SEO-11 | Markdown content negotiation by Accept header | 5 | **not doing - see note** |

## Dependencies

```
SEO-50 ─> everything (baseline first)

SEO-1 ─> SEO-2 ─> SEO-3, SEO-4
SEO-5 ─> SEO-7

SEO-30 ─> SEO-41, SEO-43, SEO-44
SEO-20 ─> SEO-21, SEO-22
SEO-40 ─> SEO-41 ─> SEO-42

../polish WEB-1  ─> SEO-23  (no sourcing a claim about a deleted feature)
../polish WEB-11 ─> SEO-22  (Compare pages before comparison schema)
../polish WEB-50 ─> SEO-50  (one Lighthouse run serves both)
```

---

## Measure first

### SEO-50 - Baseline

**Status:** not started
**Serves:** DoD 8
**Blocks:** everything

GSC verified, sitemap submitted, Bing Webmaster set up (ChatGPT's browsing uses
Bing's index). Record the day-zero numbers into the template at the end of
`06-measurement.md`, **in the repo, with the date**.

Includes the first AI citation snapshot (ten queries, three engines).

**Verification:** the baseline block in `06-measurement.md` is filled in.

---

## Structured data

### SEO-1 - `SoftwareApplication` -> `Service`

**Status:** not started
**Serves:** DoD 1

`apps/web/app/layout.tsx:153` emits `SoftwareApplication` with `name` and
`offers.price` but no `aggregateRating` and no `review`. Google requires one of
the latter two, so this fails validation on every page inheriting the root layout.

Switch to `Service`, which describes the product accurately, carries the offer and
feature information, and is not a Google rich-result type.

- Keep the existing anti-fabrication comment - it is the reason the code is
  currently honest.
- Do **not** use `featureList` (SoftwareApplication-only). Use an `OfferCatalog`
  of nested `Service` nodes.
- Write the reversal condition into the comment: real reviews and a genuine
  `aggregateRating` land together or not at all.

**Verification:** Rich Results Test on `/` shows zero errors; GSC structured-data
errors trend to zero; no page emits `SoftwareApplication`.

### SEO-2 - `lib/schema.ts`

**Status:** not started
**Serves:** DoD 2
**Blocked by:** SEO-1

`ORG_ID` / `WEBSITE_ID` / `SERVICE_ID`, plus builders for service, breadcrumb and
FAQ nodes. Reference by `@id`; never restate the Organization.

Leave the blog's working inline Article/BreadcrumbList alone unless moving it
comes out cleaner.

### SEO-3 - Breadcrumbs on marketing pages

**Status:** not started
**Serves:** DoD 3
**Blocked by:** SEO-2, and `../polish` WEB-10 / WEB-11

Only where a real hierarchy exists. A one-item breadcrumb is noise.

### SEO-4 - FAQPage on the landing FAQ

**Status:** not started
**Serves:** DoD 3

The cheapest task here. The landing FAQ renders questions and answers and emits no
JSON-LD.

Markup must match the **visible** text exactly - marking up hidden questions is a
spam-policy violation. One FAQPage node per page.

**Verification:** Rich Results Test detects the FAQ on `/`; every marked question
is on screen.

### SEO-5 - `pageMeta()`

**Status:** not started
**Serves:** DoD 4

One helper for title, description, canonical, OG, Twitter. Titles under 60 chars;
descriptions front-load the phrase and state a differentiator.

---

## Technical

### SEO-6 / SEO-7 / SEO-8 - Audits

**Status:** not started
**Serves:** DoD 4, 1

Canonicals present and absolute. Titles and descriptions within length and
non-duplicated. Sitemap lists exactly the live pages - no drafts, no redirect
targets, no `/api`.

### SEO-9 - Workers SEO re-check

**Status:** not started
**Serves:** DoD 1

`srs/seo/11-cloudflare-workers-seo.md` exists in this repo. Confirm each item still
holds on the current OpenNext adapter, and note anything that has changed.

---

## Research

### SEO-30 - Keyword map

**Status:** not started
**Serves:** DoD 6
**Blocks:** SEO-41, SEO-43, SEO-44

Follow the method in `04-keyword-strategy.md`. Output a dated table with a source
per number. **A number without a source gets deleted at the next review.**

Respect the difficulty reality: do not map a money page to a term owned by
LeetCode or GeeksforGeeks.

### SEO-20 - Citation gap analysis

**Status:** not started
**Serves:** DoD 5
**Blocks:** SEO-21, SEO-22

Ten queries across ChatGPT, Perplexity and Google AI Overviews. Record who is
cited and what they have that we do not. Quarterly thereafter.

### SEO-40 - Cluster mapping

**Status:** not started
**Serves:** DoD 7

Map all 22 posts to slug -> cluster -> role. Orphans are information, not failure.

### SEO-43 - Content gap analysis

**Status:** not started
**Serves:** DoD 7
**Blocked by:** SEO-30, SEO-40

Split the output into competitor-gap posts (commercial intent) and AEO posts
(informational). Prioritised, each with a target phrase.

---

## AEO

### SEO-21 - Answer-first rewrites

**Status:** not started
**Serves:** DoD 5

First sentence after every H2 answers the H2. "X is Y" definitions for key terms.
A one-sentence definitional answer opening every post - AI Overviews lift these
verbatim.

### SEO-22 - Comparison tables

**Status:** not started
**Serves:** DoD 5
**Blocked by:** `../polish` WEB-11

Summary table near the top, verdict in the first 100 words, consistent
subheadings, **every cell sourced and dated**.

### SEO-23 - Source every statistic

**Status:** not started
**Serves:** DoD 5
**Blocked by:** `../polish` WEB-1

Numbers with named sources and dates. Unsourceable claims are **deleted**, not
softened.

### SEO-24 - `/aboutus` entity definition

**Status:** not started
**Serves:** DoD 5

First sentence names and classifies the entity. Organization + AboutPage schema by
`@id`. Then ask ChatGPT and Perplexity "what is ShipItHQ" and record the answer.

### SEO-25 / SEO-26 - Authority and freshness

**Status:** not started
**Serves:** DoD 5

Real author credentials in byline, schema and the linked profile, consistently.
Visible published and updated dates. An update policy that does not touch
timestamps on unchanged content.

---

## Content structure

### SEO-41 - Pillar pages

**Status:** not started
**Serves:** DoD 7
**Blocked by:** SEO-30, SEO-40

One per pillar, genuinely comprehensive. A pillar that is a list of links is thin
and will not hold a position.

### SEO-42 - `lib/internal-links.ts`

**Status:** not started
**Serves:** DoD 7
**Blocked by:** SEO-41

Cluster-derived links. Keep the rule: internal links point at `/blogs/<slug>`,
never product routes.

### SEO-44 - Pillar vs hub

**Status:** not started
**Serves:** DoD 7

Decide which page targets the broad phrase. Both targeting it is cannibalisation.
Coordinate with `../polish` WEB-41 (topic glyphs) - same topic set.

---

## Agent surface

### SEO-10 / SEO-11 - `.well-known` and markdown negotiation

**Status:** not started (speculative)
**Serves:** DoD 5

Port from the reference. **Read `lib/accept-markdown.ts` before implementing** -
it documents the trap in both directions, and the failure mode of getting it
wrong is serving raw markdown to every Chrome visitor.

Low priority: the standards are young and the payoff is unproven. Listed so the
option is recorded, not because it should be done soon.

---

# Execution log, 2026-08-21

Everything below was done in one pass. Where a task could not be completed to its own
verification bar, that is stated rather than the bar being lowered.

## Done

**SEO-1 `SoftwareApplication` -> `Service`.** It was a live validation failure on every
page inheriting the root layout, because the type requires `aggregateRating` or `review`
and had neither. `Service` describes the product accurately and has no required property
we would have to invent, which is the whole reason it is right. The old description also
advertised "open source tracking" - a module with tables and no route - so the site was
making a false claim inside its own machine-readable data.

**SEO-2 `lib/schema.ts`.** One entity graph. Two real defects found:

- `app/page.tsx` declared `WebSite` a second time with the SAME `@id` as the root layout.
  Two competing definitions of one entity. **I introduced that one myself** earlier in the
  same body of work, which is a fair demonstration of why the file needs to exist.
- The blog `Article` restated its publisher inline with no `@id`, making it an ANONYMOUS
  `Organization` alongside the real one. Now a reference. Verified: zero anonymous
  Organization nodes on an article page.

The anti-fabrication rule got teeth rather than just surviving: the reversal condition is
written into the file. Real reviews rendered on the page and a genuine `aggregateRating`
computed from them land in the SAME commit, or neither lands.

**SEO-3 BreadcrumbList + WebPage** on every marketing page, wired to the graph by `@id`.

**SEO-4 FAQPage on the landing page** - landed with WEB-33. `/pricing` had it and the
landing page did not, so nine good answers on the highest-authority page on the site were
invisible to the one rich result that quotes answers directly.

**SEO-5 / SEO-6 / SEO-7 `lib/seo.ts`.** 35 of 40 public pages exceeded Google's limits:
13 titles over 60 characters, 27 descriptions over 160. Every canonical was already
absolute, which was the one thing that was right.

The title constraint is invisible from the source, which is why they drifted: the template
appends `" | ShipItHQ"`, eleven characters, so a page title has 49 to work with - and the
part Google cuts is the end, where the differentiator lives. `pageMeta` warns in dev past
49 now. All 40 pages fit.

**SEO-8 sitemap.** `/features`, `/compare` and both comparison pages added, enumerated
from the same array the pages generate from so a new comparison cannot ship without
appearing. 47 URLs.

**SEO-9 Cloudflare Workers gotchas - all clear.** Re-checked `srs/seo/11` against the
current code:

| gotcha | state |
|---|---|
| `/_next/image` not edge-cached | `images: { unoptimized: true }` globally, so it is never used |
| `experimental.optimizeCss` breaks the build | not present |
| `proxy.ts` unsupported by the adapter | absent; no middleware at all |
| `public/_headers` silently ignored | absent; headers are in `next.config.mjs` |
| `dynamicParams` must be false on fs-reading routes | false on both dynamic blog routes |

The blog covers use a plain `<img>` rather than `next/image`, which turns out to be the
behaviour this document recommends - a prerendered PNG at a fixed size has nothing for the
optimiser to do, and routing it through `/_next/image` would add a Worker invocation per
card to re-encode an image already at its display size.

**SEO-21 answer-first.** All 13 new posts open with a definition or a direct answer in the
first two sentences, and every FAQ answer across the corpus answers in its first sentence
and stands alone without the question. That is the form assistants quote.

**SEO-22 comparison tables** - landed with WEB-11, and the source column is printed on the
page rather than hidden in a comment.

**SEO-23 statistics.** Five unsourced measurements deleted, all of them in the ORIGINAL
posts and all of them reading as researched:

- "over 98% of Fortune 500 companies use ATS software", attributed to a vendor that sells
  ATS optimisation, with no link
- "50-70% of candidates" eliminated by the aptitude round, plus three more rows of the
  same invented funnel table
- "60-70% of medium-difficulty interview problems"
- "15 core patterns that cover 90% of technical interview problems" - the taxonomy claim
  is defensible, the 90% is a measurement nobody took
- "ahead of 80% of candidates you are competing against"

**SEO-24 entity definition.** `/aboutus` opens with the definition in "X is Y" form,
standing alone in the first 150 words, and carries `AboutPage` schema with `mainEntity`
pointing at the Organization. The hero above it opens with an argument, which is right for
a human and useless to anything extracting what the product is.

**SEO-25 / SEO-26 were already correct.** `content/authors.ts` carries role, bio, `sameAs`
and `knowsAbout`, emitted as `Person` JSON-LD on every post; articles render both a visible
published date and a "Last updated" line. Verified rather than assumed, and not rebuilt.

**SEO-40 clusters.** 30 posts across 7 hubs: interview-prep 6, dsa 6, career 5, portfolio
4, resume 4, ai-tools 3, open-source 2. No hub below the 2-post threshold.

**SEO-42 `lib/internal-links.ts`.** It found a live orphan on its first run:
`system-design-interview-prep` had **zero** inbound `relatedSlugs`, because the WEB rewiring
updated its outbound links and nothing updated anything to point at it. Fixed; minimum
inbound is now 1 and no post is orphaned.

That asymmetry is the whole reason the module exists. Internal linking is the SEO lever
most within our control and the one that degrades silently, because a post with no inbound
links is still reachable, still in the sitemap, and still accumulating nothing.

**SEO-41 / SEO-44 - the pillar question, resolved as NO separate pillar pages.**

Two reasons specific to this site:

1. **A pillar and its hub would compete for the same query.** `/blogs/topics/dsa` and a
   hypothetical `/blogs/dsa-guide` both target "DSA interview preparation". Two of our own
   pages splitting one intent is cannibalisation, and the hub already exists, is already in
   every post's breadcrumb, and already collects the cluster.
2. **The hubs are thin, not the posts.** A pillar is worth building when the supporting
   posts are too granular to carry the head term. These posts run 1,400 to 2,650 words. The
   thin thing is the hub's own copy - a heading and one paragraph.

So the work a pillar page would have done is better spent making each hub a real page. That
is a change to `topics/[topic]/page.tsx`, not seven new routes. The decision is recorded in
`lib/internal-links.ts` as well, so it is discoverable from the code.

## Blocked, and why

**SEO-50 baseline - needs Niraj.** Google Search Console and Bing Webmaster both require
account access. Nothing else here depends on it, but it should be done before judging any
of this work, because there is currently no before.

**SEO-30 keyword map - no data source.** This task's own rule is that a keyword map from
memory is fiction. Ahrefs is configured as an MCP server but was not connected during this
session, and there is no other volume or difficulty source available. Writing plausible
numbers would be exactly the failure the research gate exists to prevent.

What CAN be done without data, and is worth doing when a source exists: every post already
carries a `keywords` array, and those are the candidate set. The missing half is volume,
difficulty and current position - which is also most of what makes the map useful.

**SEO-20 citation gap - needs live engines.** Requires running ten queries through ChatGPT,
Perplexity and Google AI Overviews and recording who gets cited. Not reachable from here.

**SEO-43 content gap - partial.** The gap analysis that could be done from the repo was
done, and it is what drove the 13 new posts: the clusters were lopsided at
interview-prep 5 and career 5 against dsa 2, portfolio 1, open-source 1 and ai-tools 1. The
half that is missing is competitor coverage, which needs the same data source as SEO-30.

## Not doing

**SEO-10 `.well-known/agents` and SEO-11 markdown content negotiation.** Both were filed as
speculative and both should stay unbuilt. There is no adopted specification for either,
`llms.txt` already exists and is generated from the blog data, and building against a
convention nobody has agreed on produces a file to maintain and no reader. Revisit only if
a specification is actually ratified and crawlers actually request it.
