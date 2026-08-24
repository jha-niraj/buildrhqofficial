# App shell - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| SHL-1 | Promote the auth backdrop to a shared component | 2, 3 | done (2026-08-20) |
| SHL-2 | Use it as the shell backdrop in `app/(main)/layout.tsx` | 2, 4 | done (2026-08-20) |
| SHL-3 | Strip page-level backgrounds under `app/(main)` | 1, 5 | done (2026-08-20) |
| SHL-4 | Audit client components for redundant page backgrounds | 1 | done (2026-08-20) |
| SHL-5 | Fix the stale full-screen route path | 5 | done (2026-08-20) |

---

## SHL-1 - Promote the auth backdrop to a shared component

**Status:** done (2026-08-20)
**Serves:** 2, 3

**Why.** The backdrop lives in `app/(auth)/_components/auth-backdrop.tsx`. The
main shell needs the same thing, and a second copy means the two drift the first
time either is touched.

**Files**
- new: `components/common/app-backdrop.tsx`
- edit: `app/(auth)/_components/auth-backdrop.tsx` - re-export, keep its own names

**Steps**
1. Move `AuthBackdropSurround` to `components/common/app-backdrop.tsx` as
   `AppBackdrop`, unchanged.
2. `auth-backdrop.tsx` keeps `AuthBackdropPanel` and `AuthBackdropMobile` (both
   auth-specific) and re-exports `AuthBackdropSurround` from the shared file.

**Edge cases**
- **The auth screens must not change by a pixel.** This is a move, not a
  redesign. Same classes, same opacities, same scrim.
- **`/auth/*.webp` paths are absolute from `public/`**, so they resolve the same
  from any route. No path change needed.
- **Do not pull it into `packages/ui`.** The images live in `apps/main/public`;
  a UI-package component referencing `/auth/auth-bg.webp` would silently render
  nothing in any other app that imported it.

**Done when**
Both shells import the surround from one file, and the auth screens are visually
unchanged.

---

## SHL-2 - Use it as the shell backdrop

**Status:** done (2026-08-20)
**Serves:** 2, 4

**Why.** The shell paints a flat `bg-neutral-100 dark:bg-neutral-900`.

**Files**
- edit: `app/(main)/layout.tsx`

**Steps**
Render `<AppBackdrop />` inside the shell's outermost element, which needs
`relative` so the backdrop can be `absolute inset-0`, and the card row needs to
stack above it.

**Edge cases**
- **Keep the flat colour underneath.** The `.webp` is a network fetch; without a
  base colour the first paint is a white flash in dark mode.
- **Stacking.** The backdrop is `absolute inset-0` with no z-index; the sidebar
  and card row must be positioned to sit above it. The sidebar is `fixed`, so
  check it specifically.
- **`overflow-hidden` on the shell** already clips the backdrop. Do not add a
  second scroll container.
- **The full-screen routes** (`isFullScreenMode`) return before the shell renders
  and must stay that way - a code editor does not want a photograph behind it.
- **The offline fallback** renders instead of the shell. Leave it alone.
- **Cost.** One `background-image` on one element. The blurred file is 4.3KB.

**Done when**
`/home` shows the textured backdrop in the gutter around the page card in both
themes, and the practice editor routes are unchanged.

---

## SHL-3 - Strip page-level backgrounds under `app/(main)`

**Status:** done (2026-08-20)
**Serves:** 1, 5

**Why.** 39 wrappers paint their own background over a card that already has one,
in at least six different colours. This is why pages look like different products.

**Files**
- ~39 files under `app/(main)`, listed by the scan in the task run

**Steps**
Remove only the background colour utilities from the **outermost page wrapper**.
Keep every other class on that element.

**Edge cases**
- **`min-h-screen` must stay.** A `globals.css` rule retargets it at `--page-h`
  inside `[data-app-page]`. Removing it breaks full-height pages.
- **Only the OUTERMOST wrapper.** A `bg-white` on a card, sheet, modal, table
  header or empty state inside the page is a raised surface and is correct.
  This is the edge case most likely to be got wrong by a blanket find-and-replace.
