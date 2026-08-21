# Marketing site polish - tasks

Derived from `overview.md`. Every task traces to a line in its definition of done;
a task that traces to nothing is scope creep and gets deleted.

**Content truth (WEB-1, 3, 4, 5, 6) is done** - see the per-task records below.
WEB-2 is blocked on a decision only Niraj can make. Everything from WEB-10 onward
is not started.

## Status at a glance

| ID | Task | Serves | Status |
|---|---|---|---|
| **Content truth** - blocks everything in the 30s | | | |
| WEB-1 | Audit every product claim on the site against the codebase | 1 | **done (2026-08-20)** |
| WEB-2 | Resolve the testimonials question | 2 | **section hidden; decision still needed** |
| WEB-3 | Reconcile pricing copy against `packages/pricing` | 1, 2 | **done (2026-08-20)** |
| WEB-4 | Delete the Studio section | 1 | **done (2026-08-20)** |
| WEB-5 | Strip multiplayer language from the projects section | 1 | **done (2026-08-20)** |
| WEB-6 | Audit the FAQ answers | 1 | **done (2026-08-20)** |
| **Navigation** | | | |
| WEB-10 | Write the Features page | 1, 3 | **done (2026-08-20)** |
| WEB-11 | Research + write the Compare pages | 2, 3 | **done, scope changed (2026-08-20)** |
| WEB-12 | Port the dropdown mechanics into the existing navbar | 3 | **done (2026-08-20)** |
| WEB-13 | Mobile accordion nav | 3 | **done (2026-08-20)** |
| WEB-14 | Keyboard + a11y pass on the nav | 3 | **done (2026-08-20)** |
| **Page hero** | | | |
| WEB-20 | Build `PageHero` - fixed surface, variant composition | 4 | **done (2026-08-20)** |
| WEB-21 | Adopt it on aboutus, pricing | 4 | **done (2026-08-20)** |
| WEB-22 | Adopt it on Features, Compare | 4 | **done (2026-08-20)** |
| WEB-23 | Contrast audit across every public page | 8 | **hero + OG card done (2026-08-20); landing/blog open** |
| **Landing composition** | | | |
| WEB-30 | Port `reveal.tsx` and `lazy-mount.tsx` | 7 | **done (2026-08-20)** |
| WEB-31 | Port `problem-scroll` as the Problem section | 6 | **done, adapted (2026-08-21)** |
| WEB-32 | Collapse four feature sections into one | 6 | **done (2026-08-21)** |
| WEB-33 | Port the FAQ section structure | 6 | **done (2026-08-21)** |
| WEB-34 | Container demo section | 6 | **done, reshaped (2026-08-21)** |
| WEB-35 | Reorder the landing page | 6 | **done (2026-08-21)** |
| WEB-36 | Compare section on the landing page | 6 | **done (2026-08-21)** |
| **Blog images** | | | |
| WEB-40 | Confirm the OG generator does not read `heroImage` | 5 | **done (2026-08-20) - GATE OPEN** |
| WEB-41 | Build the topic glyph set | 5 | **done (2026-08-20)** |
| WEB-42 | Replace inline images with HTML | 5 | **done (2026-08-20)** |
| WEB-43 | Drop `heroImage` from the post pipeline | 5 | **done (2026-08-20)** |
| WEB-44 | Delete the raster files | 5 | **done (2026-08-20)** |
| WEB-45 | Verify social cards still generate | 5 | **done (2026-08-20)** |
| **Performance** | | | |
| WEB-50 | Baseline Lighthouse run | 7 | not started |
| WEB-51 | Lazily mount every below-fold section | 7 | **deferred - see note** |
| WEB-52 | `use client` audit | 7 | **done for landingpage (2026-08-20)** |
| WEB-53 | Final measured run against the budget | 7 | not started |

---

## Content truth

### WEB-1 - Audit every product claim

**Status:** done (2026-08-20)
**Serves:** DoD 1

The real product, read from `apps/main/lib/navigation.ts` - which carries its own
note: *"KnowMe & Pathfinder are parked (code kept, hidden from nav). Chat/Inbox,
University, and the stub mock modes were removed."*

