---
description: Show TDD workflow status and recommend the next safe action
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`) and run its **Startup** procedure followed by its **Standard Report** section.

Include current plan/ticket/branch, TDD phase, last checkpoint SHA, RED test file/title/status, blocked reason or next command, and PR post-step state if present.

Do NOT invoke any subagents. This is a read-only status query.
