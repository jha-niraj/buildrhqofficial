A resume bullet point should say what you did, how you did it, and what changed as a result. Most bullets on most software engineering resumes say only the first, and they say it in a voice that sounds like a job description rather than a person: "Responsible for backend development."

Nobody was ever hired for being responsible for something. This is how to write the other kind.

## The formula

**Action verb + what you built + how + measurable outcome.**

Before:

```text
Responsible for improving database performance
```

After:

```text
Cut p95 API latency from 380ms to 210ms by adding composite indexes
and a Redis cache-aside layer for the three hottest endpoints
```

The second one is longer, and that is fine. It contains four things a recruiter and an engineer both want: a specific outcome, real numbers, named technologies, and enough shape that an interviewer can ask a follow-up question. The first contains none of them and cannot be asked about at all.

That last property matters more than people realise. Your resume is the agenda for the first fifteen minutes of your interview. A bullet nobody can ask a question about is a bullet that does no work.

## Where to find numbers when you think you have none

This is the objection every time: "I do not have metrics."

You almost certainly do. You need credible estimates, not audited figures.

**Scale.** How many users did the product have? Requests per day? Rows in the biggest table? "Serving 40,000 daily active users" is a number.

**Time.** How long did the thing take before, and after? Build times, deploy times, page loads, query times, how long a manual process took before you automated it.

**Volume.** How many services, endpoints, components, tests, or records? "Migrated 12 services to containerised deploys" is a number.

**Frequency.** Deploys per week, incidents per month, PRs reviewed.

**Money, if you know it.** Infrastructure cost before and after is the strongest kind, and engineers frequently have this figure and never think to use it.

For a student or a personal project, the same applies at a smaller scale. "Handles 500 concurrent WebSocket connections on a single 512MB instance" is a real, checkable, interesting number, and it is more persuasive than "built a real-time chat app" because it says you measured something.

**Estimating is allowed. Inventing is not.** "Roughly 40%" that you can defend with "we were at about 380ms and got to about 210ms" is honest. A precise-looking number you cannot explain is a trap, because the follow-up question is always "how did you measure that?"

## Verbs that carry information

The verb is doing more work than people give it credit for. Some verbs describe a decision; some describe attendance.

| Weak | Stronger | Why |
|---|---|---|
| Worked on | Built, Designed, Implemented | Says what you actually did |
| Helped with | Led, Owned, Drove | Says what was yours |
| Responsible for | Maintained, Operated, Ran | Describes an activity, not a title |
| Used React to | Built with React | The subject is the thing you made |
| Improved | Cut, Reduced, Increased by X | Improvement without a quantity is an opinion |
| Involved in | Contributed, Shipped | Attendance is not a contribution |

Avoid "utilised" entirely. It is "used" wearing a suit, and it makes the whole document read as if it were written to impress rather than to inform.

## Three bullets, rewritten

**A backend project**

```text
Before: Made a REST API for a shopping app using Node.js
After:  Built a REST API in Node and Postgres for a 2,000-product
        storefront, adding cursor pagination and a composite index
        that took the catalogue query from 1.2s to 90ms
```

**An open-source contribution**

```text
Before: Contributed to open source projects
After:  Fixed a race condition in <project>'s cache invalidation that
        caused stale reads under concurrent writes; added a regression
        test and the PR was merged in four days
```

**A team project**

```text
Before: Worked with a team of 4 on a college project
After:  Led the API design for a 4-person capstone, defining the
        contract in OpenAPI before implementation so the frontend
        and backend could be built in parallel
```

Notice what the third one does. "Team of 4" says nothing about you. "Led the API design ... so they could be built in parallel" says what your contribution was and why it mattered, which is the entire question a team-project bullet has to answer.

## Length and shape

**One to two lines each.** Three is a paragraph, and paragraphs on a resume do not get read.

**Three to five bullets for a recent role**, two to three for older ones. Your last job gets the most space; a role from four years ago gets one line about the biggest thing.

**Lead with the outcome where you can.** "Cut deploy time from 25 to 4 minutes by containerising 12 services" puts the interesting part first. A skimmer reading only the first four words of each line still gets your best material.

**No full stops needed**, but be consistent. Half with, half without, reads as carelessness.

## The mistakes that cost you the screen

