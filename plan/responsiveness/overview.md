# Responsiveness - overview

## What this module is

`docs/responsiveness.md` is the standard. This directory tracks the work of
actually holding every app in the repo to it.

Three of the five apps have had a full pass. Two have never been touched:

| app | pass | recorded as |
|---|---|---|
| `apps/web` | done 2026-08-24 | `plan/web/polish/tasks.md` WEB-60 |
| `apps/admin` | done 2026-08-24 | `plan/admin/tasks.md` ADM-23 |
| `apps/main` | done 2026-08-24 | `plan/app-shell/tasks.md` SHL-6 |
| **`apps/hiring`** | **never** | this directory |
| **`apps/uni`** | **never** | this directory |

`apps/worker` and `apps/shipitworker` have no UI and are out of scope.

## Why these two are not simply "the last two"

They are the two apps whose shells were never brought onto the `--page-h`
contract, and that changes what the pass has to do.

`apps/main` and `apps/admin` both publish `data-app-page` and a `--page-h`
custom property, and a rule in `packages/ui/src/styles/globals.css` retargets
`h-screen` / `min-h-screen` / `h-dvh` / `min-h-dvh` inside that attribute at the
variable. That rule is why SHL-6 and ADM-23 could treat most `h-screen` uses as
already-handled and concentrate on the shells.

**Neither `apps/hiring` nor `apps/uni` sets `data-app-page` anywhere.** Grep
returns nothing in either app. So in these two apps every `h-screen` and
`min-h-screen` is a literal `100vh` with nothing intercepting it - each one is a
real bound, not a no-op, and each is the mobile-chrome bug the doc opens with.

## Definition of done

1. **Neither app's shell measures the wrong viewport.** The shell's own box, not
   only a variable it publishes, uses the dynamic viewport unit on mobile. The
   doc's own checklist calls this out as the thing most often half-fixed.

2. **Every page-level body scroller carries the pin.** The doc names this "the
   single highest-yield check in this document". Both shells currently have an
   unpinned one, which is every screen in both apps.

3. **No page moves sideways at 360px.** Every `truncate` that can be reached by
   user-generated text has `min-w-0` on the element itself and on the flex
   ancestors between it and a bounded box.

4. **Every sheet and dialog leaves a mobile strip**, and none of them measures
   itself against a viewport unit that mobile browser chrome inflates.

5. **The auth screens are included.** They are the first screen a user sees on a
   phone, they live outside `(main)`, and the doc has a named warning about
   exactly this gap: a pass scoped to the main route group misses them.

6. **What was NOT fixed is written down, per surface.** The doc's own rule: a
   skipped surface is fine, a silently skipped one is not.

## Out of scope

- **Bringing the two shells onto `--page-h`.** That is an app-shell change with
  its own blast radius - every page in both apps computes height against it - and
  it is a different task from correcting the units. Raised as `RSP-6`, not done
  here.
- **A device test.** The doc says plainly that a pass like this proves the markup
  is correct, not that it was opened on a phone. Same honest limit as WEB-60,
  ADM-23 and SHL-6.
- **The `aria-label` sweep on icon-only buttons.** SHL-6 left ~55 of these
  unverified in `apps/main` and flagged them for a follow-up. That follow-up
  should cover all five apps at once rather than being done piecemeal here.
- **Redesign.** Nothing here changes what a screen says or how it is composed.

## Decisions

### `h-screen` in these two apps is a real defect, not a no-op

Stated above and worth repeating, because the same class string means two
different things in different apps in this repo. In `apps/main` and `apps/admin`,
`h-screen` inside `[data-app-page]` is retargeted at `--page-h` and is correct.
In `apps/hiring` and `apps/uni` it is `height: 100vh` and is the bug. A fix
copied from one app to the other on the strength of the class name alone would
be wrong in both directions.

### `flex-1` on a `<Button>` is not the `flex-1` the doc warns about

The doc's most-repeated rule is `flex-1` without `min-w-0` on a **form control**,
and it gives the reason: a control carries an intrinsic width from its `size`
attribute, so `min-width: auto` resolves to something wide. A `<Button>` has no
`size` attribute and its intrinsic width is its label, which is short. The ten
`flex-1` buttons the scan found are paired action rows (Cancel / Confirm), which
is the shape that rule is not about. Checked, not fixed, and recorded here so the
next scan does not re-decide it.
