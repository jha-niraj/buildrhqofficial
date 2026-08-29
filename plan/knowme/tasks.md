# KnowMe - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| KM-1 | Deleting a profile deletes its vectors | 2 | done (2026-08-27) |
| KM-2 | Put KnowMe back in the nav | - | done (2026-08-27) |
| KM-3 | Verify the loop end to end with a real profile | 1 | BLOCKED - no Cloudflare access (2026-08-29) |
| KM-4 | Recruiter verification on the public chat | 3 | decided (2026-08-28) |
| KM-5 | The remaining platform handlers | 1 | done (2026-08-28) |
| KM-6 | One shared user-knowledge source | - | deferred (2026-08-27) |
| KM-7 | /knowme crashed on a neon connection | - | done (2026-08-28) |
| KM-8 | One chat component, in the assistant's language | 1 | done (2026-08-29) |
| KM-9 | The dashboard tells the truth about the profile | 1 | done (2026-08-29) |
| KM-10 | Analytics: stop redirecting, and fix the page | 4 | done (2026-08-29) |
| KM-11 | Local dev cannot reach Vectorize | - | done (2026-08-29) |
| KM-12 | The privacy picker does not pick anything | 5 | done (2026-08-29) |
| KM-13 | The public link was not public | 1, 3 | done (2026-08-29) |

---

## KM-1 - Deleting a profile deletes its vectors

**Status:** done (2026-08-27)

`deleteKnowMeProfile` cascaded the `know_me_*` rows and left the embedded copy of
the user's personal data in Upstash - which is the store the PUBLIC chat endpoint
queries. "Delete my profile" therefore left the data both present and answerable
by strangers. It was a `TODO`, with the correct call already written and
commented out one line below.

**Edge case that decided the implementation.** Vectors are deleted BEFORE the
rows, because `profile.id` is the namespace key. Dropping the row first and then
failing would strand a namespace whose key nothing records any more. Failing in
this order leaves the profile intact and retryable, which is the recoverable
direction.

---

## KM-2 - Put KnowMe back in the nav

**Status:** done (2026-08-27)

Added as a primary item with `Analytics` and `Settings` children. `pnpm
check-nav` passes: all 22 paths resolve literally.

**What this also fixed.** KnowMe was "parked (code kept, hidden from nav)" while
`home/_components/feature-discovery.tsx:89` went on linking to `/knowme` from the
home page. It was unreachable from the sidebar and advertised on the first screen
a user sees. The nav comment and the home page now agree.

---

## KM-3 - Verify the loop end to end

**Status:** BLOCKED - no Cloudflare account access (2026-08-29)
**Serves:** definition-of-done 1

**Why.** 13 tables, **0 rows**. Every code path in this module is unexercised.
"It is written" and "it works" are different claims and only the first is
currently supported.

**Steps.** One real profile: initialize, add personal data, connect a platform,
generate embeddings, then ask it something from a signed-out browser and from the
API with a key.

**Edge cases**
- **Embedding generation writes a `know_me_embedding_job` row** - check it reaches
  a terminal state rather than sitting at pending, the same failure mode
  `background_job` had.
- **Ask a question with no relevant chunk.** The answer to "what is their
  favourite colour" must be "they have not said", not a confident invention -
  this is a profile of a real person and a hallucination here is defamatory.
- **Ask from a signed-out browser.** The public path must not silently pick up
  the owner's own session and appear to work.

**Done when** a profile answers a real question from a signed-out browser, and
the analytics page shows that question.

**STILL BLOCKED 2026-08-29, and now for a different reason.**

Niraj, asked directly whether to create the index: *"We don't have the cloudflare
access for now so mention this in file and we will do these later."*

So this is **waiting on an account, not on a decision**. Everything on the code
side of it is done and verified: KM-11 fixed the transport (local dev's binding
stub was shadowing the REST fallback), and KM-9 means the dashboard now reports
the failure honestly instead of claiming to be Active. What remains is one
person with Cloudflare access running three commands.

