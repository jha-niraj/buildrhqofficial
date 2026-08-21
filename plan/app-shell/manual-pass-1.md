# App shell - manual pass 1

Nine findings from Niraj's manual review of `apps/main` on 2026-08-21. Each is a
task here; each gets ticked only after its own "Done when" is verified.

Ordered by blast radius: the ones that make routes unreachable first, then the
ones that make text unreadable, then layout, then the page redesign.

---

## 1. Two nav entries point at routes that do not exist

**Why.** `lib/navigation.ts` sends "Job Interview" to `ai/jobinterviewassistant`
and "Cover Letter" to `ai/resume/cover-letter`. Neither exists. The real routes
are `app/(main)/ai/interviewassistant` and `app/(main)/ai/coverletter`.

Cover Letter is the worse of the two: `/ai/resume/cover-letter` matches the
dynamic `app/(main)/ai/resume/[username]` segment with `username="cover-letter"`,
so it renders that page's own not-found rather than a routing error. It looks
like a broken profile, not a broken link.

`app/(main)/layout.tsx` already carries a comment saying a stale path in
`fullScreenPaths` "fails silently" - the same trap, in the same app, twice.

**Files.** `lib/navigation.ts`

**Steps.**
1. `ai/jobinterviewassistant` -> `ai/interviewassistant`
2. `ai/resume/cover-letter` -> `ai/coverletter`
3. Add a check that fails loudly when a nav path has no page (see task 2).

**Edge cases.** `jobs` has no `app/(main)/jobs` directory and is still correct -
it lives in the `(jobs)` route group, which does not appear in the URL. Any
checker must resolve against route groups, not against `app/(main)` alone.

**Done when.** Every `path` in `mainNavigation` resolves to a real `page.tsx`,
proven by the checker in task 2, and both links load their page in the browser.

- [ ] Done

---

## 2. A test that stops task 1 happening a third time

**Why.** Two dead nav links shipped, and the layout comment shows a third dead
path shipped before them. The pattern is not carelessness, it is that a wrong
path in this file has no symptom until someone clicks it.

**Files.** `lib/navigation.test.ts` (new), or a `scripts/` check if there is no
test runner wired up here.

**Steps.**
1. Walk `mainNavigation` primary + children, collecting every `path`.
2. Resolve each against `app/`, stripping `(group)` segments, accepting
   `page.tsx` or a `[dynamic]` match.
3. Fail with the offending path in the message.

**Done when.** Introducing a deliberately wrong path makes the check fail.

- [ ] Done

---

## 3. Pathfinder is not in the sidebar

**Why.** `lib/navigation.ts` says "KnowMe & Pathfinder are parked (code kept,
hidden from nav)". Niraj wants Pathfinder back. The routes exist and are real:
`pathfinder/page.tsx`, `pathfinder/explore/page.tsx`, `pathfinder/[slug]`.

`srs/core-modules/` holds the older pathfinder docs - read before changing
anything inside the module itself. This task only touches nav.

**Files.** `lib/navigation.ts`

**Steps.** Add a Pathfinder entry with an `explore` child. Update the stale
"parked" comment so it names only KnowMe.

**Done when.** Pathfinder appears in the sidebar, both entries navigate, and the
active state highlights on `/pathfinder`.

- [ ] Done

---

## 4. Dark-mode ink that was never paired

**Why.** 460 `className` strings across 126 files carry a light-mode-only ink
(`text-neutral-900`, `-800`, `-700` and the zinc/gray/slate/stone equivalents)
with no `dark:` counterpart. On a `dark:bg-neutral-900` card that ink is
invisible. `apps/web/CLAUDE.md` already states the rule: "never hardcode a
single-mode colour; always pair".

Confirmed cases from the review, all on `/ai/resume/import`:

| Line | Class | Symptom in the screenshot |
|---|---|---|
| 105 | `text-neutral-800 border-neutral-200` on the LinkedIn `Badge` | the pill renders empty |
| 160 | `Linkedin ... text-neutral-800` | no icon before "LinkedIn Profile URL" |
| 201, 219 | Twitter / Globe icons `text-neutral-900` | no icons |
| 240 | `CheckCircle2 ... text-neutral-900` | "What AI extracts" has no ticks |

**Files.** 126, listed by the scanner. The reported two first:
`app/(main)/ai/resume/import/_components/import-client.tsx`,
`app/(main)/ai/resume/_components/resume-hub.tsx`.

**Steps.**
1. Script the transform: for a `className` containing an unpaired dark ink, add
   the counterpart - 900 -> 100, 800 -> 200, 700 -> 300.
2. Run it, then read the diff for the cases the rule gets wrong.

**Edge cases.** The rule is wrong wherever dark ink sits on a surface that is
light in BOTH themes - a photo, a gradient, an always-white panel. `CLAUDE.md`
records the auth brand panel measuring 1.1:1 for exactly this reason. Those
sites must keep their unpaired ink, so the diff has to be read, not trusted.

Borders (`border-neutral-200`) have the same defect and the same fix, but a
missing border is a much smaller failure than missing text. Ink first.

