# admin - tasks

Derived from `plan/admin/overview.md`. Every task names the numbered line in that
document's "Definition of done" that it serves; a task tracing to nothing is
scope creep and gets deleted.

Ordered by dependency. **ADM-1 through ADM-4 come first and are not optional** -
until the gate is correct, every other improvement is polish on an open door.

Status legend: `not started` / `in progress` / `blocked` / `done (YYYY-MM-DD)`.

---

## Phase 1 - the gate (done: 1, 2, 3)

### ADM-1 - Gate the console on `admin_access`, on the server
- [ ] **Status:** in progress (2026-08-24) - middleware.ts and app/(console)/layout.tsx
  written and typecheck clean; sign-out target and the four route groups merged
  into app/(console) as part of this task (see ADM-3). Verified by curl: an
  unauthenticated request to /dashboard, /users, /credits etc. gets a 307 to
  / (middleware working), and /api/ai/chat gets a 401 with no session (ADM-19's
  route uses the same gate).

  **Found and fixed in a later end-to-end scan (2026-08-24): the exact loop
  this task's own edge cases warned against was live.** `middleware.ts`
  force-redirected any logged-in visitor to `"/"` straight to `/dashboard`,
  regardless of whether they were an admin - `app/page.tsx` never actually
  implemented the "renders a plain 'this account does not have console
  access' state" behaviour its own neighbouring comment in
  `app/(console)/layout.tsx` claimed it did, it just unconditionally
  redirected any session to `/dashboard`. Put together: a signed-in
  non-admin hitting `/` got bounced to `/dashboard` by the middleware, sent
  back to `/` by the console layout's real admin check, and bounced to
  `/dashboard` again by the middleware - forever, entirely at the
  server-redirect layer, never even reaching a page component. Fixed by
  removing the middleware's `/`-to-`/dashboard` redirect (middleware stays a
  cookie-presence check only, per its own documented boundary) and giving
  `app/page.tsx` the real logic: on mount, if a session exists, it now calls
  `checkAdminAccess()` itself and either redirects to `/dashboard` (admin) or
  renders the "No console access" screen with a sign-out button (not an
  admin) - once, client-side, no redirect loop possible either way.

  **Not yet verified:** the specific "signed in as an ordinary non-admin
  user" and "SUSPENDED admin" cases from the Done-when line, including the
  just-fixed no-access screen itself - both need a real second account,
  which this pass did not create test data for. This is now the actual
  blocker on marking ADM-1 done; the code path it needs to exercise didn't
  exist before this fix.
- **Serves:** done 1, done 2

**Why.** `@repo/auth` sets `cookiePrefix: "shipithq"` for every app, and
production sets `AUTH_COOKIE_DOMAIN=".shipithq.com"`. A student who signs in at
`app.shipithq.com` therefore holds a cookie that `admin.shipithq.com` accepts.
All four admin layouts check only `useSession()`, in the browser, in a
`useEffect`. So that student can open `admin.shipithq.com/dashboard` and the
console shell, the sidebar, and every nav link render for them. The server
actions do call `checkAdminAccess()`, so the tables stay empty, but the console
is legible, its structure is disclosed, and any action added later that forgets
the check is live.

**Files**
- new `apps/admin/middleware.ts`
- new `apps/admin/app/(console)/layout.tsx` (server)
- new `apps/admin/app/(console)/_components/layout-client.tsx`
- delete after ADM-3: `app/(admin-control)/layout.tsx`,
  `app/(main-platform)/layout.tsx`, `app/(hiring-platform)/layout.tsx`,
  `app/(uni-platform)/layout.tsx`

**Steps**
1. Write `middleware.ts` modelled on gurukul's: bail out early for `_next`,
   `api` and anything with a dot; read the cookie with
   `getSessionCookie(request, { cookiePrefix: "shipithq" })`; treat `/` and
   `/join` as public; redirect everything else to `/` when there is no cookie.
   Keep the file named `middleware.ts` - the repo `CLAUDE.md` records that the
   Cloudflare adapter does not support Next 16's `proxy.ts`, and the dev warning
   about it is expected.
2. Write the server layout: `getSession(headers())`, then one select against
   `adminAccess` for `id`, `adminRole`, `permissions`, `status`. Redirect to `/`
   when there is no session, no row, or `status !== 'ACTIVE'`. Pass `adminRole`
   and `permissions` down to the client shell as props.
3. The client shell receives the role and permissions and never fetches them.

**Edge cases**
- **The middleware is a cookie check, not an authorisation check.** It cannot see
  `admin_access` without a database call, and middleware runs on every request.
  It exists to cheapen the common case; the layout is the real gate. Do not be
  tempted to move the admin lookup into it.
- `SUSPENDED` and `INACTIVE` must be turned away, not just missing rows. A
  suspended admin holds a perfectly valid session.
- Redirect to `/`, not `/signin`: this app's sign-in screen *is* `/`. The
  existing sign-out handler in `components/navigation/platform-sidebar.tsx`
  pushes to `/signin`, which does not exist and lands on a 404 after every
  sign-out. Fix it in the same task.
- Do not redirect a signed-in non-admin into a loop. `/` must render for a
  session holder who is not an admin, with a plain "this account does not have
  console access" state, or the middleware bounces them between two redirects.

**Done when.** Signed in as an ordinary (non-admin) user in one browser profile,
requesting `/dashboard`, `/users`, `/credits`, `/feedback`, `/analytics`,
`/admins` and `/system/settings` each lands on `/` with the no-access state, and
DevTools shows no console HTML in any response body. Signed in as an admin whose
row is then set to `SUSPENDED`, the next navigation redirects.

---

