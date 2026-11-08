#include "store.h"
#include <stdlib.h>
#include <string.h>

void store_init(Store *store) {
    if (store) *store = (Store){0};
}

StoreStatus store_put(Store *store, int id, const char *name) {
    if (!store || !name || id <= 0) return STORE_INVALID;
    size_t length = strlen(name);
    if (length == 0 || length > STORE_NAME_MAX) return STORE_INVALID;
    for (size_t i = 0; i < store->count; ++i) {
        if (store->rows[i].id == id) return STORE_DUPLICATE;
    }
    if (store->count == STORE_CAPACITY) return STORE_FULL;
    char *copy = malloc(length + 1);
    if (!copy) return STORE_NO_MEMORY;
    memcpy(copy, name, length + 1);
    store->rows[store->count++] = (StoreRow){id, copy};
    return STORE_OK;
}

const char *store_get(const Store *store, int id) {
    if (!store) return NULL;
    for (size_t i = 0; i < store->count; ++i) {
        if (store->rows[i].id == id) return store->rows[i].name;
    }
    return NULL;
}

void store_destroy(Store *store) {
    if (!store) return;
    for (size_t i = 0; i < store->count; ++i) free(store->rows[i].name);
    *store = (Store){0};
}
