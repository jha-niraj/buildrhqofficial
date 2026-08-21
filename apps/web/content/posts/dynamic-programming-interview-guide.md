Dynamic programming is the technique of solving a problem by solving smaller versions of the same problem once each and reusing the answers. That is the whole idea. Everything else - memoisation, tabulation, state, transitions - is bookkeeping around that one sentence.

It has a reputation for being the hard topic, and the reputation is half-earned. The recurrences are not hard. What is hard is recognising that a problem is DP at all, and then choosing what the subproblem should be. This guide is mostly about those two things.

## The two conditions

A problem is DP when both of these hold. [The Wikipedia article](https://en.wikipedia.org/wiki/Dynamic_programming) is the formal treatment; this is the working version:

**1. Overlapping subproblems.** A naive recursion solves the same input more than once. Fibonacci is the canonical case: `fib(5)` calls `fib(3)` twice, and each of those calls `fib(1)` several times over.

**2. Optimal substructure.** The best answer to the whole problem is built out of best answers to its parts. This is the one people skip checking, and it is where greedy algorithms quietly fail.

If only the first holds, you have memoisation and nothing more. If neither holds, it is not DP and forcing it will waste an interview.

## Why greedy fails, in one concrete case

Coin Change with coins `[1, 3, 4]` and a target of `6`.

Greedy takes the biggest coin that fits, every time: 4, then 1, then 1. Three coins.

The right answer is 3 + 3. Two coins.

Greedy failed because taking the 4 was locally best and globally wrong - it left a remainder of 2, which the coin set handles badly. There is no local rule that sees that coming, which is exactly why the problem needs you to consider every option and keep the best.

That example is worth memorising, because "why is this not greedy" is a question interviewers ask, and "greedy takes 4+1+1 and misses 3+3" is a much better answer than "greedy does not always work".

## The table, filled in

`dp[i]` is the fewest coins that make `i`. Each cell depends only on cells to its left:

| `i` | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| `dp[i]` | 0 | 1 | 2 | 1 | 1 | 2 | 2 |
| from | base | `dp[0]`+1 | `dp[1]`+1 | `dp[0]`+1 via 3 | `dp[0]`+1 via 4 | `dp[4]`+1 via 1 | `dp[3]`+1 via 3 |

The recurrence is one line:

```
dp[i] = min(dp[i - c] + 1) for every coin c where c <= i
```

```python
def coin_change(coins, amount):
    dp = [0] + [float("inf")] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i:
                dp[i] = min(dp[i], dp[i - c] + 1)
    return dp[amount] if dp[amount] != float("inf") else -1
```

Note the `-1` at the end. `[5]` cannot make `3`, and a version that returns `inf` or throws is a version that fails the edge case the interviewer will ask about. Write out a small table by hand before you write the loop, every time.

## Top-down or bottom-up

Both are correct. They differ in what they cost you.

**Top-down (memoisation)** is the recursion you would have written anyway, with a cache in front of it. In Python that is one decorator - [`functools.lru_cache`](https://docs.python.org/3/library/functools.html) - and in an interview it is usually the faster thing to get correct under pressure, because the recurrence maps directly onto the code.

```python
from functools import lru_cache

def coin_change(coins, amount):
    @lru_cache(maxsize=None)
    def best(remaining):
        if remaining == 0:
            return 0
        if remaining < 0:
            return float("inf")
        return min((best(remaining - c) + 1 for c in coins), default=float("inf"))
    result = best(amount)
    return result if result != float("inf") else -1
```

**Bottom-up (tabulation)** builds the table iteratively. It has no recursion depth limit, it is usually faster in practice, and it is the version that lets you do the space optimisation below.

A reasonable interview strategy: write the top-down version first because it is closer to how you reasoned about the problem, say out loud that the bottom-up version avoids the stack and can often drop to O(1) space, and convert it if there is time. That sequence shows both the reasoning and the awareness, which is what is being scored.

## The five patterns that cover most DP questions

### Linear DP

One dimension, each cell depending on a fixed number of previous cells.

Climbing Stairs, House Robber, Decode Ways, Longest Increasing Subsequence.

**State:** `dp[i]` is the answer considering the first `i` elements.

### Knapsack

Choose a subset under a capacity constraint.

0/1 Knapsack, Partition Equal Subset Sum, Target Sum, Coin Change.

**State:** `dp[i][w]` is the best using the first `i` items with capacity `w`. The 0/1 and unbounded variants differ by exactly one thing: the direction you iterate the capacity loop. Getting that backwards is the classic bug, and it is worth writing out both once so you can tell them apart under pressure.

### Two-sequence DP

A grid indexed by positions in two strings.

Longest Common Subsequence, Edit Distance, Regular Expression Matching.

**State:** `dp[i][j]` is the answer for the first `i` of one and the first `j` of the other. Almost always: if the characters match, take the diagonal; if not, take the best of the neighbours.

### Grid DP

Paths through a two-dimensional grid.

Unique Paths, Minimum Path Sum, Maximal Square.

**State:** `dp[r][c]` is the answer for reaching that cell.

### Interval DP

The answer over a range, built from shorter ranges.

Longest Palindromic Substring, Burst Balloons, Matrix Chain Multiplication.

**State:** `dp[i][j]` over the range `i` to `j`. These are the hardest of the five and the rarest in interviews; do not spend your first month here.

## Space optimisation, and when to mention it

If `dp[i]` only depends on `dp[i-1]`, you do not need the array:

```python
def climb_stairs(n):
    prev, curr = 1, 1
    for _ in range(n - 1):
        prev, curr = curr, prev + curr
    return curr
```

O(n) time, O(1) space. The same trick reduces two-dimensional knapsack from O(n·W) to O(W) by keeping one row.

Say it, do not necessarily write it. "This is O(n) space, and since each row only depends on the previous one it collapses to O(W)" is worth as much as the implementation and costs thirty seconds instead of ten minutes.

## A practice order that works

Do these in order, and do not skip ahead because the early ones look easy - they are the ones that build the reflex:

1. Climbing Stairs
2. House Robber
3. Coin Change
4. Longest Increasing Subsequence
5. Unique Paths
6. Longest Common Subsequence
7. Word Break
8. Partition Equal Subset Sum
9. Edit Distance
10. Best Time to Buy and Sell Stock with Cooldown

After each one, write down the state definition in a single sentence. If you cannot say what `dp[i]` *means* in English, you copied a recurrence rather than understanding one, and it will not transfer to the next problem.

DP sits inside a broader taxonomy - see [the coding interview patterns guide](/blogs/coding-interview-patterns) for where it fits and what the other fourteen are - and [the three-month study plan](/blogs/dsa-study-plan-coding-interview) puts it in weeks 7 and 8, which is the right place for it. Doing DP in week one is how people conclude they are bad at algorithms.

## What interviewers are actually scoring

Not whether you produce the optimal solution immediately. The signal is the sequence: state a brute force, notice the repeated work out loud, define the subproblem, write the recurrence, then code it.

A candidate who says "this recomputes `best(3)` several times, so let me cache it" and arrives at a correct memoised solution scores better than one who silently writes an optimal table nobody watched them reason about. The reasoning is the interview. The code is the artefact.

## The three bugs that account for most wrong DP answers

**Iterating the capacity loop in the wrong direction.** In 0/1 knapsack each item may be
used once, so the inner loop runs *downward*; in the unbounded version it runs upward. Get
it backwards and you silently allow an item to be reused, which produces a plausible wrong
answer rather than an error.

```python
# 0/1: each item once. Downward.
for item in items:
    for w in range(capacity, item.weight - 1, -1):
        dp[w] = max(dp[w], dp[w - item.weight] + item.value)

# Unbounded: reuse allowed. Upward.
for item in items:
    for w in range(item.weight, capacity + 1):
        dp[w] = max(dp[w], dp[w - item.weight] + item.value)
```

Write both out once, side by side, and the difference becomes memorable. Under pressure it
is otherwise a coin flip.

**Getting the base case wrong by one.** `dp[0]` almost always means "the empty case", and
it is usually 0 or 1 depending on whether you are counting cost or counting ways. For
"number of ways to make 0", the answer is 1 - there is exactly one way to pick nothing -
and setting it to 0 makes every subsequent cell zero.

**Returning the wrong cell.** For a problem asking about the best answer over *any* prefix
rather than the full input, the answer is `max(dp)` and not `dp[n]`. Longest Increasing
Subsequence is the classic case, and the bug passes the first test and fails the second.

## Saying it out loud, in order

There is a script for the DP portion of an interview, and following it scores better than
producing the table silently:

1. "The brute force tries every combination, which is exponential."
2. "But it recomputes `best(3)` several times, so there is overlapping structure."
3. "Let me define the subproblem: `dp[i]` is the fewest coins that make exactly `i`."
4. "The base case is `dp[0] = 0`."
5. "The transition is `dp[i] = min(dp[i - c] + 1)` over coins that fit."
6. "The answer is `dp[amount]`, and I need a sentinel for unreachable."
7. "That is O(amount x coins) time and O(amount) space."

Steps 3 and 4 are where most candidates go quiet and start typing. Saying them costs
fifteen seconds and it is the entire difference between an interviewer watching you reason
and an interviewer watching you recall.

## When a DP problem is not a DP problem

Two traps worth recognising:

**Greedy actually works.** For interval scheduling, or Jump Game, or activity selection,
there is a local rule that is provably optimal. Reaching for DP produces a correct but
overcomplicated answer, and an interviewer who asks "could this be simpler" is telling you
something.

**It is really a graph problem.** Shortest path on a weighted graph is Dijkstra, not DP,
even though it has optimal substructure. If the state has cycles, a table filled in order
does not work, because there is no order.

The check: **is there a strict order in which subproblems can be solved?** DP needs one. If
you cannot name it - "by increasing `i`", "by increasing string length" - the problem is
probably something else.
