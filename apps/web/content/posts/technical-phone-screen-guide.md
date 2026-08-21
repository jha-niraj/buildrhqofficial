The technical phone screen is the round that eliminates the most candidates, and it is the one people prepare for least. It is usually 45 minutes, usually one problem, usually with someone who has your resume open and four other screens booked that day. They are not deciding whether to hire you. They are deciding whether the company should spend five engineers' afternoons on you.

That framing explains most of what is otherwise confusing about the round.

## What actually happens in the 45 minutes

The shape is consistent enough to plan around:

| Minutes | What |
|---|---|
| 0-5 | Introductions, and a short "tell me about your background" |
| 5-10 | The problem is given; you ask questions |
| 10-35 | You solve it, talking the whole time |
| 35-40 | Complexity, edge cases, possibly a follow-up |
| 40-45 | Your questions for them |

The compression is the difficulty. Twenty-five minutes of coding is not long, and it is why the first five minutes matter disproportionately: five minutes spent clarifying is fine, five minutes spent silently reading is a quarter of your coding time gone.

## The one thing that is different from an onsite

**They cannot see you.** No whiteboard, no gestures, no face. If you go quiet, the interviewer has literally no information about whether you are thinking hard or completely lost, and they are writing notes either way.

So the rule for this round specifically is: **narrate more than feels natural**. Not every keystroke, but every decision and every pause longer than a few seconds.

"I am going to think about the data structure for a moment" is a complete sentence and it is worth saying. Thirty seconds of dead air on a phone screen feels like two minutes to the person on the other end.

## Before the call

**Check the tooling.** Most screens use a shared editor - CoderPad, HackerRank, CodeSignal, or a Google Doc. Almost all of them have a practice pad. Open it beforehand and type in it. Discovering that autocomplete is off, or that the font is tiny, or that the runner needs a specific main function, is not something to discover at minute eleven.

**Pick your language and commit.** The one you are fastest in, not the one you think sounds most impressive. A confident Python solution beats a hesitant C++ one every time, unless the role is explicitly a C++ role.

**Have your own project ready in one sentence.** "I built X, the interesting part was Y." You will be asked, it will be early, and rambling for three minutes about a project uses coding time.

**Sit somewhere quiet with a wired connection if you can.** This sounds like advice for a different decade. It is not: a dropped call at minute twenty is a real thing that happens and it is a bad way to lose a round.

## During: the procedure

Same as any coding interview, compressed. [The full procedure is here](/blogs/how-to-approach-coding-interview-problems); the phone-screen version is:

1. **Restate it.** Fifteen seconds, catches misunderstandings while they are free.
2. **Ask two or three constraint questions.** Input size, edge cases, what to return when there is no answer.
3. **Say a brute force and its complexity.** Even a bad one. It sets a baseline and shows you can get to correct before clever.
4. **Name the waste, propose the fix, get agreement.** "The inner loop is re-searching for something I already know - a hash map removes it. O(n) time, O(n) space. Reasonable?"
5. **Code, narrating decisions.**
6. **Test with your own example before saying you are done.**

That last step is the one that most reliably separates outcomes. Finding your own off-by-one is a positive signal. Having the interviewer find it is not - and the bug is identical.

## The three ways people lose this round

**Silence.** Covered above, and it is the biggest one. On a phone screen, a candidate who thinks brilliantly in silence and a candidate who is stuck are indistinguishable.

**Optimising too early.** Rushing to the clever solution, getting it half-written, running out of time, and submitting nothing that works. A correct O(n²) beats an incomplete O(n) in almost every rubric. Get something working, then improve it if there is time, and say that is what you are doing.

**Not asking about input size.** This one costs whole rounds. If n can be 10⁵ and you write O(n²), the interviewer has been waiting for twenty minutes to see whether you notice. Ask at minute six.

## What they are actually scoring

Most companies score four things, roughly:

