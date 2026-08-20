# Marketing site polish - overview

## What this is

`apps/web` is the only surface a stranger meets before signing up. Right now it
is a competent-looking site that describes a product ShipItHQ no longer ships,
has no route to the two pages people actually want before buying (what are the
features, how does it compare), gives every public page a differently designed
header, and carries 1.7MB of blog art that adds nothing a reader needs.

This body of work makes the site true, navigable, consistent and fast, in that
order of priority. True comes first because everything else is polish on top of a
claim that is currently false.

## Definition of done

Each of these is a statement that is either true or false about the shipped site.
A reader must be able to check it by loading a page or grepping the repo.

1. **Every feature named on the site exists in the product.** No section, nav
   item, pricing row, FAQ answer or blog cross-link describes a module that has
   been removed or was never built. Verified against the routes under
   `apps/main/app/(main)` and the module list in `srs/core-modules/README.md`.

2. **Every number and claim on the site has a source.** Testimonials attach to a
   real person who consented, statistics link to where they came from, and any
   claim that cannot be sourced is deleted rather than softened.

3. **The navbar carries Features and Compare**, and hovering a top-level item
   with children opens a panel of titled, described links - not a bare list.
   Keyboard users can reach every item and Escape closes the panel.

4. **Every public page except the blog uses one shared `PageHero`.** Its surface
   colour is defined in one file. Changing the header treatment across the site is
   a one-file change.

5. **The blog ships no raster hero or inline images.** Topic and post art is
   server-rendered SVG that inherits `currentColor`, and social cards remain
   generated at build time.

6. **The landing page is composed of sections that each make one argument**, in
   an order a first-time reader can follow, with no section that duplicates
   another's job.

7. **The site meets its performance budget** (`06-performance.md`) on a mobile
   Lighthouse run: no page ships more client JS than its interactivity justifies,
   and no section blocks first paint for decoration.

8. **Dark mode is correct on every public page.** No hardcoded single-mode
   colour, and no text under 4.5:1 against the surface it actually lands on -
   including surfaces that are theme-independent, like photographs and shaders.

9. **The plan files match the code.** When a task is marked done in `tasks.md`,
   the thing it describes is in the repo.

## Out of scope

Deliberately excluded, so scope creep has to argue with this document:

- **A redesign.** The navbar's visual design stays as it is; only its navigation
  grows. The brand, palette and type are settled and are not reopened here.
- **New marketing pages beyond Features and Compare.** Gurukul has careers,
  glossary, developers, demo, ROI calculator, `for/[persona]` and yatra. They are
  good pages. None of them are needed to explain this product to a student, and
  each is a page that then has to be kept true.
- **Localisation and geography.** Gurukul's `markets.ts` machinery solves a
  problem this site does not have.
- **The product apps.** Anything under `apps/main` is out; if a marketing claim
  is false, the fix here is to stop making the claim, not to build the feature.
- **Blog content strategy.** Which posts exist and what they argue is a separate
  concern; this work only changes how they are presented.

## Decisions

| decision | why | who |
|---|---|---|
| Truth before design | The site sells a Studio module that is not in the app. No amount of layout work survives a reader discovering that after signing up | Niraj, 2026-08-20 |
| Reference gurukul, do not clone it | Same design system, different audience and argument. A school-software section retitled for students is a section that argues for nothing | Niraj, 2026-08-20 |
| Features + Compare only | The two pages a buyer asks for before signing up. Everything else in gurukul's nav is a page this product does not need yet | Niraj, 2026-08-20 |
| Keep the navbar's look | It already matches the brand. The complaint was navigation depth, not appearance | Niraj, 2026-08-20 |
| SVG over raster for blog art | 1.7MB of decorative webp that no reader needs, on the pages most likely to be a first impression from search | this plan |
| Research gate on all copy | See rule 1. Every content task is blocked until its claims are checked | Niraj, 2026-08-20 |

## How to work through this

`tasks.md` is ordered. The order is not arbitrary:

1. **Content truth** first, because it changes what sections exist at all, and
   there is no point styling a section that is about to be deleted.
2. **Page hero and navigation** next, because they are the frame every other page
   sits inside.
3. **Landing composition** after that, once it is known which arguments survive.
4. **Blog images** and **performance** last, because they are measurable and
   independent - they can be verified without waiting on a content decision.

A task is done when its **verification** line can be demonstrated, not when the
code is written.
