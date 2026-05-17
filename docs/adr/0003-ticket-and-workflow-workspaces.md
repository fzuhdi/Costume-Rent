# ADR 0003: Ticket And Workflow Workspaces

## Status
Accepted

## Context
The workflow now needs to coordinate multiple executable tickets and workflow-maintenance changes. Running multiple workflow engines in one checkout shares branches, runtime state, test output, and uncommitted files, which creates conflicts and makes recovery ambiguous.

Workflow-platform changes can also break OpenCode startup or command routing, so they should not be made casually in the coordinator checkout when they are substantial.

## Decision
The coordinator checkout is for scheduling, discovery, and aggregate reporting. Executable ticket work and substantial workflow-maintenance work use isolated Git worktrees.

- Plan branches start from the recorded base branch, usually `main`.
- Ticket branches start from the plan integration branch when the ticket has `plan_id`.
- Standalone ticket branches may start from the recorded base branch.
- Each executed ticket gets a dedicated workspace and branch.
- Substantial workflow changes get a dedicated workspace and `workflow/{change-id}` branch.
- Ticket branches merge back into the plan branch sequentially.
- Plan-completion regression runs from the integrated plan branch after ticket branches are merged.
- The coordinator must not run multiple workflow engines in the same checkout concurrently.

Recommended workspace root:

```text
../Costume-Rent-workspaces/
```

Recommended ticket workspace:

```text
../Costume-Rent-workspaces/TICKET-YYYYMMDD-001
```

Recommended workflow-change workspace:

```text
../Costume-Rent-workspaces/WF-YYYYMMDD-short-name
```

## Consequences
This adds branch/worktree setup overhead but prevents shared-state collisions and makes recovery clearer.

Parallel ticket execution is possible only when each active ticket has its own workspace. Integration back to the plan branch remains sequential so merge conflicts and impacted regression failures are handled deterministically.

## Supersedes
This refines ADR 0001 and ADR 0002. Their single-checkout sequential plan behavior still applies inside one workspace, but coordinator-managed multi-ticket execution now requires isolated ticket workspaces.
