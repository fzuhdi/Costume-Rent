---
description: Invoke the developer subagent directly. Usage /engineering/developer [build|fix] [feature-id] [slice-id] [details]
agent: developer
subtask: true
---

MODE: $1
FEATURE: $2
SLICE_ID: $3
DETAILS: $4

(Direct subagent invocation — bypasses the orchestrator. Use only for ad-hoc work or debugging. For normal tracer workflow, use `/engineering/orchestrator [feature-id] [slice-id optional]`.)
