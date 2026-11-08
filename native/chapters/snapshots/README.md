# Chapter 41: Snapshots and versioned records

Part 9: Advanced TinyDB

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Snapshot reads
2. An introduction to MVCC
3. Visibility rules and reclaiming old versions

## Practice goal

Design version visibility tests before implementing snapshot reads.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=snapshots
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
