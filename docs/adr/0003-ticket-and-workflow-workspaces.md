# ADR 0003: Ticket And Workflow Workspaces

## Status
Accepted (updated 2026-05-17)

## Context
The workflow coordinates executable tickets and workflow-maintenance changes. Running multiple workflow engines in one checkout shares branches, runtime state, test output, and uncommitted files, which creates conflicts and makes recovery ambiguous. However, the model provider serializes requests and cannot run true parallel execution, so the overhead of isolated worktrees for every ticket outweighs the benefit.

Workflow-platform changes should not be made casually in the coordinator checkout when they are substantial.

## Decision

### Single-Checkout Sequential Subagent Execution (Default)
For normal operation, the coordinator dispatches one orchestrator subagent per target plan or ticket via `task(subagent_type: "orchestrator")`. The orchestrator subagent runs in the same checkout but in its own OpenCode agent context, managing its own state files, checkpoint commits, subagent dispatches, and plan completion.

- The coordinator checkout is for scheduling, discovery, and aggregate reporting.
- The orchestrator subagent is the single workflow engine for one plan or ticket run.
- Only one orchestrator subagent runs at a time (sequential execution).
- Ticket branches and plan branches are created in the coordinator checkout.
- Plan-completion regression runs from the plan branch after all tickets complete.

### Isolated Worktrees (Advanced, For True Parallel Execution)
Isolated Git worktrees remain an option for advanced use cases where the model/provider supports true parallel child OpenCode sessions.

- Plan integration branches start from the recorded base branch.
- Ticket branches start from the plan integration branch when the ticket has `plan_id`.
- Standalone ticket branches may start from the recorded base branch.
- Substantial workflow changes get a dedicated workspace and `workflow/{change-id}` branch.
- Ticket branches merge back into the plan branch sequentially.
- Each executed ticket gets a dedicated workspace and branch.
- Worker agents must run from the active item workspace root.
- The coordinator must not run multiple workflow engines in the same checkout concurrently (this rule applies to the single-checkout subagent approach).
- The coordinator must not dispatch worker subagents from one project root with absolute paths into another worktree.
- Dependency directories may be reused, copied, or junctioned into ticket worktrees only when they match the relevant lockfile hash.
- Dependency manifest or lockfile changes stop parallel ticket execution; the agent must ask user approval before editing dependency files or running installers, then install once in a controlled workspace and refresh the shared cache keyed by lockfile hash.
- Missing dependency directories, Playwright browsers, runtime caches, or other generated setup artifacts are setup blocks until the user approves the exact install command.

Recommended workspace root:

```text
../Costume-Rent-workspaces/
```

## Consequences
- Single-checkout subagent execution eliminates branch/worktree setup overhead.
- The orchestrator subagent context isolates state, reducing shared-state collisions in the checkout.
- True parallel ticket execution is not available unless the model/provider supports concurrent requests.
- Isolated worktrees remain available as the mechanism for true parallel execution when the provider makes it viable.
- Worktree dependency reuse avoids repeated installs but does not authorize automatic dependency or browser installation.

## Supersedes
This refines ADR 0001 and ADR 0002. Their single-checkout sequential plan behavior still applies inside one checkout's orchestrator subagent execution. The parallel worktree fan-out from the original ADR 0003 is superseded by single-checkout sequential subagent dispatch, with isolated worktrees retained as a documented advanced option.