| module | sub-items | reachable |
|---|---|---|
| Home | - | yes |
| Practice | DSA, System Design, Web Frontend, Web Backend | yes |
| Projects | Ideas, My Projects, All Projects | yes |
| Mock Interview | Voice Mock | yes |
| AI Tools | Job Interview, Resume, Cover Letter | yes |
| Jobs | - | yes (`app/(jobs)`) |
| KnowMe, Pathfinder | - | **parked** - routes exist, hidden from nav |
| Studio, Open Source, University, Chat | - | **gone** |

**Verdicts.** Every claim checked against a route or an action:

| claim | verdict | evidence |
|---|---|---|
| Studio: notes, spaced repetition, "40+ languages in your notes" | **deleted** | no `studios` route; and the executor supports 6 languages, not 40+ |
| Hero slide "Project Studio" | **renamed** to Projects | copy underneath already described Projects |
| Hero slide "Open Source" | **deleted** | `opensource.ts` has 20 tables and no route - unreachable |
| "Adaptive Learning - AI adjusts difficulty on real-time performance" | **deleted** | no adaptive-difficulty code in the practice module |
| "Skill Telemetry - coding velocity, error rates, algorithmic efficiency" | **deleted** | no such analytics exist |
| "Polyglot Sandbox - execute in the browser" | **rewritten** | execution is server-side in a container (`apps/shipitworker`), not in the browser |
| "Skill Certification" | **deleted** | nothing issues a certificate |
| "Roadmaps designed by Senior Engineers" | **rewritten** | unverifiable authorship claim |
| "Earn credits by merging PRs" | **deleted** | opensource module unreachable, no PR-merge grant exists |
| "cloud-based sandboxes" | **kept and promoted** | TRUE - `apps/shipitworker`, real Linux container |
| "Credits never expire" | **kept** | TRUE - no expiry logic anywhere |
| Project showcase cards | **labelled** | invented briefs sitting beside real DB counts - now labelled "Example briefs" |
| FAQ (all 9) | **rewritten** | described a language-tutorial product - see WEB-6 |
| Pricing trust claims | **rewritten** | see WEB-3 |

**One correction made during the work, worth recording.** The replacement credits
copy first said "200 credits" from a dashboard screenshot. `SIGNUP_GRANT_CREDITS`
in `apps/main/lib/credits/grant.ts:28` is **100**. Caught before commit by checking
the constant - which is the entire point of the research gate, and it nearly failed
on the person applying it.

### WEB-2 - Testimonials

**Status:** BLOCKED - needs Niraj
**Serves:** DoD 2

Not actionable from the repo. `testimonials-section.tsx` renders named quotes and
nothing in the codebase says whether those people are real or consented.

**The question:** for each testimonial, is this a real person, and did they agree to
be quoted? Anything without both gets deleted - not softened, not anonymised.

Kept separate from WEB-1 because it carries legal weight the other claims do not.
**Blocks** any port of the reference's `testimonials.tsx`.

### WEB-3 - Pricing copy vs code

**Status:** done (2026-08-20)
**Serves:** DoD 1, 2

Plan and price data already come from `@repo/pricing` via `pricing-bento`, so the
numbers are structurally correct - nothing to reconcile there.

Three trust claims below the table were not:

- "Encrypted Transactions / AES-256 encryption for all payment data" - an
  unverifiable security claim about infrastructure we do not own. Now "Secure
  Checkout / card details go straight to our payment provider and never touch our
  servers", which is true of the hosted Razorpay checkout the app loads.
- "Instant Provisioning / compute resources allocated immediately upon payment" -
  jargon that overstates. Nothing is provisioned; credits land. Now "Instant
  Top-Up".
- "Perpetual Credits / credits never expire" - **verified true**, no expiry logic
  exists. Kept.

### WEB-4 - Delete the Studio section

**Status:** done (2026-08-20)
**Serves:** DoD 1

`studio-section.tsx` deleted, import and `<section id="studio">` removed from
`app/page.tsx`. The hero's "Project Studio" slide was renamed rather than deleted -
its copy described Projects, which exists.

**Verification:** no reference to studio, notes or spaced repetition remains in
`apps/web/app` or `apps/web/components`.

### WEB-5 - Strip multiplayer language

**Status:** done (2026-08-20)
**Serves:** DoD 1

**This one found less than expected, and the reason matters.** The grep for
collaborate / team / leaderboard / invite returned four hits and none was a false
product claim:

- "Open source projects built by the community" and "Shipped by our community"
  describe the **public registry** (`projects/allprojects`), which exists. Projects
  being single-user means you cannot have teammates on YOUR project; it does not
  mean other people's projects are invisible. Kept.
