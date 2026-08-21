When you click apply, your resume goes into an applicant tracking system, and what happens next is more boring and more mechanical than the folklore suggests. There is no AI reading your resume for potential. There is a parser turning your PDF into fields, a search index, and a human running queries against it.

Understanding that sequence changes what you optimise, and it eliminates most of the advice you have been given.

## What actually happens

**1. Your file is parsed into fields.** The ATS tries to extract name, contact details, work history with dates, education, and skills. This is the step that fails, and it fails silently.

**2. The extracted text is indexed.** Searchable, keyword by keyword.

**3. A recruiter runs a search.** Something like `python AND kubernetes AND "3 years"`, filtered by location and graduation year. You appear in those results or you do not.

**4. A human skims what came back.** Six to eight seconds per resume, in a list view.

**5. Some employers apply knockout questions** - work authorisation, years of experience, willingness to relocate. These are filled in by you on the application form, not read from your resume.

Note what is missing: nothing in that pipeline scores your resume for quality, and nothing rejects it for being "only 60% matched". That number, where it exists, is a sorting aid for the recruiter, not a gate.

## The myths worth dropping

**"AI reads your resume and decides."** Overwhelmingly, no. The system parses and indexes; a person decides. Most rejections at this stage are a recruiter looking at a list, not a model rejecting you.

**"You need to hit a match percentage."** Some systems compute one. It is a hint in a recruiter's UI, and it is not a threshold your application has to clear.

**"White text keyword stuffing works."** It does not, and it is worth being clear about why: the text is extracted whether or not it is visible, so a human reading the parsed output sees a paragraph of hidden keywords. That is not a clever trick that sometimes fails; it is a thing that reads as dishonest when found, and it is found routinely.

**"A creative resume stands out."** It does, in the wrong direction. A two-column layout with skill bars and icons is the single most common cause of catastrophic parsing, and the person you were trying to impress with the design never sees the design - they see the extracted text.

## Where it really goes wrong: parsing

This is the failure that actually costs people interviews, and it is invisible from your side. You submit a resume that looks good, and the system stores something like this:

```text
EXPERIENCE                     SKILLS
Senior Engineer  Acme  Python  Docker  React
2022-Present  ●●●●○  ●●●○○  ●●●●●
What I Have Built
Responsible for backend development and
various infrastructure improvements
```

The columns interleaved, the proficiency dots became noise, and "What I Have Built" is not a header the parser recognises so nothing under it got filed as work experience. Every keyword is technically in the index and none of the *structure* survived, so you do not appear in a search for "Senior Engineer" because the system does not know you were one.

The fixes are unglamorous and they work:

**Single column. Always.** No exceptions for an application you care about.

**Standard section headers.** "Work Experience", "Education", "Skills", "Projects". Not "Where I Worked", not "My Toolkit".

**Standard fonts and a real PDF.** Text-based, not an exported image. If you cannot select the text in a PDF reader, neither can the parser.

**No tables, text boxes, headers or footers.** Contact details in a header are a classic way to lose your own phone number.

**Dates in a consistent format**, `Jan 2022 - Present`, on the same line as the role.

[The full ATS guide](/blogs/ats-resume-software-engineer) covers the format end to end.

## Keywords, done honestly

Recruiters search for the words in the job description. That is the entire mechanism, and it means the useful move is vocabulary matching rather than keyword stuffing.

**Use their word for the thing you did.** If the posting says "distributed systems" and you built something distributed, write "distributed systems". If it says "CI/CD" and you set up GitHub Actions, say both.

**Spell out and abbreviate at least once.** "Amazon Web Services (AWS)" covers a search for either.

**Put technologies where they will be found:** in the skills section as a plain list, and in the bullets where you used them. A technology that appears only in a graphic does not exist.

**Do not add things you have not used.** The interview establishes this quickly, and it establishes it in front of you.

The honest version of this advice is narrower than the internet's version: match the vocabulary of things you genuinely did. That is most of the available benefit.

## The six seconds after

Passing the parse gets you into the list. A human then skims, and skimming has its own rules.

**The top third does the work.** Name, one-line summary, most recent role. If that does not say what you are, the rest is not read.

**Lead each bullet with the outcome.** A skimmer reads the first few words of each line. "Cut p95 latency 380ms to 210ms by..." survives that; "Worked on performance improvements including..." does not. [Resume bullet points for software engineers](/blogs/software-engineer-resume-bullet-points) covers the shape.

**Numbers stop the eye.** They are the only thing in a wall of text that is visually distinct, and they are the reason a quantified bullet outperforms a vague one even before anybody reads it.

**One page early in your career.** Two is acceptable with five or more years. Three is not read.

## Where tools genuinely help

An ATS-score tool is useful for exactly one thing: showing you **what a parser extracts from your file**. That is a factual answer to a question you cannot otherwise check, and it is where the value is.

Treat the score itself as noise. Different tools give different numbers for the same file, none of them is the system you are applying through, and optimising a number that no employer sees is a way to spend an evening.

The genuinely useful loop is: run your resume through a parser, read the extracted text, and fix anything that came out wrong or missing. If the extraction is clean and complete, you have solved the ATS problem, and everything after that is about the human.

## What to actually do

1. Single column, standard headers, real text PDF.
2. Run it through a parser and read the output as text. Fix what is mangled.
3. Match the posting's vocabulary for things you genuinely did.
4. Lead every bullet with an outcome and a number.
5. Keep it to one page early on.
6. Then stop optimising for the machine, because the machine was never the hard part.

The last line is the one worth keeping. The parse is a hurdle with a known height and a known technique for clearing it. Everything that decides whether you get the job happens after it, with a person, and that is where the remaining effort belongs - starting with [the technical phone screen](/blogs/technical-phone-screen-guide), which is the next thing between you and an offer.
