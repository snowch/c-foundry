# Chapter 34: Hardening TinyDB

Part 7: C standards and portable systems programming

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Auditing assumptions about types and memory
2. Versioning the database format
3. Multiple compilers and warning settings
4. Sanitizers and portability checks

## Practice goal

Run the TinyDB baseline under stricter compiler and sanitizer checks.

## Execution

Multi-file builds, native diagnostics, or compiler features need the Linux toolchain. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=hardening-tinydb
```

## Available foundation

```sh
make tinydb
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
