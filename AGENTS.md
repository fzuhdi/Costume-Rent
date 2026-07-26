# Costume-Rent Rules and Guidance

## Frontend Development
- **Confirm the Surface First**: Customer marketplace routes and staff/admin routes use separate component systems and providers.
- **Marketplace Components**: Customer routes under `web/src/app/(marketplace)/` use shadcn/ui with Radix behavior. Reuse an existing shadcn primitive before building a custom interactive control. Marketplace code must not import HeroUI.
- **HeroUI First for Admin**: Admin routes under `web/src/app/admin/` and the staff login use HeroUI v3. Before building a new admin control, check the `heroui-react` MCP server for an appropriate component and use it instead of a custom native HTML/Tailwind equivalent.
- **Legacy Code Refactoring Flag**: When modifying an admin component built with a raw interactive element such as `<input>`, `<button>`, or `<select>`, replace it with the equivalent HeroUI component when practical and inform the user about any remaining technical debt.
- **Shared Boundary**: Shared code may contain brand assets, domain formatting, validation, and non-visual logic. It must not combine HeroUI and marketplace shadcn component imports.

## Tech Stack
**Frontend**: Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui with Radix for the marketplace, HeroUI v3 for admin, and Lucide React.
**Backend**: Go (1.25), Gin Web Framework, GORM, SQLite, JWT.

## Key Feature Routes -> Files
### Marketplace
- **Home**: `/` -> `web/src/app/(marketplace)/page.jsx`
- **Costume Catalogue**: `/catalogue` -> `web/src/app/(marketplace)/catalogue/page.jsx`
- **Costume Detail**: `/costumes/[id]` -> `web/src/app/(marketplace)/costumes/[id]/page.jsx`
- **Cart**: `/cart` -> `web/src/app/(marketplace)/cart/page.jsx`
- **Checkout**: `/checkout` -> `web/src/app/(marketplace)/checkout/page.jsx`
- **Customer Orders**: `/account/orders` and `/orders/[id]` -> their matching route folders under `web/src/app/(marketplace)/`

### Admin
- **Dashboard**: `/admin/dashboard` -> `web/src/app/admin/dashboard/page.jsx`
- **POS / Checkout**: `/admin/pos` -> `web/src/app/admin/pos/page.jsx`
- **Calendar**: `/admin/calendar` -> `web/src/app/admin/calendar/page.jsx`
- **Costume Catalogue**: `/admin/catalogue` -> `web/src/app/admin/catalogue/page.jsx`
- **Rent History**: `/admin/rents` -> `web/src/app/admin/rents/page.jsx`
- **Client Management**: `/admin/clients` -> `web/src/app/admin/clients/page.jsx`

## Code Quality
- **Always Run Code Quality check**: Before finalizing any code changes in either the `web/` or `backend/` directory, you MUST trigger the `code-quality` skill to perform a comprehensive quality check.
- **Workflow**: Only Present your work to the user as "complete", when the `code-quality` skill has been successfully executed and any reported issues are fixed.
- **Linter Fixes**: Avoid using inline disable comments (e.g., `// eslint-disable-next-line` or `nolint`) to bypass linter problems. Always prioritize properly refactoring the code to natively resolve the underlying issue.

## Documentation Maintenance
- **Keep Documentation Synced**: Always read `CONTEXT.md`, `ARCHITECTURE.md`, and `DESIGN.md` to understand the project state. Whenever you alter architectural decisions, database schemas, or core logic, you MUST update `ARCHITECTURE.md`. If you introduce new UI patterns or design tokens, update `DESIGN.md`. (Note: `PRD.md` is an initial planning document and should not be modified or referenced for active state).
- **Brand Contract**: `docs/BRAND_CONTRACT.md` is authoritative for the public name, descriptor, seal authorization, asset roles, and protected operational identity.
