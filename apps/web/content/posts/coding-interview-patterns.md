Most coding interview problems are the same fifteen or so problems wearing different clothes. Once you can name the pattern, the blank-page panic goes away, because you are no longer inventing an approach from nothing - you are choosing one from a shortlist.

This is that shortlist. For each pattern: what it looks like, the signal in the question that should trigger it, and the two or three problems worth solving to make it stick.

## Why patterns beat problem count

The most common preparation strategy is volume: solve four hundred problems and hope coverage does the work. It half works, and the way it fails is specific. You develop recall for problems you have seen and nothing for problems you have not, so a novel question in an interview feels like a completely new thing rather than a variation on something familiar.

Pattern-first practice inverts that. You solve fewer problems and spend the extra time asking "what class of problem was this, and what was the signal?" [NeetCode's roadmap](https://neetcode.io/roadmap) is built on exactly this principle, and the [Tech Interview Handbook's algorithm cheatsheets](https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/) organise the same material by data structure with the common gotchas listed per topic.

A useful test: after solving a problem, close it and write down the pattern name and the trigger in one sentence. If you cannot, you have memorised a solution rather than learned anything.

## The patterns

### 1. Two pointers

Two indices moving through a sequence, usually from opposite ends or at different speeds.

**Trigger:** a sorted array, or any problem asking for a pair, triplet or palindrome check.

**Why it works:** it turns an O(n²) nested loop into O(n) by using the ordering to decide which pointer to move.

**Solve:** Two Sum II, Container With Most Water, 3Sum.

### 2. Fast and slow pointers

Two pointers through the same structure at different speeds.

**Trigger:** cycle detection, or "find the middle" in a structure with no length.

**Solve:** Linked List Cycle, Find the Duplicate Number, Middle of the Linked List.

### 3. Sliding window

A window over a contiguous range that grows and shrinks rather than restarting.

**Trigger:** "longest", "shortest" or "maximum" over a **contiguous** subarray or substring. The word contiguous is the signal. If the elements do not have to be adjacent, this is not it.

**Solve:** Longest Substring Without Repeating Characters, Minimum Window Substring, Maximum Average Subarray.

### 4. Prefix sums

Precompute cumulative totals so a range query is one subtraction.

**Trigger:** repeated range-sum queries, or "subarray sums to k".

**Solve:** Subarray Sum Equals K, Range Sum Query, Product of Array Except Self.

### 5. Hash map counting

Count or index things so a lookup replaces a scan.

**Trigger:** "have I seen this", "how many of each", "group these". This is the single highest-yield pattern in interviews and the one most people already half-know.

**Solve:** Group Anagrams, Top K Frequent Elements, Valid Anagram.

### 6. Binary search

Halve the search space each step.

**Trigger:** a sorted input, or - and this is the version people miss - a **monotonic answer space**. If "is X achievable" is false for everything below some threshold and true for everything above, you can binary search the answer even when nothing is sorted.

**Solve:** Search in Rotated Sorted Array, Koko Eating Bananas, Find Minimum in Rotated Sorted Array.

### 7. Stack

Last in, first out. Often for matching or for maintaining a monotonic sequence.

**Trigger:** brackets, nested structure, "next greater element", or undo semantics.

**Solve:** Valid Parentheses, Daily Temperatures, Largest Rectangle in Histogram.

### 8. Heap and top-k

A priority queue that keeps the k best.

**Trigger:** "top k", "k closest", "median of a stream", merging sorted inputs.

**Why a heap and not a sort:** sorting is O(n log n) for the whole input; a size-k heap is O(n log k), which matters when k is small and n is large.

**Solve:** Kth Largest Element, Merge k Sorted Lists, Find Median from Data Stream.

### 9. Intervals

Sort by start, then merge or sweep.

**Trigger:** meetings, bookings, ranges, overlaps.

**Solve:** Merge Intervals, Insert Interval, Meeting Rooms II.

### 10. Tree traversal

DFS for structure, BFS for level.

**Trigger:** anything with a tree in it. The choice is the whole decision: "level" or "shortest" means BFS, "path" or "subtree" means DFS.

**Solve:** Binary Tree Level Order Traversal, Validate BST, Lowest Common Ancestor.

### 11. Graph traversal

The same two traversals on a structure with cycles, so you need a visited set.

**Trigger:** grids, networks, dependencies, "can I reach".

**Solve:** Number of Islands, Course Schedule, Clone Graph.

### 12. Topological sort

Order nodes so every dependency comes before its dependent.

**Trigger:** prerequisites, build order, "is there a cycle in this dependency graph".

**Solve:** Course Schedule II, Alien Dictionary.

### 13. Backtracking

Try, recurse, undo.

