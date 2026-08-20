# 04 - Keyword strategy

**Serves:** definition of done 6
**Reference:** `gurukulhq/srs/seo/seo-strategy-2026.md`, `srs/seo/08-keyword-research-process.md`

## This file is a method, not an answer

**There is no keyword map in here yet, deliberately.** Writing one from memory
would produce a list of plausible phrases with invented volumes, which is worse
than nothing because it looks like data.

`SEO-30` is the research task that fills this file in. Everything below is the
method and the constraints it has to respect.

## The market reality that shapes everything

The reference's strategy opens with the insight that Nepal has almost no search
volume, so the play is to own a tiny SERP entirely. **This product's constraint is
the exact opposite**, and every tactic inverts with it.

The terms are enormous and defended:

| term family | who owns it | why it is not winnable this year |
|---|---|---|
| `leetcode`, `dsa practice`, `coding interview questions` | LeetCode, GeeksforGeeks, NeetCode | Decade-old domains, millions of backlinks, and the query is usually navigational anyway |
| `system design interview` | educative.io, ByteByteGo, github awesome-lists | Entrenched, and the best-known answer is a free GitHub repo |
| `software engineer resume` | Indeed, Zety, Novoresume | Commercial giants with dedicated SEO teams |
| `mock interview` | Pramp, interviewing.io | Category-defining brands |

A 22-post blog does not move any of those. Pretending otherwise is how an SEO
budget gets spent on nothing.

## Where this site can actually win

Three places, in priority order.

**1. Long-tail with specificity.** Queries where the generic answer is
unsatisfying and a specific one wins:

- "how many leetcode problems before faang interview" - a number and a method
  beats a listicle
- "system design interview prep for 2 years experience" - the qualifier is the
  opportunity; the incumbents answer generically
- "how to explain a project in an interview" - narrow, high intent, poorly served

The test for a long-tail target: **can this page be the best answer on the
internet for this exact phrase?** If not, do not target it.

**2. Comparison and alternative queries.** "X alternatives" and "X vs Y" have
commercial intent, are the format AI engines cite most, and are winnable because
incumbents rarely write them about themselves. `leetcode-alternatives.md` already
exists in the blog - that instinct was right, and it should become a cluster.

Non-negotiable: every comparison claim is **sourced and dated** (see
`03-aeo.md` `SEO-22`, and `../polish/tasks.md` `WEB-11`).

**3. Product-differentiated queries** - the ones only this product can answer well
because it is the only one that does the thing:

- running code in a real Linux container, not a sandboxed judge
- tailoring a resume from an existing resume rather than a form
- voice mock interviews with a transcript and a scored report

These have low volume. They also have the highest conversion rate on the site,
because someone searching them is describing this product.

## The research method - `SEO-30`

Follow `srs/seo/08-keyword-research-process.md`, which is written for doing this
without paid tools. The output is a table in this file with a date on it.

**Step 1 - seed.** Every module the product actually has (checked against
`../polish/tasks.md` `WEB-1`, so no seeds from deleted features), plus every
competitor brand, plus the questions the existing 22 posts answer.

**Step 2 - expand.** Search Console (queries the site already gets impressions
for - the cheapest and most honest source), Google autocomplete, People Also Ask,
Reddit and the relevant subreddits for the phrasing people actually use.

**Step 3 - qualify.** For each candidate record: rough volume, rough difficulty,
intent (informational / commercial / navigational), and **who currently ranks
top 3**. That last column is the one that decides go or no-go.

**Step 4 - map.** One target phrase per page. Two pages targeting one phrase is
cannibalisation and both lose.

**Step 5 - write it down here** with the date and the source of each number. A
number with no source gets deleted at the next review, by rule.

## The output shape

```markdown
## Keyword map (researched YYYY-MM-DD, source: ...)

### Commercial - money pages
| phrase | volume | difficulty | intent | top 3 today | our page |
|---|---|---|---|---|---|

### Comparison cluster
...

### Informational / AEO cluster
...
```

## Rules that survive whatever the research finds

1. **One target phrase per page.**
2. **No page targets a phrase where the top three are all DR 80+ reference sites**,
   unless the page can beat them on specificity, not effort.
3. **Every money page leads with the exact phrase in the title and H1.**
4. **Front-load the phrase in the title and add a differentiator to the
   description.** From the reference: descriptions that state something
   competitors do not are what earn the click.
5. **Do not target a phrase for a feature that does not exist.** The Studio
   section in `../polish/01-content-truth.md` is what that mistake looks like.
