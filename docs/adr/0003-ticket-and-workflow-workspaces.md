# ADR 0003: Ticket And Workflow Workspaces

## Status
Accepted (updated 2026-05-24)

## Context
The workflow coordinates executable tickets and workflow-maintenance changes. Running multiple workflow engines in one checkout shares branches, runtime state, test output, and uncommitted files, which creates conflicts and makes recovery ambiguous. The intended plan flow is parallel tracer-bullet execution using three isolated Docker Compose runtime slots, so the workflow must isolate each ticket by worktree, branch, runtime state, ports, and Playwright output.

Workflow-platform changes should not be made casually in the coordinator checkout when they are substantial.

## Decision

### Max-3 Parallel Plan Launch (Default Plan Mode)
For normal plan operation, the coordinator launches up to three independent ready executable tracer tickets in parallel. Each ticket gets its own git worktree, TDD branch, runtime slot, Compose project, Playwright base URL, artifact paths, and `.opencode/state/`. The parent checkout schedules and observes only; each launched ticket orchestrator owns that ticket's RED/GREEN/review loop.

- The coordinator checkout is for scheduling, discovery, slot assignment, worktree creation, and aggregate reporting.
- Plan launch uses `node .opencode/scripts/launch-parallel-plan.mjs --target <plan-id> --parallel 3`.
- The launcher selects up to three independent `status: ready` executable tickets by priority/id order.
- Tickets may declare same-plan prerequisites in frontmatter as `depends_on: [TICKET-YYYYMMDD-NNN]`. Missing `depends_on` is treated as empty for legacy tickets.
- A ready ticket with unmet `depends_on` is excluded from the current parallel batch and reported with the prerequisite ids. If no independent ready tickets remain, plan launch blocks instead of launching dependent work early.
- Malformed `depends_on` ids or references to tickets outside the plan block launch because dependency order cannot be proven.
- Review tickets block parallel executable launch until they are audited.
- Ticket branches start from the plan integration branch `tdd/{plan-id}` and use `tdd/{ticket-id}`.
- Ticket branches merge back into the plan branch sequentially after ticket completion.
- Plan-completion regression runs from the plan branch after completed ticket branches are integrated.
- Successful launched ticket sessions delete their own OpenCode session by title after the TUI exits; partial or blocked runs keep the session for debugging.
- Coordinator executable launches use the orchestrator default from `.opencode/workflow-models.json`; they ask for a model only when the user requests an override or no configured default is available.

### Single-Ticket Launch (Default Ticket Mode)
For standalone ticket operation, the coordinator launches one orchestrator TUI for the target ticket via `opencode run --command engineering/orchestrator`. This uses the active checkout or the ticket worktree selected by the parallel plan launcher.

- Do not launch multiple orchestrators in the same checkout.
- Do not dispatch worker subagents across worktree roots.
- A ticket orchestrator manages only its own worktree state, commits, worker handoffs, and targeted verification.

### Stable Runtime Stack (Default Ticket Runtime Mode)
The default runtime for one ticket worktree is one long-lived development stack, not repeated host-level Vite restarts between RED and GREEN loops.

- Start the frontend and backend once for the active checkout and keep them running for the ticket or plan run.
- Prefer `docker compose -f docker-compose.dev.yml up -d backend frontend` as the stable runtime entry point.
- In the coordinator checkout's single-ticket mode, keep the frontend on host `5173`, backend API on host `8081`, and sqlite-web on host `8080`.
- Treat ad-hoc host `node`, `npx vite`, or port-kill loops as a debugging fallback, not the normal workflow path.
- If the frontend becomes unhealthy, recreate the Compose frontend service or the whole dev stack instead of spawning another Vite process on a different port.
- Playwright should target one known-good base URL for the full run; the current repo default remains `http://localhost:5173`.

### Isolated Worktrees And Runtime Slots
Isolated Git worktrees are mandatory for parallel plan execution.

