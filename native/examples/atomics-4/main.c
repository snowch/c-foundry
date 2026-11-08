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
atomic_uint counter;
void *increment_counter(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i)
    atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);
  return NULL;
}
unsigned joined_counter(void) {
  atomic_init(&counter, 0);
  pthread_t threads[4];
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_create(&threads[i], NULL, increment_counter, NULL));
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_join(threads[i], NULL));
  return atomic_load_explicit(&counter, memory_order_relaxed);
}

int main(void) {
  volatile unsigned local = 0;
  for (unsigned i = 0; i < 3; ++i)
    ++local;
  printf("local_volatile=%u atomic_total=%u\n", local, joined_counter());
  return 0;
}
