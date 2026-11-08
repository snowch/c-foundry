#ifndef SCALE_H
#define SCALE_H
#ifndef FACTOR
#define FACTOR 3
#endif
static inline int scale(int value) { return value * FACTOR; }
#endif
