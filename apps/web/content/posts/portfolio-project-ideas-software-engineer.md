A portfolio project is worth building when it forces a decision you can be interviewed about. That is the whole selection criterion, and it eliminates most of the ideas people start with.

A to-do app forces no decisions. Neither does a weather dashboard, a movie search page, or a clone of a landing page. They are fine as learning exercises and they are worthless as portfolio pieces, because there is nothing an interviewer can ask you that has an interesting answer.

## The test

Before building anything, ask: **what decision will I have to make, and what is the alternative I will have rejected?**

If you cannot name one, the project will not survive an interview. If you can name three, it is a good project.

Examples of decisions that make a project interesting:

- Postgres or Redis for this piece of state, and why
- Polling or WebSockets, and what changed when the connection count grew
- Doing this work in the request or in a background job
- Denormalising a table to avoid a join, and what that cost you on writes
- Rate limiting per user or per IP, and what happens behind a NAT

An interviewer can spend fifteen minutes on any of those. None of them come up in a to-do app.

## Nine projects that force decisions

Each of these is chosen because it has a hard part. The hard part is the point; if you route around it, you have built the to-do app again.

### 1. A URL shortener with analytics

**The hard part:** generating short codes without collisions, and counting clicks without a write on every read becoming your bottleneck.

**Decisions:** hash versus counter versus random for the code. Whether to count clicks synchronously or buffer them. What to do when two requests generate the same code at the same moment.

Sounds trivial, has genuine depth, and every interviewer understands the problem immediately.

### 2. A rate limiter as a service

**The hard part:** doing it correctly across multiple instances.

**Decisions:** fixed window, sliding window or token bucket. Where the counter lives. What happens when the store is unavailable - fail open or fail closed, which is a real question with a real trade-off.

[Redis's documentation](https://redis.io/docs/latest/develop/) covers the primitives. Building this teaches you more about distributed state than a year of reading about it.

### 3. A job queue with retries

**The hard part:** exactly-once is impossible, so what do you actually guarantee?

**Decisions:** at-least-once with idempotent handlers, or at-most-once. Backoff strategy. What happens to a job that fails forever. How you avoid two workers picking up the same job.

This is the project that teaches you why idempotency keys exist.

### 4. A markdown-based blog engine with full-text search

**The hard part:** search that is better than `LIKE '%term%'` and worse than running Elasticsearch for a personal blog.

**Decisions:** Postgres full-text search versus an external index. How you handle stemming and ranking. Whether search runs at build time or request time. [Postgres's indexing documentation](https://www.postgresql.org/docs/current/indexes.html) is the right starting point.

### 5. A collaborative text editor

**The hard part:** two people typing in the same place at the same time.

**Decisions:** operational transformation or CRDTs. What happens on reconnect. How much state the server keeps.

This is genuinely hard and genuinely impressive. Do not start here, but it is the right project once you have shipped two or three others.

### 6. A CI runner for one language

**The hard part:** running untrusted code without it eating your machine.

**Decisions:** container per run or a pool. Timeouts and memory limits. How you stream logs back while the job is still running. [Docker's getting-started guide](https://docs.docker.com/get-started/) is the entry point, and [GitHub Actions](https://github.com/features/actions) is the thing you are building a small version of.

### 7. An expense splitter that settles in the fewest transfers

**The hard part:** the settlement algorithm, which is genuinely a graph problem.

**Decisions:** exact minimum transfers is expensive; a greedy heuristic is fast and usually within one. Choosing the heuristic and being able to say why is a great interview answer. Multi-currency adds a second decision about when you fix the exchange rate.

### 8. A feed with pagination that does not break

**The hard part:** offset pagination silently duplicates and skips items when the underlying data changes between pages.

**Decisions:** cursor pagination and what the cursor encodes. What happens when the item a cursor points at is deleted. Whether the feed is computed on read or on write.

Small project, and the pagination discussion alone is worth an interview segment.

### 9. A metrics dashboard for something you actually run

**The hard part:** time-series data at any volume is a different storage problem from rows in a table.

**Decisions:** what you downsample and when. Retention. Pull or push. [Grafana's documentation](https://grafana.com/docs/) shows what the mature version looks like.

## Three finished beats twelve started

The most common portfolio failure is not a bad idea. It is twelve repositories with a commit history that stops in week two.

A recruiter or an engineer looking at your GitHub reads an abandoned project as evidence you do not finish things, which is the single most expensive impression to give. Three complete, deployed projects beat twelve half-built ones every time.

**Finished means:** deployed at a URL somebody can open, a README that explains it, tests for the part that matters, and no `TODO: fix this` in the main path.

If it is not live, it does not count - a repository is a claim, and a running deployment is evidence. [The deployment guide](/blogs/deploy-your-portfolio-project) covers doing that for free.

## Scope it so you finish

The reason projects die is scope, not difficulty.

**Pick the smallest version that still has the hard part in it.** A URL shortener with click counts, no user accounts, no custom domains, no dashboard. The hard part - collision-free codes and cheap counting - is fully present in that version, and it is a weekend rather than a month.

**Write the README first.** Describe what it does and what it will not do, before you write code. It takes twenty minutes and it is the single most effective scope control there is, because the moment you start writing "it will also..." you can see how much you just added.

**Set a deadline and ship whatever exists.** A deployed, smaller thing is worth more than a perfect unshipped thing, and it is worth more than the same thing three weeks later.

## What to write down while you build

The interview is not about the code; it is about the decisions. Keep a file - `DECISIONS.md`, three lines each:

```text
Chose cursor pagination over offset because the feed changes between
page loads and offset was duplicating items. Cost: cannot jump to
page N, which this UI does not need.
```

That is an interview answer, written down at the moment you actually understood it rather than reconstructed six months later under pressure. Those notes become the architecture-decisions section of your README, and they are what turns a project on your CV into a project you can be interviewed about.

[The portfolio guide](/blogs/software-engineering-portfolio-guide) covers presenting the finished set, and [the GitHub profile guide](/blogs/github-profile-software-engineer) covers the ten seconds before anybody opens a repository at all.
