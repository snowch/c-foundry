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