`npx wrangler vectorize list` on 2026-08-29 answers *"You haven't created any
indexes on this account"*, and `vectorize info shipithq-knowme` returns
`vectorize.index.not_found`.

**Until it exists**, and this is the whole visible consequence:

- `know_me_profile.status` stays `ERROR`, and the dashboard says so.
- `know_me_embedding` stays at 0 rows, so the assistant answers every question
  with "they have not said" - which is correct behaviour, not a second bug.
- Both `know_me_embedding_job` rows are `FAILED` with
  `Failed to upsert vectors batch: Binding VECTORIZE needs to be run remotely`.
- Everything else in the module - the chat, analytics, privacy, the public link -
  works and has been verified without it.

**To unblock** (needs Cloudflare account access; also in `.env.example` and
`wrangler.jsonc`):

    npx wrangler vectorize create shipithq-knowme --dimensions=1024 --metric=cosine
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=profileId --type=string
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=sourceType --type=string

Then, for local dev only, set `CLOUDFLARE_ACCOUNT_ID` and a
`CLOUDFLARE_API_TOKEN` with `Vectorize:Edit` in `apps/main/.env` - KM-11's
fallback needs them, because `next dev` has no Vectorize emulation. Production
needs neither; the binding is free on Workers.

Afterwards: press "Update knowledge base" on /knowme and check that
**Chunks indexed** leaves 0 and the status leaves ERROR. That is KM-3's
"Done when" and it cannot be checked before then.

---

**Originally blocked 2026-08-28, on infrastructure rather than code.** The vector store was
migrated from Upstash to Cloudflare Vectorize, and the index does not exist yet.
Locally there is no binding either (`next dev` is not a Worker), and the REST
fallback's `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` are unset, so
`generateProfileEmbeddings` cannot write a single vector. Every step after
"add personal data" is unreachable.

Unblocks the moment these are run (they are also in `.env.example`):

    npx wrangler vectorize create shipithq-knowme --dimensions=1024 --metric=cosine
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=profileId --type=string
    npx wrangler vectorize create-metadata-index shipithq-knowme --property-name=sourceType --type=string

The metadata index is not optional. Tenant isolation is a `profileId` filter, so
without it every query returns empty rather than erroring - which would look
exactly like "the loop does not work".

---

## KM-4 - Recruiter verification

**Status:** decided, 2026-08-28 (a public persona is public)
**Serves:** definition-of-done 3

`chat.action.ts:83` was `// TODO: Check if user is a verified recruiter`. Today
anyone can ask anything of any active profile. Decide whether that is the product
(a public persona is public) or whether asking requires an identified caller -
this is a product decision, not a bug, and it changes what the module IS.

**DECIDED 2026-08-28, Niraj: a public persona is public.** Consistent with the
earlier call to keep KnowMe as an ask-anything API surface rather than a gated
one.

What already protects it, and is enough:

- `allowAnonymous` and `allowRegisteredUsers` on the owner's privacy settings,
  both checked before a session opens.
- A per-session rate limit, default 20 questions with a one-hour reset.

Why the recruiter gate is not built: this product has **no recruiter identity** -
no role, no verification flow, no way to become one. `RECRUITER` is therefore a
viewer type nothing can produce, and a gate nobody can pass is not a gate.
`know_me_privacy_settings.allow_recruiters` stays dormant for the same reason;
it is not surfaced in the settings UI and is read by nothing, so it promises the
user nothing. The TODO is replaced with the reasoning so the next reader does not
"finish" it.

---

## KM-5 - The remaining platform handlers

**Status:** done, 2026-08-28 (stopped offering what has no handler)

`data.action.ts:484` was `// TODO: Add other platform handlers`. The settings
screen offers to connect platforms; one is implemented. Either build the rest or
stop offering them.

**DONE 2026-08-28: stopped offering them.** The onboarding wizard advertised
GitHub, LeetCode, StackOverflow and LinkedIn. Only GitHub has a handler; the
other three hit a silent `break` in the sync switch, so connecting one reported
success, wrote zero external data, and left the user unable to tell "synced,
found nothing" from "never ran". The list now shows GitHub alone, and the switch
has a `default` that THROWS with the platform name instead of falling through.

