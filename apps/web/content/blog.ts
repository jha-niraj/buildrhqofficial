import type { AuthorKey } from './authors'
import { ACTIVE_BLOG_SLUGS } from './active-posts'

// ─── Categories (topic hubs) ─────────────────────────────────────────────────
// Each key is also a real URL: /blogs/topics/<key>. Hubs give the cluster an
// internal-linking centre so authority collects somewhere instead of being spread
// evenly across seventeen orphan pages.

export const BLOG_CATEGORIES = {
    'interview-prep': 'Interview Prep',
    'career': 'Career',
    'resume': 'Resume & Applications',
    'dsa': 'DSA & Practice',
    'portfolio': 'Portfolio & Projects',
    'open-source': 'Open Source',
    'ai-tools': 'AI & Developer Tools',
} as const

export type BlogCategory = keyof typeof BLOG_CATEGORIES

export const BLOG_CATEGORY_KEYS = Object.keys(BLOG_CATEGORIES) as BlogCategory[]

/** Short intro copy for each topic hub page. Also used as the hub meta description. */
export const BLOG_CATEGORY_INTROS: Record<BlogCategory, string> = {
    'interview-prep': 'Behavioural rounds, system design, mock practice and the questions to ask back. Everything between the phone screen and the offer.',
    'career': 'Getting in, levelling up and staying employable - roadmaps, career ladders, placements and new-grad job hunting for software engineers.',
    'resume': 'Resumes, cover letters and applications that survive automated screening and get read by a human.',
    'dsa': 'Data structures, algorithms and where to actually practise them - study plans, problem lists and platforms worth your time.',
    'portfolio': 'Projects and portfolios that prove you can build, not just that you finished a tutorial.',
    'open-source': 'Finding a project, landing your first merged pull request, and turning contributions into a hiring signal.',
    'ai-tools': 'The AI tooling working engineers actually use, and how to use it without hollowing out your own skills.',
}

// ─── Post model ──────────────────────────────────────────────────────────────

export interface BlogPost {
    /** H1 / card title. */
    title: string
    /** <title> tag. Kept separate so it can be shorter and keyword-front-loaded. */
    pageTitle: string
    description: string
    category: BlogCategory
    author: AuthorKey
    datePublished: string
    dateModified: string
    /** Target search terms. Emitted as Article `keywords` and page `keywords`. */
    keywords: readonly string[]
    readingTime: number
    /** Rendered on-page and emitted as FAQPage JSON-LD. Aim for four. */
    faqs: readonly { q: string; a: string }[]
    /** Three hand-picked slugs. Drives the related-posts block and internal linking. */
    relatedSlugs: readonly string[]
    /** Scannable summary shown above the article body. */
    takeaways: readonly string[]
    featured?: boolean
}

