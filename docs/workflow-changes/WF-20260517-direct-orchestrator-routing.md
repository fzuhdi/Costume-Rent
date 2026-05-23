# WF-20260517-direct-orchestrator-routing

## Status
complete

## Intent
Repair direct `/engineering/orchestrator` so explicit ticket/plan arguments dispatch the real orchestrator subagent instead of letting the top-level build agent simulate worker roles, and make empty `/engineering/orchestrator` show runnable plans instead of individual tickets.

## Scope
- `.opencode/commands/engineering/orchestrator.md`
- `.opencode/skills/orchestrator/SKILL.md`
- `.opencode/agents/orchestrator.md`
- `.opencode/README.md`
- `AGENTS.md`

## Source Of Truth
- Direct orchestrator command routing: `.opencode/commands/engineering/orchestrator.md`
- Orchestrator FSM and standard report behavior: `.opencode/skills/orchestrator/SKILL.md`
- Orchestrator subagent execution guardrails: `.opencode/agents/orchestrator.md`
- User-facing command summary: `.opencode/README.md` and `AGENTS.md`

## Validation Plan
- Review direct orchestrator command instructions for empty-args read-only behavior and explicit subagent dispatch on plan/ticket args.
- Review orchestrator skill standard-report instructions for runnable plan listing and no ticket launch list in empty-args mode.
- Review orchestrator subagent hard rules for no manual worker-role simulation when dispatch is unavailable.
- Grep for stale `/engineering/orchestrator` descriptions in the updated user-facing docs.

## Rollback Plan
- Revert this workflow-maintenance change to restore the previous direct orchestrator command behavior and empty-args report format.

## Restart Requirement
yes - OpenCode must reload updated command, skill, and agent files.

## Review Notes
- This historical change kept the then-current single-checkout plan model; ADR 0003 now supersedes that default with max-3 isolated coordinator fan-out.
- Direct `/engineering/orchestrator PLAN-...` stays a valid single-orchestrator fallback.
