# Responsiveness benchmark

A checklist to scan a screen against after any responsiveness pass, and the reasoning behind
each item so it can be argued with rather than cargo-culted.

Every rule here comes from a real defect - something that shipped looking fine on a laptop and
was broken on a phone. Where a rule cites a symptom, that symptom was observed, not imagined.

**Nothing in this document is specific to one project.** It names Tailwind and Radix because
that is what the failures were found in, but each rule is a layout fact first and a class name
second.

---

## How to use it

Open the screen at **360 x 640** (not 390 - the extra 30px hides a whole class of overflow),
then walk the sections below in order. Sections 1 and 2 catch the failures that make a screen
unusable; 3 to 6 catch the ones that make it look unfinished; 7 catches the ones that only show up
while data is loading; 8 and 9 cover charts and locale; 9b covers what an offline route takes away
from you; 10 is the traps that break the page you were fixing.

Two habits worth more than the whole list:

- **Scroll the page sideways.** If it moves even 1px, something inside is wider than the screen.
  Section 2 is entirely about finding what.
- **Ask of every screen: can I get to the next screen from here?** A navigation route that only
  exists in a column you hid on mobile is a dead end, and it is invisible on a laptop.

---

## 1. Height and scrolling

### Bound the page on every screen - only the arithmetic changes

The instinct when a bounded list looks cramped on a phone is to unbound it. **Don't.** That
trade was made once and reversed: `height: auto` does give the list room, but it lets the list
grow to its full row count, which puts the pagination underneath it thousands of pixels down
where nobody finds it. You fix a cramped list by making the chrome above it cheaper, not by
removing the bound.

- [ ] The page is bounded at **every** width; the phone's sum just also subtracts the bottom nav.
- [ ] The bound is defined **in one place** (a shell variable), not repeated per page. If N pages
      carry the constraint, a per-page fix is N chances to miss one.
- [ ] **Check the SHELL'S OWN box, not just the variable it publishes.** These are two different
      things and it is easy to fix one and not the other. One app's shell carried a long, correct
      comment explaining why `--gk-page-h` uses `dvh` - and set its own root and its `<main>` in
      `vh`, so the shell ran taller than the visible viewport on every phone while every page
      inside it computed a correct height. The variable is the contract; the shell is a box like
      any other and needs `h-dvh lg:h-screen` itself. A file that documents the rule is not
      evidence it applied it.
- [ ] The mobile bound uses **`dvh`, not `vh`**. Mobile browser chrome makes `100vh` *taller*
      than the visible viewport, so the last rows and the pagination sit under the URL bar.
- [ ] **`svh` and `lvh` also contain the letters `vh`, and `svh` is often already the right
      answer.** `min-h-[100svh]` on a hero is BETTER than `dvh`: `svh` is the small viewport, so the
      section fits even with browser chrome showing. A unit check that matches bare `vh` will flag it
      as a defect. Exclude `[dsl]vh` before believing the count.
- [ ] **A scroll-driven `sticky` section wants `vh`, not `dvh`.** This is the one place the rule
      inverts. `dvh` changes as the chrome hides, so a section whose animation is driven by
      `useScroll` / `scrollYProgress` will jump mid-effect if its height moves under it. `vh` is
      stable and is the correct unit there. Check for a scroll hook before converting a `sticky`
      element.
- [ ] **Grep for the unit INSIDE `calc()`, not just as a bare value.** A check written for `[92vh]`
      does not match `min-h-[calc(100vh-8rem)]`, and that one blind spot hid 15 real bounds through
      six passes of the same app - including the signin page and the sidebar, which is on every
      screen. A check that never fires reads exactly like a clean codebase.
- [ ] After bounding, the list gets a **usable share of the screen** - aim for around half. If it
      does not, the chrome above it is the bug (next item), not the bound.
- [ ] Nothing is trapped in a scroller the user cannot reach - a nested scroll region inside a
      short parent swallows content with no affordance that it did.

### Chrome above a bounded list is paid for in rows

On a bounded page every pixel of header, stats and filters comes straight out of the list. Six
stat cards in a 2-up grid is three rows and about 200px - on a 640px phone that is a third of
the page spent before the first record.

- [ ] **Any strip of stat tiles or quick-link tiles uses `<StatStrip>` from `@repo/ui`.**
      This is the default, not a judgement call - if a page opens with a row of summary figures
      or navigation tiles, it goes in a StatStrip. Do not hand-roll
      `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`: it READS as correctly responsive and is the
      most expensive mobile layout available. Six tiles at 2-up is three rows (~200px); at 1-up
      it is six rows (~400px). On a bounded page that comes straight out of the list; on an
      unbounded one it pushes the real content below the fold.

      `<StatStrip cols={6}>` gives one scrolling row below `sm` and the grid from `sm`. It
      handles the parts that are easy to forget: `min-w-0` on the scroller, a fixed width plus
      `shrink-0` on each tile (a tile in a flex row has no column to fill and collapses to its
      text), and returning the tiles to `w-auto` in the grid.
- [ ] Tiles that are the shared `Card` need `h-auto` inside a StatStrip - `Card` sets `h-full`,
      which in a flex row stretches every tile to the tallest.
- [ ] Long lists inside a *stacked* page (a detail tab, a side panel) carry their own `max-h-*`
      ScrollArea. Capping the row count is not enough - eight rows is still ~440px.
- [ ] **`grid-cols-1` is the most expensive mobile layout a stat strip can have, and it looks like
      the careful choice.** `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4` reads as
      correctly responsive - it even satisfies the form-grid rule - but on a bounded page it stacks
      four ~90px cards into ~400px of a ~536px phone page, and the table underneath gets what is
      left. Four sub-modules in one app shared this exact class string. A horizontal strip costs one
      row instead of four.
- [ ] **A `sm:grid-cols-3` strip is THREE stacked tiles at 360px, not one row.** The mobile base is
      the single column you did not write down. Three tiles of label + figure + sub-line measure
      ~250px stacked; as a horizontal strip the same three cost ~90px. On one bounded page that
      difference was the whole margin between a table showing two rows and one showing six. Budget
      the collapsed form, not the `sm:` form you can see on your laptop.

### When the chrome genuinely will not fit: relax the bound, cap the list

Trimming the chrome has a floor. A page carrying a title, an action, a stat strip, **two chart
panels**, a search box and a filter measures ~770px before the first row - against a ~536px
phone bound. That leaves the list *negative* space, and the failure is confusing rather than
obvious: the list neither shows rows nor scrolls, because there is nothing left for it to do
either in.

Do not force it. Below `lg` such a page scrolls normally and the LIST takes a ceiling:

- [ ] Root becomes `lg:h-[var(--gk-page-h)] lg:overflow-hidden` - bounded from `lg`, natural
      flow below it.
