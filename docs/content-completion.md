# C Foundry content completion

The current course has 44 authored chapters and 227 lessons across nine parts. `node tests/content-complete.cjs` checks every promised topic against its actual reading: outcomes, explanation, complete example, expected result, walkthrough, mistake, question, feedback and edit experiment. It rejects planned status and placeholder prose. No planned reading remains in the current curriculum.

The two Part 2 projects deliberately start with TODO implementations and failing student checks. Their public contracts, executable checks and separate reference solutions are supplied; filling those TODOs in the starter would remove the learner task. Later TinyDB chapters teach bounded components and extension workshops; they do not claim an assembled production database.

This pass corrects remaining manual source-transfer instructions: learners select and edit a file, then choose Run edited source in Linux. The page sends the source and test command. Backup restore commands are sent by their control too. Browser Linux and its compiler tools are self-hosted and included in the verified offline release. The source archive is regenerated whenever its included sources or documentation change.

Verification: the full interface/content suite checks all 227 routes, quizzes, references, example/source parity and chapter workshops. Real Wasm tests cover editable and multi-file execution, stdin, files and TinyDB operations. Browser journeys check offline compilation, saved work, updates and actual source transfer into the Linux guest. These are functional checks, not evidence of learning effectiveness.
