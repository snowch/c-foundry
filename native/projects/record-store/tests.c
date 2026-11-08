#include "store.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define REQUIRE(condition) do { if (!(condition)) { fprintf(stderr, "FAIL line %d: %s\n", __LINE__, #condition); exit(1); } } while (0)

int main(void) {
    Store store;
    store_init(&store);
    REQUIRE(store.count == 0);
    REQUIRE(store_get(&store, 1) == NULL);
    char name[] = "Ada";
    REQUIRE(store_put(&store, 1, name) == STORE_OK);
    name[0] = 'X';
    REQUIRE(strcmp(store_get(&store, 1), "Ada") == 0);
    REQUIRE(store_put(&store, 1, "replacement") == STORE_DUPLICATE);
    REQUIRE(strcmp(store_get(&store, 1), "Ada") == 0);
    REQUIRE(store_put(&store, 0, "bad") == STORE_INVALID);
    REQUIRE(store_put(&store, 2, NULL) == STORE_INVALID);
    REQUIRE(store_put(&store, 2, "") == STORE_INVALID);
    REQUIRE(store_put(&store, 2, "12345678901234567890123456789012") == STORE_INVALID);
    REQUIRE(store.count == 1);
    for (int id = 2; id <= STORE_CAPACITY; ++id) REQUIRE(store_put(&store, id, "row") == STORE_OK);
    REQUIRE(store_put(&store, 99, "extra") == STORE_FULL);
    REQUIRE(store_get(&store, 99) == NULL);
    store_destroy(&store);
    REQUIRE(store.count == 0);
    REQUIRE(store_get(&store, 1) == NULL);
    store_destroy(&store);
    REQUIRE(store_put(&store, 7, "Grace") == STORE_OK);
    REQUIRE(strcmp(store_get(&store, 7), "Grace") == 0);
    store_destroy(&store);
    puts("PASS record-store: ownership, lookup, duplicate, validation, capacity, destroy, reuse");
    return 0;
}