- [ ] The list's ScrollArea takes `max-h-[30rem] lg:max-h-none` **on `viewportClassName`, not on
      the Root**. See the box below - this is the single easiest way to turn this fix into a worse
      bug than the one it replaces. **30rem ≈ 480px, which is 5-6 rows** - enough that the list
      reads as a list and scrolling it feels intentional, while the pagination underneath is one
      short page-scroll away rather than a screen and a half.

> **A `max-h-*` on a ScrollArea Root clips; it does not scroll.**
>
> The Root is not the scroll container - the Viewport inside it is, and the Viewport sizes itself
> with `h-full`. A percentage height does not resolve against a parent whose height is `auto`, and
> a `max-height` does not make a height definite. So the Viewport grows to its full content height,
> the Root clips it at the cap, and **everything past the cap becomes unreachable** - no scrollbar,
> no affordance, just a list that stops mid-row.
>
> It reads as working on a laptop, because above `lg` the cap is `max-h-none` and the flex parent
> supplies a real height. It only breaks at the width you added it for.
>
> Put the cap on `viewportClassName` instead, which is exactly what that prop exists for:
> `<ScrollArea className="min-h-0 flex-1" viewportClassName="max-h-[30rem] lg:max-h-none">`
>
> This was found on 9 ScrollAreas in one module, 3 of them added by a previous pass following an
> earlier version of THIS checklist, which said "the list's ScrollArea takes `max-h-...`" without
> saying where. Padding, borders and rounding stay on the Root; only the height cap moves.
- [ ] Say so in a comment at the root, with the measurement. This is an exception to the
      bounded-page rule and the next person needs to know it was measured, not guessed.

The test: can you see **4-6 rows** before the list's own scroller engages? Fewer and the chrome
still needs trimming; more and the ceiling is too generous and the pager drifts out of reach.

### Fixed bottom chrome

Bottom bars invite a raised circular action in a notch. It is worth knowing that this was built
here and then removed: a notch is two circular arcs of different radii meeting a straight border,
and at real sizes the rim read as a stray arc beside a stark white puck. It also fights its own
row, where every neighbour is a flat icon over a label.

- [ ] An emphasised bar action is a **filled rounded tile inside the bar**, not a disc raised out
      of it. Same emphasis, no geometry to misalign, and it stays part of the row.
- [ ] An icon on a filled control is a **flat single colour**. A gradient-filled glyph on a
      similarly-coloured button renders invisible - which is how a button ships looking empty.

- [ ] A fixed bottom bar carries `padding-bottom: env(safe-area-inset-bottom)`, or its last few
      pixels sit under the iOS home indicator and are untappable.
- [ ] Scrollable content clears the bar; the final row must not be permanently hidden behind it.

---

## 2. Horizontal overflow - the page must not move sideways

Vertical scrolling is expected. Horizontal scrolling on the page root means content to the right
is **cut off**, not reachable, and users rarely discover it.

- [ ] Drag the page sideways at 360px. It does not move.
- [ ] Every `<table>` and every fixed-template-column row is inside its **own** horizontal
      scroller with a sensible `min-width` on the inner element - not crushed, and not leaking.
- [ ] Every `truncate` is paired with `min-w-0` on the same element, **and** `min-w-0` on its
      flex/grid ancestors. This is the single most repeated mistake in the list.

  `truncate` is `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap`. None of
  those shrink a flex item: a flex child's `min-width` defaults to `auto`, meaning "at least my
  content's width", so the row grows instead of the text clipping. `min-w-0` removes that floor
  and is what makes `truncate` actually truncate. Symptom: labels rendered as `GRADUATEI`,
  `TRANSFERREI` - clipped by an ancestor rather than ellipsised by themselves.

- [ ] A `min-w-[...]` intended for a scroll container has not escaped onto an element that sits
      directly in normal page flow.
- [ ] No `whitespace-nowrap` on a long string outside a scroller - a chip strip, a badge row and
      a breadcrumb trail are the usual three.
- [ ] **Every `w-max` has a horizontal `ScrollArea` parent.** `w-max` means "size to content,
      ignore the container" - it is the INSIDE half of the scroller idiom and is a guaranteed
      overflow on its own. Grep for it and check the parent of each. A five-tab `TabsList` written
      `flex w-max min-w-full shrink-0 sm:grid sm:grid-cols-5` measured ~500px with icons, labels and
      counts; the `sm:grid` half was right, the mobile half had no scroller, and the last three tabs
      were unreachable on a phone. The `min-w-full` makes it look deliberate, which is why it
      survives review - it only guarantees the strip is at least as WIDE as the parent, never that
      it fits inside it.

### The shrink-to-fit trap (Radix ScrollArea, and any `display:table` wrapper)

Radix `ScrollArea` wraps its viewport children in a `min-width:100%; display:table` element.
`display:table` is **shrink-to-fit**: it sizes to its content's *max-content* width, and a
percentage width inside a shrink-to-fit ancestor does not constrain intrinsic width.

Consequence: one nowrap descendant, anywhere, can widen a page-level ScrollArea. Because that
viewport clips `overflow-x`, everything to the right - header buttons, the whole right-hand
column - is silently cut off rather than scrolled.

- [ ] **Every page-level body scroller carries the pin**, not just the app shell. This is the
      single highest-yield check in this document: 67 bounded pages across three apps had a
      `flex-1 min-h-0` ScrollArea with no pin, and each one was a page that could be cut off by
      any wide descendant it ever acquired.

      The symptom is distinctive and easy to misread: the page is not *narrow*, it is **shifted**.
      A two-column grid shows column one clipped and column two nowhere at all, because the grid
      is laid out at a width far wider than the screen and the shell clips the overflow instead
      of scrolling it. If a page looks "zoomed in", check the pin before anything else.

      Charts are the usual trigger. A `ResponsiveContainer` sizes to its parent, and inside a
      shrink-to-fit box there is nothing to size against - so it resolves to its content and
      drags the wrapper out with it.

- [ ] Identify these by shape: a `<ScrollArea>` that is `flex-1 min-h-0` inside an
      `h-[var(--gk-page-h)]` column, with **no explicit `orientation`**. That is a vertical page
      body by intent, so it must never grow sideways - give it `min-w-0` and the pin.
- [ ] **`orientation="vertical"` IS the pin** - prefer it to the arbitrary variant. The primitive
      applies `[&>div]:!block` itself for vertical-only scrollers, because a vertical scroller that
      grows sideways has no bar to reach the overflow, so growing sideways is not a thing it may
      ever do. `<ScrollArea orientation="vertical" className="min-h-0 min-w-0 flex-1">` says the
      same thing as the hand-written `[&>[data-radix-scroll-area-viewport]>div]:!block` and says
      what it means. Both are correct; do not write both.
- [ ] **Before pinning, look inside for a `<table>` or a `min-w-[...]`.** A scroller wrapping a
      wide table is NOT a vertical body - it is the table's horizontal scroller and its
      shrink-to-fit wrapper is what lets the table be wider than the screen. Pinning it crushes
      the table instead. Two of sixteen candidates in one module were this, and the shape is easy
      to miss because they look identical from the opening tag. Either leave them `both`, or give
      the table its own `orientation="horizontal"` scroller and pin the body around it.
