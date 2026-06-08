---
description: Show workflow status and recommend the next safe action
agent: build
---

Run `node .opencode/scripts/workflow-runner.mjs --json` and summarize its read-only status and reconciliation report.

Include current plan/ticket/branch, workflow phase, last checkpoint SHA, reconciliation status, blockers, warnings, and the runner's `nextStep`.

Do NOT invoke any subagents. This is a read-only status query.
