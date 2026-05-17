---
description: Invoke the reviewer subagent directly. Usage /engineering/reviewer [mode] [feature-id] [test case-id] [checkpoint-sha]
agent: reviewer
subtask: true
---

MODE: $1
FEATURE: $2
TEST_CASE_ID: $3
CHECKPOINT_SHA: $4

(Direct subagent invocation bypasses the orchestrator and lacks normal ticket context. For normal TDD workflow, use `/engineering/orchestrator [ticket-id|plan-id]`.)
