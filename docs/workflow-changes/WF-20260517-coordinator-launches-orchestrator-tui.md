# WF-20260517-coordinator-launches-orchestrator-tui

## Status
superseded-by-WF-20260524-task-based-orchestrator-dispatch

## Intent
Historical record: this change previously moved `/coordinator` explicit plan and ticket targets to an interactive OpenCode CLI launcher. It is superseded by `WF-20260524-task-based-orchestrator-dispatch`, which removes that launcher path and restores task-based orchestrator dispatch after deterministic preparation.

## Scope
- `.opencode/opencode.json`
- removed legacy interactive launcher script
- `.opencode/workflow-models.json`
- `.opencode/skills/coordinator/SKILL.md`
- `.opencode/skills/coordinator/REFERENCE.md`
- `.opencode/README.md`
- `AGENTS.md`
- `docs/adr/0003-ticket-and-workflow-workspaces.md`
- `.opencode/agents/developer.md`
- `.opencode/agents/sdet.md`
- `.opencode/agents/orchestrator.md`
- `.opencode/agents/reviewer.md`

## Source Of Truth
- Coordinator command routing: `.opencode/opencode.json`
- Superseding task-based dispatch source of truth: `.opencode/skills/coordinator/REFERENCE.md`
- Workflow role model priorities: `.opencode/workflow-models.json`
- Coordinator execution policy: `.opencode/skills/coordinator/SKILL.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Validation Plan
- Parse `.opencode/opencode.json` after the command template change.
- Parse `.opencode/workflow-models.json` after adding role priorities.
- Superseded validation is historical only; current validation is recorded in `WF-20260524-task-based-orchestrator-dispatch`.
- Grep updated docs for stale coordinator claims that still describe default inline orchestrator-subagent dispatch.

## Rollback Plan
- Revert this workflow-maintenance change to restore inline coordinator subagent dispatch and remove the launcher helper.

## Restart Requirement
yes - OpenCode must reload updated command, skill, and config files.

## Review Notes
- Direct `/engineering/orchestrator` remains the lower-level launch target and still dispatches the real orchestrator subagent safely.
- Superseded: current workflow dispatches orchestrator tasks and reports blocked/partial task returns to the coordinator.
- Workflow role defaults honor this priority order: developer/sdet prefer `opencode/minimax-m2.5-free` over `opencode/big-pickle`; orchestrator/reviewer prefer `opencode/big-pickle` over `opencode/minimax-m2.5-free`.
