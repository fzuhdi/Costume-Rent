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
Run from `test/` (this is required — never invoke playwright from project root):
```bash
cd test && npx playwright test --grep "AUTH-001"      # tracer test case (default workflow)
cd test && npx playwright test specs/{feature}.spec.js  # feature regression
cd test && npm run test                                 # full regression
cd test && npx playwright test --headed --slow-mo 500   # debug
cd test && npx playwright show-report                   # HTML report
```

For tracer-test case workflow, use targeted `--grep` runs during RED/GREEN. After a plan's tickets complete, run the full impacted spec files before plan completion. If impacted regression fails, run `node helpers/sync-regression-bugs.mjs --plan <plan-id>` from `test/` to create/update same-plan `review` bug tickets.

Do not run `npm install`, `npm ci`, `npx playwright install`, package-manager add/update commands, or browser/runtime installers without explicit user approval. Missing `node_modules` or Playwright browser caches are setup blocks until approved.

Default runtime stack for executable frontend tests:

```bash
docker compose -f docker-compose.dev.yml up -d backend frontend
```

Keep that stack alive for the full ticket or plan run. Prefer restarting the Compose frontend service if it becomes unhealthy. Do not treat repeated host `npx vite` restarts and ad-hoc port-kill loops as the normal workflow path.

The frontend dev service uses a named `node_modules` volume and runs `npm ci` only when that cache is missing or its recorded lockfile hash differs from `package-lock.json`. This is still an installer path: agents must ask approval before first-starting or recreating a frontend service when that install will run.

## Workspaces

Coordinator-managed executable tickets use the default single-checkout orchestrator unless advanced isolated worktrees are explicitly viable. Substantial workflow-maintenance changes use isolated Git worktrees unless the user accepts the current checkout. See `docs/adr/0003-ticket-and-workflow-workspaces.md` for the durable policy.

For advanced ticket worktrees, reuse, copy, or junction dependency directories only when the relevant lockfile hash matches. If manifests or lockfiles change, pause concurrent work, ask user approval, install once in a controlled workspace, and refresh the shared cache keyed by lockfile hash.

Advanced isolated runtime stacks require per-process runtime isolation, not only a second container. Each process must have its own worktree, Compose project name, host-port allocation, Playwright base URL, and output paths.

Example slot 1 PowerShell setup:

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

Useful commands:

```bash
git worktree list
git worktree add ../Costume-Rent-workspaces/TICKET-YYYYMMDD-001 -b tdd/TICKET-YYYYMMDD-001 tdd/PLAN-YYYYMMDD-name
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
