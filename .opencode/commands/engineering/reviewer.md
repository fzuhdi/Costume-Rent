---
description: Invoke the reviewer subagent directly. Usage /engineering/reviewer [feature-id] [slice-id] [checkpoint-sha]
agent: reviewer
subtask: true
---

FEATURE: $1
SLICE_ID: $2
CHECKPOINT_SHA: $3

(Direct subagent invocation — bypasses the orchestrator. For normal tracer workflow, use `/engineering/orchestrator [feature-id] [slice-id optional]`.)
