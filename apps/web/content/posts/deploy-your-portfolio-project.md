A portfolio project that is not deployed is a claim. A deployed one is evidence. The difference is not effort - modern hosting is free at this scale and the deploy takes an afternoon - it is that most people never do it, which is exactly why doing it separates you.

This is how to get a project live, what "live" has to mean for it to count, and the three things that most commonly go wrong.

## Why a repository link is not enough

Nobody opening your GitHub is going to clone your repository, install your dependencies, provision a database and run it. Not a recruiter, and not the engineer doing your interview loop either. They have ten minutes and four other candidates.

A live URL is the difference between "I built this" and "here, look". It also proves several things at once that a repository does not: that it runs outside your machine, that you handled configuration, that you dealt with a real database, and that you finished.

## What "deployed" has to mean

Not every deployment counts. The bar:

**It loads for a stranger.** No VPN, no local database, no "you need to run the seed script first".

**It has data in it.** An empty app is worse than no app. Seed it with realistic data so somebody can see what it does within five seconds of arriving.

**It does not require an account to see anything.** Put a demo login on the landing page, or make the main view public. A sign-up wall in front of a portfolio project means nobody sees the project.

**It stays up.** A free tier that cold-starts in thirty seconds is fine. One that has been down for a month is worse than not linking it.

## Where to host what, for free

The right answer depends on the shape of the app, and the main mistake is reaching for a platform that does not fit it.

