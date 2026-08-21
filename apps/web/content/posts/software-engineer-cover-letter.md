Most engineering cover letters get skimmed for three seconds and discarded, and the reason is always the same: they restate the resume in prose. The recruiter already has the resume. A letter that says "I have five years of experience in React and Node.js" is telling them something they read ninety seconds ago in a more scannable format.

A cover letter is only worth writing when it can say something the resume structurally cannot. That is a narrow but real set of situations, and when you are in one, the letter does real work.

## When to Bother

**Write one when:**

- You are changing careers, and the resume raises an obvious "why is a physiotherapist applying for this?"
- There is a gap, a short tenure, or a layoff that will otherwise be guessed at
- You are applying to a startup or small team, where a human reads every application
- You are underqualified on paper but have a specific, defensible reason to be considered
- The application explicitly asks for one, or asks a question in place of one
- You have a genuine, specific connection to the company or product

**Skip it when:**

- It is a large company with a structured pipeline and the field is optional
- You have nothing specific to say and would be writing filler
- You are applying to a role that matches your resume exactly, at scale

That last case is worth being blunt about. If you are sending twenty applications this week to roles you cleanly match, your time is better spent [tailoring each resume to the job description](/blogs/ats-resume-software-engineer) and chasing referrals than writing twenty letters nobody will open.

Before the cover letter matters at all, the resume has to survive the parser and the six-second skim - [what actually happens after you click apply](/blogs/ai-resume-screening-explained) covers that pipeline.

## The Structure

Four paragraphs. Under 250 words total. That is not a stylistic preference - it is the length that actually gets read.

**Paragraph 1 - the specific hook (2-3 sentences).** Why this company, concretely. Not "I admire your innovative culture."

**Paragraph 2 - proof (3-4 sentences).** One thing you have built or done that is directly relevant, with a result.

**Paragraph 3 - the gap or the angle (2-3 sentences).** The thing the resume cannot explain. If there is no such thing, this paragraph is the second-strongest piece of proof instead.

**Paragraph 4 - close (1-2 sentences).** Short. No begging.

