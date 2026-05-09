---
description: Invoke the developer subagent directly. Usage /developer [build|fix] [feature-id] [details]
agent: developer
subtask: true
---

MODE: $1
FEATURE: $2
DETAILS: $3

(Direct subagent invocation — bypasses the orchestrator. Use only for ad-hoc work or debugging. For normal feature workflow, use `/orchestrator [feature-id]`.)
