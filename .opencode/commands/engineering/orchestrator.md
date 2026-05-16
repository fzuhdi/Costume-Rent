---
description: Run one tracer-bullet slice for a feature. Usage /engineering/orchestrator [feature-id] [slice-id optional]
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Raw arguments: **$ARGUMENTS**

Interpret arguments as:

- Feature: `$1`
- Optional slice: `$2`

If `$1` is empty, run Startup + Standard Report (treat as `/productivity/start`) and ask the user which feature to work on.

Otherwise:

1. Run the orchestrator's Startup procedure for `$1` and optional `$2`.
2. Select or resume exactly one tracer slice (`SLICE_ID`).
3. Execute the FSM from the current validated state.
4. Dispatch subagents (`developer`, `sdet`, `reviewer`) via the Task tool per the state-execution rules.
5. Continue only until `slice-complete`, `feature-complete`, `escalated`, or the iteration limit.
6. Stop after one verified slice and report the next candidate slice. Do not start the next slice in this invocation.

You are NOT allowed to skip states, change worker assignments, override transitions, or expand beyond the selected `SLICE_ID`.