**The reason LinkedIn was not simply implemented is worth recording.**
`utils/truefolio/linkedin.ts` exports `fetchLinkedInData(username)`, has zero
callers, and looks exactly like the missing handler. It returns **mock data** - a
hardcoded fake profile, labelled as such in its own comment. Wiring it would have
filled a real person's public, strangers-can-query-it persona with invented
employment history, which is the defamation risk KM-3's own edge cases warn
about. The real LinkedIn path in this repo is the Exa-backed scrape inside the
`resume_import` worker job; that is what to reuse if LinkedIn is ever connected
here.

---

## KM-6 - One shared user-knowledge source

**Status:** blocked on KM-3, which is blocked on the Vectorize index

The real version of "merge KnowMe with the AI chat" - see the decision in
`overview.md`. Merge the KNOWLEDGE, keep the two chats. `lib/resume/primary.ts`
is the pattern: one resolver, many consumers, each with its own permissions.

**Blocked on** KM-3, because there is no point unifying a source that has never
been shown to work.

## KM-7 - /knowme crashed with a neon connection error - DONE 2026-08-28

**Symptom.** Every visit to `/knowme` died on a runtime error:

```
No database connection string was provided to `neon()`.
Perhaps an environment variable has not been set?
    packages/db/src/client.ts (34:17) @ module evaluation
```

The stack read, innermost last: `client.ts` <- `@repo/db/index.ts` <-
`utils/knowme/vector-db.ts` <- `utils/knowme/index.ts` <-
`knowme-dashboard.tsx`.

**Cause.** `knowme-dashboard.tsx` is `"use client"` and needed exactly one thing
from the utils: `formatRelativeDate`, a pure date formatter. It imported it from
the `@/utils/knowme` barrel.

A barrel re-export is a real import. The barrel re-exports `vector-db.ts`, which
imports `db` from `@repo/db` as a value, so pulling one formatter through it
dragged the neon client into the browser bundle - where it evaluates at module
scope, finds no `DATABASE_URL`, and throws before the page renders.

This is why the error appeared only now. `vector-db.ts` gained its `@repo/db`
import when it moved to Vectorize and `deleteNamespace` began reading vector ids
out of Postgres; the barrel import in the dashboard had been harmless until then.

**Fix.** A new `utils/knowme/format.ts` holding only pure functions, imported
directly by the client component.

Moving the import one level deeper to `helpers.ts` would NOT have fixed it -
that module imports `createHash`/`randomBytes` from `node:crypto` for API-key
hashing, so a client importing it drags Node's crypto in instead. The new module
has no server dependency of any kind. `helpers.ts` re-exports from it, so every
existing server-side import is unchanged.

**Scope.** One file, not the whole module. A sweep of every `"use client"`
component against every util that imports the `db` value (`utils/referral.ts`,
`utils/knowme/vector-db.ts`, `lib/resume/primary.ts`,
`lib/github/github-service.ts`), directly or through a barrel, found no other
crossing.

**Done when.** `/knowme` and `/knowme/settings` render with no neon error and no
runtime overlay. Verified in the browser. (`/knowme/analytics` and
`/knowme/onboarding` both redirect to `/knowme` for this account, which is
existing behaviour and unrelated.)

---

## KM-8 - One chat component, in the assistant's design language

**Status:** done (2026-08-29)
**Serves:** definition-of-done 1

**Why.** Niraj, 2026-08-29: *"the ui of this knowme chat is really bad and give
this the whole space below as well and make the ui look like the aichat"* - while
agreeing the two chats stay separate products (`overview.md` says why).

There are TWO KnowMe chats and they are hand-written copies of each other: the
owner's "Test Your AI" box on `/knowme` and the visitor's box on
`/knowme/[username]`. Both are a fixed `h-[400px]` scroller inside a card on a
page that scrolls anyway, so the conversation gets 400px no matter how tall the
window is and the page grows a second scrollbar underneath it. Both render the
assistant's reply as a bubble with plain `whitespace-pre-wrap` text, so every
list, heading and code block the model returns arrives as literal markdown
characters.

