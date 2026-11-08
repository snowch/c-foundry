# Chapter 38: Build a concurrent storage service

Part 8: Concurrency in C

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. C11 threading facilities versus POSIX threads
2. A bounded work queue
3. A single writer processing requests
4. Shutdown, cancellation, and concurrency testing

## Practice goal

Use the queue as a foundation for a single-writer storage service.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=concurrent-storage
```

## Available foundation

```sh
make queue
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
