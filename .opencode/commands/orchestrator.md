---
description: Run the FSM workflow for a feature. Usage /orchestrator [feature-id]
agent: build
---

Load the orchestrator skill (`.opencode/skills/orchestrator/SKILL.md`).

Target feature: **$ARGUMENTS**

If `$ARGUMENTS` is empty, run Startup + Standard Report (treat as `/start`) and ask the user which feature to work on.

Otherwise:
1. Run the orchestrator's **Startup** procedure for the target feature.
2. Execute the FSM from the current validated state.
3. Dispatch subagents (`developer`, `sdet`, `reviewer`) via the Task tool per the state-execution rules.
4. Continue running until the FSM reaches `complete`, `escalated`, or hits the iteration limit.
5. Output the result.

You are NOT allowed to skip states, change worker assignments, or override transitions.
