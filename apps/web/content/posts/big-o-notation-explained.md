Big O notation describes how the work an algorithm does grows as its input grows. It is not a measure of speed, and that distinction is where most confusion starts: an O(n²) algorithm can beat an O(n log n) one on small inputs and routinely does. What Big O tells you is what happens when the input stops being small.

That is the whole concept. The rest of this is the working vocabulary an interview expects you to have.

## Reading the notation

O(f(n)) means: past some input size, the work grows no faster than f(n), ignoring constant factors.

Two things get dropped, and both are deliberate:

**Constants.** O(2n) is written O(n). Doubling the work does not change how it scales.

**Lower-order terms.** O(n² + n) is written O(n²). At n = 1,000,000 the n² term is a million times larger than the n term, so the n term is noise.

Dropping them is not sloppiness. It is what makes the notation portable - it describes the algorithm rather than the machine, and an algorithm's shape does not change when you buy a faster laptop. [The Wikipedia article on time complexity](https://en.wikipedia.org/wiki/Time_complexity) has the formal definition if you want it.

## The complexities you will actually meet

Ordered from best to worst, with what each one feels like at n = 1,000,000:

| Notation | Name | Operations at n = 1M | Typical source |
|---|---|---|---|
| O(1) | constant | 1 | hash map lookup, array index |
| O(log n) | logarithmic | ~20 | binary search, balanced tree operations |
| O(n) | linear | 1,000,000 | one pass over the input |
| O(n log n) | linearithmic | ~20,000,000 | comparison sorting, divide and conquer |
| O(n²) | quadratic | 1,000,000,000,000 | nested loop over the same input |
| O(2ⁿ) | exponential | more than atoms you can count | naive recursion over subsets |
| O(n!) | factorial | worse | brute-force permutations |

The row worth internalising is O(n log n) to O(n²). At a million elements, that is twenty million operations versus a trillion: the difference between "finishes while you blink" and "does not finish today". Almost every meaningful optimisation in an interview is moving between two adjacent rows of that table.

## How to count it

Three rules cover most code.

**Sequential blocks add, so the larger one wins.**

```python
for x in items:      # O(n)
    print(x)
for y in items:      # O(n)
    print(y)
# O(n) + O(n) = O(2n) = O(n)
```

**Nested loops multiply.**

```python
for x in items:          # n
    for y in items:      # n
        print(x, y)      # O(n * n) = O(n²)
```

**Halving the input each step is logarithmic.**

```python
while lo < hi:
    mid = (lo + hi) // 2   # the search space halves every iteration
```

The one people get wrong is a nested loop over *different* inputs. Two loops over collections of size n and m is O(n·m), not O(n²). If the inner collection is a fixed size - say, always three - it is O(n), because a constant does not become a variable by being written as a loop.

## Space complexity, which people forget

The same notation applied to memory. It counts what your algorithm allocates, not the input it was handed.

```python
def has_duplicate(nums):
    seen = set()          # O(n) space
    for n in nums:        # O(n) time
        if n in seen:
            return True
        seen.add(n)
    return False
```

O(n) time and O(n) space. The sorted alternative is O(n log n) time and O(1) extra space. Neither is correct in the abstract - which one you want depends on whether memory or time is the constraint, and saying that out loud is a large part of what a complexity question is testing.

**Recursion costs space even with no allocation.** Every frame sits on the call stack, so a recursion n deep is O(n) space whether or not you allocate anything. Tree recursion is O(h) where h is the height, which is O(log n) for a balanced tree and O(n) for a degenerate one.

## Amortised, average and worst case

Three different questions, and interviewers do ask which one you mean.

**Worst case** is the guarantee. Unless somebody says otherwise, Big O means this.

**Average case** assumes a distribution over inputs. Quicksort is O(n log n) on average and O(n²) worst case, which is why it is used and why the pivot choice matters.

**Amortised** is the average over a *sequence* of operations. Appending to a dynamic array is O(1) amortised: most appends are O(1), and the occasional resize copies everything, but the cost of that copy spread across the appends that caused it is constant.

The hash map is the one that catches people. Lookup is O(1) average and **O(n) worst case**, when every key collides. That is not a footnote - it is why interviewers ask how a hash map resolves collisions, and why "O(1)" as a flat answer is a weaker one than "O(1) average, O(n) if everything collides".

