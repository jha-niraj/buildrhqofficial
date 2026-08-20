# Profile - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| PRF-1 | Extract the shared profile view | 1, 3 | done (2026-08-20) |
| PRF-2 | Rebuild `/profile` on it | 1, 2 | done (2026-08-20) |
| PRF-3 | Rebuild `/profile/[username]` on it | 1, 2, 5 | done (2026-08-20) |
| PRF-4 | Match the loading skeletons to the new layout | 4 | done (2026-08-20) |
| PRF-5 | List the superseded tabbed generation for Niraj | - | done (2026-08-20) |

---

## PRF-1 - Extract the shared profile view

**Status:** done (2026-08-20)
**Serves:** 1, 3

**Why.** One layout, rendered twice, is the whole simplification.

**Files**
- new: `components/profile/profile-view.tsx`

**Shape**
```
<ProfileView
  profile={...}        normalised, from either source
  stats={...}
  isOwn={boolean}
  isFollowing={...}    public only
  onEdit / onShare / onAddSkills / onAddExperience / onAddEducation /
  onAddProject / onFollow
/>
```
Every callback optional. A section renders its action only when both `isOwn` and
the callback are present, so the read-only page cannot accidentally show an
Add button by forgetting a prop.

**Edge cases**
- **The two pages have DIFFERENT data shapes.** `/profile` gets `getOwnProfile`;
  `/profile/[username]` gets a server query typed `any`. Normalise at the
  boundary, and give the shared component ONE explicit interface - passing `any`
  through would make every field silently optional.
- **A visitor must not see private fields.** `email` is behind
  `userProfile.showEmail`; credits, and the exact XP-to-next-level, are the
  owner's business. Gate on `isOwn`, not on whether the value happens to be set.
- **Empty states differ by viewer.** "No projects yet - add your first" is wrong
  on somebody else's page; it should read "No projects yet." with no action.
- **`dateRange` and the level maths already exist** in `ProfileClient`. Move
  them, do not rewrite them - a second rounding rule for XP would be a new bug.
- **Avatar can be a remote URL** (`unoptimized` is already set). Keep it, or
  Next's optimiser rejects unconfigured hosts at runtime.

**Done when**
The component renders a complete profile from props alone, with no data fetching
and no store access inside it.

---

## PRF-2 - Rebuild `/profile` on it

**Status:** done (2026-08-20)
**Serves:** 1, 2

**Files**
- edit: `app/(main)/profile/_components/ProfileClient.tsx`

**Steps**
Keep the fetching, the store wiring, the modals and the sheets. Replace the
inline markup with `<ProfileView isOwn ... />`.

**Edge cases**
- **The four sheets and two modals must keep their existing props.** They are
  shared with other surfaces; changing their contract is a different task.
- **`refresh()` after a sheet saves** must still run, or an added skill does not
  appear until reload.
- **The signed-out and error states** in this file are not profile layout and
  stay where they are.
- **`ProfileSkeleton` is imported here** - see PRF-4.

**Done when**
`/profile` looks the same or better, and every edit/add/share still works.

---

## PRF-3 - Rebuild `/profile/[username]` on it

**Status:** done (2026-08-20)
**Serves:** 1, 2, 5

**Files**
- edit: `app/(main)/profile/[username]/_components/public-profile-client.tsx`

**Steps**
Drop the tabbed composition. Render `<ProfileView isOwn={false} ... />` plus the
Follow button and the share modal.

**Edge cases**
- **`isOwnProfile` is already a prop** - someone visiting their OWN username URL
  must get the owner view, not a read-only copy of it.
- **`trackProfileView` must keep firing**, and must keep NOT firing on your own
  profile, or view counts inflate.
- **The server query may not select every field** the shared component reads.
  Check `page.tsx` and widen the select rather than letting fields render as
  undefined.
- **Follow state is optimistic today.** Preserve that; a button that waits on a
  round trip feels broken.
- **A private or missing user** must still 404 the way it does now.

**Done when**
Somebody else's profile is visually the same page as your own, minus the edit
controls, plus Follow.

---

## PRF-4 - Match the loading skeletons

**Status:** done (2026-08-20)
**Serves:** 4

**Why.** `CLAUDE.md`: a skeleton that does not match the real layout is worse
than none, because the page visibly reflows.

**Files**
- edit: `app/(main)/profile/_components/profile-skeleton.tsx`
- edit: `app/(main)/profile/[username]/loading.tsx`
- edit: `app/(main)/profile/loading.tsx`

**Edge cases**
- **Both routes now share a layout, so both skeletons should.**
- **The skeleton must not be taller than the real page**, or the content jumps up
  when it lands.

**Done when**
Loading and loaded states have the same silhouette on both routes.

---

## PRF-5 - List the superseded tabbed generation

**Status:** done (2026-08-20)

**Why.** Niraj said not to delete. So it gets written down instead.

**Files**
- edit: `plan/cleanup/candidates.md` - add a Group E

**To list** (~4,100 lines, all unreferenced once PRF-3 lands):
`profile-header.tsx`, `profile-tabs.tsx`, `profile-sidebar.tsx`,
`integrations-tab.tsx`, `tabs/at-a-glance-tab.tsx`, `tabs/about-tab.tsx`,
`tabs/activity-tab.tsx`, `tabs/education-tab.tsx`, `tabs/projects-tab.tsx`,
`tabs/resume-tab.tsx`, `tabs/skills-tab.tsx`, `tabs/work-experience-tab.tsx`,
`modals/endorse-skill-modal.tsx`

**Edge cases**
- **`components/profile/index.ts` re-exports all of them.** Trim the barrel to
  what is live, or the dead files stay reachable and `tsc` keeps checking them.
- **`tabs/resume-tab.tsx` was edited earlier this session** (upload wiring). It
  is still superseded; note that so the work is not assumed lost - it is in git.
- **Check nothing outside `components/profile` imports them** before listing.

**Done when**
Group E exists in `candidates.md` with an accurate line count, and the barrel
exports only what the live pages use.


---

## Outcome

The live profile is **1,095 lines** where the two generations together were about
**5,700**. Both routes render `components/profile/profile-view.tsx`; the tabbed
generation (~4,636 lines) is untouched on disk and listed as Group E in
`plan/cleanup/candidates.md`.

| | before | after |
|---|---:|---:|
| `ProfileClient.tsx` | 664 | 363 |
| `public-profile-client.tsx` | 202 | 135 |
| shared view + skeleton | - | 597 |
| tabbed generation in the live path | ~4,636 | 0 |

**A real bug found while wiring PRF-3.** `getProfileByUsername` fetched skills,
experiences, projects, certifications, achievements, social links and activity -
but never education. A public profile therefore said "No education listed" no
matter what the user had entered. Fixed in the same action.

That fix was nearly applied to the wrong function: `getOwnProfile` has a
near-identical `Promise.all` block and already fetched educations, so the first
attempt inserted a duplicate there and silently shifted its destructuring by one
position. Caught by the typechecker, then anchored on a string unique to the
right function.

**Behaviour notes for testing:**

- Visiting your own `/profile/<your-username>` gives the owner view, with Edit
  routing to `/profile` where the sheets live.
- A visitor sees no Edit, no Add and no Manage - absent, not disabled - plus
  Follow and Share.
- The resume section and the XP-to-next-level readout are owner-only.
- `trackProfileView` still fires once per mount and still never on your own
  profile.