- [ ] Do NOT blanket-pin every ScrollArea. A deliberately horizontal one needs the shrink-to-fit
      wrapper so its content *can* be wider than the viewport - that is what makes it scroll.
      Wide tables get their own `orientation="horizontal"` scroller and keep it.
- [ ] **`orientation="vertical"` forbids over-wide content, so check what is inside before
      choosing it.** The pin is right for a page body and wrong for a pane holding something that
      legitimately cannot shrink - a physical-card preview at real print dimensions, a fixed
      diagram, a canvas. Those need `both`, or their own nested horizontal scroller. A 355px card
      preview inside a vertical-only pane is clipped on a phone with no bar to reach it, and
      nothing about the markup looks wrong.
- [ ] **Scans must read `style={{ ... }}` as well as `className`.** Every rule here is written in
      Tailwind, and a scan built from those class names is blind to inline styles. Five `vh`
      bounds written as `style={{ minHeight: '70vh' }}` survived four separate passes for exactly
      this reason.
- [ ] Sheet and panel bodies wrapped in a ScrollArea carry `min-w-0` too.
- [ ] When a page looks cut off on the right, suspect a nowrap or `min-w-[...]` **descendant**
      before suspecting the page root. It is almost never the root.

The same shrink-to-fit box is why `h-full` does not work inside one: percentage heights do not
resolve through a table box, so `h-full` computes to `auto` and the region grows unbounded.

---

## 3. Tables and lists

A table with eight columns is not a mobile layout. Hide columns rather than shrinking them -
a 40px-wide column is worse than an absent one.

- [ ] Non-essential columns are hidden below `md`.
- [ ] **Header and body cells are hidden in matching pairs.** Count them: if the header has 10
      cells with 3 hidden, every body row must have 10 with the same 3 hidden. One mismatch
      shifts every cell after it into the wrong column, and the table still renders - it is just
      wrong. Count them; do not eyeball them.
- [ ] Whatever remains still identifies the row. Name, status and one distinguishing figure beat
      six numeric columns.

### The navigation dead end

This is the failure worth checking on every list you touch:

- [ ] **The link to the detail page survives on mobile.** If the only route in was an ID or
      username cell and that cell is `hidden md:table-cell`, the detail page is unreachable on a
      phone. Put the link on the **row's name** - the thing a finger goes to anyway - and it
      works at every width.
- [ ] Tap targets are at least 44x44px, including icon-only buttons - and `<Link>` styled as an
      icon button counts. Grow the HIT AREA, not the visual size:
      `relative after:absolute after:-inset-N after:content-['']`. The inset needed is
      `(44 - size) / 2`, and **the row gap must be at least twice that** or two neighbours'
      hit areas overlap and the wrong action fires. A control alone in its row can expand
      freely - expanding into a text label harms nothing.
      (`after:content-['']` cannot go inside a single-quoted string; use `content-[""]` there.)
- [ ] **Budget a repeated row's FIXED content before choosing its layout, and do the arithmetic
      rather than eyeballing it.** A row of per-item controls is the case where a phone runs out of
      width silently, because nothing overflows - the flexible column just gets squeezed to nothing.
      Worked example, the attendance marking row: six status chips at 32px plus their gaps is 222px,
      and with the roll number, two gaps and the row padding the fixed content came to **302px of a
      360px screen - leaving the student's NAME 58px**, about seven characters. On a screen whose
      whole job is marking the right pupil, that is the defect.

      The decisive test is to re-run the sum at the 44px tap-target floor. Here it gives the name
      **minus 14px**, which proves one line cannot hold six controls on a phone at any chip size -
      so the answer is a second line, not a smaller chip. Stacked, the name gets the full width and
      the chips share it as flex items at ~49px each, clearing 44x44 in both directions.

      Write the sum in a comment. The next person will otherwise "tidy" the two-line layout back
      into one and reintroduce it, because on a laptop the single line looks better.
- [ ] Where 44px would be visually wrong - a small refresh or dismiss control beside a card title,
      where a 44px box dwarfs the title it sits next to - **expand the hit area, do not inflate the
      control**. A transparent pseudo-element does it with no visual change at all:
      `relative after:absolute after:-inset-1.5 after:content-['']` turns a 32px button into 44px
      of touchable area. Inflating the control instead is how a density decision gets quietly
      reversed by an accessibility fix.
- [ ] **Measure the GAP before reaching for that pseudo-element.** It is only safe where the
      expanded areas cannot meet. A row of 32px icons at `gap-0.5` is 2px apart, so a 6px inset on
      each side overlaps its neighbour by 10px - and an overlapping hit area on a row of
      view/edit/delete icons produces the wrong ACTION, which is worse than a target that is merely
      small. Where the gap is tight, widen the gap and the control together instead, and state the
      size you actually reached. In a horizontally-scrolling table there is no width pressure, so
      40px controls at `gap-1.5` cost nothing; that is still 4px under the floor and should be
      reported as such rather than written up as compliant.
- [ ] **A grid with a fixed column count cannot be given fewer columns** - a seven-column month view
      is seven columns on a phone or it is not a month view. What it CAN be given is the padding
      back: `p-5` on the card leaves 36px day cells at 360px, `p-3 sm:p-5` leaves ~41px. When a
      layout cannot reach the tap floor, take the cheap pixels and say where it landed.
- [ ] An actions column has a **header** ("Actions", right-aligned, or `sr-only` when the column
      is icon-width). An empty `<th>` above a column of buttons reads as a rendering bug, and
      screen readers announce nothing.
- [ ] **Check the header ARRAY, not just the markup.** A grep for `<TableHead />` finds the
      self-closing form but not `{['Student', 'Class', ..., ''].map(...)}`, where the empty last
      entry is the same defect one level of indirection away - and it looks intentional because
      someone bothered to write a `key={h || \`actions-${i}\`}` fallback for it. Both forms turned
      up in one module. Give it the real label and render it `sr-only`; the header row looks
      unchanged and the column stops being anonymous.
- [ ] A row of more than ~3 icon actions collapses into a **3-dot dropdown** below `sm`. Note
      what *cannot* go in one: a control that owns its own overlay (a Popover trigger, anything
      opening a dialog) is not a menu item without rewriting it, and nesting a popover inside a
      dropdown misbehaves on touch. Leave those inline as single icons and say so.
- [ ] A master-detail split (fixed-width list beside a `flex-1` panel) **stacks** below `lg`. A
      288px column beside a flex panel needs ~600px; below that the detail is simply clipped by
      the container's `overflow-hidden`, so the thing you came to act on is unreachable.

---

## 4. Headers, toolbars and action rows

A header with four labelled buttons is roughly 400px of nowrap content. It does not fit.

