# Module overviews - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| OV-1 | One activity chart and one stat tile, shared | 2, 4 | done (2026-08-29) |
| OV-2 | One activity query for every module | 1, 2 | done (2026-08-29) |
| OV-3 | Wire the five overviews that lacked a chart | 2, 3 | done (2026-08-29) |
| OV-4 | Stop repeating the same empty-state CTA | 5 | done (2026-08-29) |
| OV-5 | Split the dual-axis chart on /mock | 2 | done (2026-08-29) |

---

## OV-1 - One activity chart and one stat tile

**Status:** done (2026-08-29)

`components/common/activity-chart.tsx` and `components/common/overview-kit.tsx`.

**Specs it implements**, each for a reason rather than a preference: 2px line
with round caps; area fill at ~10%; hairline SOLID gridlines (a dashed grid adds
a second rhythm the eye has to filter out); an end marker at r=4 carrying a 2px
ring in the SURFACE colour so it stays legible where it crosses the line; no
legend, because one series means the heading already names it; a crosshair that
snaps to the nearest day, because a reader aims at a date and not at a 2px line.

**Two implementation notes worth keeping**

- **Measured width, not a `viewBox`.** `preserveAspectRatio="none"` would scale
  the 2px stroke and the tick text along with the geometry, so line thickness
  would depend on container width. A `ResizeObserver` gives real pixels.
- **`useTheme`, not a `dark:` class.** An SVG `stroke` cannot take a Tailwind
  variant, and the marker's ring needs the actual surface colour to sit on.

**The sparkline on a stat tile draws only when something in it is non-zero.** A
flat line at the baseline says nothing the "0" above it has not, and twelve of
them across a stat row is decoration pretending to be data - which is the exact
thing these pages were doing wrong.

---

## OV-2 - One activity query for every module

**Status:** done (2026-08-29)

`actions/(common)/stats/module-activity.action.ts`. One action, six modules.

**The two things it gets right once instead of six times**

1. **Missing days appear as zero rather than vanishing.** `GROUP BY date`
   returns only days that HAVE rows, so a user with two active days gets a
   two-point series and a line chart that plots them adjacent - a week's gap
   drawn as a single step. The series is generated from a SQL calendar and the
   counts are LEFT JOINed onto it.
2. **Bucketed in UTC, labelled in UTC.** `date_trunc('day', ts)` uses the
   database session's timezone; the chart labels its axis with `timeZone: "UTC"`.
   Anything else files a count under the wrong tick for every reader not on the
   server's offset.

**The trap that cost two modules on the first run.** These are SQL table names,
not drizzle export names, and the two differ: `jobApplications` is
`job_application`, `pathfinderDailySessions` is `pathfinder_daily_session`.
Guessing the plural made both queries throw - and the catch that keeps a broken
chart from 500-ing the page degrades to a zero series, which is
**indistinguishable from a user who has done nothing**. Caught only by running
all six against the real database before wiring them up. Verify any new entry
against `information_schema.tables`.

---

## OV-3 - Wire the five overviews that lacked a chart

**Status:** done (2026-08-29)

| route | what it plots | source |
|---|---|---|
| `/projects` | tasks completed per day | `user_task_v2_status` where `COMPLETED` |
| `/practice` | practice sessions per day | `practice_user_session` |
| `/ai` | cover letters written per day | `cover_letter` |
| `/pathfinder` | days practised | `pathfinder_daily_session` |
| `/mock` | sessions, and score as a separate chart | existing `getMyMockStats` |

**`/pathfinder` is the one with real data**, and the reason it was worth adding
there at all: every existing chart on that page is derived from GOAL rows, so
`pathfinder_daily_session` - the record of actually turning up - was being
collected and never shown. 7 sessions in the last 30 days, verified in SQL and
then again through the rendered page.

**`/ai` counts cover letters only.** Resume drafts are edited in place rather
than created per session, so counting their `created_at` would report one point
ever and call it activity.

---

## OV-4 - Stop repeating the same empty-state CTA

**Status:** done (2026-08-29)

The `/projects` screenshot that started this: a dashed panel offering "Generate a
project", and directly under it a second, taller dashed panel ("Registry Empty")
offering the same button again - with a third in the header. One page, nothing on
it, three identical invitations stacked.

The catalogue strip is now a single line saying the shelf is bare, with no button
of its own. The empty state above it already carries the action.

---

## OV-5 - Split the dual-axis chart on /mock

**Status:** done (2026-08-29)

`my-practice.tsx` plotted sessions (a count) and average score (1-5) on one
`LineChart` with two y-axes. The comment beside it argued that sharing one axis
"would flatten whichever is smaller" - which identifies the problem correctly and
picks the wrong fix.

**A second y-scale is arbitrary.** Everything a reader infers from the two lines
TOGETHER - where they cross, which is higher, whether they converge - is an
artefact of the two ranges somebody chose. Slide either axis and the story
changes. It is the single most common charting mistake and it is not a matter of
taste.

Now two stacked small multiples: a shared x-axis so the dates line up, separate
y-axes so neither series is flattened, and no invitation to read a relationship
that is not there. The score chart renders only when something has been scored -
a 1-5 axis with no points on it reads as "rated badly" rather than "not rated".

Gridlines went from `strokeDasharray="3 3"` to solid, and the dashed score line
to solid, for the same reason: a second rhythm the eye filters out before it can
read the data.
