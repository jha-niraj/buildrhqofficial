# Mock interviews - overview

## What this module is

Where a user practises being interviewed, and sees whether they are getting
better at it.

That second clause is the whole point of this document. `/mock` currently opens
on a marketing page: four platform-wide statistics, a centred "Choose Your
Interview Format" hero, and a format card carrying "15K+ completed". It is
addressed to somebody deciding whether to try the product. But nobody reaches it
except signed-in users who have already decided - the route is behind the auth
gate (CR-10), and the marketing case is made on `apps/web`.

So the page spends its whole first screen selling to a person who has already
bought, and shows them nothing about themselves.

## Definition of done

1. **`/mock` opens on the user's own practice**, not on platform statistics. The
   first screen answers "how am I doing" and "what do I do next".
2. **No invented numbers anywhere.** `4.8/5`, `85%` and `15K+ completed` are
   hardcoded and are not measurements of anything. They are gone, not
   recalculated.
3. **Every number on the page is that user's**, and reconciles with
   `mock_voice_session` for their `userId`.
4. **Progress over time is a chart**, not a counter: sessions and scores across
   the last 30 days, so improvement is visible rather than asserted.
5. **A user with zero sessions sees a usable page** - what mock interviews are
   for, and one clear way to start. Not an empty dashboard, and not a wall of
   skeletons that never fill.
6. **Category and level pickers use the shared animated icon set**, not emoji.
7. Every text on the page clears AA: nothing below 12px, no grey under 4.5:1 on
   its own surface.

## Out of scope

- **The voice interview experience itself** (`/mock/voice/...`). This is about
  the hub that leads into it.
- **`PF-1`, the three-way mock overlap.** Settled separately in
  `plan/mock-consolidation/`: `mockvoice/` is canonical and keeps its own tables.
- **Inventing engagement metrics.** If the product does not measure something,
  this page does not show it. That is what produced `4.8/5` in the first place.

## Decisions

- **The platform-wide stat row goes entirely.** Two of its four numbers were
  real but meaningless to the reader (`0+` interviews conducted, `0+` active
  users - which is also what a brand-new platform looks like, so it advertises
  emptiness). The other two were fabricated. Replaced with the user's own
  counts.
- **`mock_voice_session` holds ZERO rows today** (checked 2026-08-28). Every
  chart and counter on this page will be empty for every user at first, which
  makes the empty state the DEFAULT experience rather than an edge case. It is
  specified first and built first, not last.
- **Scores come from `mock_voice_session.userRating` and the AI analysis**, both
  nullable. A session with no score is excluded from the average rather than
  counted as zero - a rating nobody gave is not a bad rating.
