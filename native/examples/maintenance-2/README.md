# Checkpoints and log truncation

Complete native example, ready to edit and run in Codespaces or locally.

## 42.2 Checkpoints and log truncation

A checkpoint permits old log removal only after the snapshot is safely published. Reversing that order can erase the only recoverable copy.

This Linux/POSIX teaching fixture pauses writers, writes and syncs a temporary snapshot, renames it to the checkpoint path, syncs the directory, then truncates and syncs the older log. The fixed 16-byte snapshot encodes a small LSN and value with zero high bytes. A concurrent engine additionally needs a consistent snapshot boundary, complete page coverage, checksums, and a carefully defined log retention horizon.

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

**Try:** Use KEEP_FILES=1 to inspect the artifacts, then inject failure after each protocol step and verify a valid recovery source remains.

Run from the repository root:

```sh
make example EXAMPLE=maintenance-2 KEEP_FILES=1
```

