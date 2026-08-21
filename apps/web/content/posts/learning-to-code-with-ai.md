The risk with AI coding tools is not that they write bad code. It is that they let you ship working code you could not have written, and you find out which one you were doing in an interview, at a whiteboard, with nothing to autocomplete against.

This is not an argument for avoiding them. Refusing to use an assistant in 2026 is a bit like refusing to use an IDE - it costs you real productivity and buys you nothing. The question is how to use them without the skill quietly failing to develop.

## The specific thing that goes wrong

Learning happens when you retrieve something with effort, not when you recognise it as correct.

This is well established in how memory works, and it explains the failure mode precisely. When an assistant produces a function and you read it and think "yes, that is right", you have exercised *recognition*. Recognition is easy, it feels like understanding, and it does not build the ability to produce the thing yourself. Retrieval - staring at an empty function and constructing it - is the effortful thing that does.

So the danger is not incorrect output. It is that the output is correct, you agree with it, you feel like you learned something, and none of it transfers. The signal that this has happened to you is uncomfortable and simple: **you can review code in a language you cannot write.**

## The rule that works

**Never accept code you could not have written, without first understanding why it works.**

Not "never accept code you did not write" - that is a rule nobody keeps. The bar is that after accepting it, you could reproduce the approach from memory. If you could not, you have two options: work out why it works, or reject it and write a worse version yourself.

For anything you are actively trying to learn, the worse version you wrote is more valuable than the better version you accepted.

## What to use it for, by phase

The right amount of assistance depends on what you are doing, and treating all coding as one activity is where people go wrong.

### When you are learning a concept

**Turn autocomplete off.**

If you are learning recursion, or how a binary search terminates, or what a closure captures, inline suggestions are actively harmful. They finish the thought you were about to have. The struggle *is* the learning, and removing it removes the learning while leaving the feeling of progress.

Use the assistant afterwards instead: write your version, then ask what is wrong with it. That sequence keeps the retrieval and adds the feedback, which is the best of both.

### When you are practising for interviews

**Do not use it at all.**

The interview is a retrieval test with no assistant. Practising with one trains a skill you will not have access to. This is not moralising - it is the same reason you would not train for a race on an e-bike.

The one legitimate use is afterwards: solve the problem cold, then ask for a critique of your solution. [The patterns guide](/blogs/coding-interview-patterns) is the material; the practice has to be unassisted.

### When you are building something

**Use it heavily, with a distinction.**

There are two kinds of code in any project: the code that is the point, and the code that is in the way. Boilerplate, config, a regex you have written forty times, the shape of a test file, the flag you always forget - none of that is where your engineering lives. Delegate it.

The part that is the point - the data model, the concurrency, the trade-off you would put in your README - write that yourself. That is the part you will be interviewed about, and it is the part you should be able to defend.

### When you are debugging

**Use it, but pay the price first.**

Form a hypothesis before you paste the stack trace. Say out loud what you think is wrong. Then ask.

Skipping straight to "what is this error" outsources the most valuable skill in the job, which is the ability to reason from a symptom to a cause in a system nobody has explained to you. Debugging is also the round most people fail and least prepare for.

### When you are reading unfamiliar code

**Use it freely.** This is the strongest use case and it has almost no downside.

"Explain what this function does", "why would somebody write it this way", "what breaks if I change this" - all excellent. You are not outsourcing production, you are accelerating comprehension, and the comprehension is still yours afterwards.

## Prompting well is a real skill

The gap between a vague prompt and a specific one is enormous, and both [OpenAI's prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) and [Anthropic's](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) say roughly the same things.

The practical version:

**Give it the constraints.** "Python 3.11, no external dependencies, this must handle an empty input" produces a different and better answer than "write a function that does X".

**Show it your code.** The surrounding conventions are context. Without them you get generic code you then have to rewrite to fit.

**Ask for the reasoning, not just the code.** "Explain the trade-off before you write it" turns an answer into a lesson, and it is how you catch a confidently wrong approach before you have built on it.