- [ ] Secondary actions collapse into an overflow menu below `sm`; the primary action stays
      inline and labelled.
- [ ] **`flex-wrap` is a deferral, not a fix.** It does prevent the horizontal overflow, which is
      why a wrapped row never trips a sideways-scroll check and reads as handled. What it does
      instead is convert the overflow into HEIGHT: a Select plus seven labelled buttons (~720px)
      becomes three stacked rows of chrome above the content on a 328px line. On a bounded page
      that comes straight out of the list; on an unbounded one it just pushes everything down.
      Count the buttons and collapse the secondary ones regardless of whether the row wraps.
- [ ] **Apply this to every fixed action row, not just the page header.** The worst offender found
      in one module was a step's own footer bar: Previous + "Approve All Pending (N)" + "Approve
      All" + "Continue to Sign-off", four labelled buttons measuring ~600px against a 328px line,
      so three were off-screen - including the only way forward. A `justify-between` row hides this
      well, because on a laptop it just looks balanced. Below `sm` such a bar becomes two rows:
      secondaries share row one on shortened labels, the primary takes row two at `w-full`.
- [ ] Icon-only buttons carry `aria-label` - the visible label is what was removed, so without
      it the control is unnamed.
- [ ] Long labels shorten on mobile rather than wrapping or overflowing
      (`Save Changes` -> `Save`, `Admit Transfer Student` -> `Admit Transfer`).
- [ ] Page titles step down (`text-base` on mobile, `text-2xl` from `sm`). A title competing with
      the data below it for a 360px line wins and should not.
- [ ] Padding steps down too (`px-4` mobile, `px-6` from `sm`). At 360px, 48px of horizontal
      padding is 13% of the screen.
- [ ] **The rem base itself steps down on phones.** A base tuned for desktop reading distance
      inflates every label *and*, because the spacing scale is rem-based, every `p-4` and `gap-3`
      too - which on a bounded page comes out of the list. One rule at the root moves the whole
      scale and stays self-consistent, so a `h-16` bar and the `4rem` a layout subtracts for it
      shrink together. Do not go below 16px without auditing control heights first: 44px is the
      tap-target floor and `h-10` is already close to it.

---

## 5. Stat cards, tiles and summaries

A stat card is a glyph, a number and a label. At 360px in a 2-up grid there is room for two of
those three.

- [ ] Below `sm` the tile shows **icon + number**; the label and any sub-line are hidden.
- [ ] They are hidden with `sr-only`, **not `display:none`**. `hidden` drops the label from the
      accessibility tree and the tile then announces as a bare number with no meaning. Use
      `sr-only sm:not-sr-only`, which hides it visually and keeps it readable.
- [ ] Alignment follows the content: `items-center` when it is a glyph beside a number,
      `items-start` from `sm` when a label and sub-line give the column real height.
- [ ] Every line in the tile truncates. One card wrapping to a second line while its neighbour
      does not makes a row of unequal heights.
- [ ] **Except a number the user has to read exactly.** Truncating a label shortens a word;
      truncating a money figure CHANGES THE VALUE - "NPR 12,345,678" clipped to "NPR 12,345..."
      reads as a different, smaller amount, and nothing on screen says it was cut. For currency,
      counts and IDs, step the type down instead (`text-base sm:text-lg`) and add `tabular-nums`;
      truncate the label above it, which is what was making the heights unequal anyway. Budget the
      width before choosing: a 2-up tile in a 360px panel leaves ~136px of content, which is about
      14 characters at `text-lg` bold and about 17 at `text-base`.

---

## 6. Sheets, dialogs and modals

- [ ] **The sheet leaves a strip of page visible on mobile - around 90% width, not full bleed.**
      Edge to edge, a sheet reads as a navigation to a new page: nothing signals there is a
      screen behind it, and the only way out is hunting for the X. A sliver of dimmed page is
      the whole affordance, and on sheets that permit it, tapping the strip dismisses.
- [ ] That cap lives on the **Sheet primitive**, not in each consumer. Consumers almost all pass
      `w-full sm:max-w-[...]`, and `w-full` beats the primitive's `w-3/4` in the class merge - but
      `max-width` is a different property, so a `max-w-[90%]` in the variant survives the override
      and still caps the result. One line instead of a hundred edits.
- [ ] **No consumer passes an UNPREFIXED `max-w-*`, with or without `!`.** This is stronger than
      it first looks, and the `!important` case is only the loud half of it.

      `cn()` is tailwind-merge, which resolves same-property conflicts by LAST WINS. The variant's
      `max-w-[90%]` and a consumer's `max-w-xl` are both unprefixed max-width, so the consumer's
      simply replaces it - no `!` required - and `w-full max-w-xl` renders full bleed on any phone
      narrower than the cap. `sm:max-w-xl` does NOT do this, because a different modifier is a
      different key in the merge, which is exactly why `w-full sm:max-w-[...]` is safe and the same
      class without the prefix is not.

      The rule to check is therefore **`w-full` plus an unprefixed `max-w-*`**, and both halves
      matter: without `w-full` the variant's own `w-3/4` still leaves a strip, so a bare
      `max-w-md` on its own is harmless. One app had 17 sheets with an unprefixed `max-w`, of which
      only 5 also carried `w-full` and were actually full bleed. Do not bulk-fix on the `max-w`
      alone.

      A deliberate `side="bottom"` takeover (`h-[100dvh] w-full max-w-full`) is a different thing
      and is fine - it is a screen, not a sheet over a screen. Check `side` before flagging.
- [ ] **A `flex flex-col` SheetContent still needs `overflow-hidden`.** The variant carries
      `overflow-y-auto`, so without it the sheet scrolls AND the body ScrollArea inside it scrolls -
      two surfaces for one region, and the pinned footer's guarantee depends on which one wins.
      Four sheets in one module had the whole pattern right except this class.
- [ ] **`SheetFooter` is `flex-col-reverse sm:flex-row` - do not pass `flex-row`.** A bare
      `flex-row` in the consumer's className stacks nothing and puts Cancel beside a long primary
      label on a 276px line. If the row needs `justify-between` on desktop, scope every part of it:
      `sm:flex-row sm:items-center sm:justify-between`.
- [ ] Sheets that deliberately block outside-dismiss (forms with unsaved input) still get the
      strip. It is worth having for the visual cue alone, but do not describe it as "tap to
      close" for those - check `onPointerDownOutside` / `onInteractOutside` before claiming it.
- [ ] The body scrolls; the footer is `shrink-0` and pinned. A footer that scrolls away from a
      form leaves no way to submit it.
- [ ] **Count the footer buttons in the worst-case state**, not the common one. An edit flow at
      an intermediate step can show Cancel + Back + Save + Next - four labelled buttons in ~342px
      of usable width. That is the overflow. Secondary buttons go icon-only below `sm`.
