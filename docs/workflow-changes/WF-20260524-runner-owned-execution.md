# WF-20260524-runner-owned-execution

## Status
implemented-reviewed

## Intent
Finish the remaining deterministic-runner roadmap slices by moving ticket git/checkpoint ownership into `.opencode/scripts/workflow-runner.mjs`, making final review conditional on a narrow deterministic safe path, and adding deterministic plan execution/regression.

This slice builds directly on `WF-20260524-run-ticket-happy-path`, which introduced the earlier state-only happy-path phase advancement.

## Scope
- Extend `--run-ticket` so it owns branch preparation, checkpoint/RED/GREEN/refactor commits, and configured quality-gate checks on the deterministic happy path.
- Allow the runner to skip the final reviewer only when deterministic checks prove the recorded RED test stayed unchanged, only code-root files changed since after-RED, and the configured quality gate passes.
- Add `--run-plan` so the runner can sequence review/ready tickets, reuse the deterministic ticket path, run impacted-spec regression, optionally sync regression bug tickets, and mark the plan complete.
- Keep worker dispatch outside the runner; captured worker final messages remain the contract boundary.
- Do not change product code or the normal worker role permissions.

## Affected Files
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/README.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/logs/2026-05-23.md`
- `docs/workflow-changes/WF-20260524-runner-owned-execution.md`

## Source Of Truth
- `.opencode/scripts/workflow-runner.mjs` owns deterministic ticket/plan execution behavior.
- `.opencode/skills/orchestrator/SKILL.md` remains the authoritative FSM and fallback behavior source for non-happy-path states.
- `.opencode/skills/shared/io-contract.md` still owns worker return fields and enums.
- `docs/engineering/QUALITY_GATES.md` and `docs/engineering/TEST_INTEGRITY_POLICY.md` remain the quality/integrity gate source of truth.

## Validation Plan
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Parse `.opencode/opencode.json` and `.opencode/project.json`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-ticket --dry-run --json`.
- Run `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --run-plan --dry-run --json`.
- Run a dry-run smoke test with captured SDET RED output to prove runner-owned post-RED quality-gate/commit/checkpoint handling reaches `green-building`.

## Validation Results
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.opencode/opencode.json','utf8')); JSON.parse(fs.readFileSync('.opencode/project.json','utf8')); console.log('JSON OK')"`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: passed (`FRESH`).
- `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-ticket --dry-run --json`: passed as a read-only ticket execution report with the expected dirty-worktree warning only.
- `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --run-plan --dry-run --json`: passed as a read-only plan execution report with the expected dirty-worktree warning only.
- Dry-run smoke test with captured SDET RED output passed and showed runner-owned post-RED quality-gate/commit/checkpoint handling moving the reported runtime phase from `red-writing` to `green-building`.

## Rollback Plan
Remove the new runner-owned git/gate/plan helpers from `.opencode/scripts/workflow-runner.mjs`, revert the related README/SKILL/log edits, and delete this change record.

## Restart Requirement
OpenCode restart is required before relying on the updated runner usage text and workflow docs.

## Reviewer Notes
Workflow-maintenance reviewer approved the slice after three follow-up fixes were applied in `.opencode/scripts/workflow-runner.mjs`: defensive `regression` initialization before plan regression writes, an explicit quality-gate check before entering `final-review` when reviewer skip is not allowed, and removal of a dead `orchestrator.ticketType` reference. Remaining reviewer notes were low severity only: plan-mode review audit currently supports the deterministic `ticket-ready` and `ticket-still-ambiguous` outcomes only, and the execution log now references the predecessor `WF-20260524-run-ticket-happy-path` slice for traceability.

Post-review implementation audit found and fixed additional runner execution issues: `--run-ticket`/`--run-plan` now defer the initial dirty-worktree block and enforce phase-specific clean or allowed-dirty path checks before writes; plan-mode ticket delegation now temporarily retargets runner values to the active ticket so GREEN reruns validate against the ticket id; plan-mode active-ticket reports restore the plan summary after temporary ticket execution; plan regression is called with the correct argument order; regression cycle/result metadata is persisted after mutation so cycle budgeting survives failed or partial regression runs; and plan ready-ticket selection now uses the same runner-owned no-phase ticket path so branch/pre-RED checkpoint handling is not skipped.
