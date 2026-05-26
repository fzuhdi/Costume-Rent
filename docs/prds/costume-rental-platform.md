# Full Costume Rental Platform Redesign

## Status
Draft

## Supersedes
This PRD replaces the previous "Mobile-First Customer Booking For Costume Rental Management" scope. The work is no longer limited to adding mobile compatibility or a simple customer booking layer. It defines a full product redesign with two connected surfaces:

- Public customer booking app at `/`
- Staff management app under `/admin/*`

Legacy staff routes such as `/catalogue`, `/rents`, `/clients`, and `/settings` may redirect during migration, but the redesigned staff product must live under `/admin/*`.

## Summary
Costume Rental will become an offline-first boutique rental platform with public self-service discovery. Customers can browse costumes, choose rental dates and size variants, submit booking requests with name and phone, and reopen a booking by reference number plus phone. Staff still control confirmation, request edits, payment proof, preparation, boutique pickup, Gosend/manual delivery, returns, completion, and customer coordination through the staff app.

The redesign must use a custom UI system. The active redesigned frontend must not rely on HeroUI components, HeroUI styling, HeroUI component APIs, or HeroUI theme assumptions.

## Problem
The current product is optimized for authenticated staff operations. Most customers still transact offline: many visit the boutique to inspect costumes, and some coordinate through WhatsApp or phone before staff send items through Gosend or another manual delivery method. The product needs a public catalogue and booking-request flow that reduces staff effort without forcing non-technical customers into ecommerce-style accounts or online payment.

The staff product also needs a redesigned operational workflow that preserves catalogue, rental, client, notification, and settings behavior while adding pending requests, variant-aware availability, staff-side request edits, payment proof closure, delivery coordination, and activity logs.

## Product Decisions
- Route strategy: `/` is the customer storefront; `/admin/*` is the staff management app.
- Order intake: Customer checkout creates a staff-visible booking request, not a confirmed reservation.
- Customer identity: MVP is client-first and guest-friendly. Customers submit name and phone; email is optional.
- Customer lookup: Customers reopen or check a submitted booking with booking reference plus phone.
- Customer accounts: Full account login, social login, magic links, and full self-service order history are future enhancements, not MVP requirements.
- Role separation: Anonymous visitors, customer lookup users, staff users, and admin users have distinct permissions.
- Inventory hold: Pending booking requests hold inventory until staff accepts, rejects, cancels, or edits the request.
- Pending safeguard: Pending requests do not auto-expire in MVP, but stale pending requests must be highlighted in the staff queue.
- Staff control: Staff can modify dates, items, variants, quantities, customer details, notes, fulfillment method, and delivery details until the rent is completed.
- Completion lock: Completed rents are locked for staff. Admin override requires a reason and an activity log entry.
- Payment/deposit handling: Payments are offline and staff-recorded. Staff attach and verify proof for cash, bank transfer, QRIS, or other accepted methods.
- Completion gate: A rent can become `completed` only after payment proof is attached and verified.
- Return semantics: `returned` means the costume is physically back and inventory is released, but the transaction is not financially closed.
- Alerts: Returned-but-not-completed rents continue to alert staff until payment proof is verified and the rent is completed.
- Delivery: Delivery is staff-arranged. Customers provide address and preferred window; staff confirm fee, schedule, and Gosend/manual delivery details.
- Time windows: Pickup, return, and delivery use preferred windows in MVP, not hard-reserved exact slots.
- Guarantee handling: Staff record guarantee type only.
- Language: Indonesian is the primary UI language. Copy should be structured so future English/i18n support is possible.
- UI system: Build custom primitives with semantic HTML, Tailwind/CSS tokens, React state, and lucide-react icons.
- HeroUI policy: HeroUI migration docs are historical references only and must not be treated as implementation guidance for this redesign.

## Users And Roles
- Anonymous visitor: Can browse public catalogue, product detail, availability prompts, and brand information without staff login.
- Customer/contact: Can submit a booking request with name and phone, reopen a booking by reference plus phone, and submit cancellation/reschedule/change requests for staff review.
- Staff: Can manage catalogue, clients, booking requests, rental lifecycle, request edits, preparation, returns, payment proof, delivery, notifications, settings, and activity logs.
- Admin: Can do staff actions and override completed rents with a required reason.

