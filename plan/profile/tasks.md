# Profile - tasks

Derived from `overview.md`.

| ID | Task | Serves | Status |
|---|---|---|---|
| PRF-1 | Extract the shared profile view | 1, 3 | done (2026-08-20) |
| PRF-2 | Rebuild `/profile` on it | 1, 2 | done (2026-08-20) |
| PRF-3 | Rebuild `/profile/[username]` on it | 1, 2, 5 | done (2026-08-20) |
| PRF-4 | Match the loading skeletons to the new layout | 4 | done (2026-08-20) |
| PRF-5 | List the superseded tabbed generation for Niraj | - | done (2026-08-20) |
| PRF-6 | Resume upload on the profile page | 2 | done (2026-08-20) |

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

## PRF-6 - Resume upload on the profile page

**Status:** done (2026-08-20)
**Serves:** definition-of-done 2 (nothing a user could do before is gone)

**Why.** The profile shows "Resume on file" and links to `/ai/resume`, but there
is no way to put a resume there from this page. The control existed in
`resume-tab.tsx`, which was already unreachable before this session - so the gap
predates the rewrite, but the rewrite is the moment to close it.

It must be the **same pipeline as onboarding**, not a second one: file ->
`uploadResume` -> R2 + `unpdf`/`mammoth` text extraction -> `resume_structure`
worker job -> structured draft, defaulted if the user has none.

**Files**
- edit: `components/profile/profile-view.tsx` - the control
- edit: `app/(main)/profile/_components/ProfileClient.tsx` - the handlers

**Steps**
1. `ProfileView` gains `onUploadResume(file)`, `onDeleteResume()`,
   `onViewResume()` and their pending flags. The view owns the input and the
   client-side validation; it does not call a server action itself.
2. `ProfileClient` implements them against the existing
   `uploadResume` / `deleteResume` / `getResumeSignedUrl` actions.

**Edge cases**
- **Exactly the onboarding call.** `uploadResume(file, undefined, { draftName })`
  - the third argument is what names the draft the worker creates. Omitting it
  silently produces "Imported resume" instead.
- **Validate before upload** with `validateResumeFile` (5MB, pdf/doc/docx). It is
  a pure client function, so it does not break the view's presentation-only rule.
- **A scanned PDF yields no text**, so `uploadResume` returns no
  `structureJobId`. Say so - the file is stored and viewable, but nothing will be
  parsed from it. Silently succeeding here is how a user ends up wondering why
  their AI resume never appeared.
- **The parse lands minutes later**, off the request path. The success toast has
  to set that expectation or the structured draft showing up at `/ai/resume`
  looks like something they did not ask for.
- **`hasResume` is on the profile row**, so the section only flips to "on file"
  after a refresh. Call the existing `refreshProfileData` on success.
- **Replacing** is the same call as uploading - no separate path. The worker is
  `singleFlight`, and it re-reads the newest text at alarm time, so a quick
  re-upload structures the latest file rather than racing two jobs.
- **Deleting must confirm.** It removes the R2 object and the extracted text, and
  it is not undoable.
- **`getResumeSignedUrl` is async and time-limited**; fetch it on click rather
  than holding a URL that expires while the page sits open.
- **Owner only.** The whole section is already behind `isOwn`; the upload control
  must not leak into the public view.

**Done when**
A user with no resume can upload one from `/profile`, sees it become "Resume on
file", can view and delete it, and the structured draft appears at `/ai/resume`
shortly after - the same outcome as uploading during onboarding.

**Outcome.** `ProfileClient` calls
`uploadResume(file, undefined, { draftName: "My resume" })` - byte-identical to
onboarding's call - so both go through the one pipeline: R2 + `unpdf`/`mammoth`
-> `resume_structure` Durable Object -> structured draft, defaulted if the user
has none. View and Delete use the existing `getResumeSignedUrl` / `deleteResume`.

**A production bug found while testing this.** `extractTextFromDOCXBuffer`
called `mammoth.extractRawText({ arrayBuffer })`. That is the BROWSER build's
input; the server build wants `{ buffer: Buffer }` and rejects an ArrayBuffer
with "Could not find file in options" - which the surrounding `catch { return "" }`
swallowed. So **every DOCX upload extracted nothing**, dispatched no structuring
job, and told the user their file was unreadable. It affected every upload
surface: onboarding, the resume hub, the interview assistant, and now this page.

Fixed to prefer `{ buffer }` with the arrayBuffer form as a browser fallback, and
the catch now logs instead of failing silently - an extractor returning `""` was
indistinguishable from a genuinely scanned PDF, which is exactly what hid this.

**Verified** by running both branches against a generated PDF and a generated
DOCX: 251 and 257 characters extracted, both over the worker's 200-character
floor, so both dispatch the structuring job.

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
