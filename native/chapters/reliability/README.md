# Chapter 44: Performance and reliability

Part 9: Advanced TinyDB

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Concurrent workloads and contention measurements
2. Cache behavior and allocation costs
3. Fault injection, fuzzing, and recovery testing

## Practice goal

Evaluate an advanced TinyDB implementation against concurrent and fault-injected workloads.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=reliability
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
