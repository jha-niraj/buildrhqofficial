The first five minutes of a coding interview decide most of the outcome, and almost nobody practises them. People practise solving problems alone, in silence, with a solution button available. Then the interview arrives and the actual task turns out to be different: think out loud, in front of a stranger, with no way to check whether you are right.

This is a procedure for those five minutes. It works whether or not you recognise the problem, which is the point.

## The short version

1. Restate the problem in your own words.
2. Ask about inputs, outputs and constraints.
3. Give one concrete example and walk it through by hand.
4. State a brute force and its complexity.
5. Say what is wasteful about it.
6. Propose an improvement and get agreement.
7. Then, and only then, write code.

Steps 1 to 6 take five minutes and are the part being scored. Step 7 is the artefact.

## 1. Restate it

"So I am given an array of integers and a target, and I need to return the indices of the two numbers that add to the target. Is that right?"

This costs fifteen seconds and does two things. It catches a misunderstanding while it is still free, and it buys you a moment of thinking time that looks like diligence rather than a pause.

Interviewers deliberately leave problems underspecified. Restating is how you find that out at minute one instead of minute twenty.

## 2. Ask about the constraints

The questions worth asking almost every time:

- **How large is the input?** This decides the target complexity. If n can be 10⁵, an O(n²) solution will time out and you both know it. If n is at most 100, O(n²) is fine and reaching for something clever is wasted effort.
- **What is in it?** Negatives? Duplicates? Empty? Sorted?
- **What should happen when there is no answer?** Return -1, return empty, throw?
- **Can I modify the input?** In-place is sometimes allowed and sometimes disqualifying.
- **Is there exactly one valid answer, or should I return all of them?**

That last one changes the entire approach. "Return any valid arrangement" and "return every valid arrangement" are a greedy problem and a backtracking problem respectively.

Do not ask all six every time. Ask the two or three that would change what you write.

## 3. Work one example by hand

Take a small input and produce the output manually, out loud.

```
nums = [2, 7, 11, 15], target = 9
2 + 7 = 9, so indices 0 and 1
```

Then take an edge case and do it again. `[3, 3]` with target 6 catches the duplicate-value question. `[]` catches the empty case.

This is the step people skip, and it is the highest-value one. It surfaces ambiguity you did not think to ask about, and it gives you a test case for later - when your code produces the wrong answer at minute thirty, having a worked example already on the board is the difference between debugging and guessing.

## 4. State the brute force

Say it even when it is obviously bad. Especially then.

"The brute force is a nested loop over every pair, which is O(n²) time and O(1) space."

Two reasons. It establishes a baseline the interviewer can push against, and it demonstrates that you can produce a correct solution before you produce a clever one. Candidates who jump straight to an optimal answer they have memorised and cannot explain score worse than candidates who visibly reason their way up from the obvious.

If you genuinely cannot see a brute force, that is useful information: the problem is probably not the pattern you think it is.

## 5. Name the waste

"The inner loop searches for `target - nums[i]` every time. That search is the expensive part, and I already know the value I am looking for."

This sentence is the hinge of the entire interview. Every optimisation is the removal of a specific waste, and naming it is what turns "I remembered the answer" into "I derived the answer".

The three wastes that cover most problems:

- **Repeated search.** Fix with a hash map.
- **Repeated computation.** Fix with memoisation or a prefix array.
- **Repeated scanning of a range.** Fix with a sliding window or two pointers.

If you can identify which of those three is happening, you have usually found the intended solution. [The patterns guide](/blogs/coding-interview-patterns) maps the triggers to the techniques in more detail.

## 6. Propose, then check

"So I would store each value and its index in a hash map as I go, and for each element check whether its complement is already there. That is O(n) time and O(n) space. Does that sound reasonable to start with?"

Ask. It is not weakness; it is the same thing you would do with a colleague before spending an hour on an approach. An interviewer who thinks you are heading somewhere unproductive will usually redirect you, and that redirect is worth more than the twenty minutes you would have spent finding out yourself.

## 7. Now write it

And keep narrating - not every keystroke, but the decisions.

"I will initialise the map outside the loop... I am checking before inserting, because otherwise an element could match with itself."

