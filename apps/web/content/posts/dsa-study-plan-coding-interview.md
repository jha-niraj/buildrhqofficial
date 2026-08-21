If you search "how to prepare for coding interviews," you will find an overwhelming number of resources, study plans, and LeetCode lists. The problem is not access to information. The problem is knowing which information to prioritize, in what order, and for how long.

This guide gives you the specific 3-month plan used by developers who have successfully cracked coding interviews at FAANG and top-tier companies. It is not a list of 300 problems. It is a structured progression from foundational concepts to interview-ready performance, with clear weekly objectives and a realistic daily time commitment.

## The Right Mental Model for DSA Preparation

Before diving into the plan, you need the right mental model for what you are actually building.

Data structures and algorithms are not facts to memorize. They are tools to recognize. The difference between a candidate who fails a medium LeetCode problem they have seen before and a candidate who solves a hard problem they have never seen is not memorization - it is pattern recognition.

When you see an array problem with a target sum, your brain should immediately think: "Two Pointers or Hash Map." When you see a problem about finding the shortest path, your brain should think: "BFS." When you see overlapping subproblems in a recursive solution, your brain should think: "Dynamic Programming."

This pattern recognition comes from deliberate exposure to enough problems that the trigger conditions become automatic. The study plan below is designed to build this automatic pattern recognition, not to have you memorize 150 solutions.

## Prerequisites: What You Need Before Starting

This plan assumes you can:
- Write basic code in at least one language (Python, Java, C++, or JavaScript)
- Implement basic loops, conditionals, and functions without looking anything up
- Understand basic complexity analysis (what O(n) means)

If you cannot do these things yet, spend 2-3 weeks on these fundamentals first. The DSA study plan will not work without them.

For your interview language: Python is the most popular for interviews because of its concise syntax. If you already know Java or C++ well, stick with it. Do not switch languages for interviews unless you have months to spare - the overhead of adapting to a new syntax under pressure is not worth it.

