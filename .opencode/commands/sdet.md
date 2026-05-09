---
description: Invoke the SDET subagent directly. Usage /sdet [write|run|triage] [feature-id]
agent: sdet
subtask: true
---

MODE: $1
FEATURE: $2

(Direct subagent invocation — bypasses the orchestrator. For normal feature workflow, use `/orchestrator [feature-id]`.)
