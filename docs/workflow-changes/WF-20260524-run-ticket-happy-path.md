# WF-20260524-run-ticket-happy-path

## Status
implemented-reviewed

## Intent
Add a deterministic `--run-ticket` mode so `.opencode/scripts/workflow-runner.mjs` can advance one ticket through the normal happy-path FSM phases using runtime state, captured worker final messages, and the official GREEN rerun.

## Scope
- Add `--run-ticket` and `--after-red-checkpoint-sha <sha>` CLI support to `.opencode/scripts/workflow-runner.mjs`.
- Advance the ticket happy path one phase at a time: `red-writing -> green-building -> green-testing -> refactoring/final-review -> ticket-complete`.
- Reuse deterministic worker-output validation before each worker-driven phase transition.
- Persist runtime state changes to `.opencode/state/orchestrator-progress.json` and `.opencode/state/ticket-progress.json`, and mark the ticket complete in frontmatter when reviewer approval is supplied.
- Keep worker dispatch, checkpoint commit creation, and plan-mode execution out of scope for this slice.

## Affected Files
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/README.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/logs/2026-05-23.md`
- `docs/workflow-changes/WF-20260524-run-ticket-happy-path.md`

## Source Of Truth
- `.opencode/scripts/workflow-runner.mjs` owns deterministic run-ticket phase advancement for this slice.
- `.opencode/skills/shared/io-contract.md` owns worker output fields and enums reused by the runner.
- Superseded by `WF-20260524-runner-canonical-refactor`: `.opencode/scripts/workflow-runner.mjs` is now the canonical state-transition source of truth, while `.opencode/skills/orchestrator/SKILL.md` documents runner-dispatched behavior.

## Validation Plan
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Parse `.opencode/opencode.json` and `.opencode/project.json`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-ticket --dry-run --json`.
- Run a dry-run smoke test with captured SDET RED output and `--after-red-checkpoint-sha` to prove `red-writing -> green-building` advancement.

## Validation Results
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.opencode/opencode.json','utf8')); JSON.parse(fs.readFileSync('.opencode/project.json','utf8')); console.log('JSON OK')"`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: passed (`FRESH`).
- `node .opencode/scripts/workflow-runner.mjs --target TICKET-20260517-004 --run-ticket --dry-run --json`: passed as a read-only phase report with the expected dirty-worktree warning only.
- Dry-run smoke test with captured SDET RED output and `--after-red-checkpoint-sha abc1234`: passed and advanced the reported runtime phase from `red-writing` to `green-building` without writing files.

## Rollback Plan
Remove `--run-ticket` support and related state-transition helpers from `.opencode/scripts/workflow-runner.mjs`, revert the README/SKILL/log edits, and delete this change record.

## Restart Requirement
OpenCode restart is required before relying on updated workflow docs and runner usage text.

## Reviewer Notes
Workflow-maintenance reviewer approved the slice after one required traceability fix was applied in `.opencode/scripts/workflow-runner.mjs`: blocked `green-testing` outcomes now emit a `run-ticket-phase` check. Remaining reviewer notes were low-risk only: ticket/frontmatter and runtime writes are not transactional, and `--after-red-checkpoint-sha` is not format-validated yet.
