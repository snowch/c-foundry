#ifndef CF_PORTABLE_H
#define CF_PORTABLE_H
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#if !defined(UINT32_MAX) || CHAR_BIT != 8
#error "TDB1 requires uint32_t and eight-bit bytes"
#endif

_Static_assert('A' == 0x41 && 'a' == 0x61 && '0' == 0x30, "This target requires ASCII-compatible execution characters");

enum { PORT_CAPACITY = 8, PORT_BYTES = 8 + PORT_CAPACITY * 40 };
typedef struct { uint32_t id; char name[32]; uint32_t score; } PortRow;
typedef struct { PortRow rows[PORT_CAPACITY]; size_t count; } PortTable;
/* Decode commits only on success. Encode preserves output and length on failure.
 * Pointers designate live, suitably sized, nonoverlapping objects. */
bool port_decode(const unsigned char *bytes, size_t size, PortTable *out);
bool port_encode(const PortTable *table, unsigned char *bytes, size_t capacity, size_t *size);
/* Host boundary: restricted ASCII basename, binary streams, exclusive new file.
 * No overwrite, replacement, locking, fsync, or crash-durability promise. */
bool port_name(const char *name);
bool port_read(const char *name, unsigned char *bytes, size_t capacity, size_t *size);
bool port_write_new(const char *name, const unsigned char *bytes, size_t size);
#endif
