---
name: costume-rental-runbook
description: Operational guide for the Costume Rental project (React + Go + SQLite + Docker)
---

# Costume Rental — Runbook

## Quick Start
```bash
# Start application
docker compose up --build -d

# Full rebuild (when issues occur)
docker compose down -v && docker compose build --no-cache && docker compose up -d
```

## Default Credentials
- Email: `admin@busana.com`
- Password: `admin123`

---

## Common Issues & Fixes

### 1. Backend build fails — SQLite errors
**Error:** `pread64 undeclared`, `off64_t` not found
**Cause:** `mattn/go-sqlite3` requires CGO on Alpine.
**Fix:** Use `glebarez/sqlite` (pure Go) and build with `CGO_ENABLED=0`.
```go
// go.mod
github.com/glebarez/sqlite v1.10.0

// backend/config/database.go
import "github.com/glebarez/sqlite"
```
```dockerfile
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go
```

### 2. Frontend hook import errors
**Error:** `useAuth is not exported`, `useNotification is not exported`
**Fix:** Add hook exports in context files.
```jsx
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 3. Infinite page reload
**Cause:** Notification API called without auth token.
**Fix:**
1. Backend — put `/api/notifications` inside the auth-protected route group.
2. Frontend — only fetch when `isAuthenticated === true`.
```jsx
const fetchNotifications = useCallback(async () => {
  if (!isAuthenticated) return;
  // ...
}, [isAuthenticated]);
```

### 4. Database "out of memory" on startup
**Fix:** Mount the volume to the directory, not the file path.
```yaml
# Wrong
- busana_db:/app/busana_tari.db
# Correct
- busana_db:/app
```

### 5. Docker not picking up changes
**Fix:** `docker compose build --no-cache`

> For a deeper catalogue of recurring bugs, see `.opencode/knowledge/common-bugs.md`.

---

## API Surface

### Public (no auth)
- `GET  /api/settings`
- `GET  /api/costumes`
- `POST /api/auth/login`
- `POST /api/auth/register`

### Protected (JWT required)
- `GET  /api/notifications`
- `GET|POST /api/rents`
- `GET|POST /api/clients`
- `PUT  /api/settings`
- `*    /api/users/*`

---

## Testing
Run Playwright from `test/`:
```bash
cd test && npx playwright test --grep "AUTH-001"      # tracer test case (default workflow)
cd test && npx playwright test specs/{feature}.spec.js  # feature regression
cd test && npm run test                                 # full regression
cd test && npx playwright test --headed --slow-mo 500   # debug
cd test && npx playwright show-report                   # HTML report
```

Tracer-test, impacted-regression, dependency/install, and setup-block rules are owned by `.opencode/skills/orchestrator/SKILL.md` and `.opencode/skills/shared/constraints.md`.

Default runtime stack for executable frontend tests:

```bash
docker compose -f docker-compose.dev.yml up -d backend frontend
```

Keep that stack alive for the full ticket or plan run. Prefer restarting the Compose frontend service if it becomes unhealthy. Do not treat repeated host `npx vite` restarts and ad-hoc port-kill loops as the normal workflow path.

Installer approval and dependency-cache reuse rules are owned by `.opencode/skills/shared/constraints.md`.

## Workflow Runner

Check durable workflow state before execution:

```bash
node .opencode/scripts/workflow-runner.mjs --reconcile --json
```

Preview a target and see reconciliation warnings, current phase, and next step:

```bash
node .opencode/scripts/workflow-runner.mjs --target TICKET-YYYYMMDD-001 --json
```

Emit the next worker task without invoking a subagent:

```bash
node .opencode/scripts/workflow-runner.mjs --target TICKET-YYYYMMDD-001 --next-task --json
```

After dispatching the returned worker task, save its final message under `.opencode/state/worker-outputs/` in the active worktree and ingest it:

```bash
node .opencode/scripts/workflow-runner.mjs --target TICKET-YYYYMMDD-001 --ingest-worker-output .opencode/state/worker-outputs/TICKET-YYYYMMDD-001-sdet-red.txt --json
```

## Model Resolution

Check whether configured agent models are available and get recommendations. The coordinator uses this as a cheap availability check and only loads `model-selector` when a configured model is unavailable, the user asks, or a model-related dispatch failure occurred:

```bash
node .opencode/scripts/resolve-agent-models.mjs --dry-run --json
```

Resolve and apply recommended models (updates `.opencode/agents/*.md`):

```bash
node .opencode/scripts/resolve-agent-models.mjs --write --json
```

Resolve for specific roles only:

```bash
node .opencode/scripts/resolve-agent-models.mjs --write --roles sdet,developer
```

Apply explicit user-selected models, even when the currently configured model is available:

```bash
node .opencode/scripts/resolve-agent-models.mjs --write --json --set sdet=openai/gpt-5.3-codex --set developer=openai/gpt-5.3-codex
```

Model capability categories are defined in `.opencode/model-capabilities.md`. Role preferences live in `.opencode/workflow-models.json`. After writing agent models, restart OpenCode.

## Workspaces

Coordinator-managed plan execution uses max-3 isolated tracer-ticket worktrees by default. The prepare/handoff script fills those slots only with independent ready tickets; ready tickets with unmet `depends_on` prerequisites are reported and wait for a later batch. The coordinator then dispatches one orchestrator task per prepared worktree. Single-ticket targets dispatch one orchestrator task for one worktree/checkout. Substantial workflow-maintenance changes use isolated Git worktrees unless the user accepts the current checkout. See `docs/adr/0003-ticket-and-workflow-workspaces.md` for workspace policy and `.opencode/skills/shared/constraints.md` for dependency-cache rules.

Parallel runtime stacks require per-process runtime isolation, not only extra containers. Each process must have its own worktree, Compose project name, host-port allocation, Playwright base URL, and output paths.

Prepare the next parallel batch for a plan from the coordinator checkout, then dispatch returned `dispatch.task` handoffs:

```bash
node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-YYYYMMDD-name --parallel 3 --json
```

Preview without creating worktrees, reserving slots, or starting Docker:

```bash
node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-YYYYMMDD-name --parallel 3 --dry-run --json
```

Acquire a slot from the worktree root:

```bash
node .opencode/scripts/runtime-slot.mjs acquire --target TICKET-YYYYMMDD-001
```

The runtime-slot helper uses the `+100` formula: slot 1 is frontend `5273`, backend `8181`, sqlite-web `8180`. It records slots in `.opencode/state/runtime-slots.json`, reuses a healthy registered stack, skips unknown port owners, and only recreates a known stale registered Compose project when run with `--cleanup-known-stale`.

Example slot 1 PowerShell environment emitted by the prepare/handoff helper:

```powershell
$env:BUSANA_CONTAINER_PREFIX = "busana_ticket001"
$env:FRONTEND_HOST_PORT = "5273"
$env:BACKEND_HOST_PORT = "8181"
$env:SQLITE_WEB_HOST_PORT = "8180"
$env:BUSANA_DB_VOLUME = "busana_db_ticket001"
$env:BUSANA_FRONTEND_NODE_MODULES_VOLUME = "busana_frontend_node_modules_ticket001"
$env:PW_BASE_URL = "http://localhost:5273"
$env:PW_OUTPUT_DIR = "test-results-ticket001"
$env:PW_JSON_OUTPUT = "test-results-ticket001/results.json"
$env:PW_HTML_REPORT = "playwright-report-ticket001"
docker compose -p ticket001 -f docker-compose.dev.yml up -d backend frontend
```

Run Playwright from that same shell so it inherits the process-specific `PW_*` variables.

Completed parallel ticket branches require explicit serialized integration into the plan branch before plan regression. Do not assume a prepared or completed ticket worktree has already merged itself into the plan branch.

Manual worktree commands:

```bash
git worktree list
git worktree add ../Costume-Rent-workspaces/PLAN-YYYYMMDD-name/TICKET-YYYYMMDD-001 -b tdd/TICKET-YYYYMMDD-001 tdd/PLAN-YYYYMMDD-name
git worktree add ../Costume-Rent-workspaces/WF-YYYYMMDD-name -b workflow/WF-YYYYMMDD-name main
```

---

## Project Layout
```
Costume-Rent/
├── backend/                 # Go API (Gin)
├── frontend/                # React 19 + Vite + HeroUI v3
├── docker-compose.yml
├── test/                    # Playwright tests
└── .opencode/
    ├── agents/              # Subagent definitions (developer, sdet, reviewer)
    ├── commands/            # Slash commands
    ├── skills/              # Orchestrator skill + shared docs
    ├── knowledge/           # This runbook + common-bugs + project-notes
    ├── state/               # Runtime state (progress, bug reports, checkpoints)
    └── logs/                # Daily activity logs
```
