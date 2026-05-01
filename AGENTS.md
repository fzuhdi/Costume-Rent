# AGENTS.md — Costume Rental

## Session Start Instruction
**CRITICAL: At the start of EVERY session, read `.opencode/logs/context-log.md` FIRST**
- Check "TODO List" section for incomplete steps (crash recovery)
- Check "Last Updated" date to verify recency
- Check "Recent Key Actions" for context

```bash
# Run this at session start:
cat .opencode/logs/context-log.md
```

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

## Context Recovery
If session crashes or laptop dies:
1. Read `.opencode/logs/context-log.md`
2. Check "TODO List" - see what step was in progress
3. Continue from where it left off
4. Update TODO list after each step completion

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