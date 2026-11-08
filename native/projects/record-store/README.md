# Chapter 9 project: owned record-store module

Read the chapter first: https://snowch.github.io/c-foundry/#/chapter/larger-programs

This is an exercise, not a completed database. `store.h` defines the contract; fill the TODOs in `store.c`. `tests.c` is a separate caller that checks the public interface.

From the repository root:

```sh
make project PROJECT=record-store
make project PROJECT=record-store SANITIZE=1
```

The unfinished starter is expected to fail. Implement validation, lookup, duplicate and capacity handling, independent name ownership, and cleanup. IDs must be positive; names contain 1–31 bytes before their terminator. Inputs must be valid terminated strings. Failed puts must leave the store unchanged. Initialization is for a fresh object; destruction releases its owners and permits reuse. A borrowed result from get is not a new allocation. No thread safety or persistence is promised.

The tests deliberately mutate the original input to check that the store copied it. They also check duplicate IDs, full capacity, invalid names, destruction, and reuse. Allocation failure is reported by the API but is not deterministically injected by this test suite; use the earlier failure-injection pattern to extend it. Sanitizers add evidence for executed memory paths, not a proof of correctness.

After your attempt, compare `.reference/store.c`:

```sh
make project PROJECT=record-store REFERENCE=1
make project PROJECT=record-store REFERENCE=1 SANITIZE=1
```

The project runner compiles all required source files with an explicit include path and executes in a temporary working directory. Native project checks do not update the browser's practice counter.