export const BLOG_POSTS: Record<string, BlogPost> = {
    // ───────────────────────── Portfolio & Projects ─────────────────────────
    'software-engineering-portfolio-guide': {
        title: 'How to Build a Software Engineering Portfolio That Gets You Hired',
        pageTitle: 'Software Engineering Portfolio: What to Build & Show',
        description: 'A complete guide to building a software engineering portfolio from scratch - what to include, what to skip, and how to make a recruiter stop scrolling in a crowded market.',
        category: 'portfolio',
        author: 'niraj',
        datePublished: '2025-05-01',
        dateModified: '2026-07-30',
        keywords: ['software engineering portfolio', 'developer portfolio', 'portfolio projects for software engineer', 'github portfolio', 'web developer portfolio'],
        readingTime: 12,
        featured: true,
        takeaways: [
            'Three finished, deployed projects beat twelve half-built repos every time.',
            'A recruiter gives your portfolio under 30 seconds - lead with a live demo link, not a wall of text.',
            'Every project needs a README that explains the problem, the decisions, and the trade-offs you made.',
            'Clone projects are fine as practice, but only original problems differentiate you.',
        ],
        faqs: [
            { q: 'How many projects should a software engineering portfolio have?', a: 'Three strong projects is the sweet spot. Each should be deployed, documented, and something you can talk about for ten minutes. A long list of unfinished repos actively hurts you because it signals you do not ship.' },
            { q: 'Do I need a portfolio website or is GitHub enough?', a: 'GitHub alone is enough to get a first look, but a simple portfolio site converts better because it controls the narrative. It lets you lead with live demos and outcomes instead of file trees.' },
            { q: 'Are clone projects like a Netflix clone bad for a portfolio?', a: 'They are not disqualifying, but they are not differentiating either - hundreds of candidates have the same one. Use clones to learn a stack, then build one original project that solves a problem you personally have.' },
            { q: 'What should a project README contain?', a: 'A one-line description, a live demo link, a screenshot or GIF, the problem it solves, the architecture at a high level, and the trade-offs you made. Setup instructions come last, not first.' },
        ],
        relatedSlugs: ['open-source-contribution-beginners', 'ats-resume-software-engineer', 'new-grad-software-engineer-jobs'],
    },

    // ───────────────────────── Interview Prep ─────────────────────────
    'system-design-interview-prep': {
        title: 'System Design Interview Prep: The Complete Roadmap for CS Students',
        pageTitle: 'System Design Interview Prep: A Complete Roadmap',
        description: 'Everything you need to crack system design interviews - from fundamentals to scalability patterns, in a structured week-by-week plan that fits around a full-time job or degree.',
        category: 'interview-prep',
        author: 'niraj',
        datePublished: '2025-05-05',
        dateModified: '2026-07-30',
        keywords: ['system design interview', 'system design interview prep', 'system design roadmap', 'scalability interview', 'distributed systems interview'],
        readingTime: 14,
        featured: true,
        takeaways: [
            'System design is graded on your process, not on arriving at one correct architecture.',
            'Spend the first five minutes clarifying requirements - candidates who skip this almost always fail.',
            'Learn the five building blocks (load balancer, cache, queue, database, CDN) before memorising any case study.',
            'Estimate numbers out loud. Interviewers want to see you reason about scale, not recite it.',
        ],
        faqs: [
            { q: 'How long does it take to prepare for a system design interview?', a: 'Six to eight weeks of consistent study is realistic for a first system design loop, assuming five to seven hours a week. Engineers with production experience often need less because they have seen the failure modes already.' },
            { q: 'Do new grads get system design interviews?', a: 'Increasingly yes, though the bar is lower. New-grad system design rounds test whether you understand components and trade-offs, not whether you can design a globally distributed system.' },
            { q: 'What should I say in the first five minutes of a system design interview?', a: 'Ask clarifying questions: who the users are, expected scale, read/write ratio, latency expectations, and which features are in scope. Then state your assumptions out loud before drawing anything.' },
            { q: 'Is it bad to say "I do not know" in a system design interview?', a: 'No, as long as you follow it with how you would find out or reason toward an answer. Bluffing a wrong answer confidently is far worse than admitting a gap and working through it.' },
        ],
        relatedSlugs: ['mock-technical-interview-guide', 'dsa-study-plan-coding-interview', 'behavioral-interview-questions-software-engineer'],
    },

    'mock-technical-interview-guide': {
        title: 'Mock Technical Interviews: Practice That Actually Improves Performance',
        pageTitle: 'Mock Technical Interviews: A Practice Framework That Works',
        description: 'Why most technical interview practice is wasted effort - and the deliberate practice framework that takes engineers from freezing up to fluent in about four weeks.',
        category: 'interview-prep',
        author: 'niraj',
        datePublished: '2025-05-11',
        dateModified: '2026-07-30',
        keywords: ['mock interview practice', 'mock technical interview', 'technical interview practice', 'coding interview practice', 'how to practice for technical interviews'],
        readingTime: 12,
        takeaways: [
            'Solving problems silently is not interview practice - the performance is the skill being tested.',
            'Record yourself. Nearly every fixable weakness is obvious on playback and invisible in the moment.',
            'One mock per week with real feedback beats five unstructured sessions.',
            'Practise the failure case: what you do when you are stuck is what actually gets graded.',
        ],
        faqs: [
            { q: 'How many mock interviews should I do before a real one?', a: 'Four to six full-length mocks is enough for most candidates to stop freezing. What matters more is that each one is followed by a review where you identify one specific thing to change.' },
            { q: 'Are AI mock interviews as good as practising with a human?', a: 'They are better for volume, consistency and immediate feedback on structure and communication. Human mocks are still better for reading ambiguity and pushback. Most candidates should use AI mocks for reps and humans for calibration.' },
            { q: 'What should I do when I get stuck in a technical interview?', a: 'Say what you are thinking, state what you have ruled out, and propose a brute-force solution to establish a baseline. Silence is the only genuinely bad option.' },
            { q: 'Should I practise coding on a whiteboard or in an editor?', a: 'Practise in whatever medium the real interview uses. Most companies now use a shared editor without autocomplete, so practising in a full IDE builds a dependency you will not have on the day.' },
        ],
        relatedSlugs: ['star-method-interview-software-engineers', 'system-design-interview-prep', 'leetcode-alternatives'],
    },

    'star-method-interview-software-engineers': {
        title: 'The STAR Method for Software Engineers: Answer Any Behavioural Question',
        pageTitle: 'STAR Method Interview Guide for Software Engineers',
        description: 'The STAR method explained for engineers, with full worked answers to the behavioural questions that actually come up in software interviews - and the mistakes that make good stories land badly.',
        category: 'interview-prep',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['star method interview', 'star interview method', 'star method examples', 'behavioural interview software engineer', 'star technique interview answers'],
        readingTime: 13,
        featured: true,
        takeaways: [
            'STAR is Situation, Task, Action, Result - and Result is the part almost everyone drops.',
            'Spend roughly 10% on Situation, 10% on Task, 60% on Action, 20% on Result.',
            'Say "I", not "we". Interviewers are grading your contribution, not your team\'s.',
            'Six prepared stories cover almost every behavioural question you will be asked.',
            'Quantify the result even when the number is unglamorous - "cut deploy time from 40 to 12 minutes" beats "improved things".',
        ],
        faqs: [
            { q: 'What does STAR stand for in interviews?', a: 'Situation, Task, Action, Result. You set the context, state what you were responsible for, describe what you specifically did, then close with the measurable outcome. The final step is the one candidates most often skip.' },
            { q: 'How long should a STAR answer be?', a: 'Between 90 seconds and two minutes. Under a minute usually means you skipped the Action detail; past three minutes interviewers stop tracking the story and start waiting for you to finish.' },
            { q: 'How many STAR stories should I prepare?', a: 'Six well-chosen stories covering conflict, failure, leadership, a technical deep dive, a tight deadline and an ambiguous problem will map onto almost any behavioural question with light reframing.' },
            { q: 'Can I use the same STAR story for more than one question?', a: 'Yes. Within a single interview loop use each story once, but reusing a story across different rounds is normal and expected. Adjust which part you emphasise to match the question being asked.' },
        ],
        relatedSlugs: ['behavioral-interview-questions-software-engineer', 'questions-to-ask-interviewer-software-engineer', 'mock-technical-interview-guide'],
    },

    'behavioral-interview-questions-software-engineer': {
        title: '30 Behavioural Interview Questions for Software Engineers (With Real Answers)',
        pageTitle: 'Behavioural Interview Questions for Software Engineers',
        description: 'The 30 behavioural questions that actually come up in software engineering interviews, what each one is really testing, and worked answers you can adapt to your own experience.',
        category: 'interview-prep',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['behavioral interview questions software engineer', 'software engineer behavioral interview', 'behavioural questions developers', 'tell me about yourself software engineer', 'engineering culture fit interview'],
        readingTime: 15,
        takeaways: [
            'Behavioural rounds are not a formality - they are where most senior candidates get rejected.',
            'Every question maps to a small set of traits: ownership, collaboration, judgement, and how you handle being wrong.',
            '"Tell me about a failure" is testing whether you can be honest, not whether you have failed.',
            'Prepare stories, not answers. Questions vary; the underlying material does not.',
        ],
        faqs: [
            { q: 'Do behavioural interviews matter for software engineers?', a: 'They matter enormously, especially from mid-level upwards. Many companies weight the behavioural round equally with technical rounds, and it is a common reason otherwise strong candidates are rejected.' },
            { q: 'What is the best way to answer "tell me about yourself" as a software engineer?', a: 'Give a 90-second arc: where you are now, one or two things you have built that matter, and why this role is the logical next step. It is a positioning statement, not a biography.' },
            { q: 'How do I answer "tell me about a time you failed" without hurting my chances?', a: 'Pick a real failure with real consequences, own your part in it without blaming teammates, and spend most of the answer on what you changed afterwards. Interviewers are testing self-awareness, not looking for a perfect record.' },
            { q: 'Should I prepare answers word for word?', a: 'No. Memorised answers sound rehearsed and collapse under follow-up questions. Prepare the beats of each story - context, your action, the outcome - and let the wording vary.' },
        ],
        relatedSlugs: ['star-method-interview-software-engineers', 'questions-to-ask-interviewer-software-engineer', 'mock-technical-interview-guide'],
    },

    'questions-to-ask-interviewer-software-engineer': {
        title: 'Questions to Ask Your Interviewer (And What the Answers Actually Reveal)',
        pageTitle: 'Questions to Ask the Interviewer as a Software Engineer',
        description: 'The questions strong engineering candidates ask at the end of an interview, what a good answer sounds like, and the red flags that should make you think twice about an offer.',
        category: 'interview-prep',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['questions to ask interviewer software engineer', 'questions to ask at end of interview', 'reverse interview questions', 'what to ask hiring manager engineering', 'engineering interview red flags'],
        readingTime: 10,
        takeaways: [
            'The questions you ask are scored. "No, I think you covered everything" is a weak signal.',
            'Ask about process and reality, not perks - on-call, code review, how work gets prioritised.',
            'Match the question to the interviewer: engineers get technical questions, managers get team questions.',
            'Vague answers about deployment frequency or on-call load are the most reliable red flag there is.',
        ],
        faqs: [
            { q: 'How many questions should I ask at the end of an interview?', a: 'Two or three well-chosen questions is right for a 45-minute round. Prepare five or six so you are not stranded when earlier conversation has already covered some of them.' },
            { q: 'Is it bad to ask about salary in a technical interview?', a: 'It is not bad, but the technical round is the wrong venue. Compensation belongs with the recruiter or hiring manager, where it will not eat into time you could use to learn about the work.' },
            { q: 'What questions reveal the most about engineering culture?', a: 'Ask how long it takes for a one-line change to reach production, what the on-call rotation looks like, and how the team decided what to build this quarter. The specificity of the answers tells you more than the answers themselves.' },
            { q: 'What are red flags in an interviewer\'s answers?', a: 'Not being able to name a recent deploy, describing on-call vaguely, "we are like a family", and long pauses when asked about work-life balance. Any of these deserve a follow-up question.' },
        ],
        relatedSlugs: ['behavioral-interview-questions-software-engineer', 'star-method-interview-software-engineers', 'new-grad-software-engineer-jobs'],
    },

    // ───────────────────────── DSA & Practice ─────────────────────────
    'dsa-study-plan-coding-interview': {
        title: 'The 3-Month DSA Study Plan to Crack Any Coding Interview',
        pageTitle: '3-Month DSA Study Plan for Coding Interviews',
        description: 'A week-by-week DSA study plan for students and working engineers preparing for technical interviews - arrays through dynamic programming, with the right problem list at each stage.',
        category: 'dsa',
        author: 'niraj',
        datePublished: '2025-05-12',
        dateModified: '2026-07-30',
        keywords: ['dsa study plan', 'dsa roadmap', 'data structures and algorithms plan', 'coding interview preparation', 'leetcode study plan'],
        readingTime: 15,
        featured: true,
        takeaways: [
            'Pattern coverage beats problem count - 150 problems across 15 patterns outperforms 500 random ones.',
            'Do not start with dynamic programming. It is the last topic, not the first.',
            'Re-solve problems you got wrong after a week. First-pass solving builds recognition, not recall.',
            'Two focused hours a day for three months is enough for most interview loops.',
        ],
        faqs: [
            { q: 'How many LeetCode problems do I need to solve for interviews?', a: 'Around 150 to 200 problems chosen to cover the common patterns is enough for most companies. Candidates who grind 500 problems without tracking patterns typically do worse than those who do 150 deliberately.' },
            { q: 'How long does it take to prepare DSA from scratch?', a: 'Three months at roughly two focused hours a day is realistic if you already know one language well. Starting from no programming experience, plan on six months.' },
            { q: 'Which topics matter most for coding interviews?', a: 'Arrays and hashing, two pointers, sliding window, binary search, trees, graphs and heaps cover the large majority of questions. Dynamic programming appears often but is rarely the deciding factor at entry level.' },
            { q: 'Should I use Python or my main language for interviews?', a: 'Use the language you are fastest in, unless the role explicitly requires another. Python is popular in interviews because it minimises syntax overhead, but a fluent Java or C++ candidate should not switch weeks before a loop.' },
        ],
        relatedSlugs: ['leetcode-alternatives', 'mock-technical-interview-guide', 'system-design-interview-prep'],
    },

    'leetcode-alternatives': {
        title: 'LeetCode Alternatives: 12 Better Ways to Practise for Coding Interviews',
        pageTitle: 'LeetCode Alternatives: 12 Platforms Worth Your Time',
        description: 'LeetCode is not the only way to prepare, and for some interview formats it is the wrong one. Twelve alternatives compared by what they are actually good at, and when to use each.',
        category: 'dsa',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['leetcode alternative', 'leetcode alternatives', 'coding practice sites', 'best coding interview platforms', 'sites like leetcode'],
        readingTime: 12,
        takeaways: [
            'LeetCode optimises for algorithmic puzzles - it does not prepare you for take-homes, debugging rounds or system design.',
            'Match the platform to the interview format you are actually facing.',
            'Free tiers are enough for the large majority of candidates.',
            'Reading other people\'s solutions is a legitimate practice mode and badly underused.',
        ],
        faqs: [
            { q: 'Is LeetCode still worth it?', a: 'Yes, for companies that run algorithmic screens - which is still most large tech employers. It just should not be your only preparation, because it does not cover take-homes, debugging rounds or design interviews.' },
            { q: 'What is the best free alternative to LeetCode?', a: 'Codeforces for algorithmic depth, Exercism for language fluency with human mentorship, and NeetCode for a structured pattern-first path through the classic problem set. All three have substantial free tiers.' },
            { q: 'Which platform is best for practising system design?', a: 'System design is poorly served by problem grinders. Structured written case studies plus mock sessions where you have to defend decisions out loud work far better than any problem list.' },
            { q: 'How do I practise for take-home assignments?', a: 'Build small, complete projects under a real time limit - four hours, scoped, tested, with a README. The skill being tested is judgement about scope and quality bars, which no algorithm site trains.' },
        ],
        relatedSlugs: ['dsa-study-plan-coding-interview', 'mock-technical-interview-guide', 'software-engineering-portfolio-guide'],
    },

    // ───────────────────────── Resume & Applications ─────────────────────────
    'ats-resume-software-engineer': {
        title: 'ATS Resume Guide for Software Engineers: Beat the Bots, Get Interviews',
        pageTitle: 'ATS Resume Guide for Software Engineers',
        description: 'How applicant tracking systems actually work, what they really filter out, and exactly how to format a software engineering resume so a human ever sees it.',
        category: 'resume',
        author: 'niraj',
        datePublished: '2025-05-09',
        dateModified: '2026-07-30',
        keywords: ['ats resume', 'ats resume checker', 'software engineer resume', 'applicant tracking system resume', 'resume format for software engineer'],
        readingTime: 13,
        featured: true,
        takeaways: [
            'Most ATS platforms do not auto-reject you - recruiters filter by keyword search, which is a different failure mode.',
            'Single column, standard headings, no text inside images or tables.',
            'Mirror the exact wording of the job description for skills you genuinely have.',
            'One page until roughly eight years of experience, then two at most.',
        ],
        faqs: [
            { q: 'Do applicant tracking systems automatically reject resumes?', a: 'Rarely. Most systems parse your resume and let recruiters search and filter it. The real failure is being parsed badly or missing the keywords a recruiter searches for, so you never appear in their results.' },
            { q: 'What resume format is most ATS-friendly?', a: 'A single-column layout with standard section headings, a common font, no text inside images, tables or headers, and a PDF export generated from real text rather than a scan.' },
            { q: 'Should I include a skills section on a software engineer resume?', a: 'Yes. It is the section recruiters keyword-search most. List technologies you can actually be interviewed on, grouped simply, without proficiency bars or star ratings.' },
            { q: 'How long should a software engineer resume be?', a: 'One page for students and engineers with under about eight years of experience. Two pages is acceptable beyond that, but a padded two-page resume reads worse than a tight one-page one.' },
        ],
        relatedSlugs: ['software-engineer-cover-letter', 'new-grad-software-engineer-jobs', 'software-engineering-portfolio-guide'],
    },

    'software-engineer-cover-letter': {
        title: 'The Software Engineer Cover Letter That Actually Gets Read',
        pageTitle: 'Software Engineer Cover Letter: Templates & Examples',
        description: 'Most engineering cover letters are ignored because they restate the resume. Here is the structure that gets read, with full examples for new grads, career changers and senior engineers.',
        category: 'resume',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['software engineer cover letter', 'cover letter for developer', 'cover letter examples software engineering', 'how to write a cover letter developer', 'tech cover letter template'],
        readingTime: 11,
        takeaways: [
            'A cover letter is only worth writing if it says something your resume cannot.',
            'Four short paragraphs, under 250 words. Nobody reads more than that.',
            'Open with a specific reason you want this company, not "I am writing to apply for".',
            'Generic AI-written letters are now easy to spot and actively count against you.',
        ],
        faqs: [
            { q: 'Do software engineers still need cover letters?', a: 'For most large-company applications they are optional and rarely read. They matter disproportionately for startups, career changers, and any role where you need to explain a gap or an unusual background.' },
            { q: 'How long should a software engineer cover letter be?', a: 'Under 250 words, in four short paragraphs. Anything longer will be skimmed at best, and length is not read as effort.' },
            { q: 'Should I use AI to write my cover letter?', a: 'Use it to draft and tighten, not to generate wholesale. Recruiters see hundreds of the same AI-generated phrasing each week, and an obviously templated letter is worse than no letter at all.' },
            { q: 'What should the first line of a cover letter be?', a: 'A specific, verifiable reason you are applying to this company in particular - a product decision you admire, a technical blog post they published, a problem in their domain you have worked on.' },
        ],
        relatedSlugs: ['ats-resume-software-engineer', 'new-grad-software-engineer-jobs', 'behavioral-interview-questions-software-engineer'],
    },

    // ───────────────────────── Career ─────────────────────────
    'how-to-become-a-software-engineer': {
        title: 'How to Become a Software Engineer: The Realistic Path',
        pageTitle: 'How to Become a Software Engineer: A Realistic Path',
        description: 'A realistic, step-by-step path into software engineering - degree or not, what to learn in what order, how long it actually takes, and what the entry-level market looks like now.',
        category: 'career',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['how to become a software engineer', 'software engineer career', 'become a developer without a degree', 'software engineer requirements', 'how long to become a software engineer'],
        readingTime: 14,
        featured: true,
        takeaways: [
            'You do not need a CS degree, but you do need what a CS degree provides: fundamentals, projects, and a network.',
            'Twelve to twenty-four months of consistent work is the honest timeline for job-readiness.',
            'Depth in one stack beats shallow familiarity with six.',
            'The entry-level market is harder than it was in 2021 - proof of work matters more than credentials.',
        ],
        faqs: [
            { q: 'Can I become a software engineer without a degree?', a: 'Yes, and many working engineers have. Without a degree you carry more of the burden of proof, which in practice means shipped projects, open source contributions, and a referral network doing the work a degree would otherwise do.' },
            { q: 'How long does it take to become a software engineer?', a: 'Twelve to twenty-four months of consistent, structured effort is the realistic range for someone starting from scratch and working at it seriously part-time. Bootcamp marketing claims of three months describe the classroom, not employability.' },
            { q: 'Which programming language should I learn first?', a: 'Python or JavaScript for most people. Both have enormous job markets, gentle syntax, and huge learning ecosystems. The specific choice matters far less than picking one and going deep.' },
            { q: 'Is software engineering still a good career?', a: 'Yes, though entry-level is genuinely more competitive than it was during the 2021 hiring boom. Demand for engineers who can work effectively with AI tooling and reason about systems remains strong.' },
        ],
        relatedSlugs: ['full-stack-developer-roadmap', 'software-engineer-career-path', 'new-grad-software-engineer-jobs'],
    },

    'full-stack-developer-roadmap': {
        title: 'The Full Stack Developer Roadmap',
        pageTitle: 'Full Stack Developer Roadmap: What to Learn & When',
        description: 'A no-nonsense full stack developer roadmap - what to learn, in what order, what to safely ignore, and how to tell when you are actually ready to apply for jobs.',
        category: 'career',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['full stack developer roadmap', 'full stack roadmap', 'how to become a full stack developer', 'full stack developer skills', 'web development roadmap'],
        readingTime: 15,
        featured: true,
        takeaways: [
            'Learn HTML, CSS and JavaScript properly before any framework. Skipping this is the most common and most expensive mistake.',
            'One frontend framework, one backend runtime, one database. Add nothing until you have shipped with those.',
            'Databases and HTTP are the two areas self-taught developers are consistently weakest in.',
            'You are ready to apply when you can build and deploy a full CRUD app with auth from an empty folder.',
        ],
        faqs: [
            { q: 'How long does it take to become a full stack developer?', a: 'Around twelve to eighteen months of consistent part-time study for someone starting from scratch. The frontend half typically takes less time than most people expect and the backend half more.' },
            { q: 'Should I learn frontend or backend first?', a: 'Frontend first, because the feedback loop is visual and immediate, which sustains motivation. Once you can build interfaces, backend concepts like APIs and databases have somewhere concrete to attach to.' },
            { q: 'Do I need to learn TypeScript?', a: 'Yes, for essentially any modern JavaScript job. Learn plain JavaScript first so you understand what TypeScript is adding, then switch - most professional codebases you will join are TypeScript.' },
            { q: 'Is full stack development still in demand?', a: 'Yes, particularly at startups and mid-sized companies where one engineer owning a feature end to end is more valuable than deep specialisation. Large companies still tend to hire for one side or the other.' },
        ],
        relatedSlugs: ['how-to-become-a-software-engineer', 'software-engineering-portfolio-guide', 'software-engineer-career-path'],
    },

    'software-engineer-career-path': {
        title: 'The Software Engineer Career Path: From Intern to Staff Engineer',
        pageTitle: 'Software Engineer Career Path: Levels Explained',
        description: 'What each software engineering level actually expects of you, how promotion really works, and the honest trade-offs between the management track and the staff engineer track.',
        category: 'career',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['software engineer career path', 'software engineer levels', 'senior software engineer requirements', 'staff engineer vs engineering manager', 'engineering career ladder'],
        readingTime: 13,
        takeaways: [
            'Levels are defined by scope of ownership, not years served or technical difficulty.',
            'The jump from mid-level to senior is about owning ambiguity, not writing better code.',
            'Promotion follows demonstrated behaviour at the next level - you operate there first, then get the title.',
            'Management is a different job, not a promotion from engineering.',
        ],
        faqs: [
            { q: 'How long does it take to become a senior software engineer?', a: 'Typically five to eight years, though it varies widely by company and how much ownership you have been given. Time served is necessary but not sufficient - senior is about scope, not tenure.' },
            { q: 'What is the difference between a staff engineer and an engineering manager?', a: 'Both operate at similar organisational scope, but a staff engineer drives outcomes through technical direction and influence while a manager drives them through people, hiring and process. They are parallel tracks, not a hierarchy.' },
            { q: 'Do I have to go into management to keep progressing?', a: 'No. Most established engineering organisations now maintain an individual contributor ladder to staff, principal and beyond. Smaller companies often do not, which is a real reason engineers change jobs.' },
            { q: 'What actually gets you promoted as a software engineer?', a: 'Consistently operating at the next level before you hold the title, and having someone senior able to point to specific evidence of it. Documenting your own impact is not self-promotion, it is a prerequisite.' },
        ],
        relatedSlugs: ['how-to-become-a-software-engineer', 'new-grad-software-engineer-jobs', 'questions-to-ask-interviewer-software-engineer'],
    },

    'new-grad-software-engineer-jobs': {
        title: 'How to Land a New Grad Software Engineer Job in a Hard Market',
        pageTitle: 'New Grad Software Engineer Jobs: How to Land One',
        description: 'The entry-level engineering market is genuinely tough right now. Here is where new grad roles actually get filled, when to apply, and what separates the candidates who get offers.',
        category: 'career',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['new grad software engineer jobs', 'entry level software engineer', 'graduate software engineer roles', 'how to get first developer job', 'junior developer job search'],
        readingTime: 12,
        takeaways: [
            'New grad pipelines open in August and September and fill before most students start applying.',
            'Referrals convert several times better than cold applications - and asking for one is normal.',
            'Twenty tailored applications beat two hundred generic ones.',
            'Mid-sized companies hire more new grads than the household names and get a fraction of the applicants.',
        ],
        faqs: [
            { q: 'When should new grads start applying for software engineering jobs?', a: 'August and September of your final year for roles starting the following summer. Many large new-grad programmes close applications by October, well before most students have begun looking.' },
            { q: 'How many applications does it take to get a new grad offer?', a: 'There is no reliable number, but quality dominates volume. Candidates who tailor twenty applications and pursue referrals consistently outperform those sending hundreds of untargeted ones.' },
            { q: 'Are internships required to get a new grad job?', a: 'Not required, but they are the single strongest signal available to you, and many new-grad roles are filled by returning interns. Without one, shipped projects and open source contributions have to carry that weight.' },
            { q: 'How do I ask a stranger for a referral?', a: 'Send a short, specific message naming the role, one sentence on why you are a fit, and your resume. Make it easy to say yes and easy to ignore. A low response rate is normal and not personal.' },
        ],
        relatedSlugs: ['campus-placement-preparation-guide', 'ats-resume-software-engineer', 'software-engineering-portfolio-guide'],
    },

    'campus-placement-preparation-guide': {
        title: 'Campus Placement Preparation: A Complete Guide for CS Students',
        pageTitle: 'Campus Placement Preparation Guide for CS Students',
        description: 'A structured campus placement preparation plan - aptitude, DSA, core subjects, group discussion and the HR round - with a realistic timeline that fits around your semester.',
        category: 'career',
        author: 'niraj',
        datePublished: '2026-07-30',
        dateModified: '2026-07-30',
        keywords: ['placement preparation', 'campus placement preparation', 'placement preparation for cse students', 'campus recruitment preparation', 'how to prepare for placements'],
        readingTime: 14,
        takeaways: [
            'Start six months before your placement season, not six weeks.',
            'Aptitude rounds eliminate more candidates than coding rounds do - and they are the easiest to fix.',
            'Core subjects (OS, DBMS, networks, OOP) come up in almost every interview and are widely under-prepared.',
            'Projects you can explain in depth beat projects that sound impressive.',
        ],
        faqs: [
            { q: 'When should I start preparing for campus placements?', a: 'Six months before your placement season at minimum. A common split is three months on DSA and aptitude, two on core subjects and projects, and one on mock interviews and revision.' },
            { q: 'How important is CGPA for campus placements?', a: 'It matters mainly as a filter - many companies set a cutoff around 6.5 or 7.0 and never look at it again after shortlisting. Clearing the cutoff matters; the difference between 7.5 and 8.5 rarely does.' },
            { q: 'What core subjects are asked in placement interviews?', a: 'Operating systems, DBMS, computer networks and object-oriented programming are asked in the large majority of interviews. Candidates over-prepare DSA and consistently under-prepare these.' },
            { q: 'How do I prepare for the HR round of a campus placement?', a: 'Prepare four or five structured stories about your projects, teamwork and setbacks, and be able to answer why this company specifically. The HR round is rarely a formality and does eliminate candidates.' },
        ],
        relatedSlugs: ['dsa-study-plan-coding-interview', 'new-grad-software-engineer-jobs', 'star-method-interview-software-engineers'],
    },

    // ───────────────────────── Open Source ─────────────────────────
    'open-source-contribution-beginners': {
        title: 'How to Get Your First Open Source Pull Request Merged',
        pageTitle: 'Open Source for Beginners: Your First Merged PR',
        description: 'A step-by-step playbook for your first meaningful open source contribution - finding the right project, choosing an issue, and getting the pull request actually merged.',
        category: 'open-source',
        author: 'niraj',
        datePublished: '2025-05-07',
        dateModified: '2026-07-30',
        keywords: ['open source contribution', 'first open source pull request', 'open source for beginners', 'good first issue', 'how to contribute to open source'],
        readingTime: 11,
        takeaways: [
            'Start with projects you already use - context is the hardest part of contributing, and you already have it.',
            'Read CONTRIBUTING.md before writing any code. Most rejected PRs break a documented rule.',
            'Documentation and test contributions are real contributions and the fastest route to a first merge.',
            'Comment on the issue and get maintainer buy-in before you start work.',
        ],
        faqs: [
            { q: 'How do I find a good first open source issue?', a: 'Filter by the "good first issue" and "help wanted" labels on projects you already use. GitHub\'s own issue search across labels is the most efficient starting point, and familiarity with the tool matters more than the label.' },
            { q: 'Do open source contributions help you get hired?', a: 'They can, because they are public evidence of how you write code, respond to review and communicate in a real codebase. A handful of substantive merged PRs is worth more than a long list of trivial ones.' },
            { q: 'What if my pull request gets rejected?', a: 'It is routine and not a judgement of you. Ask what would need to change, make the change if it is reasonable, and move on if the maintainer has decided against the direction.' },
            { q: 'How long does it take to get a first PR merged?', a: 'Anywhere from a day to several weeks, depending entirely on maintainer availability. Commenting on the issue first and keeping the change small are the two biggest levers on that timeline.' },
        ],
        relatedSlugs: ['software-engineering-portfolio-guide', 'new-grad-software-engineer-jobs', 'ai-tools-developers-2025'],
    },

    // ───────────────────────── AI & Developer Tools ─────────────────────────
    'ai-tools-developers-2025': {
        title: '10 AI Tools Every Developer Should Actually Use',
        pageTitle: 'Best AI Tools for Developers (And How to Use Them)',
        description: 'Beyond autocomplete - the AI tools working developers use to write better code and ship faster, plus the failure mode that quietly makes engineers worse at their jobs.',
        category: 'ai-tools',
        author: 'niraj',
        datePublished: '2025-05-13',
        dateModified: '2026-07-30',
        keywords: ['ai coding tools', 'ai tools for developers', 'best ai for coding', 'ai developer productivity', 'github copilot alternatives'],
        readingTime: 11,
        takeaways: [
            'AI is best at code you could write but do not want to - boilerplate, tests, migrations.',
            'Review every generated line. Reviewing badly is where AI-assisted teams actually lose time.',
            'Learning with AI requires deliberately not accepting the first answer.',
            'Interviewers can tell when a candidate has only ever coded with autocomplete on.',
        ],
        faqs: [
            { q: 'Will AI replace software engineers?', a: 'Not on current evidence. It is compressing the time spent on mechanical work while raising the value of judgement, system design and debugging - the parts AI is weakest at. The job is changing rather than disappearing.' },
            { q: 'Is it cheating to use AI in coding interviews?', a: 'In almost all live interviews, yes, and it is usually explicitly prohibited. Take-home assignments increasingly permit it but expect you to be able to defend every line in the follow-up conversation.' },
            { q: 'Does using AI tools make you a worse programmer?', a: 'It can, if you accept output without understanding it. Used deliberately - generating a solution, then explaining why it works before accepting it - the effect goes the other way.' },
            { q: 'Which AI coding tool should I start with?', a: 'An in-editor assistant is the highest-leverage first tool because it meets you where you already work. Add a conversational model for design discussion and debugging once the editor workflow is habit.' },
        ],
        relatedSlugs: ['software-engineering-portfolio-guide', 'leetcode-alternatives', 'full-stack-developer-roadmap'],
    },
}

