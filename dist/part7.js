window.PART_SEVEN = {
  "standards-evolution": {
    "intro": "Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.",
    "outcomes": [
      "Identify major standard revisions and their practical additions.",
      "Separate standard facilities from extensions.",
      "Build feature probes in multiple language modes."
    ],
    "topics": {
      "1": {
        "intro": "C revisions add facilities while retaining compatibility rules and implementation choices. A course baseline should be explicit.",
        "explanation": "C89/C90 standardized the early language; C99 added facilities such as declarations in for loops and standard fixed-width integer interfaces; C11 added atomics and alignment facilities; C17 primarily corrected defects; C23 adds facilities including nullptr, typeof/typeof_unqual, constexpr objects, and inferred auto declarations; probe the exact facility before depending on it. __STDC_VERSION__ identifies the selected language revision when provided, but does not prove every optional library facility is available. This course uses C17 unless a feature probe says otherwise.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  printf(\"C17_or_later=%d C11_or_later=%d\\n\", __STDC_VERSION__ >= 201710L,\n         __STDC_VERSION__ >= 201112L);\n  return 0;\n}\n",
        "expected": "C17_or_later=1 C11_or_later=1",
        "walkthrough": "The example command explicitly requests C17. Use make standards-matrix to test the repository’s separate mode-specific probes under GCC and Clang.",
        "pitfall": "Compiler release dates and language-mode macros are not a complete conformance certificate.",
        "question": "What determines the selected language mode?",
        "choices": [
          "The compiler invocation and supported mode",
          "The file extension alone"
        ],
        "answer": 0,
        "why": "A .c file can be compiled under several revisions and extension policies.",
        "tryit": "Run make standards-matrix and record actual accepted modes and diagnostics for both toolchains.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Compiler extensions can be useful when isolated behind a checked interface, but they are not portable language guarantees.",
        "explanation": "The example guards a GNU-compatible extended integer type and supplies a standard fallback. __extension__ is itself a compiler-specific escape used only within that guard. The output checks a capability property rather than promising that every C target has a 128-bit integer. Prefer a standard baseline path unless the extended representation is part of a documented platform requirement.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__GNUC__) && defined(__SIZEOF_INT128__)\n  __extension__ typedef unsigned __int128 Wide;\n  printf(\"wide_at_least64=%d\\n\", sizeof(Wide) * CHAR_BIT >= 64);\n#else\n  printf(\"wide_at_least64=%d\\n\", sizeof(uint64_t) * CHAR_BIT >= 64);\n#endif\n  return 0;\n}\n",
        "expected": "wide_at_least64=1",
        "walkthrough": "Both paths satisfy the property needed by this fixture, but the types and supported ranges differ. The fallback’s existence does not make extension-only code elsewhere portable.",
        "pitfall": "Defining a compiler-family macro does not guarantee every extension or target-specific type.",
        "question": "Where should extension assumptions be isolated?",
        "choices": [
          "Every call site without checks",
          "A guarded interface with a documented fallback or requirement"
        ],
        "answer": 1,
        "why": "Centralizing the dependency makes supported targets and failures reviewable.",
        "tryit": "Compile with -Wpedantic -Werror, then write a feature probe that checks the exact extension your project needs.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Feature detection should test the facility you need. A standard-version test alone cannot account for partial implementations or optional APIs.",
        "explanation": "The example selects a conservative C17 fallback at the course’s default language mode. A separate compile probe can attempt a C23-only facility under -std=c23 and report whether that compiler/library combination accepts it. Treat a failed probe as a result to handle, not permission to silently change the project’s semantics.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 202311L\n  puts(\"mode=C23 feature_probe_required\");\n#else\n  puts(\"mode=C17 fallback_selected\");\n#endif\n  return 0;\n}\n",
        "expected": "mode=C17 fallback_selected",
        "walkthrough": "The checked example is intentionally compiled as C17. The standards-matrix command performs newer-mode experiments without making this page depend on full C23 support.",
        "pitfall": "Do not use an unchecked newer feature merely because a compiler accepts the language-mode flag.",
        "question": "What is stronger evidence of a needed facility?",
        "choices": [
          "A compile/link probe of that actual facility",
          "The compiler executable’s filename"
        ],
        "answer": 0,
        "why": "Language and library support can vary independently.",
        "tryit": "Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Compile a feature probe under different language standards.",
      "tasks": [
        "Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.",
        "Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "standards-evolution-3"
    }
  },
  "c-guarantees": {
    "intro": "Distinguish language guarantees from platform choices and invalid operations before using optimization results as evidence.",
    "outcomes": [
      "Classify defined, implementation-defined, unspecified, and undefined behavior.",
      "Respect object lifetime, effective types, and alignment.",
      "Compare optimized builds only on valid programs."
    ],
    "topics": {
      "1": {
        "intro": "Different kinds of latitude in C require different responses. Undefined behavior is not just another documented platform choice.",
        "explanation": "Defined behavior follows the language contract. Implementation-defined behavior requires an implementation’s documented choice, such as relevant integer characteristics. Unspecified behavior permits a set of allowed choices without requiring the same choice every time, such as many operand evaluation orders. Undefined behavior imposes no requirements. The executable uses defined operations and reports a guaranteed minimum property, avoiding deliberate invalid accesses.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned wrapped = UINT_MAX;\n  wrapped += 1;\n  printf(\"char_bits_at_least8=%d unsigned_wrap=%u\\n\", CHAR_BIT >= 8, wrapped);\n  return 0;\n}\n",
        "expected": "char_bits_at_least8=1 unsigned_wrap=0",
        "walkthrough": "Unsigned arithmetic is modulo its type’s range. That guarantee does not extend to overflowing signed arithmetic.",
        "pitfall": "An observed compiler result cannot turn undefined behavior into a portable rule.",
        "question": "Is signed overflow merely an implementation-defined wrap choice?",
        "choices": [
          "No, it is undefined behavior in standard C",
          "Yes"
        ],
        "answer": 0,
        "why": "Standard unsigned and signed arithmetic have different overflow contracts.",
        "tryit": "Classify five expressions from TinyDB and cite the exact assumption or guarantee each relies on.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "A pointer’s numeric appearance does not establish alignment, type compatibility, or object lifetime. Use character access and memcpy for representation transfers.",
        "explanation": "The example copies an unsigned integer’s object representation into an unsigned-char array and back into a compatible object. Access through unsigned char may inspect object bytes; casting arbitrary byte storage to a wider pointer can violate alignment and effective-type rules. None of these operations extend an object’s lifetime or permit access after free.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  uint32_t source = UINT32_C(0x12345678), copy = 0;\n  unsigned char bytes[sizeof source];\n  memcpy(bytes, &source, sizeof bytes);\n  memcpy(&copy, bytes, sizeof copy);\n  printf(\"roundtrip=%d bytes=%zu\\n\", copy == source, sizeof bytes);\n  return 0;\n}\n",
        "expected": "roundtrip=1 bytes=4",
        "walkthrough": "On the supported eight-bit-byte targets, uint32_t occupies four bytes. The test compares restored value rather than assuming a host byte order.",
        "pitfall": "A byte-for-byte native representation round trip is not a portable external file encoding.",
        "question": "Why avoid casting this arbitrary byte array to uint32_t *?",
        "choices": [
          "memcpy cannot copy integer values",
          "Alignment and object-type requirements may not be satisfied"
        ],
        "answer": 1,
        "why": "memcpy transfers representation bytes without requiring a misaligned typed access.",
        "tryit": "Replace a raw pointer cast in a decoder with explicit byte assembly and test it with unaligned input offsets.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.",
        "explanation": "The fixture uses unsigned fixed-width arithmetic with a defined wrap result and a bounded representable sum. Compile it at multiple optimization levels and compare those outputs. If a different program changes behavior under optimization, audit its language contracts, races, and uninitialized state before treating the difference as an optimizer bug.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  uint32_t x = UINT32_MAX;\n  x += UINT32_C(1);\n  unsigned sum = 0;\n  for (unsigned i = 1; i <= 4; ++i)\n    sum += i;\n  printf(\"wrapped=%u sum=%u\\n\", (unsigned)x, sum);\n  return 0;\n}\n",
        "expected": "wrapped=0 sum=10",
        "walkthrough": "The required result remains zero and ten under valid optimizing transformations. The example is compiled with optimization enabled, not a deliberately invalid aliasing trick.",
        "pitfall": "Turning optimization off can hide a defect without fixing it.",
        "question": "What should be checked first after an optimization-sensitive failure?",
        "choices": [
          "Lifetime, bounds, aliasing, initialization, and synchronization",
          "Whether -O0 appears to work"
        ],
        "answer": 0,
        "why": "A valid source contract is the basis for expecting preserved behavior.",
        "tryit": "Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-O2"
        ]
      }
    },
    "practicePlan": {
      "goal": "Audit a short program and distinguish guarantees from assumptions.",
      "tasks": [
        "Distinguish language guarantees from platform choices and invalid operations before using optimization results as evidence.",
        "Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "c-guarantees-3"
    }
  },
  "portable-c": {
    "intro": "State the target requirements and isolate host APIs from portable C data and algorithms.",
    "outcomes": [
      "Separate standard-library operations from POSIX facilities.",
      "Encode fixed-width bytes independently of native layout.",
      "Detect facilities and document native versus WASI limits."
    ],
    "topics": {
      "1": {
        "intro": "The C standard library and an operating-system API are different portability layers. POSIX facilities require a POSIX target and their own contracts.",
        "explanation": "This native example uses clock_gettime with CLOCK_MONOTONIC, exposed through the POSIX feature-test macro before any headers. It checks both calls and compares timestamps without claiming a measurable workload duration. A different host needs an adapter or another supported API; ISO C alone does not require this exact interface.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <time.h>\n\nint main(void) {\n  struct timespec a, b;\n  if (clock_gettime(CLOCK_MONOTONIC, &a) || clock_gettime(CLOCK_MONOTONIC, &b))\n    return 1;\n  printf(\"clock_read=1 ordered=%d\\n\",\n         b.tv_sec > a.tv_sec ||\n             (b.tv_sec == a.tv_sec && b.tv_nsec >= a.tv_nsec));\n  return 0;\n}\n",
        "expected": "clock_read=1 ordered=1",
        "walkthrough": "Both reads succeed on the Codespaces Linux target. Two adjacent observations are used only for an ordering property, not a performance claim.",
        "pitfall": "A POSIX feature macro requests declarations; it does not make the API exist on every platform.",
        "question": "Does ISO C require CLOCK_MONOTONIC?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "It belongs to a host API with a narrower platform contract.",
        "tryit": "Define a small clock abstraction and test its Linux implementation separately from algorithmic counters.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.",
        "explanation": "The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\n\nint main(void) {\n  unsigned char bytes[4];\n  put32(bytes, UINT32_C(0x01020304));\n  printf(\"bytes=%u,%u,%u,%u value_ok=%d\\n\", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],\n         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));\n  return 0;\n}\n",
        "expected": "bytes=4,3,2,1 value_ok=1",
        "walkthrough": "The byte order is identical on little- and big-endian supported hosts because the encoder defines it.",
        "pitfall": "Using uint32_t inside a raw dumped struct does not remove padding or byte-order assumptions.",
        "question": "Does a fixed-width field alone make raw structs portable files?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Layout, padding, byte order, and other representation choices remain.",
        "tryit": "Decode independently specified bytes and test all integer extremes without consulting sizeof(Row).",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Conditional compilation should expose a clear capability decision and preserve a tested baseline path. Avoid silently enabling partially supported features.",
        "explanation": "C11 atomics can be unavailable when an implementation defines __STDC_NO_ATOMICS__. This probe rejects that unsupported target explicitly before including stdatomic.h. The fixture uses an atomic object only through atomic operations. More advanced optional facilities should be tested with compile and link probes, not guessed from a platform name.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#if defined(__STDC_NO_ATOMICS__)\n#error \"This example requires standard atomics\"\n#endif\n#include <stdatomic.h>\n\nint main(void) {\n  atomic_uint value;\n  atomic_init(&value, 0);\n  atomic_fetch_add(&value, 1);\n  printf(\"atomic_probe=%u\\n\", atomic_load(&value));\n  return 0;\n}\n",
        "expected": "atomic_probe=1",
        "walkthrough": "The Codespaces toolchains provide this facility. A clean probe result establishes this example’s needs, not lock freedom for every atomic type.",
        "pitfall": "An atomic operation need not be implemented without locks; lock freedom is a separate capability.",
        "question": "Does atomic support guarantee every atomic type is lock-free?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The standard permits implementations with internal synchronization.",
        "tryit": "Add a probe for atomic_is_lock_free and report its result as a platform property rather than a fixed course expectation.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "WebAssembly/WASI is a host contract, not an emulation of every native operating-system facility. Algorithmic C can be portable while system integrations differ.",
        "explanation": "This native example reports its compilation target using a target macro. The course’s Wasm toolchain provides a limited older WASI runtime, not native pthreads, sockets, arbitrary host filesystem access, or sanitizer runtimes. Keep portable encoders and data structures separate from adapters for persistence, threads, and process facilities.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__wasi__)\n  puts(\"target=WASI host_adapter_required\");\n#else\n  puts(\"target=native host_adapter_required\");\n#endif\n  return 0;\n}\n",
        "expected": "target=native host_adapter_required",
        "walkthrough": "Codespaces executes the native path. Merely changing the target triple cannot supply a missing host integration.",
        "pitfall": "Browser reading availability and browser execution support are separate product capabilities.",
        "question": "Can every native POSIX program run unchanged in the current page runner?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The runner exposes a restricted host API and toolchain.",
        "tryit": "List every OS dependency in your assembled database and place each behind an explicit platform adapter.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Compare GCC and Clang builds and inspect platform-dependent properties.",
      "tasks": [
        "State the target requirements and isolate host APIs from portable C data and algorithms.",
        "List every OS dependency in your assembled database and place each behind an explicit platform adapter.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "portable-c-4"
    }
  },
  "hardening-tinydb": {
    "intro": "Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.",
    "outcomes": [
      "Replace hidden size and representation assumptions with checked contracts.",
      "Test format-version rejection and state preservation.",
      "Run strict multi-compiler and sanitizer checks."
    ],
    "topics": {
      "1": {
        "intro": "An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.",
        "explanation": "For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  size_t count = SIZE_MAX;\n  bool rejected = count > SIZE_MAX / sizeof(int);\n  printf(\"oversize_rejected=%d\\n\", rejected);\n  return 0;\n}\n",
        "expected": "oversize_rejected=1",
        "walkthrough": "On the supported targets sizeof(int)>1, so the requested count cannot fit a byte size. The operating system is not asked to perform a huge allocation.",
        "pitfall": "A NULL check after an already overflowing multiplication does not repair the requested size.",
        "question": "When must multiplication overflow be checked?",
        "choices": [
          "Before multiplying",
          "Only after malloc fails"
        ],
        "answer": 0,
        "why": "An overflowed size may request a small allocation and later cause an out-of-bounds write.",
        "tryit": "Audit every size calculation in the pager, index, parser, and vector with a stated maximum.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Version checks are part of the decoder’s public contract. Unknown formats must not partially replace existing data.",
        "explanation": "The fixture writes a header with an unsupported version and confirms rejection. A compatibility suite should include known valid older fixtures, unsupported future versions, reserved-bit violations, and size mismatches. A migration must preserve a verified old file until the new file is safely published under the target platform’s rules.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 99, 40, 0, 0};\n  if (fwrite(header, 1, 8, f) != 8 || fseek(f, 0, SEEK_SET)) {\n    fclose(f);\n    return 1;\n  }\n  Table live = {0};\n  insert_row(&live, (Row){9, \"Keep\", 0});\n  bool rejected = !load(f, &live);\n  if (fclose(f) != 0)\n    return 1;\n  printf(\"rejected=%d retained=%u\\n\", rejected, (unsigned)live.rows[0].id);\n  return 0;\n}\n",
        "expected": "rejected=1 retained=9",
        "walkthrough": "The decoder leaves the existing key nine untouched. A version number is checked before row-count-driven reads.",
        "pitfall": "A new writer should not overwrite the only old-format file before migration success is established.",
        "question": "What is the live-state result after unknown-version rejection?",
        "choices": [
          "A partially decoded replacement",
          "The previous state remains"
        ],
        "answer": 1,
        "why": "The loader commits its temporary state only after full validation.",
        "tryit": "Add version fixtures to your release suite and document the intended upgrade and downgrade policy.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Compilers provide complementary diagnostics. Keep the same language baseline and fixtures when comparing their builds.",
        "explanation": "The example exercises a bounded decoded record with explicit byte assembly and a typed output. Run it with CC=gcc and CC=clang, both with strict warnings. Agreement is useful evidence, not proof of freedom from undefined behavior: both compilers can compile the same invalid source without a diagnostic when the language does not require one.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  unsigned char bytes[ROW_BYTES];\n  Row source = {7, \"Ada\", 90}, copy = {0};\n  if (!encode_row(bytes, &source) || !decode_row(bytes, sizeof bytes, &copy) ||\n      copy.id != 7 || strcmp(copy.name, \"Ada\"))\n    return 1;\n  puts(\"strict compiler fixture passed\");\n  return 0;\n}\n",
        "expected": "strict compiler fixture passed",
        "walkthrough": "The repository commands compile with C17, warnings, and warnings-as-errors, then check the documented output.",
        "pitfall": "Suppressing a warning globally just to make a second compiler pass may hide a real contract problem.",
        "question": "Does agreement between two compilers prove valid C?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Undiagnosed undefined behavior remains possible.",
        "tryit": "Run make example EXAMPLE=hardening-tinydb-3 CC=clang and compare diagnostics with the GCC command.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Sanitizers observe executed behavior and catch selected invalid operations. Combine them with strict builds, input validation, and independent expectations.",
        "explanation": "The fixture passes a deliberately short record to the decoder and verifies that it is rejected before bytes are accessed or output is assigned. Run with SANITIZE=1 to add AddressSanitizer and UndefinedBehaviorSanitizer in native builds. ThreadSanitizer is a separate tool for shared-memory concurrency and may depend on runtime/kernel support.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  unsigned char bytes[3] = {0};\n  Row out = {9, \"Keep\", 1};\n  bool rejected = !decode_row(bytes, sizeof bytes, &out);\n  printf(\"short_rejected=%d output_preserved=%d\\n\", rejected,\n         out.id == 9 && strcmp(out.name, \"Keep\") == 0);\n  return 0;\n}\n",
        "expected": "short_rejected=1 output_preserved=1",
        "walkthrough": "Length rejection occurs before get32 reads an ID. The original output object remains valid and unchanged.",
        "pitfall": "A clean sanitizer run does not explore unexecuted paths or establish crash durability.",
        "question": "What does a clean sanitizer run establish?",
        "choices": [
          "All possible inputs are correct",
          "No selected violation was detected on exercised paths"
        ],
        "answer": 1,
        "why": "The scope is the actual instrumentation and executions.",
        "tryit": "Run this example with SANITIZE=1, then add short inputs at every length below the full record size.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Run the TinyDB baseline under stricter compiler and sanitizer checks.",
      "tasks": [
        "Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.",
        "Run this example with SANITIZE=1, then add short inputs at every length below the full record size.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "hardening-tinydb-4"
    }
  }
};