- **Full-bleed routes keep their background.** They render outside the card:
  `practice/dsa/[slug]`, `practice/system-design/[slug]`,
  `practice/web-frontend/[slug]`, `practice/web-backend/[slug]`,
  `learn/[subcategorySlug]/[learnSlug]`,
  `ai/jobinterviewassistant/[slug]/codingquestions`. Check against
  `fullScreenPaths` in the layout rather than from memory.
- **`/r/[slug]`** is the PUBLIC resume view. It is under `(main)` but is shown to
  people who are not signed in and may render outside the shell - verify before
  touching it.
- **`bg-gradient-*` and `bg-[url()]`** are deliberate decoration, not a page
  background. Leave them.
- **`selection:bg-*`, `hover:bg-*`, `dark:bg-*` on non-outermost elements** must
  not be caught. Match the outermost element only.
- **`loading.tsx` skeletons must match their page.** If a page loses its
  background, its skeleton loses the same one, or the page visibly changes colour
  when it finishes loading.

**Done when**
No outermost page wrapper under `app/(main)` sets a background colour, except the
full-bleed routes listed above; `tsc --noEmit` passes; and the pages that
previously painted `bg-neutral-50` now match the ones that painted `bg-white`.

---

## SHL-4 - Audit client components for redundant page backgrounds

**Status:** done (2026-08-20)
**Serves:** 1

**Why.** Most of the offenders are `_components/*Client.tsx`, not `page.tsx` -
the page is a thin server wrapper and the client component paints the background.

**Files**
- the client components surfaced by the same scan

**Edge cases**
- **A client component can be either.** Rendered as the whole page, its outer
  `bg-*` is a page background and goes. Rendered inside another page as a section,
  it is a component surface and stays. Decide per file, by finding who renders it.
- **Error and loading states inside a client component** often carry their own
  `min-h-screen bg-*`. Same rule - they are the page in that moment.
- **Modals, sheets and dialogs keep their background.** They are above the page,
  not behind it.

**Done when**
Every client component that acts as a whole page has no background colour, and
every one that acts as a section keeps its surface.


---

## SHL-5 - Fix the stale full-screen route path

**Status:** done (2026-08-20)
**Serves:** 5
**Found:** mid-SHL-3, 2026-08-20. Pre-existing, not caused by this work.

**Why.** `fullScreenPaths` in `app/(main)/layout.tsx` lists
`/ai/jobinterviewassistant/[slug]/codingquestions`. That route does not exist -
the real one is `/ai/interviewassistant/[slug]/codingquestions` (no `job`). So
the coding-questions screen, a full-screen code editor, has been rendering
**inside** the shell card with the sidebar next to it, which is not what the
list was written to do.

It matters to SHL-3 directly: whether that screen keeps its own background
depends on whether it renders inside the card or outside it.

**Files**
- edit: `app/(main)/layout.tsx` - `fullScreenPaths`

**Steps**
Correct the path. Verify every other entry against a real directory rather than
assuming only one was wrong.

**Edge cases**
- **The pattern is converted to a regex** with `[^/]+` for each `[param]` and
  anchored `^...$`, so a trailing segment or a query has to be accounted for.
- **The other five entries** must be checked the same way - a second stale path
  would be the same bug, silently.
- **Once fixed, that route renders outside the card**, so its own
  `bg-gray-50 dark:bg-gray-900` becomes correct and must NOT be stripped by
  SHL-3. Same for its `loading.tsx`.

**Done when**
Every entry in `fullScreenPaths` resolves to a directory that exists under
`app/(main)`, and `/ai/interviewassistant/<slug>/codingquestions` renders with no
sidebar.

**Outcome.** TWO stale entries, not one:
- `/ai/jobinterviewassistant/[slug]/codingquestions` -> corrected to
  `/ai/interviewassistant/[slug]/codingquestions`. That editor now renders
  full-screen as intended, so it keeps its own background.
- `/learn/[subcategorySlug]/[learnSlug]` -> **removed**. There is no learn module
  anywhere in `apps/main`.