- "Realtime Collab Editor" is a project a USER builds, not a platform feature.
  Kept, now under an "Example briefs" label.

The real defect in that section was different: six invented project titles rendered
directly beside counts that are read from the database, so a visitor reads them as
six shipped projects. Labelled, with a comment explaining why it must stay labelled.

### WEB-6 - FAQ audit

**Status:** done (2026-08-20)
**Serves:** DoD 1

Not an audit in the end - a rewrite. All nine questions described **a different
product**: courses, lessons, videos, certificates for completing a course, "new
languages added regularly", "beginner-friendly tutorials for every programming
language". None of that exists here; it is inherited from an earlier
language-tutorial site (the Cloudinary folder was still called `thecoderz`).

Replaced with nine answers checked against routes, written **answer-first** - the
first sentence answers the question and stands alone, which is the form AI
Overviews and assistants quote. That also serves `../seo/SEO-21` before it starts.

The new set answers what a visitor actually asks: what is this, how is it different
from LeetCode, does my code really run, what are the mock interviews like, how do
credits work, can it tailor my resume, do I need experience, do I get a certificate
(no - and why that is deliberate), does it work on a phone (mostly - and which part
does not).

---

## Navigation

### WEB-10 - Features page

**Status:** done (2026-08-20)
**Serves:** DoD 1, 3

`/features`. Six modules, one section each, every one reachable in the app today.

**The facts live in `_components/feature-modules.ts`, with the evidence beside them.**
Each module carries an `evidence` field naming the route, Dockerfile or constant it was
read from, so a claim and its proof cannot drift apart. Verified this pass:

| claim | read from |
|---|---|
| Four practice tracks | `apps/main/app/(main)/practice/{dsa,system-design,web-frontend,web-backend}` |
| Six languages: JS, TS, Python 3, C, C++, Java | `apps/shipitworker`'s Dockerfile - `python3 gcc g++ default-jdk`, node base image, `tsx` installed globally |
| Practice set 5 credits, exam set 10 | `CREDIT_PRICES` in `apps/main/lib/credits/pricing.ts` |
| Project quiz 25, project mock 30 | same |
| Resume parse free, ATS 5, tailor 20, cover letter 15, questions 5 | same |
| 100 credits at signup, no expiry | `SIGNUP_GRANT_CREDITS` in `apps/main/lib/credits/grant.ts`; no expiry logic exists |
| Jobs: browse, saved, applications, following | `apps/main/app/(jobs)/jobs/*` |

**KnowMe and Pathfinder are deliberately absent.** Their routes exist but they are hidden
from the app's own navigation. A feature page that lists something the app will not show
you is the Studio failure with a new name.

**Every module states what it is NOT.** That is the honest scope line, and it is the most
useful sentence in each section - a reader deciding between this and a course needs to know
it is a practice environment before signing up, not after.

**Layout:** `split` hero, then a two-column reading layout with a sticky index. About is a
`statement` hero over centred grids and pricing is a `ledger` hero over column grids; a
third stack of centred sections would have made three pages read as one template. The index
is `position: sticky` with no scrollspy - a highlighted current section would cost a client
component on a page whose argument is that the product is fast.

### WEB-11 - Compare pages

**Status:** done, but **the scope changed and the reason matters**
**Serves:** DoD 2, 3

`/compare`, `/compare/leetcode`, `/compare/interviewing-io`.

**The research gate did its job by failing.** This task's own bar was: *every competitor
statement checkable against something they publish, dated, with the source URL recorded
next to the claim*. Applied honestly:

- **LeetCode serves HTTP 403 to automated fetches across their entire domain** - the
  subscribe page, the support articles, `/explore`, all of it. Every price figure available
  for them comes from third-party SEO blogs, several of which sell competing products, and
  those figures disagreed with each other on the day this was written.
- **interviewing.io does not publish prices at all.** Their own front page offers a free AI
  interviewer and paid human sessions and says to sign up to see what those cost
  (accessed 2026-08-20).

So the pages state **no competitor price**. Not approximate, not hedged. That is a real
narrowing of what this task originally imagined, and it is the correct one: an out-of-date
figure that happens to favour us is the most dishonest thing a comparison page can carry
and the easiest to acquire by accident.

**What they compare instead is the SHAPE of the approach**, which is stable and publicly
visible. Every cell is one of three kinds, and a cell needing a fourth was cut - which is
why some rows read "not compared":

