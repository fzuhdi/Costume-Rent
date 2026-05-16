---
description: Convert a PRD, bug report, or plan into an Agile plan plus orchestrator-ready tracer tickets. Usage /planning/plan-to-tickets [plan-file] [plan-id optional]
agent: build
---

Load the plan-to-tickets skill (`.opencode/skills/plan-to-tickets/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as:

- Plan file: `$1`
- Optional plan id: `$2`

Run the skill with:

```text
PLAN_FILE: $1
PLAN_ID: $2
RAW_ARGUMENTS: $ARGUMENTS
```

Create or update only planning artifacts such as `docs/plans/*.md` and `docs/tickets/*.md`. Do not invoke the orchestrator or any engineering subagent.
