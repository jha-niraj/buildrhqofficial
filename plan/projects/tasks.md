# Projects - tasks

Derived from `overview.md`. Order matters: UI first, then actions, then schema,
so every step leaves the app compiling.

| ID | Task | Serves | Status |
|---|---|---|---|
| PRJ-1 | Remove team membership, invitations and visibility | 1, 2 | done (2026-08-20) |
| PRJ-2 | Remove third-party feature and sprint suggestions | 3 | done (2026-08-20) |
| PRJ-3 | Remove leaderboards | 4 | done (2026-08-20) |
| PRJ-4 | Remove voting and moderation from ideas and errors | 3 | done (2026-08-20) |
| PRJ-5 | Drop the tables | 6 | done (2026-08-20) |
| PRJ-6 | Verify the solo loop still compiles and holds together | 5 | done (2026-08-20) |

---

## PRJ-1 - Remove team membership, invitations and visibility

**Status:** done (2026-08-20)
**Serves:** 1, 2

**Why.** `team-collaboration.action.ts` is 559 lines of invite / accept /
decline / cancel / remove-member / update-role / update-visibility. It is the
single largest piece of the thing being removed.

**Files**
- delete: `actions/(main)/projects/team-collaboration.action.ts`
- edit: `app/(main)/projects/[slug]/_components/project-details-client.tsx`
- schema: `projectV2Members`, `projectV2Invitations`, `projectV2MemberRoleEnum`

**`visibility` STAYS.** Checked before deleting, and it is not what it looks
like: `eq(projectsV2.visibility, 'PUBLIC')` is the filter that separates the
**platform catalogue** from a user's own projects, and it is read by the browse
page, categories, platform stats and the jobs feed. Dropping it would empty the
project catalogue.

What goes is `updateProjectVisibility` - the action letting a user flip their own
project public, which IS the sharing mechanism - and its UI control.

**Edge cases**
- **`visibility` looked like sharing and is not.** Found by grepping the string
  rather than the symbol: six call sites filter the public catalogue on it. The
  column and its enum stay; only the user-facing toggle goes. This is the edge
  case that would have broken project browsing.
- **`teacherMemberId` on `projects_v2` looks like membership and is not.** It is
  the `apps/uni` integration point. Leave it.
- **`projectV2Members` may be referenced by relations** declared on other tables.
  Drizzle relations are runtime objects; a dangling `many(projectV2Members)`
  compiles and then throws on the first query that uses `with`.
- **The uni app may read these tables.** Check `apps/uni` before dropping, and
  typecheck it afterwards.

**Done when**
No file references membership, invitations or visibility; `tsc --noEmit` passes
in `apps/main` and `apps/uni`.

---

## PRJ-2 - Remove third-party feature and sprint suggestions

**Status:** done (2026-08-20)
**Serves:** 3

**Why.** `project_v2_feature_suggestion` carries `suggestedBy: VISITOR` and an
`addedByUsers` array - it exists so people can propose features on projects that
are not theirs. `sprint-suggestions.action.ts` is the same idea for sprints.

**Files**
- delete: `actions/(main)/projects/feature-suggestions.action.ts`
- delete: `actions/(main)/projects/sprint-suggestions.action.ts`
- delete: `components/projects/feature-suggestion-sheet.tsx`
- delete: `components/projects/feature-suggestions-list.tsx`
- edit: `app/(main)/projects/[slug]/_components/project-assistant-buttons.tsx`
- edit: `app/(main)/projects/[slug]/sprints/_components/sprints-page-client.tsx`
- schema: `projectV2FeatureSuggestions`, `projectV2SprintSuggestions`,
  `featureSuggestionTypeEnum`, `featureSuggestionStatusEnum`,
  `suggestionSourceEnum`

**Edge cases**
- **`sprint-suggestions.action.ts` was explicitly KEPT as CLN-10** two tasks ago,
  on the grounds that it was the only bridge to a live table. That reasoning is
  now void - the table is going too. Update `plan/cleanup/candidates.md` so the
  record does not contradict itself.
