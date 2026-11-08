# Chapter 29: Transactions and recovery

Part 6: Make the database faster and more reliable

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Atomicity, consistency, isolation, and durability
2. A single-writer transaction model
3. BEGIN, COMMIT, and ROLLBACK
4. Write-ahead logging
5. Recovery after an interrupted write
6. Browser storage guarantees and their limits

## Practice goal

Recover committed changes after simulated interruptions.

## Execution

Native file operations and recovery tooling are used for the database project. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=recovery
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
