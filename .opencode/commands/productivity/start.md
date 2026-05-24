---
description: Show TDD recovery status and recommend the safest next action
agent: build
---

Run `node .opencode/scripts/workflow-runner.mjs --json` and summarize its read-only status and reconciliation report.

Recommend the safest TDD recovery action from the runner's `nextStep`, prioritizing reconciliation blockers before deterministic GREEN rerun or worker dispatch.

Do NOT invoke any subagents. This is a read-only status query.
