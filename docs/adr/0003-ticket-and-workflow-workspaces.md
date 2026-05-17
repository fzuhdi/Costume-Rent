# ADR 0003: Ticket And Workflow Workspaces

## Status
Accepted (updated 2026-05-17)

## Context
The workflow coordinates executable tickets and workflow-maintenance changes. Running multiple workflow engines in one checkout shares branches, runtime state, test output, and uncommitted files, which creates conflicts and makes recovery ambiguous. However, the model provider serializes requests and cannot run true parallel execution, so the overhead of isolated worktrees for every ticket outweighs the benefit.

Workflow-platform changes should not be made casually in the coordinator checkout when they are substantial.

## Decision

### Single-Checkout Sequential Orchestrator TUI Launch (Default)
For normal operation, the coordinator launches one orchestrator TUI per target plan or ticket via `opencode run --interactive --command engineering/orchestrator`. The launched orchestrator session runs in the same checkout but in its own OpenCode CLI session, managing its own state files, checkpoint commits, subagent dispatches, and plan completion.

- The coordinator checkout is for scheduling, discovery, and aggregate reporting.
- The launched orchestrator session is the single workflow engine for one plan or ticket run.
- Only one orchestrator TUI window runs at a time per checkout (sequential execution).
- Ticket branches and plan branches are created in the coordinator checkout.
- Plan-completion regression runs from the plan branch after all tickets complete.
- Successful launched sessions delete their own OpenCode session by title after the TUI exits; partial or blocked runs keep the session for debugging.
- Coordinator executable launches dynamically discover available models, ask the user to choose one, and recommend the orchestrator default from `.opencode/workflow-models.json`.

### Stable Runtime Stack (Default Runtime Mode)
The default runtime for executable work is one long-lived development stack for the active checkout, not repeated host-level Vite restarts between RED and GREEN loops.

- Start the frontend and backend once for the active checkout and keep them running for the ticket or plan run.
- Prefer `docker compose -f docker-compose.dev.yml up -d backend frontend` as the stable runtime entry point.
- Keep the frontend on host `5173`, backend API on host `8081`, and sqlite-web on host `8080` in this default mode.
- Treat ad-hoc host `node`, `npx vite`, or port-kill loops as a debugging fallback, not the normal workflow path.
- If the frontend becomes unhealthy, recreate the Compose frontend service or the whole dev stack instead of spawning another Vite process on a different port.
- Playwright should target one known-good base URL for the full run; the current repo default remains `http://localhost:5173`.

### Isolated Worktrees (Advanced, For True Parallel Execution)
Isolated Git worktrees remain an option for advanced use cases where the model/provider supports true parallel child OpenCode sessions.

- Plan integration branches start from the recorded base branch.
- Ticket branches start from the plan integration branch when the ticket has `plan_id`.
- Standalone ticket branches may start from the recorded base branch.
- Substantial workflow changes get a dedicated workspace and `workflow/{change-id}` branch.
- Ticket branches merge back into the plan branch sequentially.
- Each executed ticket gets a dedicated workspace and branch.
- Worker agents must run from the active item workspace root.
- The coordinator must not run multiple workflow engines in the same checkout concurrently (this rule applies to the single-checkout TUI-launch approach).
- The coordinator must not dispatch worker subagents from one project root with absolute paths into another worktree.
- Dependency directories may be reused, copied, or junctioned into ticket worktrees only when they match the relevant lockfile hash.
- Dependency manifest or lockfile changes stop parallel ticket execution; the agent must ask user approval before editing dependency files or running installers, then install once in a controlled workspace and refresh the shared cache keyed by lockfile hash.
- Missing dependency directories, Playwright browsers, runtime caches, or other generated setup artifacts are setup blocks until the user approves the exact install command.

### Runtime Isolation Contract For Advanced Mode
Advanced isolated worktrees require a process slot that provides runtime variables for the worktree. The repo keeps stable single-run defaults while allowing isolated processes to override their runtime values.

- One executable process equals one git worktree, one workflow engine, one Compose project name, one host-port allocation, and one test-artifact directory.
- Each process must publish unique host ports for frontend, backend, and sqlite-web. Recommended slot formula: frontend `5173 + 100 * slot`, backend `8081 + 100 * slot`, sqlite-web `8080 + 100 * slot`.
- Each process must set its own Playwright base URL to the frontend host port for that slot through `PW_BASE_URL` or `PLAYWRIGHT_BASE_URL`.
- Each process must write JSON results, HTML reports, screenshots, videos, and traces into process-scoped paths through `PW_OUTPUT_DIR`, `PW_JSON_OUTPUT`, and `PW_HTML_REPORT` or their `PLAYWRIGHT_*` aliases.
- Each process must keep runtime state inside its own worktree; no two workflow engines may share `.opencode/state/` or `test-results/`.
- Each Compose stack must set a unique project name plus `BUSANA_CONTAINER_PREFIX`, `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `SQLITE_WEB_HOST_PORT`, `BUSANA_DB_VOLUME`, and `BUSANA_FRONTEND_NODE_MODULES_VOLUME`.
- Empty or stale frontend dependency volumes cause the Compose frontend service to run `npm ci`; this remains subject to explicit dependency/install approval before the service is started or recreated.
- The Vite dev server accepts `VITE_DEV_PORT`, `PORT`, and `VITE_PROXY_TARGET`; the default remains compatible with the Compose service network.
- Runtime slot acquisition should use `node .opencode/scripts/runtime-slot.mjs acquire --target <id>`. The launcher records slots in ignored `.opencode/state/runtime-slots.json`, reuses a healthy registered stack, can recreate only a known stale registered Compose project when explicitly requested, and never kills unknown port owners.

Recommended workspace root:

```text
../Costume-Rent-workspaces/
```

## Consequences
- Single-checkout TUI launching eliminates branch/worktree setup overhead.
- The launched orchestrator CLI session isolates state, reducing shared-state collisions in the checkout.
- A stable long-lived Compose dev stack is the reliable default for test execution on this repo, especially on Windows hosts.
- True parallel ticket execution is not available unless the model/provider supports concurrent requests.
- Isolated worktrees remain available as the mechanism for true parallel execution when the provider makes it viable.
- Parallel runtime stacks are available only when the coordinator assigns non-overlapping slots and launches each process from its own worktree root.
- Worktree dependency reuse avoids repeated installs but does not authorize automatic dependency or browser installation.

## Supersedes
This refines ADR 0001 and ADR 0002. Their single-checkout sequential plan behavior still applies inside one checkout's launched orchestrator session. The parallel worktree fan-out from the original ADR 0003 is superseded by single-checkout sequential orchestrator TUI launching, with isolated worktrees retained as a documented advanced option.
