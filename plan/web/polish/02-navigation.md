# 02 - Navigation

**Serves:** definition of done 3
**Reference:** `gurukulhq/apps/web/components/(landingpage)/landingnavbar.tsx` (714 lines)

## What stays

**The navbar's design.** The floating pill, its scroll behaviour, the brand mark,
the CTA - all of it stays. The current file is 148 lines and looks right. The
complaint is that it has nowhere to go, not that it looks wrong.

## What is missing

Today the nav is a flat row of links. Two destinations a buyer asks for before
signing up do not exist at all:

- **Features** - the page for "what do I actually get"
- **Compare** - the page for "why this and not LeetCode / Interviewing.io /
  a Udemy course"

And a flat row cannot introduce them. Once there are more than about five items,
a nav either grows a second row or grows depth, and depth is the right answer
here because the items are not siblings: Features has sub-areas, Compare has one
page per competitor, Resources is the blog plus whatever else lands.

## The dropdown, from the reference

Gurukul's navbar solves this and the implementation is worth taking closely. Four
mechanics matter, and each exists because of a specific failure:

**1. A close delay, not an instant close.** `handleLeave` sets a 120ms timer
rather than closing immediately, because there is a gap between the tab and the
panel and a straight-line mouse crosses it. Without the grace period the menu
snaps shut mid-travel and the user has to try again. This is the single detail
that separates a hover menu that feels solid from one that feels broken.

**2. Escape closes it.** From the reference's own comment: *"A hover menu with no
keyboard exit is a trap for anyone navigating without a mouse."* A `keydown`
listener mounted only while a menu is open.

**3. Rows are titled and described, not bare links.** `DropdownItem` renders an
outline icon, a title and a one-line description. A dropdown of seven bare words
makes the reader do the work of guessing what each one is; a description does it
for them, and it is also where the honest scope of a feature can be stated.

**4. `overflow-visible` on the pill.** The reference flags this as load-bearing:
the open tab bleeds past the pill's bottom edge to meet the panel, and clipping
severs the join so the panel reads as a floating rectangle rather than something
attached to the tab that opened it.

Also port `z-40` and the reason for it - the reference keeps the navbar **below**
the modal layer (z-50) so sheets and dialogs open over it rather than under it.

## The proposed structure

To be finalised after `01-content-truth.md`, because the Features panel can only
list features that exist.

```
Product        Features        -> /features
               Practice        -> /features#practice
               Projects        -> /features#projects
               Mock interviews -> /features#mock
               AI tools        -> /features#ai

Compare        vs LeetCode         -> /compare/leetcode
               vs Interviewing.io  -> /compare/interviewing-io
               (one page per competitor; the panel lists them)

Resources      Blog        -> /blogs
               Pricing     -> /pricing

Company        About       -> /aboutus
```

Two notes on that shape:

- **Pricing is also a top-level link**, not only a dropdown row. It is the second
  most-clicked item on a marketing site and burying it costs conversions.
- **Compare needs the pages to exist before the nav points at them.** A dropdown
  row that 404s is worse than a missing dropdown. The task list sequences the
  pages before the nav entry.

## Tasks

See `tasks.md` `WEB-10` through `WEB-14`.

## Verification

- Hovering each parent opens its panel; moving diagonally from tab to panel does
  not close it.
- Tab reaches every item in an open panel; Escape closes it and returns focus.
- Every href resolves - no 404s from the nav.
- A dialog or sheet opened from any public page renders **above** the navbar.
- Mobile: the panel becomes an accordion in the sheet, and clicking outside the
  header closes it.
