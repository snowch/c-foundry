# Chapter 30: Final project: ship your database

Part 6: Make the database faster and more reliable

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. End-to-end SQL tests
2. Property tests and fuzzing the parser
3. Fault injection and recovery tests
4. Benchmarks across growing datasets
5. Memory and resource audits
6. File-format documentation and compatibility
7. Exportable database files and a browser demonstration

## Practice goal

Ship a documented TinyDB build with tests, benchmarks, and exportable files.

## Execution

Native file operations and recovery tooling are used for the database project. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=ship
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
