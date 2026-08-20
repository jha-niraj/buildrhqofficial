# 02 - Structured data

**Serves:** definition of done 1, 2, 3
**Reference:** `gurukulhq/apps/web/lib/schema.ts`, `components/seo/breadcrumb-jsonld.tsx`
**Local reference:** `srs/seo/06-json-ld-schemas.md`

## The principle

Structured data is a set of **claims about entities**, and the two failure modes
are opposite:

- claiming a type whose required properties are missing (Finding 1 in the audit)
- restating the same entity on every page instead of referencing it once

Both are fixed by the same move: one entity graph, declared once, referenced by
`@id`.

## The target graph

```
Organization  #organization   emitted once, root layout          [exists]
WebSite       #website        emitted once, root layout          [exists]
Service       #service        replaces SoftwareApplication       [SEO-1]
   -> offers            AggregateOffer / Offer per plan
   -> hasOfferCatalog   OfferCatalog of nested Services
   -> provider          @id -> #organization

Per page, as the content earns it:
BreadcrumbList  any page with a hierarchy      [SEO-3]
FAQPage         any page with real Q&A         [SEO-4]
Article         blog posts                     [exists]
Person          author bios                    [exists on posts]
```

Nothing else without a reason. Schema is not a scoring system where more types
win; a wrong or unsupported type is worse than an absent one.

## SEO-1 - `SoftwareApplication` -> `Service`

The audit explains why. Two rules for the implementation:

**Keep the anti-fabrication comment.** It is the reason the code is currently
honest, and the fix must read as "we chose the accurate type", not "we removed the
thing that was failing".

**Do not use `featureList`.** It is only valid on `SoftwareApplication`. Enumerate
capabilities as an `OfferCatalog` of nested `Service` nodes.

Write the reversal condition into the comment: if real, verifiable reviews are
ever collected, switch back to `SoftwareApplication` **and** add a genuine
`aggregateRating` in the same change - never one without the other.

**Verification:** the homepage passes the Rich Results Test with zero errors, and
no page emits `SoftwareApplication`.

## SEO-2 - `lib/schema.ts`

Port the shape from the reference:

```ts
export const ORG_ID     = `${SITE}/#organization`
export const WEBSITE_ID = `${SITE}/#website`
export const SERVICE_ID = `${SITE}/#service`

export function serviceSchema({ description, url, offers, features }) { ... }
export function breadcrumbSchema(trail: { name: string; item: string }[]) { ... }
export function faqSchema(faqs: { q: string; a: string }[]) { ... }
```

The blog already builds Article and BreadcrumbList inline and correctly. Move it
here only if it comes out cleaner - a working thing does not need to be refactored
to prove a point.

**Verification:** `grep -rn '"@id"' apps/web/app` shows references, not
re-declarations, outside the root layout.

## SEO-3 - Breadcrumbs on marketing pages

The blog has them; the marketing pages do not. Add `BreadcrumbList` wherever there
is a real hierarchy - `/features/[area]`, `/compare/[competitor]`, `/blogs/topics/[topic]`.

Do not add breadcrumbs to flat pages. A breadcrumb of one item is noise.

**Depends on:** the Features and Compare pages existing (`../polish/tasks.md`
`WEB-10`, `WEB-11`).

## SEO-4 - FAQPage on the landing FAQ

The cheapest task in this file. The landing page renders an FAQ accordion and
emits no JSON-LD for it. The questions and answers already exist.

Two rules: the markup must match the **visible** text exactly - marking up
questions a visitor cannot see is a spam-policy violation - and one FAQPage node
per page, not one per question.

**Verification:** Rich Results Test detects the FAQ on `/`, and every marked-up
question appears on screen.

## SEO-5 - `lib/seo.ts` and `pageMeta()`

One helper producing title, description, canonical, OG and Twitter tags from a
small input. Titles under 60 characters. Descriptions state a differentiator, not
a summary - the reference's note is worth carrying: front-load the target phrase
and write the description as a promise plus a differentiator, because those are
the things competitors do not state and therefore what earns the click.

For this product the differentiators worth putting in descriptions are the ones
that are true and rare: code that runs in a real Linux container, resumes tailored
from your actual resume rather than a form, mock interviews with a voice agent.

**Verification:** every public page's metadata comes from `pageMeta()`; no
hand-written `<title>` remains.

## What NOT to add

Recorded so it does not get proposed later:

- **`aggregateRating` / `Review`** - not until real, on-page, verifiable reviews
  exist. Fabricating them risks a manual action on the whole domain.
- **`Course`** - tempting for the practice content, but it has requirements
  (provider, and increasingly instructor and schedule) that this product does not
  meet. Claiming it invites the same failure as `SoftwareApplication`.
- **`JobPosting`** - the jobs module is not a job board and does not publish
  postings this site owns.
- **`HowTo`** - Google deprecated its rich result. Harmless but pointless.
- **`SearchAction` / sitelinks searchbox** - only if a real site search exists.
