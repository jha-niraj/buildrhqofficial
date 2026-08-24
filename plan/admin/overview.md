# admin - overview

## What this module is

`apps/admin` is the internal console the ShipItHQ team runs the platform from:
who the users are, what credits they hold, which companies and universities are
asking to be verified, what feedback came in, and who on the team is allowed to
see any of it. It is the only app in the repo whose whole audience is us, and the
only one where a single mis-scoped page hands a stranger the controls.

It is not finished, and the gap is not cosmetic. Today the console:

- gates every page on **"do you have a session"**, not **"are you an admin"**,
  and does that check in the browser
- renders all 20 of its pages as `"use client"` components that fetch in
  `useEffect`, so the 20 hand-written `loading.tsx` skeletons never get a chance
  to show and the shipped experience is 58 spinning rings
- carries four near-identical layout files, each with its own hard-coded nav,
  plus a fifth richer nav config in `lib/navigation.ts` that no layout reads
- links to 11 routes that do not exist
- writes to `admin_invitation`, `admin_audit_log` and `admin_notification` and
  gives nobody a screen to read them back

This module is the pass that makes it a real console: correct access control,
one shell, server-rendered pages, and no link that goes nowhere.

`/Users/nirajjha/Documents/niraj/gurukulhq/apps/admin` is the reference. It is
the same team's second admin app and it has already solved the shape of this
problem: server layout gate plus middleware, one sidebar, one nav config,
`_components/` splits, an invitation-accept flow, an onboarding step, an audit
log screen, and a two-role permission model. Where this document says "as in
gurukul", that is the file to open.

## Definition of done

1. **A signed-in non-admin cannot load a single console page.** The session
   cookie is shared across `*.shipithq.com` under one `cookiePrefix`, so every
   ShipItHQ user already holds a valid session at `admin.shipithq.com`. Being
   signed in must therefore grant nothing here. Verified by signing in as an
   ordinary user and requesting `/dashboard`, `/users` and `/credits`: each one
   redirects, and no console chrome is painted at any point.

2. **The gate is on the server, and it runs before the page.** A
   `middleware.ts` turns away requests with no session cookie, and one server
   layout resolves `admin_access` and redirects unless `status = 'ACTIVE'`.
   No page decides its own access, and no access decision happens in `useEffect`.

3. **Privilege can only be granted through an authenticated path.** No route
   handler creates a user, sets a credential password, or inserts an
   `admin_access` row on an unauthenticated request.

4. **There is one shell and one nav config.** One layout file, one sidebar
   wrapper over `@repo/ui`'s `AppSidebar`, and `lib/navigation.ts` as the single
   source of truth for what is in the sidebar. A nav entry either points at a
   route that exists or is not in the file.

5. **Every nav link resolves.** Clicking through every item in the sidebar, in
   both roles, produces zero 404s.

6. **Pages render on the server.** Each route is a server component that loads
   its data and hands it to a client component under `_components/`. Its
   `loading.tsx` is what the user actually sees while that load happens.

7. **No spinners.** Zero `animate-spin` and zero `Loader2` in `apps/admin`.
   Full-page waits use `ShipItHQLoader`, in-button and in-row waits use
   `InlineLoader`, and anything inside an already-rendered page uses a skeleton
   that matches the real layout.

8. **The palette is monochrome.** No red, orange, yellow, blue, indigo or purple
   outside a semantic status badge, and every badge colour comes from one shared
   map rather than being written inline per page.

9. **Every admin action is one response type and no `any`.** One shared
   `AdminResponse<T>`, imported not re-declared, and zero
   `eslint-disable @typescript-eslint/no-explicit-any` in `actions/`.

10. **The three tables that record admin activity have screens.** Invitations
    can be created, listed, resent and revoked; an invited person can accept
    theirs and land in the console; the audit log is readable and filterable; and
    admin notifications appear in the sidebar bell.

11. **`apps/admin` typechecks clean.** `cd apps/admin && npx tsc --noEmit`
    reports no errors.

12. **An admin arriving with nothing configured still sees a usable console.**
    The current default role (`MODULE_MANAGER`) carries an empty permission set,
    so a newly created admin gets an empty sidebar and no explanation. Whatever
    the role model ends up being, the empty case is a designed screen.

## Decisions

### The access-control model: two roles, per-module grants

Six roles are declared in `admin_role`: `SUPER_ADMIN`, `CONTENT_ADMIN`,
`FINANCE_ADMIN`, `COMMUNITY_ADMIN`, `MODULE_MANAGER`, `VIEWER`. Four of them are
guesses at an org chart that does not exist yet, and one of them,
`MODULE_MANAGER`, is both the column default and an empty permission set, so the
default outcome of creating an admin is an admin who can see nothing.

The model is **`SUPER_ADMIN` plus `TEAM_MEMBER`**, with a team member's access
coming entirely from per-module grants on the Access Control page. This is what
gurukul converged on after shipping the six-role version, and it is the same team
running both. `SUPER_ADMIN` bypasses every check; a team member has exactly the
modules someone ticked for them.

