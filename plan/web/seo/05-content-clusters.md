# 05 - Content clusters and internal linking

**Serves:** definition of done 7
**Reference:** `gurukulhq/apps/web/lib/internal-links.ts`, `srs/seo/07-content-strategy.md`,
the content-gap section of `gurukulhq/srs/seo/seo-strategy-2026.md`

## What exists

22 posts in `content/posts/`, gated by `content/active-posts.ts`, categorised by
`BLOG_CATEGORIES` with topic hubs at `/blogs/topics/[topic]`.

The conventions in `apps/web/CLAUDE.md` are already good and should be preserved
rather than re-invented:

> Include **real outbound links to authoritative sources** and 2-4 internal links
> to sibling posts. Internal links use `/blogs/<slug>`, never product routes.

That rule is doing real work. Keep it.

## The gap

Posts link to siblings, but there is **no pillar**. A cluster needs a hub page
that comprehensively covers the topic and that every supporting post points at;
without one, twenty-two posts are twenty-two orphans with cross-links rather than
a structure that concentrates authority anywhere.

The reference solved the linking half with `lib/internal-links.ts` - programmatic
internal links rather than hand-maintained lists that rot the moment a slug
changes.

## Proposed clusters

To be confirmed against `04-keyword-strategy.md` once the research lands. The
shape, not the specifics, is the proposal:

```
PILLAR: Technical interview preparation
  cluster: DSA practice          (leetcode alternatives, how many problems, study plan)
  cluster: System design         (prep guides, by experience level)
  cluster: Behavioural           (STAR, common questions)
  cluster: Mock interviews       (how to practise, what to expect)

PILLAR: Getting hired as a software engineer
  cluster: Resume                (ATS, freshers, cover letters)
  cluster: Portfolio projects    (what to build, how to present)
  cluster: Career paths          (roadmaps, becoming an engineer)

PILLAR: Comparisons            <- highest commercial intent, see 04
  vs LeetCode, vs an interview-prep service, vs a course
```

Each pillar is a long, genuinely comprehensive page that links down to its
supporting posts; every supporting post links back up. Two to four sibling links
per post, as today.

## The work

### SEO-40 - Map the existing 22 posts to clusters

**Do this before writing anything new.** Some posts will not fit any cluster,
which is useful information: an orphan is either a pillar waiting to be written or
a post that should not have been.

Output: a table of slug -> cluster -> role (pillar / supporting / orphan).

### SEO-41 - Write the pillars

One page per pillar. These are the pages that rank for the broad terms, and they
must genuinely deserve to - a pillar that is a table of contents with link text is
transparently thin and will not hold a position.

Each pillar: answer-first opening (`03-aeo.md` `SEO-21`), a comparison table where
the topic warrants one, sourced statistics, and complete coverage such that a
reader does not need to leave to get the answer.

### SEO-42 - `lib/internal-links.ts`

Port the pattern. Links derived from cluster membership rather than hand-listed,
so a new post joins its cluster automatically and a renamed slug does not leave
dead links across a dozen files.

Keep the existing rule: internal links point at `/blogs/<slug>`, never product
routes. That is the separation rule in `apps/web/CLAUDE.md` and it is not
negotiable for SEO convenience.

### SEO-43 - Content gap analysis

**Research task**, and the method is copied from the reference's approach: compare
the existing 22 posts against what competitors rank for, and list what is missing.

Two categories, per the reference's own split:

- **Competitor-gap posts** that intercept brand searches - the "X alternatives"
  and "is X worth it" queries. Highest commercial intent.
- **AEO / informational posts** that feed AI Overviews - definitional and
  how-to questions where a direct answer wins the citation.

Output: a prioritised list with the target phrase from the keyword map, the intent,
and who currently ranks.

### SEO-44 - Topic hub pages

`/blogs/topics/[topic]` exists and already emits schema. Once the pillars exist,
decide the relationship: the pillar is the ranking page, the hub is the index. Do
not let both target the same phrase - that is the cannibalisation rule in `04`.

This also interacts with `../polish/tasks.md` `WEB-41`, which gives each topic a
glyph. Same set of topics; do them together.

## The discipline that matters most

**Do not publish for cadence.** The reference's blog works because 22 posts are
densely cross-linked, genuinely researched and carry real outbound citations. A
40-post blog of thin posts ranks worse than a 22-post blog of good ones, and it
costs more to keep true.

Every new post has to earn its place against the keyword map and the gap analysis.
If it does not have a target phrase and a reason it can be the best answer for it,
it does not get written.