// ─── Derived collections + helpers ───────────────────────────────────────────

/** Every slug that has content, published or drafted-ahead. Used by generateStaticParams. */
export const BLOG_SLUGS = Object.keys(BLOG_POSTS)

/** True once a post has been added to the publish gate in content/active-posts.ts. */
export function isPublished(slug: string): boolean {
    return ACTIVE_BLOG_SLUGS.includes(slug)
}

export interface BlogPostWithSlug extends BlogPost {
    slug: string
}

function withSlug(slug: string): BlogPostWithSlug {
    return { slug, ...(BLOG_POSTS[slug] as BlogPost) }
}

/** Published posts, newest first. This is what the blog index and sitemap render. */
export const publishedPosts: BlogPostWithSlug[] = ACTIVE_BLOG_SLUGS
    .filter((slug) => Boolean(BLOG_POSTS[slug]))
    .map(withSlug)
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))

export function getPostBySlug(slug: string): BlogPost | undefined {
    return BLOG_POSTS[slug]
}

export function getPostsByCategory(category: BlogCategory): BlogPostWithSlug[] {
    return publishedPosts.filter((p) => p.category === category)
}

/**
 * Related posts for a given slug. Hand-picked `relatedSlugs` come first; if any of
 * those are still unpublished the list is topped up from the same category so the
 * block is never short.
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPostWithSlug[] {
    const post = BLOG_POSTS[slug]
    if (!post) return []

    const picked = post.relatedSlugs
        .filter((s) => s !== slug && BLOG_POSTS[s] && isPublished(s))
        .map(withSlug)

    if (picked.length >= limit) return picked.slice(0, limit)

    const seen = new Set([slug, ...picked.map((p) => p.slug)])
    const filler = getPostsByCategory(post.category).filter((p) => !seen.has(p.slug))

    return [...picked, ...filler].slice(0, limit)
}
