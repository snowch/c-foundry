# Chapter 37: Atomics and the C memory model

Part 8: Concurrency in C

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Atomic operations and happens-before relationships
2. Sequential consistency first
3. Acquire/release through concrete examples
4. Why volatile does not provide thread synchronization

## Practice goal

Compare a mutex-protected counter with a C11 atomic counter.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=atomics
```

## Available foundation

```sh
make counter
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
