# WF-20260517-coordinator-launches-orchestrator-tui

## Status
complete

## Intent
Refactor `/coordinator` explicit plan and ticket targets to launch a visible orchestrator TUI window through the OpenCode CLI instead of dispatching `task(subagent_type: "orchestrator")` inline, clean the launched OpenCode session only after successful completion, and ask the user to choose from dynamically discovered models before every executable launch.

## Scope
- `.opencode/opencode.json`
- `.opencode/scripts/launch-orchestrator-tui.mjs`
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
- Launch, model selection, and session-cleanup mechanics: `.opencode/scripts/launch-orchestrator-tui.mjs`
- Workflow role model priorities: `.opencode/workflow-models.json`
- Coordinator execution policy: `.opencode/skills/coordinator/SKILL.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Validation Plan
- Parse `.opencode/opencode.json` after the command template change.
- Parse `.opencode/workflow-models.json` after adding role priorities.
- Run `node --check .opencode/scripts/launch-orchestrator-tui.mjs`.
- Review coordinator skill/reference wording for visible TUI launch semantics, no inline orchestrator-subagent fallback, and mandatory model choice before each executable launch.
- Grep updated docs for stale coordinator claims that still describe default inline orchestrator-subagent dispatch.

## Rollback Plan
- Revert this workflow-maintenance change to restore inline coordinator subagent dispatch and remove the launcher helper.

## Restart Requirement
yes - OpenCode must reload updated command, skill, and config files.

## Review Notes
- Direct `/engineering/orchestrator` remains the lower-level launch target and still dispatches the real orchestrator subagent safely.
- Successful launched sessions delete themselves by unique title after the TUI exits; blocked or partial runs preserve the session for debugging.
- Workflow role defaults honor this priority order: developer/sdet prefer `opencode/minimax-m2.5-free` over `opencode/big-pickle`; orchestrator/reviewer prefer `opencode/big-pickle` over `opencode/minimax-m2.5-free`.