- **Problem solving.** Did you get to a working approach, and how?
- **Coding.** Is it clean, does it run, are the variables named like a person named them?
- **Communication.** Could they follow your thinking without asking?
- **Verification.** Did you test it yourself?

Note that "got the optimal solution" is not one of them directly. It shows up under problem solving, and it is one input among several. This is why a candidate who reasons out loud, writes a correct suboptimal solution, identifies the improvement without time to implement it, and tests their own code frequently passes - while a silent optimal solution sometimes does not.

## The last five minutes

You will be asked if you have questions. Have two, and make them about the work.

"What does the team's code review process look like?" or "What is the thing that most surprised you about the codebase when you joined?" are good because they are specific and the answers are actually useful to you. [The full guide to questions worth asking](/blogs/questions-to-ask-interviewer-software-engineer) has more.

Do not ask about compensation here. The screener usually cannot answer and it is the wrong round for it.

## After

Send a short thank-you email if you have the address. Two sentences, specific to something discussed. It will not save a bad round and it does occasionally tip a borderline one.

Then write down the problem and what you did badly, while it is fresh. A pattern shows up across three or four screens that is invisible after any single one - and it is usually the same failure every time.

## Preparing specifically for this round

Practise the round, not just the problems. Set a 45-minute timer, pick a medium problem you have not seen, and solve it while talking to an empty room, with no solution button. It feels absurd. It also exposes the exact failure mode phone screens punish: knowing an answer and being unable to say it while typing.

Do that five times and the round stops being frightening. [The mock interview guide](/blogs/mock-technical-interview-guide) covers how to get a real one, and [the pattern guide](/blogs/coding-interview-patterns) covers what to do about the blank page at minute one - which, on a phone screen, is the moment everything hinges on.

## What to do with the shared editor

Most phone screens use a pad with no autocomplete, no type checking and often no ability to
run code. That is a bigger adjustment than people expect if you normally work in a
configured IDE.

**Write it as if it cannot run**, because it might not. That means being deliberate about
syntax rather than relying on the editor to flag a missing bracket, and it means reading
your own code back before saying you are finished.

**Use real variable names.** `left`, `right`, `seen`, `remaining`. Single letters are fine
for loop indices and nothing else. The person reading it has no syntax highlighting either.

**Leave the brute force in a comment if it helps.** Writing `# O(n^2): nested loop over all
pairs` above your real solution costs one line and shows the reasoning survived into the
code.

**If you can run it, run it before you say you are done.** If you cannot, trace your example
by hand out loud. Either way, do not announce completion until you have checked.

## The forty-five-minute rehearsal

The single most useful preparation for this round is a full-length rehearsal, and almost
nobody does one because it feels absurd.

The setup: a timer at 45 minutes, a plain text editor with autocomplete off, a medium
problem you have not seen, and yourself talking out loud to an empty room. No solution
button, no searching, no pausing the timer.

What it exposes, reliably:

- You go quiet when you think. Everybody does, and it is fatal on a phone.
- You start coding before you have an approach, then rewrite at minute twenty.
- You forget to ask about input size and only notice when your solution times out.
- You finish and say "done" without testing.

Each of those is invisible when you practise silently and each of them costs a round. Five
rehearsals is enough to fix all four, which is a much better return than five more problems.

## If it goes badly

Some screens go badly for reasons that are not about you: an interviewer who gives a
problem three levels above the role, a connection that drops, a question you happen to have
never seen the pattern for.

Two things worth doing anyway:

**Finish the round properly.** Ask your questions, be pleasant, thank them. Companies keep
notes, and "did not solve it but was good to talk to" is a materially different note from
"did not solve it and disengaged". People do get re-invited.

**Write down what happened the same day.** Not to dwell on it - to find the pattern. Three
or four screens in, something repeats: always running out of time, always forgetting to
clarify, always freezing on graphs. That repeated thing is your actual preparation list,
and it is invisible from inside any single round.
