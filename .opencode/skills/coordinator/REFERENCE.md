# Coordinator Reference

## Execution Model

Use the coordinator checkout for scheduling only. Executable tickets and substantial workflow-maintenance changes run in isolated workspaces per `docs/adr/0003-ticket-and-workflow-workspaces.md`.

```text
route arguments
-> targeted read or explicit status scan
-> build queue
-> provision or reuse isolated workspace(s)
-> launch lower-level workflow command(s) from each workspace root
-> wait for complete, blocked, or escalated state
-> continue only if coordinator checkout, item workspace, and runtime state are clean
-> summarize aggregate status
```

Parallel execution is unsafe in one checkout because branches, runtime state, test output, and uncommitted files are shared. Parallel execution is the default for explicit plan targets only when every ready executable ticket has its own checkout, branch, state files, and test output path. The coordinator launches at most 3 ticket orchestrators at a time.

## Workspace Model

Recommended root:

```text
../Costume-Rent-workspaces/
```

Product ticket workspace:

```text
../Costume-Rent-workspaces/TICKET-YYYYMMDD-001
```

Workflow-change workspace:

```text
../Costume-Rent-workspaces/WF-YYYYMMDD-short-name
```

Ticket branches start from the plan branch when `plan_id` exists. Workflow-change branches use `workflow/{change-id}` from the recorded base branch.

Each item workspace must be treated as its own OpenCode project root for worker execution. The coordinator must not call `developer`, `sdet`, `reviewer`, or `explore` from the coordinator checkout with paths that point into an external worktree. If a child OpenCode session cannot be launched from the item workspace root, the coordinator prints the exact command and stops.

## Argument Routing

Route before discovery:

1. Empty args: ask the user for a plan/ticket target or explicit status scan. Do not scan plans/tickets first.
2. `PLAN-YYYYMMDD-*`: targeted plan mode. Read `docs/plans/{plan-id}.md`, then only tickets whose frontmatter `plan_id` equals the target.
3. `TICKET-YYYYMMDD-NNN`: targeted ticket mode. Read `docs/tickets/{ticket-id}.md` and the matching manifest entry.
4. Unknown or malformed args: ask one clarification question. Do not broad-scan to guess.

Targeted mode may read runtime state files to detect active or blocked runs, but it must not scan all plans/tickets unless the user chose a status scan.

## Discovery Procedure

1. Check `git status --short --branch`.
2. If the worktree is dirty, stop before queueing executable work and report the dirty paths.
3. Read runtime state files if present.
4. For empty args, ask for a target or explicit status scan before any broad plan/ticket discovery.
5. For explicit targets, read only the target plan/ticket and directly related tickets/manifest entries.
6. For explicit status scans, read recent `.opencode/logs/*.md`, scan `docs/plans/*.md` and `docs/tickets/*.md`, group tickets by `plan_id` and status, and identify blocked/ready/in-progress work.

## Queue Rules

Prefer coordinator-managed plan fan-out when multiple ready executable tickets belong to the same explicit plan. Use sequential `/engineering/orchestrator PLAN-...` only when the user explicitly asks for sequential plan mode.

Queue order:

1. Resume an existing `in_progress` plan or ticket recorded in runtime state.
2. Plans with `status: in_progress` and ready/review tickets.
3. Plans with `status: ready` and ready/review tickets.
4. Individual ready tickets only when they are not part of a better plan-level run.
5. Workflow-maintenance changes requested by the user.
6. Blocked or ambiguous items are report-only unless the user asks to repair planning artifacts.

Within one explicit plan, fan out independently executable `ready` feature/bug tickets by dependency class, priority, then id. Independent tickets always run before dependency-bearing tickets. `review` tickets are not parallelized; audit or repair them first. Integration back into the plan branch is sequential.

Dependency classification:

1. Independent: no explicit dependency metadata and no prerequisite text beyond `none` or `No prerequisite ticket dependency remains`.
2. Dependency-bearing: frontmatter or body declares `depends_on`, `dependencies`, `blocked_by`, `requires`, or prerequisite text naming another ticket or unresolved prerequisite.
3. Ambiguous dependency: dependency wording exists but does not name concrete prerequisite tickets. Treat as last priority and report the ambiguity.

Scheduling order:

1. Ready independent feature/bug tickets sorted by `priority`, then ticket id.
2. Ready dependency-bearing feature/bug tickets whose concrete prerequisites are already `complete`, sorted by `priority`, then ticket id.
3. Ambiguous dependency tickets only after all independent tickets are complete or no independent tickets remain.

Do not schedule a dependent ticket in the same parallel batch as its prerequisite. Recompute dependency eligibility after each batch completes.

## Parallel Plan Fan-Out

For `/coordinator PLAN-...`:

1. Require clean coordinator checkout.
2. Read only the target plan and matching tickets.
3. If any ticket is `review`, run reviewer audit first or stop with the audit commands.
4. Create or reuse the plan integration branch/workspace.
5. Create or reuse one item workspace per eligible `ready` feature/bug ticket.
6. Launch up to 3 child OpenCode sessions, one per clean item workspace, with `/engineering/orchestrator TICKET-ID`.
7. Wait for all ticket runs to reach `ticket-complete`, `blocked`, or `escalated`.
8. Stop the whole plan if any ticket blocks/escalates or leaves dirty work.
9. Recompute eligible tickets and launch the next max-3 batch until no eligible tickets remain.
10. Merge completed ticket branches back into the plan integration branch sequentially.
11. Run impacted-spec regression and plan completion from the plan integration workspace.

## Launch Rules

Before launching any lower-level run:

- Require a clean worktree.
- Confirm no runtime state indicates a different active run.
- Confirm the target plan or ticket still exists.
- Confirm or create the target workspace before execution.
- Confirm child execution starts from the item workspace root, not the coordinator checkout.
- Prefer the existing command format already used by the repository.

## Stop Conditions

Stop immediately and report if any of these occur:

- Dirty worktree before or after a lower-level run.
- Missing, reused-for-wrong-item, or dirty item workspace.
- Branch mismatch or unexpected branch switch.
- Runtime state points to a different active plan/ticket.
- Child OpenCode sessions cannot be launched from item workspace roots.
- A lower-level run returns `blocked` or `escalated`.
- Review rejects a generated regression bug as setup/test noise.
- Impacted regression reports unmapped/setup failures.
- The user asks to pause, inspect, commit, push, or change strategy.

## Relationship To Other Workflow Rules

The coordinator is above the existing workflow engine but below the user. It schedules work; it does not redefine the ticket lifecycle.

Lower-level rules remain binding, including:

- one executable acceptance test case per ticket
- validation before implementation
- developer does not edit SDET-owned acceptance tests
- reviewer rejection is binding
- acceptance integrity gate must pass
- plan-completion impacted regression must pass before completion or PR