| What you built | Where it fits |
|---|---|
| Static site or SPA | [Cloudflare Pages](https://developers.cloudflare.com/pages/), GitHub Pages, Netlify |
| Next.js / SvelteKit / Nuxt | [Vercel](https://vercel.com/docs/deployments), Cloudflare, Netlify |
| Node or Python API | Fly.io, Render, Railway, Cloudflare Workers |
| Anything needing Postgres | Neon, Supabase, Railway - all have real free tiers |
| Redis | Upstash |
| Background jobs | The same host as your API, or a Cloudflare Worker with a cron trigger |
| Static-first content site | [Astro](https://docs.astro.build/en/getting-started/) on any static host |

Free tiers change. Check the current limits before you commit, and prefer a host whose free tier does not require a card if you are a student - the ones that do have a habit of charging for something you did not notice.

## The three things that go wrong

### 1. Secrets in the repository

This is the one that actually hurts, and it happens to people who know better.

**Never commit `.env`.** Add it to `.gitignore` before your first commit, not after. Commit a `.env.example` listing every key with a comment about what it is for and no values.

If you have already pushed a secret: **rotate it**. Deleting the file does not help - it is in the history, and history is public. Assume anything ever pushed to a public repository has been scraped, because automated scanners find committed keys within minutes.

Every host has an environment-variable settings page. That is where the values go.

### 2. Hardcoded localhost

Works perfectly on your machine, breaks the moment it is deployed:

```js
// This is the bug.
const API = "http://localhost:3000"

// This is the fix.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
```

The same applies to database URLs, CORS origins, redirect URIs and anything else with a host in it. [The Twelve-Factor App](https://12factor.net/) is the canonical statement of why configuration belongs in the environment; its config section is worth the five minutes.

Watch out for the build-time versus runtime distinction. In most frontend frameworks, anything prefixed for the client is **inlined at build time** - setting it on the host afterwards changes nothing that has already been compiled. If a URL is wrong in the browser and right on the server, this is almost always why.

### 3. The database that was only ever on your laptop

Your local Postgres is not coming with you. You need a hosted one, a connection string in an environment variable, and a way to create the schema on the remote database.

Have a migration command that runs against the deployed database, and run it as part of the deploy rather than by hand at 2am. Then seed it, because an empty app is the failure mode from the top of this article.

## A deployment checklist

Before you put the link on your resume:

1. Open it in a private window. Does it work with no cached session?
2. Open it on a phone. Is it usable, or does it scroll sideways?
3. Is there data in it?
4. Can somebody see the main feature without signing up?
5. Does the README link to it, at the top?
6. Is there a `.env.example` and no `.env`?
7. Does a hard refresh on a deep route work, or does it 404? (Classic SPA routing bug.)
8. Is HTTPS on? Every host on the list above does this automatically.
9. Do the images load? (Relative paths that worked locally often do not.)
10. What happens if the database is down - a clear error, or a stack trace with your connection string in it?

Number ten is worth doing deliberately. A stack trace in production is an information leak and it is a bad look on a project you are showing to engineers.

## Custom domain, or not

A domain costs about the price of a coffee per year and it makes a real difference to how a link reads on a resume. `trips.yourname.dev` looks like something you own; `trips-final-v2-git-main-username.vercel.app` looks like something you generated.

Every host on the list supports a custom domain on the free tier. If you are buying one anyway for your portfolio site, subdomains are free and unlimited - use one per project.

Not essential. Cheap enough that it is usually worth it.

## Keep it running

**Set up an uptime check.** Free tiers exist and they tell you when something has been down for a week, which is otherwise a thing you find out during an interview.

**Watch for a free tier expiring.** Some hosts sleep or delete inactive projects. Know your host's policy so a link on your resume does not quietly die in month four.

**Pin your dependencies.** A project that stopped building because a transitive dependency shipped a breaking change is a project you cannot redeploy when you need to.

## After it is live

Put the link in three places: the top of the README, your [GitHub profile](/blogs/github-profile-software-engineer), and your resume next to the project.

Then check it works from a device that is not yours. Every so often somebody puts a link on a resume that only resolves inside their home network, and they find out in the worst possible way.

Deployment is the cheapest signal in a portfolio and the one most people skip. [The project ideas guide](/blogs/portfolio-project-ideas-software-engineer) covers what to build; this is the twenty percent of the work that makes anyone believe you built it.

## Making a free tier survive a recruiter clicking it

Free hosting has behaviours that are fine for you and bad for a stranger arriving from your
resume.

**Cold starts.** Many free tiers sleep after inactivity and take 20 to 50 seconds to wake.
A recruiter will not wait. Two mitigations: pick a host whose free tier does not sleep for
your most important project, or put a static landing page in front that loads instantly and
explains what is loading.

**Free-tier databases that pause.** Several managed Postgres providers suspend an inactive
database. The app then throws a connection error rather than being slow, which is worse.
Check your provider's policy and know what the first request after a pause does.

**Bandwidth and build minutes.** Rarely an issue at portfolio scale, but worth knowing your
limits so a project does not go dark in month four without you noticing.

**A health check.** A free uptime monitor pinging the site every few minutes both tells you
when it breaks and, as a side effect, keeps some hosts awake. This is the single highest
value fifteen minutes in this article.

## Handling errors like it is production

An interviewer clicking your demo and getting a stack trace has learned something, and it
is not what you wanted.

**Never leak internals.** A 500 page should say something went wrong. The stack trace,
query and connection string go to your logs. This is basic and it is missing from most
portfolio projects, which is exactly why doing it is noticed.

**Have an empty state.** What does the app look like with no data? "Nothing here yet" with
a way to create something beats a blank rectangle, and a blank rectangle is what a demo
usually shows on first load.

**Handle the third-party being down.** If you call an external API, what happens when it
times out? A spinner forever is the common answer and it is the wrong one.

**Set a page title and a favicon.** Free, thirty seconds, and "localhost:3000" in a browser
tab on a live site is the kind of detail that makes a careful reader wonder what else was
left.

## The README is part of the deployment

A deployed project with a bad README is half-finished. The top of the file, before any
scrolling, needs:

1. What it does, one sentence, no jargon
2. **The live link**, in the first three lines
3. A screenshot or short GIF if it has a UI
4. The stack, as a short list
5. Architecture decisions - two or three, with the alternative you rejected

Point 5 is what separates a junior portfolio from a mid-level one and it is the section
almost nobody writes. "Chose cursor pagination over offset because the feed changes between
page loads and offset was duplicating rows" is an engineer talking; a stack list is not.

Keep a `DECISIONS.md` while you build, three lines per decision, written at the moment you
understood it. It becomes that section, and it means you are not reconstructing your own
reasoning six months later in an interview.

## After the first deploy

Deploying once is not the point; being able to redeploy is.

**Automate it.** Every host on the list deploys on push to main. Set that up on day one -
manual deploys stop happening, and a project you cannot redeploy is a project you cannot
fix when somebody reports it broken.

**Pin your dependencies.** A lockfile committed, and a build that works today working in
six months. Projects that will not build any more are a common and avoidable way to lose a
portfolio piece.

**Check it from a device that is not yours.** Every so often somebody puts a link on a
resume that only resolves inside their own network, and they find out during an interview.
