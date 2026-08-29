# Jobs, scrolling and seed data - overview

One batch of work from Niraj on 2026-08-29, spanning three things that happen to
share a root cause: **the platform has no data, so nothing can be judged, and the
surfaces that would show it are built on native scroll and a nav that repeats
itself.**

## The three strands

### 1. No native scroll, anywhere

> *"Add proper scrollarea here and anyplace else as well and we should not be
> using the native scroll for the overflow in any components as well."*

`overflow-y-auto` is used in **59 places** across ~40 files. The rule already
exists in the app shell and the jobs shell, both of which use `ScrollArea` and
both of which explain why: the native scrollbar is an OS control. It paints
outside a rounded corner on Windows, reserves gutter width on some platforms and
not others, and cannot be styled to match a surface. Every sheet and panel in the
product that scrolls natively is a place the chrome does not match.

**`overflow-x-auto` is NOT in scope** and must not be swept: a wide table or code
block SHOULD keep its width and scroll sideways inside its own container. That is
the `orientation="both"` case, and `docs/responsiveness.md` depends on it.

### 2. The jobs module says everything twice

The main sidebar lists Jobs with seven children. Clicking any of them enters
`app/(jobs)`, which **swaps in its own sidebar** with the same seven items, and
`app/(jobs)/jobs/layout.tsx` renders them a third time as a tab row.

Niraj: *"as we are changing the content of the sidebar when clicking on Job so
just add this icon here, not these children."*

### 3. The database is empty, so nothing can be evaluated

> *"in the db please add all the required data ... I wanted to see the experience
> and all the feeling as the students will do."*

Every judgement about layout so far has been made against zero rows: the jobs
tabs all read `(0)`, My Applications shows four zero tiles over an empty state,
and the projects catalogue is bare. **Seeding is not decoration here - it is the
only way the UI work can be checked at all.**

## Definition of done

1. **No component scrolls natively on the Y axis.** Every one uses `ScrollArea`.
   `overflow-x-auto` on tables and code blocks is untouched.
2. **Each nav item appears once per shell.** The main sidebar links to Jobs; the
   jobs shell carries the jobs nav.
3. **A page header and its tabs share one row** where the tabs are a filter on
   that page rather than separate destinations.
4. **The platform has enough seeded data to be used like a student would**:
   companies, jobs belonging to those companies, public projects, and the rows
   that make the counts non-zero.
5. **Seeds are idempotent and re-runnable**, and never touch a real user's rows.
6. **The pathfinder explore panel is resizable and wide enough to read.**

## Decision: the jobs tabs stay as routes, and get faster

Niraj asked directly: *"tell me if we should keep these tab as new page or as
params on the job page as this is too slow."*

**Keep the routes.** The slowness is not caused by them, and moving to
`?tab=` would not fix it while costing three real things.

**Where the delay actually comes from:** `app/(jobs)/jobs/layout.tsx` awaits
`getJobsTabCounts()` before it renders anything at all. That is a five-count
aggregate query blocking the header, the tab row AND the page body on every
navigation, because a layout in Next renders before its children. Every tab pays
for the counts of the other four before it can paint. A `?tab=` param would run
exactly the same query on exactly the same request.

**What the routes buy that a param does not:** a real URL a user can share and
bookmark, a per-tab `loading.tsx`, independent data fetching, and browser history
that goes back to where they were.

**The fix is to stop blocking on the counts** - stream them into the tab row
inside their own `<Suspense>` so the page paints immediately and the numbers
arrive after. That is one boundary, not a re-architecture.