**Ask it to critique yours.** "Here is my solution - what is wrong with it, and what would a reviewer flag?" This is the single highest-value prompt for learning, and it inverts the dynamic from generation to feedback.

## Verify, because it will be confidently wrong

Assistants produce plausible, well-formatted, incorrect answers. The formatting is the problem: wrong code that looks like right code passes a skim.

The failure modes worth knowing:

- **Invented APIs.** Methods that do not exist, on libraries that do. Check the docs - [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) and the official language docs are the arbiters, not the model.
- **Out-of-date patterns.** Trained on a lot of old code, and old code is often the majority of what exists.
- **Security defaults.** Generated auth, query-building and file-handling code frequently omits the thing that makes it safe. The [OWASP Top Ten](https://owasp.org/www-project-top-ten/) and [OWASP's cheat sheets](https://cheatsheetseries.owasp.org/) are the reference here, and this is one area where "it worked" is not the same as "it is correct".
- **Subtle edge cases.** Off-by-one, empty input, the boundary condition. The code runs on the happy path and the test you did not write is the one that mattered.

Run it. Test the edges. Read it as if a stranger wrote it, because one did.

## A self-check worth doing

Once a week, pick something you have built with assistance and reimplement a piece of it from scratch, no assistant, no reference.

If you can, you learned it. If you cannot, you shipped it - which is fine for the parts that are in the way, and a problem for the parts that are the point.

That check takes twenty minutes and it is the only reliable way to know which of the two happened, because it does not feel different at the time. [The AI tools guide](/blogs/ai-tools-developers-2025) covers which tools are worth using; this is the part about not letting them cost you the thing they were supposed to accelerate.

## The interview problem, specifically

There is a practical reason this matters beyond craft, and it is worth being blunt about.

Interviews are unassisted. Every round - the phone screen, the onsite, the system design
conversation - is a retrieval test with no autocomplete, and increasingly with proctoring
that makes assistance impossible even remotely.

So a skill gap that is invisible day to day becomes visible in exactly the forty-five
minutes that decide the outcome. The candidate who has shipped a lot with assistance and
cannot write a binary search on a blank page is a real and increasingly common failure, and
the person it surprises most is the candidate.

The check from earlier is the whole defence: **reimplement something from scratch, no
assistant, once a week**. If that is uncomfortable, it is measuring something true.

## Reviewing generated code like a reviewer

Read it as if a stranger wrote it, because one did. The specific questions worth asking
every time:

**What happens on empty input?** Generated code is trained on happy paths and the empty
case is the most commonly missing branch.

**Is this API real?** Confidently invented methods on real libraries are common, and they
look exactly like real ones. The docs are the arbiter.

**Is this the current way to do it?** Models see a lot of old code, because most code is
old. Deprecated patterns come back looking authoritative.

**What is the error handling doing?** Frequently: nothing, or a bare catch that swallows
the failure. This is the one that causes production incidents rather than test failures.

**Would I be able to defend this in review?** If the answer is no, you do not understand it
well enough to have accepted it.

That last question is the most useful of the five, because it is the same standard a
colleague would hold you to, and it does not require knowing in advance what is wrong.

## Where assistants are genuinely better than you

Worth stating, because the framing so far has been about protecting a skill and that can
tip into refusing help that is obviously worth taking.

**Boilerplate you have written forty times.** Config files, test scaffolding, the shape of
a CLI parser, a Dockerfile. There is no learning left in these and typing them is pure
overhead.

**Regular expressions.** Genuinely faster and usually more correct than a person doing it
by hand, and easy to verify with a handful of test strings.

**Translating between languages.** "What is the Python equivalent of this Go function" is a
question with a right answer that would otherwise cost you twenty minutes of searching.

**Explaining unfamiliar code.** The strongest use case, with essentially no downside.

**First drafts of documentation.** Writing a README from a codebase is exactly the kind of
summarisation these are good at, and you are going to edit it anyway.

The pattern across all five: they are tasks where you can **verify the output faster than
you could produce it**. That is the real dividing line, and it is a better rule than any
list. Where verification is cheap, delegate freely. Where verifying requires the
understanding you were trying to build, do it yourself.
