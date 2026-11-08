# Chapter 39: Multiple clients, one safe writer

Part 9: Advanced TinyDB

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Request scheduling
2. Transaction boundaries
3. Contention and backpressure

## Practice goal

Extend the native TinyDB baseline with a serialized request path.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=multi-client
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
