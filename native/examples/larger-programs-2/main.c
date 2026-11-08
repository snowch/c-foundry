#include <stdio.h>
#include "counter.h"

int main(void) {
    tick();
    tick();
    printf("calls=%d private=%d\n", operations, read_private());
    return 0;
}
