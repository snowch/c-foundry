# Chapter 27: B+ tree indexes

Part 6: Make the database faster and more reliable

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Why databases use page-oriented trees
2. Leaf pages and internal pages
3. Searching and ordered traversal
4. Inserting keys and splitting pages
5. Range queries and linked leaves
6. Deletion, redistribution, and merging

## Practice goal

Implement an ordered index that remains valid when pages split.

## Execution

Read and explore the concepts here; use Linux for the evolving multi-file database project. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=bplus-trees
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
