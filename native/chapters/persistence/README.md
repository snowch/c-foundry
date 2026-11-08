# Chapter 25: Persistent storage

Part 5: Build TinyDB

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Encoding a file header and schema
2. Serializing rows without dumping raw structs
3. Reading and writing fixed-size pages
4. Building a pager abstraction
5. Browser-backed files, import, and export
6. Testing truncated and corrupt input

## Practice goal

Persist rows through a pager and reject corrupt database input.

## Execution

Read and explore the concepts here; use Linux for the evolving multi-file database project. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=persistence
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