Customer lookup access must not authorize admin routes or admin APIs. Staff/admin tokens must not be required for public catalogue browsing.

## Goals
- Provide a public boutique booking app at `/` that supports discovery and low-friction request submission.
- Preserve existing staff workflows while redesigning staff UI under `/admin/*`.
- Support variant-aware inventory and backend date-range availability validation.
- Make pending customer requests discoverable, editable, and auditable for staff.
- Keep offline operations first: boutique visits, WhatsApp/phone coordination, staff-recorded payment proof, and staff-arranged Gosend delivery.
- Enforce a clear lifecycle where returned stock can be rented again, but financial closure requires verified proof.
- Remove active reliance on HeroUI and establish a custom UI system for customer and staff workflows.
- Add acceptance coverage before implementation tickets are executed.

## Non-Goals
- Rebuilding the app in a new framework or migrating databases without a separate technical decision.
- Automatically confirming or fulfilling customer requests without staff review.
- Mandatory customer accounts, Google login, Microsoft login, password login, or full ecommerce order history in MVP.
- Payment gateway integration, automatic QRIS reconciliation, or Gosend API integration in MVP.
- Collecting guarantee document numbers or photos from customers online.
- Adding QR pickup scanning, AR try-on, push notifications, full offline app behavior, or PWA install behavior in this redesign unless separately ticketed.

## Current Stack And Deprecations
Current frontend stack for this redesign:

- React
- Vite
- React Router
- Axios
- Tailwind v4
- lucide-react
- Context API

Current backend stack:

- Go
- Gin
- GORM
- SQLite
- JWT auth
- Local uploads
- Docker development runtime

Deprecated in this refactor:

- `@heroui/react`
- `@heroui/styles`
- HeroUI component APIs
- HeroUI theme assumptions
- HeroUI-specific migration guidance as active implementation direction

The redesigned UI must not rely on HeroUI components or HeroUI styling. Old HeroUI docs may remain only when clearly marked as legacy or historical notes.

## Product Surfaces

### Customer Booking App At `/`
The public app is the primary entry point. It includes:

- Public catalogue
- Search, filters, category/region browsing, and date-range availability
- Product detail with size/variant selection
- Date range selector
- Cart or request summary
- Booking request submission with name, phone, optional email, and notes
- Pickup or delivery choice
- Preferred pickup, return, or delivery window
- Delivery address for staff-arranged delivery
- Booking confirmation with reference number
- Booking lookup by reference number plus phone
- Cancellation, reschedule, or change request submission for staff review

### Staff Management App Under `/admin/*`
The staff app preserves and redesigns:

- Catalogue management
- Size/variant quantity management
- Rental/order management
- Client management
- Pending booking queue with stale-request indicators
- Notifications and unresolved operational alerts
- Settings and branding
- Staff edit flow before completion
- Staff accept, reject, prepare, ready, deliver, release, return, and complete flow
- Reject reason capture
- Offline payment method, proof attachment, and proof verification
- Delivery fee, schedule, and Gosend/manual delivery notes
- Preferred pickup, return, and delivery windows
- Maintenance/unavailable inventory blocks
- Fitting/measurement notes
- Accessory and bundle notes
- Staff preparation checklist
- Activity log on rent detail
- Admin override for completed rents

## Requirements

### Routing And Access
- REQ-001: The customer storefront must be available at `/` without staff authentication.
- REQ-002: Customer product, request submission, confirmation, lookup, and change-request routes must be public-app routes and must not live under `/admin/*`.
- REQ-003: The staff management app must place redesigned admin pages under `/admin/*`.
- REQ-004: Customer lookup access must not authorize `/admin/*` route access.
- REQ-005: Customer lookup access must not authorize admin APIs for catalogue mutation, rental administration, client management, settings, notifications, payment proof verification, or inventory blocks.
- REQ-006: Staff/admin APIs must remain protected by staff/admin authorization.
- REQ-007: Public customer APIs must expose only browse, availability, booking request, and booking lookup data needed by the public app.
- REQ-008: Booking lookup APIs must require booking reference plus phone and must not expose unrelated clients or orders.

