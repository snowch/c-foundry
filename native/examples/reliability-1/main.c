#define _POSIX_C_SOURCE 200809L
#include <errno.h>
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
pthread_mutex_t service_lock = PTHREAD_MUTEX_INITIALIZER;
atomic_uint waited;
unsigned processed;
void *requests(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    int error = pthread_mutex_trylock(&service_lock);
    if (error == EBUSY) {
      atomic_fetch_add(&waited, 1);
      CHECK(pthread_mutex_lock(&service_lock));
    } else if (error)
      exit(1);
    ++processed;
    CHECK(pthread_mutex_unlock(&service_lock));
  }
  return NULL;
}

int main(void) {
  atomic_init(&waited, 0);
  pthread_t workers[4];
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_create(&workers[i], NULL, requests, NULL));
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_join(workers[i], NULL));
  if (processed != 4000)
    return 1;
  printf("requests=%u wait_count_bounded=%d\n", processed,
         atomic_load(&waited) <= processed);
  CHECK(pthread_mutex_destroy(&service_lock));
  return 0;
}
