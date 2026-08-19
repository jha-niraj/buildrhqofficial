# Projects - overview

## What this module is

One person, working through one project, start to finish.

They pick a project (or an idea from the catalogue), get sprints, work the tasks
inside those sprints, get assessed by an AI quiz and a mock interview, and
finish. Everything they touch is theirs.

That last sentence is the whole scope. The module was originally built for a
college, where the idea was that students would share projects, work on them
together in real time, invite each other, and vote on things. None of that is
being built now, and the machinery for it is the main thing standing between a
reader and understanding how a project actually works.

## Definition of done

1. **A project has exactly one owner and no other participants.** No members, no
   roles, no invitations - not in the UI, not in the actions, not in the schema.

2. **Nothing is shared, gifted, or forked.** No visibility setting, no public
   /private toggle, no buying a project for somebody else.

3. **Nobody contributes to anybody else's project.** No visitor feature
   suggestions, no sprint suggestions from third parties.

4. **Users are not ranked against each other.** No per-project leaderboard, no
   global leaderboard.

5. **The full solo loop still works, untouched**: browse or generate a project ->
   sprints -> generate and delete tasks inside a sprint -> AI quiz -> mock
   interview -> submission -> progress.

6. **The schema says the same thing the code does.** Every table supporting a
   deleted capability is dropped by a migration, not left orphaned.

## Decisions

Decided by Niraj on 2026-08-20.

### What "multi-user" means here, precisely

The line is **"does this exist because a second person might touch my project?"**
If yes, it goes.

That covers team membership, invitations, visibility, third-party suggestions,
and cross-user ranking. It does **not** cover everything with a `userId` column -
a standup entry, a guided session, a quiz attempt and a submission all have one,
and all of them are one person's own record of their own work.

### The idea catalogue stays; the voting on it goes

`project_idea` is a **catalogue** - title, description, difficulty, technologies,
core requirements, suggested stacks. It is where a solo user finds something to
build, which is the first step of the loop in point 5. It stays.

What goes is the community machinery layered on top: upvotes, and the
submit -> moderate -> approve/reject workflow. Those exist so users can
contribute ideas to each other, which is exactly the thing being removed.

### The error log stays; the voting on it goes

Same shape. Recording the errors you hit on your own project is solo work.
Voting on other people's errors and moderating a queue is not.

### Safe to drop the tables outright

Every table in the projects module currently holds **zero rows** - verified
against the database on 2026-08-20 via `pg_stat_user_tables`. Nothing is being
destroyed, so the deletions are a normal migration rather than a data decision.

Done with `db:generate` + `db:migrate` rather than `db:push`, even though this is
not production: `push` would leave the database ahead of the migration chain, and
the chain is how a fresh environment gets built.

## Out of scope

- **`apps/uni`.** The university app has its own assignment and class model, and
  a teacher assigning work to students is not the same thing as a team working
  on one project. Untouched.
- **The `teacherMemberId` column on `projects_v2`.** It is the uni integration
  point, not team membership.
- **Project enrolment.** Spending your own credits to start a project is a
  single-user purchase and stays.
- **Task detail access.** Same - buying deeper detail on a task, for yourself.
- **Bookmarks.** One user saving a project for later.
- **Rewriting how sprints or tasks work.** They stay exactly as they are.