### Customer Catalogue And Request Flow
- REQ-009: Anonymous visitors must be able to browse the public catalogue without staff login.
- REQ-010: The public catalogue must show costume image, name, category/region labels when available, price/rental cost when configured, and availability state.
- REQ-011: Catalogue search and filters must update without a full page reload.
- REQ-012: Customer filters and availability controls must collapse cleanly on small screens.
- REQ-013: The customer catalogue must include a date-range selector with start date, end date, and apply action.
- REQ-014: Invalid date ranges where the end date is before the start date must be blocked.
- REQ-015: Past customer booking dates must be blocked unless staff-only backdating is explicitly supported.
- REQ-016: Products must remain browseable when no date range is selected, but request submission must require valid dates.
- REQ-017: Applied date ranges must update availability using overlapping rents, requested bookings, confirmed bookings, maintenance blocks, unavailable inventory blocks, size/variant quantities, and requested quantities.
- REQ-018: Product detail must show images, name, description, category/region, availability, price when configured, size/variant options, fitting/measurement guidance when configured, accessory/bundle notes when configured, and active rental dates.
- REQ-019: Product detail must require valid date selection and variant selection when variants exist before enabling add-to-request.
- REQ-020: Customer product images must lazy-load and provide accessible alt text.
- REQ-021: Customers must be able to build a request before providing contact details.
- REQ-022: The request summary must persist locally across refresh and temporary connection loss.
- REQ-023: Each request item must include costume identity, variant identity/label when applicable, image when available, quantity, rental date range, price/rental cost when configured, and availability state.
- REQ-024: Customers must be able to remove items and adjust quantities within available variant limits.
- REQ-025: If the customer changes the global date range after adding items, the system must prompt the customer to keep existing item dates, sync eligible items, or remove incompatible items.
- REQ-026: Request state must recover safely from corrupted local storage by clearing invalid items and informing the customer.

### Customer Submission, Lookup, And Change Requests
- REQ-027: Customers must not be required to create an account or sign in before submitting a booking request.
- REQ-028: Booking request submission must collect customer name and phone.
- REQ-029: Booking request submission may collect email as optional contact information.
- REQ-030: Booking request submission must support pickup.
- REQ-031: Booking request submission must support staff-arranged delivery.
- REQ-032: Delivery requests must collect address and preferred delivery window.
- REQ-033: Pickup requests must collect or display preferred pickup and return windows.
- REQ-034: Booking request submission must support optional customer notes, fitting/measurement notes, and accessory/bundle notes when relevant.
- REQ-035: Booking request submission must require explicit agreement to rental terms before submission.
- REQ-036: Booking request submission must not collect guarantee document details online.
- REQ-037: Before request submission, the backend must revalidate all items against current date-range and variant availability.
- REQ-038: If an item becomes unavailable before request submission, the system must block submission and identify the affected item.
- REQ-039: Successful submission must create a staff-visible `requested` booking linked to a new or matched client by customer name and phone.
- REQ-040: Successful submission must show confirmation with booking reference, rental dates, selected items and variants, fulfillment choice, pending/requested status, and next steps for staff follow-up.
- REQ-041: Duplicate request submission must be prevented with submit locking and idempotent backend handling where feasible.
- REQ-042: Customers must be able to look up a booking using booking reference plus phone.
- REQ-043: Booking lookup must show customer-friendly status, rental dates, fulfillment method, product count, selected items/variants, and staff-visible next steps when available.
- REQ-044: Customers must be able to request cancellation for eligible bookings through booking lookup.
- REQ-045: Customers must be able to request reschedule for eligible bookings through booking lookup.
- REQ-046: Customers must be able to request detail changes through booking lookup.
- REQ-047: Cancellation, reschedule, and change requests must require staff review before changing the actual booking.

