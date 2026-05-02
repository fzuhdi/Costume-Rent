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
- **Feature naming**: "Costume Management" = `catalogue` (AC-003–008)
- **Test ID format**: `[AC-003-001]`, `[AC-003-002]`, etc. (unique per test case)

## Key Decisions
- **BDD naming**: `[AC-XXX-YYY] - Description` format for test cases (YYY = 001, 002, etc. for unique IDs)
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

## Bug Report File Format (2026-05-01)
- **Pattern**: `BUG-UNKNOWN-AC{###}-{YYY}-{HASH}.json`
  - Status is NOT in filename (all show "UNKNOWN" as feature currently)
  - YYY = test unique ID (001, 002, etc.)
  - HASH = 6-char hexadecimal
- **Checking bug reports**: Use `bash ls .opencode/state/bug-reports/` or `bash grep` commands
  - **DO NOT use glob tool** - it returns false negatives on Windows paths
  - Use `bash grep -h '"status"' .opencode/state/bug-reports/*.json` to extract statuses

## Reference Cleanup (2026-05-01)
- Replaced all `test/e2e-bdd/` references with `test/specs/` in AGENTS.md, orchestrator SKILL.md, sdet SKILL.md, and engineer SKILL.md