1. a fact about ShipItHQ, naming the file it was read from
2. a property of the category, argued rather than asserted
3. a quote from the competitor's own page, with the URL and the date

**The source column is printed on the page**, not hidden in a comment. A claim nobody can
check is a claim we should not have made.

**Two structural guards against this becoming an advert.** What the alternative is good at
comes FIRST, before any argument for us - enforced by the data model, which puts
`creditWhereDue` before `argument`. And there is a "pick them if" section the same size as
"pick us if"; if that one is ever quietly shortened, the page has stopped being a
comparison.

**Not shipped:** any page whose claims could not be sourced. That is why there are two
comparisons and not six.

### WEB-12 / WEB-13 / WEB-14 - Navigation

**Status:** all three done (2026-08-20)
**Serves:** DoD 3

The design did not change. The floating pill, its scroll behaviour, the brand mark and the
CTA are as they were - the complaint was navigation depth, not appearance.

**Structure.** Features (6 rows), Compare (2 rows), Resources (4 rows), Pricing as a
top-level link because it is the second most-clicked item on a marketing site.

**The four mechanics, all ported:**

1. **120ms close delay.** The gap between tab and panel is crossed by a diagonal mouse.
   The panel's `pt-3` also means the pointer is still inside the group while travelling, so
   the timer is rarely needed and reliable when it is.
2. **Escape closes, and focus returns to the trigger.** Listener mounted only while open,
   so the page carries no global keydown handler at rest.
3. **Rows are titled and described.** Copy in `nav-links.ts`, shared by the desktop
   dropdown and the mobile accordion - they were going to be two literal arrays and drift,
   which is exactly what the three blog cards did.
4. **`overflow-visible` on the pill**, so the open tab meets the panel instead of being
   clipped into a floating rectangle.

**`z-50` -> `z-40`.** `@repo/ui`'s Sheet and Dialog are both `z-50`; a navbar at the same
level competes with them on DOM order alone, which resolves differently depending on when
the portal mounts.

**The trigger is a `Link`, not a `button`.** It was first written as a button with an
onClick setting `window.location.href`, which throws away client-side navigation, is not
middle-clickable, and is not crawlable. Hover or focus opens the panel; Enter navigates.

**Mobile (WEB-13):** hover is meaningless on touch, so panels are accordions in the sheet,
with a `min-h-12` tap floor. Fixed a live dark-mode bug while in there: the mobile links
carried `dark:bg-white` next to `dark:hover:bg-neutral-900`, and both `dark:text-neutral-400`
and `dark:text-neutral-900` on the same element.

**Verification (WEB-12):** crawled every internal link on nine pages - **43 distinct
links, all 200**. No dead ends from the nav.

**The footer changed too, and it was a real bug.** Its Platform column linked to
`${APP_URL}/practice` and friends, so a signed-out visitor clicking "Practice" in the
footer - the place a not-yet-convinced reader goes looking - was bounced to a sign-in wall.
It points at `/features#practice` now, and a Compare column was added.

---

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

**Status:** done for the `PageHero` surface and the blog OG card (2026-08-20).
Landing page and blog article body still open.
**Serves:** DoD 8

**Method - composited, not screenshotted.** A screenshot only measures the crop the
viewport happened to produce. The hero photograph is `bg-cover`, so ANY part of it
can end up behind any part of the type depending on aspect ratio. So the surface
was rebuilt in Python from the real `ridge-blur.webp` through the exact stack the
browser composites -

  `bg-neutral-100` -> photo at 70% -> `from-white/60 via-white/45 to-white/75` -> grid at `#8080800f`

- and every pixel of the photograph sampled. The worst case is **rgb(177,177,177)**.
Every ratio below is against that pixel, so they hold at every viewport.

**Three real failures, all fixed.**

| pair | was | now | floor |
|---|---|---|---|
| eyebrow `text-neutral-600` -> `700` | 3.64:1 FAIL | 4.84:1 | 4.5 |
| fact label `text-neutral-600` -> `700` | 3.64:1 FAIL | 4.84:1 | 4.5 |
| secondary CTA border `/20` -> `/60` | 1.45:1 FAIL | 3.50:1 | 3.0 |
| `versus` rule `/15` -> `/60` | 1.31:1 FAIL | 3.50:1 | 3.0 |
| title `neutral-900` | 8.36:1 | 8.36:1 | 3.0 |
| sub `neutral-700` | 4.84:1 | 4.84:1 | 4.5 |
| fact value `neutral-900` | 8.36:1 | 8.36:1 | 4.5 |
| secondary CTA text `neutral-800` | 7.06:1 | 7.06:1 | 4.5 |
| primary CTA white on `neutral-900` | 17.93:1 | 17.93:1 | 4.5 |
| ledger divider `/10` -> `/25` | 1.10:1 | 1.60:1 | exempt |