### Staff Management And Lifecycle
- REQ-048: Existing staff catalogue CRUD behavior must continue to support multiple images, cover image selection, category/region labels, search/filter, detail views, and availability-relevant inventory data.
- REQ-049: Staff must be able to manage size/variant rows under each costume with variant label, quantity, and optional notes.
- REQ-050: Staff must be able to create, edit, and view maintenance or unavailable inventory blocks that reduce public availability for affected costume variants and date ranges.
- REQ-051: Existing staff rental/order behavior must continue to support client selection or inline client creation, date validation, quantity validation, returns, overdue status, notes, and guarantee type.
- REQ-052: Staff must be able to see customer-submitted `requested` bookings in a dedicated or clearly linked pending booking queue.
- REQ-053: Pending requested bookings must hold inventory until staff accepts, rejects, cancels, or edits the booking.
- REQ-054: The staff queue must highlight stale requested bookings that have not been resolved within the configured warning age.
- REQ-055: Staff must be able to accept a requested booking and move it to `confirmed`.
- REQ-056: Staff must be able to reject a requested booking with a required reject reason that is visible in booking lookup.
- REQ-057: Staff must be able to edit dates, items, variants, quantities, customer details, notes, fulfillment method, delivery details, and preferred windows until the rent is completed.
- REQ-058: Staff edits must revalidate date-range and variant availability before save.
- REQ-059: Staff must be able to record fitting/measurement notes.
- REQ-060: Staff must be able to record accessory and bundle notes.
- REQ-061: Staff must be able to use a preparation checklist before marking an order prepared or ready.
- REQ-062: Staff must be able to move bookings through `requested`, `confirmed`, `preparing`, `ready_pickup`, `out_delivery`, `on_rent`, `returned`, and `completed` states as applicable.
- REQ-063: Staff must be able to record pickup/release and return events.
- REQ-064: Marking a rent `returned` must release physical inventory for future availability.
- REQ-065: `returned` must not be treated as a final closed status.
- REQ-066: Staff must be able to record offline payment method as `cash`, `bank_transfer`, `qris`, or `other`.
- REQ-067: Staff must be able to attach payment proof files.
- REQ-068: Staff must be able to mark payment proof as `attached`, `verified`, or `rejected`.
- REQ-069: The system must block `completed` unless payment proof is attached and verified.
- REQ-070: Returned-but-not-completed rents must remain visible in staff alerts, especially after rent due date.
- REQ-071: Completed rents must be locked from normal staff edits.
- REQ-072: Admin users must be able to override completed rents only with a required reason.
- REQ-073: Every meaningful staff edit, lifecycle transition, payment proof change, customer request, and admin override must create an activity log entry visible on staff rent detail.
- REQ-074: Staff must be able to schedule and update delivery details, fee notes, and Gosend/manual delivery notes for delivery bookings.
- REQ-075: Existing staff client behavior must continue to show contact information and rental history.
- REQ-076: Existing notifications must continue to show overdue and due-soon rental alerts.
- REQ-077: Notifications or queue indicators must make new pending requests, stale requests, returned-but-not-completed rents, and rejected payment proofs discoverable.
- REQ-078: Settings for app name, tagline, logo, and branding must apply to customer and staff surfaces where appropriate.

### Status Model
- REQ-079: The rental lifecycle must use separate lifecycle status and payment proof status fields.
- REQ-080: Lifecycle status must support `requested`, `confirmed`, `preparing`, `ready_pickup`, `out_delivery`, `on_rent`, `returned`, `completed`, `rejected`, and `cancelled`.
- REQ-081: Payment method must support `cash`, `bank_transfer`, `qris`, and `other`.
- REQ-082: Payment proof status must support `missing`, `attached`, `verified`, and `rejected`.
- REQ-083: Customer-facing status labels must be boutique-friendly Indonesian labels derived from lifecycle and payment proof state.
- REQ-084: Staff-only details such as internal checklist state, admin override reason, and internal activity entries must not be exposed through public booking lookup unless explicitly customer-facing.
- REQ-085: Reschedule requests must keep the original inventory hold until staff approves new dates or rejects the request.

### UI System, Mobile, And Accessibility
- REQ-086: The redesigned UI must use custom primitives built from semantic HTML, Tailwind/CSS tokens, React state, and lucide-react icons.
- REQ-087: No active redesigned frontend code may import from `@heroui/react`.
- REQ-088: No active global CSS may import `@heroui/styles`.
- REQ-089: Customer and staff UIs must be usable at 320px through desktop widths with no horizontal body overflow.
- REQ-090: Customer and staff interactive controls must provide reliable touch targets.
- REQ-091: Forms must use mobile-appropriate input types for phone numbers, dates, addresses, payment proof fields, and search.
- REQ-092: Customer and staff flows must expose visible loading, empty, disabled, error, retry, and success states.
- REQ-093: Customer and staff core flows must pass accessibility checks for keyboard access, focus visibility, labels, roles, color contrast, and meaningful status announcements.
- REQ-094: The custom UI system must avoid HeroUI component APIs, HeroUI class assumptions, and HeroUI theme tokens.
- REQ-095: Customer and staff product copy must be Indonesian-first.

