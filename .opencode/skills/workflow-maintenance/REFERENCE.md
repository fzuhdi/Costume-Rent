# Workflow Maintenance Reference

## Change Size

Small direct maintenance can be edited without a workflow-change record when it is limited to typo fixes, wording clarifications, or narrow documentation updates that do not alter behavior.

Substantial workflow changes need a workflow-change record when they alter any of these:

- agent permissions or responsibilities
- skill behavior or trigger conditions
- command routing or user entry points
- branch, workspace, state, review, or PR policy
- quality gates, test integrity rules, or workflow helper scripts
- OpenCode config or MCP setup

## Workspace Policy

Substantial workflow changes use isolated workspaces, the same way product tickets do.

Recommended layout:

```text
../Costume-Rent-workspaces/WF-YYYYMMDD-name
```

Recommended branch:

```text
workflow/WF-YYYYMMDD-name
```

The coordinator checkout schedules and reviews status only. Do not execute substantial workflow changes in the coordinator checkout unless the user explicitly accepts that risk.

## Source Of Truth Rules

Use this mapping to avoid duplicate documents:

- Durable decisions: `docs/adr/*.md`
- Operational procedure: relevant skill `REFERENCE.md`
- User-facing index: `AGENTS.md`
- Human overview: `.opencode/README.md`
- Command snippets and recovery: `.opencode/knowledge/runbook.md`
- Change-specific rationale: `docs/workflow-changes/*.md`

When a policy already has a source of truth, update that file and add links or short pointers elsewhere.

## Review Criteria

Reviewer `MODE: workflow-maintenance` should check:

- OpenCode config shape is valid.
- Agent permissions match intended scope.
- Skills have clear descriptions with `Use when...` triggers.
- New skills follow `write-a-skill` structure.
- No policy was duplicated unnecessarily.
- User-facing commands remain accurate.
- Validation evidence is sufficient.
- Restart requirements are called out.
- Rollback path is understandable.

## Return Evidence

Workflow maintenance summaries should include:

- files changed
- source of truth updated
- validation commands and results
- whether restart is required
- any remaining manual review or merge steps
