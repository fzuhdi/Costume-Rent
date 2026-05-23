---
description: Show TDD recovery status and recommend the safest next action
agent: build
---

Run `node .opencode/scripts/workflow-runner.mjs --json` and summarize its read-only status report.

Recommend the safest TDD recovery action from the runner's `nextStep`, including deterministic GREEN rerun when applicable.

Do NOT invoke any subagents. This is a read-only status query.