**Listing technologies with no context.** "Python, Docker, AWS" in a bullet tells a reader nothing about what you did with them. The skills section is for the list; bullets are for what you built.

**Describing the team's work as yours.** Interviewers ask follow-ups, and "we" collapses fast under a specific question. Write what you personally did.

**Claiming ownership of an architecture you followed.** "Designed a microservices architecture" is a very large claim for a six-month internship, and it will be tested.

**Formatting that a parser cannot read.** Two-column layouts, skill bars, icons and tables get flattened into gibberish by applicant tracking systems, and the bullets you wrote carefully never get extracted at all. [The ATS resume guide](/blogs/ats-resume-software-engineer) covers what a parser actually sees, and it is worth reading before you spend an evening on wording.

## Tailoring without rewriting

A bullet can be true and still be the wrong bullet for a specific job. If a posting emphasises data pipelines and your best bullet is about a React component, your best bullet is not helping you.

Reorder rather than rewrite. Move the relevant experience up. Use the posting's own vocabulary where it genuinely matches what you did - if they say "distributed systems" and you built something distributed, say "distributed", because both the parser and the human are matching on it.

What tailoring is not: adding things you did not do. The interview will find out, and it will find out in front of you.

## A checklist

Run each bullet through this:

1. Does it start with a verb that describes a decision?
2. Does it contain a number, or explain why it cannot?
3. Does it name the technology, specifically?
4. Could an interviewer ask a follow-up question about it?
5. Is it something *you* did, in a way that survives "tell me more about that"?
6. Is it under two lines?

Bullets that fail 4 are the ones to cut. If nobody can ask you about it, it is taking up space that a bullet they could ask about should have.

Once the bullets are right, the rest of the document is mostly formatting and ordering - [the ATS guide](/blogs/ats-resume-software-engineer) covers that, and [the cover letter guide](/blogs/software-engineer-cover-letter) covers the other document, which is a different job with different rules.

## Bullets for people with no professional experience

The advice above assumes a job. Most of it transfers, and the parts that do not have direct
substitutes.

**A personal project** gets the same treatment as a role, with the scale numbers coming
from what you built rather than from a company:

```text
Weak:   Built a chat application using React and Socket.io
Better: Built a real-time chat app handling 500 concurrent WebSocket
        connections on a single 512MB instance; switched from polling
        to WebSockets after measuring 40x fewer requests at the same
        message rate
```

The second one says you measured something, which is the thing employers are actually
uncertain about with a candidate who has no job history.

**Coursework** counts if it was substantial and you say what was yours. "Built the parser
and type checker for a compiler course project, 4,000 lines of OCaml" is real. "Completed
coursework in compilers" is a transcript entry.

**A hackathon** is worth one line, and the line should be about what you built rather than
whether you placed. Nobody knows how competitive that hackathon was.

**Open source** is the strongest of the four because it is verifiable - see
[turning contributions into a hiring signal](/blogs/open-source-for-your-resume) for how to
present it, and note the rule there: merged only.

What does not work: listing technologies you have "learned", padding with soft skills, or
inflating a two-week tutorial into a project. All three are transparent to a reader who has
seen a thousand of these, and the last one is transparent in an interview.

## Ordering, which does more than wording

Two resumes with identical bullets perform very differently depending on order, because a
six-second skim reads top to bottom and stops.

**Most relevant first, within each role.** Not chronological, not most recent - most
relevant to the job you are applying to. Your Kubernetes bullet goes first for an infra
role and third for a frontend one.

**Strongest bullet first overall.** Whatever is most impressive should be in the top third
of the page, because that is what gets read.

**Sections in order of what you are selling.** With a job: Experience, Projects, Skills,
Education. Without one: Projects, Open Source, Skills, Education, Experience. A student who
puts Education first has spent the most valuable space on the least differentiating thing -
everyone applying has a degree.

## Cutting

Most resumes are one page of good material and one page of filler. The filler is usually:

- Bullets about routine responsibilities that every engineer has
- Anything from more than about eight years ago, in detail
- "Proficient in Microsoft Office"
- An objective statement saying you are seeking a challenging role
- Soft-skill claims with nothing behind them

The test for any bullet: **would I be happy to spend five interview minutes on this?** If
not, it is taking space from something you would. Cutting a weak bullet is a net gain even
if nothing replaces it, because it raises the average of what remains.
