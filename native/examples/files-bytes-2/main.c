#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

int main(void) {
    uint32_t flags = 0;
    flags |= UINT32_C(1) << 2;
    flags |= UINT32_C(1) << 5;
    flags &= ~(UINT32_C(1) << 2);
    printf("hex=%" PRIx32 " bit2=%d bit5=%d\n", flags,
           (flags & (UINT32_C(1) << 2)) != 0,
           (flags & (UINT32_C(1) << 5)) != 0);
    return 0;
}
