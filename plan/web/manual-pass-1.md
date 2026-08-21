# Manual pass 1 - findings from Niraj's review, 2026-08-21

Nine items found while testing `apps/web` by hand. Tracked here rather than in
`polish/tasks.md` because they are review findings against shipped work, not planned work -
the polish plan is closed except for its two blockers.

**A task is done when its verification line can be demonstrated, not when the code is
written.** Same rule as the other plans.

## Status

| ID | Item | Status |
|---|---|---|
| MP-1 | Company dropdown in the navbar (legal, about, contact) | **done (2026-08-21)** |
| MP-2 | About page: drop the team section, expand the content, animated SVGs | **done (2026-08-21)** |
| MP-3 | Hero rotating panel: dead space, needs an illustration | **done (2026-08-21)** |
| MP-4 | Proof section code panel: styling + ScrollArea instead of native scroll | **done (2026-08-21)** |
| MP-5 | Pricing hero: remove the grid, add top padding | **done (2026-08-21)** |
| MP-6 | Bricolage Grotesque across the whole codebase | **already correct - verified empirically (2026-08-21)** |
| MP-7 | `cursor-pointer` on the pricing switch and every button | **done (2026-08-21)** |
| MP-8 | First blog card's cover image is cropped | **done (2026-08-21)** |
| MP-9 | Compare page needs more content, and the nav dropdown needs it | **done (2026-08-21)** |

---

## MP-1 - Company dropdown

**Found:** the navbar has Features, Compare, Resources and Pricing. The legal pages
(`/privacypolicy`, `/termsofservice`) are reachable only from the footer, and About and
Contact are buried inside the Resources panel where nobody would look for them.

**Do:** a fourth dropdown, Company, holding About, Contact, Terms and Privacy. Resources
becomes what its name says - the blog and the topic hubs.

**Verification:** every legal and company page is reachable from the navbar in one hover
plus one click, on desktop and inside the mobile accordion. No dead hrefs.

## MP-2 - About page

**Found:** the page carries a team section, and the rest is thin.

**Do:** remove the team section. Expand what remains into something worth reading, and
carry illustration rather than a wall of text. Any SVG must be server-rendered and on
`currentColor` - the same rule as `topic-glyph.tsx`. Animation, if any, is CSS: this page
was just converted OFF framer-motion and must not come back as a client component.

**Verification:** no team section; the page is a server component; measurably more content
than the 273-line version; every SVG inherits `currentColor` and renders in both themes.

## MP-3 - Hero rotating panel

**Found:** the panel below the hero fold is mostly empty. Copy sits in the left third and
the right two thirds are blank at desktop width.

**Do:** rethink the composition and put an illustration in the space. It is the first
thing below the fold on the highest-traffic page, so it has to earn the height it takes.

**Verification:** no large empty region at 1440px; the panel reads as one composition
rather than text floating in a box; still zero added client JS beyond what the rotation
already costs.

## MP-4 - Proof section code panel

**Found:** the Dockerfile block overflows horizontally with a native scrollbar, and a line
is visibly cut mid-word. The panel styling is plainer than the section around it.

**Do:** `ScrollArea` from `@repo/ui` rather than native overflow, and improve the frame.

**Verification:** no native scrollbar; the block scrolls inside its own container; no line
is cut off at any width; the page itself never scrolls sideways.

## MP-5 - Pricing hero

**Found:** the grid pattern reads as noise behind the heading, and the eyebrow sits under
the floating navbar.

**Do:** remove the grid from that surface and add enough top padding to clear the navbar.

**Verification:** no grid behind the pricing hero; the eyebrow is fully visible below the
navbar at 1440px and at 390px.

## MP-6 - Bricolage Grotesque everywhere

**Found:** it appears to be wired already - all five Next apps load it with `.variable` and
`packages/ui` has an `h1-h6` base rule.

**Do:** verify EMPIRICALLY that the custom property is emitted and the rule resolves,
rather than reading the source and assuming. The specific risk named in the brief is
`@theme inline`, and this file uses it.

**Verification:** the built CSS contains the custom property; a rendered heading computes
to Bricolage; every app that has a UI is covered.

## MP-7 - Pointer cursors

**Found:** the pricing currency switch has no `cursor-pointer`.

**Do:** fix it there and audit every interactive element for the same gap.

**Verification:** every button, switch and clickable control shows a pointer cursor.

## MP-8 - Blog cover crop

**Found:** the featured card's cover is cropped horizontally - the title reads "he STAR
Method..." with the first character cut off.

**Cause to confirm:** the featured card is a two-column grid and the image is
`aspect-[1200/630] h-full w-full object-cover`. `h-full` and the aspect ratio fight, and
`object-cover` crops the overflow.

