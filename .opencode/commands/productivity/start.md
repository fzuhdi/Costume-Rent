---
description: Show TDD recovery status and recommend the safest next action
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`) and run its **Startup** procedure followed by its **Standard Report** section.

Recommend the safest TDD recovery action: resume RED validation, continue GREEN, rerun SDET, resolve dirty worktree, audit review tickets, run the next ready ticket, or rerun failed PR creation.

Do NOT invoke any subagents. This is a read-only status query.
