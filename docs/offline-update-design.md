# C Foundry offline/update adapter

The [shared offline/update design](https://github.com/snowch/cuda-cpp-lab/blob/main/docs/offline-update-design.md) defines the mechanism. C Foundry uses the same release validator, service worker, status UI and persistent runtime recovery, with a separate `c-foundry:` scope and cache prefix.

## What is saved

App status can save all course readings, original diagrams, example sources, local fonts/icons, the course source archive, the bundled TinyDB program and the inline C compiler. Inline examples and the C command workspace can then compile and run in a fresh offline tab. External documentation and the externally hosted Browser Linux VM require internet access. Browser Linux is not included in the offline readiness claim; the homepage and download screen state this distinction.

Automatic checks fetch small release metadata, not the full compiler. Online navigation remains fresh. One primary action reflects the saved copy: Save offline copy, Update offline copy or Repair offline copy. Completed downloads are ready only after all manifest files pass byte verification. A downloaded update offers Restart to update. Interrupted/cancelled downloads retain completed files and keep an earlier complete copy usable. Request persistent browser storage when supported; device/browser eviction remains possible.

`tools/build.mjs` copies authored `dist/` to `.build/site` and generates a SHA-256 manifest and immutable release tree. `dist/` is tracked source and must not be deleted as generated output. HTML pins scripts, styles, the homepage illustration and local downloads. Worker dependencies and runtime data resolve inside that release. Publication retains two preceding immutable releases and verifies exact original bytes. The first adoption retains the original unversioned worker URLs and compatible message formats, so an older open tab can still run after deployment; the checked-in compiler binaries remain unchanged.

## Learner stores and restart

Existing stores remain unchanged: `c-foundry-v1` for lesson drafts/inputs/practice state, `c-foundry:lesson-done:v1:` for explicit reading marks, IndexedDB `c-foundry-workspace` for revision-checked workspace files, and `c-foundry-linux-source:` for Linux source-editor drafts. Results and optional predictions extend the existing lesson state. Per-field merges preserve independent drafts from another tab. Same-file simultaneous edits retain the existing last-writer behaviour.

`reading-state.js` adapts PREPARE_RESTART → COMMIT_RESTART / ABORT_RESTART. Every controlled tab must save successfully. Per-tab snapshots retain the hash, open disclosures, controls, output, selected source file and workspace transcript/session. Reload never automatically runs code. Failed storage, composition, a running program, unsaved/conflicting workspace files, unsaved Linux source drafts or an active Linux VM veto restart. The VM must be backed up and stopped explicitly; the course never claims to save its guest filesystem.

## Error recovery

Missing, failed or incompatible runtime downloads are infrastructure failures. Keep the previous genuine result and show the persistent native recovery modal with a dimmed background, Reload lesson and Stay on lesson. Escape stays; focus returns to the initiating control. Save first, cancel navigation if saving fails, and retain the inline recovery action. Reload needs an online connection and requires an explicit Run afterward. Ordinary C diagnostics remain beside the editor; practice output comparisons and understanding feedback are separate.

## Verification

Exercise first reading without a compiler download; manual/implicit startup and Escape; warm inline/multi-file/workspace use; stop and idle release; a complete save followed by a fresh offline tab and real compilation; old-tab first Run after deployment; two-tab update/restart; failed-save veto; preservation of independent drafts, prediction, output and marks; workspace conflicts; active-Linux/unsaved-file guards; return online and offline-copy removal. Check phone/desktop, both themes, focus and inline resource rows. Functional checks do not establish learning effectiveness.

## Reconnecting and reopening status

Opening App status forces a small metadata check and local-copy verification immediately and after that check settles. Returning online also refreshes the saved-copy state after checking the host. A failed or aborted check while offline must not leave an earlier ready message visible after cache files have changed. Complete-copy verification can share an in-flight scan across tabs; corruption tests wait for that scan to finish and then require a fresh scan.

A manual status check sends `STATUS` with `fresh: true`. The worker waits for scans already in progress, forwarding their progress so the request does not time out, then checks the cache again. This prevents a scan that read an early file before eviction from supplying the result of a later manual check. Concurrent checks that begin after the request may still share work. Corruption/reconnect tests use the actual status control and return the tab to the foreground.

While a fresh local check is pending, the dialog says “Checking saved copy” instead of repeating an earlier ready message. A failed verification request invalidates the displayed readiness until a later check succeeds; it does not remove the learner’s saved files or drafts.

An older installed worker may ignore the new `fresh` field. Workers supporting the boundary advertise `freshVerification: 1`; otherwise the page waits for the first STATUS reply and requests STATUS again before displaying readiness. This supplies a fresh check without forcing a waiting worker to activate over open learner windows.
