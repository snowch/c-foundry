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
pthread_mutex_t gate = PTHREAD_MUTEX_INITIALIZER;
pthread_barrier_t read_barrier;
int shared_value;
void *stale_update(void *unused) {
  (void)unused;
  CHECK(pthread_mutex_lock(&gate));
  int copy = shared_value;
  CHECK(pthread_mutex_unlock(&gate));
  int result = pthread_barrier_wait(&read_barrier);
  if (result != 0 && result != PTHREAD_BARRIER_SERIAL_THREAD)
    exit(1);
  CHECK(pthread_mutex_lock(&gate));
  shared_value = copy + 1;
  CHECK(pthread_mutex_unlock(&gate));
  return NULL;
}

int main(void) {
  CHECK(pthread_barrier_init(&read_barrier, NULL, 2));
  pthread_t a, b;
  CHECK(pthread_create(&a, NULL, stale_update, NULL));
  CHECK(pthread_create(&b, NULL, stale_update, NULL));
  CHECK(pthread_join(a, NULL));
  CHECK(pthread_join(b, NULL));
  printf("final=%d expected_atomic_increment=2\n", shared_value);
  CHECK(pthread_barrier_destroy(&read_barrier));
  CHECK(pthread_mutex_destroy(&gate));
  return 0;
}
