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
