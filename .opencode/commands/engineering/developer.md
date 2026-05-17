---
description: Invoke the developer subagent directly. Usage /engineering/developer [green|refactor] [feature-id] [test case-id] [details]
agent: developer
subtask: true
---

MODE: $1
FEATURE: $2
TEST_CASE_ID: $3
DETAILS: $4

(Direct subagent invocation bypasses the orchestrator and lacks normal RED artifacts. Use only for debugging. For normal TDD workflow, use `/engineering/orchestrator [ticket-id|plan-id]`.)
