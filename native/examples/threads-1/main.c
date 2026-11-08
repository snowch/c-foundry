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
  int input, result;
} Job;
void *twice_job(void *arg) {
  Job *job = arg;
  job->result = job->input * 2;
  return NULL;
}

int main(void) {
  pthread_t threads[4];
  Job jobs[4];
  for (int i = 0; i < 4; ++i) {
    jobs[i] = (Job){i + 1, 0};
    CHECK(pthread_create(&threads[i], NULL, twice_job, &jobs[i]));
  }
  int sum = 0;
  for (int i = 0; i < 4; ++i) {
    CHECK(pthread_join(threads[i], NULL));
    sum += jobs[i].result;
  }
  printf("joined=4 sum=%d\n", sum);
  return 0;
}
