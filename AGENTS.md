# AGENTS.md — Costume Rental

## Stack
- Backend: Go (Fiber), SQLite (CGO required — set CGO_ENABLED=1)
- Frontend: React + Vite
- Tests: Playwright (JS), shell scripts for API tests
- Orchestration: OpenCode with Engineer / SDET / Orchestrator skills

## Agent Skills
Skills live in `.opencode/skills/`. Load them by name:
- `/orchestrator [feature-id]` — runs full feature dev loop
- `/engineer` — fixes bugs in application code only
- `/sdet` — writes and runs tests, files bug reports

For stack details, credentials, and known fixes:
read `.opencode/knowledge/runbook.md` and `.opencode/knowledge/project-notes.md`

## Running Tests
```bash
cd test && npx playwright test          # all e2e tests
cd test && npx playwright test e2e/auth # single suite
cd test && bash api/api-test.sh         # API smoke tests
```

## Known Issues
- SQLite requires CGO: always build with `CGO_ENABLED=1 go build`
- Auth hook: use the pattern in `frontend/src/context/AuthContext.jsx`
- Bug `costume not found: 0` on /rents/new — see `.opencode/state/bug-reports/`

## State Files
`.opencode/state/orchestrator-progress.json` — current feature and iteration
`.opencode/state/bug-reports/` — one JSON file per open bug