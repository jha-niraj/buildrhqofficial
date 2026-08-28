# Responsiveness - tasks

Derived from `overview.md`. Ordered by blast radius: the two shells first,
because every screen in both apps renders inside them, then the surfaces.

| ID | Task | Serves | Status |
|---|---|---|---|
| RSP-1 | Both app shells: `vh` -> `dvh` on the shell's own box | 1 | done (2026-08-27) |
| RSP-2 | Both app shells: pin the page-body ScrollArea | 2 | done (2026-08-27) |
| RSP-3 | The auth screens in both apps | 5 | done (2026-08-27) |
| RSP-4 | Sheets and dialogs: `vh` -> `dvh` | 4 | done (2026-08-27) |
| RSP-5 | Truncate / `min-w-0` triage | 3 | done (2026-08-27) |
| RSP-6 | Adopt `--page-h` in the two shells | - | not started (raised, not scheduled) |

**Scan basis.** 199 `.tsx` files (107 hiring, 92 uni), 59 pages, 9 layouts.
Comments stripped before every count, per the doc's own calibration warning that
"a codebase that documents its own rules will fail a naive grep for those rules".

**Categories that came back clean, so nobody re-runs them:**

| check | result |
|---|---|
| `<table>` without a horizontal scroller | **no `<table>` in either app at all** |
| `w-max` / `min-w-max` without a scroller parent | none |
| Sheet/Dialog with `w-full` + an unprefixed `max-w-*` | none - every one uses the safe `w-full sm:max-w-*` form |
| `svh` / `lvh` mistaken for bare `vh` | none present; the unit scan excluded `[dsl]vh` before counting |

---

## RSP-1 - Both app shells: `vh` -> `dvh` on the shell's own box

**Status:** done, verified 2026-08-27
**Serves:** definition-of-done 1

**Why.** `100vh` on a mobile browser is the viewport with the chrome
**collapsed**, which is taller than what is actually visible. A shell bound at
`100vh` therefore runs off the bottom of the screen whenever the URL bar is
showing, and the last thing on the page - which on a list screen is the
pagination - sits underneath it.

This is the same defect ADM-23 found in `apps/admin` and SHL-6 found in
`apps/main`, in both remaining apps, unfixed. The doc's checklist names the trap
precisely: *"Check the SHELL'S OWN box, not just the variable it publishes"*.

Here there is no variable at all, which makes it simpler and worse: nothing
intercepts these values.

**Files**
- `apps/hiring/app/(main)/layout.tsx` - lines 53 and 57
- `apps/uni/app/(main)/layout.tsx` - lines 54 and 58

**Steps** `h-screen` -> `h-dvh` on the shell wrapper and on the content column
in both files.

**Edge cases**
- **Do not convert the loading/error branch at `layout.tsx:39` (hiring) / `:40`
  (uni) without looking.** Those are `min-h-screen ... flex items-center
  justify-center` centring states. `min-h-dvh` is still the right unit, but they
  are a different element from the shell and must be read, not swept.
- **These two apps are NOT `apps/main`.** In main and admin, `h-screen` inside
  `[data-app-page]` is retargeted by a `globals.css` rule and is correct as
  written. Neither of these apps sets that attribute, so the same class means
  something different here. Do not "fix" main by analogy afterwards.
- **`h-dvh` is not valid on every Tailwind version.** Confirm the utility
  compiles in these two apps before relying on it - `apps/main` and `apps/admin`
  already use it, so the shared config supports it, but the check is cheap.

**Done when**
Neither shell file contains `h-screen`, and `npx tsc --noEmit` passes in both
apps.

---

## RSP-2 - Both app shells: pin the page-body ScrollArea

**Status:** done, verified 2026-08-27
**Serves:** definition-of-done 2

**Why.** The doc calls this *"the single highest-yield check in this document"*,
and both shells fail it:

