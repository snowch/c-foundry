#ifndef STORE_H
#define STORE_H
#include <stddef.h>

enum { STORE_CAPACITY = 16, STORE_NAME_MAX = 31 };
typedef enum { STORE_OK, STORE_INVALID, STORE_DUPLICATE, STORE_FULL, STORE_NO_MEMORY } StoreStatus;
typedef struct { int id; char *name; } StoreRow;
typedef struct { StoreRow rows[STORE_CAPACITY]; size_t count; } Store;

/* Initialize a fresh store. Reinitializing an owning store would leak its allocations. */
void store_init(Store *store);
/* Borrow name during the call; on success the store owns an independent copy. */
StoreStatus store_put(Store *store, int id, const char *name);
/* Borrowed result: valid until destruction; do not free or modify it. NULL means absent. */
const char *store_get(const Store *store, int id);
/* Release owned names and return to an empty state. Safe on an already empty store. */
void store_destroy(Store *store);
#endif
