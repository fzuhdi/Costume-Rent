# Workflow Changes

Use this directory for substantial changes to the repository workflow platform: OpenCode agents, skills, commands, coordinator behavior, workspace policy, quality gates, workflow docs, or workflow helper scripts.

Do not use these records for product features or product bugs. Product work belongs in `docs/plans/*.md` and `docs/tickets/*.md`.

## When To Create A Record

Create `WF-YYYYMMDD-short-name.md` when a workflow change alters behavior, permissions, branch/workspace policy, review policy, command routing, or validation rules.

Small wording fixes can be direct edits plus `.opencode/logs/YYYY-MM-DD.md` entries.

## Template

```markdown
---
id: WF-YYYYMMDD-short-name
status: draft | in_progress | review | blocked | complete
owner: workflow-engineer
reviewer_mode: workflow-maintenance
---

# {Title}

## Intent
{What workflow problem this change solves.}

## Scope
- {Files or policy areas that may change.}

## Source Of Truth
- {ADR, skill reference, runbook, or config file that owns the durable policy.}

## Validation Plan
- {Commands or checks required before review.}

## Rollback Plan
- {How to revert safely if OpenCode config or workflow behavior breaks.}

## Restart Requirement
yes | no - {why}

## Review Notes
- {Reviewer findings or approval evidence.}
```
