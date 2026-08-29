# Module overviews - overview

## What these pages are

Seven routes are called "Overview" in the sidebar: `/practice`, `/projects`,
`/mock`, `/pathfinder`, `/ai`, `/jobs` and `/knowme`. Each is the first screen of
its module and the one a returning user lands on.

**An overview answers one question: what have I done here, and what do I do
next.** It is not a landing page, it is not a feature tour, and it is not a place
to report how the platform is doing.

## Why this exists as its own module

Niraj, 2026-08-29: *"all of them are looking soo dead ... we should be able to
show the stats about the modules on that overview page as well as the line charts
and all the things."*

They were dead for the same three reasons every time, which is what makes it one
problem rather than seven:

1. **They led with marketing** aimed at somebody deciding whether to sign up, on
   a page only signed-in users can reach.
2. **They had no shape when empty**, and every table in this product is empty -
   so the normal experience was a heading over blank space.
3. **Where they did show numbers, some were invented** to fill the row: `94%
   Success Rate` on projects, `4.8/5` and `85% Success Rate` on mock, `15K+
   completed` on a mock card.

## Definition of done

1. **Every number on an overview is computed from the signed-in user's own
   rows.** No platform totals, no hardcoded rates, no placeholder that renders
   before the real value arrives.
2. **Every overview shows its module's activity over the same 30-day window**,
   drawn the same way, so a reader learns one axis rather than seven.
3. **Zero is a first-class reading.** A module with nothing in it shows the real
   axes and a real baseline and says so in words - never a fabricated curve, and
   never a blank panel.
4. **One definition of the chart and the tiles.** Seven copies drift; the
   marketing copy on projects outlived the features it described by four tasks.
5. **The same invitation is not repeated three times on one screen.** An empty
   overview offers one action, not one per empty section.

## Decisions

### The chart is hand-rolled, and recharts stays where it is

`recharts` is already a dependency and is right for pathfinder's multi-series
work. `components/common/activity-chart.tsx` is a different job: one series,
monochrome, on seven pages that have to look like one product. Getting recharts
to honour the mark specs means overriding its axis, grid, dot, tooltip and cursor
on every page, and those overrides are what drift.

### Never a second y-axis

Two measures of different scale become two charts, never one chart with two
scales. Everything a reader infers from two lines TOGETHER - where they cross,
which is higher - is an artefact of two ranges somebody chose. `my-practice.tsx`
had exactly this and now has small multiples.

### `/jobs` is not in scope

`/jobs` renders the Spark swipe interface: a full-screen functional surface, not
a dashboard. It has no dead marketing and nowhere sensible to put a chart.

### `/knowme` keeps the chat as its overview

Its "Overview" is a working chat, which is the module's whole point. Its numbers
live in the Status card beside it and its activity chart is on
`/knowme/analytics`, rebuilt under KM-10.
