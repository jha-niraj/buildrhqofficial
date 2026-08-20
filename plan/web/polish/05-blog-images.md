# 05 - Blog images

**Serves:** definition of done 5, 7
**Reference:** `gurukulhq/apps/web/app/(home)/blog/_components/topic-glyph.tsx`

## What is already right

Worth stating first, because it changes the size of this task. `apps/web/CLAUDE.md`
already documents a generated social-card system:

> Every post gets a generated 1200x630 social card from
> `app/(home)/blogs/[slug]/opengraph-image.tsx` at build time, so no post needs a
> hand-designed OG asset. `heroImage` is optional and only controls the in-article
> hero; posts without one render a branded typographic cover.

So the **OG side is done**. Cards are generated, and there is already a
typographic fallback for posts with no hero. Nothing in this file changes that.

## What is wrong

The raster art that is *not* the OG card:

```
apps/web/public/og/blog/   21 files   1.7 MB
```

- **7 hero images** referenced by `heroImage` in `content/blog.ts`
- **13 inline images** inside post markdown

They are `.webp`, so they are not badly encoded - they are just unnecessary. Look
at what they depict:

| image | what it shows |
|---|---|
| `dsa-inline-1.webp` | "Data structure cheat sheet: arrays, hash maps, trees, graphs complexity comparison" |
| `dsa-inline-2.webp` | "Dynamic programming table visualization" |
| `resume-inline-1.webp` | "A resume before and after ATS optimization" |
| `ai-tools-inline-2.webp` | "Developer workflow showing multiple AI tools" |

Every one of those is **information**, and it is currently locked inside a raster
where it cannot be read by a screen reader, cannot be searched, cannot be copied,
does not respond to dark mode, and costs bandwidth on the page a search visitor
lands on cold.

A complexity comparison wants to be a table. A before/after wants to be two code
blocks. A workflow wants to be a diagram in SVG. All three are *better* as HTML
and cheaper at the same time - this is the rare change with no trade-off.

## The approach, from the reference

`topic-glyph.tsx` replaced gurukul's category art with one drawn SVG per topic.
Its header comment carries the reasoning worth adopting verbatim:

> STATIC SVG ON PURPOSE - no framer-motion, no `use client`. The version these
> are modelled on animates each path drawing itself, which is lovely and costs a
> client component plus the animation runtime on a page whose Lighthouse score is
> decided by main-thread JavaScript (mobile TBT was measured at 7,680ms). These
> render on the server, ship zero JS, and are in the HTML for crawlers.

And: `currentColor` throughout, so a glyph inherits surrounding text colour and
needs no second palette for dark mode.

That 7,680ms TBT number is why this file is not only about bytes.

## The plan

**Hero images -> a topic glyph system.** One glyph per `BLOG_CATEGORIES` entry,
server-rendered SVG on `currentColor`. Posts stop carrying `heroImage`; the
in-article hero becomes the existing typographic cover plus the category glyph.

**Inline images -> real HTML**, decided per image:

| kind | becomes |
|---|---|
| comparison / cheat sheet | a markdown table |
| before / after | two fenced code blocks, labelled |
| workflow / architecture | inline SVG, or a mermaid block if the renderer supports it |
| pure decoration | deleted |

Check `lib/blog-renderer.ts` for what the markdown pipeline already supports
before choosing - the app has `mermaid` as a dependency, which may already cover
the diagram case.

**Then delete `public/og/blog/*-hero.webp` and `*-inline-*.webp`.** Leave anything
the OG generator depends on. Verify by grep before deleting, not after.

## The one thing to check before starting

Confirm the OG route does not read `heroImage`. If `opengraph-image.tsx` composes
the social card *from* the hero raster, removing the rasters breaks every social
card - which is the opposite of the intended outcome. Read that file first. This
is `WEB-40` and it gates the rest.

## Tasks

See `tasks.md` `WEB-40` through `WEB-45`.

## Verification

- `ls apps/web/public/og/blog` contains no `*-hero.webp` or `*-inline-*.webp`.
- `grep -rn "heroImage" apps/web/content/blog.ts` returns only the optional type,
  no values.
- Every post that had an inline image still conveys the same information, as text
  or SVG.
- Social cards still generate: build and check a `/blogs/<slug>` OG image renders.
- A blog post's transferred bytes drop measurably; record before and after.
- Glyphs render correctly in dark mode with no per-theme palette.