- [ ] Multi-column form grids are `grid-cols-1` with `sm:grid-cols-2` or `sm:grid-cols-3`.
- [ ] A step indicator shows the **current** step's label only on mobile; the rest are numbers.
      Three circles, three labels and two chevrons is fixed nowrap content that fits 390px and
      not 360px.
- [ ] **Check that the current step is named SOMEWHERE at 360px.** A stepper that drops every
      label below `sm` is only half a design, and it ships looking complete when the "Step 2 of 5 -
      Review Questions" line lives in a rail that is itself `hidden lg:block`. Both halves are
      individually reasonable; together they leave a phone user five unlabelled circles. Naming
      just the current step above the row restores it without touching the row's geometry.
- [ ] Circles, avatars and icons in a horizontal strip carry `shrink-0`, or they squash into
      ellipses when the row is tight.
- [ ] Every colour has a `dark:` pair - including on *outline* buttons, where only the text and
      border carry the colour and a single-mode value disappears entirely against a dark panel.

---

### Tab strips and other in-page chrome

- [ ] **A tab strip never scrolls away with its content.** If the body is long, the strip has to
      stay reachable - otherwise switching tabs means scrolling all the way back up first. Bound
      the page, keep the strip `shrink-0`, and put ONE ScrollArea around the tab content.
- [ ] The same applies to any chrome that acts on the region below it: a filter bar, a
      select-all row, a segmented control.
- [ ] **A page-level action bar that commits a long list must be sticky.** The sheet-footer rule
      is really a rule about distance between the work and the control that saves it, and a page
      hides that far better than a sheet does. A 40-pupil marking roster is ~2,500px tall, so a
      Save button in the page header had scrolled a full screen out of reach by the time the last
      row was marked - several screens, on a phone. `sticky top-0 z-20` with an OPAQUE background
      is the whole fix; a translucent one lets rows show through as they pass underneath.

### One scroll surface per region

- [ ] **Do not leave a STALE bounded scroller inside a scrolling region.** A `max-h-*` ScrollArea
      that was right when its page flowed naturally becomes wrong the moment an ancestor starts
      scrolling: it clips its list mid-row and leaves dead space between that cut and whatever is
      below. When you convert a page to the bounded pattern, go back and remove the inner caps you
      added for the unbounded version.

      **This is not a ban on all nesting, and section 1 deliberately asks for the opposite** - a
      long list inside a stacked page is told to carry its own `max-h-*`. The two are distinguished
      by what the inner scroller DOES, not by whether it is nested:

      - A **dashboard of stacked panels**, each a card with a header and its own list, is the
        endorsed pattern. Panel 2's list scrolling internally while the page scrolls past it is
        correct, and capping each panel is what stops one long list burying the two below it.
      - A **stale cap left on a page's single main list** is the defect. There is only one list, it
        now has a page scroller around it, and the cap just truncates it.

      One of these is very often mistaken for the other, because the two look identical in a grep.
      The tell is the count: several capped siblings is a design; one capped main list inside a
      page scroller is a leftover. And check the cap is on `viewportClassName` before judging
      either - on the Root it clips instead of scrolling, which makes a correct design look broken.

---

## 7. Loading states

- [ ] **No spinners for content that has a shape.** A spinner says "wait" and nothing else, and
      it collapses to a different height than the thing it stands in for - so the layout jumps
      when data lands. Use an `animate-pulse` skeleton shaped like the real content.
- [ ] **Anything that appears late reserves its space.** A banner that resolves one round-trip
      after a sheet opens will shove the form down unless a placeholder of the same height is
      rendered while the answer is pending. That needs a real "in flight" flag - `data === null`
      cannot tell *"nothing to show"* from *"not decided yet"*.
- [ ] Skeletons match the container they replace: a bounded page's skeleton is bounded too, or
      the page resizes at the moment of load.
- [ ] **Match the BREAKPOINT of the bound, not just the fact of it.** Once a page becomes
      `lg:h-[var(--gk-page-h)] lg:overflow-hidden` (the relaxed-bound exception in section 1), a
      skeleton still on a plain `h-[var(--gk-page-h)]` is bounded at 360px where the real page is
      not - so the page visibly resizes the instant data lands, which is the exact jump the
      skeleton was added to prevent. Three of the skeletons in one module were left behind this
      way, because relaxing the bound is a change to the CLIENT and the skeleton is a different
      file. Carry the list's `max-h-[30rem] lg:max-h-none` across too.
- [ ] **A shared `BoundedPageSkeleton` is the fix, not per-file diligence.** One module had four
      skeletons on a shared bounded primitive and one hand-rolled - and the hand-rolled one was the
      only one that had drifted. If skeleton roots are being written out longhand, that is the bug;
      the bound belongs in a primitive that every skeleton opens with. Give the primitive a `dvh`
      fallback, not `vh`, for the case where the shell variable is missing.
- [ ] **Every grid you widen in a client desyncs its skeleton, and nothing will tell you.** This
      is not a pre-existing defect you go looking for - it is one you CREATE, three times in a
      module, as a side effect of the section 6 form-grid rule. Change a client's
      `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` and its skeleton still says `grid-cols-2`, so
      the loading state is a two-column form and the loaded state is one. A scanner cannot see it,
      because the skeleton is internally consistent and matches no rule it is breaking. Re-scan the
      SKELETONS after fixing the clients, and diff the two files' grid classes directly.

      The same applies to a strip converted to `<StatStrip>`: convert both, in the same edit.
      Counting occurrences per pair is a fast check, but expect a legitimate gap - a skeleton
      mirrors the PAGE, never the grids inside its sheets, so the client having two more is normal.
- [ ] **When a client's chrome changes shape, re-read its skeleton as a pair.** The same pass that
      wrapped a client's tab pills in a horizontal ScrollArea left the skeleton's pills on `w-fit`,
      and the same pass that stacked a caption row below `sm` left the skeleton's row on
      `items-center justify-between`. Neither is visible without opening both files.
- [ ] **One skeleton per surface, shaped like THAT surface.** "Replace the spinners with
      skeletons" is only half the job - a generic card-with-two-lines dropped into five different
      tabs is the wrong shape in four of them, and a wrong-shaped skeleton does not remove the
      layout jump, it just moves it. A calendar heat-map wants a label plus a run of day dots at
      the real dot size; a marksheet list wants a title, a meta line, a score row and a run of
      subject chips; an ID-card panel wants a card at the real aspect ratio.
- [ ] **Delete the spinner's wrapper too.** A spinner is usually centred inside something like
      `flex items-center justify-center py-20`. A skeleton must sit exactly where the content
      will, so that wrapper has to go with it - left behind, it centres the skeleton and gives
      the block a different height than the list that replaces it.
- [ ] **Skeletonise everything that arrives in the same payload.** Covering only the biggest
      region leaves its siblings to pop in: gating a heat-map on `isPending` while its summary
      tiles gate on `summary` means the tiles are absent and then appear, shoving the heat-map
      down. Find every branch fed by the same fetch.

