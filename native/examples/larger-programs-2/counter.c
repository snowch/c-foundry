#include "counter.h"

int operations = 0;
static int private_count;

void tick(void) { operations++; private_count++; }
int read_private(void) { return private_count; }
