# apps/admin - ShipItHQ Admin Console

The internal console the ShipItHQ team runs the platform from: users, credit
balances, feedback, hiring/university verification queues, platform analytics,
and the admin team itself.

## Running it

```bash
pnpm dev          # http://localhost:6002
```

Copy `.env.example` to `.env` first. The `DATABASE_URL` and auth secrets must
be byte-identical to the other apps in this repo (`@repo/auth` shares one
session cookie across every `*.shipithq.com` app) - copy them from
`apps/main/.env` rather than generating new ones.

## Access model

Two roles: **Super Admin** (`admin_role = SUPER_ADMIN`, full access to
everything) and **Team Member** (every other `admin_role` value, access
determined entirely by the per-module grants on their `admin_access.permissions`
jsonb). `lib/navigation.ts` is the single source of truth for both the sidebar
nav and the permission model - see `getEffectivePermissions()` and
`hasPermission()` there.

There is no sign-up. The only way to become an admin is an invitation:

1. A Super Admin creates one from **Admins → Invitations** (or
   `createAdminInvitation()` in `actions/admin.action.ts`).
2. The invitee opens `/join/<code>`, sets their own password, and is granted
   `admin_access` with `status: ACTIVE` and whatever role/permissions the
   invitation specified - `actions/invitations.action.ts`, inside one
   transaction (`withTransaction`, not `db.transaction(` - the `neon-http`
   driver this app otherwise uses has no transaction support).
3. A brand-new Team Member starts with `permissions: {}` - no modules granted.
   Grant them from **Admins → Access Control**.

The console is gated in two layers: `middleware.ts` turns away any request
with no session cookie (cheap, but "has a session" is not "is an admin" - the
session cookie is shared with every other ShipItHQ app); the real check is
`app/(console)/layout.tsx`, a server component that resolves `admin_access`
and redirects to `/` unless `status === "ACTIVE"`. Every server action that
isn't `getInvitationByCode` / `acceptAdminInvitation` also opens with
`checkAdminAccess()` (or, in `system.action.ts`, `checkAdminAccess(module,
level)` / `requireAnyActiveAdmin()`) - the layout gates pages, this gates the
actions those pages call, and neither one is a substitute for the other.

## Shell contract

The app shell (`app/(console)/_components/layout-client.tsx`) floats three
cards on a neutral backdrop: the sidebar, the page, and the AI rail (opens from
the "Ask AI" button, docks as a real column on `lg+`, becomes a bottom sheet
below it). It publishes `--page-h` on the page card
(`calc(100vh - 1.5rem)`), and a rule in
`packages/ui/src/styles/globals.css` retargets `h-screen` / `min-h-screen`
inside `[data-app-page]` at it - a full-height page under `app/(console)`
should say `h-screen` and nothing else, never its own `calc()`.

`lib/navigation.ts` is the only file that defines the sidebar's contents.
Adding a route without adding it there is invisible; adding it there without
building the route is a dead link - `plan/admin/tasks.md` ADM-3 exists because
this app used to have five different, disagreeing copies of this list.

## Deploying

```bash
pnpm release      # build + wrangler deploy --secrets-file .env.production
```

Not `pnpm deploy` - that's a built-in pnpm command that does something else
entirely and fails with `ERR_PNPM_NOTHING_TO_DEPLOY`. Copy
`.env.production.example` to `.env.production` (gitignored) first;
`--secrets-file` is additive, so a key already live on the Worker but omitted
from the file is left alone - but a key present with an *empty* value
overwrites it with an empty string. Delete lines you don't have a value for
yet rather than leaving them blank.

## Where things are

- `plan/admin/` - the working plan for this app: what "done" means
  (`overview.md`) and the numbered tasks getting there (`tasks.md`). Read the
  tasks before making a structural change here.
- `lib/navigation.ts` - nav + permission model (see Access model, above).
- `lib/ai/`, `components/ai/`, `stores/ai-panel.store.ts` - the console
  assistant. Ported from `apps/main`'s equivalent, cut down to read-only
  tools scoped to the calling admin's own permissions - see the ADM-19 note
  in `plan/admin/tasks.md` for what didn't come along and why.
- `actions/` - one file per domain (`admin.action.ts`, `invitations.action.ts`,
  `system.action.ts`, `main/*.action.ts`, `hiring/*.action.ts`, `uni/*.action.ts`).
  Every exported function returns `AdminResponse<T>` from `types/admin.ts` -
  a discriminated union, so `if (!result.success) return result.error` narrows
  correctly and a call site can't read `.data` without checking `.success`
  first.
