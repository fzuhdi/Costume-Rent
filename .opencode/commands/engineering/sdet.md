---
description: Invoke the SDET subagent directly for RED debugging. Usage /engineering/sdet red [feature-id] [test case-id]
agent: sdet
subtask: true
---

MODE: $1
FEATURE: $2
TEST_CASE_ID: $3

(Direct subagent invocation bypasses the orchestrator and lacks normal ticket context. For normal TDD workflow, use `/engineering/orchestrator [ticket-id|plan-id]`. Official GREEN reruns use `node .opencode/scripts/workflow-runner.mjs --target <ticket-id> --run-green --json`.)
