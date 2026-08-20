# 01 - Content truth

**Serves:** definition of done 1, 2
**Blocks:** everything in `04-landing-composition.md`

> **STATUS: complete as of 2026-08-20**, except the testimonials question (WEB-2),
> which needs a decision only Niraj can make. The audit results and every verdict
> are recorded in `tasks.md` under WEB-1. This file is kept as the reasoning behind
> that work, not as an open to-do list.
>
> Two findings the audit added that were not predicted here: the FAQ described a
> different product entirely (nine answers about courses, lessons and videos), and
> the "Earn credits by merging PRs" claim was unreachable because the opensource
> module has tables but no route.

## The finding

The landing page renders a `StudioSection` selling a notes product with spaced
repetition and inline code execution. There is no Studio in the app. The route is
gone:

```
apps/main/app/(main)/  ->  ai  home  knowme  mock  pathfinder  practice
                           profile  projects  purchase  r  settings  transactions
```

`studios` is not in that list. `apps/main/app/(main)/studios` does not exist.

That is the headline case, and it is the reason this file is first in the plan.
It is not a copy-tone problem. A visitor who reads the landing page, signs up, and
goes looking for the notes app with spaced repetition finds nothing, and the most
expensive moment in the funnel is the one right after they trusted the pitch.

## The audit

Everything below was read out of the repo, not inferred. Each row needs a decision
before any section is restyled.

| section | claim on the site | reality | action |
|---|---|---|---|
| `studio-section` | "Spaced repetition built-in", "Run snippets in 40+ languages directly in your notes", "Auto-generate tests from your notes" | Studio module removed from the app | **Delete the section.** Not rewrite - there is no adjacent true claim |
| `assessments-section` | "Skill Certification" | No certification exists anywhere in the product | Delete the claim |
| `assessments-section` | "Learn by deploying real code in cloud-based sandboxes" | TRUE - `apps/shipitworker` runs a real Linux container per execution | Keep. This is a genuinely strong differentiator and is currently undersold |
| `assessments-section` | "Curated roadmaps designed by Senior Engineers, not content creators" | Unverified. Who designed them? | Research: name the source or delete |
| `featuressection` | "AI that adjusts problem difficulty based on your real-time performance metrics" | Unverified against the practice module | Research: find the adaptive-difficulty code or delete the claim |
| `featuressection` | "Detailed analytics on your coding velocity, error rates, and algorithmic efficiency" | Unverified | Research against `practice` + `get_my_practice_stats` |
| `projects-section` | Project cards: "Realtime Collab Editor", "Distributed Rate Limiter" | Are these real generated projects or invented examples? | Research. If invented, label as examples or replace with real ones |
| `projects-section` | Any collaboration/team framing | Projects were **stripped to a single user** (`cfdb356`). Members, invitations, leaderboards and feature suggestions were dropped in migration `0011` | Remove every multiplayer implication |
| `testimonials-section` | Named testimonials | Unverified. Are these real people who agreed? | **Research, and treat as blocking.** Fabricated testimonials are not a design problem |
| `pricing-section` | Prices and inclusions | Must match `packages/pricing` and `lib/credits/pricing.ts` | Reconcile against code, not memory |
| `faqs` | Answers | Every answer is a claim | Audit each against the same standard |

Also worth checking while in here: the blog cross-links. Posts link to sibling
posts by design (`/blogs/<slug>`, never product routes), so they are lower risk -
but any post body that describes a product feature is subject to the same rule.

## The research protocol - not optional

Every content task in `tasks.md` has a research step, and the build step is
blocked until it is done. The protocol is deliberately boring:

**For a product claim.** Find the route, the action or the table that implements
it. Write the path into the task as evidence. If the search comes back empty, the
claim is deleted - "we might build it" is not a reason to keep selling it. Check
`srs/core-modules/README.md`, which is explicit that everything outside projects
and pathfinder is out of scope for the current narrowing.

**For a number.** Find where it came from. A metric with no query behind it does
not ship. If it is a real query, write the query into the task so it can be re-run
when the number is refreshed.

**For a testimonial.** A name, a real person, and evidence they consented to be
quoted. Anything short of that is deleted. This one has legal weight in a way the
others do not, and "it is obviously placeholder" stops being obvious the moment
the site is live.

**For a competitor claim** (needed for the Compare page in `02-navigation.md`).
Every statement about a competitor must be checkable against something they
publish, dated, with the source URL recorded next to the claim. A comparison table
that overstates is a comparison table that gets screenshotted.

**For anything about the roadmap.** Say it is coming, or do not mention it. Never
present an unbuilt thing in the present tense. This is the specific failure mode
that produced the Studio section.

## Why this is the first file

The temptation is to start with the visible work - the navbar, the hero, the
sections that look dated. Every one of those is wasted effort if the section it
restyles is about to be deleted, and the audit above already deletes at least one
whole section and part of two more.

There is also an ordering benefit: once the true feature set is written down, the
landing page's argument becomes obvious. It is hard to decide which gurukul
components to port while the list of things the product actually does is still in
dispute.
