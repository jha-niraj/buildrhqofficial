# Marketing site polish - tasks

Derived from `overview.md`. Every task traces to a line in its definition of done;
a task that traces to nothing is scope creep and gets deleted.

**Nothing here has been started.** This directory is the plan; the work is
sequenced below and waiting on a go-ahead.

## Status at a glance

| ID | Task | Serves | Status |
|---|---|---|---|
| **Content truth** - blocks everything in the 30s | | | |
| WEB-1 | Audit every product claim on the site against the codebase | 1 | not started |
| WEB-2 | Resolve the testimonials question | 2 | not started |
| WEB-3 | Reconcile pricing copy against `packages/pricing` | 1, 2 | not started |
| WEB-4 | Delete the Studio section | 1 | not started |
| WEB-5 | Strip multiplayer language from the projects section | 1 | not started |
| WEB-6 | Audit the FAQ answers | 1 | not started |
| **Navigation** | | | |
| WEB-10 | Write the Features page | 1, 3 | not started |
| WEB-11 | Research + write the Compare pages | 2, 3 | not started |
| WEB-12 | Port the dropdown mechanics into the existing navbar | 3 | not started |
| WEB-13 | Mobile accordion nav | 3 | not started |
| WEB-14 | Keyboard + a11y pass on the nav | 3 | not started |
| **Page hero** | | | |
| WEB-20 | Build `PageHero` with a fixed surface | 4 | not started |
| WEB-21 | Adopt it on aboutus, pricing | 4 | not started |
| WEB-22 | Adopt it on Features, Compare | 4 | not started |
| WEB-23 | Contrast audit across every public page | 8 | not started |
| **Landing composition** | | | |
| WEB-30 | Port `reveal.tsx` and `lazy-mount.tsx` | 7 | not started |
| WEB-31 | Port `problem-scroll` as the Problem section | 6 | not started |
| WEB-32 | Collapse four feature sections into one | 6 | not started |
| WEB-33 | Port the FAQ section structure | 6 | not started |
| WEB-34 | Container demo section | 6 | not started (optional) |
| WEB-35 | Reorder the landing page | 6 | not started |
| WEB-36 | Compare section on the landing page | 6 | not started |
| **Blog images** | | | |
| WEB-40 | Confirm the OG generator does not read `heroImage` | 5 | not started (gate) |
| WEB-41 | Build the topic glyph set | 5 | not started |
| WEB-42 | Replace inline images with HTML | 5 | not started |
| WEB-43 | Drop `heroImage` from the post pipeline | 5 | not started |
| WEB-44 | Delete the raster files | 5 | not started |
| WEB-45 | Verify social cards still generate | 5 | not started |
| **Performance** | | | |
| WEB-50 | Baseline Lighthouse run | 7 | not started |
| WEB-51 | Lazily mount every below-fold section | 7 | not started |
| WEB-52 | `use client` audit | 7 | not started |
| WEB-53 | Final measured run against the budget | 7 | not started |

---

## Content truth

### WEB-1 - Audit every product claim

**Status:** not started
**Serves:** DoD 1
**Blocks:** WEB-4, WEB-5, WEB-6, WEB-10, WEB-32, WEB-35

Work through the table in `01-content-truth.md`. For each claim, find the route,
action or table implementing it and **write the path into this task as evidence**.
Empty search = the claim is deleted.

Known already, from the audit:
- Studio: `apps/main/app/(main)/studios` does not exist -> WEB-4
- Projects: stripped to a single user in `cfdb356`; members, invitations,
  leaderboards, feature suggestions dropped in migration `0011` -> WEB-5
- "Skill Certification": nothing in the product -> delete
- "cloud-based sandboxes": TRUE, `apps/shipitworker` -> keep and promote (WEB-34)

Still to check: adaptive difficulty, coding-velocity analytics, "roadmaps designed
by Senior Engineers", the project cards in `projects-section`.

**Verification:** a written list, claim by claim, each marked keep / rewrite /
delete with a file path or a deletion reason.