Two judgement calls worth keeping:

**Fixing it in the wash was tried and rejected.** Lightening the gradient enough to
carry `neutral-600` reaches 4.48:1 at best - still short - and washes the ridge out
to almost nothing. That spends the entire point of the surface to save one shade of
grey. Darkening two labels is the cheaper correct fix.

**The two borders are not decoration.** The secondary CTA's border is the ONLY thing
marking it as a button, and the `versus` rule is the only separation between the
aside and the title, so both fall under WCAG 1.4.11 at 3:1 rather than being exempt.
The `ledger` divider above the facts genuinely IS decoration - the list structure and
spacing already do that job - so it is listed as exempt rather than quietly counted
as a pass.

**Still open:** the landing page sections and the blog article body. Features and
Compare cannot be audited until WEB-10/WEB-11 build them.

---

## Landing composition

### WEB-30 - Port `reveal` and `lazy-mount`

**Status:** done (2026-08-20)
**Serves:** DoD 7

**`reveal.tsx` already existed here and had the richer API** - stagger groups,
reduced-motion, a `fadeOnly` escape for the sticky-transform trap. It was also
framer-motion, one client component per revealed block.

The reference's is 57 lines, ships **zero JavaScript**, and is a SERVER component:
a plain element carrying a class, flipped by one site-wide IntersectionObserver.
Fifty blocks cost one observer instead of fifty components. On a marketing site,
where the score is decided by main-thread JS rather than bytes, that architecture
wins outright - so this was a rewrite onto the reference's mechanism, keeping the
useful half of the old API.

Landed:
- `reveal-observer.tsx` - the single observer, mounted once in the root layout.
  Handles all three arrival routes: initial HTML, client-side navigation
  (`usePathname`), and late mounts from `LazyMount` (MutationObserver, rAF-batched).
- `.sh-reveal` in the shared stylesheet, **with the 3s failsafe keyframe**. That is
  what makes this safe on content: an element at `opacity: 0` waiting for JS that
  never arrives is invisible forever.
- `reveal.tsx` rewritten as a server component. `fadeOnly` kept; `RevealItem` now
  takes an `index` and staggers via a CSS custom property rather than a parent
  variant, since there is no JS to orchestrate one.
- `lazy-mount.tsx` ported.

**One self-inflicted break worth recording.** The CSS edit used a string replace on
`.sh-reveal.sh-in {`, which matched the first occurrence - inside the doc comment
above the rule, not the rule. That broke the SHARED stylesheet, so every app 500'd
on a CSS syntax error. It is the same delimiter-inside-a-delimited-region trap as
`docs/responsiveness.md` section 10, and it was caught by running the dev server,
not by the typecheck. Verified the repair by diffing brace and comment balance
against `git show HEAD:` - the delta was +5/+5, so no drift.

### WEB-52 - `use client` audit

**Status:** done for `components/landingpage` (2026-08-20)
**Serves:** DoD 7

Nine of eleven landing sections were client components. Four of them -
`credits-section`, `assessments-section`, `featuressection`, `aitoolssection` -
had **zero interactivity**: no state, no handlers, no refs. They were client
components purely to run a framer-motion scroll fade, which `Reveal` now does with
no JavaScript at all.

All four are now server components. Landing page: **9 client sections -> 7**, and
six framer-motion importers left where there were ten.

The remaining client sections earn it: `faqs` (accordion state), `projects-section`
(fetches stats), `herosection` (rotating panel), `homepagenavbar` (menu),
`pricing-section` (currency toggle), the two testimonial files (hidden anyway).

Still to audit: the rest of `apps/web` (20 client components site-wide).

### WEB-51 - Lazily mount below-fold sections

**Status:** DEFERRED, and the reason is a correction to this plan
**Serves:** DoD 7

`06-performance.md` says to lazily mount every below-fold section. Reading
`LazyMount`'s own contract while porting it makes clear that would be **wrong here**:

> ONLY use this around a section that is genuinely client-only and carries no
> indexable text. Wrapping a server-rendered section pulls its markup out of the
> initial HTML and costs real SEO.

Every below-fold section on this landing page carries indexable text - features,
assessments, credits, pricing, FAQ - and four of them were just converted TO server
components. Wrapping them would undo that and take the copy out of the HTML, which
is a far worse trade than the JavaScript it saves.

`LazyMount` is ported and available for a section that is genuinely heavy and
decorative - the container demo in WEB-34 is the likely first real use. Revisit
after WEB-35 with the measured numbers from WEB-50 rather than on principle.

### WEB-31 - Problem section

**Status:** done, **adapted rather than ported** (2026-08-21)
**Serves:** DoD 6

`components/landingpage/problem-section.tsx`. Five clauses, one per line, staggered in.

**The deviation, and why.** The reference animates each WORD's opacity and blur against
scroll progress with `useScroll`/`useTransform`. It is a lovely effect and it costs a
framer-motion client component with a scroll listener on the landing page. Four sections
had just been converted OFF framer-motion for exactly that reason (WEB-52), and adding a
heavier one back in the same pass would be spending the performance budget on the first
decorative thing that asked for it.

The clauses stagger in with the zero-JS `Reveal` primitive instead: same reading rhythm,
one idea at a time, no runtime. If the per-word focus-pull is wanted later it should arrive
with a Lighthouse number beside it, per rule 6 of the budget.

**Clauses, not a paragraph**, was ported as-is - it is a list of five places preparation
leaks, and set as one justified block that structure disappears.

### WEB-32 - Four feature sections into one

**Status:** done (2026-08-21)
**Serves:** DoD 6

`capabilities-section.tsx` replaces `featuressection`, `aitoolssection`,
`assessments-section` and `credits-section`. All four are deleted.

**They really did duplicate.** Two of them made *literally the same claim*: "Real Linux
Sandbox" in one and "Interactive Labs - learn by deploying real code in cloud-based
sandboxes" in another. A reader met the container twice with no way to know it was one
feature. The credits section's three points were already in the pricing section
("Credits never expire. Your balance is yours forever.").

**The new one reads from `FEATURE_MODULES`** - the same array `/features` renders. That is
the whole value: the landing page cannot drift from the features page, because there is one
list. The icons come from `nav-links.ts` for the same reason.

**Three claims were checked while collapsing, and one was nearly wrong.** "Job Matching -
get matched to roles that actually fit" had never been verified. It IS real - the
`jobRecommendations` table has a `matchScore`, `actions/jobs/browse.ts` orders by it, and
`actions/jobs/applications.ts` gates an application on it - so it survived, and the
**features page was corrected** because it had understated Jobs. Two others did not survive:
"sprints and tasks with acceptance criteria" (no `acceptanceCriteria` anywhere in the repo)
and "timed simulations with deadlines" were not carried over. XP and streaks are real
(`total_xp`, `current_streak`, `longest_streak` in the schema).

### WEB-33 - FAQ structure

**Status:** done (2026-08-21)
**Serves:** DoD 6

The plan predicted this: *"Check whether it emits `FAQPage` JSON-LD - if so that is an SEO
win the current one may lack."* **It lacked it.** `/pricing` emitted `FAQPage`; the landing
page did not, so nine well-written answers on the highest-authority page on the site were
invisible to the one rich result that quotes answers directly.

The list is now `faq-data.ts`, and `app/page.tsx` builds the schema from the SAME array the
accordion renders. It could not before, because the data lived inside a `"use client"`
module - the only alternative was a second copy of nine questions, which would have drifted
the first time one was edited. Google requires the marked-up answer to match the visible
one, and one array is the only way to guarantee that without a test.

**Two content bugs found in there and fixed.** The section intro read *"Everything you need
to know about the platform, certifications, and technical capabilities"* - directly above an
answer saying "Do I get a certificate? No, and that is deliberate." And the support button
pointed at a `gmail.com` address while `BRAND.email` is used everywhere else, so there were
two inboxes and one of them unwatched.

### WEB-34 - Container demo

**Status:** done, but **reshaped** (2026-08-21)
**Serves:** DoD 6

`proof-section.tsx`. It shows the **Dockerfile**, quoted verbatim from
`apps/shipitworker/Dockerfile`.

**Both of the plan's options were rejected, and the second one is the interesting refusal.**

