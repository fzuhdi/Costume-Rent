---
name: workflow-maintenance
description: Maintains OpenCode workflow configuration, agents, skills, commands, workflow docs, ADRs, and quality gates. Use when changing `.opencode/**`, workflow agents/skills/commands, workflow policies, coordinator behavior, or workflow-change records.
---

# Workflow Maintenance

## Quick Start

Use this skill for workflow-platform changes, not product behavior. Route substantial workflow refactors through `workflow-engineer` and reviewer `MODE: workflow-maintenance`.

For detailed rules, see [REFERENCE.md](REFERENCE.md).

## Triggers

Use when the user asks to change:

- `.opencode/**`
- agents, skills, commands, permissions, MCPs, or OpenCode config
- workflow docs, ADRs, quality gates, or runbooks
- coordinator behavior or workspace policy
- workflow-change records under `docs/workflow-changes/`

Do not use for normal product features or product bugs; those go through the normal plan/ticket workflow.

## Workflow

1. Classify the request as small direct maintenance or substantial workflow change.
2. For substantial changes, create or update a `docs/workflow-changes/WF-YYYYMMDD-name.md` record.
3. Use an isolated workspace/branch for substantial workflow changes.
4. Dispatch `workflow-engineer` for edits when using subagents.
5. Use `write-a-skill` whenever creating or modifying skills.
6. Keep one durable source of truth for each policy and make summaries point to it.
7. Run targeted validation.
8. Ask reviewer with `MODE: workflow-maintenance` before merge/commit handoff.

## Change Record Checklist

Substantial workflow changes should document:

- change id and status
- intent and scope
- affected files
- source of truth being changed
- validation plan
- rollback plan
- restart requirement
- reviewer notes

## Validation Checklist

- Parse `.opencode/opencode.json` after config edits.
- Check changed JavaScript helpers with `node --check`.
- Run the project-configured quality gate after quality-gate, test-helper, or acceptance-policy changes when a gate is configured.
- Grep for stale names after renames.
- Grep for duplicate policy when adding workflow docs.

## Hard Rules

- Do not edit `backend/**` or `frontend/**` as workflow maintenance.
- Do not use normal product tickets for workflow-platform changes.
- Do not bypass reviewer for substantial workflow changes.
- Do not duplicate policy across ADRs, skills, runbooks, and README files.
- Do not hide OpenCode restart requirements.
