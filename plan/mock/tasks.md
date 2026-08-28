# Mock interviews - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| MK-1 | Animated icons for categories | 6 | done (2026-08-28) |
| MK-2 | Contrast pass on the create sheet | 7 | done (2026-08-28) |
| MK-3 | A user-scoped stats action | 3, 4 | done (2026-08-28) |
| MK-4 | Rebuild `/mock` as the user's page | 1, 2, 5 | done (2026-08-28) |

---

## MK-1 - Animated icons for categories

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 6

**Why.** `MOCK_CATEGORIES` carries an emoji per category - 💻 🤝 👔 🏗️ 👑 💰 ⌨️
📊 📋. Emoji render differently on every OS, cannot inherit `currentColor`, and
so stay full-colour inside a dark selected row. The same change was already made
for the pathfinder categories; this is the last emoji picker in the product.

**Files.**
- `apps/main/app/(main)/mock/voice/_constants/mock-categories.ts`
- `apps/main/app/(main)/mock/_components/purchase-mock-sheet.tsx`
- the three consumers: `voice/page.tsx`, `voice/_components/voice-sidebar.tsx`,
  `_components/create-mock-sheet.tsx`

**Steps.** Add `icon: AnimatedIconName` beside the emoji, render with
`AnimatedIcon`, and delete the emoji map duplicated in `purchase-mock-sheet.tsx`.

**Edge cases.**
- `MOCK_CATEGORIES` is `as const` and its `value` union is exported as
  `MockCategoryValue`. Adding a field must not widen that union.
- `purchase-mock-sheet.tsx:59` holds a SECOND emoji map keyed by the same
  categories. It has already drifted - it has no `ALL`. Delete it rather than
  updating it, or the next change updates one of the two.
- The `ALL` entry is a filter, not a category. It needs an icon that does not
  imply a subject.

**Done when.** No emoji remain under `app/(main)/mock`, and every category
picker renders `AnimatedIcon`.

**Verified 2026-08-28.** Zero emoji remain under `app/(main)/mock`.

**There were THREE copies of the map, not two.** The task predicted the one in
`purchase-mock-sheet.tsx`; `mock-interview-card.tsx` held a third, with the same
nine categories written out again and rendered at three different sizes. All
three are deleted and every site now looks the icon up from `MOCK_CATEGORIES`,
which cannot drift the way three hand-maintained tables did - and had, since the
`purchase-mock-sheet` copy was already missing `ALL`.

---

## MK-2 - Contrast pass on the create sheet

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 7

**Why.** "25 Credits Required (You have 10092)" is the one line in that sheet
that decides whether the user can proceed, and it is the least readable thing on
it. The step labels under the numbered circles are the same.

**Files.** `apps/main/app/(main)/mock/_components/create-mock-sheet.tsx`

**Steps.** Bring the credit line and the step labels to the floor set by RSP-7:
nothing under 12px, no grey under 4.5:1 on its own surface, and a `dark:` pair on
every grey.

**Edge cases.**
- The affordability line must read as MORE prominent when the user cannot afford
  it, not less. Today it is styled identically either way.
- Check it against the sheet's own surface, not the page behind it. That was the
  mistake the auth brand panel made: a grey measured against the wrong background.

**Done when.** Every string in the sheet clears AA at 12px or larger, in both
themes.

**Verified 2026-08-28**, and the cause was not low contrast - it was ink of the
WRONG THEME. The credit line was `text-neutral-900 dark:text-neutral-800`: dark
ink deliberately specified for dark mode, so it sat almost black on a near-black
panel.

The RSP-7 sweep could not have caught it. That pass looked for bare light-mode
greys; this is a `dark:` value that is wrong, and the class list looks
deliberate. Searching for the pattern - dark ink in BOTH themes, so unreadable in
one of them - found **69 instances across 25 files**, all now paired properly
(light 900 pairs with dark 100, 800 with 200, and so on).

The affordability line also now LOOKS different when the answer is no, with the
exact shortfall spelled out rather than leaving the user to subtract two numbers.