## 8. Charts

recharts is not responsive by default, and its defaults are all sized for a desktop plot.

- [ ] **The legend goes above the plot, not below it.** Recharts defaults it to the bottom -
      the same band the X-axis tick labels occupy. That is fine at one line; on a phone four
      series wrap to two rows and the second row draws straight through the tick labels, so the
      chart reads as corrupted rather than crowded. No margin fixes it, because the wrap count
      is not knowable up front. Set `verticalAlign: 'top'` once, in the shared chart theme.
- [ ] **Axis ticks carry a Tailwind `fill-*` pair, not one fixed hex.** recharts cannot read CSS
      vars, so a single grey is wrong on one of the two surfaces - `#737373` is readable on white
      and faint on near-black. Keep the hex as the fallback for SVG export and add
      `className: 'fill-neutral-600 dark:fill-neutral-300'`, which wins because a CSS rule beats
      a presentation attribute. Give ticks `fontWeight: 500` too; at 11px a 400-weight tick on a
      dark panel reads as disabled.
- [ ] **Category labels wrap; they do not truncate.** `tickFormatter` can only shorten, and an
      ellipsis lands exactly where the distinguishing word was - "Optional Mathematics" and
      "Optional Mathematics II" truncate to the same string, which makes the axis misleading
      rather than merely terse. SVG text does not wrap, so emit `tspan`s from a custom `tick`
      renderer: pack greedily, cap at two lines, and if you must cut, cut the SECOND line so the
      first still identifies the row.
- [ ] Check the per-category band height before wrapping to two lines: two 11px lines need
      ~26px, so an 8-category chart needs ~210px of plot plus the legend band.
- [ ] **`tick={LOCAL_PROPS}` REPLACES the theme's tick object; it does not extend it.** Anything
      the shared `CHART_AXIS_PROPS.tick` sets and the local object omits is silently dropped -
      which is exactly how the `fill` hex fallback goes missing on charts that look correctly
      themed, because the Tailwind pair is present and the loss only shows in SVG export and print.
      Either spread the theme's tick (`tick={{ ...CHART_AXIS_PROPS.tick, fontSize: 12 }}`) or
      repeat `fill: CHART_AXIS_COLOR` in the local object. Three charts across two modules had this.
- [ ] **`interval={0}` trades dropped labels for collided ones - it is not the safe option.**
      recharts' default silently hides overlapping ticks, which misreports a category chart, so
      forcing every tick is the right instinct. But forcing them does not make them fit: 12 subject
      codes in a ~300px plot get ~25px each, and "SOC.ST" is wider than that, so the axis becomes an
      unreadable smear instead of an incomplete one. Angle them (`angle={-40} textAnchor="end"`)
      and reserve the band with `height`, or the rotated text is clipped rather than drawn. Keeping
      every label AND keeping it readable is the pair the axis needs; either alone is a defect.
- [ ] A single-series chart needs no legend - the title names it. Do not add one to satisfy a rule.
- [ ] Month and date axes go through the school calendar like any other date - a "last six
      months" axis reading Mar..Aug is six months a BS school does not recognise.

---

## 9. Localisation of dates and numbers

- [ ] Dates and academic years render through the **school's calendar system**, never raw. In
      Nepal that is Bikram Sambat, not Gregorian.
- [ ] When a date renders in the wrong system, **check the data before the code**. The formatter
      is usually being called correctly and handed the wrong setting - a school row saying
      `country = 'NP'` while its settings still say `calendarSystem = 'AD'` produces exactly this,
      and no amount of reading the component will show it.

## 9b. Offline routes constrain the rules above

A route built to work without a connection buys that with a **data-free static shell** - no server
fetch in the layout, so the page can be precached and can render with the network down. That is the
right trade, and it quietly removes tools the other sections assume you have.

- [ ] **A context provider is not available to you.** Anything the rest of the app reads from a
      provider that is hydrated by a server fetch - the school's calendar system is the one that
      bites - is simply absent. Section 9 still applies, but the setting has to travel in the local
      replica alongside the data it formats, which is a change to the sync payload and its types,
      not a formatting fix. If it is not there yet, say so rather than reaching for
      `toLocaleString`, which silently ships Gregorian dates into a BS product.
- [ ] **Do not "fix" a missing value by adding a fetch to the layout.** It un-does offline support
      for the entire route and nothing fails loudly enough to notice. It also puts tenant data in a
      cache that is per-origin, not per-session.
- [ ] **The route's shell scroller is the highest-value pin in the app.** A page-level body scroller
      that is missing `orientation="vertical"` affects one page; the same omission in a route
      group's shell affects every screen in it, and the symptom (a screen that reads as "zoomed in"
      and shifted) does not point at the shell.
- [ ] **Offline state is content, not a spinner.** Pending, syncing and failed are three different
      facts and a teacher acts differently on each. Show the exact queued count rather than a
      spinner, and never let a queued save render as if the school already has it.
- [ ] A tile that needs the network is **dimmed, not removed**, when offline. A tile that disappears
      reads as a feature being taken away rather than as one waiting for signal.

### A repeated data-entry screen is judged on the second pass, not the first

The offline screens tend to be the ones people USE rather than look at - a register, a stock count,
a checklist - and the defects that matter there are ergonomic, not visual. They survive a
responsiveness pass because nothing overflows and nothing is unreadable.

- [ ] **A bulk "set all" action fills only what is UNSET.** Overwriting is destructive in one
      direction and harmless in the other, and the harmful order is just as natural as the safe one:
      a teacher who marks the three absentees first and then reaches for "Mark all Present" loses
      that work with no undo and a success toast. Fill the gaps instead, and label the button with
      the count it will actually touch so it can never look like it is about to overwrite.
- [ ] **Show WHICH items are outstanding, not just how many.** "34/40" tells someone they have
      missed six and nothing about where they are; on a long list, hunting for them by eye is the
      slowest part of the job and the reason incomplete records get saved. Tint the unfilled rows -
      but only once the count is above zero, or opening the screen lights up everything and the cue
      means nothing.
- [ ] **A list of things to do says which are already done.** Five identical cards for five periods
      force the user to open each one to find out, so work gets repeated or missed. Keep the done
      ones tappable: correcting an entry is normal, and a card that vanishes on completion reads as
      the work being taken away.
- [ ] **Return to the list after a save, not to the home screen.** These screens are used in a run.
      It saves a tap per item and the updated list confirms the write landed better than a toast
      that has already faded - which matters most when the write is only queued.

---

## 10. Traps that cost real time

Two of these are not responsiveness bugs at all - they are ways a "fix" silently breaks the page
you were fixing. Both were hit during a single pass.

- [ ] **A `//` comment in JSX child position renders as text.** It is not a comment there, it is
      a text node, and React prints the words on the page. Inside JSX, comments must be braced.
      Worth grepping for: it looks completely normal in the editor.