| file | current |
|---|---|
| `apps/hiring/app/(main)/layout.tsx:65` | `<ScrollArea className="h-full w-full">` |
| `apps/uni/app/(main)/layout.tsx:67` | `<ScrollArea className="flex-1 w-full">` |

Radix wraps a ScrollArea's viewport children in a `min-width:100%;
display:table` element, and `display:table` is shrink-to-fit - it sizes to its
content's max-content width. So **one nowrap descendant anywhere in either app
can widen the whole page body**, and because the viewport clips `overflow-x`,
everything to the right is silently cut off rather than scrolled.

The symptom the doc describes is the one worth remembering: the page is not
narrow, it is *shifted* - a two-column grid shows column one clipped and column
two nowhere at all, and it reads as "zoomed in".

`apps/main` hit exactly this on `/home` and it took a manual review to find; the
fix was the `reflow` prop, which `packages/ui`'s ScrollArea has carried since
(`scroll-area.tsx:43`).

**Files** the same two layout files as RSP-1.

**Steps** Add `reflow` and `min-w-0` to both.

**Edge cases**
- **Check what is inside before pinning.** The doc is explicit that a ScrollArea
  wrapping a wide table is NOT a page body - it is the table's horizontal
  scroller, and pinning it crushes the table. Neither app contains a single
  `<table>` (verified), and neither has a `min-w-[...]` inside these scrollers,
  so the pin is safe here. Confirm that before applying it, not after.
- **`reflow` and `orientation="vertical"` say the same thing; do not write
  both.** The shared primitive already defaults `orientation` to `"vertical"`,
  and `reflow` adds `[&>div]:!block [&>div]:!min-w-0` on top. `apps/main`'s and
  `apps/admin`'s shells both use `reflow`, so match them.
- **`min-w-0` on the ScrollArea itself is a separate fix from the pin** and both
  are needed - the pin stops the inner table box growing, `min-w-0` stops the
  ScrollArea's own flex item refusing to shrink.

**Done when**
Both shells' body scrollers carry `reflow` and `min-w-0`, and `tsc` passes.

---

## RSP-3 - The auth screens in both apps

**Status:** done, verified 2026-08-27
**Serves:** definition-of-done 5

**Why.** 13 `min-h-screen` bounds across signin, register, verify,
forgotpassword, resetpassword and onboarding, in each app. The doc has a named
warning about this exact gap - a pass scoped to the main route group misses the
auth pages, *"the first screen every user sees on a phone"* - and SHL-6 recorded
finding the same bug in `apps/main`'s `auth-shell.tsx` for the same reason.

**Files**
- `apps/hiring/app/(auth)/` - `signin/page.tsx` (2), `register/page.tsx` (2),
  `verify/page.tsx` (3), `forgotpassword/page.tsx`, `resetpassword/page.tsx`,
  `resetpassword/_components/resetpassword.tsx` (2), `onboarding/page.tsx` (2)
- `apps/uni/app/(auth)/` - the same set, plus `onboarding/loading.tsx`

**Edge cases**
- **A `min-h-screen` centring wrapper is the correct SHAPE.** The bug is the
  unit, not the pattern. `min-h-dvh flex items-center justify-center` still
  centres; it just centres in the space that exists.
- **`onboarding/loading.tsx` must match its page.** The repo rule is that a
  skeleton which does not match its page is worse than none. If the page's bound
  changes, the skeleton's does too, or the screen visibly reflows on load.
- **Check for a scroll-driven `sticky` first.** The doc records one place the
  rule inverts: a section animated by `useScroll` / `scrollYProgress` wants
  stable `vh`, because `dvh` moves under it as the chrome hides. Auth screens are
  unlikely to have one, but the landing-page hero sections in both apps
  (`components/landingpage/hero-section.tsx`, `min-h-screen`) are exactly where
  one would be - read those two before converting them.

**Done when**
No `min-h-screen` remains under either `(auth)` tree, and each converted page's
`loading.tsx` matches it.

---

## RSP-4 - Sheets and dialogs: `vh` -> `dvh`

**Status:** done, verified 2026-08-27
**Serves:** definition-of-done 4

**Why.** 10 bare `vh` values, all on sheets and dialogs. A sheet at `h-[95vh]`
on a phone with chrome showing is taller than the screen, so its footer - which
is where the confirm button is - is under the URL bar.

| file | line | value |
|---|---|---|
| `hiring/.../application-detail-sheet.tsx` | 92, 105 | `style={{ height: "80vh" }}`, `h-[calc(80vh-80px)]` |
| `hiring/.../candidates-content.tsx` | 541 | `h-[95vh]` |
| `hiring/.../interview-config-content.tsx` | 468, 491, 549 | `h-[90vh]` x2, `h-[95vh]` |
| `hiring/app/(main)/invoices/page.tsx` | 155 | `max-h-[90vh]` |
| `hiring/components/landingpage/navbar.tsx` | 142 | `max-h-[80vh]` |
| `uni/components/assignments/teacher-project-generate-sheet.tsx` | 361 | `h-[80vh]` |
| `uni/components/landingpage/navbar.tsx` | 137 | `max-h-[80vh]` |

**Edge cases**
- **Two of these are inline `style={{}}`, not classes.** The doc has a specific
  warning: *"Scans must read `style={{ ... }}` as well as `className`"* - five
  `vh` bounds hidden that way survived four separate passes of another app. The
  scan used here reads both; a future one must too.
- **`h-[calc(80vh-80px)]` and the `style` on the same component are a PAIR.**
  The 80px is the header the body has to sit under. Converting one and not the
  other leaves the body 80px wrong in the direction the chrome moves.
- **`side="bottom"` full-screen takeovers are exempt.** The doc's own rule: a
  deliberate `h-[100dvh] w-full max-w-full` bottom sheet is a screen, not a
  sheet over a screen. Check `side` before flagging - the two `h-[90vh]
  rounded-t-3xl` ones are bottom sheets that deliberately stop short of full
  height, which is a third case again: they want the strip, so they convert to
  `dvh` and keep their percentage.

**Done when**
`grep` for a `vh` value not preceded by `d`, `s` or `l` returns nothing in
either app outside a comment.

---

## RSP-5 - Truncate / `min-w-0` triage

**Status:** done, verified 2026-08-27
**Serves:** definition-of-done 3

**Why.** 30 `truncate` sites carry no `min-w-0` on the element itself. The doc
calls this *"the single most repeated mistake in the list"*, with a named
symptom: labels rendering as `GRADUATEI`, `TRANSFERREI` - clipped by an ancestor
rather than ellipsised by themselves.

**It is also the category most likely to be a false positive**, and the doc says
so: `min-w-0` on the immediate flex parent is a correct and common fix, and a
scan that only reads the element's own class list cannot see it. The 30 have to
be read, not swept.

**Files** 20 in `apps/hiring`, 10 in `apps/uni`. The scan output is the list.

**Steps**
1. For each, find the nearest flex/grid ancestor and check whether the chain
   from a bounded box down to the `truncate` element is unbroken.
2. Fix only where it is broken, at the element that actually lacks the floor.

**Edge cases**
- **`flex-wrap` on the row does not save it.** SHL-6 recorded this from
  `profile-header.tsx`: `truncate` sets `white-space: nowrap`, so the element
  cannot shrink by wrapping its text - only `min-w-0` lets it shrink at all.
- **The nested case is the one that gets missed.** An ancestor's `min-w-0` does
  not reach an element one flex level deeper. Both `profile/page.tsx` files and
  both `roles/page.tsx` files have the name-plus-badge row shape that hid this
  in `apps/main`.
- **`truncate max-w-[120px]` is already bounded** and does not need `min-w-0` -
  a definite `max-width` gives the ellipsis something to resolve against.
  `interview-config-content.tsx:375` is this case.
- **Do not add `min-w-0` to a grid child by reflex.** A grid item's default
  `min-width` is also `auto`, but a grid track with a fixed or `fr` size already
  bounds it; the fix belongs on flex children.

**Done when**
Every remaining `truncate` without `min-w-0` has been read and either fixed or
recorded here as correct, with the reason.

---

## RSP-6 - Adopt `--page-h` in the two shells

**Status:** not started - raised, not scheduled

Neither app sets `data-app-page`, so the `globals.css` rule that makes
`h-screen` mean "the page card" in `apps/main` and `apps/admin` does nothing
here. Adopting it would let these two apps share the same contract and would
make a future `h-screen` in a page harmless rather than a bug.

Deliberately not part of this pass: it changes the height every page in both
apps computes against, which is a blast radius that wants its own task and its
own verification, not a line in a units sweep. RSP-1 corrects the units under
the shells as they are.

---

# Outcome of the pass, 2026-08-27

**43 files changed across the two apps.** Every count below was taken with
comments stripped first, per the doc's own calibration warning.

## What was found and fixed

**RSP-1 / RSP-3 - 45 screen-height bounds, every one of them real.**

The important part is *why* they were all real. `apps/main` and `apps/admin`
publish `data-app-page` and `--page-h`, and a `globals.css` rule retargets the
screen-height utilities at that variable - so in those two apps most `h-screen`
uses are already handled and the passes could concentrate on the shells. **Neither
of these apps sets that attribute anywhere.** Every `h-screen` and `min-h-screen`
here was a literal `100vh` with nothing intercepting it.

- Both shells, 4 spots: the wrapper and the content column in each.
- 26 across the `(auth)` trees - signin, register, verify, forgotpassword,
  resetpassword, onboarding, and `onboarding/loading.tsx`. The doc's warning
  about a pass scoped to the main route group missing exactly these is the reason
  they were looked for.
- The rest across the legal pages, the marketing shell and five `(main)` pages.

**The two landing heroes took `svh`, not `dvh`**, per the doc's own note that
`svh` is the better answer for a section that must fit *with* browser chrome
showing. Checked first for a scroll-driven `sticky` - the one place the rule
inverts - and there is no `useScroll` or `scrollYProgress` anywhere in either app,
so the inversion does not apply.

**RSP-2 - both shells' page-body ScrollArea was unpinned.** The doc calls this
"the single highest-yield check in this document", and it was failing on every
screen of both apps: `hiring` had `<ScrollArea className="h-full w-full">`, `uni`
had `flex-1 w-full`. Radix wraps the viewport's children in a
`min-width:100%; display:table` box, which is shrink-to-fit, so one nowrap
descendant anywhere could widen the page body and the viewport would clip
everything to its right rather than scroll to it. Both now carry `reflow` and
`min-w-0`. Verified first that neither app contains a `<table>` or a `min-w-[...]`
inside these scrollers - the doc is explicit that pinning a table's scroller
crushes the table instead.

`uni`'s shell needed a third change: its card stacks `PasswordChangeBanner` above
the scroller in a flex column, and the card had no `min-h-0`, so the scroller
could not shrink and pushed the column past the shell rather than scrolling
inside it.

**RSP-4 - 10 sheet and dialog bounds.** Two of them were inline
`style={{ height: "80vh" }}`, which is the trap the doc records as having
survived four separate passes of another app, and one of those was a **pair** with
`h-[calc(80vh-80px)]` on its body - the 80px being the header. Converting one and
not the other would have left the body wrong by exactly the amount the chrome
moves.

**RSP-5 - 30 truncate sites read, 8 fixed, 22 already correct.**

The doc predicted this ratio and the reason: `min-w-0` on the immediate flex
parent is a correct and common fix that a scan of the element's own class list
cannot see. What was actually broken:

| site | why |
|---|---|
| `application-detail-sheet.tsx:760` | a `<code className="flex-1 truncate">` holding the interview **URL** - the most-repeated mistake in the doc, on its worst possible content |
| `candidates-content.tsx:449` | email beside a `<Mail>` icon; the icon had no `shrink-0`, so it squashed before the text ever ellipsised |
| `company-content.tsx` x3 pairs | the social-link rows: the `<span truncate>` had no floor, the icon tile had no `shrink-0`, **and** the `<Input className="rounded-xl flex-1">` that replaces the span in edit mode is the literal case the doc names - a form control's intrinsic width comes from its `size` attribute, so `flex-1` alone cannot shrink it |
| `jobs-content.tsx:303` | the job title. The row is `flex-wrap`, which does NOT save it: `truncate` sets `white-space: nowrap`, so the element cannot shrink by wrapping - and the flex item is the `<Link>`, not the `<h3>` inside it |
| `team/roles/page.tsx:799`, `faculty/roles/page.tsx:878` | email in a 2-up grid cell, about 160px at 360px |
| `teacher-assessment-create-sheet.tsx:629` | `<Input className="flex-1">` |

**Recorded as correct, so the next pass does not re-decide them:** 22 sites where
the `truncate` element is a block child of a container that already carries
`min-w-0`, and `interview-config-content.tsx:375`, which is `truncate
max-w-[120px]` - a definite `max-width` already gives the ellipsis something to
resolve against.

One incidental fix: `teacher-assessment-create-sheet.tsx:707`, a `flex-1` div
beside a Checkbox holding a name and a description line, picked up `min-w-0` in
the same edit. Kept - it is the same defect, and the identical pattern in its
sibling file `teacher-project-generate-sheet.tsx:722` already had it.

## Categories that came back clean

Re-stated here as findings rather than absences, so nobody re-runs them:

- **No `<table>` in either app at all.** Section 3 is not applicable.
- **No `w-max` or `min-w-max`.**
- **No Sheet or Dialog with `w-full` plus an unprefixed `max-w-*`.** Every one
  uses the safe `w-full sm:max-w-*` form. `invoices/page.tsx:155` has an
  unprefixed `max-w-2xl` on a `DialogContent` but no `w-full`, so the primitive's
  own `w-[calc(100%-2rem)]` survives the merge and the mobile margin is kept -
  correct, not a bug.
- **No `svh` or `lvh` miscounted as bare `vh`.** The unit scan excluded `[dsl]vh`
  before counting, which the doc warns is necessary.

## Verified

- `npx tsc --noEmit` clean in both apps, after each batch.
- **The trap check re-run after every batch, not once at the end**, per the doc's
  own account of how often it is sprung mid-fix: brace, paren and bracket balance
  diffed against `git show HEAD:<file>` for all 43 changed files - zero drift. No
  `//` comment introduced in JSX child position; the two shell comments sit
  immediately inside `return (`, which is a JS context and the form the doc
  explicitly permits there.
