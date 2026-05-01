# OpenCode Session Context Log

## Last Updated: 2026-05-01

## TODO List (Update after each step - for crash recovery)
- [x] Step 1: Clean up playwright-bdd
- [x] Step 2: Create test/specs/ directory
- [x] Step 3: Create BDD-named test files
- [x] Step 4: Update playwright.config.js
- [x] Step 5: Update package.json
- [x] Step 6: Update AGENTS.md + context-log.md
**COMPLETE - All steps finished**

## Recent Key Actions (Today)
- **Reverted from playwright-bdd** to standard Playwright tests
- **Refactored test structure**: `test/specs/` with BDD naming `[AC-XXX] - Description`
- **Preserved Page Object Model**: `test/pages/` unchanged
- **Configured reporting**: HTML + JSON reporters
- **Enabled screenshot capture**: `screenshot: 'on'` (last screenshot before test ends)

## Current Project State
- **Stack**: Go (Fiber), SQLite, React 19, HeroUI v3, Tailwind v4
- **Agents**: engineer, sdet, orchestrator in `.opencode/skills/`
- **Knowledge**: Project docs in `.opencode/knowledge/`
- **Tests**: Playwright in `test/specs/` (BDD naming + Page Objects)
- **Bugs**: Reports in `.opencode/state/bug-reports/`

## Key Decisions
- **BDD naming**: `[AC-XXX] - Description` format for test cases
- **Page Object Model**: All UI interactions through Page classes
- **Screenshot capture**: 1 screenshot per test, stored in `test-results/`
- **No playwright-bdd**: Standard Playwright for simplicity
- **TODO tracking**: Update context-log.md after each step for crash recovery

## Structure Refactor (2026-05-01)
- Removed `playwright-bdd` dependency
- Deleted `test/features/`, `test/steps/`, `test/fixtures.js`
- Created `test/specs/` with BDD-style test naming
- Updated `playwright.config.js` with reporters + screenshot config
- Updated `package.json` scripts
