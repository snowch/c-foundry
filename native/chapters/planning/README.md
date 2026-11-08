# Chapter 28: Choosing an execution plan

Part 6: Make the database faster and more reliable

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Table scans versus index lookups
2. Simple cost estimates and selectivity
3. Index-assisted filtering and ordering
4. Implementing EXPLAIN
5. Measuring page reads and comparisons
6. Optional: nested-loop joins

## Practice goal

Compare query plans using page reads and a simple cost model.

## Execution

Read and explore the concepts here; use Linux for the evolving multi-file database project. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=planning
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