The four surplus enum values stay in the database. Removing a value from a
Postgres enum is not a cheap migration, nothing is gained by it, and
`isTeamMemberRole()` in gurukul's `lib/navigation.ts` shows the pattern: treat
every non-`SUPER_ADMIN` value as a team member and normalise on read.

**Decided by:** Niraj, 2026-08-24. Confirmed, including the empty-grant case:
a Team Member with no modules ticked gets a designed screen telling them who to
ask, not a blank sidebar.

### Two permission shapes exist and neither one works

`types/admin.ts` defines `AdminPermissions` as nested by platform:

    { main: { users: ["read"] }, hiring: { companies: ["read"] } }

`lib/navigation.ts` defines `AdminPermissions` as flat, and the nav filter reads
it flat:

    { users: ["read"], credits: ["read"] }

Both are exported under the same name from the same app. The nav filter can
never match a nested record, so a team member whose permissions were written in
the nested shape sees an empty sidebar regardless of what was granted.

The flat shape wins: it is what the filter and all three action-file importers
already use, and platform is not a permission axis worth a nesting level when
`hiring` and `uni` contribute two modules between them.

### The shell owns the geometry; pages own nothing

Four layouts today each wrap children in `<main className="h-screen p-3">` with a
`<div className="h-screen">` inside it. A 100vh child inside a 100vh padded
parent overflows by exactly the padding, which is the double scrollbar visible on
every admin page. `apps/main` solved this by publishing `--page-h` from the shell
and letting a `globals.css` rule retarget `h-screen` inside `[data-app-page]`.
The admin shell sets no `data-app-page`, so it gets none of that.

The admin shell adopts the same contract: one layout publishes `--page-h`, sets
`data-app-page`, and pages say `h-screen` and nothing else. This is deliberately
the `apps/main` mechanism and not gurukul's `--gk-page-h`, because the
`globals.css` rule that makes it work already ships in this repo's `@repo/ui`.

### `loading.tsx` is not decoration, so pages have to move to the server

The 20 skeleton files in this app are careful and hand-matched, and they are dead
weight, because `loading.tsx` only renders while a **server** component awaits.
A `"use client"` page with no async server work resolves instantly, the skeleton
flashes for a frame, and then the page shows its own `Loader2` for as long as the
real fetch takes. `revalidatePath` in the actions is inert for the same reason:
there is no server render to invalidate.

So the client-page rewrite is not a style preference. It is what makes the
skeletons, the loading states and the cache invalidation that are already written
start working.

### Cloudinary is out, R2 is in

`utils/cloudinary.ts` has zero importers and the repo rule is that images go to
R2. It is on the deletion list rather than being wired up.

### What "sharpened" does not mean here

This pass does not add modules. The hiring and university sections keep the three
screens they have; the eight `types/admin.ts` interfaces describing departments,
classes, assignments and job applications describe screens nobody asked for and
are on the deletion list, not the build list.

## Out of scope

- **An AI panel for the admin console.** Gurukul has one (`components/ai/`,
  `lib/ai/admin-agent.ts`, an `ai-panel.store`). It is a module of its own and
  gets its own plan directory if it is wanted.
- **New admin modules.** No cron/scheduled-jobs screen, no broadcasts, no
  newsletters, no reports section. Gurukul has all of these; none of them has
  been asked for here.
- **`@repo/errors`.** Gurukul runs every action through a shared error brain with
  `ok()` / `fail()` / `failWith()` and transient-vs-domain classification. This
  repo has no such package. Consolidating on one `AdminResponse<T>` is in scope;
  building the package is not.
- **Removing enum values from `admin_role`.** See the decision above.
- **`apps/hiring`, `apps/uni`, `apps/web`, `apps/main`.** Different apps. Where a
  fix belongs in `packages/ui` it is called out in the task.
- **Redesigning the sign-in screen's copy or brand.** Its palette and its
  spinner are in scope; its content is not.

## Reference map

Where to look in gurukul for each piece, since "take it from gurukul" is only
useful with a path:

| Piece | Gurukul file |
|---|---|
| Server layout gate | `app/(main)/layout.tsx` |
| Cookie-prefix middleware | `middleware.ts` |
| Shell geometry + panels | `app/(main)/_components/layout-client.tsx` |
| Single nav config, permission filter | `lib/navigation.ts` |
| Two-role normalisation | `lib/role-labels.ts` |
| Permission check for actions | `lib/require-permission.ts` |
| Audit log writer | `lib/audit-log.ts` |
| Server-load policy | `lib/load.ts` |
| Invitation accept page | `app/join/[token]/` |
| First-run profile step | `app/onboarding/` |
| Audit log screen | `app/(main)/admins/audit/` |
| Invitations screen | `app/(main)/admins/invitations/` |
| Notifications bell | `app/(main)/_components/notifications-bell.tsx` |
| Role badge colour map | `types/admin.ts` (`roleColors`) |
