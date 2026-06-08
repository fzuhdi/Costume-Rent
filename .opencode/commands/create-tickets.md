---
description: Create or repair plan/ticket docs from PRDs, feature requests, bug reports, or implementation notes. Usage /create-tickets [source-file] [plan-id optional]
---

Load the create-tickets skill (`.opencode/skills/create-tickets/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as:

- Empty: use obvious current context if present; otherwise ask one short question for the source requirement, PRD, bug report, or plan file.
- First path-like arg: `PLAN_FILE` or source document to convert.
- First `PLAN-YYYYMMDD-*` arg: desired or existing `PLAN_ID`.

Create or repair durable project docs only under:

- `docs/plans/`
- `docs/tickets/`
- `docs/acceptance/` when a new acceptance section is required before ticketing

Do not run `/engineering/orchestrator`, launch subagents, modify app code, or create `.opencode/generated`/`.codex/generated`.

End with the final report shape from `.opencode/skills/create-tickets/SKILL.md`.
