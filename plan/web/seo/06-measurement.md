# 06 - Measurement

**Serves:** definition of done 8
**Reference:** `srs/seo/03-google-search-console.md`, the measurement section of
`gurukulhq/srs/seo/seo-strategy-2026.md`

## The rule

**Set up measurement before doing the work, not after.** Without a baseline there
is no way to tell whether three weeks of SEO changed anything, and the honest
answer to "did it work" becomes "it feels better", which is not an answer.

This file is `SEO-50`, and it is the **first task in the whole SEO plan** - before
the schema fix, before the content work.

## What to set up

### Google Search Console

Verified for the production domain, sitemap submitted. Then record a baseline on
day zero:

| metric | where |
|---|---|
| Total impressions, 28 days | Performance |
| Total clicks, 28 days | Performance |
| Average position | Performance |
| Indexed pages | Pages |
| Pages with structured data errors | Enhancements |
| Core Web Vitals status | Core Web Vitals |

That last one shares a run with `../polish/tasks.md` `WEB-50`. Do it once.

**The structured-data error count is the direct check on `SEO-1`.** If the
`SoftwareApplication` finding is right, it will show up here, and it should go to
zero after the fix. That is the cleanest before/after in this plan.

### Bing Webmaster Tools

Cheap to set up and worth it for one reason: **ChatGPT's browsing uses Bing's
index.** Bing visibility is a leading indicator for one of the AI engines this
plan targets.

### AI citation tracking

Not available in any console. The method is manual and is the one from
`03-aeo.md` `SEO-20`:

- ten target queries, asked of ChatGPT, Perplexity and Google
- record which domains are cited, and whether ours is
- re-run quarterly, same queries, same day of the quarter

A spreadsheet is sufficient. The point is the **trend** - a single snapshot says
nothing about whether the work is working.

Also record how the engines describe the brand when asked directly ("what is
ShipItHQ"). Sentiment and accuracy matter as much as presence: being described
wrongly is worse than not being described.

## What to measure per objective

| objective | metric | leading indicator |
|---|---|---|
| Structured data valid (DoD 1) | GSC structured-data errors = 0 | Rich Results Test on each page type |
| Marketing pages carry signal (DoD 3) | Impressions on non-blog pages | Pages indexed |
| Keyword map is real (DoD 6) | Ranking positions for mapped phrases | Impressions on those phrases |
| Clusters link deliberately (DoD 7) | Internal links per post; pillar impressions | Crawl depth to any post |
| Built to be cited (DoD 5) | Citations across ten tracked queries | Perplexity first - fastest to move |

## Cadence

| when | what |
|---|---|
| Day 0 | Baseline: GSC, Bing, CWV, AI citation snapshot |
| Weekly | GSC coverage and structured-data errors - these catch regressions fast |
| Monthly | Impressions, clicks, position on the mapped phrases |
| Quarterly | AI citation re-run; keyword map review; content gap refresh |

## The traps

**Vanity metrics.** Total impressions rise when a page starts ranking position 40
for a term nobody clicks. Track impressions **on mapped phrases**, not in
aggregate.

**Attributing too early.** SEO changes take weeks to show. A schema fix might show
in days; a content cluster will not show for a quarter. Do not conclude anything
from a fortnight.

**Measuring what is easy instead of what matters.** Position is easy and AI
citations are tedious, and for this audience the citations may matter more. Do the
tedious one.

**Forgetting the baseline exists.** Write the day-zero numbers into this file, in
the repo, with the date. A baseline in someone's browser history is not a
baseline.

## Baseline

To be filled by `SEO-50`.

```
Recorded: YYYY-MM-DD

GSC (28 days)
  impressions:
  clicks:
  average position:
  indexed pages:
  structured data errors:

Core Web Vitals (mobile)
  LCP:      CLS:      INP:

AI citations (10 queries)
  ChatGPT cited us:    /10
  Perplexity cited us: /10
  AI Overview cited us:/10
  "What is ShipItHQ" - described accurately? ChatGPT:      Perplexity:
```
