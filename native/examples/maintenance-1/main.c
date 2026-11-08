#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
enum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };
void log_record(unsigned char *out, unsigned kind, unsigned tx,
                uint32_t value) {
  memset(out, 0, LOG_BYTES);
  out[0] = (unsigned char)kind;
  out[1] = (unsigned char)tx;
  put32(out + 4, value);
}
uint32_t recover(const unsigned char *log, size_t length, uint32_t base) {
  unsigned active = 0;
  uint32_t pending = base;
  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;
       at += LOG_BYTES) {
    const unsigned char *r = log + at;
    if (!r[1] || r[2] || r[3])
      break;
    if (r[0] == BEGIN_REC) {
      if (active)
        break;
      active = r[1];
      pending = base;
    } else if (r[0] == SET_REC) {
      if (active != r[1])
        break;
      pending = get32(r + 4);
    } else if (r[0] == COMMIT_REC) {
      if (active != r[1])
        break;
      base = pending;
      active = 0;
    } else
      break;
  }
  return base;
}
typedef struct {
  uint64_t lsn;
  unsigned kind, tx;
  uint32_t value;
} LogRecord;
typedef struct {
  uint64_t applied;
  uint32_t value;
} Checkpoint;
Checkpoint replay(const LogRecord *log, size_t n, Checkpoint base) {
  unsigned active = 0;
  uint64_t seen = base.applied;
  uint32_t pending = base.value;
  for (size_t i = 0; i < n; ++i) {
    LogRecord r = log[i];
    if (r.lsn <= base.applied)
      continue;
    if (seen == UINT64_MAX || r.lsn != seen + 1 || !r.tx)
      break;
    seen = r.lsn;
    if (r.kind == BEGIN_REC) {
      if (active)
        break;
      active = r.tx;
      pending = base.value;
    } else if (r.kind == SET_REC) {
      if (active != r.tx)
        break;
      pending = r.value;
    } else if (r.kind == COMMIT_REC) {
      if (active != r.tx)
        break;
      base = (Checkpoint){r.lsn, pending};
      active = 0;
    } else
      break;
  }
  return base;
}

int main(void) {
  LogRecord log[] = {{1, BEGIN_REC, 1, 0},  {2, SET_REC, 1, 10},
                     {3, COMMIT_REC, 1, 0}, {4, BEGIN_REC, 2, 0},
                     {5, SET_REC, 2, 20},   {6, COMMIT_REC, 2, 0}};
  Checkpoint result = replay(log, 6, (Checkpoint){3, 10});
  printf("value=%u applied=%llu\n", (unsigned)result.value,
         (unsigned long long)result.applied);
  return 0;
}
