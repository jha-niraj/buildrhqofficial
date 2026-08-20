# 03 - Answer engines (AEO / GEO)

**Serves:** definition of done 5
**Reference:** the AEO section of `gurukulhq/srs/seo/seo-strategy-2026.md`

## Why this is a first-class objective here

The audience for this product asks ChatGPT before it asks Google. "Is LeetCode
Premium worth it", "how should I prepare for a system design interview", "what
should a fresher's resume look like" are questions people now put to an assistant,
and the assistant answers with three to eight cited sources rather than ten blue
links.

Traditional SEO gets you **ranked**. AEO gets you **cited**. Given the difficulty
analysis in `overview.md` - LeetCode and GeeksforGeeks are not displaceable from
the head terms this year - being cited is the more winnable goal, and it is
winnable on content quality rather than domain age.

## The veto condition - already satisfied

If AI crawlers are blocked in `robots.txt`, AI visibility is **zero** regardless of
content quality. Check this before anything else.

`apps/web/app/robots.ts` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User,
ClaudeBot, Claude-Web, PerplexityBot and Google-Extended. **This is already
correct.** Do not let a later "tighten robots.txt" task undo it.

## What the engines want, and how they differ

| factor | Google AI Overviews | ChatGPT | Perplexity | Claude |
|---|---|---|---|---|
| freshness bias | high | medium | very high | n/a (training data) |
| structure importance | high | medium | very high | medium |
| citations per answer | 3-8 | 1-6 | 5-10 | n/a |
| domain trust weight | very high | high | medium | high |

Practical consequences:

- **Perplexity** rewards freshness and structure most, and cites the most sources
  per answer. It is the cheapest engine to win and the best early signal.
- **Claude** does not browse; it answers from training data. You reach it by
  publishing authoritative content that gets included, which is a long game with
  no direct lever.
- **Google AI Overviews** weight E-E-A-T and domain trust hardest, which is where
  this site is weakest, but they lift **direct-answer opening paragraphs**
  verbatim, which is free to implement.

## The five dimensions, scored against this site

From the citation-scoring framework. Current state is an estimate to be replaced
by a real audit in `SEO-20`.

| dimension | current | the gap |
|---|---|---|
| **Extractability** | mixed | The blog has Key Takeaways and FAQs. The marketing pages bury answers in headline copy |
| **Quotability** | weak | Claims like "AI that adjusts problem difficulty" have no number and no source. See `../polish/01-content-truth.md` - the same audit fixes both |
| **Authority** | weak | Author bios exist (`author-byline.tsx`, Person schema) but credentials are thin, and outbound links are required by the blog conventions - verify they point at primary sources, not other blogs |
| **Freshness** | unknown | Posts have dates. Verify they are visible on the page, not only in metadata, and that nothing critical is over 18 months old |
| **Entity clarity** | partial | Organization schema with `sameAs` exists. `/aboutus` emits no schema and does not define the entity in its first sentence |

## The work

### SEO-20 - Citation gap analysis

**Research task. Do this first; it directs the rest.**

For each of ten target queries, ask ChatGPT, Perplexity and Google (checking for
an AI Overview), and record: who gets cited, and what their content has that ours
does not.

Suggested starting queries - refine from the keyword map in `04`:

```
leetcode alternatives
how to prepare for a system design interview
software engineer resume for freshers
best way to practice DSA for interviews
how many leetcode problems before interviews
mock interview practice for software engineers
portfolio projects that get you hired
```

Record the answers in this file with the date. Re-run quarterly - the point is the
trend, and a single snapshot tells you nothing about whether the work is working.

### SEO-21 - Answer-first rewrites

The single highest-leverage content change, and it is structural rather than
additive:

- The **first sentence after every H2 answers the question the H2 asks.** No
  throat-clearing, no "before we dive in".
- Every key term gets a **"X is Y"** definition, standalone and quotable without
  surrounding context.
- Each post opens with a **one-sentence definitional answer**. AI Overviews lift
  these verbatim - the reference calls this out explicitly as why its blog wins
  them.

Apply to every post and every marketing page. Cheap, and it compounds.

### SEO-22 - Comparison tables

Comparison content is among the most-cited formats, because AI systems answer
"X vs Y" and "best X" constantly and a table is trivially extractable.

This overlaps `../polish/tasks.md` `WEB-11` (the Compare pages). The SEO
requirements on top of the product requirements:

- a summary table **near the top**, before the prose
- a stated verdict in the first 100 words - "the best X for Y is Z because"
- consistent subheadings per option (Pros, Cons, Pricing, Best for)
- **every cell sourced and dated.** The same rule as `WEB-11`, and it matters
  doubly here: a fabricated comparison that gets cited by an AI is a fabrication
  with amplification

### SEO-23 - Sourced statistics

Replace adjectives with numbers, and give every number a named source and a date.

"Most candidates fail system design interviews" is worthless. "62% of senior
candidates are rejected at the system design round (Source, 2025)" is quotable,
and quotable is the whole objective.

**If a number cannot be sourced, delete the sentence.** Do not soften it into a
vaguer version of the same unsupported claim.

### SEO-24 - Entity definition on `/aboutus`

Two changes:

1. The **first sentence** names and classifies the entity: "ShipItHQ is a ..." -
   not "We believe that...". This is the sentence an AI system extracts when asked
   what ShipItHQ is.
2. Emit `Organization` + `AboutPage` schema referencing `#organization` by `@id`,
   with founding date, founder and `sameAs`.

Then check the outcome directly: ask ChatGPT and Perplexity "what is ShipItHQ" and
record what comes back. If they describe it wrongly or not at all, that is the
baseline to move.

### SEO-25 - Author credentials

Person schema exists on posts. Strengthen it: real credentials, a linked profile,
and consistency between the byline, the schema and the LinkedIn it points at.

E-E-A-T is weighted "very high" by AI Overviews, and an anonymous or thin author
is the cheapest thing on this list to fix.

### SEO-26 - Freshness signals

- Published **and updated** dates visible on the page, not only in metadata
- An update policy for the top posts - a genuinely revised post gets a new date; a
  touched timestamp on unchanged content is a lie the engines increasingly detect
- Nothing load-bearing older than 18 months without review

## Measurement

Covered in `06-measurement.md`. The short version: AI citations are not in Search
Console. The only reliable method today is asking the engines the questions and
recording the answers, which makes `SEO-20` both the first task and the recurring
one.
