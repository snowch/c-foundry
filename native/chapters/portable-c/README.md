# Chapter 33: Writing portable C

Part 7: C standards and portable systems programming

This is a chapter workspace and syllabus stub. Full instruction and graded exercises are planned.

## Planned topics

1. Standard library versus operating-system APIs
2. Fixed-width types, endianness, and binary compatibility
3. Feature detection and conditional compilation
4. Native platforms versus WebAssembly/WASI

## Practice goal

Compare GCC and Clang builds and inspect platform-dependent properties.

## Execution

Multi-file builds, native diagnostics, or compiler features need the Linux toolchain. All explanations and previews remain readable in the web course.

From the repository root:

```sh
make chapter CHAPTER=portable-c
```

## Available foundation

```sh
make standards
```

This runnable demonstration is a starting point, not an implementation of every topic in this chapter.
