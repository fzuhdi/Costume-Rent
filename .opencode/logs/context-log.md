# OpenCode Session Context Log

## Last Updated: 2026-04-28

## Recent Key Actions (Last 2 Hours)
- Created `backup-phase-1` branch with commits up to `1aae54e`
- Pushed 7 commits to `main`:
  - Backend: costume DTO, model updates (9256caf)
  - Frontend: React 19, HeroUI v3, Tailwind v4 migration (22fd80f, 2c91151)
  - OpenCode: config update, engineer skill update (f820471)
  - Test: Playwright e2e tests infrastructure (9e5f5e1)
  - Docs: HeroUI migration guides (4a039f9)
  - Chore: dev scripts, gitignore fixes (d3e14a6, 2dbeef1)

## Current Project State
- **Stack**: Go (Fiber), SQLite, React 19, HeroUI v3, Tailwind v4
- **Agents**: engineer, sdet, orchestrator in `.opencode/skills/`
- **Knowledge**: Project docs in `.opencode/knowledge/`
- **Tests**: Playwright in `test/` (e2e/ and api/ subfolders)
- **Bugs**: Reports in `.opencode/state/bug-reports/`

## Key Decisions
- HeroUI v3 migration complete (compound components pattern)
- Test structure: e2e/ and api/ subdirectories
- Runtime state persisted in `.opencode/state/`
- Backup branch preserves pre-HeroUI commits
- Refactored `.opencode/` to industry standard structure

## Structure Refactor (2026-04-28)
- Moved `docs/dev/` → `.opencode/knowledge/`
- Extracted MCP config → `.opencode/plugins/mcp.json`
- Created `commands/`, `logs/`, `state/todos/` directories
- Updated all path references in agents and AGENTS.md
