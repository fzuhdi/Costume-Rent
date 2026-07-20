# Costume-Rent Rules and Guidance

## Frontend Development
- **HeroUI First**: Before building new UI components or elements from scratch, you MUST check if an appropriate component is available in HeroUI v3. Use the `heroui-react` MCP server to discover components (e.g., Checkbox, Input, ButtonGroup, etc.). If a matching component exists, always use it rather than building custom native HTML/Tailwind equivalents.
- **Legacy Code Refactoring Flag**: If you are modifying existing code that is currently written in raw HTML/Tailwind (e.g., native `<input>`, `<button>`, `<select>`), but an equivalent component exists in the HeroUI library, you MUST inform the user about this technical debt. Do not just copy the bad pattern.

## Tech Stack
**Frontend**: React, Vite, React Router DOM, Tailwind CSS, HeroUI v3, Lucide React.
**Backend**: Go (1.25), Gin Web Framework, GORM, SQLite, JWT.

## Key Feature Routes -> Files
- **Dashboard**: `/dashboard` -> `frontend/src/pages/DashboardPage.jsx`
- **POS / Checkout**: `/pos` -> `frontend/src/pages/POSPage.jsx`
- **Calendar**: `/calendar` -> `frontend/src/pages/CalendarPage.jsx`
- **Costume Catalogue**: `/catalogue` -> `frontend/src/pages/CataloguePage.jsx`
- **Rent History**: `/rents` -> `frontend/src/pages/RentHistoryPage.jsx`
- **Client Management**: `/clients` -> `frontend/src/pages/ClientListPage.jsx`

## Code Quality
- **Always Run Code Quality check**: Before finalizing any code changes in either the `frontend/` or `backend/` directory, you MUST trigger the `code-quality` skill to perform a comprehensive quality check.
- **Workflow**: Only Present your work to the user as "complete", when the `code-quality` skill has been successfully executed and any reported issues are fixed.
- **Linter Fixes**: Avoid using inline disable comments (e.g., `// eslint-disable-next-line` or `nolint`) to bypass linter problems. Always prioritize properly refactoring the code to natively resolve the underlying issue.

## Documentation Maintenance
- **Keep Documentation Synced**: Always read `CONTEXT.md`, `ARCHITECTURE.md`, and `DESIGN.md` to understand the project state. Whenever you alter architectural decisions, database schemas, or core logic, you MUST update `ARCHITECTURE.md`. If you introduce new UI patterns or design tokens, update `DESIGN.md`. (Note: `PRD.md` is an initial planning document and should not be modified or referenced for active state).