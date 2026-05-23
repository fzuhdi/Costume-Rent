# WF-20260523 Deterministic Runner Preview

## Status
implemented-preview

## Intent
Begin replacing LLM-driven workflow control with deterministic preflight and next-step selection while preserving the existing orchestrator as the execution fallback.

## Scope
- Add a read-only deterministic runner preview at `.opencode/scripts/workflow-runner.mjs`.
- Validate target IDs, manifest freshness, runtime-state schemas, state consistency, and clean-worktree requirements.
- Report the next intended workflow step for ticket or plan targets without invoking subagents.
- Document the preview command in `.opencode/README.md`.
- Do not replace SDET RED, developer GREEN, reviewer arbitration, plan regression, commits, pushes, or PR creation yet.

## Affected Files
- `.opencode/scripts/workflow-runner.mjs`
- `.opencode/README.md`
- `.opencode/logs/2026-05-23.md`
- `docs/workflow-changes/WF-20260523-deterministic-runner-preview.md`

## Source Of Truth
- Current authoritative FSM remains `.opencode/skills/orchestrator/SKILL.md`.
- This preview runner is an implementation experiment for deterministic preflight only.
- Existing OpenCode orchestrator execution remains the fallback path.

## Validation Plan
- Run `node --check .opencode/scripts/workflow-runner.mjs`.
- Run `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --dry-run`.
- Run `node .opencode/scripts/workflow-runner.mjs --json` for read-only status output.
- Run `git diff --check`.

## Validation Results
- `node --check .opencode/scripts/workflow-runner.mjs`: passed.
- `node -e "JSON.parse(...)"` for `.opencode/opencode.json`: passed.
- `node .opencode/scripts/build-test-case-manifest.mjs --check`: `FRESH`.
- `node .opencode/scripts/workflow-runner.mjs --json`: passed read-only status output; reported dirty-worktree warning without blocking status mode.
- `node .opencode/scripts/workflow-runner.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --dry-run`: passed expected safety behavior; blocked executable workflow because the current checkout has existing uncommitted changes.
- `git diff --check -- .opencode/scripts/workflow-runner.mjs .opencode/README.md .opencode/logs/2026-05-23.md docs/workflow-changes/WF-20260523-deterministic-runner-preview.md`: passed; Git emitted line-ending normalization warnings only.

## Rollback Plan
Delete `.opencode/scripts/workflow-runner.mjs`, remove the README preview note, remove the log entry, and delete this change record. The existing orchestrator workflow is unchanged and remains usable.

## Restart Requirement
No OpenCode restart is required for direct script usage. Restart only if later slices add or modify OpenCode slash commands, agents, skills, or config.

## Reviewer Notes
Workflow-maintenance reviewer approved this slice with no required fixes. A low-risk parser cleanup noted by the reviewer was applied after review: quoted frontmatter scalars now require matching quote delimiters.
