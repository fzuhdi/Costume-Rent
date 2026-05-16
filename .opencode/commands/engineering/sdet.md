---
description: Invoke the SDET subagent directly. Usage /engineering/sdet [red|run-green] [feature-id] [slice-id]
agent: sdet
subtask: true
---

MODE: $1
FEATURE: $2
SLICE_ID: $3

(Direct subagent invocation bypasses the orchestrator and lacks normal ticket context. For normal TDD workflow, use `/engineering/orchestrator [ticket-id|plan-id]`.)
