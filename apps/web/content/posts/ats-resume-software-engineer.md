You spent 4 hours writing a resume, tailored it to the job description, and submitted it to 30 companies. You heard back from two. The other 28 never even had a human read your application.

That is not rejection. That is an ATS filter.

Applicant Tracking Systems are software that companies use to store and search resumes before a human reads them. Essentially every large employer runs one, and most mid-sized ones do too. Understanding exactly how they work is the difference between getting interviews and disappearing into a queue.

## What ATS Software Actually Does

The name "Applicant Tracking System" is accurate but incomplete. ATS software does three things that matter for candidates:

**1. Parses your resume into structured data**
When you upload a PDF or Word document, the ATS does not read it like a human. It tries to extract structured information: your name, contact details, employment history, education, and skills. This parsing process is where most resumes fail. Columns, tables, headers in text boxes, and graphics confuse parsers and can cause critical information to be missed entirely.

**2. Scores your resume against the job description**
After parsing, the ATS compares your resume content against the job description using keyword matching. It looks for exact matches, synonyms, and related terms. A senior software engineer role requiring "Kubernetes experience" might match "k8s" or "container orchestration" depending on the system's sophistication.

**3. Ranks and surfaces candidates to recruiters**
This is the step most commonly misunderstood. The popular story is that the ATS auto-rejects you below some score. In reality, the major platforms - [Greenhouse](https://www.greenhouse.io/), [Lever](https://www.lever.co/), [Workday](https://www.workday.com/) and [iCIMS](https://www.icims.com/) between them cover most of the market - mainly parse, store and make your application *searchable*. The recruiter then filters and searches it.

That distinction matters because it changes the failure mode. You are rarely rejected by a robot. You are far more often never surfaced: parsed badly so your experience is missing, or missing the exact terms the recruiter typed into the search box. Recruiters start at the top of the resulting list and stop when they have enough candidates, so being invisible to that search is functionally equivalent to never applying.

The critical insight: your resume must be readable by a machine before a human ever sees it.

## Why Good Engineers Have Bad ATS Scores

The most technically skilled engineers often have the worst-performing resumes. Here is why:

**They use creative formatting.** Two-column layouts, skill bars, icons, tables, and fancy headers look great to humans and are nearly invisible to ATS parsers. The parser tries to read left-to-right, top-to-bottom. A two-column resume often gets its columns merged, producing gibberish.

**They use non-standard section headers.** ATS systems look for "Work Experience," "Education," and "Skills." They often fail to recognize "What I Have Built," "Where I Worked," or "My Toolkit." Use standard section names.

**They list skills generically.** Writing "proficient in various programming languages" means nothing to an ATS. Writing "Python, TypeScript, Go, Java" matches exactly what the job description is asking for.

**They describe responsibilities instead of outcomes.** "Responsible for backend development" does not match the keywords in a job description that says "designed and implemented REST APIs." Specificity matters for both human readers and keyword matching.

**What the parser sees.** Here is the same experience entry twice. The first is a
two-column layout with a skills bar and an icon; this is what the extracted text looks
like after the parser has flattened it:

```text
BEFORE - what the ATS extracted
EXPERIENCE                     SKILLS
Senior Engineer  Acme  Python  Docker  React
2022-Present  ●●●●○  ●●●○○  ●●●●●
What I Have Built
Responsible for backend development and
various infrastructure improvements
```

The columns merged, the job title and the skills interleaved, the proficiency dots became
noise, and "What I Have Built" is not a section header the parser recognises. Nothing in
there is a usable field.

```text
AFTER - single column, standard headers
Work Experience

Senior Software Engineer
Acme Corp | Jan 2022 - Present
- Designed and implemented REST APIs in Python and FastAPI serving 40M requests/day
- Cut p95 latency 380ms to 210ms by adding composite indexes and a Redis cache-aside layer
- Migrated 12 services to Docker and Kubernetes, reducing deploy time from 25 to 4 minutes

Skills
Languages: Python, TypeScript, Go, SQL
Infrastructure: Docker, Kubernetes, AWS, Terraform
```

Same person, same job. The second one parses into fields, and every technology in it is an
exact keyword match against the job description.

## The ATS-Optimized Resume Format

Here is the format that parses correctly across every major ATS system:

### Font and Design

Use a single-column layout. Always. No exceptions for ATS submissions.

Use standard fonts: Arial, Calibri, Georgia, Times New Roman, or Helvetica. Fancy fonts (Montserrat, Playfair Display) may not render correctly in all parsers.

Font size: 10-12pt for body text, 14-16pt for your name at the top.

File format: Submit as `.docx` unless the job explicitly asks for PDF. Most ATS systems parse Word documents more reliably than PDFs. If the application says "PDF preferred," use PDF.

Margins: 0.5-1 inch on all sides.

### Header

Your name, followed by one line with: city/region, phone, email, LinkedIn URL, GitHub URL, portfolio URL. No physical address required. No photo.

```
Jane Smith
San Francisco, CA | (415) 555-0100 | jane@example.com
linkedin.com/in/janesmith | github.com/janesmith | janesmith.dev
```

### Summary (Optional but Powerful)

A 2-3 sentence professional summary at the top is an opportunity to front-load the keywords from the job description. Do not write "passionate developer seeking opportunities." Write:

"Full-stack software engineer with 3 years of experience building distributed systems in Python and TypeScript. Specialized in building high-traffic APIs and data pipelines at scale. Seeking a backend engineering role at a product-focused company."

This immediately hits: software engineer, Python, TypeScript, distributed systems, APIs, backend - all common JD keywords.

### Work Experience

This is the most important section. Format each entry as:

```
Company Name                                    Month Year - Month Year
Job Title
City, State (or "Remote")

• Achievement using Action Verb + Metric + Context
• Achievement using Action Verb + Metric + Context
• Achievement using Action Verb + Metric + Context
```

The bullet format matters enormously. Start with a strong action verb. Include a quantifiable metric. Provide context.

**Bad bullet:** "Worked on improving application performance."

**Good bullet:** "Reduced API response time by 65% by migrating from synchronous database queries to Redis-cached async processing, reducing P99 latency from 800ms to 280ms."

The good version is a keyword goldmine: Redis, async processing, API, performance, latency - and the metric makes it credible and memorable to human reviewers.

## Keyword Strategy: Getting Past the Filter

The single most effective ATS optimization technique is tailoring your resume keywords to each job description.

Here is the process:

**Step 1: Copy the job description into a text document.**

**Step 2: Identify the required and preferred keywords.** Look for: programming languages, frameworks, tools, methodologies (Agile, CI/CD), and soft skill indicators (cross-functional collaboration, mentorship).

**Step 3: Check your resume against each keyword.** For every keyword you have experience with, confirm it appears in your resume. Add it if it is missing.

**Step 4: Use both the spelled-out version and the acronym.** Write "Continuous Integration / Continuous Deployment (CI/CD)" once so the ATS matches both forms.

**Step 5: Add a Skills section that explicitly lists technologies.** ATS systems often specifically scan a Skills section for exact-match keywords.

```
Skills
Languages:    Python, TypeScript, Go, SQL, Bash
Frameworks:   FastAPI, Next.js, React, Django, Express
Infrastructure: Docker, Kubernetes, Terraform, AWS, GCP
Tools:        PostgreSQL, Redis, Kafka, Elasticsearch, Git
```

Listing skills this way ensures every technology you know appears as an exact keyword match.

The wording of each bullet is its own skill, and it is where most of the remaining value is - [resume bullet points for software engineers](/blogs/software-engineer-resume-bullet-points) covers the formula and where to find numbers when you think you have none.

## The Metrics Problem

Most developers dramatically underutilize metrics in their resumes. You do not need to know precise numbers - you need credible estimates.

"Reduced database query time" is noise.
"Reduced database query time by ~40% by adding composite indexes" is a keyword-rich, memorable claim.

Where to find metrics for your experience:
- **Traffic/scale:** How many users did the product you worked on have? How many requests per second?
- **Performance improvements:** Before and after response times, error rates, memory usage
- **Team impact:** Lines of code in the feature you built, number of engineers it unblocked, PRs reviewed per week
- **Business impact:** Revenue impacted, customer churn reduced, support tickets decreased

If you have never worked at a company, you can still use metrics in project descriptions: "Built a REST API serving 500+ requests/day," "Reduced build time from 8 minutes to 90 seconds by optimizing Docker layer caching."

## What Recruiters Look at After the ATS Filter

Assuming your resume passes the ATS filter, it lands in front of a human for those 7 seconds. Here is what they actually scan:

**Job titles:** Do they match the role we are hiring for? A "Software Engineer" applying for "Senior Software Engineer" is different from a "Marketing Coordinator" applying for the same.

**Company names:** Not fairly, but honestly: recognizable company names get longer reads. If you have worked at or interned at a well-known company, make sure that is visible above the fold.

**Tenure:** Multiple jobs with less than a year tenure is a flag. One short stint is fine - it happens. Three in a row raises questions.

**Education:** For new grad roles, degree and university name matter. For experienced hires, education is much less important.

**The recency principle:** Your most recent job should take the most space. Do not give equal real estate to a job from 8 years ago and your current role.

## Resume Mistakes That Get You Filtered Out

**Objective statements from 2005.** "Seeking a challenging position where I can leverage my skills" tells recruiters nothing and takes up space. Replace with a modern professional summary or cut it entirely.

**Functional resume format.** This format puts skills up front and de-emphasizes experience chronology. ATS systems and most human recruiters dislike it because it obscures where and when you actually used your skills. Use reverse-chronological format.

**Including references available upon request.** Everyone knows references are available if asked. This line wastes space.

**Listing outdated or irrelevant technologies.** If you learned Flash ActionScript in 2008 and have not touched it since, take it off. A recruiter seeing it will question your judgment. Similarly, do not list Office 365 as a skill for an engineering role.

**Generic cover letters.** Many ATS systems collect cover letters alongside resumes. A generic "I am excited to apply for this role" wastes a significant opportunity. A tailored cover letter that speaks to a specific project or product the company has shipped signals you actually want this job specifically.

## Tailoring Takes 20 Minutes: Here Is How

Most developers submit the same resume to every job. The developers who get the most interviews submit a tailored resume to each application.

Tailoring does not mean rewriting from scratch. It means:
1. Swapping keywords in your skills section to match the JD
2. Adjusting your professional summary to emphasize the most relevant aspects of your background
3. Reordering bullets within jobs to lead with the most relevant experience for that specific role
4. Checking that every technology mentioned in the JD that you have experience with appears somewhere in your resume

This takes 15-20 minutes per application. ShipItHQ's AI resume builder does this automatically - you paste the job description and it tailors your resume bullets in place, flags missing keywords, and gives you an ATS score before you apply.

## One Last Thing: The Human Element

ATS optimization matters. It is a real filter with real consequences. But do not optimize so heavily for the machine that your resume becomes robotic.

Recruiters are humans. The best resumes have personality in the summary, specific and interesting project descriptions, and metrics that tell a real story. The goal is to pass the machine and then persuade the human.

Build a clean, single-column, keyword-rich resume. Tailor it to each role. Use the AI Resume Builder to check your ATS score before you submit. Then focus your energy on the work that actually gets you interviews: building real things and making your skills undeniable.
