#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <pthread.h>
#include <sched.h>
#include <stdatomic.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(call)                                                            \
  do {                                                                         \
    int error = (call);                                                        \
    if (error) {                                                               \
      fprintf(stderr, "thread error %d\n", error);                             \
      exit(1);                                                                 \
    }                                                                          \
  } while (0)
typedef struct {
  int a, b;
  pthread_rwlock_t lock;
} Account;
Account account = {100, 0, PTHREAD_RWLOCK_INITIALIZER};
atomic_bool invalid_read;
void *transfer(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    CHECK(pthread_rwlock_wrlock(&account.lock));
    if (i % 2 == 0) {
      --account.a;
      ++account.b;
    } else {
      ++account.a;
      --account.b;
    }
    CHECK(pthread_rwlock_unlock(&account.lock));
  }
  return NULL;
}
void *read_total(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    CHECK(pthread_rwlock_rdlock(&account.lock));
    if (account.a + account.b != 100)
      atomic_store(&invalid_read, true);
    CHECK(pthread_rwlock_unlock(&account.lock));
  }
  return NULL;
}
void run_accounts(void) {
  atomic_init(&invalid_read, false);
  pthread_t writer, readers[2];
  CHECK(pthread_create(&writer, NULL, transfer, NULL));
  for (unsigned i = 0; i < 2; ++i)
    CHECK(pthread_create(&readers[i], NULL, read_total, NULL));
  CHECK(pthread_join(writer, NULL));
  for (unsigned i = 0; i < 2; ++i)
    CHECK(pthread_join(readers[i], NULL));
}

int main(void) {
  run_accounts();
  printf("consistent=%d final_total=%d\n", !atomic_load(&invalid_read),
         account.a + account.b);
  CHECK(pthread_rwlock_destroy(&account.lock));
  return 0;
}