**Where to solve the problems.** [LeetCode](https://leetcode.com/) is the default and its free tier covers most of the classic set. [NeetCode](https://neetcode.io/practice) organises that same set by pattern with video walkthroughs, which maps almost exactly onto the structure below. The [Tech Interview Handbook](https://www.techinterviewhandbook.org/) is the best free companion guide to the whole process. If you want systematic topic coverage instead of an interview-shaped list, the [CSES Problem Set](https://cses.fi/problemset/) is excellent and free.

## Month 1: Foundations (Weeks 1-4)

The goal of month 1 is to get comfortable with the four foundational data structures and the searching and sorting algorithms that apply to them.

### Week 1: Arrays and Strings

Arrays are the most common interview topic. You need to be completely fluent with them before moving to anything else.

**Concepts to master:**
- Array traversal, insertion, deletion (understand why insertion at the front is O(n))
- Two-pointer technique: one pointer from each end (used for palindrome checks, pair sum problems)
- Sliding window: expanding and contracting a window across the array
- Prefix sums: computing cumulative sums to answer range queries in O(1)

**String-specific:**
- String manipulation in your interview language (split, join, reverse, substring)
- ASCII value operations for character manipulation problems
- Anagram detection using character frequency maps

**Practice problems (do these in order):**
1. Two Sum (understand both O(n²) and O(n) approaches)
2. Best Time to Buy and Sell Stock
3. Contains Duplicate
4. Maximum Subarray (Kadane's Algorithm)
5. Move Zeroes
6. Reverse a String
7. Valid Anagram
8. Longest Substring Without Repeating Characters

For each problem: attempt it for 20 minutes, review the optimal solution if stuck, write the optimal solution from memory the next day.

### Week 2: Hash Maps and Sets

Hash maps are the single most powerful tool in your interview arsenal. When you see a problem that seems like it requires nested loops, there is usually a hash map approach that reduces it to O(n).

**Concepts to master:**
- Hash map creation, lookup, insertion, deletion - all O(1) average
- When to use a hash map (frequency counting, membership testing, mapping relationships)
- When to use a set (deduplication, O(1) membership testing)
- Collision and how hash maps handle it (conceptual understanding, not implementation)

**Practice problems:**
1. Two Sum (now solve with hash map and understand why)
2. Group Anagrams
3. Top K Frequent Elements
4. Valid Parentheses (uses a stack but teaches matching patterns)
5. Longest Consecutive Sequence
6. First Unique Character in a String
7. Subarray Sum Equals K

**Key insight:** If you find yourself writing O(n²) for any array problem, ask yourself: "Can I precompute something into a hash map to eliminate the inner loop?" The answer is yes more often than you think. If the complexity notation itself is shaky, [the Big O guide](/blogs/big-o-notation-explained) covers it properly.

**The complexity table worth memorising.** Averages, not worst cases, except where the
worst case is the thing that bites you:

| Structure | Access | Search | Insert | Delete | Reach for it when |
|---|---|---|---|---|---|
| Array | O(1) | O(n) | O(n) | O(n) | the index is the thing you have |
| Dynamic array | O(1) | O(n) | O(1) amortised at the end | O(n) | same, but the size grows |
| Hash map | - | O(1) avg, O(n) worst | O(1) avg | O(1) avg | counting, grouping, "have I seen this" |
| Hash set | - | O(1) avg | O(1) avg | O(1) avg | deduplication, membership |
| Linked list | O(n) | O(n) | O(1) at a known node | O(1) at a known node | splicing without reindexing |
| Stack | O(n) | O(n) | O(1) | O(1) | matching, undo, iterative DFS |
| Queue / deque | O(n) | O(n) | O(1) | O(1) | BFS, sliding windows |
| Binary heap | O(1) for the min or max | O(n) | O(log n) | O(log n) | top-k, schedulers, merging sorted inputs |
| Balanced BST | O(log n) | O(log n) | O(log n) | O(log n) | ordered data and range queries |

The hash map's O(n) worst case is not a footnote. It is what happens when every key
collides, and it is why interviewers ask how a hash map resolves collisions.

### Week 3: Linked Lists and Stacks/Queues

Linked lists appear in interviews less frequently than arrays but require a specific mental model that takes practice to develop.

**Linked list concepts:**
- Singly vs doubly linked - understand the pointer structure
- Traversal, insertion at head/tail, deletion
- Two-pointer technique on linked lists: fast/slow pointers for cycle detection and finding the middle
- Reversing a linked list: this is foundational and appears in many problems

**Stack and Queue concepts:**
- Stack: LIFO, implemented with array or linked list, used for DFS, expression evaluation, and matching problems
- Queue: FIFO, implemented with deque, used for BFS and scheduling problems
- Monotonic Stack: a stack where elements are always increasing or decreasing, used for "next greater element" problems

**Practice problems:**
1. Reverse a Linked List
2. Merge Two Sorted Lists
3. Detect Cycle in Linked List
4. Remove Nth Node from End
5. Valid Parentheses (stack)
6. Daily Temperatures (monotonic stack)
7. Implement Queue using Stacks

### Week 4: Trees and Recursion

Trees are where many developers struggle because they require a mental model switch: thinking recursively instead of iteratively.

**Tree concepts:**
- Binary tree structure, tree traversal (inorder, preorder, postorder - know all three)
- Height, depth, and diameter of a tree
- DFS vs BFS on trees (DFS with recursion, BFS with a queue)
- Binary Search Tree properties: left subtree < root < right subtree

**Recursion fundamentals:**
- Base case and recursive case
- Call stack and stack overflow risks
- How to trace through recursive calls
- Converting recursive solutions to iterative when needed

**Practice problems:**
1. Maximum Depth of Binary Tree
2. Invert Binary Tree
3. Path Sum
4. Diameter of Binary Tree
5. Lowest Common Ancestor of BST
6. Validate Binary Search Tree
7. Level Order Traversal (uses BFS, bridges to graph traversal)

**The recursion mindset:** When you see a tree problem, ask "what information do I need from the left subtree and the right subtree to solve the problem at the current node?" Then write a function that assumes that information comes from recursive calls.

## Month 2: Intermediate Patterns (Weeks 5-8)

With foundations solid, month 2 covers the intermediate patterns that appear in 60-70% of medium-difficulty interview problems.

### Week 5: Binary Search

Binary search is far more powerful than most developers realize. It applies not just to sorted arrays but to any problem where you have a monotonic function and a target value.

**Core algorithm:** Know the standard implementation cold - with the off-by-one errors handled correctly (when to use `left <= right` vs `left < right`, when to update `left = mid + 1` vs `left = mid`).

**Extended applications:**
- Binary search on the answer: "What is the minimum capacity such that X is achievable?" - binary search over possible answers
- Finding boundaries: first true/last false in a boolean array
- Rotated sorted arrays

**Practice problems:**
1. Binary Search (implement from scratch, get the edge cases right)
2. Search in Rotated Sorted Array
3. Find Minimum in Rotated Sorted Array
4. Time Based Key-Value Store
5. Koko Eating Bananas (binary search on the answer)
6. Find Peak Element
7. Search a 2D Matrix

### Week 6: Graph Traversal

Graphs are the generalization of trees. Once you know tree DFS and BFS, graph traversal adds one thing: cycle detection through a visited set.

**Graph representations:**
- Adjacency list (most common in interviews)
- Adjacency matrix (less common, better for dense graphs)
- Edge list

**Traversal:**
- BFS: use a queue, great for shortest path in unweighted graphs
- DFS: use recursion or a stack, great for connected components and cycle detection
- Both require a visited set to avoid infinite loops in cyclic graphs

**Practice problems:**
1. Number of Islands
2. Clone Graph
3. Course Schedule (cycle detection with topological sort)
4. Pacific Atlantic Water Flow
5. Surrounded Regions
6. Number of Connected Components in an Undirected Graph
7. Rotting Oranges (multi-source BFS)

### Week 7: Heaps and Priority Queues

A heap is a complete binary tree that satisfies the heap property: the parent is always greater (max-heap) or smaller (min-heap) than its children. The Python `heapq` module gives you a min-heap. For a max-heap, negate the values.

**When to use a heap:**
- Finding the k largest/smallest elements
- Median of a data stream (two heaps: max-heap for lower half, min-heap for upper half)
- Problems involving "next minimum" or "next maximum" operations repeatedly

**Practice problems:**
1. Kth Largest Element in an Array
2. Top K Frequent Elements (heap approach)
3. Find Median from Data Stream
4. K Closest Points to Origin
5. Task Scheduler
6. Merge K Sorted Lists

### Week 8: Dynamic Programming Foundations

Dynamic programming is where most developers spend too long and learn too little. The correct approach: understand the two types of DP, practice 15 problems, and move on.

**Memoization (top-down DP):** Add a cache to a recursive solution. Solve the problem recursively, then add `memo = {}` and return cached results.

**Tabulation (bottom-up DP):** Build a table iteratively from base cases to the answer.

**The DP question:** Does this problem have overlapping subproblems? Can the optimal solution be built from optimal solutions to subproblems? If yes to both, it is likely DP.

**Practice problems (start here, in order):**
1. Climbing Stairs
2. House Robber
3. Longest Common Subsequence
4. Coin Change
5. 0/1 Knapsack
6. Longest Increasing Subsequence
7. Word Break
8. Unique Paths

**What a DP table actually looks like.** Coin Change with coins `[1, 3, 4]`, target `6`.
`dp[i]` is the fewest coins that make `i`, and each cell is decided only by cells to its
left:

| `i` | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| `dp[i]` | 0 | 1 | 2 | 1 | 1 | 2 | 2 |
| how | base | `dp[0]+1` | `dp[1]+1` | `dp[0]+1` using 3 | `dp[0]+1` using 4 | `dp[4]+1` using 1 | `dp[3]+1` using 3 |

Read `dp[6]`: the greedy answer is 4+1+1, which is three coins. The table finds 3+3,
which is two. That gap is the entire reason this problem is DP and not greedy.

The recurrence is one line: `dp[i] = min(dp[i - c] + 1)` over every coin `c` that fits.
Write the table out by hand for a small input before you write the loop. Every DP problem
you will be given is that table with different arithmetic in the cell.

The full taxonomy - which pattern each problem type belongs to and what triggers it - is in [the coding interview patterns guide](/blogs/coding-interview-patterns), and dynamic programming has enough depth to deserve [its own treatment](/blogs/dynamic-programming-interview-guide).

## Month 3: Advanced and Interview Simulation (Weeks 9-12)

Month 3 is not about learning new material. It is about strengthening weaknesses, expanding problem exposure, and transitioning from studying to performing.

### Weeks 9-10: Advanced Topics and Weak Areas

Audit your performance from months 1 and 2. Which pattern types did you struggle with most? Spend weeks 9-10 drilling those specifically.

Also cover these advanced topics that appear at harder companies:

**Tries:** Prefix tree for autocomplete and word search problems.

**Union-Find:** For connected components, cycle detection in undirected graphs.

**Backtracking:** Generating all permutations, combinations, and subsets. Solving constraint-satisfaction problems like N-Queens and Sudoku.

**Advanced DP:** Interval DP, 2D DP, DP with bitmask.

You do not need mastery of all of these. You need to recognize them and have a starting approach.

### Weeks 11-12: Mock Interviews and Simulation

This is the most important part of the plan. Stop solving problems cold and start simulating the interview environment:

- 45-minute timer
- Talk out loud through your entire thought process
- No hints during the timer
- Use a coding environment similar to the interview (not your full IDE)
- Do at least 10 full interview simulations over these two weeks

Use ShipItHQ's practice module for structured problem sets with AI hints, and its mock interview platform for full simulated sessions with performance feedback. If you want to vary where you practise, [the LeetCode alternatives guide](/blogs/leetcode-alternatives) covers what each platform is actually good at.

## The Daily Commitment

This plan requires 1-1.5 hours per day, 6 days per week. That is 90-120 total hours over 12 weeks.

Break it down:
- 20 minutes: Review yesterday's problem (write optimal solution from memory)
- 40 minutes: Solve today's new problem (25-minute timer + 15-minute review)
- 20 minutes: Read theory or review a concept

On weekends: do one longer session with timed problem-solving and one mock interview.

Consistency over intensity. Studying 7 days in a row then taking a week off is worse than studying 6 days every week. The forgetting curve requires you to see concepts repeatedly at spaced intervals.

## What to Do the Week Before Your Interviews

Do not learn new material. Review your personal notes from the past 3 months - specifically your notes on problems you struggled with and the insights that helped you.

Do 1-2 mock interviews per day for practice and calibration.

Solve 1 easy problem the morning of the interview to get your brain warmed up.

Sleep. More than you think you need.

Three months of this plan, done consistently, will put you in a position to interview well. The rest is execution.
