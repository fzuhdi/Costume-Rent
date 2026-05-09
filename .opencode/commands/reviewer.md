---
description: Invoke the reviewer subagent directly. Usage /reviewer [feature-id] [bug-ids...] [checkpoint-sha]
agent: reviewer
subtask: true
---

FEATURE: $1
BUGS: $2
CHECKPOINT_SHA: $3

(Direct subagent invocation — bypasses the orchestrator. For normal workflow, use `/orchestrator [feature-id]`.)
