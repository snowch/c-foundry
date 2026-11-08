#include <assert.h>
#include <pthread.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define CHECK(call) do { if ((call) != 0) { fputs("pthread failure\n", stderr); exit(1); } } while (0)
enum { CAPACITY = 8, ITEMS = 5000 };
typedef struct {
    int values[CAPACITY];
    int head, tail, count;
    bool closed;
    pthread_mutex_t lock;
    pthread_cond_t readable, writable;
} Queue;
static Queue queue = { .lock = PTHREAD_MUTEX_INITIALIZER,
    .readable = PTHREAD_COND_INITIALIZER, .writable = PTHREAD_COND_INITIALIZER };
static long sum;
static int consumed;

static void *produce(void *unused) {
    (void)unused;
    for (int value = 1; value <= ITEMS; ++value) {
        CHECK(pthread_mutex_lock(&queue.lock));
        /* Always recheck the predicate after waking, including spurious wakeups. */
        while (queue.count == CAPACITY) CHECK(pthread_cond_wait(&queue.writable, &queue.lock));
        queue.values[queue.tail] = value;
        queue.tail = (queue.tail + 1) % CAPACITY;
        queue.count++;
        CHECK(pthread_cond_signal(&queue.readable));
        CHECK(pthread_mutex_unlock(&queue.lock));
    }
    CHECK(pthread_mutex_lock(&queue.lock));
    queue.closed = true;
    CHECK(pthread_cond_broadcast(&queue.readable));
    CHECK(pthread_mutex_unlock(&queue.lock));
    return NULL;
}

static void *consume(void *unused) {
    (void)unused;
    for (;;) {
        CHECK(pthread_mutex_lock(&queue.lock));
        while (queue.count == 0 && !queue.closed) CHECK(pthread_cond_wait(&queue.readable, &queue.lock));
        if (queue.count == 0 && queue.closed) {
            CHECK(pthread_mutex_unlock(&queue.lock));
            break;
        }
        int value = queue.values[queue.head];
        queue.head = (queue.head + 1) % CAPACITY;
        queue.count--;
        CHECK(pthread_cond_signal(&queue.writable));
        CHECK(pthread_mutex_unlock(&queue.lock));
        /* Only this consumer writes these two variables; main reads after join. */
        sum += value;
        consumed++;
    }
    return NULL;
}

int main(void) {
    pthread_t producer, consumer;
    CHECK(pthread_create(&consumer, NULL, consume, NULL));
    CHECK(pthread_create(&producer, NULL, produce, NULL));
    CHECK(pthread_join(producer, NULL));
    CHECK(pthread_join(consumer, NULL));
    assert(consumed == ITEMS && sum == (long)ITEMS * (ITEMS + 1) / 2);
    printf("consumed=%d sum=%ld queue_empty=%d\n", consumed, sum, queue.count == 0);
    CHECK(pthread_cond_destroy(&queue.readable));
    CHECK(pthread_cond_destroy(&queue.writable));
    CHECK(pthread_mutex_destroy(&queue.lock));
    return 0;
}
