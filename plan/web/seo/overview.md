# SEO - overview

## What this is

`apps/web` already has more SEO than most sites at this stage: a dynamic sitemap,
a robots file that explicitly welcomes AI crawlers, generated OG cards, an
`active-posts.ts` publish gate, and a blog whose structured data is genuinely
good. This is not a rescue job.

It is an **unevenness** job. The blog was built carefully and the marketing pages
were not, so the pages a buyer lands on carry a fraction of the signal the blog
posts do - and one of the signals they do carry is a schema type that will fail
Google's validator.

## What is already right - do not redo these

Established by reading the repo, so that nobody spends a day rebuilding them:

| thing | state |
|---|---|
| AI crawler access | **Correct.** `robots.ts` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended. This is the veto condition for AI visibility - block these and the score is zero regardless of content |
| Blog structured data | **Strong.** `blogs/[slug]` emits Article, BreadcrumbList, FAQPage, Person, Organization, ImageObject, WebPage |
| Pricing FAQ schema | Present - FAQPage with Question/Answer |
| Sitemap + robots | Both dynamic, with the drafts gate wired through `active-posts.ts` |
| OG cards | Generated 1200x630 at build time per post |
| Organization / WebSite nodes | Present in `layout.tsx` with `@id`s, and `sameAs` links |
| Not fabricating ratings | The existing comment already refuses to invent an `aggregateRating`. That instinct is right and must survive the fix in SEO-2 |

## Definition of done

1. **No structured data on the site fails Google's Rich Results Test.** Every page
   validates, and no type is claimed whose required properties are absent.

2. **One entity graph.** `Organization` and `WebSite` are emitted once site-wide;
   every other node references them by `@id` rather than restating them. Adding a
   page does not mean re-declaring the company.

3. **Every marketing page carries the structured data its content earns** -
   breadcrumbs where there is a hierarchy, FAQPage where there are questions - and
   no page carries a type it cannot support.

4. **Every public page has a canonical, a title under 60 characters and a
   description that states a differentiator**, produced by one shared helper
   rather than hand-written per page.

5. **The site is built to be cited, not only ranked.** Answer-first structure,
   comparison tables, sourced statistics, dated content, and an About page that
   defines the entity in its first sentence.

6. **A keyword map exists, built from real data**, and every money page targets a
   phrase from it. No page is optimised for a term nobody searches.

7. **Content clusters link deliberately.** Pillar pages and their supporting posts
   point at each other on purpose, not by accident of writing order.

8. **Measurement is set up before the work, not after.** GSC verified, a baseline
   recorded, and a named metric per objective.

## Out of scope

- **Paid tools.** The plan assumes GSC and free sources. If DataForSEO or Ahrefs
  is available, `04-keyword-strategy.md` gets better, but it must not be blocked
  on one.
- **Link building outreach.** A real channel, and a different discipline from
  what is in this repo.
- **The product app's SEO.** `apps/main` is behind auth and should stay out of the
  index.
- **Rewriting the blog's technical SEO.** It is the part that is already right.
- **Local SEO.** Gurukul's strategy leans on Nepal's Local Pack. This product is
  global and has no premises a searcher wants to find.

## The strategic difference from the reference

Worth stating up front, because copying gurukul's *strategy* would be a mistake
even though copying its *implementation* is not.

Gurukul's controlling insight is that **Nepal has almost no search volume** for
school software, so the play is to own a tiny SERP completely and win the Local
Pack.

ShipItHQ has the opposite problem. "Leetcode alternatives", "system design
interview prep", "how to become a software engineer" have enormous volume and are
defended by LeetCode, GeeksforGeeks, NeetCode, educative.io and a decade of
accumulated authority. Volume is not the constraint; **difficulty is**.

So the strategy inverts:

| gurukul | shipithq |
|---|---|
| Tiny SERP, own all of it | Vast SERP, own a defensible slice of it |
| Head terms are winnable | Head terms are not winnable this year |
| Local Pack matters | Irrelevant - no premises |
| 22 posts is broad coverage | 22 posts is a rounding error against GeeksforGeeks |
| Differentiator: published NPR pricing | Differentiator: a real Linux container that runs your code |

The consequence, and it should shape every task in `04` and `05`: **compete on
specificity and proof, not coverage.** Long-tail queries where a generic answer
is unsatisfying, comparison queries where an honest table beats a listicle, and
AI answer engines where being *quotable* matters more than being ranked first.

## Decisions

| decision | why | who |
|---|---|---|
| Fix the schema type before adding more schema | A validation error on the homepage taints the domain's structured data in the eyes of the validator | this plan |
| Do not chase head terms in year one | LeetCode and GeeksforGeeks are not displaceable with 22 posts. Spending the budget there buys nothing | this plan |
| AEO is a first-class objective, not a bonus | The audience asks ChatGPT before it asks Google, and AI Overviews already sit above the results this site would rank in | this plan |
| Never fabricate ratings, reviews or statistics | Google's spam policy, and it risks a manual action on the whole domain. The existing code already refuses to; keep it that way | existing code, upheld |
| Research gate on every keyword and competitor claim | Same rule as `../polish/01-content-truth.md`. A keyword map from memory is fiction | this plan |
