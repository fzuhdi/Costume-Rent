# WF-20260517-coordinator-arg-first-parallel

## Status
complete

## Intent
Repair coordinator behavior so explicit arguments avoid broad discovery, empty coordinator runs ask for a target first, plan runs fan out ready tickets in isolated ticket workspaces, and worker agents do not request permissions for paths outside their active project root.

Follow-up: cap plan fan-out at 3 concurrent ticket orchestrators and schedule independent tickets before tickets with declared dependencies.

## Scope
- `.opencode/opencode.json`
- `.opencode/skills/coordinator/SKILL.md`
- `.opencode/skills/coordinator/REFERENCE.md`
- `.opencode/README.md`
- `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Source Of Truth
- Coordinator command routing: `.opencode/opencode.json`
- Coordinator behavior: `.opencode/skills/coordinator/SKILL.md` and `.opencode/skills/coordinator/REFERENCE.md`
- Workspace policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`

## Validation Plan
- Parse `.opencode/opencode.json` as JSON.
- Review changed coordinator instructions for arg-first routing, targeted reads, parallel fan-out, and no cross-root subagent dispatch.
- Review max-parallel-3 batching and dependency-last scheduling policy.
- Check git status for the coordinator checkout and report any dirty external item workspace separately.

## Rollback Plan
- Revert this workflow-change commit to restore the previous coordinator command and workspace policy.

## Restart Requirement
yes - OpenCode must reload `.opencode/opencode.json` and updated skill files.

## Review Notes
- Workflow-maintenance reviewer approved the coordinator arg-first routing, targeted reads, parallel ticket fan-out policy, and no cross-root worker dispatch rule.
- Follow-up added max parallel 3 and dependency-last scheduling after user approval.
