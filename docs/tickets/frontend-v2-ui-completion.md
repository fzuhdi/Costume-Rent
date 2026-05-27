# Frontend V2 UI Completion And Review Fixes

## Objective
Finish the frontend-only `frontend-v2/` implementation so customer and staff UI flows are complete, modular, Indonesian-first, and aligned with `docs/frontend/design-system.md` and `docs/prds/costume-rental-platform.md`.

Backend integration remains out of scope for this ticket. UI state may continue to use mock data and browser storage, but the component structure and interaction behavior should be production-shaped.

## Scope

- Customer storefront at `/`
- Staff login at `/admin/login`
- Staff app under `/admin/*`
- Shared design primitives, page modules, language maps, and mock-state behavior
- Review fixes from the current frontend review

## Required Fixes

### 1. Modularize Frontend Files

- Keep `src/App.jsx` as the app root only.
- Keep routing and app-level state in a small route module.
- Move page components into their own files:
  - `src/pages/customer/CustomerPage.jsx`
  - `src/pages/admin/StaffLoginPage.jsx`
  - `src/pages/admin/AdminShell.jsx`
  - `src/pages/admin/RequestsAdmin.jsx`
  - `src/pages/admin/RentalsAdmin.jsx`
  - `src/pages/admin/CatalogueAdmin.jsx`
  - `src/pages/admin/ClientsAdmin.jsx`
  - `src/pages/admin/NotificationsAdmin.jsx`
  - `src/pages/admin/SettingsAdmin.jsx`
- Move reusable UI into shared component modules:
  - status badges
  - fields
  - info blocks
  - empty states
  - locale switcher
  - data table
  - dialogs
  - activity timeline
  - rental item summary
- Move customer-specific components into `src/components/customer/`.
- Move admin-specific components into `src/components/admin/`.
- Move shared rental/cart/date helpers into `src/lib/rental-utils.js`.
- Avoid adding new page logic back into `App.jsx` or the route file.

### 2. Fix Request Queue Behavior

- `/admin/requests` must primarily show pending request work.
- Completed, rejected, and normal active rentals must not be editable through pending request actions.
- Accept/edit/reject actions should render only for valid requested bookings.
- Stale, delivery, and returned filters should not accidentally expose invalid lifecycle actions.
- If non-request records appear as operational alerts, they must use context-appropriate actions only.

### 3. Lock Completed Rentals

- Completed rentals must not show normal lifecycle actions.
- Completed rentals must not allow payment-proof edits through normal staff actions.
- Admin override remains visible only as the exception path.
- The UI must explain that completed records are locked.

### 4. Make Availability Reflect Local Request Holds

- When a customer submits a request, selected variants should be held in frontend state.
- Availability helpers must account for locally held requested rentals or updated `variant.held`.
- Rejecting/cancelling a request should release the local hold.
- Returning/completing lifecycle behavior should not double-release inventory.

### 5. Remove Customer-Facing Test Controls

- Hide the simulated network failure checkbox from normal customer UI.
- If retained, gate it behind a development/demo flag that is off by default.

### 6. Staff Login And Route Guard Polish

- Customer navbar must not expose staff/admin links.
- `/admin` and `/admin/*` must redirect unauthenticated users to `/admin/login`.
- Staff logout must clear the frontend-only staff session.
- Staff login text must use shared Indonesian/English labels.

### 7. Language And Label Mapping

- User-facing labels must resolve through shared dictionaries.
- English enum flags may remain in mock data and future API contracts, but must not render directly.
- Add missing labels for any new locked/completed/hold/release states.
- Keep Indonesian as the default locale and maintain English labels.

### 8. Static Preview Cleanup

- Remove or clearly mark stale static preview files that no longer represent the React app.
- If retained, static previews must not imply a separate `admin.html` route.

### 9. UI Completion Follow-Up

- Add missing expected UI states where practical:
  - disabled
  - empty
  - success
  - validation error
  - locked/completed
  - unauthenticated staff
- Keep the cart/request summary obvious in the customer navbar.
- Keep product detail as the path before adding to request.
- Keep admin pages dense, scan-friendly, and action-oriented.

## Acceptance Criteria

- `npm run build` passes in `frontend-v2/`.
- `src/App.jsx` remains a thin root component.
- Customer, staff login, and admin pages are implemented in separate page files.
- `/` has no visible staff/admin navigation.
- `/admin/login` renders without a session.
- `/admin/requests` does not expose completed-rental mutation actions.
- Completed rentals show locked state and only allow admin override.
- Local request submission changes availability or held quantity for selected variants.
- New UI copy is mapped in Indonesian and English.
- No customer-facing test simulation control appears by default.

## Out Of Scope

- Backend API integration.
- Real authentication tokens.
- Real file uploads for payment proof.
- Payment gateway integration.
- Gosend or external delivery integration.