A live demo needs a public rate-limited execution endpoint that does not exist, with its own
abuse surface. That is a separate piece of work, as the plan already said.

The fallback was "a recorded terminal is still better than a bullet point". That transcript
has to be generated somewhere, and the only compilers on this machine are **Apple clang**,
which prints a visibly different diagnostic from the GNU g++ that actually runs in the
container. There is no Docker here to generate a real one. Shipping clang output captioned
"real compiler output" would be a fabricated screenshot on a page whose entire argument is
that nothing here is faked - so it was not shipped.

The Dockerfile is better evidence anyway, and it is the one thing nobody bothers to fake: a
reader who does not believe the claim can go and read the file. When a public execution
endpoint exists, this section should become the live demo and the Dockerfile moves to a
caption underneath it.

### WEB-35 - Reorder

**Status:** done (2026-08-21)
**Serves:** DoD 6

```
Hero          the promise
Problem       what is broken about how people prepare today
Capabilities  what the product does about it - one section, not four
Proof         the container, the thing a competitor cannot show
Projects      the concrete output you walk away with
Compare       why this and not the free alternative
Pricing       the ask
FAQs          the objections
```

The rule for adding a section is written into `app/page.tsx`: it has to answer a question
one of these raises and that none of them answer. If it answers a question already answered,
it belongs inside an existing section. That is what stops the page returning to a catalogue.

Also added `WebSite` JSON-LD with an `@id` matching the one the blog's Article schema uses,
so the two describe one publisher rather than two.

### WEB-36 - Compare section

**Status:** done (2026-08-21)
**Serves:** DoD 6

`compare-section.tsx`, reading from the same `COMPARISONS` array as `/compare`.

The heading is **"Keep using LeetCode."** That is not modesty - a reader who has spent six
months on LeetCode knows it works, and a section implying otherwise has told them the page
is dishonest before they reach the argument. Quotes no competitor price, for the reasons at
the top of `comparisons.ts`.

---

---

## Blog images

### WEB-40 - GATE: does the OG generator read `heroImage`?

**Status:** done (2026-08-20). **The gate is OPEN - WEB-41 through WEB-45 may start.**
**Serves:** DoD 5

**No.** `app/(home)/blogs/[slug]/opengraph-image.tsx` never touches `post.heroImage`.
It reads `title`, `category`, `author` and `readingTime` and composes the card out of
type and CSS on a dark gradient. Deleting every hero raster cannot break a single
social card, because no social card has ever looked at one.

That is exactly the property that makes the blog-image work safe, so it is now
written into the file's header comment rather than living only here.

**Two real defects found while reading it, both fixed.**

The logo tile was the letter **"B"** - the wrong initial for ShipItHQ - set in
`#0a0a0a` on a `#171717` tile. Measured on the rendered PNG that is **1.10:1**: an
invisible wrong letter, on every social card the blog has ever produced. It is now
the actual mark from `public/logo.svg`, the 3x3 ascending staircase, rebuilt out of
six divs at **19.44:1**.

It is rebuilt rather than imported because `logo.svg` is `fill="currentColor"` so
one file can serve black-on-light and white-on-dark, and satori resolves neither
`currentColor` nor an external file at build time. Six divs beats a second,
colour-baked copy of the logo that would silently drift from the first.

The byline rule was `#171717` on a near-black ground (1.2:1, a rule nobody could
see) and the reading time was `#737373` at 3.7:1. Now 3.85:1 and 6.97:1.

All numbers measured with Pillow on the actual rendered 1200x630 PNG fetched from
the dev server, not computed from the source colours.

### WEB-41 - Topic glyphs

**Status:** done (2026-08-20)
**Serves:** DoD 5

Seven glyphs in `app/(home)/blogs/_components/topic-glyph.tsx`, one per
`BLOG_CATEGORIES` entry: a pair of speech bubbles, a rising ladder, a ruled page with a
tick, a binary tree, a browser frame, a branch merging back, and a terminal caret.

Server-rendered SVG, `currentColor` throughout, `aria-hidden`. No `use client`, no motion.
They render on the hub `h1`, the "other topics" row, and every card's category line - the
row of seven identical grey pills is gone from both places it existed.

`aria-hidden` because the glyph always sits beside a text label that already names the
topic. A screen reader hearing "DSA and Practice, image, binary tree" has been told the
same thing twice.

### WEB-42 - Inline images to HTML

