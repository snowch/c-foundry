# C Foundry: all labs in the browser

The course has two browser runtimes. Compatible examples use the inline C compiler and command workspace. Linux-backed examples and projects use [Browser Linux](https://snowch.github.io/c-foundry/#/linux), including every Part 8 concurrency lesson and both optional GDB investigations. No account or local installation is required for the course.

## Start a Linux lab

1. Open **Browser Linux** from the lesson; its command is carried across.
2. Choose **Run lab in Linux**. The page starts its local guest, waits for the
   prepared workspace, then sends the command automatically.
3. Inspect the terminal output. To edit a source, use **Edit a course file in this
   browser**, then **Run edited source in Linux**. The page sends the exact editor
   text through a guest-only share; no download/upload or paste is needed.

The runtime includes GCC 15.2, Clang 21.1, GDB 16.3, Make, Python and nano. The
Linux x86 target has 32-bit pointers. It uses 1 GiB guest RAM plus browser overhead.
The guest, compiler and examples are self-hosted. A complete verified offline
copy includes them; optional documentation links still require internet access.

Example commands remain available for direct terminal use:

```sh
make example EXAMPLE=threads-1
make example EXAMPLE=coordination-1
make example EXAMPLE=atomics-3
make example EXAMPLE=concurrent-storage-4
```

All fourteen Part 8 worked programs use this same Linux path. Their normal compilation and invariant checks do not require a sanitizer runtime. `nano path/to/file.c` opens a source editor: Ctrl+O saves and Ctrl+X exits. A tablet keyboard or external keyboard can enter terminal commands; full-screen mode gives the terminal more room.

The Browser Linux page also has an **Edit a course file in this browser** section. It loads a source picker on demand, saves per-file drafts, and downloads edited files. Choose Run edited source in Linux to transfer the current editor text and run the selected command. This supplies source editing on tablets without requiring nano control keys. The editor and the guest filesystem are separate until that explicit transfer. To edit a file that was already changed inside Linux, use the generated source-export command, then Import source file into the selected editor path. This preserves restored work instead of replacing it with a course original.

The course preserves the active terminal element when navigating among its pages. A browser reload, tab close, or Stop ends that temporary session. The Linux system is loaded only after Start, independently of the fast inline compiler.

## Save and resume

After the setup above, export a backup before ending the session:

```sh
cd ~/work && tar czf ~/c-foundry-work.tar.gz c-foundry && export_file ~/c-foundry-work.tar.gz
```

This downloads the working directory, including edited sources, generated files, and retained database artifacts. Keep it in your browser’s Downloads or chosen file location. It is a file backup, not a running-machine snapshot or a crash-durability guarantee.

In a fresh session, upload that backup and restore it:

```sh
mkdir -p ~/work && tar xzf ~/c-foundry-work.tar.gz -C ~/work && cd ~/work/c-foundry
```

Restore into a fresh session. Unpacking the original course archive over your edited source can replace those edits. Browser lesson marks, inline editor drafts, command-workspace files, and Linux files are separate stores; transferring work between them is explicit. A Linux-produced TDB1 file can be downloaded with `export_file path/to/file.tdb`, then imported into the browser command workspace where its format is supported.

## Projects and debugging

The bundle includes all worked C sources, headers, checked-output fixtures, two editable Part 2 projects, and the broken GDB programs with separate reference repairs. Student project and debugging starter checks initially fail on purpose.

```sh
make project PROJECT=record-store
make project PROJECT=binary-record
make debug-lab LAB=basics
make debug-gdb LAB=basics
make debug-check LAB=basics
make debug-lab LAB=tinydb
make debug-gdb LAB=tinydb
make debug-check LAB=tinydb
```

Use each lesson’s source path and investigation steps. GDB commands such as `break`, `next`, and `watch` belong inside GDB. The small browser command workspace supplies portable C builds and Wasm programs; Browser Linux supplies the full Linux tools.

Later chapter workshops assemble and extend bounded database components. They do not provide an already completed production SQL engine. Compiler modes and floating-point examples describe the actual Linux toolchain target. `make standards-matrix` checks supported C modes and a C23 feature using the installed GCC and Clang.

## Optional reading and tooling

[ThreadSanitizer](https://snowch.github.io/c-foundry/#/tools/threadsanitizer) is a reading page, outside lesson completion and required lab work. The self-hosted image does not currently provide working ASan/TSan toolchain combinations; normal labs use independent fixture and invariant checks. Optional external sanitizer commands in developer documentation are not course requirements. An emulator’s timing does not measure real multicore speedup or physical-device durability.

Use the online C references linked at the bottom of each lesson. The self-hosted image has no installed `man` pages. The help lesson describes optional equivalent manual commands for environments that provide them; reading function contracts and running its printf example work entirely in the browser.

## Hosting and source provenance

The Linux VM executes on the learner’s device in the self-hosted BSD-2-Clause
v86 emulator. Firmware, kernel, guest image and terminal dependencies are served
inside this course's release. `tools/local-linux/assets.json` pins downloads;
`linux/notices/` publishes the binary provenance, upstream licences and exact source
recipes. CI fetches dependencies during the build; learners never fetch a runtime
from another service. The initial self-hosted browser check passed native greeting,
standards, counter, queue and TinyDB checks with outside requests blocked.

`tools/build_browser_linux.py` packages the course-owned source and fixture files into a deterministic archive with a file-hash manifest. It contains no guest OS, emulator, downloaded toolchain, account credentials, Git history, or third-party npm dependencies. It includes the course LICENSE and an explicit selected file list. The archive is checked for reproducibility by `npm test`.

Maintainers can run the same sources in the CI toolchain image defined in `.github/native/Dockerfile`. The CI image, cross-platform portability matrix, optional sanitizer targets, and native regression suites validate the project; they do not impose local installations on learners.