---

## MK-3 - A user-scoped stats action

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 3, 4
- **Blocks:** MK-4

**Why.** `getMockInterviewStats` is platform-wide: total sessions, distinct
users, average rating across everybody. Nothing computes what THIS user has
done, so the page cannot show it.

**Files.** `apps/main/actions/(main)/mockvoice/stats.action.ts`

**Steps.** Add `getMyMockStats()` returning, for the signed-in user: total
sessions, completed, total practice minutes, average score, current streak, a
30-day daily series of sessions and average score, and a breakdown by category.

**Edge cases.**
- **`userRating` and the AI score are nullable.** Exclude unscored sessions from
  the average; counting them as 0 turns "not yet rated" into "rated badly".
- **`duration` is nullable and, on the sibling table, was always 0** because of a
  field-name bug (see MC-1). Treat null and 0 as "unknown", not as a zero-length
  interview.
- **Zero-fill the daily series.** Without it the chart draws a slope across an
  inactive week, which reads as steady practice that did not happen.
- A session that is `IN_PROGRESS` is not a completed practice. Count it
  separately or not at all.

**Done when.** The action returns numbers that reconcile with
`select * from mock_voice_session where user_id = $me`, and returns a well-formed
empty shape for a user with no sessions.

---

## MK-4 - Rebuild `/mock` as the user's page

- [x] **Status:** done, verified 2026-08-28
- **Serves:** definition-of-done 1, 2, 5
- **Blocked by:** MK-3

**Why.** Definition-of-done 1 and 2. The page currently opens with four
platform statistics - two real but meaningless to the reader (`0+` interviews,
`0+` active users), two invented (`4.8/5`, `85%`) - then a full-width "Choose
Your Interview Format" hero, then one format card claiming "15K+ completed".

**Files.**
- `apps/main/app/(main)/mock/_components/MockHubClient.tsx`
- `apps/main/app/(main)/mock/page.tsx`, `loading.tsx`

**Steps.**
1. Delete the platform stat row, the marketing hero and the fabricated badges.
2. Header: title, and the actions that start a session.
3. The user's own summary: sessions, practice time, average score, streak.
4. **Progress over time**: a chart of sessions per day and average score.
5. Practice by category.
6. Recent sessions, linking into each result.
7. Rebuild `loading.tsx` to match.

**Edge cases.**
- **Zero sessions is the DEFAULT case today**, not an edge one - the table is
  empty. The page must be worth looking at with no data: say what a mock
  interview is for and give one obvious way to start, rather than rendering
  charts of nothing.
- **Two Y scales.** Sessions per day is single digits; a score is 0-100. On one
  axis the session line flattens to nothing - exactly the bug fixed on the
  credits chart.
- recharts writes real `fill`/`stroke` attributes and cannot read
  `currentColor`, so chart inks come from CSS variables set on the wrapper and
  flipped for dark mode.
- `4.8/5` and `85%` are not to be recomputed into something real. They are
  claims the product cannot support; they go.

**Done when.** `/mock` shows only the signed-in user's data, contains no
hardcoded statistic, renders usefully at zero sessions, and its skeleton matches.

**Verified 2026-08-28.** `MockHubClient` went from 361 to ~150 lines; 209 lines
of marketing sections and a further 71 of dead data blocks removed. No
fabricated number survives outside a comment. `loading.tsx` rebuilt to match.

**The invented numbers were worse than they looked.** `4.8/5` and `85%` were
known to be hardcoded. But `totalVoiceInterviews: 15420` and `activeUsers: 8734`
were the INITIAL STATE of the real query - rendered on first paint, before the
fetch returned - so every visitor was shown fifteen thousand interviews for a
moment before it corrected itself to 0. Two of the four "real" statistics were
fabricated for as long as anyone actually looked at them.

The empty state was built first, as the overview said, because
`mock_voice_session` has no rows: it explains what a mock interview is and gives
one action, rather than rendering four zeroes and a flat chart.