- `grep -rn -e "-" -e "-"` (em/en dash check) clean across both apps and this
  plan directory.
- Zero bare `vh`, `h-screen` or `min-h-screen` remain in either app outside a
  comment.

## Not fixed, and why

- **Not opened at 360x640 on real or emulated hardware.** Same honest limit as
  WEB-60, ADM-23 and SHL-6, and the doc says plainly that a pass like this proves
  the markup is correct, not that it was touched on a phone.
- **`RSP-6` (adopting `--page-h`) is not done.** Five `(main)` pages in these apps
  carry `min-h-dvh` *inside* the shell's scroller, which is now correct in unit but
  still slightly taller than the card it sits in. Converting the unit was a strict
  improvement; making it right needs the shell contract, which is its own task.
- **Spinners.** Both shells' `isPending` branch renders `<Loader2 className="animate-spin">`,
  against the repo rule in `CLAUDE.md` that full-page waits use `ShipItHQLoader`.
  ADM-9 removed all 58 of these from `apps/admin`; nobody has done the equivalent
  for `hiring`, `uni` or `main`. Out of scope for a responsiveness pass, flagged
  rather than silently passed over.
- **Section 5 (stat tiles) and the `StatStrip` rule were not swept.** No
  hand-rolled `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` stat strips were found
  in the files read, but this was not scanned exhaustively the way the height and
  overflow categories were. It is the one section of the doc this pass did not
  give a systematic sweep.

