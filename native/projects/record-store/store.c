#include "store.h"

void store_init(Store *store) {
    if (store) *store = (Store){0};
}

StoreStatus store_put(Store *store, int id, const char *name) {
    (void)store; (void)id; (void)name;
    /* TODO: validate, reject duplicates/full stores, allocate a copy, then commit the row. */
    return STORE_INVALID;
}

const char *store_get(const Store *store, int id) {
    (void)store; (void)id;
    /* TODO: return a borrowed name for a matching initialized row. */
    return NULL;
}

void store_destroy(Store *store) {
    (void)store;
    /* TODO: release every owned name once and restore the empty state. */
}