- Plan integration branches start from the recorded base branch.
- Ticket branches start from the plan integration branch when the ticket has `plan_id`.
- Standalone ticket branches may start from the recorded base branch.
- Substantial workflow changes get a dedicated workspace and `workflow/{change-id}` branch.
- Ticket branches merge back into the plan branch sequentially.
- Each executed ticket gets a dedicated workspace and branch.
- Worker agents must run from the active item workspace root.
- The coordinator must not run multiple workflow engines in the same checkout concurrently.
- The coordinator must not dispatch worker subagents from one project root with absolute paths into another worktree.
- Dependency directories may be reused, copied, or junctioned into ticket worktrees only when they match the relevant lockfile hash.
- Dependency manifest or lockfile changes stop parallel ticket execution; the agent must ask user approval before editing dependency files or running installers, then install once in a controlled workspace and refresh the shared cache keyed by lockfile hash.
- Missing dependency directories, Playwright browsers, runtime caches, or other generated setup artifacts are setup blocks until the user approves the exact install command.

### Runtime Isolation Contract
Each parallel ticket process requires a runtime slot that provides runtime variables for the worktree. The repo keeps stable single-ticket defaults while allowing isolated processes to override their runtime values.

- One executable process equals one git worktree, one workflow engine, one Compose project name, one host-port allocation, and one test-artifact directory.
- Each process must publish unique host ports for frontend, backend, and sqlite-web. Recommended slot formula: frontend `5173 + 100 * slot`, backend `8081 + 100 * slot`, sqlite-web `8080 + 100 * slot`.
- Each process must set its own Playwright base URL to the frontend host port for that slot through `PW_BASE_URL` or `PLAYWRIGHT_BASE_URL`.
- Each process must write JSON results, HTML reports, screenshots, videos, and traces into process-scoped paths through `PW_OUTPUT_DIR`, `PW_JSON_OUTPUT`, and `PW_HTML_REPORT` or their `PLAYWRIGHT_*` aliases.
- Each process must keep runtime state inside its own worktree; no two workflow engines may share `.opencode/state/` or `test-results/`.
- Each Compose stack must set a unique project name plus `BUSANA_CONTAINER_PREFIX`, `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `SQLITE_WEB_HOST_PORT`, `BUSANA_DB_VOLUME`, and `BUSANA_FRONTEND_NODE_MODULES_VOLUME`.
- Empty or stale frontend dependency volumes cause the Compose frontend service to run `npm ci`; this remains subject to explicit dependency/install approval before the service is started or recreated.
- The Vite dev server accepts `VITE_DEV_PORT`, `PORT`, and `VITE_PROXY_TARGET`; the default remains compatible with the Compose service network.
- Runtime slot acquisition should use `node .opencode/scripts/runtime-slot.mjs acquire --target <id> --slot <1|2|3>`. The launcher records slots in ignored `.opencode/state/runtime-slots.json`, reuses a healthy registered stack, can recreate only a known stale registered Compose project when explicitly requested, and never kills unknown port owners.

Recommended workspace root:

```text
../Costume-Rent-workspaces/
```

## Consequences
- Plan execution can run up to three tracer tickets at once without shared branches, state files, ports, or Playwright artifacts.
- Parallel launch has higher setup cost than serial execution, but that cost is paid once per batch and is necessary for safe concurrency.
- Ticket branches must be integrated back into the plan branch sequentially; merge conflicts and plan regression remain serialized.
- Parallel runtime stacks are available only when the coordinator assigns non-overlapping slots and launches each process from its own worktree root.
- Worktree dependency reuse avoids repeated installs but does not authorize arbitrary dependency or browser installation.

## Supersedes
This refines ADR 0001 and ADR 0002. Their strict TDD ticket FSM still applies inside each launched ticket worktree. The prior single-checkout sequential plan default is superseded by max-3 isolated parallel tracer-ticket launch.
