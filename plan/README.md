# plan/ - how work gets planned before it gets built

Nothing substantial gets built in this repo until it is written down here first.

The rule exists because of what happened without it: a feature was described in
conversation, built across a dozen files, and then nobody - including the person
who asked for it - could say whether it was finished. "Is the resume thing done?"
had no answer, because "done" had never been written down.

## The shape

One directory per module. Two files in each.

```
plan/
├── README.md              <- you are here
├── credits/
│   ├── overview.md        what this module IS when it is 100% done
│   └── tasks.md           the numbered, checkable work to get there
└── resume/
    ├── overview.md
    └── tasks.md
```

### `overview.md` - the definition of done

Written **before** any task list. It answers one question: *when this module is
finished, what is true?*

It contains:

- **What the module is** - one paragraph, in product terms, not code terms.
- **Definition of done** - a numbered list of statements that are either true or
  false about the shipped product. Not "improve the wallet" but "every credit a
  user holds has a matching ledger row explaining where it came from." A reader
  must be able to check each one by using the product or querying the database.
- **Out of scope** - what this module deliberately does NOT cover, so scope
  creep has to argue with a document instead of sliding in.
- **Decisions** - choices that were made and why, especially prices, limits and
  anything a future reader would otherwise reopen. Include who decided.

### `tasks.md` - the work

Derived from the overview. Every task traces to a line in the definition of done;
a task that traces to nothing is scope creep and gets deleted.

Each task has:

| field | why |
|---|---|
| **ID** (`CR-1`, `RES-3`) | stable, referenceable across files and commits |
| **checkbox** | `- [ ]` open, `- [x]` done. Marked only when verified, not when written |
| **status line** | `Status: not started / in progress / done (2026-08-20)` |
| **Why** | the user-visible problem. A task with no user-visible problem is not a task |
| **Files** | exact paths, so the work can start without a re-scan |
| **Steps** | what to actually do |
| **Edge cases** | the ones that will be got wrong otherwise. This is the section that earns the document |
| **Done when** | how to verify. A command, a query, a click-path - something falsifiable |

Tasks are ordered by dependency, and blocking relationships are stated on both
sides.

## The workflow

1. **Read the module's `tasks.md` first.** If the work already has a task, do
   that task. Do not improvise a second version of it.
2. **No task yet?** Write `overview.md` (if the module is new) and the tasks
   **before** touching code. Get the definition of done agreed.
3. **Build one task at a time**, in order.
4. **Mark it done only after verifying it** - the task's own "Done when" line is
   the test. Add the date.
5. **Found something new mid-task?** Add it as a task. Do not silently widen the
   one in flight.

## Rules

- **A task is done when it is verified, not when the code is written.** `tsc`
  passing is not "done" unless the task says it is.
- **Edge cases are written before the code, not discovered after it.** Half the
  value of this directory is the edge-case sections.
- **Prices, limits and grants are decisions and live in `overview.md`**, not
  buried in a constant. The constant references the document.
- **Deletions get listed and approved, never assumed.** Dead code is proposed in
  a task; Niraj decides what actually goes.
- This directory describes intent. `srs/core-modules/` holds the older
  scan-and-blocker docs for `projects` and `pathfinder`; it is not superseded,
  and new work on those two modules should still read it.