---

## RSP-7 - The no-spinners and full-width sweeps (2026-08-28)

- [x] **Status:** done, verified 2026-08-28

**Why.** Two standing rules in `CLAUDE.md` were being broken at scale rather than
occasionally, which makes them not rules:

- **No spinners.** 151 `animate-spin` occurrences across 91 files.
- **Pages take the width they are given.** 70 `max-w-7xl` occurrences across 41
  files, almost all of them `mx-auto max-w-7xl px-6` page containers centring a
  1280px column inside a card that is already bounded by the shell.

### Spinners: 151 to 1

136 of the 151 were the single shape `<Loader2 className="... animate-spin" />`
with a plain string className - no `cn()` expressions anywhere - which is what
made an automated pass safe. Mapped by width: `w-3`/`w-4` to `sm`, `w-5`/`w-6` to
`md`, `w-8`+ to `lg`, keeping margin and colour classes (`InlineLoader` renders
`currentColor`, so `text-neutral-400` still lands).

The remaining 15 were hand-written and needed judgement:

- **8 hand-rolled CSS rings** (`rounded-full border-t-transparent animate-spin`)
  became `InlineLoader`.
- **4 `RefreshCw` buttons** were SWAPPED, not restyled:
  `{syncing ? <InlineLoader size="sm" /> : <RefreshCw />}`. Spinning the refresh
  icon and replacing it are different: the icon has to still be a refresh
  affordance at rest.