- **`sprints-page-client.tsx` renders the suggestion list inline.** Remove the
  section, not just the import, or an empty panel is left behind.
- **`adoptSuggestionToMyTasks` sounds solo and is not** - it adopts somebody
  else's suggestion onto your tasks. It goes with the rest.
- **Do not confuse this with generating tasks.** Generating sprints and tasks
  with AI is the core loop and stays.

**Done when**
Nothing imports either action, both components are gone, and the sprints page
renders without an empty suggestions region.

---

## PRJ-3 - Remove leaderboards

**Status:** done (2026-08-20)
**Serves:** 4

**Why.** Two tables and three routes whose only purpose is ranking users against
each other.

**Files**
- delete: `actions/(main)/projects/leaderboard.action.ts`
- delete: `app/(main)/projects/leaderboard/` (route + `[username]` subroute)
- delete: `app/(main)/projects/[slug]/leaderboard/`
- edit: any nav or card linking to those routes
- schema: `projectV2Leaderboards`, `projectV2GlobalLeaderboards`

**Edge cases**
- **`lib/urls.ts` exports `projectLeaderboardUrl`.** A shareable-URL helper for a
  route that will 404. Remove it and its callers.
- **Links from the projects hub and project cards** must go, or the user gets a
  404 from a button that looks fine.
- **`user-progress-sheet.tsx` and `ProjectsHubClient.tsx`** both matched the
  leaderboard grep - check whether they link to it or merely mention rank.
- **Deleting a route directory means its `loading.tsx` too.**

**Done when**
`grep -rn "leaderboard"` across `apps/main` returns nothing that resolves to a
route, and no page links to one.

---

## PRJ-4 - Remove voting and moderation from ideas and errors

**Status:** done (2026-08-20)
**Serves:** 3

**Why.** The idea catalogue and the error log both stay (see `overview.md`); the
community layer on top of them does not.

**Files**
- edit: `actions/(main)/projects/project-ideas.action.ts` - drop
  `toggleProjectUpvote`, `checkUserUpvote`, `getTopUpvotedProjects`,
  `submitProjectIdea`, `getUserSubmittedProjectIdeas`, `approveProjectIdea`,
  `rejectProjectIdea`, `submitProblemStatement`
- edit: `actions/(main)/projects/project-errors.action.ts` - drop `voteOnError`,
  `moderateError`, `getPendingErrors`
- edit: `components/projects/errors-tab.tsx`
- schema: `projectIdeaUpvotes`, `projectV2ErrorVotes`

**Edge cases**
- **`projectIdeas.upvotes` is a denormalised counter column** on a table that
  stays. With the vote table gone nothing can write it. Drop the column too
  rather than leaving a field frozen at 0 that the UI still renders.
- **Keep the READ side of ideas.** `getProjectIdeasByTechnology`,
  `getProjectIdeaById`, `searchProjectIdeas`, `incrementProjectView`,
  `getProblemStatements` are how a solo user finds a project. They stay.
- **Keep the owner's own error CRUD**: create, update, delete, get, stats.
- **`projectIdeaStatusEnum` / `projectErrorStatusEnum`** exist for the moderation
  queue. Check whether anything else reads them before dropping.
- **The ideas grid may sort by upvotes.** Re-sort by something that still exists
  or the list silently comes back in insertion order.

**Done when**
No vote or moderation action remains; the ideas browser and the owner's error log
both still work.

---

## PRJ-5 - Drop the tables

**Status:** done (2026-08-20)
**Serves:** 6
**Blocked by:** PRJ-1 .. PRJ-4

**Why.** A schema that still describes teams and invitations is a schema that
will grow code for them again.

**Tables**
`project_v2_member`, `project_v2_invitation`, `project_v2_feature_suggestion`,
`project_v2_sprint_suggestion`, `project_v2_leaderboard`,
`project_v2_global_leaderboard`, `project_idea_upvote`, `project_v2_error_vote`

**Columns** `project_idea.upvotes` only. `projects_v2.visibility` STAYS - see
PRJ-1.