- [ ] **A braced comment cannot be the first thing inside `return (`, `? (` or `: (`.** It
      becomes a second expression and the branch stops parsing. Put it above the `return`, or use a
      bare `/* */` or `//` comment *in that position only* (it is a JS context there, not a JSX
      child).

      Worth saying plainly: **this is a trap you spring on yourself while fixing something else.**
      It has now been sprung three times across seven modules, twice in one session, and once in the
      app SHELL where it would have taken the whole product down. Every time it was caught by
      re-running the scan rather than by reading the diff. Run the trap check after EVERY batch of
      edits, not once at the end.
      Every one of these rules asks you to leave a comment explaining a measurement, and the place
      that most wants a comment - the branch that renders the wide table - is exactly the position
      where a braced one does not compile. Put the check in your scanner rather than in your memory;
      it caught this on the fourth module having never fired on the first three.
- [ ] **A class string cannot contain its own quote character either.** The hit-area expansion in
      section 3 is written `after:content-['']`. Dropped into a SINGLE-quoted className it closes
      the string, and seven `TS1005` errors appear at once in files that looked fine. Inside a
      single-quoted string write `after:content-[""]`; inside a double-quoted one keep `['']`.

      This is the same shape as the comment traps below and fails the same way - a delimiter inside
      a delimited region - but note that **neither the tag-balance nor the brace/paren-drift check
      catches it**, because closing a string early does not unbalance a bracket. Only the typecheck
      did. It is the one trap in this section that needs a compiler rather than a scanner.
- [ ] **A comment cannot contain its own terminator** - braced or bare. Writing the closing
      sequence inside the comment text ends it there, and everything after it becomes code. The
      failure is confusing because the comment still LOOKS like one in the editor, and the syntax
      error is reported at whatever fragment follows, which is innocent.

      The way this actually happens is worth naming: you hit the braced-comment trap above, fix it
      by switching to a bare block comment, and then explain in that comment what the braced form
      looks like - which requires writing the closing delimiter. The explanation destroys the
      comment carrying it. Describe the form in words instead of reproducing it.

      **Neither comment trap is visible to a tag-balance check**, which is what makes them worth a
      separate test. Compare the brace and paren balance of each edited file against `git show
      HEAD:<file>` and flag any file whose delta CHANGED - a self-terminating comment shows up
      immediately as drift, and a correct edit shows none.
- [ ] **`flex-1` does not let a flex item shrink.** `min-width` defaults to `auto`, which means
      "at least my content" - and a form control carries an intrinsic width from its `size`
      attribute. Without `min-w-0` the row grows past its container instead of the field getting
      narrower. This is the single most repeated mistake in this document.

## Running a module pass

The intended way to use this: one module at a time, end to end, rather than one screen at a
time across the app. A module shares components, so a fix found in its list page usually applies
to its detail page and its sheets - doing them together is how you avoid finding the same defect
three times.

For each module:

1. **Enumerate the surfaces.** Every page, every sheet or dialog, every tab, and the empty,
   loading, populated and error state of each. The empty state is not the screen that breaks -
   check the populated one.
2. **Walk sections 1 to 9** on each, at 360x640.
3. **Fix at the widest scope the defect allows.** If it is in a shared primitive, fix the
   primitive - a defect found in one module's sheet is usually in every module's sheet. Sections
   1 and 6 both exist because a one-line change at the source beat a hundred call-site edits.
4. **Typecheck once, at the end of the module.** Not after each screen.
5. **Report what you did NOT fix** and why. A skipped surface is fine; a silently skipped one is
   not.

Order the modules by how much traffic they take on a phone, not by how broken they look.

### Scan by FILE COUNT, not by module name

Before believing a "the whole app is passed" claim, count the files the scan actually opened
against `find <app> -name '*.tsx'`. One app was reported complete after 755 files; the real total
was 849. The 94-file gap was everything OUTSIDE the main route group - the auth pages, the checkout
flow, the error and not-found pages, and every shared component under `components/`.

That gap is the opposite of a tail. The signin page is the first screen every user sees on a phone,
the checkout flow handles money, and a missing pin in `components/navigation/sidebar.tsx` affects
every screen in the product. Module-by-module is the right way to WORK, and a bad way to decide you
are finished - modules are named after route groups, and the shared components belong to no module.

### Scanning: what a grep can and cannot tell you

Scanning a module mechanically is worth doing - it finds things reading never will - but on the
first module tried this way, **three of five finding categories were entirely false positives**
(154 raw findings, a small fraction real). Calibrate before trusting a count:

- **Strip comments first.** Every "banned height" hit was the token appearing inside a comment
  explaining why it is *not* used. A codebase that documents its own rules will fail a naive
  grep for those rules.
- **Know your primitives' defaults.** Five tables were flagged as having no horizontal scroller;
  all five had one, because `ScrollArea`'s `orientation` defaults to `"both"`. A rule that
  requires an explicit attribute will flag correct code.
- **Distinguish display from value.** A date flagged as unformatted was building a
  `datetime-local` input value, which correctly stays in the source calendar.
- **Distinguish a loader from feedback.** A spinner inside a button, or one with a live progress
  count, is correct. Only spinners standing in for content that has a shape are defects.
- **Static counting cannot judge dynamic markup.** Table header/body parity is a real rule, but
  headers built with `.map()` cannot be counted at rest - check those by reading.
- **Count the right scope.** "This page has 8 buttons" is a file-wide count; the header row had
  two, and already stacked. Measure the row, not the file.

So: scan to build the candidate list, then **verify each category on one example before fixing
any of it**. Report the false-positive rate honestly - a finding count is not a defect count.

A second module scanned this way produced **304 raw findings across 129 files, of which about 30
were real** - and the shape of the noise was consistent enough to predict:

| category | raw | real | why the rest were not |
|---|---:|---:|---|
| `truncate` without `min-w-0` | 61 | ~0 | nearly all are a `<p class="truncate">` inside a wrapper that already has `min-w-0`. The rule is about the FLEX ITEM, not every truncating element |
| `flex-1` without `min-w-0` | 111 | ~0 | most are `flex-col` columns, where `min-width` never applies. Only flex ROWS matter |
| `min-w-[...]` in page flow | 29 | 0 | all were table widths inside their own horizontal scroller - the correct pattern |
| `whitespace-nowrap` | 7 | 0 | all inside `<td>`/`<th>` within a horizontal scroller, which is right |
| `grid-cols-2` with no 1-col base | 55 | 6 | stat tiles at 2-up are fine; only FORM grids (label + control) are defects |
| icon button with no `aria-label` | 7 | 4 | some carry `title=`, which also computes an accessible name |
| spinner standing in for content | 4 | 0 | all had a live progress count or sat inside a button |
| unpinned vertical ScrollArea | 29 | 14 | see the scanner bug below, plus 2 that legitimately wrap wide tables |