### WEB-2 - Testimonials

**Status:** not started
**Serves:** DoD 2

For each testimonial: is this a real person, and did they agree to be quoted?
Anything without both is deleted. Not softened, not made anonymous - deleted.

This is called out separately from WEB-1 because it carries legal weight the other
claims do not, and because "it is obviously placeholder" stops being obvious the
moment the site is live.

**Blocks:** any port of `testimonials.tsx`.
**Verification:** every remaining testimonial has a name and a recorded consent.

### WEB-3 - Pricing copy vs code

**Status:** not started
**Serves:** DoD 1, 2

Reconcile every price and inclusion in `pricing-section.tsx` and `/pricing`
against `packages/pricing` and `apps/main/lib/credits/pricing.ts`. Credit costs
are in code and are the source of truth.

**Verification:** each row traces to a constant.

### WEB-4 - Delete the Studio section

**Status:** not started
**Serves:** DoD 1
**Blocked by:** WEB-1

Delete `studio-section.tsx` and its import. Not a rewrite - there is no adjacent
true claim to rewrite it into.

**Verification:** no reference to studio, notes or spaced repetition on the site.

### WEB-5 - Strip multiplayer language

**Status:** not started
**Serves:** DoD 1
**Blocked by:** WEB-1

Projects are single-user now. Remove every team, collaboration, leaderboard and
invite implication.

**Verification:** grep the site for collaborate / team / leaderboard / invite;
every hit is either gone or true.

### WEB-6 - FAQ audit

**Status:** not started
**Serves:** DoD 1
**Blocked by:** WEB-1

Every answer is a claim and gets the same treatment.

---

## Navigation

### WEB-10 - Features page

**Status:** not started
**Serves:** DoD 1, 3
**Blocked by:** WEB-1

**Research first:** the page can only list what WEB-1 confirmed. One section per
real module with an honest scope line.

**Verification:** every feature named maps to a route in `apps/main`.

### WEB-11 - Compare pages

**Status:** not started
**Serves:** DoD 2, 3

**Research first, and this one is the strictest.** Every competitor statement must
be checkable against something they publish, **dated, with the source URL recorded
next to the claim**. A comparison table that overstates is a comparison table that
gets screenshotted.

Start with the two most-searched: LeetCode, and one interview-prep service.
One page per competitor; the dropdown lists them.

**Verification:** every cell has a source URL and a date.

### WEB-12 - Dropdown mechanics

**Status:** not started
**Serves:** DoD 3
**Blocked by:** WEB-10, WEB-11 (do not point the nav at pages that do not exist)

Port from the reference, keeping the existing navbar's look:
- 120ms close delay so a diagonal mouse can cross the gap
- Escape closes; listener mounted only while open
- `DropdownItem` with icon + title + description
- `overflow-visible` on the pill so the open tab meets the panel
- keep `z-40` so modals still open above the navbar

**Verification:** see `02-navigation.md`.

### WEB-13 - Mobile accordion

**Status:** not started
**Serves:** DoD 3

Hover is meaningless on touch. Panels become accordions in the mobile sheet;
outside-click closes.

### WEB-14 - Keyboard and a11y

**Status:** not started
**Serves:** DoD 3

Tab reaches every item in an open panel, Escape closes and returns focus, focus is
visible throughout.

---

## Page hero

### WEB-20 - Build `PageHero`

**Status:** not started
**Serves:** DoD 4

Fixed surface - **no colour, background or palette prop**. Take the API shape and
the reasoning comments from the reference; leave its tile mosaic. Derive the
surface from the existing landing hero. Carry across the theme-independence note.

**Verification:** changing one file changes every public page's header.

### WEB-21 / WEB-22 - Adopt it

**Status:** not started
**Serves:** DoD 4

aboutus and pricing first, then Features and Compare as they are built. Landing
page and blog are deliberately excluded.

### WEB-23 - Contrast audit

**Status:** not started
**Serves:** DoD 8

