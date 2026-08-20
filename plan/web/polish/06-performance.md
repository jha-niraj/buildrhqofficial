# 06 - Performance budget

**Serves:** definition of done 7
**Reference:** `gurukulhq/apps/web/components/lazy-mount.tsx`, `reveal.tsx`, and the
marketing-performance note in that repo's `apps/web/CLAUDE.md`

## Why this file exists

The reference repo measured **7,680ms mobile TBT** on its marketing site, and the
cause was not images - it was main-thread JavaScript. That number is the reason
its blog art is static SVG and its below-fold sections are lazily mounted.

This site is at real risk of the same thing, and the sections in
`04-landing-composition.md` all add to it. A budget written down before the work
starts is the only thing that stops "one more animated section" from happening
eight times.

## The budget

Measured on a **mobile** Lighthouse run against the deployed Worker, not local
dev, not desktop.

| metric | budget | why |
|---|---|---|
| Total Blocking Time | < 200ms | The metric the reference site failed. Directly reflects section JS |
| Largest Contentful Paint | < 2.5s | Usually the hero; it must not wait on a shader or a font |
| Cumulative Layout Shift | < 0.1 | Reserve space for anything that mounts late, especially lazily mounted sections |
| Client JS on `/` | budget it, then hold it | Record the number at the start of the work and do not let it grow without a reason written in the task |
| Blog post transferred bytes | measure before / after `05-blog-images.md` | The main deliverable of that file |

## Rules

**1. Server components by default.** A section becomes `'use client'` only when it
has state or a listener. Decoration is not state. The glyph reasoning from
`05-blog-images.md` applies to the landing page too.

**2. Below-fold sections are lazily mounted.** Port `lazy-mount.tsx`. Nothing the
user has not scrolled to should cost main-thread time before they do.

**3. Scroll reveals use the shared `reveal.tsx`**, not a motion library per
section. One `IntersectionObserver` pattern, no runtime.

**4. No decorative asset blocks first paint.** Shaders, video backgrounds and
large images are deferred or dropped. `video-background.tsx` is already rejected
in `04-landing-composition.md` on these grounds.

**5. Fonts do not block.** `display: "swap"` everywhere, and the variable display
face is one file (fixed platform-wide on 2026-08-20 - see `a1dcc07`). Do not
reintroduce a `weight` array.

**6. Measure per section, not once at the end.** Add a section, re-run Lighthouse,
record the delta in the task. A budget checked only at the end tells you that
something regressed but not what.

## Things already known to be fine

Do not spend time on these:

- **Social card generation** - build time, zero runtime cost.
- **The display font** - one variable file, already corrected.
- **The R2/Worker setup** - static assets serve off the CDN, not the Worker.

## Tasks

See `tasks.md` `WEB-50` through `WEB-53`.

## Verification

Record real numbers in the task, not "feels faster":

- A Lighthouse mobile run on `/`, `/pricing`, `/blogs` and one post, before and
  after, with the four metrics above written down.
- `grep -rln "use client" apps/web/components` - every file in the list can be
  justified in one sentence.
- Every below-fold landing section is inside `LazyMount`.
