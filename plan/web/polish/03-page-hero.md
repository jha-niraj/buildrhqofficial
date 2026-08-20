# 03 - One page hero

**Serves:** definition of done 4, 8
**Reference:** `gurukulhq/apps/web/components/page-hero.tsx` (500 lines)

## The finding

`apps/web` has **no shared header component**. Grepping for one returns nothing;
every public page rolls its own. Today that is three pages (aboutus, pricing,
blogs) plus the landing hero, so the inconsistency is survivable - but it is
already visible, and it is exactly the state gurukul was in before it fixed this.

The reference's header comment is the clearest statement of the problem, and it is
worth reading before starting:

> Before this existed each page hand-rolled its own header: fourteen sections,
> each on its own dark ground behind its own WebGL shader palette (emerald here,
> teal there, wine on careers, gold-noir on compare). Every page looked like a
> different product, and the one header everybody agreed was right - the landing
> hero - was the only one nothing else shared.

Fourteen is what three becomes if nobody stops it. Adding Features and Compare
(`02-navigation.md`) makes it five within this plan.

## The decision to copy

**The surface colour is not a prop.** In the reference, the background and the
shader palette are fixed inside the component, and the comment explains why: a
page that wants a different header colour is a page that has stopped matching the
brand, and the fix is to change it once for all of them.

This is the part most likely to get compromised during implementation ("just this
one page needs a darker header"), and it is the part that makes the component
worth building. If `PageHero` takes a `background` prop it has failed.

## Adapting it - do not copy wholesale

The reference is 500 lines because it carries a mosaic of photographic tiles
(`content/hero-images.ts`, `HERO_TILES`, `tileSrcSet`) composed against a warm
pearl ground. That artwork is gurukul's, and the tiles are of classrooms.

What to take:

- the **API shape**: title, subtitle, eyebrow, CTAs (`PageHeroCta` with an
  `external` flag for plain anchors)
- the **fixed-surface rule** and its reasoning
- the **theme-independence note**: the reference deliberately does *not* pair
  `dark:` on the hero surface, because it is a light surface in both themes, and
  it says so. That is the same lesson the auth panel taught this repo the hard
  way - a constant surface needs constant ink. Carry the note across so the next
  person does not add `dark:` variants and reintroduce invisible text.

What to leave:

- the tile mosaic and `hero-images.ts` - this site has no equivalent art, and
  inventing some is a separate piece of work with its own budget
- `WavyUnderline` unless the landing hero already uses that treatment

The ShipItHQ version should use the existing hero's visual language so the new
shared component looks like the site it is joining, not like gurukul.

## Interaction with the landing hero

The landing hero (`herosection.tsx`, 334 lines) is **not** replaced by `PageHero`.
It is the one page that earns a bespoke header - it is the first impression and it
carries the primary conversion path. Gurukul does the same: `page-hero` is for
"every public page except the blog", and the landing hero stays its own thing.

What must be true is that `PageHero`'s surface is *derived from* the landing
hero's, so the rest of the site looks like a continuation of the front door
rather than a different site.

The blog is also excluded - it has its own `blog-hero` treatment, and
`05-blog-images.md` covers it.

## Tasks

See `tasks.md` `WEB-20` through `WEB-23`.

## Verification

- `grep -rn "PageHero" apps/web/app` returns every public page except the landing
  page and the blog.
- Changing the surface colour in `page-hero.tsx` visibly changes every one of
  them, and nothing else needs editing.
- No page passes a colour, background or palette prop.
- Contrast: measured, not eyeballed. Every piece of type on the hero surface
  clears 4.5:1 (3:1 for large display text) against the *rendered* surface,
  including any shader or image behind it.
