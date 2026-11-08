# Chapter 10 project: portable binary record codec

Read: https://snowch.github.io/c-foundry/#/chapter/files-bytes

Complete `record.c` using the declarations in `record.h`. The starter intentionally fails the checks. The format requires eight-bit bytes and exact-width uint32_t/uint16_t types.

| Byte offsets | Meaning |
| --- | --- |
| 0–1 | ASCII magic: hexadecimal 43 46 |
| 2 | Version 01 |
| 3 | Reserved 00 |
| 4–7 | ID, unsigned 32-bit little endian |
| 8–9 | Score, unsigned 16-bit little endian |

The encoder rejects null or insufficient output buffers. The decoder rejects null pointers, short or extra input, bad magic, unknown versions, and a nonzero reserved byte. Decode failure must leave the output object unchanged. Do not dump or cast raw struct storage.

```sh
make project PROJECT=binary-record
make project PROJECT=binary-record SANITIZE=1
```

`tests.c` checks independently specified bytes as well as round trips, maximum values, rejected input, output state after failure, and a real temporary-file round trip. The runner uses a temporary working directory. A library flush is not a guarantee of crash durability; the database chapters develop that topic.

Compare the reference only after attempting your solution:

```sh
make project PROJECT=binary-record REFERENCE=1
make project PROJECT=binary-record REFERENCE=1 SANITIZE=1
```

This codec is a foundation for storage, not a completed pager or transaction system.
