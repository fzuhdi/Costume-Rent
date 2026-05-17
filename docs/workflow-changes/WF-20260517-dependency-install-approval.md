# WF-20260517-dependency-install-approval

## Status
complete

## Intent
Prevent workflow agents from repairing setup by silently installing packages, updating dependencies, or downloading browser/runtime caches. Dependency changes and installer commands must be explicit user-approved actions.

## Scope
- `.opencode/skills/shared/constraints.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/skills/coordinator/REFERENCE.md`
- `.opencode/README.md`
- `.opencode/knowledge/runbook.md`
- `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Source Of Truth
- Universal workflow constraint: `.opencode/skills/shared/constraints.md`
- Orchestrator behavior: `.opencode/skills/orchestrator/SKILL.md`
- Workspace dependency-cache policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Validation Plan
- Review changed Markdown for a single consistent policy.
- Grep workflow docs for stale automatic install guidance.
- Confirm repository status shows only intended workflow-maintenance files changed.

## Rollback Plan
- Revert this workflow-change commit to restore the previous dependency/install behavior.

## Restart Requirement
yes - OpenCode must reload updated skill files under `.opencode/skills/`.

## Review Notes
- User approved the policy direction: agents may ask if they need to update or add dependencies.
- Missing Playwright/browser caches are setup blocks until the user approves the exact installer command.
