Campus placements compress a job search into about six weeks. Companies arrive in sequence, each with a fixed process, and if you are not ready when your first target arrives you do not get a second attempt with them that season.

That structure is an advantage if you plan around it and brutal if you do not. This is the preparation plan - what to study, in what order, and how much time each part actually deserves.

## Understand the Funnel First

Almost every campus process has the same five stages, and they eliminate very different numbers of people.

| Stage | Typical elimination | What it tests |
|---|---|---|
| Resume shortlist | CGPA cutoff, often 6.5-7.0 | Nothing you can change in September |
| Aptitude test | 50-70% of candidates | Quantitative, logical, verbal |
| Coding round | 40-60% of the rest | DSA, usually 2-3 problems |
| Technical interview | 30-50% | DSA, core subjects, your projects |
| HR round | 10-20% | Communication, fit, motivation |

The number that surprises people: **the aptitude round eliminates more candidates than the coding round does.** It is also the easiest stage to improve, because the question types are finite and repetitive. Students who spend all three months on DSA and none on aptitude regularly get filtered before anyone looks at their code.

## The Six-Month Plan

Six months before your season starts. If you have three, compress the first two phases rather than skipping the middle one.

**Months 1-2: Foundations**
- DSA: arrays, strings, hashing, two pointers, sorting, binary search
- Aptitude: quantitative basics - percentages, ratios, time and work, probability
- One language chosen and used exclusively (C++, Java or Python)

**Months 3-4: Depth**
- DSA: linked lists, stacks and queues, trees, graphs, heaps, basic DP
- Core subjects begin: OS and DBMS
- Aptitude: logical reasoning and data interpretation
- One project built properly and deployed

**Month 5: Consolidation**
- Core subjects: computer networks and OOP
- Resume finalised
- Mock interviews start
- Revise DSA patterns rather than solving new problems

**Month 6: Rehearsal**
- Full mock interviews weekly
- HR round preparation
- Company-specific patterns for your targets
- Company research

## DSA: What Actually Gets Asked

Campus coding rounds sit mostly at the easy-to-medium level. Hard dynamic programming is rare; being unable to write a clean BFS is fatal.

Cover these patterns, roughly in this order:

1. Arrays and hashing
2. Two pointers
3. Sliding window
4. Binary search - including on the answer space
5. Linked lists
6. Stacks and queues
7. Trees - traversals, BST operations
8. Graphs - BFS, DFS, topological sort
9. Heaps and priority queues
10. Recursion and backtracking
11. Greedy
12. Basic DP - knapsack, LIS, coin change

**150 to 200 problems across these patterns beats 500 solved at random.** The full sequencing is in [the three-month DSA plan](/blogs/dsa-study-plan-coding-interview), which maps almost directly onto months 1-4 above.