**Verification:** the whole cover is visible on the featured card at every width, with no
horizontal crop.

## MP-9 - Compare page

**Found:** the comparison pages are thin next to the rest of the site, and Compare is in
the navbar but the dropdown does not carry everything it should.

**Do:** expand the content. Every new claim obeys the sourcing rule already written at the
top of `compare/_components/comparisons.ts` - **no competitor prices**, and every cell is a
fact about us with its file named, a property of the category argued rather than asserted,
or a quote from the vendor's own page with the date.

**Verification:** both comparison pages are substantially longer; no new claim breaks the
sourcing rule; the nav dropdown lists every comparison plus the index.

---

# Results, 2026-08-21

## MP-1 - Company dropdown

Four dropdowns now: Features, Compare, Resources, **Company**, plus Pricing top-level.
Company holds About, Contact, Terms and Privacy. Resources became what its name says - the
blog and four topic hubs - instead of a bin holding About and Contact.

Compare gained a "How we write these" row pointing at the index, so the panel carries the
whole section rather than only its leaves.

**Two things the change forced.** Five top-level items no longer fit the pill at `md`, so
the desktop nav moved to `lg` and `md` falls through to the sheet, which is better than a
cramped row. And a 30rem panel centred on a trigger near the end of a five-item pill runs
past the viewport edge, so the last three anchor to their own right edge instead. That is
index-based rather than hardcoded, so a sixth item stays correct.

**Verified:** every legal and company page reachable from the navbar; 73 internal links
across 17 seed pages, all 200.

## MP-2 - About page

Team section removed, and the page grew four sections: why this exists, how the site is
written, the container, and what it deliberately is not.

**The bigger find was in the stats block.** It read "10K+ Active Developers", "500+ Projects
Shipped", "12 Countries Reached" and "1M+ Lines of Code". Not one was sourced - on the page
that DEFINES the company, which is the single worst place to invent a number because it is
the page a reader visits specifically to decide whether to believe the rest. Replaced with
four facts that are checkable in the repo, each **printing the file it came from**.

Three illustrations, server-rendered SVG on `currentColor`, animated in CSS. The page had
just been converted off framer-motion to a server component and it stayed one.

## MP-3 - Hero panel

Was `flex flex-col justify-center` with the copy in a `max-w-xl`, so the left third held
everything and the right two thirds were empty. Now a two-column grid with an illustration
per slide - a brief becoming a deployment, a spoken answer with its follow-up, a hint that
narrows rather than reveals, a resume parsed into fields.

Four SVGs, server-rendered, CSS-animated, hidden below `lg` where the panel is not tall
enough for both. Zero added client JS on a panel that already pays for its rotation.

## MP-4 - Dockerfile panel

`ScrollArea` with a horizontal bar, which needed a fix in `@repo/ui` first: the shared
component only ever rendered a vertical `ScrollBar`, so horizontal content scrolled with
**no visible bar at all** - worse than the native one, since at least that is visible. Now
opt-in via `orientation="both"`, default unchanged for every existing call site.

The more useful half of the fix is that the content no longer needs to scroll at normal
widths: the long comment is split across two source lines, so nothing is clipped. Also
gained line numbers (`select-none`, so copying the block copies the file), dimmed comments,
and an "In the repo" badge.

It is a small client component so the boundary sits around the panel rather than around the
section - the heading, copy and three facts stay server-rendered.

## MP-5 - Pricing hero

Grid removed from `PageHero`'s surface entirely, and the reason is written into the file so
it does not come back: a drafting-paper grid over a photograph is two textures competing,
and a pattern that fights what is underneath it is interference rather than texture.

Padding went `py-20` to `pb-20 pt-32` (and up at `sm`/`lg`), because the navbar floats over
this header rather than pushing it down, so the eyebrow was sitting under the pill.

## MP-6 - Bricolage Grotesque

**Already correct, and verified empirically rather than by reading.** All five Next apps
load it with `.variable`, and `packages/ui` has the `h1-h6` base rule.

The specific risk in the brief was `@theme inline`, and this file uses it. Checked against
the built CSS: `--font-display-family` **is** emitted, and the `h1,h2,h3,h4,h5,h6` rule
does reference it. `@theme inline` emits the custom property; it is `@theme reference` that
does not. Seventeen woff2 files ship and there is no download failure in the build log.

Nothing changed. It was worth checking rather than assuming.

## MP-7 - Pointer cursors

The shared `Button` already sets `cursor-pointer`. Three raw `<button>` elements did not:
the pricing currency switch, the hero slide dots, and the mobile accordion trigger. All
three fixed; every `<summary>` already had one.