**Status:** done (2026-08-20). All 13 converted or deleted.
**Serves:** DoD 5

Decided per image, not in bulk:

| image | verdict |
|---|---|
| `dsa-inline-1` complexity cheat sheet | **table** - 9 structures x access/search/insert/delete, plus when to reach for each |
| `dsa-inline-2` DP table | **table** - Coin Change `[1,3,4]` to 6, worked cell by cell, with the greedy-vs-DP gap called out |
| `resume-inline-1` before/after ATS | **two code blocks** - the literal text an ATS extracts from a two-column resume, then from a single-column one |
| `resume-inline-2` skills section | **deleted** - the code block directly above it already WAS a well-structured skills section |
| `system-design-inline-1` architecture | **inline SVG** - client, CDN, load balancer, app servers, cache, database, with `<title>` and `<desc>` |
| `system-design-inline-2` Kafka | **inline SVG** - two producers, three partitions, a consumer group, and the one-partition-one-consumer rule that caps parallelism |
| `opensource-inline-1` good-first-issue | **table + query** - the five label spellings maintainers actually use, and a GitHub search string with `no:assignee` |
| `opensource-inline-2` a good PR | **code block** - a real PR description template, with why `Closes #482` is the load-bearing line |
| `portfolio-inline-2` a good README | **code block** - the README skeleton the prose describes, filled in |
| `interview-inline-1` person on a video call | **deleted** - stock photograph, no information |
| `portfolio-inline-1` laptop on a desk | **deleted** - stock photograph, no information |
| `ai-tools-inline-1` Claude's UI | **deleted** - a screenshot of a third-party interface. Cannot be reproduced honestly as HTML and dates the moment that product last redesigned |
| `ai-tools-inline-2` tool workflow | **deleted** - it sat immediately above a section called "The AI Developer Stack in Practice" that lists the same workflow in prose |

Five deletions is more than the plan predicted, and the reason is consistent: those five
were duplicating the sentence next to them rather than showing something the text could
not.

**Two things the conversion needed that the plan did not anticipate.**

The README block contains a nested fenced code block, and three backticks inside three
backticks closes the outer fence. The outer one is four backticks now, and there is a
fence-balance check that reads every post.

The complexity table is six columns and cannot fit 360px at a readable size. Tables are
now wrapped in a `.table-scroll` container by `lib/blog-renderer.ts` after conversion,
because a markdown table has nowhere to hang a wrapper of its own. Without it the
document scrolls sideways, which is exactly the failure `docs/responsiveness.md` names.

### WEB-43 / WEB-44 - Drop `heroImage`, delete the rasters

**Status:** done (2026-08-20)
**Serves:** DoD 5

`heroImage` is gone from `BlogPost` entirely - the optional field and all seven values.
`public/og/blog/` is deleted: 21 files, **1.7MB**.

Grepped before deleting, not after. That grep found the one reference the plan had not
listed: `/blogs`'s own `og:image` still pointed at `blog-index-hero.webp`, and it now has
a generated card of its own from the same builder.

### WEB-45 - Social cards still generate

**Status:** done (2026-08-20)
**Serves:** DoD 5

Both routes render, both are prerendered, and the numbers are measured rather than
asserted:

| post | rasters before | generated cover now | change |
|---|---|---|---|
| `dsa-study-plan-coding-interview` | 177,826 B | 72,655 B | **-59%** |
| `system-design-interview-prep` | 223,226 B | 79,253 B | **-64%** |
| `software-engineering-portfolio-guide` | 244,032 B | 74,895 B | **-69%** |

**The honest counter-entry.** `/blogs` got HEAVIER, not lighter. The cards used to be
text-only; they lead with a cover now. Mitigated by making every grid cover `lazy` and
only the featured one `eager` - the initial HTML carries 1 eager and 16 lazy - so the page
fetches one image before the reader scrolls, and that image is the LCP element anyway.

**A known cost, recorded rather than hidden.** `next/og` emits PNG, and a flat gradient
with text on it is a case where PNG is a poor format - a webp of the same card would be a
fraction of the size. The cards are also 1200x630 while a grid card displays at roughly
400px, so a card ships about three times the pixels it shows. Both are acceptable at this
count and both are worth revisiting if the blog reaches fifty posts. The reason it is not
fixed now: `ImageResponse` has no format option, and a second smaller variant doubles the
build artifacts to save bytes on images that are already lazy.

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