## The data structure table

The one worth being able to reproduce:

| Structure | Access | Search | Insert | Delete |
|---|---|---|---|---|
| Array | O(1) | O(n) | O(n) | O(n) |
| Dynamic array | O(1) | O(n) | O(1) amortised at end | O(n) |
| Linked list | O(n) | O(n) | O(1) at a known node | O(1) at a known node |
| Hash map | - | O(1) avg, O(n) worst | O(1) avg | O(1) avg |
| Balanced BST | O(log n) | O(log n) | O(log n) | O(log n) |
| Binary heap | O(1) for min or max | O(n) | O(log n) | O(log n) |

Note the linked list row: O(1) insertion **at a node you already have**. Getting to that node is O(n), and quoting the O(1) without the qualifier is a common way to sound more confident than correct. [MDN's Map documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) is a good reference for how a real hash-map implementation behaves.

## Saying it well in an interview

Three things separate a good complexity answer from a correct one.

**State both.** "O(n) time, O(1) space." Volunteering space before you are asked is a small, reliable signal.

**Name the variable.** For a graph, O(V + E) is right and O(n) is meaningless - there are two sizes and it matters which one you mean. For two different inputs, say O(n + m).

**Say which case.** "O(n log n) worst case" or "O(1) average, O(n) if every key collides." Precision here is cheap and it is noticed.

And know your own solution's complexity before the interviewer asks. Being asked "what is the complexity of what you just wrote" and having to work it out under pressure reads as if you wrote it without a plan - which, often, is what happened.

## Where this fits

Complexity is not a topic to study for a week; it is a lens you apply to everything else. Every problem in [the coding interview patterns guide](/blogs/coding-interview-patterns) has a complexity you should be able to state, and the whole point of [dynamic programming](/blogs/dynamic-programming-interview-guide) is turning an exponential recursion into a polynomial table.

The practical habit worth building: after solving anything, before you move on, say the time and space complexity out loud. Ten seconds each, on every problem. That is how it becomes automatic rather than a thing you calculate.

## Four complexity claims that are commonly wrong

**"Sorting is O(n log n)."** Comparison sorting is. Counting sort and radix sort are O(n + k)
and O(nk) respectively, because they do not compare elements - they use the values as
indices. If an interviewer says the input is integers in a bounded range, that is the hint.

**"Checking membership in a list is O(1)."** In a *set* or *dict*, yes on average. In a
Python list or a JavaScript array, `x in items` and `items.includes(x)` are O(n). This is
the single most common accidental O(n²) in interview code:

```python
# O(n^2) - the membership check scans the list every time.
seen = []
for x in items:
    if x in seen: ...
    seen.append(x)

# O(n) - one hash lookup.
seen = set()
for x in items:
    if x in seen: ...
    seen.add(x)
```

**"Slicing is free."** `arr[1:]` in Python and `arr.slice(1)` in JavaScript both **copy**.
A recursion that slices at each level is O(n²) in time and space regardless of how elegant
it looks. Pass indices instead.

**"String concatenation in a loop is fine."** Strings are immutable in most languages, so
`s += x` builds a new string each time and the loop is O(n²). Collect into a list and join
once.

## Reading complexity off a recursion

Two questions answer most recursive cases:

**How many branches, and how deep?** A recursion that makes two calls and reduces the input
by one is O(2ⁿ) - naive Fibonacci. Two calls that each *halve* the input is O(n log n) -
merge sort. One call that halves is O(log n) - binary search.

**What does the work at each level cost?** Merge sort's merge is O(n) at every level and
there are log n levels, hence n log n. Binary search does O(1) at each of log n levels.

The trap is assuming recursion depth equals complexity. A tree recursion of depth n with
branching factor 2 visits 2ⁿ nodes, not n.

## What to say when you do not know

Sometimes you genuinely cannot compute it in the moment. The recoverable answer is to
bound it out loud:

"The outer loop is n. The inner one depends on the input in a way I would need to think
about - it is at most n, so this is O(n²) worst case, but I suspect the amortised cost is
lower because each element is only pushed and popped once. Can I come back to that?"

That is a strong answer. It shows you know what you do not know, it gives a correct upper
bound, and it names the reason the tight bound might be better. Guessing a number
confidently and being wrong is much worse, because the follow-up is "walk me through how
you got that".
