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
atomic_bool ready;
int payload;
void *publish_payload(void *unused) {
  (void)unused;
  payload = 42;
  atomic_store_explicit(&ready, true, memory_order_release);
  return NULL;
}

int main(void) {
  atomic_init(&ready, false);
  pthread_t writer;
  CHECK(pthread_create(&writer, NULL, publish_payload, NULL));
  while (!atomic_load_explicit(&ready, memory_order_acquire))
    sched_yield();
  printf("published=%d\n", payload);
  CHECK(pthread_join(writer, NULL));
  return 0;
}