Measured, not eyeballed, on the *rendered* surface. The auth panel measured
**1.1:1** because type sat on a photograph that read light in both themes; the
same failure is available on any hero with a shader or image behind it.

**Verification:** a number per text/surface pair. 4.5:1 body, 3:1 large.

---

## Landing composition

### WEB-30 - Port `reveal` and `lazy-mount`

**Status:** not started
**Serves:** DoD 7

Two small files, and everything after this depends on them.

### WEB-31 - Problem section

**Status:** not started
**Serves:** DoD 6
**Blocked by:** WEB-1

Port `problem-scroll.tsx` structure; content written fresh. **Research:** what do
students actually find broken about interview prep? Real sources - forums, the
existing blog's own research - not invention.

### WEB-32 - One feature section

**Status:** not started
**Serves:** DoD 6
**Blocked by:** WEB-1

Collapse Features + AI Tools + Assessments into one. Consider `feature-stack.tsx`.

### WEB-33 - FAQ structure

**Status:** not started
**Serves:** DoD 6

Adopt the reference's structure. Check whether it emits `FAQPage` JSON-LD; if the
current one does not, that is an SEO gain to capture.

### WEB-34 - Container demo (optional)

**Status:** not started (optional)
**Serves:** DoD 6

The one section this product can build and no competitor can: real code running in
a real container. Interactive against a rate-limited endpoint if feasible, a
recorded terminal if not.

Scoped separately and marked optional because it could absorb a week alone. **Do
not start it before WEB-35.**

### WEB-35 - Reorder

**Status:** not started
**Serves:** DoD 6
**Blocked by:** WEB-4, WEB-31, WEB-32

Land the order in `04-landing-composition.md`.

**Verification:** a stranger reads the page and can say what the product does and
who it is for.

### WEB-36 - Compare section on the landing page

**Status:** not started
**Serves:** DoD 6
**Blocked by:** WEB-11

A summary that links to the full pages. Same sourcing rule.

---

## Blog images

### WEB-40 - GATE: does the OG generator read `heroImage`?

**Status:** not started
**Serves:** DoD 5
**Blocks:** WEB-41 through WEB-45

Read `app/(home)/blogs/[slug]/opengraph-image.tsx`. If it composes the social card
from the hero raster, removing rasters breaks every social card - the opposite of
the intent. **Do not start any other blog task until this is answered.**

### WEB-41 - Topic glyphs

**Status:** not started
**Serves:** DoD 5

One server-rendered SVG per `BLOG_CATEGORIES` entry. `currentColor`, no
`use client`, no motion. See the reference's comment on why.

### WEB-42 - Inline images to HTML

**Status:** not started
**Serves:** DoD 5

13 images across the posts. Comparison -> table, before/after -> two code blocks,
workflow -> SVG or mermaid, decoration -> deleted. Check `lib/blog-renderer.ts`
for what the pipeline already supports; `mermaid` is already a dependency.

These images contain **information** currently locked in a raster where it cannot
be read aloud, searched, copied or themed.

### WEB-43 / WEB-44 - Drop and delete

**Status:** not started
**Serves:** DoD 5

Remove `heroImage` values, then delete the files. Grep before deleting.

### WEB-45 - Verify cards

**Status:** not started
**Serves:** DoD 5

Build and confirm a `/blogs/<slug>` OG image still renders.

---

## Performance

### WEB-50 - Baseline

**Status:** not started
**Serves:** DoD 7

Mobile Lighthouse on `/`, `/pricing`, `/blogs`, one post, against the deployed
Worker. Record TBT, LCP, CLS, client JS. **Do this before any section work**, or
there is nothing to compare against.

### WEB-51 - Lazily mount below-fold sections

**Status:** not started
**Serves:** DoD 7
**Blocked by:** WEB-30, WEB-35

### WEB-52 - `use client` audit

**Status:** not started
**Serves:** DoD 7

Every client component justified in one sentence. Decoration is not state.

### WEB-53 - Final run

**Status:** not started
**Serves:** DoD 7

Against the budget in `06-performance.md`. Real numbers written into this task.
