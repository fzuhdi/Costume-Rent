# WF-20260517-runtime-isolation-design

## Status
complete

## Intent
Define a reliable execution model for this repo across different model providers by separating workflow isolation from runtime-stack isolation. The immediate goal is to stop flaky host-level Vite restart loops. The longer-term goal is to make advanced parallel ticket execution possible without shared-port, shared-state, or shared-artifact collisions.

## Scope
- `docs/adr/0003-ticket-and-workflow-workspaces.md`
- `.opencode/README.md`
- `docs/runbooks/project-runbook.md`
- `.opencode/scripts/runtime-slot.mjs`

## Previous Constraints
- `test/playwright.config.js` hardcoded `baseURL: 'http://localhost:5173'`.
- `frontend/vite.config.js` hardcoded dev-server port `5173`.
- `docker-compose.dev.yml` hardcoded published ports for frontend `5173`, backend `8081`, and sqlite-web `8080`.
- Host-level manual Vite restarts on Windows can leave stale `node` processes holding the old port, which causes silent fallback to a new port and breaks Playwright runs that still target `5173`.

## Design

### Mode 1: Stable Single-Run Mode (Default)
- One coordinator or orchestrator run owns one checkout.
- One long-lived development stack serves that checkout for the full ticket or plan run.
- Preferred stack entry point: `docker compose -f docker-compose.dev.yml up -d backend frontend`.
- Playwright keeps using `http://localhost:5173` for this mode.
- Recovery path is service recreation, not ad-hoc host `npx vite` restarts.

Operational rules:
- Start the runtime stack once before RED or GREEN validation.
- Keep it alive until the ticket or plan step completes.
- If frontend health looks bad, use Compose service restart or stack recreation instead of starting another Vite instance on a new port.
- Do not interpret a successful Vite launch on `5174` or another fallback port as a valid test target when Playwright is still configured for `5173`.

### Mode 2: Advanced Parallel Mode (Future-Capable, Disabled By Default)
- One executable process equals one git worktree, one workflow engine, one Compose project, one host-port block, and one test-output directory.
- Each process gets a unique slot number.
- Recommended host-port formula:
  - frontend: `5173 + 100 * slot`
  - backend: `8081 + 100 * slot`
  - sqlite-web: `8080 + 100 * slot`
- Each process must export a matching Playwright base URL and isolated artifact paths.

Implemented runtime variables:
- Compose/runtime: `BUSANA_CONTAINER_PREFIX`, `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `SQLITE_WEB_HOST_PORT`, `BUSANA_DB_VOLUME`, `BUSANA_FRONTEND_NODE_MODULES_VOLUME`, `VITE_DEV_PORT`.
- Vite config: `VITE_DEV_PORT`, `PORT`, `VITE_PROXY_TARGET`.
- Playwright config: `PW_BASE_URL`, `PW_OUTPUT_DIR`, `PW_JSON_OUTPUT`, `PW_HTML_REPORT`, plus `PLAYWRIGHT_*` aliases.
- The frontend service uses a named `node_modules` volume and only runs `npm ci` when the cache is missing or its recorded lockfile hash differs from `package-lock.json`.
- Runtime slot acquisition is implemented by `.opencode/scripts/runtime-slot.mjs`; it writes ignored runtime registry state to `.opencode/state/runtime-slots.json`.

Process isolation contract:
- No two workflow engines may share a checkout.
- No two processes may share `.opencode/state/`.
- No two processes may share `test-results/`.
- Dependency directories may be reused only when the relevant lockfile hash matches and the dependency/install approval policy is satisfied.
- Unknown port owners are never killed automatically. The launcher can reuse healthy registered slots and can clean known stale registered Compose projects only when explicitly invoked with `--cleanup-known-stale` or `cleanup --yes`.

## Source Of Truth
- Workspace and execution policy: `docs/adr/0003-ticket-and-workflow-workspaces.md`
- User-facing workflow summary: `.opencode/README.md`
- Operational commands: `docs/runbooks/project-runbook.md`

## Validation Plan
- Review workflow docs for a single runtime-isolation story.
- Confirm the ADR names default stable mode and advanced parallel prerequisites explicitly.
- Grep for stale guidance that treats repeated host-level Vite restarts as the normal workflow path.

## Rollback Plan
- Revert this workflow-documentation change set if the team chooses a different runtime-isolation strategy.

## Restart Requirement
no - documentation-only workflow update

## Review Notes
- This change defines the current default as one long-lived Compose dev stack per active checkout.
- Runtime configuration is now parameterized, and the slot launcher allocates non-overlapping runtime slots for process-specific stacks.
- Dependency installation remains approval-gated and is not implied by runtime-stack isolation.
