# Checkpoints and log truncation

Complete Linux example, ready to edit and run in the browser terminal.

## 42.2 Checkpoints and log truncation

A checkpoint permits old log removal only after the snapshot is safely published. Reversing that order can erase the only recoverable copy.

This Linux/POSIX teaching fixture pauses writers, writes and syncs a temporary snapshot, renames it to the checkpoint path, syncs the directory, then truncates and syncs the older log. The fixed 16-byte snapshot encodes a small LSN and value with zero high bytes. A concurrent engine additionally needs a consistent snapshot boundary, complete page coverage, checksums, and a carefully defined log retention horizon.

### Checkpoint before retiring recovery information

Log retirement depends on persisted state and the readers that still need it.

A checkpoint determines which logged changes are eligible, writes the required database state and recovery metadata, and establishes the host-specific persistence boundary. Only log or version data no longer needed for recovery or active readers can then be retired. A successful in-memory copy or stream flush alone does not establish this protocol.

A high-level dependency model, not a complete filesystem durability algorithm.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <fcntl.h>
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  unsigned char snapshot[16] = {0x53, 0x4e, 0x50, 0x31};
  snapshot[4] = 3;
  snapshot[12] = 10;
  FILE *log = fopen("wal.log", "w+b");
  if (!log)
    return 1;
  if (fwrite("old-log", 1, 7, log) != 7 || fflush(log) || fsync(fileno(log))) {
    fclose(log);
    return 1;
  }
  FILE *temp = fopen("checkpoint.tmp", "wb");
  if (!temp) {
    fclose(log);
    return 1;
  }
  bool ok = fwrite(snapshot, 1, sizeof snapshot, temp) == sizeof snapshot &&
            fflush(temp) == 0 && fsync(fileno(temp)) == 0;
  int closed = fclose(temp);
  if (!ok || closed || rename("checkpoint.tmp", "checkpoint.db")) {
    fclose(log);
    return 1;
  }
  int dir = open(".", O_RDONLY);
  if (dir < 0) {
    fclose(log);
    return 1;
  }
  int synced = fsync(dir), dir_closed = close(dir);
  if (synced || dir_closed || ftruncate(fileno(log), 0) || fsync(fileno(log))) {
    fclose(log);
    return 1;
  }
  if (fclose(log))
    return 1;
  FILE *read = fopen("checkpoint.db", "rb");
  if (!read)
    return 1;
  unsigned char bytes[16];
  ok = fread(bytes, 1, sizeof bytes, read) == sizeof bytes &&
       memcmp(bytes, snapshot, sizeof bytes) == 0;
  if (fclose(read) || !ok)
    return 1;
  puts("checkpoint=10 applied_lsn=3 wal_truncated=1");
  return 0;
}
```

Output:

```text
checkpoint=10 applied_lsn=3 wal_truncated=1
```

The pass line follows checked file and directory synchronization and a byte-for-byte reload of the published snapshot. It exercises a local filesystem, not all possible power-loss or remote-filesystem behavior.

**Watch for:** Atomic rename alone does not establish every required durability guarantee, and truncating the log first is unsafe.

**Check:** When may the old log be truncated?

1. Before writing the snapshot to save space
2. After the covering checkpoint is durably published

<details><summary>Answer</summary>

After the covering checkpoint is durably published. Recovery needs at least one complete surviving representation of every acknowledged change.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/maintenance-2/main.c, change snapshot[12] from 10 to 17 and update the checkpoint= value printed in puts. Repeat the terminal command, which retains checkpoint.db and wal.log. Compare checkpoint=, applied_lsn=, and wal_truncated=, then use wc -c on those files in the displayed directory. Which file still carries the checkpoint?

**Extend the example:** For a separate fault-injection project, list each write, sync, rename, and truncation boundary. At each injected failure, check which file is a valid recovery source.

### References and help

- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.
- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check) — Compare structural checks with the invariants tested in the teaching database.

**Use the documentation (optional):** What is the role of a checkpoint, and can active readers affect reclaiming log data?

<details><summary>Compare your answer</summary>

A checkpoint transfers eligible log changes toward the main database representation. A live reader can still need an older view, so reclaiming log/version data must respect the implementation’s reader rules.

</details>

Native source: `native/examples/maintenance-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=maintenance-2 KEEP_FILES=1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

