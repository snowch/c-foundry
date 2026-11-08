#include <assert.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>
#include <stdlib.h>

#define CHECK(call) do { if ((call) != 0) { fputs("pthread failure\n", stderr); exit(1); } } while (0)
enum { THREADS = 4, ITERATIONS = 10000 };
static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static int protected_count;
static atomic_int atomic_count;

static void *increment(void *unused) {
    (void)unused;
    for (int i = 0; i < ITERATIONS; ++i) {
        CHECK(pthread_mutex_lock(&lock));
        protected_count++;
        CHECK(pthread_mutex_unlock(&lock));
        /* Default atomic operations use sequential consistency. */
        atomic_fetch_add(&atomic_count, 1);
    }
    return NULL;
}

int main(void) {
    pthread_t threads[THREADS];
    atomic_init(&atomic_count, 0);
    for (int i = 0; i < THREADS; ++i) CHECK(pthread_create(&threads[i], NULL, increment, NULL));
    for (int i = 0; i < THREADS; ++i) CHECK(pthread_join(threads[i], NULL));
    assert(protected_count == THREADS * ITERATIONS);
    assert(atomic_load(&atomic_count) == THREADS * ITERATIONS);
    printf("mutex=%d atomic=%d\n", protected_count, atomic_load(&atomic_count));
    CHECK(pthread_mutex_destroy(&lock));
    return 0;
}