**Trigger:** "all permutations", "all combinations", "all valid ways". If the question asks for every solution rather than the best one, it is this.

**Solve:** Subsets, Permutations, N-Queens, Word Search.

### 14. Dynamic programming

Overlapping subproblems plus optimal substructure.

**Trigger:** "how many ways", "minimum or maximum cost", and a recursive solution that recomputes the same inputs. It has enough depth to deserve its own treatment - see [the dynamic programming guide](/blogs/dynamic-programming-interview-guide).

**Solve:** Climbing Stairs, Coin Change, Longest Common Subsequence.

### 15. Union-find

Keep track of which things are connected.

**Trigger:** connected components, "are these two in the same group", cycle detection in an undirected graph.

**Solve:** Number of Connected Components, Redundant Connection.

## The trigger table

The compressed version, for the ten seconds after you hear the question:

| What the question says | Reach for |
|---|---|
| sorted array, find a pair | two pointers |
| contiguous subarray, longest or shortest | sliding window |
| have I seen this, count these, group these | hash map |
| repeated range sums | prefix sums |
| sorted, or a monotonic yes/no answer | binary search |
| brackets, nesting, next greater | stack |
| top k, k closest, running median | heap |
| overlapping ranges | sort by start, then sweep |
| shortest path, level by level | BFS |
| all paths, subtree property | DFS |
| prerequisites, build order | topological sort |
| every valid arrangement | backtracking |
| how many ways, min or max cost | dynamic programming |
| are these connected | union-find |

Print it, or do not - the point is to be able to reconstruct it, which happens after you have used each pattern three or four times rather than after reading it once.

## How to actually practise this

Pick one pattern per week rather than one problem per day across all of them. Solve three problems in that pattern back to back, and after the third, write the trigger down in your own words.

Then, a week later, do one more problem from that pattern cold. The gap is the part that works: recall a week after the fact is what tells you whether it went in, and it is what a problem-per-day schedule never tests. The [three-month DSA plan](/blogs/dsa-study-plan-coding-interview) sequences this properly, and [the alternatives guide](/blogs/leetcode-alternatives) covers where to practise if LeetCode is not doing it for you.

If you find yourself stuck for more than twenty-five minutes, read the solution, then close it and reimplement from memory the same day. Staring at a problem you have no approach for teaches you nothing except that you are stuck.

## What patterns will not do for you

They will not get you through a debugging round, a take-home, or a system design interview, and they will not help you explain your own project. Those are separate skills with separate practice, and the mistake is assuming the pattern work covers them. [The technical phone screen guide](/blogs/technical-phone-screen-guide) covers the round that usually comes first.

Patterns solve exactly one problem: the blank page at minute one of a coding interview. That is a real problem and worth solving. It is just not the only one.

## Two patterns people confuse, and how to tell them apart

**Sliding window versus two pointers.** They look identical - two indices moving through
an array - and the distinction is what the indices mean. In a sliding window, the region
*between* the pointers is the answer you are maintaining, and both pointers move in the
same direction. In two pointers, the region between them is the search space you are
shrinking, and they move toward each other.

The practical tell: if you find yourself adding and removing elements from a running total
as the pointers move, it is a window. If you are comparing the values *at* the two
pointers and deciding which to advance, it is two pointers.

**Backtracking versus DFS.** Backtracking *is* DFS, with one addition: you undo the choice
on the way back up. Every backtracking solution has the shape `choose, recurse, unchoose`,
and if you forget the unchoose, you get a subtly wrong answer rather than a crash - which
is why it is the hardest bug in this category to spot.

```python
def subsets(nums):
    out, path = [], []
    def walk(i):
        if i == len(nums):
            out.append(path[:])       # copy, or every entry aliases the same list
            return
        path.append(nums[i]); walk(i + 1); path.pop()   # choose, recurse, UNCHOOSE
        walk(i + 1)
    walk(0)
    return out
```

The `path[:]` is the other classic bug in the same six lines. Appending `path` itself gives
you a list of references to one mutating list, and every entry ends up empty.

## The problems worth doing twice

Some problems teach a pattern; a few teach the *boundary* of a pattern, and those are worth
returning to a month later:

| Problem | What it actually teaches |
|---|---|
| Minimum Window Substring | A window that shrinks from the left while the right keeps moving - the general form, not the easy case |
| Koko Eating Bananas | Binary search on an answer space with nothing sorted anywhere |
| Course Schedule II | Topological sort and cycle detection are the same traversal |
| Word Search | Backtracking on a grid, where the unchoose is a cell you have to un-mark |
| Merge k Sorted Lists | Why a heap beats repeated linear scans, with a complexity you can state |

If you can do those five cold, you can handle most variations of the fourteen other
patterns, because each one sits at the edge of its category rather than in the middle.
