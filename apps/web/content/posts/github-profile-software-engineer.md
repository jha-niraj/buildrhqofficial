A technical recruiter who clicks your GitHub gives it about ten seconds. In that time they see your profile README if you have one, your pinned repositories, and your contribution graph. Everything else on the page is below the fold or ignored.

So the whole optimisation is: make those three things say something. Most profiles say nothing, not because the person has done nothing, but because the good work is on page two behind eleven forks and a repository called `test`.

## The profile README

GitHub renders `README.md` from a repository named the same as your username at the top of your profile. [GitHub's documentation](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme) covers the setup, which takes two minutes.

Almost nobody has one, which is why having a good one is disproportionately effective.

What a good one contains:

```markdown
# Your Name

Backend engineer. Python and Go, mostly distributed systems and data pipelines.
Currently building [Splitwise-for-Trips](https://trips.example.com) - multi-currency
expense settlement in the fewest possible transfers.

**Recent things I have written or built**
- [Rate limiter as a service](link) - token bucket in Redis, fails open
- [CI runner](link) - one container per run, streamed logs
- [Why our pagination was duplicating rows](link) - a post about cursors

Reach me: [email] | [LinkedIn] | [portfolio]
```

Three to five sentences, then links. That is it.

**What to leave out:** a wall of technology badges that takes fifteen seconds to load, an animated GIF, "I am currently learning..." with six items, visitor counters, and trophy widgets. They all take vertical space from the thing you want read and none of them tell a reader anything they could not infer from your repositories.

The badge wall in particular is worth naming, because it is close to universal on student profiles. Twenty-five logos for every technology you have touched compresses to "this person has heard of things" in a reader's mind. Three sentences saying what you build compresses to a person.

## Pinned repositories

You get six. Use fewer if you have fewer good ones - four strong pins beat six where two are weak.

**Pin only finished, deployed work.** [The deployment guide](/blogs/deploy-your-portfolio-project) covers making that true.

**Do not pin:** tutorial follow-alongs, anything named `learning-x` or `x-practice`, coursework unless it is genuinely substantial, and forks you have not meaningfully contributed to.

**Order them deliberately.** The first pin is the one that gets clicked. Make it the one with the most interesting hard part, not the most recent.

Each pinned repository needs a **description** - the one-line field at the top right of the repository page. It shows on the pin card and most people leave it blank, which turns a card into a filename. "Multi-currency expense settlement, minimum transfers" is a description. "My project" is not.

Add the deployed URL to the repository's website field too. It appears on the card as a link.

## What a repository has to have

Somebody clicking through from a pin decides in another ten seconds. [The portfolio guide](/blogs/software-engineering-portfolio-guide) covers the README structure in full; the short version is that the top of the file needs to answer three questions before any scrolling:

1. **What does it do?** One sentence, no jargon.
2. **Where can I see it?** A live link, in the first three lines.
3. **What was hard about it?** Two or three sentences on a decision you made and the alternative you rejected.

That third one is what separates a junior portfolio from a mid-level one, and it is the section almost nobody writes. Anyone can list a stack. "I chose cursor pagination over offset because the feed changes between page loads and offset was duplicating rows" is an engineer talking.

Add a screenshot or a short GIF near the top if the project has a UI. It costs one image and it means a reader who does not click the demo still sees the thing.

## The contribution graph

Consistency reads better than volume. Two commits a day for three months looks like someone who works on things; fifty commits over one weekend and then nothing looks like someone who did an assignment.

That said, do not game it. Automated daily commits to a `daily-commit` repository are obvious, and getting caught doing it is worse than an empty graph.

**If your graph is empty**, that is the thing to fix, and the fix is doing real work rather than manufacturing green squares. Contributing to open source is one of the more reliable ways to fill it with things that also stand up to inspection - [the open-source guide](/blogs/open-source-contribution-beginners) covers finding a first issue, and [turning contributions into a hiring signal](/blogs/open-source-for-your-resume) covers what to do with them afterwards.

**If your work is on a private or company account**, enable private contribution counts in settings. The graph fills in without exposing anything.

## Tidying up

You do not have to delete anything. Two lighter options:

**Archive** old repositories. They stay visible, get a banner marking them as archived, and read as deliberately retired rather than abandoned.

**Make private** the ones that are genuinely just practice. `hello-world`, half-finished tutorials, the repository you made to test git.

The one thing worth actually deleting: anything with a secret in the history that you have not rotated. And rotate the secret regardless, because deleting the repository does not un-scrape it.

## Commit messages, because they are visible

An interviewer who is interested will look at your commit history. It is one of the few places they can see how you work rather than what you produced.

`fix`, `update`, `asdf`, `final`, `final2` tell a story about someone who does not think of commits as communication. Full sentences describing what changed and why tell the opposite one.

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) is one reasonable format and there are others; the format matters much less than the habit. If you want the underlying reasoning, [the Git book](https://git-scm.com/book/en/v2) has a section on it.

## A twenty-minute pass

1. Create the profile README repository, write three sentences and your links.
2. Pin four to six finished, deployed projects, best first.
3. Add a description and a website URL to each pinned repository.
4. Add a live link to the top of each README, and an architecture-decisions section.
5. Archive anything abandoned; make practice repositories private.
6. Enable private contribution counts if your real work is elsewhere.

That is most of the value on the page. Beyond it, the returns fall off sharply - and the effort is much better spent on [finishing another project](/blogs/portfolio-project-ideas-software-engineer) than on decorating the ones you have.