This is roughly the structure Harvard Business Review has [recommended for years](https://hbr.org/2014/02/how-to-write-a-cover-letter), and it holds up because it front-loads the only two things a reader cares about: why you, and why here.

## Paragraph 1: The Part Everyone Gets Wrong

The opening line determines whether the rest is read.

> **Weak:** "I am writing to apply for the Senior Software Engineer position at Acme Corp, which I found on LinkedIn."

They know. It says so in the subject line.

> **Strong:** "I read your engineering post on cutting p99 latency by moving session state out of Postgres, mostly because I spent last quarter doing the opposite and regretting it. I am applying for the Senior Backend Engineer role."

The second version proves ten minutes of research and gives the reader a reason to keep going. It is also unfakeable at scale, which is the point.

Where to find the hook, in order of usefulness:

1. **Their engineering blog.** Most companies above about thirty engineers have one. Two posts gives you a specific technical reference. If you cannot find theirs, the [engineering-blogs directory](https://github.com/kilimchoi/engineering-blogs) indexes several hundred of them.
2. **Their public repos.** If they maintain open source, having actually used it is a strong opener.
3. **A product decision you have an opinion about.** As a user, not a flatterer.
4. **A specific problem in their domain you have worked on.**
5. **A person.** If you have talked to someone there, name them in the first line.

## Paragraph 2: One Thing, With a Number

The temptation is to summarise your career. Do not. Pick the single most relevant thing and go one level deeper than the resume bullet did.

> "At my current company I own the billing service. Last year invoice generation was failing for roughly a quarter of accounts because of an N+1 query in a nightly job; I instrumented it, batched the query, and rolled it out behind a flag with a two-night parallel run. Late invoices went to zero and support stopped fielding morning complaints. The job description mentions consolidating three payment integrations, which is the same shape of problem."

The last sentence is the one doing the work. It connects your evidence to their stated need, which is the entire function of a cover letter.

## Paragraph 3: Address the Thing

Do not let the reader speculate. Whatever the awkward part of your application is, name it in one sentence and move immediately to the mitigation.

**Career change:**
> "I spent six years as a mechanical engineer before moving into software eighteen months ago. What transferred was reading systems that already exist and finding where they fail - which is most of what I do now."

**Employment gap:**
> "I took nine months out in 2025 for family reasons. During it I contributed to [project], including [specific PR], which is how I learned the codebase this role touches."

**Underqualified on paper:**
> "The listing asks for five years and I have three. I have owned this service end to end for two of them, including its on-call rotation, which is the part I would expect to be tested on."

**Layoff:**
> "My role was cut in the January reduction along with most of the platform team. My manager, [name], has offered to speak to that if useful."

Straightforward beats defensive every time. Recruiters see all of these constantly; what they react badly to is evasion.

## Paragraph 4: Stop

> "Happy to talk through any of this. My resume and a couple of relevant projects are attached."

That is enough. No "I would be thrilled for the opportunity to contribute to your dynamic team."

## Full Example: New Graduate

> Hi [Name],
>
> I have been using [Product] since my second year of university, and the thing that made me apply was the changelog entry about rebuilding the diff view - I had actually complained about the old one to a friend the week before.
>
> I am finishing a CS degree this June. The most relevant thing I have built is a self-hosted analytics tool that ingests and aggregates about two million events a day for a student society site, which forced me to learn a lot about batching and time-series storage the hard way. It is deployed, it has tests, and the write-up of what I got wrong is in the README.
>
> I have not worked full-time as an engineer yet. What I do have is eleven merged pull requests to [open source project], including one that fixed a race condition in their retry logic - so I have been through code review with people who had no reason to be gentle.
>
> Happy to talk any time. Code and resume attached.

Under 200 words. Specific, honest about the gap, and every claim is checkable.

## Full Example: Career Changer

> Hi [Name],
>
> Your post on migrating from a monolith without a freeze window is the reason I am applying - I spent last year doing a similar migration on a much smaller system and got most of the sequencing wrong in ways your post would have prevented.
>
> I moved into software two years ago from six years in logistics operations. Since then I have been a backend engineer at [Company], where I own our order pipeline - about 40,000 orders a day, and the domain knowledge from the previous career has been more useful than I expected.
>
> The obvious question is the career change. The short answer is that I spent six years being the person who found out why the numbers were wrong, and eventually wanted to fix the systems rather than the spreadsheets.
>
> Would be glad to talk. Resume attached.

## Using AI Without It Being Obvious

Recruiters read hundreds of applications a week and the generated-letter register is now instantly recognisable. Certain constructions - "I am particularly drawn to", "your innovative approach to", "I would be thrilled to leverage my skills" - actively count against you, because they signal that no thought went in.

The way to use AI here is as an editor, not an author:

- Write the ugly first draft yourself, including the specific details. Those are the part AI cannot invent.
- Ask it to cut the word count by a third. This is what it is genuinely good at.
- Ask it what a skeptical hiring manager would push back on.
- Rewrite the output in your own words, because the register will still be wrong.

The rule of thumb: if a model could have written the letter without knowing anything about you, it is not worth sending. More generally, [the same principle applies to AI across your job search](/blogs/ai-tools-developers-2025) - it is good at compression and terrible at substance.

## Format and Delivery

- **Plain text in the application field** if there is one. Do not attach a PDF when a textarea is offered.
- **PDF only if it must be a file.** Same header as your resume, name and contact at the top.
- **Address a person if you can find one.** "Hi Sarah" beats "Dear Hiring Manager". "To Whom It May Concern" reads as 1998.
- **No date line, no physical address blocks.** This is not a letter.
- **Proofread the company name.** Sending a letter with the previous company's name in it is the most common and most fatal error in the entire exercise.

## The Honest Summary

A great cover letter will not rescue a weak application, and most of the leverage in a job search sits elsewhere - a resume that survives keyword filtering, a referral, and being early in the cycle. [New-grad hiring in particular runs on timing and referrals](/blogs/new-grad-software-engineer-jobs) far more than on letters.

But when you are the non-obvious candidate - the career changer, the person with the gap, the one applying slightly above their level - the letter is the only place you get to control the narrative before someone else fills it in. In those cases, twenty minutes and 250 words is a very good trade.

---

*ShipItHQ's AI cover letter tool works from your actual experience and the specific job description rather than a template, so the output still sounds like you. [Try it free](/pricing).*
