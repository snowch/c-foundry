# Original examples, learner edits, and question scope

Review baseline: `95f6758`. Prerequisite: no prior C for Part 1; later pages assume the preceding course lessons.

Reviewed all 227 authored lessons and their 44 chapter overviews, the 15 checked practices, 36 chapter projects, and 44 documentation questions. Checked introductions, explanations, original-output interpretations, pitfalls, questions, answer choices, feedback, edits, and project tasks against their surrounding code and controls. Also reviewed shared prediction labels, Linux instructions, reference excerpts, and illustration wording. The licensed imported manual text is preserved.

The [quoted change ledger](clarity-review-2026-11-27.json) records each change and its reason. Most text remains unchanged. This pass changes wording and context, not the C programs, expected program output, saved drafts, or completion keys.

## Findings addressed

- A question could refer to the supplied code or to the loop the learner was asked to create. The loop question now names `for (int i = 0; i < 3; i++)` and calls it the original printing loop. Its feedback distinguishes it from the new loop over `remaining`.
- Other checks relied on original values after requesting an edit. Questions now state the relevant expression, input, contract, or original sequence. For example, the rollback question explicitly starts with the original committed score of 95, independently of the requested edit to 50.
- Original-output explanations appeared immediately after edited output without a visible scope label. Every worked example now introduces that explanation with **How the original example works**. Predictions distinguish **Try a change** from a chapter project's next test.
- A lower/upper-bound explanation said the functions returned values; they return indices. The explanation now names indices, the possible `n` endpoint, and the difference that counts matching elements.
- A prepared-query walkthrough described Ken, the edited result, although the original program prints Grace. The walkthrough now identifies the original tenant/ID pair and separates the prepared lookup from the independent join.
- The hash-probe explanation described occupied slots only, although `absent_probes` includes the terminating empty slot. The counting rule now includes that slot explicitly.
- A few instructions referred to Linux in the header, manual course import, or downloading and uploading each editor change. They now name the footer or lesson launch, automatic preparation, and **Run edited source in Linux**. Compiler-comparison tasks distinguish inline and Linux copies and the guest OS from the learner's device OS.
- Comparisons now name the evidence to inspect, including the row printed after an unknown command and the explicit checks behind a contract-pass message. Practice string limits use bytes consistently. Independent illustration values are labelled as such.
- Repeated project tasks were consolidated without removing their implementation or testing requirements. Course-note excerpts explain how to reach their associated source and output.

## Validation

The existing authored-content, reference/manual, concept, interface, Part 1/2, course, project-flow, Linux launch, and navigation checks passed after regenerating native reading mirrors. Navigation checks cover all 227 lesson locations and the project sequence, including the two-loop regression with the edited draft retained.

Actual C execution checked the unchanged and edited loops, initialization versus reassignment (`21 4` versus `28 4`), and the prepared lookup (`Grace` versus `Ken`) while its independent join rows stayed unchanged. GCC produced `wrapped=0 sum=10` at both `-O0` and `-O2` for the optional optimization commands. Chromium checks covered four widths in both themes, saved drafts/predictions after reload, the correct Linux source/command selection, and script errors.

All 227 lesson programs, input/output fixtures, runtime settings, compiler settings, and answer indices were compared with the baseline and remain unchanged. The browser Linux source bundle passes reproducibility, provenance, and source-parity checks. These are editorial and functional checks; they do not measure learner comprehension.