**Enums** `project_v2_member_role`, `feature_suggestion_type`,
`feature_suggestion_status`, `suggestion_source`. `project_v2_visibility` stays.

**Edge cases**
- **All eight tables hold zero rows** - verified 2026-08-20. Re-verify
  immediately before generating the migration rather than trusting this line.
- **`db:generate` then `db:migrate`, never `db:push`.** Push leaves the database
  ahead of the migration chain, and the chain is how a fresh environment is
  built. Niraj confirmed this is not production, which removes the data risk, not
  the reason for keeping the chain honest.
- **Drop order.** Foreign keys mean children go before parents; drizzle-kit
  usually orders this correctly, but the generated SQL must be READ before it is
  applied, not assumed.
- **Enums are dropped separately from tables** in Postgres, and dropping one that
  a surviving column still uses fails the whole migration.
- **Report the migration contents before applying** - per `CLAUDE.md`, and doubly
  so for a migration whose entire body is `DROP`.

**Done when**
The migration is generated, read, applied, and `pg_stat_user_tables` no longer
lists any of the eight.

---

## PRJ-6 - Verify the solo loop still holds together

**Status:** done (2026-08-20)
**Serves:** 5
**Blocked by:** PRJ-5

**Steps**
1. `tsc --noEmit` in `apps/main`, `apps/uni`, `packages/db`.
2. Grep for every deleted symbol and table name; expect nothing.
3. Walk the loop in the code: project -> sprint -> task generate/delete -> quiz
   -> mock -> submission -> progress, confirming each still has its action and
   its route.

**Edge cases**
- **Drizzle `relations()` blocks are runtime, not compile-time.** A dangling
  relation to a dropped table typechecks and then throws on the first `with`
  query. Grep the relation blocks specifically.
- **A deleted route may still be linked from a `loading.tsx` skeleton** or a nav
  array, neither of which the compiler checks.

**Done when**
All three packages typecheck, no dangling references remain, and every step of
the solo loop still resolves to real code.


---

## Outcome

**Deleted** - 8 tables, 4 enums, 1 column, 1 index, and ~2,800 lines of code
across 9 files plus 3 route directories.

Actions: `team-collaboration`, `feature-suggestions`, `sprint-suggestions`,
`leaderboard`. Components: `project-settings-tab`, `feature-suggestion-sheet`,
`feature-suggestions-list`, `user-progress-sheet`, `submit-project-idea-sheet`.
Routes: `/projects/leaderboard`, `/projects/leaderboard/[username]`,
`/projects/[slug]/leaderboard`.

**Two things were nearly deleted and were not:**

- **`projects_v2.visibility`** reads like a sharing toggle and is not. Six call
  sites use `eq(projectsV2.visibility, 'PUBLIC')` to separate the platform
  catalogue from a user's own projects - browse, categories, platform stats and
  the jobs feed all depend on it. Dropping it would have emptied the project
  catalogue. The column and enum stayed; only `updateProjectVisibility` and its
  UI control went.

- **`updateProjectScore`** lived in `leaderboard.action.ts` but did two jobs: it
  wrote the user's own `user_project_v2_progress.totalScore` AND mirrored it into
  the two ranking tables. Deleting the file wholesale would have silently stopped
  every project score from updating. It was lifted into
  `actions/(main)/projects/project-score.action.ts` with the calculation, queries
  and weights unchanged and only the two leaderboard lines removed.

**Behaviour changes worth knowing before testing:**

- `/projects/[slug]/sprints` gated on project membership. It now gates on
  enrolment - you are the creator, or you have a progress row from starting it.
- The project page's "Share Your Progress" dialog is gone; the link it shared was
  the leaderboard URL.
- Error helpful/encountered counts still display but are read-only - nothing can
  vote them up any more.
- Project ideas are browse-only: no community submission, no moderation queue, no
  upvotes. The grid now sorts by views rather than upvotes, and the assistant's
  `search_project_ideas` tool sorts by build count.