## MP-8 - Blog cover crop

**Cause confirmed:** the featured card is a two-column grid and the image had
`aspect-[1200/630] h-full w-full object-cover`. The grid row is as tall as the copy column,
so `h-full` stretched the image past its own ratio and `object-cover` cropped the sides -
the title on the artwork lost its first character and read "he STAR Method...".

`h-full` removed. The box is already exactly the source ratio, so `object-cover` now crops
nothing, and `lg:items-center` on the grid keeps the shorter column centred instead.

## MP-9 - Compare pages

Both gained a `deepDive` section - 513 words on the LeetCode page, 361 on interviewing.io -
plus four rendered FAQs each with `FAQPage` schema.

**Every new claim obeys the standing sourcing rule**, and it was checked rather than
assumed: grepped the whole file for price figures afterwards and found none. Where the
question is "what does interviewing.io cost", the answer says they do not publish it and
that we do not quote figures we cannot source.

---

# Manual pass 2, 2026-08-21

## MP-10 - Compare section to ten pages

`leetcode`, `interviewing-io`, `bootcamp`, `youtube-tutorials`, `chatgpt`, `cs-degree`,
`neetcode`, `pramp`, `resume-review-service`, `diy-study-plan`. ~10,600 words across the
section, roughly 1,000 per page.

**Four compare a CATEGORY rather than a company**, and that is the deliberate safety choice
rather than a shortcut. A category cannot be misrepresented the way a named business can, it
does not change its pricing on a Tuesday, and it is what a reader is actually choosing
between. `vendorUrl` is optional now, and a category page says plainly that there is no
single site to check it against.

**Where a vendor IS named, the claim is sourced or it is not made.** Pramp's model and the
fact that it is free are quoted from their own site with the access date. NeetCode's page
returned no usable content to the fetcher, so that page describes the category - a curated
roadmap over the classic problem set - and links out rather than inventing specifics.

**No competitor prices anywhere.** Grepped the whole file afterwards rather than trusting
myself: clean.

**Several of these end up recommending the alternative**, which is the point. The CS degree
page says take the degree if you have the option and the means, and says a subscription is
not a substitute. The bootcamp page says buy the structure if you have stalled twice
self-directing. The free-tutorials page says anybody telling you that you must pay to learn
to code is selling something. The DIY page says do not replace a plan that is working.

A comparison that never concedes is an advert, and it reads as one.

## MP-11 - Repository paths off the public pages

Found on the comparison tables, the About stats, the Dockerfile caption, the About SVG and
several deepDive paragraphs. A path proves nothing to somebody who cannot open the
repository, and it published our directory layout to everybody who could scroll.

**The sourcing DISCIPLINE is unchanged.** `source` on a comparison row and `evidence` on a
feature module are both still required and both still checked in review - they are marked
INTERNAL and never rendered. The public column is now a link to the feature the row is about,
which is more useful to a reader than a path ever was.

Also: the About stats show a plain-English note instead of a filename, the Dockerfile panel
caption says `Dockerfile` rather than the full path, the illustration draws abstract code
lines instead of a real identifier, and the Proof copy no longer implies a public repo.

## MP-12 - One FAQ accordion

There were two: the landing page's bordered cards with a rotating plus, and a plain
`<details>` list on the hubs and comparison pages.

Zero-JS was the right instinct and the wrong call. A visitor moving from the landing page to
a comparison page met two different components answering the same kind of question, and
inconsistency across pages reads as carelessness much more loudly than a few kilobytes reads
as slowness.

`components/faq-accordion.tsx` is the one implementation, used by the landing page, all
seven hubs and all ten comparison pages. It renders the LIST only - each caller supplies its
own chrome, because the landing page puts it in a two-column sticky layout and the others
stack it under a heading. Every caller still emits `FAQPage` from the same array it passes
in.

## MP-13 - Font, re-checked

Re-verified after the question. **Nothing was broken, and it was worth checking again.**

- All five Next apps load Bricolage with `.variable`, all import the shared stylesheet, none
  shadow it with their own.
- The `h1-h6` rule sits at brace depth 0 - unlayered - so it beats Tailwind utilities rather
  than losing to them.
- The production CSS contains four `@font-face` blocks for Bricolage at `font-weight: 200 800`
  with real woff2 URLs, and there is no download failure in the build log.

**The reason it can look absent while testing:** in `next dev`, Turbopack puts the font CSS in
a separate chunk that is not linked from the initial HTML, so the face arrives a moment after
first paint. A production build links it up front. Checked the served dev CSS and the built
CSS separately to confirm that is the only difference.
