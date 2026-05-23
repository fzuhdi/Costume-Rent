# WF-20260523 Deterministic GREEN Rerun

## Status
implemented-reviewed

## Intent
Replace the LLM-driven `sdet MODE: run-green` step with deterministic command execution for the recorded RED test.

## Scope
- Add `--run-green` mode to `.opencode/scripts/workflow-runner.mjs`.
- Require active runtime state at `green-testing` before official GREEN rerun execution.
- Resolve the recorded RED test from runtime state, CLI overrides, or a single manifest-mapped test.
- Verify the recorded test title contains exactly one bracketed `test_case_id` and the test file remains under adapter-declared test roots.
- Verify the recorded RED test file is unchanged since `red.afterRedCheckpointSha` before running GREEN verification.
- Run the recorded Playwright test directly without invoking SDET, editing files, committing, pushing, or opening PRs.
- Update FSM, I/O contract, SDET prompt, and README wording so deterministic GREEN rerun is the official path.

## Affected Files
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/io-contract.md`
- `.opencode/commands/engineering/sdet.md`
- `.opencode/agents/developer.md`
- `.opencode/agents/sdet.md`
- `.opencode/README.md`
- `.opencode/logs/2026-05-23.md`
- `docs/adr/0001-tdd-orchestrator-execution.md`
- `docs/workflow-changes/WF-20260523-deterministic-green-rerun.md`

## Source Of Truth
- `.opencode/skills/orchestrator/SKILL.md` now defines `.opencode/scripts/workflow-runner.mjs --run-green` as the official GREEN verifier.
- `.opencode/skills/shared/io-contract.md` owns the parseable GREEN rerun fields emitted by the deterministic runner.
- SDET remains responsible for RED authoring and RED result classification only.

## Related Changes
- Extends `WF-20260523-deterministic-runner-preview`, which added the base deterministic preflight/status runner.

## Validation Plan
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Parse `.opencode/opencode.json` as JSON.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --json` for status output.
- Run `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-green --dry-run --json` and confirm it blocks because runtime status is currently `red-writing`, not `green-testing`.
- Run `git diff --check` for this slice.

## Validation Results
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node -e "JSON.parse(...)"` for `.opencode/opencode.json`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: `FRESH`.
- `node .opencode/scripts/workflow-runner.mjs --json`: passed status output; reported dirty-worktree warning without blocking read-only status mode.
- `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-green --dry-run --json`: passed expected safety behavior; exited `1` and blocked because runtime status is currently `red-writing`, not `green-testing`.
- `git diff --check -- .opencode/scripts/workflow-runner.mjs .opencode/skills/orchestrator/SKILL.md .opencode/skills/shared/io-contract.md .opencode/agents/developer.md .opencode/agents/sdet.md .opencode/commands/engineering/sdet.md .opencode/README.md .opencode/logs/2026-05-23.md docs/adr/0001-tdd-orchestrator-execution.md docs/workflow-changes/WF-20260523-deterministic-green-rerun.md`: passed; Git emitted line-ending normalization warnings only.
- Stale wording grep for SDET-owned GREEN verification phrases: no matches.

## Rollback Plan
Remove `--run-green` mode from `.opencode/scripts/workflow-runner.mjs`, revert FSM/I/O/SDET/README wording to the previous SDET rerun path, remove the log entry, and delete this change record. The prior SDET `run-green` behavior can be restored from git history.

## Restart Requirement
Restart OpenCode before relying on updated agents or skills because this slice changes `.opencode/agents/**` and `.opencode/skills/**`. Direct script usage does not require restart.

## Reviewer Notes
Workflow-maintenance reviewer approved this slice with no required fixes. Two low-risk recommendations were applied after review: GREEN verification now requires parsed Playwright test counts before reporting `verified`, and this record now links the predecessor runner-preview slice.
