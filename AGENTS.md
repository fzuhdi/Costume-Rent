# Costume-Rent AI Agent Rules

The following rules apply specifically to the Costume-Rent workspace and must be followed by Antigravity and any subagents:

## Code Quality & Assurance
- **Always Run QA**: Before finalizing any code changes in either the `frontend/` or `backend/` directory, you MUST trigger the `qa` skill to perform a comprehensive quality check.
- **Workflow**: Do not present your work to the user as "complete" until the `qa` skill has been successfully executed and any reported issues are fixed.
- **Linter Fixes**: Do NOT use inline disable comments (e.g., `// eslint-disable-next-line` or `nolint`) to bypass linter problems. Always prioritize properly refactoring the code to natively resolve the underlying issue.

## Frontend Development
- **HeroUI First**: Before building new UI components or elements from scratch, you MUST check if an appropriate component is available in HeroUI v3. Use the `heroui-react` MCP server to discover components (e.g., Checkbox, Input, ButtonGroup, etc.). If a matching component exists, always use it rather than building custom native HTML/Tailwind equivalents.

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