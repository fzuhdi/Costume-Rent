# ADR 0001: TDD Orchestrator Execution

## Status
Accepted

## Context
The previous orchestrator workflow built application code first, then asked SDET to add or run tests. That made the acceptance test less authoritative and allowed implementation assumptions to shape the test after the fact.

The workflow needs to execute small tracer tickets while preserving strict TDD behavior, clear ownership, and deterministic recovery.

## Decision
Executable `feature` and `bug` tickets use a strict RED/GREEN workflow.

- SDET owns the canonical ticket-level acceptance RED.
- `explore` may run read-only discovery in parallel while SDET writes and validates RED.
- Developer application-code work starts only after SDET returns `RED_STATUS: failing_expected`.
- Developer must not edit the SDET acceptance test during GREEN.
- `.opencode/scripts/workflow-runner.mjs --run-green` is the official GREEN test gate and reruns the recorded RED test after developer work.
- Reviewer runs after deterministic GREEN verification passes on the happy path.
- Reviewer arbitrates invalid REDs, already-green coverage, ticket ambiguity, and final scope/test-integrity review.
- Plan mode executes tickets sequentially inside one workspace; coordinator-managed multi-ticket execution uses isolated workspaces per ADR 0003.
- Optional refactor is bounded to one app-code-only pass after GREEN, followed by the same deterministic targeted rerun and final review.

## Consequences
The workflow is slower than build-first execution but gives clearer behavioral proof and cleaner responsibility boundaries.

Invalid REDs or ambiguous tickets block implementation rather than letting the developer interpret intent. This avoids overfitting but requires planning repair and reviewer audit before execution resumes.

## Rejected Alternatives
- Keep build-first workflow as fallback: rejected because dual modes make state, recovery, and agent contracts ambiguous.
- Let developer and SDET edit code/tests concurrently: rejected because it is not strict TDD and risks worktree conflicts.
- Reviewer audits every valid RED: rejected because it adds overhead without enough value; reviewer audits disputed and already-green REDs.
