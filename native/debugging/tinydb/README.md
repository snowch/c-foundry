# Optional Part 6 workshop: Repair a broken TinyDB

Read the lesson: https://snowch.github.io/c-foundry/#/chapter/ship/8. Prerequisite: the optional Part 2 GDB lab, https://snowch.github.io/c-foundry/#/chapter/files-bytes/7.

Use GitHub Codespaces, the local Linux dev container, or Linux/WSL with GDB and the course build tools. `main.c` is a frozen copy of the runnable C TinyDB CLI with two deliberate logical faults. The browser CLI and `native/cli/tinydb.c` are independent and remain working. Do not debug a database file you want to keep: every guided launch creates its own three-row fixture under a new `.build/debugging/tinydb/session-*` directory.

## Reproduce two contract failures

```sh
make debug-lab LAB=tinydb
make debug-check LAB=tinydb
```

The independent TDB1 fixture contains `1 | Ada | 90`, `2 | Grace | 80`, and `3 | Linus | 70`. The update case changes ID 2 to score 99, then reopens the file. It should preserve IDs 1 and 3. The delete cases remove the first, middle, or last row and should preserve the other two in order. All four checks initially fail. These are data-integrity bugs even though the processes exit successfully and the program need not crash.

## Investigate UPDATE

```sh
make debug-gdb LAB=tinydb
```

The launcher builds `-g -O0`, seeds a fresh database, and stops in `execute` with `UPDATE people SET score=99 WHERE id=2;` as the argument. Use `info args`, `list execute`, and `backtrace`. Locate the score-assignment line in the source, set `break native/debugging/tinydb/main.c:LINE` there, then `continue`. `LINE` means the current source line number; do not type the word literally.

Before that assignment, inspect:

```gdb
print statement.id
print at
print candidate.rows[at].id
print candidate.rows[0].score
print candidate.rows[1].score
set can-use-hw-watchpoints 0
watch candidate.rows[0].score
continue
```

The intended ID is 2 and the lookup returns slot 1. The watchpoint shows the neighbor at slot 0 changing from 90 to 99. Explain how a correct lookup can still be followed by a write to the wrong row. `up`/`down` and `frame` select call frames; inspect variables only in a frame and scope where they exist.

## Investigate DELETE

Quit GDB and start another fresh fixture:

```sh
make debug-gdb LAB=tinydb CASE=delete
```

This launch uses `DELETE FROM people WHERE id=2;`. Locate the count-decrement line, break just before it, and continue from the initial `execute` breakpoint. Inspect `candidate.rows[0]@3`, `candidate.count`, and `table->count`. Watch `candidate.count`, then continue. Three rows should become two; the faulty update makes the count one. The copied record can still be in memory while the wrong count excludes it from serialization.

## Fix, reopen, and preserve evidence

Edit only `native/debugging/tinydb/main.c` and run:

```sh
make debug-check LAB=tinydb
```

All four cases must pass. They use separate fixtures and reopen the saved database after the mutation; inspecting only the in-memory candidate is insufficient. Add regression cases for a missing ID, deleting the sole row, and rejecting a duplicate insert without changing the file. Write a short incident report for each bug: failed contract, hypothesis, observed frame/values, smallest source fix, and regression test.

After your attempt, inspect `.reference/main.c` or run `make debug-check LAB=tinydb REFERENCE=1`. This validates the separate reference, not your edits. Sanitizer-clean runs cannot establish that the intended row was changed, so retain the behavioral assertions. GDB is an investigation tool, not an alternative to those checks.

This bounded CLI has one table and autocommit file updates. This workshop does not implement the course's separate indexing, transaction, or concurrent-writer models. Files in `.build/` are local build artifacts; `make clean` removes them. Download/commit important evidence before cleaning or deleting a Codespace.