The rail (`components/ai/ai-panel.tsx`) already solved all of this: a
`min-h-0 flex-1` ScrollArea, the assistant labelled rather than bubbled,
`MarkdownRenderer`, a bordered composer, `.sh-thinking` instead of a spinner.

**Files**
- `app/(main)/knowme/_components/knowme-chat.tsx` (new) - the shared surface
- `app/(main)/knowme/_components/knowme-dashboard.tsx`
- `app/(main)/knowme/[username]/_components/public-chat-interface.tsx`
- `app/(main)/knowme/page.tsx`, `[username]/page.tsx` - full-height shells
- the three skeletons, which must match the new layout

**Steps**
1. Extract `KnowMeChat` taking `messages`, `isLoading`, `onSend`, `suggestions`,
   `emptyTitle`/`emptyHint`, and optional `onFeedback` / footer.
2. Rebuild both callers on it.
3. Give `/knowme` a `h-screen` flex column so the chat gets the space below the
   header, and the sidebar column scrolls on its own.

**Edge cases**
- **`h-screen`, not `h-[100vh]`.** The shell retargets it at `--page-h`; a raw
  viewport unit overflows the page card by 24px on every page under `(main)`.
- **`min-h-0` on the flex child.** A flex item's default `min-height: auto`
  refuses to shrink below its content, so the scroller would push the composer
  off-screen instead of scrolling.
- **Never `max-h` on a ScrollArea root** - the viewport is `h-full`, which
  against an auto-height parent resolves to `auto` and clips instead of
  scrolling. (Learned on the credits panel.)
- **The two chats must still not look identical to the rail's own header.** Same
  language, different mark and title, or the owner cannot tell which AI they are
  talking to - and one of them answers as a stranger would see it.

**Done when** both chats fill the height available, render markdown, and the page
under them has exactly one scrollbar.

---

## KM-9 - The dashboard tells the truth about the profile

**Status:** done (2026-08-29)
**Serves:** definition-of-done 1

**Why.** `knowme-dashboard.tsx` renders `<Badge>Active</Badge>` as a literal
string in the Status card. The row in the database right now says **`ERROR`**,
and the reason is recorded two tables away:

    know_me_embedding_job.result
      -> "Failed to upsert vectors batch: Binding VECTORIZE needs to be run remotely"

So the one screen whose job is to report the assistant's health states the
opposite of the truth, and the owner has no way to reach the error. `0`
questions and `0` visitors sit beside the word "Active", which reads as "nobody
came" rather than "it never worked".

