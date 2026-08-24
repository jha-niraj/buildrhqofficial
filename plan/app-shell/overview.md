# App shell - overview

## What this module is

The frame every signed-in page renders inside: the backdrop, the three floating
cards (sidebar, page, AI rail), and the rules about which layer owns colour.

Its job is that a user moving between `/home`, `/projects` and `/ai/resume` sees
one product rather than three. Today they do not: 39 page-level wrappers paint
their own background, in at least six different colours, over a shell that has
already painted one.

## Definition of done

1. **The shell owns the background. Pages never paint one.** No route under
   `app/(main)` sets a page-level background colour on its outermost element. The
   surface a page sits on comes from the layout's page card and nothing else.

2. **The backdrop is the auth backdrop.** The photographic surround already built
   for the auth screens (`auth-backdrop.tsx`) is the platform backdrop, defined
   once and used by both shells. Not a copy - one component.

3. **It works in both themes without a JS read.** Pure CSS `dark:` variants, so
   the backdrop is never briefly wrong on first paint.

4. **Text contrast is never traded for the effect.** The page card stays opaque.

5. **A page that genuinely needs its own surface says so.** Full-bleed routes
   (the practice editors, the interview runner) are outside the card by design
   and keep their own background - listed explicitly, not discovered.

6. **The shell and the pages inside it are correct against
   `docs/responsiveness.md`.** No page moves sideways at 360px, every sheet
   leaves a mobile strip, the shell's own height bound tracks the visible
   viewport on mobile browsers (not the larger chrome-collapsed one), and no
   button row or truncated label silently overflows its container. Scoped
   and recorded per-finding in SHL-6, following the same pass already run
   against `apps/admin` and `apps/web`.

## Decisions

### The card stays opaque; the backdrop frames it

The obvious move is to frost the page card so the photograph shows through it.
`auth-shell.tsx` already tried and rejected exactly that, and the reason applies
here with more force: `text-neutral-500` help text over a translucent panel drops
under 4.5:1 against the light parts of the image. The app has far more small grey
text than the auth screens do.

So the backdrop is what the cards **float on**, visible in the gutter around
them, the same role it plays at `xl` on the auth screens. It reads as texture and
depth rather than as a picture, which is what a backdrop behind a working UI
should do.

**Consequence, stated plainly:** with the shell's `m-2` gutter the visible strip
is about 8px. The effect is subtle - a warm, textured frame instead of a flat
grey one. Anyone expecting a photograph filling the screen behind their dashboard
will not see that, and should not: it would make the product unusable.

### Removing a page background is not the same as changing it

Two different things turn up in the 39:

- A wrapper painting `bg-white dark:bg-neutral-950` - the same colour the card
  already is. Redundant. Removing it changes nothing visually.
- A wrapper painting something else (`bg-neutral-50`, `bg-neutral-100`,
  `bg-black`, `bg-neutral-900`) - actively fighting the card, and the reason
  pages look different from each other today. Removing it is a visible fix.

Both go. The second is the point.

### `min-h-screen` stays, `bg-*` goes

The two are usually on the same element. `min-h-screen` is load-bearing - a
`globals.css` rule retargets it at `--page-h` inside `[data-app-page]`, so
removing it would break full-height layouts. Only the colour is removed.

## Out of scope

- **`apps/web`, `apps/uni`, `apps/hiring`, `apps/admin`.** Different shells.
- **Component-level surfaces.** A card, a sheet or a modal painting `bg-white` is
  correct - it is a raised surface, not a page background.
- **The sidebar and AI rail cards.** Their colour is the shell's own and stays.
- **Redesigning the backdrop.** The photograph and its scrim are already decided
  in `auth-backdrop.tsx`.