All five remaining entries verified against real directories.

---

## SHL-6 - Full pass against `docs/responsiveness.md`

**Status:** done (2026-08-24)
**Serves:** 6

**Why.** The same pass already run against `apps/admin` (ADM-23) and
`apps/web` (WEB-60), now for `apps/main` - the product app, 401 `.tsx`
files across 74 pages, and by far the largest of the three. Niraj asked
for web first, then main.

**Scope.** Unlike `apps/web`, `apps/main` shares admin's bounded-shell
shape exactly - `app/(main)/layout.tsx` publishes the same `--page-h`
custom property pattern SHL-1/2/3 already documented, so section 1 of the
doc (height bounds, `vh` vs `dvh`) is fully applicable here, not mostly
N/A the way it was for the marketing site. Sections 2 (horizontal
overflow), 4 (headers/toolbars) and 6 (sheets/dialogs) are also fully
applicable - this app has ~65 Sheet/Dialog call sites and dozens of card
lists with user-generated text. Section 3 (tables) is N/A - grepped for
`<table`, found exactly one, inside `markdown-renderer.tsx`, already
correctly scrollered. Sections 8/9/9b are N/A - no charts, no calendar
system, no offline routes.

**Files.** All of `apps/main`, per the doc's own "scan by file count, not
module name" warning. Given the scale (401 files), this pass combined a
full mechanical sweep for the doc's known bug SHAPES (bare and
`calc()`-wrapped `vh`, unpinned page-body ScrollAreas, `flex-1` on form
controls, `w-full` + unprefixed `max-w-*` on Sheet/Dialog consumers, `<table`
usage) across every file, with representative reading of the highest-traffic
modules (jobs, companies, profile, projects, credits/transactions,
practice, pathfinder) for the patterns a grep cannot see (nested-flex
truncate, button-row arithmetic) rather than reading all 401 files by hand.
One header/button-row sub-check (22 files across the highest-traffic list
and hub pages) was run by a forked agent against the same rules and its
findings verified and fixed here.

**What was found and fixed, by section:**

*Section 1 (height/scrolling bounds) - by far the largest find of this
pass.* `apps/main` had the exact same `vh`-instead-of-`dvh` shell bug
found in admin, but in FOUR separate shells rather than one, plus it had
leaked into individual pages more than in either other app:
- `app/(main)/layout.tsx` - the main shell's outer wrapper, its `<main>`'s
  own box, the `--page-h` variable it publishes, the full-screen-route
  wrapper (the practice/interview code editors), and the offline
  fallback - five separate `vh` spots in the one file every signed-in page
  renders inside.
- `app/(jobs)/layout.tsx` - the Jobs module's own shell (three `h-screen`
  spots), which additionally had a page-body `ScrollArea` with no
  `orientation`/`reflow` pin and no `min-w-0` at all - given the `reflow`
  fix for exactly this shape in `(main)/layout.tsx`, applied the same fix
  here (confirmed first that no page under `(jobs)` renders a `<table>` or
  relies on this scroller growing sideways).
- `app/(auth)/_components/auth-shell.tsx` - the two-column shell every
  auth screen (`/signin`, `/register`, `/forgotpassword`, `/resetpassword`)
  renders inside. The doc's own text names "the signin page ... on every
  screen" as the highest-value place this bug hides, and it was here too.
- Roughly 30 more `vh` instances across full-screen editor pages (the DSA/
  system-design/web-frontend/web-backend practice workspaces, the coding-
  questions and resume editors, the pathfinder studio and daily-practice
  views, the sprints board) and their `loading.tsx` skeletons, plus every
  `h-[NNvh]`/`max-h-[NNvh]` on a Sheet or Dialog (7 bottom-sheet takeovers,
  4 centered dialogs with an internal scroll cap) - all converted to `dvh`.
  Left `vh` deliberately unchanged on: the two shared `error.tsx` files'
  COMMENTS describing the `[data-app-page]` mechanism (no code there); two
  desktop-only asides (`hidden lg:flex`/`hidden md:block`, where the
  chrome-collapse mismatch cannot occur); an unused, unimported dead
  component (`components/spinners.tsx`) not worth touching in a
  responsiveness pass; and the `globals.css` fallback itself, which SHL-1's
  own reasoning and the doc's comment both confirm is an intentional no-op.