The two that pay for the whole scan are the ScrollArea checks. Everything built on "class X appears
without class Y" is mostly noise, because the rules those encode are conditional on a parent or a
child the grep cannot see.

A third module (44 files) scanned with the SAME script produced only **28 raw findings, ~14 real** -
so the noise is a property of the codebase's maturity, not a constant. Do not calibrate once and
assume the ratio holds; a low count can mean a clean module OR a scanner that stopped matching.

**Scanner bugs worth stealing the fixes for.** A tag regex of `<Component\b[^>]*>` stops at the
first `>` - which lands INSIDE `[&>[data-radix-scroll-area-viewport]>div]`, so every correctly
pinned ScrollArea reported as unpinned and every already-fixed file looked broken. Match the tag by
walking it with a bracket depth counter instead. And a `<Button ...>` regex that allows nested
`<` will swallow a child element and report the parent's missing `aria-label` when the child had
it. Both inflate exactly the categories you are most tempted to bulk-fix.

Three more, all of which caused a WRONG conclusion rather than just noise:

- **`<TableHead` is a prefix of `<TableHeader`.** Counting header cells with `<TableHead` matches
  the wrapper too, so a correct 6-column table reports 7 heads against 6 body cells and looks like
  the section-3 parity defect. Anchor it: `<TableHead\b(?!er)`.
- **`\bvh\]` never matches `max-h-[42vh]`.** There is no word boundary between `2` and `v`, so a
  `vh`-versus-`dvh` check written that way silently passes everything. Match `\[[0-9.]*vh\]`.
  This one is dangerous because a check that never fires reads exactly like a clean module.
- **Proximity breaks when a loading or empty branch sits between the scroller and the table.**
  A "ScrollArea within N lines above" check passes before you add a skeleton and fails after,
  because the `{loading ? (...skeleton...) : empty ? (...) : (<Table>)}` ladder now spans 25 lines.
  The nesting did not change; only the distance did. Confirm by reading the ladder, and never
  "fix" this by moving the scroller.
- **A card grid is not a stat strip, and a check for one will flag every one of the other.** A
  freshly-written "hand-rolled StatStrip" check fired 7 times on one module and was wrong all 7:
  they were grids of CONTENT cards - classes, assignments, materials - where wrapping into a grid
  is the correct behaviour and a horizontal scroller would be absurd. Two things separate them:

  - **An explicit mobile column count.** `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` is ALREADY
    one-up on a phone and costs nothing; there is nothing to fix. It is the written-down
    `grid-cols-2` or `grid-cols-1` that stacks tiles into rows. Require an unprefixed
    `grid-cols-N` before flagging.
  - **Children that are a label plus a FIGURE.** Require `text-xl/2xl font-bold` or a known tile
    component in the body. A rounded border is not enough - every card has one.

  A new check is at its most dangerous on the module right after you write it, because you have
  just seen it find real defects and are inclined to believe it.
- **`asChild` moves the accessible name to the CHILD.** `<Button size="icon" asChild><Link
  aria-label="Back">` is correctly labelled, and a check that only reads the Button's own props
  reports it as unnamed. Look into the element's first few hundred characters before flagging.
- **A form grid built from raw `<label>` and `<input>` is invisible to a check keyed on `<Label>`
  and `<Input>`.** Two of them sat in the same edit sheet as grids the scan did flag, so the file
  was already open and they were still missed. Match the lowercase tags too, or accept that the
  form-grid category needs a read of every sheet rather than a list.
- **A master-detail split can live in a LAYOUT, not a page.** `parents-layout-client.tsx` holds the
  288px rail and the `flex-1` detail; the pages under it hold neither, so a scan that walks pages
  finds nothing and the detail is 72px wide on a phone. Read `layout.tsx` and any `*-layout-*`
  component as surfaces in their own right.
- **Proximity cannot find a table's scroller when the table lives in an inline sub-component.**
  A `const BillsTable = () => (<Table className="min-w-[700px]">...)` defined 200 lines above its
  three usages has no ScrollArea near its DEFINITION and a correct one at every USAGE. Check where
  it is rendered, not where it is written.

And fix the scanner's own bugs first. A scan that blanks comments by DELETING their lines shifts
every reported line number by however many comment lines preceded it - which silently makes the
whole run unverifiable, because each finding points at innocent code. Blank comments out but keep
their newlines.

### Known-acceptable patterns - do not re-flag these

Each was flagged by a scan, checked, and found correct. Re-deciding them every pass wastes the
pass:

- **A 3-up grid of stat tiles on a phone.** A tile that is one word and one figure fits ~105px.
  The rule is about FORM fields, which need a label plus a control and do not fit. Check what is
  inside the grid before calling it.
- **`SheetFooter` with three buttons.** It is `flex-col-reverse sm:flex-row`, so it already
  stacks on mobile. Only hand-rolled footer rows need the icon-only treatment.
- **The shared `Card` in normal block flow.** Its `h-full` resolves against an auto-height
  parent and computes to auto - harmless. It is only a problem as a fixed BAND inside a bounded
  flex column (`shrink-0` with no `h-auto`), where it eats the whole page. Distinguish
  `shrink-0` (a band - needs `h-auto`) from `flex-1` (a filler - correct as is).
- **A spinner inside a button, or one with a live progress count.** Feedback for an action in
  flight, not a stand-in for content.
- **An AD date in a `value=`.** Only displayed text converts.
- **A data table with no hidden columns.** Section 3 says to hide non-essential columns below `md`,
  but a table in its own horizontal scroller with a sensible `min-w` is an equally valid answer and
  loses no data. A whole module used the scroller strategy on all 17 of its tables. Check that the
  scroller and the `min-w` are both there; do not "fix" it into hidden columns.
- **`sm:!max-w-lg` on a SheetContent.** The `!` is only a defect UNPREFIXED, where it beats the
  primitive's `max-w-[90%]` and kills the mobile strip. Scoped to `sm:` it overrides only the
  variant's `sm:max-w-sm`, which is what it was for. Flag `!max-w`, not `:!max-w`.
- **A `min-w` supplied by a wrapper `<div>` or by `style={{ minWidth }}`.** A grep for
  `min-w-[...]` on the `<table>` itself misses both and reports a crushed table that is fine.

## Verifying, and what a pass does not prove

- [ ] Typecheck the packages you touched, once, at the end.
- [ ] Re-read every hidden/shown pair as a pair. Most defects in this list are one half of a
      two-part change.

Two honest limits:

- **A responsiveness pass is not a device test.** Everything here is verifiable by reading the
  markup and resizing a window. Touch behaviour, momentum scrolling, keyboard-avoidance and
  safe-area handling on real hardware are not, and a clean scan against this list does not
  claim otherwise.
- **Fix at the definition, not the call site.** Several rules above (the height bound, the shell
  ScrollArea pin) are one-line changes that fix every screen at once. If a fix is being applied
  per page, that is usually a sign it belongs somewhere else.
