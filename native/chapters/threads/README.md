# Chapter 35: Processes, threads, and shared state

Part 8: Concurrency in C

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Concurrency versus parallelism
2. Thread lifetimes and shared memory
3. Data races and reproducible interleavings

## Practice goal

Run joined threads and distinguish safe shared state from a data race.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=threads
```

## Available foundation

```sh
make counter
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