### Acceptance Coverage
- REQ-096: New customer, admin queue, payment proof, variant availability, and design-system behavior must be represented in `docs/acceptance/` before implementation tickets are executed.
- REQ-097: Regression coverage must preserve existing `AUTH`, `CATALOGUE`, `RENT`, `CLIENT`, `NOTIFICATION`, `SETTINGS`, `NAVIGATION`, and `API` acceptance behavior unless a later ticket explicitly migrates route paths while preserving workflow intent.

## User Flows
- Public browse: Visitor opens `/`, browses catalogue, searches or filters products, views product detail, sees size/variant options, and sees date prompts without staff login.
- Date-aware request: Customer selects rental dates, chooses available variants and quantities, adds costumes to the request summary, and submits name, phone, preferred windows, and notes.
- Boutique delivery request: Customer selects delivery, enters address and preferred delivery window, then staff later confirms fee, schedule, and Gosend/manual delivery details.
- Boutique pickup request: Customer selects pickup, enters preferred pickup and return windows, and staff confirms exact coordination offline.
- Booking confirmation: Customer sees booking reference, requested status, selected items/variants, dates, fulfillment method, and instructions for staff follow-up.
- Booking lookup: Customer enters booking reference plus phone to see current status, selected items, dates, fulfillment details, and available request actions.
- Customer change request: Customer requests cancellation, reschedule, or detail changes; staff reviews and applies or rejects the change.
- Staff pending queue: Staff opens `/admin/*`, sees requested bookings, stale warnings, requested variants, date ranges, customer contact, and fulfillment preferences.
- Staff edit and confirm: Staff edits dates/items/variants/quantities if needed, logs changes automatically, confirms or rejects the request, and coordinates with the customer.
- Staff preparation and release: Staff prepares items with checklist, marks ready for boutique pickup or out for delivery, records release to customer, and moves the rent to on-rent.
- Staff return and completion: Staff marks items returned, inventory is released, payment proof remains required, and the rent stays alerting until proof is verified and status becomes completed.
- Admin override: Admin corrects a completed rent only with a required reason that appears in the staff activity log.

## Edge Cases
- End date before start date: Block apply and submission with a clear date validation error.
- Past date selected: Block customer submission unless staff-only backdating is explicitly supported.
- Variant becomes unavailable after add-to-request: Block submission or staff save and identify affected items.
- Product or variant is deleted/disabled after add-to-request: Remove or block the item with a clear message.
- Quantity exceeds variant availability: Prevent update or submission and show available quantity.
- Maintenance block overlaps selected dates: Reduce availability before request submission and staff save.
- Customer changes dates after request creation: Staff-reviewed reschedule keeps original inventory hold until approved or rejected.
- Empty catalogue result: Show an empty state with clear-filter and date-change options.
- Missing product image: Show a stable placeholder without breaking layout.
- Request submission network failure: Preserve request summary and allow retry without duplicate request creation.
- Duplicate submit: Lock submit and rely on idempotent backend behavior where feasible.
- Invalid booking lookup: Show a safe not-found state without revealing whether the reference or phone was wrong.
- Customer lookup attempts admin route/API: Deny and redirect to customer flow.
- Staff token attempts customer-only lookup action: Enforce route/API policy according to role rules.
- Corrupted local request data: Clear invalid local data and inform the customer.
- Returned but not completed: Inventory is available again, but staff alerts continue until verified payment proof allows completion.
- Payment proof rejected: Rent cannot be completed and staff alert remains active.
- Completed edit attempt by staff: Block edit and explain admin override is required.
- Mobile safe-area overlap: Bottom navigation and sticky action bars must not hide content.

## Acceptance And Test Plan
Add and maintain acceptance sources for:

- `docs/acceptance/CUSTOMER_CATALOGUE.md`
- `docs/acceptance/CUSTOMER_BOOKING_REQUEST.md`
- `docs/acceptance/CUSTOMER_BOOKING_LOOKUP.md`
- `docs/acceptance/ADMIN_BOOKING_QUEUE.md`
- `docs/acceptance/ADMIN_VARIANT_INVENTORY.md`
- `docs/acceptance/ADMIN_PAYMENT_PROOF.md`
- `docs/acceptance/DESIGN_SYSTEM.md`

Regression coverage must preserve:

- `AUTH`
- `CATALOGUE`
- `RENT`
- `CLIENT`
- `NOTIFICATION`
- `SETTINGS`
- `NAVIGATION`
- `API`

Acceptance must verify:

- No HeroUI imports remain in redesigned frontend code.
- No `@heroui/styles` import remains in active global CSS.
- Public customer pages work without staff login.
- Admin pages are under `/admin/*`.
- Customer booking requests can be submitted without account login.
- Booking lookup works by reference plus phone and does not expose unrelated data.
- Pending requests hold variant inventory until staff resolves them.
- Stale pending requests surface in the staff queue.
- Staff edits before completion are revalidated and logged.
- Completed rents cannot be edited by staff.
- Admin override after completion requires a reason and activity log.
- Returned rents release inventory but continue alerting until payment proof is verified.
- `completed` is blocked unless payment proof is attached and verified.
- Mobile width 320px has no horizontal overflow.
- Customer and staff flows both pass accessibility checks.
- Booking availability is validated on the backend before request submission and staff save.

## Success Metrics
- Customers can browse the catalogue publicly without staff login.
- Customers can submit a booking request with name and phone only.
- Staff can find and act on customer-submitted requests from `/admin/*`.
- Staff can edit requested bookings before completion without losing audit history.
- Variant-aware availability reduces double booking compared with the pre-launch baseline.
- Returned-but-not-completed rentals are resolved instead of being silently treated as complete.
- Customer catalogue first contentful paint is under 1.5 seconds on representative 4G mobile conditions.
- Staff workflows for catalogue, rental/order, clients, notifications, settings, and API behavior remain covered by regression acceptance.

## Dependencies And Constraints
- Date-range availability requires reliable backend overlap logic against requested bookings, confirmed/on-rent rentals, returned/completed state, blocked inventory, maintenance dates, size/variant quantities, and requested quantities.
- Customer booking requests must match or create client records by name and phone without exposing unrelated client data publicly.
- Role-based authorization must distinguish anonymous browsing, booking lookup, staff, and admin override access.
- Public DTOs must not reuse admin payloads blindly.
- File storage and retrieval for payment proof must be access-controlled to staff/admin users.
- Delivery requires staff-controlled fee, schedule, and Gosend/manual delivery notes, but no external delivery integration in MVP.
- Terms text, cancellation policy, reschedule policy, and stale-request warning age require business approval before ticket execution.
- If public traffic or concurrent writes exceed SQLite's practical limits, database migration should be handled as a separate scaling decision.

## Risks
- Customer friction from account requirements: Keep MVP guest/client-first with reference plus phone lookup.
- Pending requests freezing stock: Highlight stale pending requests until staff resolves them.
- Availability errors causing double booking: Validate availability in the backend at request submission and staff save.
- Variant complexity: Keep variants simple with label, quantity, and optional notes before adding individual-unit tracking.
- Payment proof ambiguity: Separate lifecycle status from payment proof state and block completion until verified.
- Role confusion between customer lookup and staff access: Use explicit route guards, API guards, and scoped lookup behavior.
- HeroUI assumptions leaking into redesign: Treat HeroUI docs as historical only and scan source for active imports.
- Staff workflow regression: Preserve existing acceptance and add admin queue/payment/variant coverage before implementation.
- Mobile layout regression: Test 320px and common mobile widths for no horizontal overflow.

## Open Questions And Handoff Notes
- Confirm stale pending request warning age, for example 1 business day.
- Confirm customer-facing Indonesian labels for lifecycle and payment proof states.
- Confirm exact required terms, cancellation, and reschedule policy text.
- Confirm whether delivery fee is required before confirmation or can remain as staff notes in MVP.
- Confirm accepted payment proof file types and size limits.
- Confirm whether payment proof verification requires staff role only or admin role.
- Confirm whether variant labels should use fixed values, free-form labels, or both.
- Product handoff: Approve status labels, stale warning age, terms, cancellation policy, reschedule policy, and payment proof rules.
- Design handoff: Build Indonesian-first customer and staff flows with custom UI primitives and no HeroUI dependency.
- Engineering handoff: Treat payment gateway, Gosend API, customer accounts, social login, and magic links as future enhancements.
- QA handoff: Create or update Playwright/API tests from acceptance docs, with each test title containing exactly one bracketed test case ID.