Then, before you say you are done, run your own example through the code by hand. Out loud. Finding your own bug is a strong positive signal; having the interviewer find it is a weak one. They are not the same event even though the bug is identical.

## When you are stuck

You will be, some of the time. Being stuck is not the failure - being stuck silently is.

**Say what you have tried.** "I considered sorting first, but that loses the original indices, which the output needs."

**Say what you are missing.** "I need a way to find the complement without scanning."

**Solve a smaller version.** If the general case is hard, do it for k = 2 and generalise afterwards.

**Ask for a hint, explicitly.** "Could I get a nudge on the data structure?" This costs less than people fear. Twenty minutes of visible flailing costs far more.

What it is: an interviewer's job is largely to find out whether they would want to be stuck on a problem with you at 4pm on a Thursday. Someone who narrates, asks, and recovers is a better answer to that question than someone who freezes and then produces a perfect solution at minute forty.

## Practising the part that is hard

Solving problems in silence trains the wrong skill. The thing that transfers is saying the reasoning out loud, and there is no way to get good at it without doing it.

The cheapest version: solve problems talking to an empty room, with a timer, no solution button. It feels ridiculous and it works, because the failure mode it exposes - knowing the answer and being unable to narrate it - is invisible when you practise silently.

Better, when you can get it: a real mock with someone who will interrupt you. [The mock interview guide](/blogs/mock-technical-interview-guide) covers how to run one that is worth the hour, and [the technical phone screen guide](/blogs/technical-phone-screen-guide) covers the round this procedure matters most in - the one where the interviewer cannot see your face and has forty-five minutes to decide.

## The questions that change what you write

Not all clarifying questions are equal. These are the ones whose answers actually change
your solution, ranked by how often they matter:

| Question | What changes if the answer surprises you |
|---|---|
| How large can the input be? | Your entire target complexity |
| Is the input sorted? | Binary search and two pointers become available |
| Can there be duplicates? | Set-based approaches, and whether an index map is safe |
| Negative numbers? | Prefix sums, sliding windows and greedy all break differently |
| Empty input, or a single element? | Your base case, and usually your first bug |
| One answer or all of them? | Greedy versus backtracking - a different algorithm entirely |
| Can I modify the input? | In-place becomes available, or is disqualifying |

Ask two or three. Asking all seven reads as stalling, and the interviewer will start
answering them before you finish.

## Handling a follow-up

Most interviews have one. "Now suppose the array does not fit in memory." "Now suppose it
is streaming." "Now do it in O(1) space."

The instinct is to panic, because you just spent twenty minutes on a solution that has now
been invalidated. It has not. The follow-up is almost always testing whether you can
identify **which assumption broke**, and saying that is most of the answer:

"My solution assumes random access to the whole array, because the hash map holds every
element. If it does not fit in memory, that assumption is what fails - so I would need
either an external sort and a merge pass, or a probabilistic structure if an approximate
answer is acceptable."

You do not need to implement it. Naming the broken assumption and one direction is a
complete answer to a five-minute follow-up.

## What to do in the last five minutes

If you are nearly done, **stop coding and test**. An untested solution that works and a
tested solution that works score differently, and the gap is larger than people expect.

If you are not nearly done, **say where you are and what remains**. "The main loop is
right; I have not handled the case where the window is empty, which would be an extra check
here." That converts an incomplete answer into a demonstration that you know what
incomplete means, which is worth considerably more than silently running out of time.

If you finished early, do not sit quietly. Offer the improvement you did not need: "This is
O(n) space; if we are allowed to sort the input we could do it in O(1) extra space at the
cost of O(n log n) time." Volunteering the trade-off is free signal.

## Practising the procedure, not the problems

The gap between people who can solve problems and people who pass interviews is almost
entirely this procedure, and it does not improve by solving more problems.

A drill that works: take a problem you have **already solved**, and run only steps 1 to 6
on it out loud, with a timer, without writing any code. Five minutes. You are not trying to
find the answer - you know the answer - you are rehearsing the narration.

Do that with ten problems you already know and the first five minutes of a real interview
stop feeling like an ambush. It is the cheapest, least popular and most effective
preparation there is, because it practises the part that is actually failing.