**Files** `knowme-dashboard.tsx`, `actions/(main)/knowme/profile.action.ts`
(surface the last job's error), `types/knowme`.

**Steps** Show the real `profile.status`. When it is `ERROR` or `PROCESSING`,
say what happened, when, and offer the retry that already exists
(`triggerManualUpdate`).

**Edge cases**
- The error string is operator-facing (`Binding VECTORIZE...`). Show a plain
  sentence and keep the raw text as detail, not as the headline.
- `PROCESSING` is not a failure - it must not read as one.

**Done when** a profile in `ERROR` says so on the dashboard, with its reason.

---

## KM-10 - Analytics: stop redirecting, and fix the page

**Status:** done (2026-08-29)
**Serves:** definition-of-done 4

**Why.** `analytics/page.tsx` does `if (status !== 'ACTIVE') redirect('/knowme')`.
The profile is `ERROR`, so **every visit to `/knowme/analytics` silently bounces
back to the dashboard** - the nav has a link that appears to do nothing. The
action behind it, `getKnowMeAnalytics`, has no such restriction and answers fine.

The page itself also has real defects, not only taste:
- `categoryColors` uses `bg-pink-500`, `bg-red-500`, `bg-slate-500`, `bg-gray-500`
  against a monochrome palette.
- `StatCard` takes `color: "blue" | "purple" | "emerald" | "amber"` and maps all
  four to the SAME neutral classes - a prop that has been dead since the palette
  change and still dictates four call sites.
- The daily-activity tooltip is `absolute` with no positioned ancestor, so it
  anchors to whatever is positioned further up the tree.
- `maxQuestions` is recomputed inside the map, once per bar, over the full array
  while the chart renders only the last 30 - so the tallest bar can be short.
- A private `formatRelativeTime` duplicates `utils/knowme/format.ts`.
- The chart has no axis, no dates, and no total.

**Steps** Render the page for any status with a banner when it is not live; drop
the dead prop; one palette; fix the chart's scale, labels and tooltip; reuse the
shared formatter.

**Edge cases**
- **Zero everywhere is the normal state today.** Empty states must say "nobody
  has asked yet", never render as a broken chart.
- Trend percentages divide by a previous period that is usually 0 - check the
  guard before trusting the arrow.

**Done when** `/knowme/analytics` renders instead of redirecting, with every
number 0 and no chart artefacts.

---

## KM-11 - Local dev cannot reach Vectorize, and silently cannot

**Status:** done (2026-08-29)
**Serves:** unblocks KM-3

**Why.** `vector-db.ts` has two transports: the Workers binding, and a REST
fallback "because `next dev` does not run inside a Worker". The fallback is
never reached. `next dev` through opennext DOES expose a `VECTORIZE` binding -
a local stub that satisfies the duck-type (`typeof binding.query === "function"`)
and then throws `Binding VECTORIZE needs to be run remotely` on every call.

That is the exact error in both failed embedding jobs. The REST path, the
`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` variables and the paragraph in
`.env.example` explaining them are all dead code as written.

**Steps** Catch the remote-only failure and fall through to REST, and say which
transport was used when both are unavailable.

**Edge cases**
- Do not fall back on a genuine Vectorize error (a 400, a bad filter) - only on
  "this binding cannot run here", or a real failure gets retried as a REST call
  and fails twice with a worse message.
- The fallback still needs credentials. With none, the message must name the two
  variables rather than repeat the wrangler error.

**Done when** with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` set,
`generateProfileEmbeddings` writes vectors from `next dev`.

---

## KM-12 - The privacy picker does not pick anything

**Status:** done (2026-08-29)
**Serves:** definition-of-done 5

**Why.** Onboarding and settings both offer four choices - *Anyone with the
link*, *Only logged-in users*, *Only verified recruiters*, *Private (just for
me)* - and write the answer to `know_me_profile.privacy`.

**Nothing reads that column.** The only gate on the public page is:

    if (profile.status !== "ACTIVE" || !profile.isPublic) -> "Profile is not public"

and `isPublic` is set by the wizard as `selectedPrivacy !== "PRIVATE"`. So three
of the four options are the same option. A user who chooses *Only verified
recruiters*, believing they have restricted their persona to vetted employers,
gets a page any anonymous stranger can open and question - which is the precise
failure definition-of-done 5 exists to prevent, on the one surface that is
public by design.

`RECRUITERS` is worse than merely unenforced. KM-4 established that this product
has no recruiter identity: no role, no verification, no way to become one.
`RECRUITER` is a viewer type nothing can produce, so the option can only ever
mean either "everyone" (what it does today) or "nobody" (what it would mean if
enforced literally). Neither is what the label promises.

**Files** `actions/(main)/knowme/profile.action.ts`,
`actions/(main)/knowme/chat.action.ts`, `onboarding-wizard.tsx`,
`knowme-settings.tsx`.

**Steps**
1. Enforce `privacy` where access is decided - loading the page AND opening a
   chat session, so the two cannot disagree.
2. Derive `isPublic` from `privacy` in `updateKnowMeProfile` instead of taking
   it as a separate argument that can contradict it.
3. Drop `RECRUITERS` from both pickers, the way KM-5 dropped the platforms with
   no handler.

**Edge cases**
- **The owner must always reach their own profile**, whatever the setting - the
  dashboard's public preview is how they check it.
- **Rows already set to `RECRUITERS`** must not become unreachable. Treat the
  stored value as `REGISTERED`: it is the nearest honest reading of "not open to
  anonymous strangers", and silently hiding a live profile is the worse error.
- Denying the page and denying the chat must give the SAME answer, or a visitor
  reads the header and then cannot ask anything.

**Done when** a signed-out visitor cannot open a `REGISTERED` profile, and the
owner always can.

---

## KM-13 - The public link was not public

**Status:** done (2026-08-29)
**Serves:** definition-of-done 1 and 3

**Why.** Niraj, 2026-08-29, opening his own KnowMe link in a private window:
*"this page when I open via local as well is auth guarded."*

Three separate defects met on one screen, and each on its own would have made
the module's whole purpose - a link you hand to a stranger - not work.

### 1. The link asked for an account

`/knowme/<username>` was not in the middleware's public list, so CR-10's
deny-by-default rule redirected every signed-out visitor to `/signin`. The
dashboard was telling the owner "anyone with this link can ask about you, no
account needed" beside a URL that required one.

It could not simply be added to `PUBLIC_PREFIXES`: `/knowme/` as a prefix would
also have opened the owner's own `/knowme/analytics` and `/knowme/settings` to
the world. The check is therefore exactly two segments, with the owner's
segments named:

    function isPublicKnowMeProfile(pathname) -> segments.length === 2
                                                && segments[0] === 'knowme'
                                                && !KNOWME_OWNER_SEGMENTS.has(segments[1])

**The maintenance hazard is written beside it:** a new page at
`app/(main)/knowme/<segment>/` that is not added to `KNOWME_OWNER_SEGMENTS`
becomes world-readable. Middleware runs on the edge and cannot read the
filesystem, so the set cannot be derived.

### 2. Then it handed strangers the whole application

Making the route public revealed why it had been guarded. The page lived under
`(main)`, so a signed-out visitor got the full shell: the sidebar (Home,
Practice, Projects, Mock Interview, Pathfinder, AI Tools, Jobs, Purchase), a
"0 credits" counter, a "Sign In" button, and the **AI rail** - which is the
owner's private assistant, not the public one.

Every one of those links bounces to `/signin`. So the page advertised an
application the viewer could not use, wrapped around the one thing they came
for. Hiding the sidebar when signed out would have been the wrong fix: the
`(main)` shell exists to hold a session's chrome, and this visitor has no
session. The route moved to a new `app/(public)/` group with a layout that
paints a background and nothing else.

The visitor-facing copy follows from the same reasoning: "Back to profile" and
"Contact them directly" both point at `/profile/[username]`, which IS still
guarded, so they render only when the viewer is signed in. An anonymous visitor
gets the ShipItHQ mark and a "Make your own" link instead.

### 3. And the 404 was the wrong 404

An unpublished profile fell through to the app's generic not-found - a cartoon
caveman, *"Look like you're lost"*, and a "Go to Home" button into an app the
visitor has no account for. The usual reason this link fails is not a typo; it
is that the owner has not published yet.

`app/(public)/knowme/[username]/not-found.tsx` says that instead. It
deliberately does NOT distinguish "no such user" from "private": telling an
anonymous visitor that a profile exists but is private confirms an account at
that username, which is the thing the owner asked not to share.

### Also fixed here: the link itself was built from an unset variable

`NEXT_PUBLIC_APP_URL` is not defined in this repo. Five call sites interpolated
it anyway, so the dashboard fell back to a hardcoded `https://shipithq.com`
(wrong on localhost, wrong on every preview) and the API docs, the chat CTA and
the v1 route each rendered the literal string `undefined/knowme/alice`. All five
now go through `knowMeProfileUrl()` in `lib/urls.ts`, on
`NEXT_PUBLIC_BASE_URL` - the variable this app actually sets, and the convention
CLAUDE.md already required.

**Verified**, signed out, against a live profile: no shell, no AI rail, no
credits counter, no caveman; the chat renders; `PRIVATE` and `REGISTERED`
profiles refuse; the owner still reaches their own profile at every setting.