**Done when.** The scanner reports zero unpaired inks, `tsc --noEmit` passes,
and the import page shows its pill, icons and ticks in dark mode.

- [ ] Done

---

## 5. The resume header does not belong to the shell

**Why.** `resume-hub.tsx` opens with a full-bleed bar - `bg-white
dark:bg-neutral-950` plus `border-b` - inside a page that is already a rounded
card floating on the backdrop. It reads as a second, squarer card jammed into
the first, and its bottom border cuts the page in half.

**Files.** `app/(main)/ai/resume/_components/resume-hub.tsx`

**Steps.** Drop the bar. Let the title, sub and stats sit on the page surface
like every other page under `(main)`.

**Done when.** The header has no edge of its own and the page reads as one card.

- [ ] Done

---

## 6. Remove the Blueprint buttons

**Why.** Four `<Link href='/blueprint/resume'>` in `resume-hub.tsx`. There is no
`blueprint` route anywhere in the app - they are dead links, and one of them is
the first button in the page header.

**Files.** `app/(main)/ai/resume/_components/resume-hub.tsx`

**Steps.** Remove the header button, the "Browse Blueprint" link, the "View in
Blueprint" button, and the "Create & Sell Your Template" block that exists only
to point at the marketplace. Drop the now-unused `Store` / `ExternalLink`
imports.

**Edge cases.** `communityTemplates` is only ever rendered inside the block being
removed. Leave the data plumbing alone - the marketplace may come back - but do
not leave a section that renders nothing.

**Done when.** No reference to `/blueprint` remains in the app, and the
templates tab has no dead control.

- [ ] Done

---

## 7. The page does not narrow when the AI panel opens

**Why.** On `/home` with the rail open, the page keeps its full width and the
right-hand cards sit under the panel. `app/(main)/layout.tsx` says the rail is
"a real column, not an overlay. The page narrows to make room for it, so nothing
the user was reading gets covered" - so this is the shell failing its own
contract, not a missing feature.

**Files.** `app/(main)/layout.tsx`, and whatever inside `/home` sets its own
width.

**Steps.** Find what stops the flex child shrinking. Suspect a `min-w` or a
fixed `max-w` on the page content that wins over `min-w-0`.

**Done when.** Opening the rail on `/home` narrows the page and nothing is
clipped at any width from 1280px up.

- [ ] Done

---

## 8. A border down the right of the import page

**Why.** Reported on `/ai/resume/import`: a vertical rule down the right of the
content, ending nowhere.

**Files.** `app/(main)/ai/resume/import/_components/import-client.tsx`

**Done when.** No stray edge at any width.

- [ ] Done

---

## 9. The purchase page does not look like the product

**Why.** `/purchase` reads as a different product: "Compute Provisioning",
"ALLOCATION AMOUNT", "Provision Resources", a serif numeral, an invoice panel.
Every other surface in the app speaks plainly about credits.

Prices, grants and limits are decisions and live in a module `overview.md` per
the working agreement - this task is presentation only. It must not change a
single price, tier or credit grant.

**Files.** `app/(main)/purchase/_components/PurchaseClient.tsx`

**Steps.**
1. Rewrite the copy to the product's own register: credits, not compute.
2. Restyle to the shell's card language.
3. Keep INR/USD, the slider, the tiers and the totals behaving exactly as now.

**Done when.** The page uses the same type, spacing and card treatment as the
rest of `(main)`, and every number it shows is the number it showed before.

- [ ] Done

---

## 10. `/ai/resume` refetches itself in a loop

**Why.** Niraj's dev log shows `GET /ai/resume` paired with `GET
/api/auth/get-session` roughly three times a second, with the page flashing.

**Status: cause not yet proven.** What has been ruled out by reading:

- no `router.refresh()` inside any effect, anywhere in the app
- `getNotifications` does not `revalidatePath`; `markAsRead`/`markAllAsRead` do,
  but both are click-driven
- `fetchXpAndCredit` does not revalidate
- no `setInterval` in anything the resume page mounts
- no `<img>` with an empty `src` (which would re-request the document URL)
- the lucide brand icons are all present, so nothing is throwing

What is genuinely wrong and worth fixing regardless, in
`components/common/mainsidebar.tsx`:

```tsx
useEffect(() => { if (session?.user) fetchCreditsAndXp() }, [session?.user, ...])
useEffect(() => { if (session?.user) load() }, [session?.user, load])
```

`session?.user` is an object. Its identity is not guaranteed stable across
renders of better-auth's `useSession`, and both effects fire a server action.
`load()` also flips a `loading` state, which is a visible flash in the sidebar.
The dep should be `session?.user?.id`.

**Steps.**
1. Narrow both deps to the id.
2. Re-check with the dev server. If it still loops, instrument rather than
   guess: record `performance.getEntriesByType('resource')` in the page and find
   what is issuing the GET.

**Done when.** The dev log is quiet on an idle `/ai/resume`, confirmed by
watching it for 30 seconds.

- [ ] Done
