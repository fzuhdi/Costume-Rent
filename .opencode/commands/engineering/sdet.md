---
description: Invoke the SDET subagent directly. Usage /engineering/sdet [write|run|triage] [feature-id] [slice-id]
agent: sdet
subtask: true
---

MODE: $1
FEATURE: $2
SLICE_ID: $3

(Direct subagent invocation — bypasses the orchestrator. For normal tracer workflow, use `/engineering/orchestrator [feature-id] [slice-id optional]`.)
