# TinyDB portability audit

Part 7 teaches practical portable C: https://snowch.github.io/c-foundry/#/chapter/portable-c/1.
The final audit is https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/5.

This is a complete, deliberately bounded portability slice of TinyDB, not another database engine or a claim that all native course components run on every OS. The existing browser CLI and `native/cli/tinydb.c` remain separate. Extend this slice into your database only after specifying its additional host requirements.

## Run the same checks on different hosts

From the repository root in Codespaces or local Linux/macOS:

```sh
make check-portability
make check-portability CC=clang
make check-portability SANITIZE=1
```

From a Windows MSVC developer terminal (Python 3 required; Make is not):

```powershell
python tools/check_portability.py --compiler cl
```

GCC and Clang use C17 with strict warnings. MSVC uses `/TC /std:c17 /W4 /WX /utf-8`; `_CRT_SECURE_NO_WARNINGS` suppresses the vendor deprecation warning for ISO C functions without changing their semantics. The test runner builds `main.c`, `codec.c`, and `files.c`, then runs the same independent byte fixtures and API checks. All subprocess arguments are passed separately, including paths through temporary directories containing spaces.

The Pages workflow has four producer entries: Linux GCC, Linux Clang, macOS Clang, and Windows MSVC. Each uploads its two database files and report. A second four-entry consumer matrix downloads every producer's files and must validate and copy all eight byte-for-byte before deployment. These are real host builds, not Windows preprocessor macros tested on Linux. This matrix covers the audited slice and nine Chapter 33 examples; it does not imply Windows support for the course's POSIX/Linux recovery or thread examples.

## Boundaries and guarantees

| Boundary | Contract and evidence |
| --- | --- |
| Language | Hosted C17; eight-bit bytes, `uint32_t`, and an ASCII-compatible execution character set are explicit target requirements. No VLA, native struct dump, GNU extension, or POSIX API is needed in this target. |
| Portable core | `codec.c` depends on byte buffers, lengths, integers, and string operations. It has no FILE, filesystem, locale, process, signal, or locking API. |
| File adapter | `files.c` uses `rb` and C11 `wbx` binary modes, checks read/write/flush/close results, rejects excess input, and refuses an existing destination. Read buffers are scratch; decoding to a live table happens only after validation. |
| Filenames | Relative ASCII basenames of 1–64 bytes, starting without a dot, with letters/digits/dot/hyphen/underscore, no trailing dot, and no DOS device stem (including extensions). This excludes many legal OS names intentionally. It is not a directory sandbox or a general Unicode path API. |
| Format | TDB1 magic bytes, version 1, eight-byte header, forty-byte rows, little-endian IDs and scores, 1–31 UTF-8 bytes per name, zero padding, unique nonzero IDs, at most eight rows. No native padding or host byte order is serialized. |
| Rejection | Decode leaves the caller's table unchanged. Encode leaves its byte destination and length unchanged. Invalid imports never create an output file. File-copy failure does not modify the input. |
| Creation | New files only: an existing destination remains intact, including input/output aliasing. On an ordinary write failure the adapter attempts to remove its newly created partial file; cleanup can itself fail. |
| Not provided | Replacement of an existing database, crash durability, fsync, file locks, concurrent writers, general Unicode paths, arbitrary large-file offsets, and every conceivable C implementation. Those require separately specified adapters and tests. |

### Independent file fixtures

The suite does not accept a round trip as its only oracle. Python independently constructs the exact TDB1 bytes, compares the emitted Ada/Grace file to the existing 88-byte course sample, checks every truncated prefix, and tries bad magic/version/length, reserved bytes, duplicate IDs, invalid UTF-8, and noncanonical padding. A second fixture contains multibyte UTF-8 and `0x0a`, `0x0d`, and `0x1a` in integer fields; it exposes text-mode translation or EOF-marker mistakes on Windows. Both are exported by each producer and consumed on every host.

The original CLI supports 128 rows; this audit slice supports eight and requires canonical zero padding. Files within the common documented subset are compatible. Larger or otherwise unsupported files are rejected, never silently truncated.

## A concrete audit of the larger CLI

| Finding in `native/cli/tinydb.c` | Classification | Required work before a stronger portability claim |
| --- | --- | --- |
| Explicit 40-byte little-endian row encoding | Portable format with octet/width requirements | Keep the independent known-byte fixtures, version checks, UTF-8 validation, and limits. |
| `fopen(..., "rb"/"wb")` | ISO C binary streams | Continue checking every operation; do not infer crash durability. |
| `rename(temp, path)` where `path` already exists | Implementation/host replacement behavior | POSIX specifies replacement under its rules; the Windows C runtime normally refuses an existing destination. Define a publication interface and implement/test POSIX and Win32 adapters. Do not remove the old file first and call that atomic replacement. |
| Narrow `fopen` filenames | Host encoding/path contract | Define a restricted common basename policy, or add a Windows wide-path adapter and a documented path encoding boundary. UTF-8 row data does not establish UTF-8 filename support. |
| Temp-name existence check followed by creation | Single-writer assumption | The check/open sequence is not a concurrent-writer exclusion protocol. Use a tested exclusive-create/locking design for a stronger contract. |
| `fflush`/`fclose` followed by rename | Completed library operations | Define and test synchronization, replacement, directory persistence, and recovery per target before claiming power-loss durability. |
| Fixed bounded tables and line buffers | Explicit implementation limit | Validate count/size arithmetic, rejection preservation, and byte-versus-character length. Keep large files and schema extensions separate. |

ISO C includes `signal()`, but POSIX `sigaction`, masks, process groups, `fork`, device-specific `ioctl`, Linux `/proc`, and shared-memory APIs have additional host contracts. This target does not emulate them.

## Build it yourself

1. Add rows and malformed inputs without changing the published format by accident; keep rejection preservation assertions.
2. Extend the assumptions table for your assembled TinyDB, including integer conversions, allocation bounds, locale, text framing, file positioning, and platform services.
3. Keep parsing and serialization separate from OS-dependent publication, locks, clocks, and process APIs.
4. Design a replacement interface with explicit guarantees and implement separate POSIX and Win32 adapters. Add ordinary failure injection before attempting crash-recovery claims.
5. Inspect both producer and consumer reports in Actions; explain what cross-host file exchange establishes and what it does not.

The shared suite is `tools/check_portability.py`. `--artifacts DIR` exports verified files; `--incoming DIR` verifies database artifacts downloaded from all four producers. Reports and binaries live under `.build/portability/`; `make clean` removes them. Retain any audit evidence you want to keep before cleaning or deleting a Codespace.