- **1 spinning `Clock`** on "Retaking..." - a clock going round is not a loader,
  it is a broken clock.
- **1 decorative ring** in `project-generate-sheet.tsx`, deleted outright. That
  panel already had a `Progress` bar with a percentage, a phase label AND a
  per-step `InlineLoader`; the ring was a fourth, worse progress affordance
  stacked on three good ones.

**One deliberate survivor.** `resetpassword.tsx:228` still spins a `RefreshCw`,
and it carries a comment saying why: it is the resend COOLDOWN, where the motion
tells the user the timer is running rather than stuck. It is not a loading
indicator, so the rule does not apply. Left alone.

### Width: 64 occurrences across 38 files

`max-w-7xl`, `mx-auto` and `container` stripped from page containers,
`w-full` ensured. **One exclusion:** `auth-shell.tsx` keeps its `max-w-7xl` -
that is a bounded CARD with `xl:rounded-3xl` and a ring, deliberately capped so
the sign-in form does not stretch across a wide monitor. The filter skipped
anything carrying `rounded-3xl`, `ring-1` or `shadow-2xl` for that reason. The
five other surviving matches are comments describing past changes, not classes.

Skeleton and page containers were re-checked afterwards and agree on width, which
is the point of the rule in `CLAUDE.md`: a skeleton that does not match the page
is worse than no skeleton, because the page visibly reflows.

**Done when / verified.** `apps/main` typechecks at 0 errors; 13 routes smoke
tested (all 200, `/home` 307 to auth); `grep` for `animate-spin` returns the one
documented exception; the live DOM on `/pathfinder` reports **0** elements
carrying `animate-spin`.

**Not verified:** the rendered widths were not measured in the browser. The Brave
window will not hold foreground long enough to lay out, and every `getBoundingClientRect`
returns 0 while `visibilityState` is `hidden`. The change is a class swap
confirmed by grep and typecheck, which is not the same as seen.
