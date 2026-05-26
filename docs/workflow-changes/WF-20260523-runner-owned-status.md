# WF-20260523-runner-owned-status

## Status
implemented-reviewed

## Intent
Make read-only workflow status use the deterministic runner as the source of truth and remove stale policy wording left after deterministic GREEN rerun replaced SDET GREEN verification.

## Scope
- Route `/productivity/start`, `/productivity/status`, and empty `/engineering/orchestrator` status behavior to `node .opencode/scripts/workflow-runner.mjs --json`.
- Rename developer GREEN handoff statuses away from SDET-specific names.
- Remove stale recovery/model-selection wording from active workflow docs.
- Do not change product code, worker execution behavior, branch logic, commits, or PR behavior.

## Affected Files
- `.opencode/commands/productivity/start.md`
- `.opencode/commands/productivity/status.md`
- `.opencode/commands/engineering/orchestrator.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/shared/io-contract.md`
- `.opencode/agents/developer.md`
- `AGENTS.md`
- `docs/adr/0003-ticket-and-workflow-workspaces.md`
- `.opencode/logs/2026-05-23.md`
- `docs/workflow-changes/WF-20260523-runner-owned-status.md`

## Source Of Truth
- `.opencode/scripts/workflow-runner.mjs` owns deterministic read-only status output and GREEN rerun status output.
- `.opencode/skills/shared/io-contract.md` owns parseable worker return fields.
- `.opencode/workflow-models.json` owns role model defaults.

## Validation Plan
- Parse `.opencode/opencode.json` and `.opencode/project.json`.
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Run `node .opencode/scripts/build-test-case-manifest.mjs --check`.
- Run `node .opencode/scripts/workflow-runner.mjs --json`.
- Grep for stale SDET GREEN handoff and obsolete coordinator model-selection phrases.

## Validation Results
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.opencode/opencode.json','utf8')); JSON.parse(fs.readFileSync('.opencode/project.json','utf8')); console.log('JSON OK')"`: passed.
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: passed (`FRESH`).
- `node .opencode/scripts/workflow-runner.mjs --json`: passed read-only status output with expected dirty-worktree warning only.
- Stale phrase grep for prior SDET GREEN handoff and obsolete model-selection wording: no files found.

## Rollback Plan
Revert this change record and the listed command/doc prompt edits. The deterministic runner and GREEN rerun implementation remain unchanged.

## Restart Requirement
OpenCode restart is required before relying on updated commands, agents, and skills.

## Reviewer Notes
Workflow-maintenance reviewer approved with no required fixes. Reviewer confirmed command routing is read-only, stale SDET GREEN/model-selection wording was removed, no product code or runtime execution behavior changed, and restart requirement is visible. A cosmetic `io-contract.md` indentation note was applied after review.