*Section 1, a second class of bug found alongside the `vh` sweep - fixed-
width sidebars with no responsive stacking at all.* Two real
`w-72`/`w-80` sidebar-beside-`flex-1` layouts had NO breakpoint whatsoever,
not even the admin-style `hidden lg:flex` treatment:
- `app/(jobs)/jobs/applications/[applicationId]/interview/components/interview-journey-layout.tsx`
  - a 288px "Interview Progress" sidebar next to `flex-1` main content, on
  the page an applicant needs most on a phone. Left 72px for the main
  column at 360px. Fixed to stack below `lg`, with the fixed width,
  sticky positioning and viewport-height floor all moved behind `lg:`.
- `app/(jobs)/companies/[slug]/mock/mock-hub-content.tsx` - a 320px "Job
  Roles" sidebar next to `flex-1`, same shape, left 40px for the main
  column. Same fix: stacks below `lg`, sidebar's own list gets a `max-h-80`
  cap on mobile instead of the desktop `h-[calc(100dvh-320px)]`.

*Section 2 (horizontal overflow, truncate/min-w-0).* Sampled broadly
across jobs, companies, profile, credits and projects rather than reading
all 401 files; found the nested-flex-context version of the trap (an
ancestor's `min-w-0` doesn't reach a `truncate` element one flex level
deeper) concentrated in a few real files, and confirmed dozens of other
truncate/flex-1 sites already correct:
- `app/(jobs)/companies/companies-content.tsx` - the company name (paired
  with a verified badge) and the headquarters line (paired with a MapPin
  icon), in BOTH the grid-view and list-view card templates (4 fixes, one
  file, two duplicated render paths).
- `components/profile/profile-header.tsx` - the profile name `<h1>`, nested
  one flex level inside the "name + verified badge" row. `flex-wrap` on
  that row does not save it: `truncate`'s own `white-space:nowrap` means
  the h1 cannot shrink by wrapping its text, only by having `min-w-0`.
- `components/profile/profile-view.tsx` - a project card's title, same
  nested-row shape, real risk since project names are user-authored.
- Three `<Input className="flex-1">` form controls with no `min-w-0` -
  the doc's single most-repeated mistake, verbatim: a resume-editor
  end-date field and a skill-category field, and the share-profile
  modal's read-only URL field.
- Confirmed correct and left alone: the AI panel's suggestion cards, the
  transactions/credits list rows, job/company card titles, the interview-
  journey round list, four `min-w-max` search-tab/stat-strip patterns (all
  correctly wrapped in `overflow-x-auto`), and roughly a dozen more
  truncate sites across profile, jobs and projects that already had
  `min-w-0` on the correct (immediate) element.

*Section 2, the shrink-to-fit ScrollArea pin.* `components/ai/ai-panel.tsx`
- the chat conversation ScrollArea docked on every page in the app via the
shell's AI rail - was `flex-1 min-h-0` with no `orientation`/`reflow` and no
`min-w-0`, the exact shape section 2 names as needing the pin. Fixed with
`reflow`, matching the pattern already correct in both app shells. Code
blocks inside chat messages already carry their own horizontal scroller
(`markdown-renderer.tsx`), so nothing inside legitimately needs to grow
sideways.

*Section 4 (headers/toolbars, button-row overflow).* A forked sub-agent
checked 22 of the highest-traffic list/hub page headers and card action
rows against this section; two real findings, both fixed:
- `app/(jobs)/jobs/applications/applications-content.tsx` - an application
  card's action row could hold up to 3 full-text buttons (~420-460px) with
  no wrap at all. Given `flex-wrap`.
- `app/(main)/practice/_components/module-content.tsx` - the module page
  header (breadcrumb+title block vs. an add-button plus three difficulty
  filter pills, ~320px on the right alone) had no responsive prefix at
  all. Given the established `flex-col gap-4 sm:flex-row sm:items-center
  sm:justify-between` treatment.
