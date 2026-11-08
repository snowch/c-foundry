# Chapter 40: Concurrent readers and isolation

Part 9: Advanced TinyDB

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Reader/writer locking
2. Lost updates and inconsistent reads
3. Defining and testing an isolation contract

## Practice goal

Specify the behavior of concurrent reads before changing the locking strategy.

## Execution

Threads, synchronization, and native concurrency tests need Linux C execution. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=isolation
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
