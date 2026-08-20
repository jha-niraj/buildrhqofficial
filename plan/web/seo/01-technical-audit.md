# 01 - Technical audit

**Serves:** definition of done 1, 3, 4
**Reference:** `srs/seo/01-technical-seo-checklist.md`, `srs/seo/11-cloudflare-workers-seo.md`

Everything below was read out of the repo. Where a claim needed checking, the file
and line are given so the next reader can re-check rather than trust.

## Finding 1 - the homepage claims a schema type it cannot support

**Severity: high. Fix first.**

`apps/web/app/layout.tsx:153` emits a site-wide `SoftwareApplication` node with
`name`, `offers.price` and no `aggregateRating` and no `review`.

Google's rich-result requirements for `SoftwareApplication` are `name` +
`offers.price` + **either `aggregateRating` or `review`**. Two of three are
present, so the node is a rich-result candidate that fails validation on every
page that inherits the root layout - which is every page on the site.

The existing comment at `layout.tsx:125` shows the reasoning got halfway:

> Deliberately NO aggregateRating here: Google's structured data policy requires
> ratings to come from real, on-page user reviews, and inventing one is a fast
> route to a manual action.

That is correct and must not be reversed. What it misses is the consequence:
having refused the rating, the *type* is now the wrong one to claim.

The reference hit this exact issue and documented the resolution in
`gurukulhq/apps/web/lib/schema.ts`, discovered through an Ahrefs site audit that
reported "Structured data has Google rich results validation error: 3". Its fix:

- `Service` describes the same thing accurately - a subscription service - and
  carries the offer and feature information for AI answer engines and Bing
- `Service` is **not a Google rich-result type**, so nothing is validated and
  nothing errors
- `featureList` is only valid on `SoftwareApplication`; an `OfferCatalog` of
  nested services is the schema.org-correct way to enumerate what a service
  includes
- If real reviews are ever collected, switch back to `SoftwareApplication` **and**
  add a genuine `aggregateRating` in the same change - never one without the other

-> `SEO-1` in `tasks.md`.

## Finding 2 - the marketing pages carry almost no structured data

The blog is well covered. The pages a buyer actually lands on are not.

| page | structured data today |
|---|---|
| `/blogs/[slug]` | Article, BreadcrumbList, FAQPage, Person, Organization, ImageObject, WebPage |
| `/pricing` | FAQPage (Question / Answer) |
| `/` (landing) | **none of its own** - only the root layout's nodes |
| `/aboutus` | **none** |
| landing FAQ section | **none** - the component emits no JSON-LD at all |

The landing FAQ is the cheapest win on the list: the questions and answers already
exist as rendered content, and FAQPage markup is the format AI Overviews lift most
readily. It is currently pure markup debt.

`/aboutus` matters more than it looks. It is the page an AI system reads to decide
what the entity *is*, and it is emitting nothing.

-> `SEO-3`, `SEO-4`.

## Finding 3 - no shared schema or metadata helper

Structured data is written inline per page. There is no `lib/schema.ts` and no
`pageMeta()` equivalent.

The consequences are the usual ones: the Organization definition gets restated
instead of referenced, page titles drift in length and format, and a change to the
company description means finding every copy of it.

The reference has both (`lib/schema.ts` 81 lines, `lib/seo.ts` 69 lines) and they
are small enough to port in an afternoon. The pattern worth taking is the shared
`@id`: `ORG_ID`, `WEBSITE_ID` declared once, referenced everywhere.

-> `SEO-2`, `SEO-5`.

## Finding 4 - no agent-facing surface

The reference exposes, under `apps/web/app/.well-known/`:

- `agents/index.json` - what agents can do here
- `agent-skills/[skill]/SKILL.md` - per-skill descriptions
- `api-catalog` - RFC 9727 style catalogue

and negotiates **markdown representations of pages** by `Accept` header
(`lib/accept-markdown.ts`), so an agent that asks for `text/markdown` gets clean
markdown instead of parsing HTML.

That file is worth reading before porting, because it documents the trap in both
directions: too eager and a *browser* gets served markdown - Chrome's Accept
header carries `*/*`, so a naive "is markdown acceptable" check matches every
visitor; too shy and the agents it exists for never see it. Its rule: serve
markdown only when the client asked for it explicitly by name and weighted it at
least as highly as HTML. A wildcard never counts.

This is speculative surface area - the standards are young. It is scoped low
priority for that reason, not because it is uninteresting.

-> `SEO-10`, `SEO-11`.

## Finding 5 - things to verify, not yet findings

Listed so they are checked rather than assumed. None of these is a claim yet.

- **Canonicals.** Confirm every public page emits one and that it is absolute.
- **Title and description lengths.** Titles under ~60 chars, descriptions ~150-160
  and stating a differentiator rather than a summary.
- **Sitemap contents.** Confirm it lists exactly the live pages: no drafts, no
  redirect targets, no `/api`.
- **Core Web Vitals.** Shares the baseline run with `../polish/06-performance.md`
  (`WEB-50`) - run it once, use it for both.
- **The redirect posture.** `robots.ts` notes that auth/product paths are 307s to
  the app and deliberately not disallowed. Confirm the app deploy keeps itself out
  of the index, because this file is relying on it.
- **Cloudflare Workers gotchas.** `srs/seo/11-cloudflare-workers-seo.md` exists in
  this repo. Read it and confirm its items still hold on the current adapter.

-> `SEO-6` through `SEO-9`.
