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
| SEO-7 | Title + description audit | 4 | not started |
| SEO-8 | Sitemap contents audit | 1 | **done (2026-08-20/21)** |
| SEO-9 | Re-check `srs/seo/11-cloudflare-workers-seo.md` against the current adapter | 1 | not started |
| **Research** | | | |
| SEO-30 | Build the keyword map | 6 | not started |
| SEO-20 | Citation gap analysis across ChatGPT / Perplexity / AI Overviews | 5 | not started |
| SEO-40 | Map the 22 existing posts to clusters | 7 | not started |
| SEO-43 | Content gap analysis vs competitors | 7 | not started |
| **AEO** | | | |
| SEO-21 | Answer-first rewrites | 5 | not started |
| SEO-22 | Comparison tables with sourced cells | 5 | not started |
| SEO-23 | Source every statistic, or delete it | 5 | not started |
| SEO-24 | Entity definition + schema on `/aboutus` | 5 | **done (2026-08-21)** |
| SEO-25 | Author credentials and Person schema | 5 | not started |
| SEO-26 | Visible published + updated dates | 5 | not started |
| **Content structure** | | | |
| SEO-41 | Write the pillar pages | 7 | not started |
| SEO-42 | `lib/internal-links.ts` | 7 | not started |
| SEO-44 | Resolve pillar vs topic-hub targeting | 7 | not started |
| **Agent surface (low priority)** | | | |
| SEO-10 | `.well-known/agents` + `agent-skills` | 5 | not started (speculative) |
| SEO-11 | Markdown content negotiation by Accept header | 5 | not started (speculative) |

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
