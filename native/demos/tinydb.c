/* A coarse-lock in-memory table, not a persistent or transactional database yet. */
#include <assert.h>
#include <pthread.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(call) do { if ((call) != 0) { fputs("pthread failure\n", stderr); exit(1); } } while (0)
enum { CAPACITY = 64, WRITERS = 4, PER_WRITER = 16 };
typedef struct { int id; char name[32]; } Row;
typedef struct { Row rows[CAPACITY]; int count; pthread_mutex_t lock; } Database;
static Database db = { .lock = PTHREAD_MUTEX_INITIALIZER };

enum InsertResult { INSERTED, DUPLICATE, FULL };
static enum InsertResult insert_row(Row row) {
    CHECK(pthread_mutex_lock(&db.lock));
    enum InsertResult result = INSERTED;
    for (int i = 0; i < db.count; ++i) {
        if (db.rows[i].id == row.id) { result = DUPLICATE; break; }
    }
    if (result == INSERTED) {
        if (db.count == CAPACITY) result = FULL;
        else db.rows[db.count++] = row;
    }
    CHECK(pthread_mutex_unlock(&db.lock));
    return result;
}

static bool find_row(int id, Row *out) {
    bool found = false;
    CHECK(pthread_mutex_lock(&db.lock));
    for (int i = 0; i < db.count; ++i) {
        if (db.rows[i].id == id) {
            *out = db.rows[i]; /* Return a copy; no internal pointer escapes the lock. */
            found = true;
            break;
        }
    }
    CHECK(pthread_mutex_unlock(&db.lock));
    return found;
}

static void *write_rows(void *arg) {
    int base = *(int *)arg;
    for (int i = 0; i < PER_WRITER; ++i) {
        Row row = { .id = base + i };
        snprintf(row.name, sizeof row.name, "row-%d", row.id);
        assert(insert_row(row) == INSERTED);
        Row copy;
        assert(find_row(row.id, &copy) && strcmp(copy.name, row.name) == 0);
    }
    return NULL;
}

int main(void) {
    pthread_t writers[WRITERS];
    int starts[WRITERS];
    for (int i = 0; i < WRITERS; ++i) {
        starts[i] = i * PER_WRITER;
        CHECK(pthread_create(&writers[i], NULL, write_rows, &starts[i]));
    }
    for (int i = 0; i < WRITERS; ++i) CHECK(pthread_join(writers[i], NULL));
    assert(db.count == CAPACITY);
    Row duplicate = { .id = 0, .name = "replacement" };
    assert(insert_row(duplicate) == DUPLICATE);
    Row extra = { .id = 99, .name = "extra" };
    assert(insert_row(extra) == FULL);
    Row copy;
    assert(!find_row(99, &copy));
    assert(find_row(0, &copy) && strcmp(copy.name, "row-0") == 0);
    puts("rows=64 duplicate=rejected full=rejected missing=not-found");
    CHECK(pthread_mutex_destroy(&db.lock));
    return 0;
}
