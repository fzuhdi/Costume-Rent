# WF-20260524-task-based-orchestrator-dispatch

## Status
implemented-reviewed

## Intent
Remove the old interactive orchestrator launcher path and make `/coordinator` use deterministic preparation plus task-based orchestrator fan-out.

## Scope
- Refactor `.opencode/scripts/launch-parallel-plan.mjs` into a prepare/handoff helper.
- Delete the legacy orchestrator launcher script.
- Update coordinator, orchestrator, command, runbook, README, ADR, and agent guidance to point at task-based dispatch.
- Keep durable dispatch procedure in `.opencode/skills/coordinator/REFERENCE.md`; other files are summaries or pointers.

## Source Of Truth
- Coordinator dispatch procedure: `.opencode/skills/coordinator/REFERENCE.md`.
- Workspace/runtime isolation policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`.
- Prepare/handoff output contract: `.opencode/scripts/launch-parallel-plan.mjs`.
- Ticket FSM inside each worktree: `.opencode/skills/orchestrator/SKILL.md`.

## Capability Probe Result
The task-based handoff path was capability-probed before this refactor: an `orchestrator` task could inspect its assigned worktree, write/read/delete `.opencode/state/capability-probe.json`, and dispatch a nested `reviewer` task with the same `WORKTREE_ROOT`. No secret env file contents are required for that handoff.

## Validation Plan
- `node --check .opencode/scripts/launch-parallel-plan.mjs`.
- Parse `.opencode/opencode.json`.
- Grep for stale references to the removed launcher, interactive orchestrator default/fallback wording, and `--no-launch`.
- Check active command examples for missing `--json` on task-handoff prepare commands.
- Optional smoke: `node .opencode/scripts/launch-parallel-plan.mjs --target <ready-plan> --parallel 3 --dry-run --json` and verify each dispatch includes `task.subagentType`, `task.description`, `task.commandContext`, and `task.prompt`.

## Validation Results
- `node --check .opencode/scripts/launch-parallel-plan.mjs`: passed.
- JSON parse for `.opencode/opencode.json`, `.opencode/project.json`, and `.opencode/workflow-models.json`: passed.
- `node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-20260517-staff-admin-mobile-first-ui-refresh --parallel 1 --dry-run --json`: passed; dispatch `TICKET-20260517-004` included `dispatchStatus: prepared`, `task.subagent_type: orchestrator`, `task.command`, `task.command_context.worktreeRoot`, and an orchestrator prompt containing `WORKTREE_ROOT`.
- Stale-reference grep for the removed launcher, interactive default/fallback wording, and `--no-launch`: passed outside this change record's validation-plan wording.
- Active command-example check for task-handoff prepare commands missing `--json`: passed.

## Rollback Plan
Revert this change record and listed files from version control. Restoring the deleted launcher would also require reverting coordinator guidance and command routing together.

## Restart Requirement
Yes. OpenCode must reload updated `.opencode/opencode.json`, commands, agents, and skills.

## Reviewer Notes
Workflow-maintenance reviewer found one required fix: `docs/runbooks/project-runbook.md` showed the production prepare command without `--json`, which would prevent coordinator parsing of `dispatch.task`. Fixed by adding `--json` and adding a validation-plan check for the flag consistency. Reviewer re-check returned no findings; residual risk is low and limited to the intentionally superseded historical filename `WF-20260517-coordinator-launches-orchestrator-tui.md`.