- The other 20 files checked clean - either already using the
  `flex-col/sm:flex-row` or `flex-wrap` pattern, or well under budget.

*Section 6 (sheets/dialogs).* Two distinct bugs, one shared and one
per-file:
- `packages/ui/src/components/ui/dialog.tsx` - `DialogContent`'s own
  `w-full max-w-lg` had no side margin; being `position: fixed`, `w-full`
  resolves against the full viewport, so every Dialog in every app
  (already found and fixed during the admin pass, confirmed still in
  place here) touched both screen edges on any phone narrower than 512px.
- `app/(main)/practice/_components/add-problem-sheet.tsx` - an UNPREFIXED
  `w-[500px]` (not `w-full` + `max-w`, the doc's more commonly named
  shape, but the same underlying failure: unconditional width wider than
  the viewport) ran the sheet off the left edge of any phone under 500px
  wide. Dropped the unprefixed width, keeping `sm:max-w-[500px]` so the
  primitive's own responsive `w-3/4` mobile behaviour survives.
- Checked all ~65 Sheet/Dialog call sites for the `w-full` + unprefixed
  `max-w-*` combination specifically; every other one either uses the
  `w-full sm:max-w-*` safe form, is a deliberate `side="bottom"` full-
  screen takeover (7 of them, exempted by the doc's own rule), or (one
  case, `PurchaseClient.tsx`) deliberately pairs `w-full` with
  `max-w-[92vw]` to implement the doc's own "leave a ~90% strip" rule
  directly - correct, not a bug.

*Section 10 (traps).* Re-checked after every batch, not once at the end.
Brace-balance of every one of the 55 touched files diffed clean against
`git show HEAD:<file>` - no self-terminating-comment drift. No `//` in JSX
child position introduced (all comments added this pass used `{/* */}`).

**Not fixed, and why:** the ~55 icon-only `size="icon"` buttons without an
inline `aria-label` were surfaced by a grep but not individually verified
- the doc's own calibration data puts this category at roughly 50-60% real
(the rest carry `title=` or an `asChild`-composed child's own label), and
verifying each of 55 by reading its surrounding markup was out of budget
for this pass. Flagged here rather than silently skipped; a follow-up
task should walk this list specifically. `practice-sidebar.tsx`'s
unpinned, un-`min-w-0`'d ScrollArea was reviewed and left alone - it is
`hidden lg:flex` (desktop-only, fixed 280px width) with only short static
module/category labels inside, not user-generated content, so the
shrink-to-fit risk is real in principle but not in practice; noted rather
than fixed to avoid unnecessary churn on stable code.

**Verified:** `cd apps/main && npx tsc --noEmit` clean after every batch
of edits, including after the shared `dialog.tsx`-adjacent checks; brace-
balance diff clean across all 55 touched files; `grep -rn -e "—" -e "–"`
clean across `app` and `components`; dev server restarted and 17
representative routes (both signed-out-redirected and public/preview
ones) returned expected status codes with no runtime errors in the server
log.

**Not verified this pass:** opening each fixed surface at 360x640 on real
or emulated hardware, and the aria-label follow-up noted above - same
honest limits as ADM-23 and WEB-60. This was a markup-and-shape
correctness pass against the doc's own rules, not a device test.

---

## Noted, not actioned

**`/r/[slug]` keeps its own background** (`bg-neutral-100 dark:bg-neutral-900`)
and was deliberately left alone. It is the PUBLIC resume share view, and it wants
to look like a standalone page on a backdrop rather than a page inside the app
card - which is what that colour was doing.

Two things about it are worth a separate look, neither in scope here:
- It lives under `app/(main)`, so it renders inside the authenticated shell,
  sidebar and all. For a link sent to a recruiter that is probably wrong.
- `middleware.ts` has a `_publicRoutes` list that is **unused** (the leading
  underscore), and `/r/` is not in it regardless - so a share link may not work
  for a recipient who is not signed in.