For structured problem sets, [Striver's A2Z DSA sheet](https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/) is the most widely used in Indian campus preparation and is genuinely well-sequenced. [NeetCode's 150](https://neetcode.io/practice) is the equivalent for a more interview-pattern-focused approach. Practise on [LeetCode](https://leetcode.com/) or [GeeksforGeeks](https://practice.geeksforgeeks.org/), and if your target companies run contest-style rounds, timed practice on [CodeChef](https://www.codechef.com/) or [HackerEarth](https://www.hackerearth.com/) is worth adding. Alternatives and when each is useful are covered in [the LeetCode alternatives guide](/blogs/leetcode-alternatives).

**Language choice:** C++ for competitive-style rounds because of the STL, Java if your curriculum uses it, Python if you are fastest in it and the company allows it. Pick one in month one and do not switch.

Your GitHub is often opened before your resume in campus processes, and it gets about ten seconds - [the profile guide](/blogs/github-profile-software-engineer) covers what a recruiter actually sees in them.

## Aptitude: The Underrated Round

Two to three hours a week for three months is enough for most people to clear these comfortably. The question bank is genuinely finite.

**Quantitative:** percentages, profit and loss, ratio and proportion, time-speed-distance, time and work, permutations and combinations, probability, number systems.

**Logical:** series, blood relations, seating arrangements, syllogisms, coding-decoding, puzzles.

**Verbal:** reading comprehension, sentence correction, synonyms and antonyms, para-jumbles.

**How to practise:** timed sets, always. The difficulty in these tests is not the questions, it is doing forty of them in thirty minutes. [IndiaBIX](https://www.indiabix.com/) is the standard free practice bank, and R.S. Aggarwal's quantitative aptitude book remains the most-used reference for a reason.

Track which categories you are slow in and drill those specifically. Most people have two or three weak areas that account for most of their lost marks.

## Core Subjects: The Most Under-Prepared Area

This is where interviews are actually lost. Candidates over-prepare DSA and walk into a technical interview unable to explain a deadlock.

**Operating Systems** - processes vs threads, scheduling algorithms, deadlock (conditions, prevention, avoidance), memory management, paging and segmentation, virtual memory, synchronisation, semaphores and mutexes.

**DBMS** - normalisation up to BCNF, ACID properties, transactions, indexing, joins, keys, SQL query writing, and the difference between clustered and non-clustered indexes.

**Computer Networks** - the OSI and TCP/IP models, TCP vs UDP, what happens when you type a URL into a browser (asked constantly), HTTP methods and status codes, DNS, subnetting basics.

**OOP** - the four pillars with real examples, abstract classes vs interfaces, method overloading vs overriding, SOLID principles.

For each, be able to explain the concept in plain language and give one example. Interviewers ask follow-ups, and reciting a definition without understanding it is immediately obvious.

Budget four to six weeks total across all four subjects. [GeeksforGeeks](https://www.geeksforgeeks.org/) has adequate coverage for interview depth, and [Gate Smashers](https://www.youtube.com/@GateSmashers) on YouTube is widely used for OS and DBMS if you prefer video.

## Projects: Two, Explained Deeply

Two projects you can discuss in depth beat five you built by following tutorials.

For each, be ready to answer:

- What problem does it solve?
- Why this tech stack and not an alternative?
- What was the hardest part and how did you solve it?
- What breaks if you have 100x the users?
- What would you do differently now?

That last question is the one that separates candidates. "Nothing, it is fine" is a weak answer. A specific, honest regret shows you have actually thought about the system.

**Do not list projects you cannot explain.** Interviewers will pick the one you understand least. If a project on your resume was a group effort where you did the frontend, say so - claiming the whole thing and then failing a backend question about it is much worse than being accurate.

At least one project should be deployed and reachable at a URL. [The portfolio guide](/blogs/software-engineering-portfolio-guide) covers what makes a project worth listing.

## CGPA: What It Actually Does

It is a filter, not a ranking. Many companies set a cutoff at 6.5 or 7.0, apply it once at shortlisting, and never look at it again.

Practical implications:

- **Clear the cutoff.** Below it, most doors do not open regardless of your skills.
- **Above it, the difference rarely matters.** 8.5 versus 7.5 almost never decides an outcome.
- **Backlogs are a harder filter than a low CGPA.** Many companies exclude candidates with active backlogs outright. Clear them before the season.

If your CGPA is below the common cutoffs, target companies that do not use them - startups, off-campus roles, and firms that hire on coding test performance alone.

## Group Discussion and HR

**Group discussion**, where it happens, is not about winning. It is about being audible, structured and not talking over people. Entering early to frame the topic and summarising near the end are both high-scoring moves. Aggression scores badly.

**The HR round is not a formality.** It eliminates people every season. Prepare properly:

- **"Tell me about yourself"** - 90 seconds, rehearsed. Where you are, what you have built, why this role.
- **"Why this company?"** - requires ten minutes of real research. Name a product, a technology, or something from their engineering blog. Generic praise is worse than saying nothing.
- **"Where do you see yourself in five years?"** - they want a plausible trajectory, not ambition theatre.
- **"What is your weakness?"** - a real one, with what you are doing about it.
- **Strengths, teamwork and conflict questions** - these are behavioural questions and they reward structure. [The STAR method guide](/blogs/star-method-interview-software-engineers) covers how to build stories that hold up under follow-up questions, and [the behavioural question bank](/blogs/behavioral-interview-questions-software-engineer) has the full list.

Have three or four stories ready from projects, group work and any internship. Practise them out loud.

## The Final Month

Stop learning new material. Consolidate.

- **Weekly full mock interviews.** Technical and HR. The gap between knowing something and explaining it under pressure only closes with reps - [why deliberate mock practice works](/blogs/mock-technical-interview-guide) covers how to make each one count.
- **Revise, do not expand.** Re-solve problems you got wrong a month ago. That is where the retention is.
- **Company research.** For each target: what they build, their tech stack, their process, and the pattern of questions previous batches reported. Your seniors are the best source here.
- **Resume final pass.** One page, no typos, projects first if you have no internship.
- **Sleep.** Consistently underrated. Nobody performs well in a 9am aptitude test on four hours.

## The Honest Summary

Start six months out. Give aptitude the two hours a week it needs, because it eliminates more people than anything else. Cover DSA by pattern, not by count. Do not skip core subjects, because that is where technical interviews are actually decided. Have two projects you can defend in depth. And treat the HR round as a real round.

Placement season is the most structured job search you will ever have. Nearly everything is known in advance - which companies, roughly when, and what they ask. The people who do well are usually not the strongest coders in the batch. They are the ones who prepared for the whole funnel instead of one part of it.

---

*ShipItHQ gives you DSA practice, guided projects and AI mock interviews for both technical and HR rounds - the full placement funnel in one place. [Start free](/pricing).*
