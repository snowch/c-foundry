# Self-hosted browser Linux migration

The replacement uses the BSD-2-Clause v86 emulator, local SeaBIOS/SeaVGABIOS and
an Alpine Linux x86 guest. Do not mirror Bellard's current x86 JSLinux binaries:
the public TinyEMU source covers its RISC-V implementation, and does not establish
redistribution rights for the current hosted x86 runtime.

The guest and all files load from the individual lab's project scope. An explicit
file-share bridge transfers the current editor bytes to Linux; the UI never relies
on a manually pasted filename or injects large source strings through the terminal.
Preserve browser drafts, and guard guest teardown until the learner exports their
archive. Guest files remain temporary unless exported.

Source packages, exact upstream recipes, licence notices and checksums travel with
the release. A host build tool download is not a learner runtime dependency. A
complete offline claim requires every emulator, BIOS, kernel and guest chunk in
the verified release, followed by a real fresh offline startup and edited run.