### ADM-2 - Delete the unauthenticated privilege-grant route
- [x] **Status:** done (2026-08-24) - `app/api/auth/verify-access-code/route.ts`
  deleted; `verifyAccessCode()` removed from `admin.action.ts` (dead - the
  sign-in screen's access-code tab was already gone from an earlier pass).
  `actions/invitations.action.ts` (ADM-13) is the replacement. Verified: tsc
  clean, `grep -rn verify-access-code apps/admin` returns only two explanatory
  comments.
- **Serves:** done 3
- **Blocked by:** ADM-13, whose /join flow is what lets this route be deleted rather than merely hardened.

**Why.** `POST /api/auth/verify-access-code` takes an email and a code from an
anonymous request and, on a match, creates a `users` row, writes a bcrypt
credential into `accounts.password`, inserts an `admin_access` row with the
invitation's role and permissions, and marks the invitation used. There is no
authentication, no rate limit and no lockout, so the endpoint is an online
guessing oracle against `admin_invitation.code` whose prize is an admin account.
`generateAccessCode()` draws 8 characters from a 32-character alphabet, which is
fine against offline attack and not the point: the point is that nothing stops a
client from trying.

It has a second problem. The invitation code becomes the account's permanent
password, and nothing forces a reset - the sign-in screen's own toast says
"Please set up your password on the next screen" and there is no such screen.

And a third: six sequential writes with no atomicity on a driver that has no
transactions. A failure after the `admin_access` insert but before the invitation
update leaves a replayable code attached to a live admin account.

**Files**
- `apps/admin/app/api/auth/verify-access-code/route.ts`
- `apps/admin/app/page.tsx` (the "Access Code" tab)
- `apps/admin/actions/admin.action.ts` (`createAdminInvitation`)

**Steps**
1. Add per-IP and per-email rate limiting, and mark the invitation `REVOKED`
   after a small number of failed attempts against that email.
2. Wrap the multi-statement grant in `withTransaction` from `@repo/db`. Never
   `db.transaction(` - the neon-http driver throws on it and the surrounding
   catch swallows the throw into a `{ success: false }`.
3. Set a `mustChangePassword` marker on the new admin and gate the console on it,
   or drop the password path entirely in favour of ADM-16's token link. Prefer
   the latter: it removes the endpoint instead of hardening it.
4. Stop echoing whether the email exists. "Invalid access code or email" for a
   missing invitation and a wrong code is already correct; keep it that way for
   the expiry branch too, which currently discloses that the code was real.

**Edge cases**
- `accessCode.toUpperCase()` is compared against `adminInvitations.code`.
  `generateAccessCode()` produces uppercase, so the live path matches, but the
  column's `$defaultFn` is `createId()`, which is lowercase cuid2. Any invitation
  created without an explicit code can never be redeemed. Either always supply
  the code or normalise on both sides.
- The route sets `users.role = "Admin"` on an existing account. If that account
  is a real student, this silently changes their role in the main app.
- Deleting this route means removing the "Access Code" tab from `app/page.tsx`,
  not leaving a tab that posts to a 404.

**Done when.** Either the route is gone and the sign-in screen has one tab, or:
101 wrong codes from one IP are rejected with the 51st onward not reaching the
database, the grant is inside `withTransaction`, and a redeemed invitation cannot
be redeemed twice. Whichever path, `curl -X POST` with a valid code no longer
creates an admin without an authenticated actor in the loop.

---

### ADM-3 - One shell, one nav config
- [ ] **Status:** in progress (2026-08-24) - the four route groups
  ((admin-control), (main-platform), (hiring-platform), (uni-platform)) are
  merged into one app/(console) via `git mv` (URLs unchanged - route groups
  don't affect paths). lib/navigation.ts rewritten as the single nav source
  (flat permissions, paths checked against the actual page.tsx files, dead
  entries like Mock Interviews/Projects/Transfers removed since their pages
  never existed). platform-sidebar.tsx renamed to admin-sidebar.tsx and now
  reads permissions from the server-provided SidebarProvider context instead of
  a second client-side useSession() call. Verified: `grep -rn navItems` returns
  only lib/navigation.ts; `find app -name layout.tsx` returns the root layout
  and app/(console)/layout.tsx only; tsc clean. **Not yet verified:** clicking
  every sidebar item in both a SUPER_ADMIN and a restricted TEAM_MEMBER session
  - needs real accounts.
- **Serves:** done 4
- **Blocked by:** ADM-1

**Why.** There are five descriptions of the admin navigation in this app: four
hard-coded `navItems` arrays inside four layout files, plus the richer
`adminNavigation` in `lib/navigation.ts` that no layout imports. They disagree.
`lib/navigation.ts` has Invitations, Audit Logs, Projects, Mock Interviews and
Transfers; the layouts do not. The layouts are what ships, so the config with the
permission filter in it is the one nobody sees. Adding a page today means editing
whichever of the five files you happen to find.

The four layouts are also byte-similar: same `SidebarProvider`, same
`useSession` check, same `Loader2`, same wrapper divs. The only difference is the
nav array and a colour.

**Files**
- `apps/admin/lib/navigation.ts`
- `apps/admin/components/navigation/platform-sidebar.tsx` -> rename to
  `admin-sidebar.tsx`
- `apps/admin/components/navigation/sidebarprovider.tsx`
- move all routes under one `app/(console)/` group
- delete the four old layouts

**Steps**
1. Collapse the four route groups into one. `(admin-control)`,
   `(main-platform)`, `(hiring-platform)` and `(uni-platform)` are route groups,
   so they contribute nothing to the URL - merging them changes no path.
2. Make `lib/navigation.ts` the only nav source. Sections become sidebar groups:
   Overview, Users, Credits, Feedback, Analytics as `primary`; Hiring and
   University as their own groups; Admin Management and System as `secondary`.
3. `SidebarProvider` takes `adminRole` and `permissions` from the server layout
   and exposes them, as gurukul's does. Keep the existing localStorage collapse
   memory.
4. The sidebar wrapper feeds `getNavigationForPermissions(permissions, adminRole)`
   into `@repo/ui`'s `AppSidebar`. That component already provides the command
   palette, theme toggle, notification bell, mobile sheet and profile footer, so
   the wrapper stays thin.

**Edge cases**
- `AppSidebar` normalises a `path` with or without a leading slash, but
  `lib/navigation.ts` currently mixes bare (`dashboard`) and prefixed
  (`main/users`) forms and the `main/` prefix corresponds to no route. Normalise
  every path in one pass and check each against the filesystem.
- The nav filter drops a parent whose children all fail the permission check.
  Confirm a group with `requiredPermission` on the parent *and* on children
  behaves once, not twice.
- `AppSidebar`'s `bottomNav` is opt-in and the current admin does not pass it.
  Keep it that way unless four destinations earn a permanent mobile bar.
- Do not lose the "All Platforms" back-link behaviour without deciding it is
  gone; with one shell there is no platform to go back from, so it should be.

**Done when.** `grep -rn "navItems" apps/admin` returns only `lib/navigation.ts`;
`find apps/admin/app -name "layout.tsx"` returns two files (root and console);
and every sidebar item, clicked in both a `SUPER_ADMIN` and a restricted team
member session, opens a real page.

---

### ADM-4 - Fix the shell geometry and adopt `--page-h`
- [ ] **Status:** in progress (2026-08-24) - app/(console)/_components/layout-client.tsx
  now sets `data-app-page` and `--page-h: calc(100vh - 1.5rem)` on the page card
  (matching apps/main's m-3/1.5rem convention), uses `h-full` inside `ScrollArea`
  with the `reflow` prop (the `[&>div]:!block` pin) instead of the old bare
  `overflow-y-auto`, and there is now exactly one layout file instead of four
  each computing their own (broken) height. **Not yet verified:** the actual
  rendered scrollbar count at 1440x900 - this environment's browser automation
  tool could not load localhost content (every screenshot/get_page_text call
  failed with "Frame with ID 0 is showing error page" despite curl confirming
  the server returns valid HTML - looks like a sandbox restriction on localhost,
  not an app bug, but it means this was not visually confirmed).
- **Serves:** done 4
- **Blocked by:** ADM-3

**Why.** Each layout renders `<main className="h-screen ... p-3">` wrapping
`<div className="h-screen">`. The inner card is 100vh tall inside a 100vh parent
that has 0.75rem of padding on each side, so it overflows by 1.5rem and the
console has a permanent outer scrollbar with the page card scrolling inside it.
Two scrollbars, on every page. `apps/main` publishes `--page-h` from its shell
and a rule in `packages/ui/src/styles/globals.css` retargets `h-screen` and
`min-h-screen` inside `[data-app-page]` at it. The admin shell sets no
`data-app-page`, so it opted out of the fix that already exists in this repo.

**Files**
- `apps/admin/app/(console)/_components/layout-client.tsx`

**Steps**
1. Set `data-app-page` on the page card and `--page-h: calc(100vh - 1rem)` on it,
   matching `apps/main`.
2. Give the outer wrapper the height and the inner card `h-full`, not a second
   `h-screen`.
3. Use `ScrollArea` from `@repo/ui` for the scrolling region rather than the
   current `overflow-y-auto` plus hand-written `scrollbar-thin` classes, which
   are Tailwind plugin classes that may not be compiled in this repo.

**Edge cases**
- `h-full` does not resolve through Radix's `ScrollArea`, which wraps children in
  a `display: table` element. Percentage heights do not resolve through a table
  box. Bound with `flex-1 min-h-0` in a flex column instead.
- A wide table anywhere in the app can inflate the shell and give the whole
  console a horizontal scrollbar, because that same table wrapper is
  shrink-to-fit. Gurukul pins it with
  `[&>[data-radix-scroll-area-viewport]>div]:!block` and a note explaining why;
  copy the pin and the note.
- Sidebar collapse changes the content offset. Verify at both widths and at the
  `lg` breakpoint where the sidebar goes to a sheet.

**Done when.** On `/dashboard` at 1440x900 there is exactly one vertical
scrollbar, `document.scrollingElement.scrollHeight` equals its `clientHeight`,
and no page in the console produces a horizontal scrollbar.

---

## Phase 2 - deletions and consolidation (done: 9)

### ADM-5 - Deletion proposal: dead files
- [x] **Status:** done (2026-08-24) - DEL-1 through DEL-8 all deleted
  (project.action.ts, mock.action.ts, challenge.action.ts, utils/cloudinary.ts,
  secrets.json.example, vercel.json, the 8 unused types/admin.ts interfaces, the
  7 create-next-app placeholder SVGs). Verified: zero importers confirmed before
  each deletion (`grep -rln`), `tsc --noEmit` clean after.
- **Serves:** done 9

**Why.** Dead code in an admin app is worse than dead code elsewhere: the next
person reading `actions/main/project.action.ts` reasonably assumes there is a
project admin screen, and plans around one.

Checked by import path across `apps/admin`, not by symbol name.

| ID | File | Lines | Evidence |
|---|---|---:|---|
| DEL-1 | `actions/main/project.action.ts` | 315 | No `page.tsx` imports it. No projects screen exists. |
| DEL-2 | `actions/main/mock.action.ts` | 228 | Same. No mocks screen exists. |
| DEL-3 | `actions/main/challenge.action.ts` | 104 | Same. No challenges screen, and no `challenges` route in any nav config. |
| DEL-4 | `utils/cloudinary.ts` | 59 | Zero importers, and the repo rule is R2, never Cloudinary. |
| DEL-5 | `secrets.json.example` | 19 | Superseded by `.env.production.example`; still lists `CLOUDINARY_*` and a `NEXT_PUBLIC_BASE_MAIN_URL` that no code reads. |
| DEL-6 | `vercel.json` | 6 | This app deploys to Cloudflare via `pnpm release`. A Vercel build config is a second, untested deploy path. |
| DEL-7 | `types/admin.ts`, 8 unused interfaces | ~180 | `Department`, `UniversityMember`, `UniversityClass`, `UniversityAssignment`, `Job`, `JobApplication`, `CompanyMember`, `VerificationRequest`, `PendingVerification`. Types for screens that do not exist. |
| DEL-8 | `public/next.svg`, `turborepo-dark.svg`, `turborepo-light.svg`, `vercel.svg`, `window.svg`, `globe.svg`, `file-text.svg` | - | create-next-app leftovers. |

**On DEL-1 and DEL-2.** These two are the interesting ones. If a projects or
mocks admin screen is wanted, the right move is to build the screen on top of the
existing action, not to delete 543 lines and rewrite them later. That is a
product call, not a cleanup call. Flagged in the tick-list.

**Done when.** Only the approved IDs are deleted, `apps/admin` typechecks, and
this table records the outcome of each ID with a date.

---

### ADM-6 - One `AdminResponse<T>`, no `any`
- [x] **Status:** done (2026-08-24) - `AdminResponse<T>` declared once in
  `types/admin.ts` as a real discriminated union; every one of the 7 action
  files' local re-declarations removed and replaced with the import.
  `eslint-disable @typescript-eslint/no-explicit-any` removed from all 7 files;
  every `any` replaced with a real type (Drizzle `$inferSelect`, explicit
  return-shape interfaces, or an enum-checked cast for the handful of
  `string`-typed filter args). `system.action.ts` had a second, unnamed
  offender - a local `interface Response<T>` shadowing the DOM `Response`
  type - fixed the same way.

  **The strict typing surfaced real, live bugs, not just type noise:**
  - `credits/requests/page.tsx`'s Approve button called
    `handleApprove(request.id, request.amount)` - `request.amount` doesn't
    exist on `credit_request` (the real field is `requestedCredits`), so every
    approval was granting `undefined` credits. Fixed, and the request card now
    shows the actual LinkedIn/Twitter proof link instead of a `description`
    field the table has never had.
  - `credits/transactions/page.tsx` rendered a "Status" column from
    `transaction.payment.status` - `getAllTransactions()` never fetches a
    `payment` relation (none exists in the schema), so the column was always
    blank. Removed the column rather than fake a relation that isn't there.
  - `feedback/page.tsx`'s "Verified" badge and `assignReward()`'s own write
    both referenced `feedbacks.isVerified`, a column that no longer exists in
    the schema (assignReward's comment even said so: "using isAnonymous as a
    proxy"). Both sides were quietly no-ops. Re-derived "Rewarded" from
    whether a reward row exists instead, which is real data already being
    fetched.
  - `getAllFeedback()` returns `rewards` as an array (0 or 1 - feedbackId is
    unique in the rewards table) but the page treated it as a nullable single
    object; fixed to index `[0]`.
  - `analytics/page.tsx`'s User Growth bar chart computed every bar height
    from `item.value` against data shaped `{date, count}` - always `NaN`.
    Fixed the field name and added a `Math.max(..., 1)` floor for the
    empty-data case.
  - `credits/payments/page.tsx` typed `amount` as `number`; it's a Postgres
    `decimal` column, which drizzle returns as a `string` to preserve
    precision. `formatCurrency` now converts explicitly instead of relying on
    an implicit (and wrong) numeric type.
  - `users/page.tsx`'s `role` field excluded the `HR` and `UNI` values that
    `roleEnum` actually declares - any such user would have failed to load
    into state.

  **Also found while gating `hiring.action.ts`/`uni.action.ts` for ADM-1** (see
  the entry below this task list): `getCreditTransfers()` and
  `transferCredits()` in `credit.action.ts` have zero callers anywhere in the
  app - dead code, matching the already-known-dead `/credits/transfers` nav
  entry. Left in place rather than deleted (no approval sought for these two
  specifically - see the deletion-approval rule in `plan/README.md`), but
  flagged here for a future cleanup pass.

  Verified: `grep -rn "eslint-disable @typescript-eslint/no-explicit-any"
  actions/` and `grep -rn ": any\\b\|as any\\b" actions/` both empty;
  `grep -rn "interface AdminResponse\|interface Response" actions/` empty;
  `cd apps/admin && npx tsc --noEmit` clean across the whole app.
- **Serves:** done 9

**Why.** `interface AdminResponse<T>` is declared five times, in five action
files, with the same three fields. Eight of eleven action files open with
`/* eslint-disable @typescript-eslint/no-explicit-any */` and there are 38 `any`
occurrences behind that disable. The disable is at the top of the file, so it
also covers every `any` added to those files in future - the lint rule is off for
`actions/` in practice.

`checkAdminAccess()` returns `AdminResponse<{ isAdmin: boolean; adminAccess: any }>`,
so every caller's admin record is untyped, which is how a permissions object of
the wrong shape reaches the nav filter unnoticed (see ADM-7).

**Files**
- `apps/admin/types/admin.ts` (declare it once)
- all 11 files under `apps/admin/actions/`

**Steps**
1. Declare `AdminResponse<T>` once in `types/admin.ts` as a discriminated union:
   on `success: true`, `data: T` is required. Import it everywhere else.
2. Type `adminAccess` as `typeof adminAccessTable.$inferSelect`.
3. Remove each file-level `eslint-disable` and fix what it was hiding. For
   Drizzle: `as typeof TABLE.$inferInsert` for inserts, `as unknown` for jsonb,
   and `as typeof xxxEnum.enumValues[number]` for enum columns.
4. `catch (error: unknown)`, narrowed before use. Never `catch (error: any)`.

**Edge cases**
- The discriminated union will surface real bugs at call sites that read `.data`
  without checking `.success`. Those are the point; fix them rather than widening
  the type back.
- `db.query.*.findMany({ with: ... })` infers deep types that are painful to
  name. Prefer inferring from the query (`Awaited<ReturnType<typeof fn>>`) over
  hand-writing the shape or reaching for `any`.
- Keep the eslint config's `no-explicit-any: "warn"` as-is; the task is removing
  the disables, not raising the rule to error before the code is clean.

**Done when.** `grep -rn "eslint-disable @typescript-eslint/no-explicit-any" apps/admin`
returns nothing, `grep -rn "interface AdminResponse" apps/admin` returns one hit
in `types/admin.ts`, and `cd apps/admin && npx tsc --noEmit` is clean.

---

### ADM-7 - Collapse the two permission models into one
- [x] **Status:** done (2026-08-24) - the nested `AdminPermissions` in
  types/admin.ts is deleted; `lib/navigation.ts` is now the only export of that
  name (flat, `Partial<Record<AdminPermission, PermissionLevel[]>>`).
  `getEffectivePermissions()` implements the SUPER_ADMIN-bypasses-everything /
  TEAM_MEMBER-gets-exactly-their-grants rule from the 2026-08-24 decision.
  `lib/role-labels.ts` added for the two-role normalisation. `system.action.ts`
  (the one caller of the old `hasPermission`) still compiles unchanged - it only
  ever used the flat shape. Verified: `grep -rn "interface AdminPermissions"`
  returns nothing (it's a `type`, defined once); tsc clean. **Not yet done:**
  the reporting script for nested-shape rows in production `admin_access` -
  there are no admins in this app yet to have written one, so it's lower
  urgency than gurukul's version of this task implied.
- **Serves:** done 12
- **Blocked by:** nothing. The role model was decided 2026-08-24: two roles, per-module grants.

**Why.** `types/admin.ts` exports `AdminPermissions` nested by platform
(`{ main: { users: [...] } }`). `lib/navigation.ts` exports `AdminPermissions`
flat (`{ users: [...] }`) and `hasPermission()` reads it flat. Same name, same
app, incompatible. Any admin whose `permissions` jsonb was written in the nested
shape fails every nav check and sees an empty sidebar, and the `system.action.ts`
and `mock.action.ts` permission guards fail the same way.

Compounding it: `admin_role` defaults to `MODULE_MANAGER`, and
`defaultPermissionsByRole.MODULE_MANAGER` is `{}` with the comment
"Permissions set per invitation". So the default admin has no permissions, no
sidebar, and no message explaining why.

**Files**
- `apps/admin/types/admin.ts`
- `apps/admin/lib/navigation.ts`
- new `apps/admin/lib/role-labels.ts`
- new `apps/admin/lib/require-permission.ts`
- `apps/admin/app/(console)/admins/access/page.tsx`

**Steps**
1. Delete the nested `MainPlatformPermissions` / `HiringPlatformPermissions` /
   `UniversityPlatformPermissions` interfaces. Keep the flat shape.
2. Add `getEffectivePermissions(adminRole, permissions)` as in gurukul:
   `SUPER_ADMIN` gets everything, a team member gets exactly their grants.
3. Add `role-labels.ts` with `formatAdminRole` / `normalizeAdminRole` so the four
   surplus enum values render as "Team Member" instead of raw enum text.
4. Add `require-permission.ts` for the action-side guard, so a page and an action
   agree on what "write access to credits" means.
5. Write a one-off script that reports any `admin_access.permissions` row in the
   nested shape. Report before migrating - do not rewrite production rows from a
   task that has not been read.

**Edge cases**
- A team member with zero grants must get a designed empty state naming who to
  ask, not a blank sidebar.
- `SUPER_ADMIN` must bypass the permissions object entirely, not be given a
  hard-coded grant list that then drifts from the module list.
- The Access Control page writes this jsonb. It has to write the flat shape or
  the migration undoes itself on the next save.

**Done when.** A team member granted `{ credits: ["read"] }` sees exactly
Overview plus Credits in the sidebar, a `SUPER_ADMIN` sees everything with an
empty `permissions` object, and the reporting script finds no nested rows.

---

## Phase 3 - move the pages to the server (done: 6, 7, 11)

### ADM-8 - Convert the pages to server components
- [x] **Done (2026-08-24).** All console pages converted: server `page.tsx`
  fetches via server actions and passes `initial*` props to a `"use client"`
  `_components/*-client.tsx`, which owns interactivity and skips its
  redundant on-mount refetch via a `firstLoad` flag. This task's own
  enumeration (see **Steps** below) named 19 pages, but two more
  `"use client"` pages existed outside that list and were converted in the
  same pass: `admins/audit` and `admins/invitations` - 21 pages total, not
  19. `app/page.tsx` (sign-in, ADM-20) and `app/join/[token]/page.tsx`
  (invite accept, ADM-13) are intentionally excluded - neither is a console
  route behind the `admin_access` gate.

  Real bugs fixed while converting, beyond the pattern itself:
  - `credits/page.tsx`: Approve/Reject buttons in both the overview tab's
    Pending Requests preview and the requests tab's table had no `onClick`
    at all - wired to `approveCreditRequest`/`rejectCreditRequest`. Loading
    state read "Loading feedback..." (copy-paste artifact) - removed.
    Off-palette `to-pink-500` gradient on the Total Transactions stat card
    replaced with neutral.
  - `hiring/companies/verification` and `uni/universities/verification`:
    both interfaces declared a `_count: {members, jobs}` shape `getAdminUsers`-
    style Drizzle queries never produce (they return real relation arrays) -
    always rendered `undefined`. Fixed to real arrays + `.length`. Both
    pages' `handleReject(id, _reason)` silently discarded the typed-in
    rejection reason instead of forwarding it.
  - `hiring.action.ts`: `verifyCompany`/`rejectCompanyVerification` had no
    audit-log write, unlike nearly every other mutating action in the app.
    `rejectCompanyVerification` also didn't accept a `reason` param even
    though the page tried to pass one; `companies` has no rejection-reason
    column, so the reason is now captured in the audit log's
    `description`/`metadata` instead (mirrors the note already in the
    action's own comment).
  - `uni.action.ts`: `verifyUniversity` had no audit-log write (
    `rejectUniversityVerification` already persisted `reason` to the real
    `rejectionReason` column - just needed the audit log added too).
  - `hiring/page.tsx` and `uni/page.tsx` overview screens linked to
    Jobs/Members/Applications/Invitations/Analytics and
    Departments/Faculty/Students/Classes/Placements/Credits/Analytics pages
    that were never built - all dead links, 404 on click. Removed; kept only
    Companies + Verification (hiring) and Universities + Verification (uni).
    The stat tiles for the removed pages became non-clickable `StatTile`s
    instead of disappearing, since the counts themselves are still real.
  - `admins/page.tsx` ("Team"): dropped a second, stale, six-role invite
    modal + "Pending Invitations" tab that duplicated `admins/invitations`
    (which already correctly implements the two-role model from
    `plan/admin/overview.md`, decided the same day) - replaced with a link
    to that page. The row-level "Settings" gear button had no `onClick`;
    now links to `admins/access`, which is where per-admin permissions are
    actually edited.
  - `users/page.tsx`: "Export" and "Add User" buttons had no `onClick`.
    Export now calls the existing-but-never-wired `exportUsers()` and
    downloads a CSV. Add User removed - no backing create-user action
    exists; building one is out of this task's scope. The bulk "N selected"
    action bar (Add Credits / Send Email / Clear) was nested inside each
    row's *individual* user-details Sheet, so it only appeared while that
    row's sheet was open, and "Send Email" inside it sent to the sheet's
    single user despite being drawn as a bulk action. Split: the bulk bar
    (Add Credits, Clear) is now a real page-level bar shown whenever
    `selectedUsers.length > 0`; Send Email stays inside the per-user Sheet.
    The user-details Sheet's `fetchUserDetails` was a stub - "For now, just
    find from users list (simulate details)" - reading fields
    (`phone`, `tagline`, `aboutme`, `college`, `github`, `linkedin`, `twitter`)
    that the list-page query never fetches and, for `tagline`/`aboutme`/
    `college`, don't exist on the `users` table at all. Replaced with a real
    `getUserById()` call populating the fields that do exist (`phone`,
    `location`, `yearofbirth`, `bio`, `headline`, `university`, `interests`,
    `userSkills`, `githubUrl`, `linkedinUrl`, `twitterUrl`, `website`).
  - `getAllUsers()`'s `status` filter (`active`/`inactive`) was declared in
    the filter type and wired up in the page's `<Select>`, but never applied
    to the query - the dropdown did nothing. Filters on `emailVerified` now.
  - `feedback.action.ts`'s `assignReward()` set `feedbacks.isAnonymous =
    false` as a "proxy" for a removed `isVerified` column - a privacy bug
    (silently un-anonymizing a feedback submission on reward) with no reader
    anywhere; the page already derives "Rewarded" from `rewards.length`, not
    from any feedback column. Removed.

  Several action functions lacked an explicit return-type annotation, which
  let TypeScript widen the discriminated union so `result.error` /
  `result.data` failed to narrow after a `.success` check at the call site -
  fixed everywhere this was hit this session: `getAllTransactions`,
  `getCreditRequests`, `getPayments`, `getCreditStats` (credit.action.ts);
  `getHiringDashboardStats` (hiring.action.ts); `getUniversityDashboardStats`
  (uni.action.ts); `getAllFeedback`, `updateFeedbackStatus`, `assignReward`
  (feedback.action.ts); `getAllUsers`, `getUserById` (user.action.ts).

  Verified: `grep -rl '"use client"' apps/admin/app --include=page.tsx`
  returns only `app/page.tsx` (sign-in, correctly excluded above); `cd
  apps/admin && npx tsc --noEmit` clean.
- **Serves:** done 6
- **Blocked by:** ADM-3, ADM-4

**Why.** All 20 pages are `"use client"` and fetch in `useEffect`. Three
consequences, all currently live:

1. The 20 hand-matched `loading.tsx` skeletons never show for their real purpose.
   `loading.tsx` renders while a *server* component awaits; a client page with no
   server work resolves in a frame. What the user sees is a skeleton flash and
   then a spinner.
2. The 46 `revalidatePath` calls across seven action files do nothing, because
   there is no server render to invalidate. Mutations refresh by re-running the
   client fetch, when the page remembers to.
3. Every page ships its whole table, filter and dialog logic to the browser, and
   the first paint waits on a round trip that the server could have made during
   render.

**Files.** All 20 `page.tsx` under `apps/admin/app/`, each gaining a
`_components/<name>-client.tsx`.

**Steps.** Per route, smallest first: page becomes an async server component that
awaits its data and renders `<XClient data={...} />`; the interactive half moves
to `_components/` unchanged; the existing `loading.tsx` stays as-is and starts
working.

Order (ascending size, so the pattern is settled on cheap pages):
`admins/profile` (164), `admins/access` (168), `credits/payments` (234),
`credits/transactions` (247), `system/settings` (248), `credits/requests` (250),
`system/database` (251), `analytics` (259), `hiring/companies` (287),
`hiring` (295), `uni/universities` (299), `uni` (321), `dashboard` (381),
`hiring/companies/verification` (408), `uni/universities/verification` (413),
`credits` (421), `admins` (436), `feedback` (450), `users` (531).

**Edge cases**
- **Absence of data is not a zero.** A dashboard that renders "0 users" during a
  Neon cold start is presenting a failure as a measurement, and an admin acts on
  that number. Adopt gurukul's `lib/load.ts`: rethrow retryable failures so
  `error.tsx` handles them, return the fallback only for real domain failures,
  and prefer a `null` fallback rendered as a dash over a zero.
- Server components cannot receive event handlers. The split is data down,
  interactivity in `_components/`.
- `revalidatePath` paths have to match the new route paths after the ADM-3 group
  merge. They are route groups, so paths do not change - verify rather than
  assume.
- Some of these pages fetch several things in sequence in one `useEffect`.
  Parallelise with `Promise.all` on the server; do not port the waterfall.

**Done when.** `grep -rl '"use client"' apps/admin/app --include=page.tsx`
returns nothing, and on a throttled connection each route shows its skeleton
until real content replaces it, with no spinner in between.

---

### ADM-9 - Remove every spinner
- [x] **Status:** done (2026-08-24) - all 58 `Loader2`/`animate-spin`
  instances across 19 files converted to `InlineLoader` (size mapped from the
  original icon's `w-*` class: sm for 3-4, md for 8, lg for 10-12), with
  layout-relevant classes (`mx-auto`, `mb-4`, `mr-1`) preserved and
  colour/size/spin classes dropped. Verified:
  `grep -rn "animate-spin\|Loader2" apps/admin` returns nothing; tsc clean.
- **Serves:** done 7
- **Blocked by:** ADM-8 (which removes most of them by construction)

**Why.** 58 `Loader2` / `animate-spin` usages across 24 files. The repo rule is
explicit about why: a rotating ring is the one loading affordance every product
uses, which makes it the one that says nothing about this one, and at button size
it is a grey smudge. `ShipItHQLoader`, `InlineLoader` and `skeleton-kit` all ship
in `@repo/ui` and this app uses none of them outside `app/loading.tsx`.

**Files.** The 24 files listed by
`grep -rln "animate-spin\|Loader2" apps/admin --include="*.tsx"`.

**Steps.** Full-page wait -> `ShipItHQLoader`. In-button -> `InlineLoader size="sm"`.
In-row -> `InlineLoader size="md"`. In-panel -> `InlineLoader size="lg"`. Inside
an already-rendered page, prefer a skeleton matching the real layout over either.

**Edge cases**
- `app/page.tsx` (sign-in) is outside the console shell and keeps a spinner today
  in its `isPending` branch. It needs a loading state too, and it is the one
  screen an unauthenticated visitor sees, so it should not be skipped.
- A skeleton that does not match the real layout is worse than none, because the
  page visibly reflows. Match or use the loader.
- The four layout `isPending` spinners disappear with ADM-1: the server layout
  has the session before it renders, so there is no pending state to show.

**Done when.** `grep -rn "animate-spin\|Loader2" apps/admin` returns nothing.

---

### ADM-10 - `error.tsx` for the console
- [x] **Done (2026-08-24).** `app/(console)/error.tsx` and
  `app/global-error.tsx` both already existed in the tree when this pass
  checked - this task's own status flag was just stale, not the code. Both
  match every requirement below: `error.message` is never rendered, only
  `error.digest`; the console boundary is deliberately plain (no shared
  `@repo/errors`/`AppErrorView` exists in this repo, unlike gurukul's, so it's
  written fresh per its own comment); `global-error.tsx` renders its own
  `<html>`/`<body>` and is inline-styled, since it runs when the layout
  itself failed and no stylesheet is guaranteed. **Not verified this pass:**
  actually throwing from a console page's server render to watch the
  boundary catch it live - the code matches every criterion in **Done when**
  by inspection, but that's a claim, not a click-through.
- **Serves:** done 6
- **Blocked by:** ADM-8

**Why.** There is no `error.tsx` and no `global-error.tsx` anywhere in
`apps/admin`. Once pages load on the server (ADM-8), a Neon blip during render is
an unhandled error boundary, which in production is a blank screen with no retry.
Gurukul's `lib/load.ts` policy depends on an `error.tsx` existing to rethrow
into.

**Files**
- new `apps/admin/app/(console)/error.tsx`
- new `apps/admin/app/global-error.tsx`

**Steps.** Console-level boundary offers a retry and never renders raw error text
(a Drizzle error message can carry SQL and column names). Root `global-error.tsx`
is inline-styled, because it renders when the layout itself failed and no
stylesheet is guaranteed.

**Edge cases**
- `global-error.tsx` must render its own `<html>` and `<body>`.
- Do not display `error.message`. Show `error.digest` if anything, so a report can
  be correlated with a log line.

**Done when.** Throwing from a console page's server render shows the boundary
with a working retry, and the rendered HTML contains no SQL or table names.

---

### ADM-11 - Palette, contrast and heading scale
- [x] **Done (2026-08-24).** The red sweep: every decorative use (the
  `from-red-500 to-neutral-900` gradient used as the brand accent on
  buttons/avatars/tab-underlines across ~14 files, focus rings on ordinary
  text inputs, a role badge, a hover state, a stray `blue-500`/`violet-500`
  pair in the dashboard's platform-colour map) replaced with neutral. What's
  left is genuinely semantic - status badges (REJECTED/SUSPENDED/FAILED/BUG),
  destructive buttons (delete, reject, suspend), negative/spend financial
  amounts, the unhealthy-database state - and stays red on purpose per the
  task's own carve-out.

  The heading-scale pass (`font-semibold` base size for section headings, no
  `font-bold`, `text-2xl` H1 only): completed as a side effect of the ADM-8
  page-conversion pass, since every converted page's heading was rewritten
  from scratch in the same style. Verified directly: all 21 `<h1>` elements
  in `app/(console)` use `text-2xl font-semibold tracking-tight`, byte-for-
  byte identical class strings; no `<h2>`/`<h3>` anywhere uses `font-bold`;
  the two remaining `font-bold` hits in the whole app are single-letter
  avatar-initial badges, not headings, and are correctly left alone.
  `grep -rhoE "(red|orange|yellow|blue|indigo|purple)-[0-9]{2,3}"`
  spot-checked file by file - remaining ~106 hits are all in the semantic
  categories above; tsc clean.
- **Serves:** done 8

**Why.** The repo palette is monochrome black and neutral. This app uses red
across the whole range (`red-100` through `red-900`), including
`bg-gradient-to-br from-red-500 to-neutral-900` on the sign-in tile and the admin
platform badge, and `bg-gradient-to-r from-red-500 to-neutral-900` on the
sign-in button. Those gradients are theme-independent surfaces, so
`text-white` on them cannot be corrected by a `dark:` variant - the exact trap
the repo `CLAUDE.md` records for the auth brand panel, which measured 1.1:1.

**Files.** Everything in
`grep -rln "red-[0-9]00" apps/admin --include="*.tsx"`, plus a new shared badge
map in `types/admin.ts`.

**Steps**
1. Replace decorative red with neutral. The console is not more serious for being
   red; it is just off-palette.
2. Keep red only for genuinely destructive confirmation and for a `REJECTED` or
   `SUSPENDED` status badge, and source those from one exported map rather than
   inline classes per page. Gurukul's `roleColors` in `types/admin.ts` is the
   pattern, including the note about why a class map in a types file is a smell
   worth naming.
3. Measure the contrast of any remaining light-on-constant-surface text. AA is
   4.5:1 for body and 3:1 for large text.
4. Headings: `font-semibold` at base size for section and card titles,
   `text-2xl font-semibold tracking-tight` for a page H1, never `font-bold` on a
   heading. This is gurukul's rule and worth adopting so the two consoles do not
   diverge.

**Edge cases**
- A status badge is semantic colour and stays. A gradient is decoration and goes.
- Check the rendered contrast, not the class name.
- `text-lg` on a *displayed value* (a name, a figure) is fine. The rule governs
  headings.

**Done when.** `grep -rn "red-[0-9]00" apps/admin --include="*.tsx"` returns only
the destructive-action and status-badge sites, and every one of those is reading
from the shared map.

---

## Phase 4 - the screens the tables are waiting for (done: 10)

### ADM-12 - Invitations screen
- [x] **Status:** done (2026-08-24) - `app/(console)/admins/invitations/page.tsx`:
  create (email/name/role), list with status and expiry, copy-link, revoke.
  Linked into `lib/navigation.ts`. Uses the existing `createAdminInvitation` /
  `getPendingInvitations` / `revokeInvitation` actions unchanged. Verified: tsc
  clean; page 307s to `/` when signed out (gate works); manual create/list/
  revoke flow not exercised against a real SUPER_ADMIN session in this pass.
- **Serves:** done 10
- **Blocked by:** ADM-3, ADM-6

**Why.** `createAdminInvitation`, `revokeInvitation` and the `admin_invitation`
table all exist. There is no page. `lib/navigation.ts` links to
`admins/invitations`, which 404s. So invitations can be created only by calling
the action from another screen that does not exist, and once created there is no
way to see whether one was used, expired, or is still outstanding.

**Files.** New `app/(console)/admins/invitations/{page.tsx,loading.tsx,_components/}`.
Reference: gurukul `app/(main)/admins/invitations/`.

**Steps.** List invitations with status, role, expiry and who created them.
Create, resend and revoke. Show the code once at creation and never again.

**Edge cases**
- An expired invitation still reads `PENDING` until something looks at it. Derive
  the displayed status from `expiresAt` rather than trusting the column, and
  sweep on read.
- Only `SUPER_ADMIN` can create invitations; the action already enforces this, and
  the UI must not offer the button to anyone else.
- Re-inviting an email that already has `admin_access` should say so rather than
  creating a second invitation.

**Done when.** A `SUPER_ADMIN` creates an invitation, sees it listed as pending
with its expiry, revokes it, and the revoked code is refused on redemption.

---

### ADM-13 - Invitation accept flow
- [x] **Status:** done (2026-08-24) - `actions/invitations.action.ts`
  (`getInvitationByCode` public lookup, `acceptAdminInvitation` inside
  `withTransaction`) plus `app/join/[token]/page.tsx` (server, styled to match
  the sign-in screen) and `_components/join-client.tsx` (name/password form,
  signs in and redirects to `/dashboard` on success). Also sends a real
  notification to every active SUPER_ADMIN when someone joins (ADM-15's
  producer). Verified: tsc clean; curl against `/join/<bogus-code>` renders
  the "Invitation not available" state server-side with a 200, not a crash;
  the full accept-and-sign-in path was not exercised against a real invitation
  in this pass (needs a live SUPER_ADMIN to create one first).
- **Serves:** done 3, done 10
- **Blocked by:** ADM-12
- **Blocks:** removal of the route in ADM-2

**Why.** This is the replacement for the unauthenticated grant route. Gurukul
does it with `app/join/[token]/`: the link carries the token, the page shows who
invited you and to what, and accepting is the thing that creates the account.

**Files.** New `app/join/[token]/{page.tsx,loading.tsx,_components/}`. The
middleware from ADM-1 already treats `/join` as public.

**Steps.** Validate the token server-side, render the invitation, and on accept
create the user, the credential and the `admin_access` row inside
`withTransaction`.

**Edge cases**
- A used, revoked or expired token gets a specific, non-enumerating message.
- An invited email that already has a ShipItHQ account should link the existing
  user rather than creating a second one, and must not overwrite
  `users.role`.
- A visitor with an existing admin session hitting a `/join` link for a different
  email needs a defined outcome; sign them out and proceed, or refuse.

**Done when.** An invited person completes the flow from the email link and lands
in the console, and `/api/auth/verify-access-code` can be deleted with nothing
broken.

---

### ADM-14 - Audit log screen
- [x] **Done (2026-08-24).** `app/(console)/admins/audit/page.tsx` built:
  paginated, filterable by module, one entry per row with actor/module/
  timestamp. `getAuditLogs()` extended with a `module` filter. Linked into
  `lib/navigation.ts`.

  `lib/audit-log.ts`'s `logAdminAudit()` added and every one of the 22
  `db.insert(adminAuditLogs)` call sites across 6 action files
  (`admin.action.ts` x5, `system.action.ts` x2, `hiring.action.ts` x2,
  `uni.action.ts` x2, `feedback.action.ts` x3, `user.action.ts` x6,
  `credit.action.ts` x2) now goes through it. It swallows its own failure
  (an audit write throwing must not fail the mutation it describes) and logs
  to the server console instead. `verify-access-code/route.ts`, the other
  ad-hoc writer the task's own **Why** names, no longer exists (ADM-2).

  A real bug surfaced while doing this pass: the audit screen's module
  filter dropdown listed only 6 of the 7 modules actual writes use -
  `hiring` and `university` (written by `hiring.action.ts`/`uni.action.ts`)
  were missing, so filtering to either showed nothing even though `db` had
  rows for both. Added.

  **Not done:** the `ipAddress`/`userAgent` columns still go unpopulated,
  and the `admin_access` -> `admin_audit_log` `onDelete: cascade` is
  unchanged - both flagged as schema questions in the task's own **Edge
  cases**, out of scope for an action-layer refactor.

  Verified: `grep -rn "db.insert(adminAuditLogs)"` returns only
  `lib/audit-log.ts` itself; `cd apps/admin && npx tsc --noEmit` clean.
- **Serves:** done 10
- **Blocked by:** ADM-3

**Why.** `admin_audit_log` is written to by the actions and read by nobody.
`lib/navigation.ts` links to `admins/audit`, which 404s. An audit log with no
reader is a table that costs writes and answers no question.

There is a second half: the writes are ad hoc. `verify-access-code/route.ts`
inserts into the table directly, and the action files each build their own row.
Gurukul has `lib/audit-log.ts` with one `logAdminAudit()` that swallows its own
failure, because an audit write failing must not fail the operation it describes.

**Files.** New `app/(console)/admins/audit/`, new `apps/admin/lib/audit-log.ts`,
and the call sites in `actions/`.

**Steps.** Add the writer helper first and route every existing insert through
it. Then build the screen: filter by admin, module, action and date range;
paginate; show the `changes` jsonb readably.

**Edge cases**
- `adminId` references `admin_access.id` with `onDelete: cascade`, so removing an
  admin deletes their audit trail. That is very likely wrong for an audit log.
  Flag it as a schema question rather than fixing it inside this task.
- `ipAddress` and `userAgent` columns exist and nothing populates them.
- `changes` can hold anything. Render it without letting a large blob break the
  row layout.

**Done when.** Every mutating action writes through `logAdminAudit()`, and the
screen shows a specific admin's last 20 actions filtered by module.

---

### ADM-15 - Admin notifications in the sidebar bell
- [x] **Status:** done (2026-08-24) - `components/navigation/admin-sidebar.tsx`
  feeds `AppSidebar`'s `notifications` prop (list, unread count, mark-one/
  mark-all-read, 60s poll while the console is open). One real producer, not
  a bell that stays empty forever as the task required: accepting an
  invitation (ADM-13) now notifies every active SUPER_ADMIN. Two real bugs
  fixed in `system.action.ts` while wiring this: (1) `getAdminNotifications` /
  `markNotificationAsRead` / `markAllNotificationsAsRead` were gated on
  `system` module permission, which is a whole-app setting, not a personal
  one - a TEAM_MEMBER with no `system` grant could not see their OWN
  notifications; (2) `markNotificationAsRead(id)` had no ownership check at
  all, so any admin could mark - or probe the existence of - any OTHER
  admin's notification by id. Both fixed (new `requireAnyActiveAdmin()` check,
  the update scoped to `adminId = caller`). A THIRD bug surfaced by the same
  read: this file's `checkAdminAccess()` called `hasPermission()` directly on
  the stored jsonb with no SUPER_ADMIN bypass, which meant a SUPER_ADMIN with
  the (normal, empty) default `permissions: {}` was locked out of System
  Settings, Database Health and Cache too, not just notifications - fixed by
  routing through `getEffectivePermissions()` like every other permission
  check in the app. Verified: tsc clean.
- **Serves:** done 10
- **Blocked by:** ADM-3

**Why.** `admin_notification` exists with `isRead`, `actionUrl` and `actionLabel`
columns. `@repo/ui`'s `AppSidebar` already accepts a `notifications` prop with
exactly that shape and hides the bell when it is omitted. The admin sidebar omits
it. So the table and the component are two thirds of a feature that has never
been connected.

**Files.** New `actions/notifications.action.ts`, the sidebar wrapper.

**Steps.** List, unread count, mark-one-read, mark-all-read. Feed them to
`AppSidebar`'s `notifications` prop. Reference: gurukul's
`app/(main)/_components/notifications-bell.tsx`.

**Edge cases**
- `adminId` is nullable, which reads as "broadcast to all admins". Decide it
  deliberately and handle the null case in the query rather than filtering it out
  by accident.
- Nothing currently writes this table. A bell that is always empty is worse than
  no bell, so this task includes at least one real producer (a pending
  verification, a credit request) or it waits.

**Done when.** A row inserted for the signed-in admin appears in the bell with an
unread count, and marking it read clears the count without a reload.

---

## Phase 5 - housekeeping

### ADM-16 - Rename the auth route handler
- [x] **Status:** done (2026-08-24) - `[...nextauth]` renamed to `[...all]` via
  `git mv`; the handler body was already correct (better-auth's
  `toNextJsHandler`), only the misleading directory name changed. Verified:
  `grep -rn nextauth apps/admin` is empty; tsc clean.
- **Serves:** done 11

**Why.** `app/api/auth/[...nextauth]/route.ts` is named for NextAuth. The app uses
better-auth, mounted at `basePath: "/api/auth"`. It works, because the catch-all
matches regardless of its parameter name, which is exactly why the wrong name has
survived. Every other app in the repo should be checked for the same thing.

**Steps.** Rename the directory to `[...all]`, as in gurukul and better-auth's own
docs.

**Done when.** Sign-in, sign-out and `/api/auth/get-session` all work after the
rename, and `grep -rn "nextauth" apps/` is empty.

---

### ADM-17 - Fix the env templates and the port
- [x] **Status:** done (2026-08-24) - `.env.example` and
  `.env.production.example` both fixed: port corrected to 6002, sibling app
  URLs added, Cloudinary section replaced with R2, cross-app/cron secrets
  added, and a clearly-marked "not yet used" section for keys this app
  doesn't read yet. `secrets.json.example` deleted (DEL-5). `apps/admin/.env`
  itself was generated from `apps/main/.env` earlier in this pass and its key
  set now matches `.env.example` exactly (diffed, zero mismatches).
- **Serves:** done 11

**Why.** `apps/admin/.env.example` documents port 3003. `package.json` runs the
dev server on 6002, and `@repo/auth`'s `trustedOrigins` fallback for this app is
`http://localhost:6002`. So a developer following the template gets CSRF failures
with no obvious cause. `.env.example` also trails off mid-section: its Cloudinary
heading has no keys under it, and it never mentions R2, which is what this repo
actually uses. `secrets.json.example` is a third, stale copy of the same list.

**Files.** `apps/admin/.env`, `.env.example`, `.env.production.example`,
`secrets.json.example` (DEL-5).

**Steps**
1. **Done 2026-08-24:** `apps/admin/.env` created, generated from
   `apps/main/.env`. Shared values (`DATABASE_URL`, `BETTER_AUTH_SECRET`, the
   Google and GitHub clients, `RESEND_API_KEY`, `RESEND_FROM_MAIL`, all four
   `R2_*`, `INTER_PLATFORM_SECRET`, `CRON_SECRET`) copied verbatim;
   `BETTER_AUTH_URL`, `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_ADMIN_URL` set to
   `http://localhost:6002`; sibling app URLs copied; and the keys this app does
   not use yet (`WORKER_SECRET`, `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`,
   `ANTHROPIC_API_KEY`, `RAZORPAY_KEY_SECRET`,
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `G_ANALYTICS_ID`) present by name with empty
   values for Niraj to fill.
2. Still to do: correct `.env.example` to port 6002, replace its Cloudinary
   section with R2, and finish the truncated file.
3. Still to do: bring `.env.production.example` in line, and delete
   `secrets.json.example` under DEL-5.

**Edge cases**
- `BETTER_AUTH_SECRET` must be byte-identical across apps or the shared cookie
  fails to verify. It is copied, not regenerated.
- `--secrets-file` is additive, and a key present with an EMPTY value overwrites
  the live Worker secret with an empty string. The empty placeholders belong in
  `.env`, and must be deleted rather than blanked in `.env.production`.
- `AUTH_COOKIE_DOMAIN` stays empty on localhost. In production it is
  `.shipithq.com`, which is precisely why ADM-1 exists.

**Done when.** `cd apps/admin && pnpm dev` starts on 6002 and a fresh clone
following `.env.example` alone can sign an admin in.

---

### ADM-18 - Write the app README
- [x] **Status:** done (2026-08-24) - real README: what the console is, the
  dev port, the two-role access model and how the invitation flow grants it,
  the two-layer gate (middleware + server layout + per-action checks), the
  shell's `--page-h` contract, `pnpm release` and the `--secrets-file`
  additive/empty-value trap, and a map of where things live.
- **Serves:** done 11

**Why.** `apps/admin/README.md` is still the create-next-app text: it tells the
reader to run `npm run dev` and open port 3000, neither of which is right. Every
other app in the repo has a real one.

**Steps.** What the console is, the dev port, the two roles and how permissions
work, how to grant someone access, the shell contract (`--page-h`,
`data-app-page`), and `pnpm release` with the `pnpm deploy` trap spelled out.

**Done when.** A new contributor can get the console running and grant themselves
access using only the README.

---

## Decisions taken 2026-08-24

All four open questions were answered by Niraj. Nothing in this file is blocked
on a decision any more.

1. **Role model: `SUPER_ADMIN` + `TEAM_MEMBER`.** Every non-`SUPER_ADMIN` enum
   value normalises to Team Member on read; the four surplus values stay in
   Postgres. A team member's access is exactly their per-module grants. The
   default for a new admin is Team Member with zero grants, and that empty case
   gets a designed "ask a super admin for access" screen rather than a blank
   sidebar. Unblocks ADM-7.
2. **DEL-1, DEL-2, DEL-3 approved: delete all three unused action files** (647
   lines). If a projects, mocks or challenges admin screen is wanted later it
   gets planned, not reverse-engineered from an action written for a page that
   never shipped. Unblocks ADM-5.
3. **Hiring and university keep their six screens; DEL-7 approved.** The
   verification queues are the part that earns its keep. The ~180 lines of types
   describing departments, classes, assignments and job applications go.
4. **The access-code tab is replaced, not hardened.** ADM-13 builds
   `/join/[token]`, and then `app/api/auth/verify-access-code/route.ts` and the
   sign-in screen's second tab are both deleted. This makes ADM-13 a blocker for
   ADM-2 rather than a follow-up, and it means ADM-2 ships no rate limiter: there
   will be no anonymous endpoint to rate-limit.

---

## Phase 6 - visual parity (added 2026-08-24, per Niraj)

Niraj asked for the landing page to match gurukul admin's "same to same", and for
the sidebar and a right-side AI rail to match gurukul's internal UI/layout. Two
things came out of re-reading gurukul plus a look at how `apps/main` already
solves the same problem in this repo:

- **The sidebar half is mostly already ADM-3.** `apps/main`'s
  `components/common/mainsidebar.tsx` is a thin wrapper over `@repo/ui`'s shared
  `AppSidebar` - the exact component `apps/admin/components/navigation/platform-sidebar.tsx`
  already wraps too. Gurukul is a different codebase with its own bespoke
  622-line sidebar because it has no shared `packages/ui` to draw on; shipithq
  does, and forking gurukul's copy here would fight that. So "sidebar same to
  same" is satisfied by ADM-3 (one shell, one nav config, the existing
  `AppSidebar`) rather than a new task.
- **The right-side rail is real, new scope.** Gurukul's AI panel is bespoke to
  gurukul. `apps/main` has its own equivalent - built for this repo, on this
  repo's conventions, already proven - and that is the one to port, not
  gurukul's. This is ADM-19.
- **The landing page is real, new scope.** ADM-20.

### ADM-19 - AI panel for the console
- [ ] **Status:** in progress (2026-08-24) - built in full: `lib/ai/protocol.ts`
  and `lib/openai-client.ts` copied verbatim from apps/main (fully generic);
  `lib/ai/tools.ts` written fresh with 7 read-only admin tools
  (search_users, get_user, get_credit_summary, search_feedback,
  get_platform_stats, search_companies, search_universities), each gated on
  the CALLING ADMIN'S real permissions via `getEffectivePermissions` - a
  TEAM_MEMBER without a module grant gets `{error:"forbidden"}` from the tool
  itself, not just from the page; `app/api/ai/chat/route.ts` re-checks
  `admin_access` per request (session != admin, same as every other route);
  `stores/ai-panel.store.ts` ported with its own localStorage key
  (`shipithq-admin.ai-panel`, namespaced apart from apps/main's) and attachments
  dropped per the ADM-19 descope; `components/ai/ai-panel.tsx`,
  `tool-steps.tsx`, `chat-history-dialog.tsx`, `ai-trigger-button.tsx`, and a new
  lighter `components/markdown-renderer.tsx` (no Monaco/mermaid - admin answers
  aren't code) all written; wired into the shell in
  `app/(console)/_components/layout-client.tsx` with the same docked-column
  /-bottom-sheet /-drag-resize /-sidebar-collapses-on-open behaviour as
  apps/main. `zustand`, `react-markdown`, `remark-gfm` added to
  apps/admin/package.json and installed. Verified: tsc clean; `curl -X POST
  /api/ai/chat` with no session returns 401; dev server compiles and serves
  the route with no build errors. **Not yet verified/blocked:** an actual
  streamed answer - `OPENAI_API_KEY` is still the empty placeholder in
  apps/admin/.env (ADM-17) pending Niraj filling it in; the docked-column /
  bottom-sheet rendering was not visually confirmed (same browser-sandbox
  limitation noted on ADM-4); and the per-permission tool refusal was not
  exercised against a real TEAM_MEMBER account.
- **Serves:** new - a scope addition beyond the original `overview.md`, which
  had explicitly excluded this. Superseded by Niraj's 2026-08-24 answer: full
  panel, ported from `apps/main`.
- **Blocked by:** ADM-1, ADM-3, ADM-4 (the panel docks into the shell those
  build)

**Why.** Every other ShipItHQ app has an AI rail; the console does not.
`apps/main` already carries the exact shape gurukul independently built - a
resizable column that narrows the page on desktop and becomes a bottom sheet
below `lg` - so admin's version is a **port of `apps/main`'s**, not a fresh
design.

**Reference files (all in `apps/main`, read in full 2026-08-24):**

| Piece | File | Lines |
|---|---|---:|
| Wire protocol (NDJSON framing) | `lib/ai/protocol.ts` | 114 |
| Raw OpenAI client (fetch-based, no SDK) | `lib/openai-client.ts` | 98 |
| Agent tools | `lib/ai/tools.ts` | 1123 |
| Chat route (tool-calling loop + stream) | `app/api/ai/chat/route.ts` | 398 |
| Panel store (zustand, localStorage-persisted) | `app/store/aiPanelStore.ts` | 247 |
| Panel UI | `components/ai/ai-panel.tsx` | 709 |
| Floating launcher | `components/ai/ai-trigger-button.tsx` | 35 |
| Shell wiring (docked column vs Sheet, drag-resize, collapse-on-open) | `app/(main)/layout.tsx` | (the `MainContent` section) |
| Markdown rendering | `components/common/markdown-renderer.tsx` | - |
| Tool-call step indicator | `components/ai/tool-steps.tsx` | - |
| Conversation history list | `components/ai/chat-history-dialog.tsx` | - |

**What ports 1:1.** The protocol, the OpenAI client, the store shape (rename the
persist key from `shipithq.ai-panel` to `shipithq-admin.ai-panel` so a browser
signed into both apps does not merge the two histories), the panel chrome
(header, composer, message bubbles, streaming "Thinking…" state - no spinner,
per the repo rule -, copy button, resize handle, maximize), the trigger button,
and the shell wiring (docked column on `lg+`, Sheet below it, sidebar
auto-collapses on open, `--page-h` shrinks by the same
`var(--app-bottom-nav-h)` term admin's own shell already needs from ADM-4).

**What is deliberately cut, not ported, for this pass:**
- **Attachments and context tags.** Built for a student pasting a resume or
  tagging a project; nothing in the console maps to it.
- **The four suggestion cards' custom glyph art** (`ai-art.tsx`). Replace with
  four admin-relevant openers as plain text, e.g. "Which users are close to a
  credit limit?", "Summarize this week's feedback", "Any companies waiting on
  verification?", "How many signups today?".
- **Every write tool.** `apps/main`'s only write tool
  (`create_cover_letter`) is argued safe in the file's own header comment on
  three specific properties. Nothing admin-side clears that bar yet - a tool
  that could refund credits or change a verification status from a chat
  message is a different risk profile from one that drafts a document. **v1
  ships read-only tools only.** A write tool is a task of its own, argued the
  same way, after this ships.
- **`link_to` / `destinations.ts`.** Optional follow-up once the console has
  enough stable routes to be worth a destination registry; not needed for v1.

**New files**
- `apps/admin/lib/ai/protocol.ts` (copy verbatim - it is fully generic)
- `apps/admin/lib/openai-client.ts` (copy verbatim - fully generic)
- `apps/admin/lib/ai/tools.ts` - admin tools, read-only:
  `search_users`, `get_user`, `get_credit_summary`, `search_feedback`,
  `get_platform_stats`, `search_companies`, `search_universities`. Same
  four design rules as `apps/main`'s file: every tool scoped by the calling
  admin's permissions (not just their id - a `TEAM_MEMBER` without `users`
  read access should not be able to route around the UI gate through the
  agent), read-only, capped/projected results, handlers that return `{ error
  }` rather than throw.
- `apps/admin/app/api/ai/chat/route.ts` - same structure as `apps/main`'s,
  gated on `admin_access` (not just a session), system prompt describing the
  ShipItHQ admin console rather than the student product.
- `apps/admin/stores/ai-panel.store.ts` (gurukul's path convention, since this
  file is admin-specific rather than shared - `apps/main` keeps it under
  `app/store/` for historical reasons the admin app has no reason to repeat)
- `apps/admin/components/ai/ai-panel.tsx`, `ai-trigger-button.tsx`,
  `tool-steps.tsx`, `chat-history-dialog.tsx`
- `apps/admin/components/markdown-renderer.tsx` (or confirm `@repo/ui` has one
  worth sharing before forking a third copy - `apps/main`'s lives outside
  `@repo/ui`, so check before assuming)
- wire into `apps/admin/app/(console)/_components/layout-client.tsx` from ADM-3

**Edge cases**
- The chat route must re-check `admin_access` per request, the same as every
  other admin action - a stale client session must not reach an OpenAI call
  that then reads the database with elevated trust.
- A `TEAM_MEMBER`'s tool results have to respect their per-module permissions
  (ADM-7), not just their existence as an admin. `search_feedback` for an admin
  with no `feedback` grant should refuse, the same way the page does.
- `OPENAI_API_KEY` / `OPENAI_CHAT_MODEL` are placeholders in `apps/admin/.env`
  today (ADM-17) - Niraj fills them in before this is testable end-to-end.
- The admin persona should say plainly when a tool found nothing rather than
  ever inventing a user, a credit balance, or a feedback entry - this is
  already `apps/main`'s rule and matters more here, since the audience is the
  team acting on what it says.

**Done when.** The rail opens from the trigger button or a sidebar action,
docks as a real column on `lg+` (page visibly narrows, nothing gets covered),
becomes a bottom sheet below `lg`, streams a real answer to "how many users
signed up this week" using `get_platform_stats`, and a `TEAM_MEMBER` with no
`users` grant gets a refusal rather than data when asking about a specific
user.

---

### ADM-20 - Landing page, matched to gurukul's
- [ ] **Status:** in progress (2026-08-24) - app/page.tsx rewritten: full-bleed
  `ShaderHeroBg` (graphite palette - self-hosted, on-brand, no video asset) behind
  a glass card (`bg-white/[0.05]`, `backdrop-blur-[12px]`, hairline border),
  ShipItHQ-branded copy in the same register as gurukul's, one sign-in tab
  (email/password - the access-code tab is gone, matching the ADM-2 decision),
  `ShipItHQLoader` for the pending/redirect state and `InlineLoader` in the
  button instead of `Loader2`, neutral gradient button (no red). Verified: tsc
  clean; curl confirms the route returns 200 with a valid HTML shell (correct
  script tags, no server-side crash) and `/dashboard` still 307s when signed
  out. **Not yet verified:** the actual rendered look - same browser-sandbox
  limitation as ADM-4/ADM-19, so this needs a manual look before calling it
  done.
- **Serves:** new scope, per Niraj 2026-08-24
- **Blocked by:** ADM-2 (the access-code tab this page currently renders is
  being deleted, not kept)

**Why.** The current sign-in screen is the generic `create-next-app`-era admin
template: a `Tabs` component switching between "Password" and "Access Code",
red gradients, a card on a dotted-grid background. Gurukul's is a considered,
branded screen: full-bleed looping video background with a dark scrim, a
glassmorphic card (`bg-white/[0.05]`, `backdrop-blur-[12px]`, hairline
`border-white/10`), monochrome neutral gradient button (not a saturated
colour), a mono-uppercase "System Operational" status line, and copy that
assumes the reader is staff ("Internal platform for the Gurukul team.
Authorized personnel only.").

**Files**
- `apps/admin/app/page.tsx` - full rewrite

**Steps**
1. Same structure as gurukul's, ShipItHQ-branded: header with logo + "ShipItHQ
   / Admin Portal", the glass card centered over a full-bleed background, footer
   bar with "ShipItHQ Admin" / company line.
2. **One tab, not two.** Gurukul's version already dropped the access-code path;
   ADM-2 drops shipithq's for the same reason. Email + password only, with the
   "First-time access? Use the invitation link sent to your email" line pointing
   at ADM-13's `/join/[token]`.
3. Background: gurukul uses a hosted video. Reference `packages/ui`'s
   `hero-shader-bg.tsx` / `auth-visual.tsx` (already used by the main app's auth
   screens) before reaching for a new video asset - a shader background is
   self-hosted, has no loading flash, and is already on-brand rather than
   introducing a fourth visual language.
4. Loading state: `ShipItHQLoader`, matching gurukul's use of its own
   `GurukulLoader` for the pending/redirecting states. Not `Loader2`.
5. Redirect target is `/dashboard` (or wherever ADM-3's shell lands), matching
   the pattern of gurukul's redirect to `/home`.
6. Copy: "Sign in to admin" / "Internal platform for the ShipItHQ team.
   Authorized personnel only." - same register, ShipItHQ's own product name.

**Edge cases**
- Text on a photographic or video background is the exact trap the repo
  `CLAUDE.md` names for the auth brand panel (measured 1.1:1). Gurukul's card
  avoids it by putting text on the **glass card**, not directly on the video -
  keep that structure, do not put body text straight on the background.
- The background must not fight the theme rule. Gurukul's is a dark screen
  regardless of site theme, which is defensible for a security-flavoured
  sign-in screen precisely because it is constant and its ink is chosen to
  match (`text-white` throughout, never a `dark:` conditional) - the failure
  mode the repo rule warns about is a background that changes with the theme
  while the text does not. Pick one and be consistent, whichever way.
- No red. The gradient button in gurukul's version is neutral
  (`from-[#525252] to-[#a3a3a3]`); match that, not the current red one.

**Done when.** `/` renders the new screen, signs an admin in through the one
remaining tab, and shows no spinner anywhere in the flow.

---

## Found and fixed during ADM-1 (2026-08-24) - not in the original plan

While merging the route groups for ADM-3, `actions/hiring/hiring.action.ts` and
`actions/uni/uni.action.ts` turned out to have **zero admin-access checks on any
exported function** - not `checkAdminAccess()`, not anything. Every other
action file in this app was already calling `checkAdminAccess()`; these two
never did. Next.js server actions are reachable directly (the action reference
ships in the client bundle of whatever page calls them), so this was not
"a signed-in student could see the page" - it was "anyone who could construct
the request could call `verifyCompany`, `rejectCompanyVerification`,
`verifyUniversity`, `rejectUniversityVerification`, `updateUniversityCredits`,
`verifyStudent`, and `bulkImportStudents`, with no session and no admin row at
all." That is more severe than anything ADM-1's own "Done when" line was
written to catch, because it required no session cookie whatsoever.

**Fixed:** every exported function in both files now opens with
`const accessCheck = await checkAdminAccess(); if (!accessCheck.success) return
{ success: false, error: accessCheck.error }` - the same pattern every other
action file in the app already uses. 26 call sites across the two files,
inserted mechanically (each function has exactly one `try {`) and verified
against `tsc --noEmit`.

**Fixed (2026-08-24), closing the gap above - then widened.** The first pass
gave `hiring.action.ts`/`uni.action.ts` their own module-scoped
`checkHiringAccess(level)` / `checkUniversityAccess(level)` helper, mirroring
`system.action.ts`'s pattern (including the `getEffectivePermissions()`
routing that gives SUPER_ADMIN the bypass a raw `hasPermission()` call would
miss).

A follow-up scan asked the obvious next question - does every other action
file check its module, or only these two plus `system.action.ts`? It did
not. `credit.action.ts`, `feedback.action.ts`, `user.action.ts` and
`analytics.action.ts` all had the exact same gap: every exported function
called the *generic* `checkAdminAccess()` from `admin.action.ts` ("is this
any active admin"), never the per-module check their own nav entries
(`credits`, `feedback`, `users`, `analytics`) are gated on. A TEAM_MEMBER
with zero grants - which is every new Team Member by default, per
`admins/invitations`' own copy - could call `approveCreditRequest`,
`assignReward`, `deleteFeedback`, `bulkUpdateUsers`, `deleteUser`,
`adminSendEmail`, or any of the six analytics readers directly, with no
module access at all. `admin.action.ts` itself had a narrower version of the
same thing: `getAdminUsers`, `getPendingInvitations` and `getAuditLogs` (all
under the "Admin Management" nav group, all disclosing information about
other admins) were readable by any active admin regardless of
`admin_management` grant, even though the mutations in the same file
(`createAdminInvitation`, `revokeInvitation`, `updateAdminStatus`,
`updateAdminPermissions`) were already correctly gated - stricter than a
module grant, in fact, since they require `SUPER_ADMIN` specifically, which
the two-role model's design intends and this fix left untouched.

At five files each about to grow their own copy of the same ~25-line
module-check helper, the duplication itself became the risk worth fixing:
`system.action.ts`'s copy had silently dropped the `status !== "ACTIVE"`
check partway through (its `requireAnyActiveAdmin()` kept it, its
`checkAdminAccess(module, level)` didn't), so a SUSPENDED admin with a
stored `system` grant could still call `updateSystemSetting` or
`clearCache`. One copy of a security check drifting from its siblings is
exactly the failure mode duplication invites. Consolidated into
`lib/module-access.ts`'s `checkModuleAccess(module, level)` and
`requireAnyActiveAdmin()`, both used everywhere now:

- `system.action.ts` imports `checkModuleAccess` aliased to its old local
  name so none of its ~10 call sites needed touching, and gets the
  `ACTIVE`-check fix for free.
- `hiring.action.ts` / `uni.action.ts`'s `checkHiringAccess` /
  `checkUniversityAccess` are now one-line wrappers around the shared
  helper instead of their own copies.
- `credit.action.ts` (`credits`), `feedback.action.ts` (`feedback`),
  `user.action.ts` (`users`), `analytics.action.ts` (`analytics`) and three
  read functions in `admin.action.ts` (`admin_management`) now call
  `checkModuleAccess()` directly - 27 call sites in total across these five
  files.
- Level assignment follows the mutation, not the file: every read gets
  `"read"`; ordinary mutations (approve/reject/update/assign/suspend/
  activate/bulk-update/send-email) get `"write"`; actual row deletions
  (`deleteFeedback`, `deleteUser`) get `"delete"` - a level the
  `admins/access` permission editor already exposes as an independent
  checkbox (not implied by `"write"`) but that, before this fix, nothing in
  the app ever actually required, so toggling it did nothing observable.
  `updateUserRole` and `deleteUser` keep their existing `SUPER_ADMIN`-only
  check layered on top of the new `users:write`/`users:delete` gate - that
  check is already stricter than any module grant, same reasoning as
  `admin.action.ts`'s untouched mutations.

A TEAM_MEMBER with no grant, or only a `read` grant, now gets a real "You do
not have `<level>` access to the `<module>` module" error from every
mutation directly, not just a UI that never called it. Verified: `cd
apps/admin && npx tsc --noEmit` clean; no unused imports left behind across
`actions/` and `lib/` (checked by hand, file by file); not exercised against
a real TEAM_MEMBER account with a partial grant, same real-account
limitation noted on ADM-1/ADM-3.

## Found and fixed in the pre-manual-testing scan (2026-08-24) - not in the original plan

A full end-to-end read-through of `apps/admin` before manual testing began,
looking specifically for anything the page-conversion passes had missed.
Three of the three Credits sub-pages had real, live bugs - all present
before this session touched these files, none introduced by it:

- **`credits/transactions`:** the search box and a "Status" filter dropdown
  were both fully wired to `useState` and rendered, but neither was ever
  passed to `getAllTransactions()` - typing in the search box or picking a
  status did nothing. Worse, the status filter's options
  (`COMPLETED`/`PENDING`/`FAILED`/`CANCELLED`) don't correspond to any real
  column - `credit_transaction` has no status concept at all, it's an
  immutable ledger row - so even a wired version would have been
  meaningless. Removed the status filter entirely. Separately, the *type*
  filter and the row-badge colour map both used a wrong, invented enum
  (`PURCHASE`/`REWARD`/`REFUND`/`DEDUCTION`) instead of the real
  `credit_type` values (`PURCHASE`/`SPEND`/`BONUS`/`REWARD`) - picking
  "Refund" or "Deduction" silently matched zero rows every time, and a real
  `SPEND` or `BONUS` transaction's badge fell through to the default
  (purchase) colour. Fixed the enum values and the badge colours
  (`SPEND` red like other negative amounts, `REWARD` emerald, matching the
  scheme already used on the credits overview page). Added real
  `search?: string` support to `getAllTransactions()` (matches by
  transaction id, or by the owning user's name/email via a lookup query) and
  wired the search box to it. The page's dead "Export" button was removed -
  no `exportTransactions()` action exists, unlike `exportUsers()` on the
  users page, so there was nothing to wire it to.
- **`credits/payments`:** same dead search box (never passed to
  `getPayments()`) - fixed the same way, added `search` to `PaymentFilters`
  (matches order id or the paying user's name/email). The status filter's
  options used `SUCCESS` instead of the real `payment_status` value
  `COMPLETED`, and were missing `CANCELLED` entirely - both the `<select>`
  and `getStatusBadge()`'s colour map. Fixed both to the real 5-value enum
  (`PENDING`/`COMPLETED`/`FAILED`/`REFUNDED`/`CANCELLED`). The hardcoded
  "RazorPay" payment-method column was checked against the schema and left
  alone - `payment` has a `razorpayOrderId` column and no other provider
  field, so it's a true fact about this data, not a placeholder.
- **`credits/requests`:** same dead search box pattern - added `search` as a
  third parameter to `getCreditRequests(status, pagination, search)` (kept
  backward compatible; the three other call sites that pass two arguments
  are untouched) and wired it.

`hiring/companies` and `uni/universities` were checked for the same pattern
and found to have a *working but limited* version, not a dead one - their
search boxes filter client-side across only the current page of loaded
results, not the full dataset server-side. Left as-is: real but scoped
behaviour, not a bug, and extending it to a real server-side search is
follow-up scope rather than a fix.

`uni/universities`' status filter/badge map also only covers 3 of the 5
`university_verification_status` values (`UNDER_REVIEW` and `SUSPENDED` are
missing) - checked `uni.action.ts` and confirmed nothing in this app ever
writes either of those two states to a university row (`verifyUniversity`
only writes `VERIFIED`, `rejectUniversityVerification` only writes
`REJECTED`), so this is latent, not reachable through any current code path.
Left alone rather than building UI for states nothing can produce.

Also fixed while re-reading `middleware.ts` and `app/page.tsx` together (see
the ADM-1 entry above for the full writeup): the sign-in page never actually
implemented the "no console access" state its neighbouring comment claimed
it did, which combined with the middleware's unconditional `/`-to-`/dashboard`
redirect for any logged-in session produced a genuine infinite redirect loop
for a signed-in non-admin. That was the single highest-severity finding of
this pass - unlike the Credits dead-UI bugs, this one didn't degrade a
feature, it made the console completely unreachable for exactly the account
type (a signed-in non-admin) ADM-1 exists to handle gracefully.

Verified across all of the above: `cd apps/admin && npx tsc --noEmit`
clean; no unused imports anywhere in `app/`, `components/`, `actions/`,
`lib/` (checked file by file); every one of the 21 console routes still
returns a 307 to `/` when signed out; dev server log shows no compile or
runtime errors through the whole pass.

---

## Found and fixed during Niraj's manual testing pass (2026-08-24)

Six real bugs found by clicking through the app, none of them cosmetic:

- [x] **`SelectItem must be used within SelectContent` - a live crash, not a
  console warning.** Six client components (`credits-client.tsx`,
  `credits/transactions/transactions-client.tsx`, `feedback-client.tsx`,
  `users-client.tsx`, `admins/audit/audit-log-client.tsx`,
  `admins/invitations/invitations-client.tsx`) rendered `<Select>` with
  `<SelectItem>` as a direct child - no `<SelectTrigger>`, no
  `<SelectContent>`, no `<SelectValue>`. `@repo/ui`'s `Select` is the raw
  Radix composition, not a self-wrapping convenience component (unlike
  `hiring/companies/companies-client.tsx` and
  `uni/universities/universities-client.tsx`, which already composed it
  correctly and were the template for the fix). This is why the Companies
  Verification screen showed the console's `error.tsx` boundary
  ("Something went wrong") mid-testing - a real, user-facing crash on any
  page with a broken filter dropdown, not a background console error.
  Fixed all six by wrapping their `SelectItem`s in `SelectTrigger` +
  `SelectValue` + `SelectContent`, matching the working template exactly.
- [x] **Two "outline" buttons hardcoded light-only colours, disappearing on
  dark.** `hiring/companies/companies-client.tsx` and
  `uni/universities/universities-client.tsx`'s "Pending (N)" button both
  carried `className="text-neutral-800 border-neutral-300 hover:bg-neutral-50"`
  - no `dark:` pair, so in dark mode the text and border resolved to
  near-invisible values against a dark panel (this repo's own
  `docs/responsiveness.md` names this exact trap in section 6: "Every
  colour has a `dark:` pair - including on outline buttons"). The override
  wasn't doing anything the shared `Button` component's theme-aware
  `outline` variant doesn't already do correctly - removed it; both buttons
  now use the plain variant default, same as the "Export" button beside
  them on both pages.
- [x] **The shared `AppSidebar` profile row was a popover whose only
  destination was itself.** `admin-sidebar.tsx` passes a single
  `profileLinks` entry ("My Profile" -> `/admins/profile`); `hiring` and
  `uni`'s sidebars pass none at all. In both cases the expanded-state
  profile row was still a `PopoverTrigger` with a chevron, so clicking it
  either opened a one-item menu whose only choice restated the click, or (0
  links) opened an empty popover that did nothing. Fixed in the shared
  component (`packages/ui/src/components/app-sidebar.tsx`), not per-app:
  when `profileLinks.length <= 1` the row is now a direct `<Link>` to that
  link's `href` (or `profileHref` if there are none), same as the
  collapsed-rail form already did. `main`'s three-link profile menu is
  unaffected - it still gets the popover. Verified against `main`,
  `hiring`, `uni` and `admin`'s own `tsc --noEmit`, all clean.
- [x] **The floating "Ask AI" button moved into the sidebar.** It now lives
  in `AppSidebar`'s `footerExtra`/`footerExtraCollapsed` slot (a "Ask AI"
  row above the theme-toggle/notification-bell row, wired to
  `useAIPanelStore().open`), which only renders inside the desktop sidebar
  and the mobile nav Sheet. The old `fixed bottom-6 right-6` floating
  button (`components/ai/ai-trigger-button.tsx`) stays, but only below
  `lg` (`className="lg:hidden"` at its one call site in
  `layout-client.tsx`) - the sidebar is a hidden Sheet at that width, so
  it's still the only way in on mobile; above `lg` it would just be a
  second control floating over the page for the same action the sidebar
  row now offers.
- [x] **Two dead nav entries removed from `lib/navigation.ts`, both
  confirmed with Niraj.** "My Profile" under Admin Management duplicated
  the profile row every screen already has at the bottom of the sidebar
  (see the popover fix above - that row was the point of confusion, now
  it's a direct link and the duplicate tree entry is redundant on top of
  it). "Database" under System is gone from the nav tree per Niraj's
  explicit call; the page itself is untouched at `system/database` and
  reachable by URL, only the sidebar entry is gone. Whether Audit Logs
  needs the same treatment is still open - Niraj flagged "the same issue"
  there but didn't confirm removal specifically; left as-is pending that
  answer.
- [x] **Dropped both now-unused Lucide imports** (`Database`, `User`) from
  `lib/navigation.ts` after removing the two nav entries above.

Verified: `cd apps/admin && npx tsc --noEmit` clean; `packages/ui`,
`apps/main`, `apps/hiring`, `apps/uni` all typecheck clean too (the
`AppSidebar` fix touches a component all four share); no unused imports
introduced.

---

## Phase 3 - navigation architecture, loading states, responsiveness (2026-08-24)

Three large, multi-session items opened from the same testing pass. Tracked
here rather than attempted in one sitting - see each task's own **Why** for
the argument that these need to be worked module-by-module, not page-by-page.

### ADM-21 - Module-scoped sidebar takeover for Hiring and University
- [x] **Done (2026-08-24).** Built on top of `AppSidebar` per **Steps** #3's
  own instinct to rule that out first, not a hand-rolled second sidebar -
  see **Files** below for what that turned into in practice, which departs
  from this task's own original plan in one real way (see the note after
  **Files**).
- **Serves:** the sidebar being "really bad" when Hiring/University are
  expanded - Niraj's words, and the screenshot backs it up: an already-busy
  primary nav grows three more indented, individually-pill-highlighted rows
  every time either group opens, and the whole tree scrolls together.
- **Blocked by:** none directly, but do this before ADM-22/23 touch the
  hiring/uni pages - a page whose shell is about to change is the wrong
  thing to skeleton or responsive-pass first.

**Why.** `apps/main` already solved this exact problem for its own busiest
module. `app/(jobs)/layout.tsx` renders a dedicated `JobsSidebar` instead of
the app's `MainSidebar` for every route under `/jobs/*` - a focused, single-
module nav with its own back-to-main affordance, not a bigger version of
the general sidebar. The admin console's Hiring and University sections are
structurally the same shape (a small, self-contained set of screens: an
overview, a list, a verification queue) and are currently handled the
opposite way - as two more expandable branches competing for space in the
one shared tree, which is what produces the "really bad" nested-pill look
in the screenshot.

**Files - what actually got built:**
- `packages/ui/src/components/app-sidebar.tsx` - new `backLink?: {label,
  href}` prop, rendered as its own bordered block between the brand header
  and the search bar (not a `primary` item), with a collapsed-rail icon
  form. Shared by every app in the family now, not just this task's two
  sidebars.
- new `apps/admin/components/navigation/use-console-sidebar.ts` - the
  notification-polling/sign-out/AI-open logic `AdminSidebar` used to own
  directly, pulled into a hook so three sidebars don't carry three copies
  of it.
- new `apps/admin/components/navigation/ask-ai-footer.tsx` - the "Ask AI"
  `footerExtra`/`footerExtraCollapsed` row, same reason.
- new `apps/admin/components/navigation/hiring-sidebar.tsx` and
  `uni-sidebar.tsx` - two components after all (their nav arrays and brand
  icons differ enough that one parameterised component would have taken
  more props than it saved lines), each a thin `AppSidebar` wrapper: own
  `brand`, `backLink={{label: "Back to console", href: "dashboard"}}`,
  `primary={hiringModuleNav}` / `universityModuleNav`, no `secondary`,
  `profileLinks={[]}` (single-admin-profile-link case, see the popover fix
  two sections up - this already collapses to a direct link with no popover
  needed).
- `apps/admin/lib/navigation.ts` - `adminNavigation.primary`'s Hiring and
  University entries lost their `children` (now flat links, same shape as
  Dashboard/Users/Feedback/Analytics); two new exports,
  `hiringModuleNav`/`universityModuleNav`, hold the 3-item nav each module
  sidebar renders.
- `apps/admin/components/navigation/admin-sidebar.tsx` - refactored onto
  the same `useConsoleSidebar()` hook and `AskAIFooter` component as the
  two new sidebars, not left as the odd one out.
- `apps/admin/app/(console)/_components/layout-client.tsx` - **not** two
  new nested `layout.tsx` files. See the departure note below.

**Departure from this task's original plan.** Step 4 asked to confirm that
a nested `app/(console)/hiring/layout.tsx` composes with the parent layout
rather than double-rendering the shell before designing around it - doing
that check surfaced that it WOULD double-render: `(console)/layout.tsx`
already wraps every child in `LayoutClient` -> `ConsoleContent`, which
renders `AdminSidebar` itself; a second nested layout can only wrap
`{children}` a layer deeper; it cannot reach in and replace a sidebar the
parent already committed to rendering. So the swap happens one level up
instead: `ConsoleContent` reads `usePathname()` and a permission check
(`hasPermission(effective, "hiring"/"university", "read")`) and picks which
of the three sidebar components to render as a single `const Sidebar = ...`
- no route-group nesting, no risk of a flash between two rendered shells.
This satisfies **Edge case** one (no flash - it was never going to render
twice to begin with) and **Step 5** (a TEAM_MEMBER with no grant falls back
to the permission-filtered `AdminSidebar`, exactly as the collapsed tree
entry did before) more directly than the originally-planned nested-layout
approach would have.

**Steps**
1. Read `apps/main/app/(jobs)/layout.tsx` and
   `apps/main/components/common/jobssidebar.tsx` in full before writing
   anything - they are the reference implementation, not just the
   inspiration.
2. Decide whether Hiring and University can share one generic
   "module sidebar" component (title, back-link, 2-3 nav items) or need
   two - look at both navs' actual shape before deciding, don't assume
   symmetry.
3. Each module sidebar needs: a "Back to Admin Console" (or similar) link
   back to `/dashboard`, the module's own small nav (Overview, Companies/
   Universities, Verification), and the SAME bottom bar (theme toggle,
   notifications, Ask AI, profile, sign-out) `AdminSidebar` already has -
   check whether `AppSidebar` itself can be reused with a different `primary`
   array and no `secondary`, rather than hand-rolling a second sidebar
   component from scratch. That would keep this a config change, not a new
   component, and is worth ruling out first.
4. Route groups: `(console)` currently owns every admin page under one
   layout. Hiring/uni need their OWN nested layout inside `(console)` that
   swaps the sidebar, the way `apps/main` nests `(jobs)` inside its root -
   confirm Next's layout nesting (a `layout.tsx` at `app/(console)/hiring/`
   composes with, not replaces, the parent `(console)/layout.tsx`) doesn't
   double-render the outer `AdminSidebar` before designing around it.
5. Permission gate stays: the module sidebar still needs to disappear (or
   redirect) for a TEAM_MEMBER with no `hiring`/`university` grant, same as
   today's collapsed tree entry does.

**Edge cases**
- Deep-linking straight to `/hiring/companies/verification` renders the
  Hiring sidebar on first paint, not the main one that then swaps - the
  pathname check runs in the same render as everything else in
  `ConsoleContent`, so there is no intermediate frame to flash.
- The "back to console" link goes to `/dashboard` on both module sidebars -
  not confirmed as the definitively-right destination with Niraj, but it's
  the same landing every sign-in already redirects to, so it was the
  obvious default rather than an open question worth blocking on.
- Command palette (`⌘K`) still reads from whichever sidebar is currently
  mounted, unchanged - inside Hiring it surfaces Hiring's 3 items and
  nothing else; back on the main console it surfaces the full tree again.
  Not deliberately redesigned, just inherited correctly from `AppSidebar`'s
  existing `primary`/`secondary` -> `commandGroups` wiring.

**Done when.** Clicking "Hiring" from the main sidebar navigates into a
Hiring-only sidebar (Overview, Companies, Verification, and nothing else
from the console's main tree); the same for University; a "back" link
returns to the main console nav; `tsc --noEmit` clean; no route regressions
(re-run the full curl sweep from ADM-8's verification).

Verified: `cd apps/admin && npx tsc --noEmit` clean, plus `packages/ui`,
`apps/main`, `apps/hiring`, `apps/uni` (the `backLink` prop touches the
shared `AppSidebar` every app renders); no unused imports across every
file listed above; all 21 console routes still 307 to `/` when signed out,
confirming the sidebar swap didn't regress the gate. **Not verified this
pass:** actually clicking through as a real SUPER_ADMIN and a restricted
TEAM_MEMBER session, same real-account limitation as ADM-1/ADM-3 - this is
the next thing to click through by hand.

---

### ADM-22 - Skeleton pass: every page gets a shape-matched loading state
- [x] **Done (2026-08-24).** The finding on opening this task was better
  than Niraj's report suggested and worse in a different way: every one of
  the 21 `loading.tsx` files already used the shared `Shimmer`/
  `ShimmerStyles` primitive from `@repo/ui/components/skeleton-kit` - none
  were bare spinners, and a first grep for `animate-spin`/`Loader2` (zero
  hits everywhere) looked like the task might already be done. It was not:
  a second pass reading each skeleton AGAINST its real page found that most
  had drifted, several badly - stale from before this session's page
  conversions (ADM-8) and dead-link removals rewrote the pages underneath
  them. Exactly the failure mode `docs/responsiveness.md` section 7 warns
  about: "a skeleton dropped into five different tabs is the wrong shape in
  four of them," except here it was one skeleton per page that had quietly
  stopped matching that one page.
- **Serves:** "on all the pages there are no skeleton" - Niraj's finding,
  though the real defect turned out to be "the skeletons exist and are
  wrong," not "the skeletons don't exist."
- **Blocked by:** ADM-21, done first for exactly the reason this task
  named - the Hiring/University overview and list pages had their module
  cards cut from 4-5 down to 2 earlier this session, and skeletoning them
  before confirming the final shape would have meant redoing the work.

**Why.** `docs/responsiveness.md` section 7, in full, is the argument here
- most importantly: "No spinners for content that has a shape," "Skeletons
match the container they replace," and "One skeleton per surface, shaped
like THAT surface" (a generic card-with-two-lines dropped into five
different tabs is the wrong shape in four of them). A `loading.tsx` that
exists but doesn't match its page is worse than an honest spinner, because
it reads as finished work when it isn't.

**Files - all 21 `app/(console)/**/loading.tsx`, every one read against its
real `page.tsx`/`*-client.tsx` pair and rewritten where it had drifted:**

- **`dashboard`** - real page has no charts and no table at all: 4 KPI
  tiles, a "Platform Overview" heading over 3 platform cards (each icon/
  title/desc + a 2x2 sub-stat grid), then a 2-up row (pending-actions list
  beside a 6-tile quick-links grid). The skeleton assumed a 2-up chart row
  and an 8-row/5-column table with pagination - neither exists on this
  page. Full rewrite.
- **`credits`** - real page has a 3-tab strip (Overview/Transactions/
  Requests) and the overview tab is a 2-column split (recent transactions
  list beside pending requests list), not a single 10-row ledger table; the
  header also has no action button. Full rewrite.
- **`credits/transactions`** - no stat row and no header button on this
  page (those live on the parent `credits` overview, not here) - the
  skeleton carried both. Removed; kept and verified the 5-column table
  shape, which was already right.
- **`credits/payments`** - same two phantom elements (stat row, header
  button) removed; column count corrected from 5 to the real 7 (User,
  Order ID, Amount, Credits, Status, Payment Method, Date). The search +
  status-filter row itself was already the right shape.
- **`credits/requests`** - real page header has a "N pending" pill, not
  stat cards; one search box, not a filter row; and request cards are
  richer (avatar, name/badge/email, amount/date meta, two full Approve/
  Reject buttons) than the generic icon-row shape the skeleton assumed.
  Full rewrite.
- **`feedback`** - filter row is search + category + status (three
  controls); the skeleton had two. Avatar is round, not a rounded-square
  icon tile. Card body enriched to match (title + badge, description line,
  meta row, status control).
- **`users`** - no stat row (removed along with the earlier "Add User"
  button this session); filter row is search + role + status (three
  controls, skeleton had two); table is 8 columns including the checkbox
  and actions columns, which the skeleton omitted entirely.
- **`analytics`** - real layout is 4 stat tiles, a full-width "User Growth"
  bar chart, then a 2-up row of "Engagement Metrics" (label/value rows, not
  a chart) and "Module Usage" (progress bars) - not a uniform 2x2 chart
  grid. Full rewrite; also the first place `Shimmer`'s prop signature
  (`className`/`delay` only, no `style`) got hit - the bar-chart mock had
  to wrap each bar in a sized `<div>` with the `Shimmer` filling it, not
  pass `style` to `Shimmer` directly.
- **`admins`** (Team) - no filter row (correct, matches the real page); 6
  columns not 5, and the real page has no pagination at all (small team,
  renders on one page) - removed the phantom pagination footer.
- **`admins/access`** - the biggest single mismatch found: this page has
  never been a table. It's a stack of per-admin cards (avatar/name/email,
  three status buttons, an 8-module x 4-level permission matrix, a Save
  button) - the skeleton assumed one wide table for the whole page. Full
  rewrite.
- **`admins/audit`** - already close (built correctly earlier this
  session); added the pagination footer it was missing and widened the row
  count from 6 to 8.
- **`admins/invitations`** - already close; added the second action icon
  (copy + revoke, skeleton only had one).
- **`admins/profile`** - assumed three identical "4-field form" sections;
  the real page is a profile-info card (not a form), an "Access
  Permissions" 2-column grid of module-pill cards, and a 3-field password
  form. Full rewrite.
- **`hiring`** and **`uni`** (overview pages) - both assumed 4 module cards
  with a 3-tag row and a footer meta line; both pages were cut to 2 module
  cards earlier this session (ADM-8's dead-link removal) with a different
  body shape (icon/title/desc + a 2-stat sub-grid, no tags). Both rewritten
  identically, mirroring each other the way the real pages do.
- **`hiring/companies`** and **`uni/universities`** - both were missing the
  "Back to Hiring/University Platform" link entirely, had the search+filter
  row and the 4-stat row in the wrong order (real pages put filters first),
  and undercounted the table at 5 columns against the real 7 (Company/
  Industry/Size/Status/Members/Joined/Actions, or the University
  equivalent). Both rewritten identically.
- **`hiring/companies/verification`** and
  **`uni/universities/verification`** - header had a phantom action button
  (real pages have none, just the back-link and title); card footer had 2
  generic buttons where the real cards have 3 named ones (Details/Reject/
  Approve) plus a submitted-date line; the detail grid was 1 column,
  should be 2x2. Both rewritten identically.
- **`system/database`** - no table on this page at all: a health-status
  card (icon/status/timestamp + a 2-column detail grid) followed by a
  9-tile, 3-column stat grid under "Database Statistics." The skeleton
  assumed a 4-stat row and a 4-column data table. Full rewrite.
- **`system/settings`** - the header's "Clear Cache" button was missing
  entirely, and the body is a flat list of 5 setting rows (title +
  description + one toggle-or-number control each), not three card
  sections each with a 3-field form and its own Save button. Full rewrite.

**Not part of this pass, by design:** sheets and dialogs are never
skeletoned (they open on demand against already-loaded data, so there is
no navigation wait for them to cover) - matches the original task's own
**Steps** note.

**Done when.** Every route's `loading.tsx` shows a skeleton whose header
shape, stat-tile count, filter-row control count and table/list shape
match the real page - no layout jump when data lands, no bare spinner
anywhere in `apps/admin`. Verified: `cd apps/admin && npx tsc --noEmit`
clean (the `Shimmer`-with-`style` mistake in the analytics skeleton was
caught here, not by eye); no unused imports in any of the 21 files; no
em dashes; all 21 console routes still 307 to `/` when signed out. **Not
verified this pass:** actually opening each route on a throttled
connection to watch the skeleton render - this was a markup-and-shape
correctness pass (reading each skeleton against its real page's JSX), the
same honest limit the responsiveness doc names for itself: "not a device
test."

---

### ADM-23 - Full responsiveness pass against `docs/responsiveness.md`
- [x] **Status:** Done (2026-08-24)
- **Serves:** "we need to fix many things like responsiveness as well" -
  the whole of `docs/responsiveness.md`, which Niraj has been keeping since
  before this session and asked to be used as the reference for every
  future responsiveness fix in this app, not just a one-time read.
- **Blocked by:** ADM-21 (Hiring/University shells) and, loosely, ADM-22
  (skeletons) - section 7 of the doc IS a responsiveness rule, so doing the
  skeleton pass and the general pass as two separate sweeps of the same
  files is wasted motion. Do ADM-22 and ADM-23 together per module, not as
  two full passes of the app.

**Why.** The doc is 875 lines distilled from real, previously-shipped
defects in sibling ShipItHQ apps - height bounds, horizontal overflow,
table/list tap targets, header/toolbar overflow, stat-tile budgets,
sheet/dialog sizing, and the loading-state rules ADM-22 already covers. None
of `apps/admin`'s pages have been checked against it; every one of them was
either freshly converted (ADM-8) or never audited to begin with.

**Files.** All of `apps/admin` - see the doc's own "Scan by FILE COUNT, not
by module name" warning: a scan that only walks `app/(console)/**` misses
the sign-in screen, the join flow, and every shared component under
`components/`, and those are exactly the surfaces (first screen a user
sees, a flow handling account creation, a shell every screen inherits)
where a miss is most expensive.

**Steps.** Follow the doc's own "Running a module pass" section exactly,
one module at a time (order by phone traffic, not by how broken a module
looks):
1. Enumerate every surface in the module - every page, every sheet/dialog,
   every tab, and the empty/loading/populated/error state of each.
2. Walk sections 1-9 of the doc on each, at 360x640.
3. Fix at the widest scope the defect allows - a shared primitive
   (`AppSidebar`, `Sheet`, `Select`, `Card`) gets fixed once, not per call
   site. Today's `AppSidebar` profile-popover fix is the model: one change
   in `packages/ui`, four apps corrected.
4. Typecheck once per module, not once per file.
5. Report what was NOT fixed and why, per the doc's own rule - a silently
   skipped surface is the one failure mode worse than a slow pass.

**Edge cases.** All of section 10 ("Traps that cost real time") applies
directly to whoever does this work - re-run the trap check after every
batch of edits, not once at the end, per the doc's own account of how often
it's been sprung mid-fix.

**Done when.** Every module in `apps/admin` has been walked against
sections 1-9 at 360x640, findings fixed at their widest correct scope, and
the "what was not fixed" list from step 5 is empty or explicitly justified
per surface - matching the doc's own closing standard: "a responsiveness
pass is not a device test," so this proves the markup is correct, not that
it was touched on real hardware.

**Files - what actually got found and fixed.**

*Section 1 (height/scrolling bounds).*
- `app/(console)/_components/layout-client.tsx` - the shell's own height
  bounds were pinned to `100vh`, which on mobile Safari/Chrome equals the
  viewport with browser chrome collapsed, so the shell was taller than the
  actually-visible area whenever chrome was showing. Fixed at three spots:
  the outer wrapper (`h-screen` -> `h-dvh`), `<main>`'s
  `h-[calc(100vh-1.5rem)]` -> `h-[calc(100dvh-1.5rem)]`, and the
  `--page-h` custom property's own `calc(100vh - 1.5rem)` ->
  `calc(100dvh - 1.5rem)`. Deliberately left unchanged: the `100vh`
  *fallback* in `packages/ui/src/styles/globals.css`'s `[data-app-page]`
  rule - its own comment states the fallback is intentionally a no-op
  outside pages that set the variable, not a copy of this same bug.
  `AppSidebar`'s desktop-only `<aside>` `h-[calc(100vh-1rem)]` was also
  left as-is - it's `hidden lg:flex`, and browser chrome doesn't collapse
  on desktop, so `vh`/`dvh` render identically there.
- `ScrollArea`'s `reflow` prop (already in use on the shell's main content
  area) and `AppSidebar`'s own scroll handling were confirmed already
  correct - no change needed.

*Section 2 (horizontal overflow, truncate/min-w-0 pairing).*
- All 8 tables in the app were confirmed already wrapped in a horizontally
  scrolling container - no page-level horizontal scroll risk from tables.
- Fixed the truncate-without-min-w-0 trap (a `<p>`/`<span>` marked
  `truncate` sitting inside a *nested* flex row whose own min-width isn't
  bounded, so an ancestor's `min-w-0` doesn't reach it) in:
  `admins/invitations/_components/invitations-client.tsx` (invitee
  name row), `hiring/companies/verification/_components/verification-client.tsx`
  and `uni/universities/verification/_components/verification-client.tsx`
  (website link, headquarters/size rows).
- Applied the same `min-w-0`/`truncate`/`shrink-0` triage to five more
  unconstrained label+value rows that hadn't been caught before: the
  dashboard's `PendingAction` row, credits-client's recent-transaction and
  pending-request rows, and the hiring/university overview pages'
  pending-verifications banners - all of these pair a free-text label
  against a fixed-width sibling (an amount, a "Review" link) with no
  truncate, so a long user name/description could force the row to
  overflow horizontally.

*Section 3 (tables/lists).*
- Two data tables (`admins/_components/admins-client.tsx`,
  `users/_components/users-client.tsx`) had a trailing actions `<th>`
  rendered completely empty (`<th ...></th>`) - no accessible name for
  screen readers. Both given `<span className="sr-only">Actions</span>`.
- No column-hiding added for narrow viewports - every table already
  scrolls horizontally inside its own wrapper, which the doc treats as an
  accepted pattern for data-dense admin tables, not a defect to fix on top
  of.

*Section 4 (headers/toolbars, button-row overflow at 360px).*
- `hiring/companies/_components/companies-client.tsx` and
  `uni/universities/_components/universities-client.tsx` both had a list
  header (title block + "Pending (N)" + "Export" buttons) that never
  stacked - `flex items-center justify-between` unconditionally. Both
  changed to `flex flex-col gap-4 sm:flex-row sm:items-center
  sm:justify-between`.
- Seven pagination footers (`admins/audit`, `uni/universities`,
  `hiring/companies`, `credits/payments`, `credits/transactions`,
  `credits/requests`, `users`, `feedback`) got `flex-wrap` + `gap-3` added
  - several pair "Page X of Y" text against full-text `Previous`/`Next`
  buttons (not icon-only), which is the doc's named button-row-overflow
  shape; wrapping instead of forcing a single line stops a horizontal
  overflow if the combined width ever exceeds a 360px viewport.
  Reviewed and left alone: `dashboard-client.tsx`'s `QuickStat` icon+badge
  row and `analytics-client.tsx`'s label/value metric rows - both are
  short, fixed-width content well inside any width budget.
- The two verification pages' per-card action row (`Details` / `Reject`
  / `Approve`, three full-text+icon buttons against a "Submitted {date}"
  label) was a genuine overflow risk at 360px - three buttons plus a date
  string don't fit 328px of usable width. Changed to `flex flex-col gap-3
  ... sm:flex-row sm:items-center sm:justify-between` with `flex-wrap` on
  the button group itself as a second line of defense.

*Section 5 (stat cards, sr-only labels below `sm`).* Not applicable -
every stat-tile grid in this app (`dashboard-client.tsx`,
`database-client.tsx`, the hiring/uni overview pages) stacks icon, value
and label vertically inside each card rather than laying them out in a
single horizontal row, so there's no narrow-viewport case where the label
needs to hide; text wraps safely instead.

*Section 6 (sheets/dialogs).* Found and fixed a real shared-primitive bug:
`packages/ui/src/components/ui/dialog.tsx`'s `DialogContent` used `w-full
max-w-lg` with `position: fixed` and no side margin - `w-full` on a fixed
element resolves against the full viewport, so on any screen narrower than
`max-w-lg` every dialog in every app touched both screen edges exactly,
with the inner `p-6` as its only breathing room. Changed to
`w-[calc(100%-2rem)] max-w-lg`, fixed once at the primitive (per the
doc's "fix at the definition" rule) so all four apps' dialogs get a
consistent margin without touching a single call site.
Also found the inverse of the doc's own named trap at two call sites -
`SheetContent side="right" className="max-w-md w-full"` in
`feedback/_components/feedback-client.tsx` and
`users/_components/users-client.tsx` - the `Sheet` primitive's own default
(`w-3/4 ... sm:max-w-sm`) already handles mobile margin correctly, but the
call-site override replaced `w-3/4` with an unmargined `w-full` and paired
it with an *unprefixed* `max-w-md`, which only caps width above 384px -
below that the sheet went edge-to-edge exactly like the dialog bug. Fixed
by dropping the override down to `className="sm:max-w-md"`, which keeps
the primitive's default mobile width/margin and only widens the desktop
cap.

*Section 8 (charts).* Not applicable - admin's only chart
(`analytics-client.tsx`'s module-usage bars) is a hand-rolled `<div>` bar,
not a recharts instance, so the doc's recharts-specific guidance doesn't
apply; no overflow risk found in the hand-rolled version (bars are
percentage-widths inside a bounded container).

*Section 10 (traps).* Re-checked after every batch of edits in this pass,
not just once at the end, per the doc's own instruction - no JSX
comment/string delimiter mistakes found; the one real mistake this whole
ADM-21/22/23 arc produced (`Shimmer` doesn't accept a `style` prop) was
caught and fixed during ADM-22, not this pass.

**Verified:** `cd apps/admin && npx tsc --noEmit` clean after every batch
of edits, including after the shared `dialog.tsx` change; `cd packages/ui
&& npx tsc --noEmit` clean after the `dialog.tsx` change; `grep -rn -e
"—" -e "–"` clean across `app/(console)` and `components/navigation`; dev
server restarted and all 21 protected console routes still redirect 307
to `/` when signed out, sign-in page still 200, no runtime errors in the
server log across the sweep.

**Not verified this pass:** actually opening each fixed surface at
360x640 in a real or emulated device - this was, like ADM-22, a
markup-and-shape correctness pass reasoned through the doc's own rules
rather than a device test, which the doc itself says a pass like this
cannot substitute for. Nothing was found or fixed in this pass that
requires a signed-in account to reach (every route in this app gates
behind auth), so the deferred real-account click-through testing flagged
on ADM-21 covers this pass too.
