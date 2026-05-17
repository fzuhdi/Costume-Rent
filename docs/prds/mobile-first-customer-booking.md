# Mobile-First Customer Booking For Costume Rental Management

## Status
Draft

## Summary
This PRD extends the current Costume Rental Management application from an authenticated staff/admin system into a mobile-first customer booking platform. Customers will be able to browse a public catalogue, select rental dates, add available costumes to a cart, complete a lightweight checkout, and view their order history. Staff will continue using the existing catalogue, rental, client, notification, settings, and API workflows to manage inventory, rental fulfillment, returns, overdue follow-up, and application branding.

## Problem
The current product is optimized for staff operations: authenticated admins manage costumes, clients, rental orders, availability quantities, overdue notifications, and settings. Future growth requires customers to self-serve rental discovery and booking on mobile without requiring staff to manually handle every catalogue inquiry. Without a customer-facing, date-aware booking flow, customers cannot confidently know whether a costume is available for their event dates, staff must resolve conflicts manually, and mobile conversion remains limited to offline or assisted channels.

## Assumptions
- The existing staff/admin feature set remains the operational source of truth and must not be removed or regressed.
- The customer booking experience will be added to the current React/Vite frontend and Go/Gin backend unless a future ADR explicitly approves a platform migration.
- Existing admin authentication, catalogue management, rental management, client management, notifications, settings, and API coverage remain in scope as the baseline system.
- Customer checkout creates a staff-visible pending rental request, not an immediately active rental.
- Customers do not provide sensitive guarantee document numbers online; staff collect guarantee information at pickup.
- Delivery, payment/deposit handling, and Google/Microsoft login are MVP scope.
- QR pickup scanning, push notifications, AR try-on, PWA install behavior, and full offline booking are future enhancements unless explicitly pulled into a release plan.

## Product Decisions
- Customer checkout status: Submitted customer orders start as `pending` rental requests for staff review.
- Guarantee handling: Staff collect guarantee document details at pickup before fulfillment.
- MVP scope includes delivery, payment or deposit handling, and Google/Microsoft social login.

## Users
- Mobile-first casual renter: needs fast catalogue scanning, clear photos, simple date selection, minimal typing, and confidence that selected costumes are available.
- Repeat customer or studio: needs quick rebooking, order history, and support for multiple costumes in one rental period.
- Staff administrator: needs existing back-office tools to manage costumes, clients, rentals, returns, overdue notifications, and settings without disruption.
- Anonymous visitor: needs to browse products and availability before deciding to sign in or place an order.

## Goals
- Enable mobile-first customer self-service booking while preserving the existing staff management workflow.
- Reduce booking conflicts by checking date-range availability before cart and checkout submission.
- Increase rental inquiries and completed rental orders from mobile users.
- Keep customer browsing and cart interactions fast on common mobile network conditions.
- Make future `/plan-to-tickets` conversion straightforward by defining testable requirements and explicit open questions.

## Non-Goals
- Replacing the current staff/admin application.
- Rebuilding the app in Next.js or migrating from SQLite/PostgreSQL without a separate technical decision.
- Adding a complete staff dashboard redesign for mobile users.
- Supporting full offline booking submission.
- Adding AR try-on, QR scanning, push notifications, or PWA install behavior in the MVP.
- Exposing admin-only inventory management, client management, or settings tools to public users.

## Scope
The MVP scope is a customer-facing booking layer that reuses the current catalogue, rental, client, settings, and notification foundations. Public users can browse available costumes, choose a rental date range, add date-valid items to a cart, authenticate with email or Google/Microsoft login, choose pickup or delivery, submit payment or deposit information, submit a staff-visible pending rental request, and review their own order history. Staff continue to manage inventory and fulfillment through the existing authenticated app.

Release boundaries:
- Current baseline: staff/admin catalogue, rental, client, notification, settings, navigation, and API features remain covered by existing acceptance files.
- Customer booking MVP: public catalogue, date-based availability, cart, checkout handoff, delivery option, payment/deposit handling, Google/Microsoft login, customer order history, mobile-first navigation, and staff visibility of submitted pending requests.
- Later enhancements: PWA shell, push/order-status notifications, advanced delivery integrations, QR pickup verification, AR try-on, and database/platform migration if needed.

## Requirements
- REQ-001: The system must provide a mobile-first public catalogue route that anonymous users can access without admin authentication.
- REQ-002: The public catalogue must show costume cards with image, name, region or category labels when available, price or rental cost when configured, and an availability state.
- REQ-003: The customer catalogue must support search and category/region filtering without requiring a full page reload.
- REQ-004: Customer-facing catalogue filters and availability controls must be collapsible on small screens so the product grid remains the primary content.
- REQ-005: Customer-facing navigation must expose primary actions for browse/products, cart, and orders in a thumb-friendly mobile layout.
- REQ-006: The customer UI must remain usable at viewport widths from 320px through desktop widths, with no hover-only interactions.
- REQ-007: The customer catalogue must include a global rental date selector with start date, end date, and an apply action.
- REQ-008: The system must reject invalid date ranges where the end date is before the start date.
- REQ-009: When no date range is selected, the catalogue must keep products visible while preventing add-to-cart for items that require dates.
- REQ-010: When no date range is selected, products with no upcoming availability must show a fully booked state and must not show an active add-to-cart action.
- REQ-011: When a valid date range is applied, the catalogue must update product availability based on rentals that overlap that date range.
- REQ-012: Date-range availability must account for each costume's total quantity, current active or pending overlapping rentals, and requested cart quantity.
- REQ-013: Products unavailable for the selected date range must not be addable to cart.
- REQ-014: Products available for the selected date range must expose an active add-to-cart action that includes or clearly references the selected date range.
- REQ-015: A customer product detail view must show images, name, description, region, category, quantity or availability state, and the active date range when selected.
- REQ-016: If a customer opens product detail without a global date range, the detail view must require date selection before enabling add-to-cart.
- REQ-017: The customer cart must persist locally so a mobile user does not lose selected items after refresh or temporary connection loss.
- REQ-018: Each cart item must include costume identity, display image when available, quantity, selected rental dates, and price/rental cost when configured.
- REQ-019: The cart must allow customers to remove items and adjust quantities within available limits.
- REQ-020: If the customer changes the global date range after adding items, the system must prompt the customer to keep existing item dates or sync eligible cart items to the new range.
- REQ-021: Before checkout submission, the system must revalidate all cart items against current date-range availability.
- REQ-022: If an item becomes unavailable before checkout submission, the system must block submission and tell the customer which item needs removal or date adjustment.
- REQ-023: Customers must be able to browse and build a cart without signing in.
- REQ-024: Customers must be required to authenticate before submitting an order or viewing their order history.
- REQ-025: Customer authentication must not grant access to admin-only routes, protected staff APIs, settings management, catalogue mutation, client management, or rental administration.
- REQ-026: Customer authentication must support Google login as an MVP sign-in option.
- REQ-027: Customer authentication must support Microsoft login as an MVP sign-in option.
- REQ-028: Customer authentication must retain an email sign-in or fallback path for customers who cannot use social login.
- REQ-029: Checkout must collect or confirm the customer's full name and phone number.
- REQ-030: Checkout must support pickup as a fulfillment option.
- REQ-031: Checkout must support delivery as a fulfillment option.
- REQ-032: Checkout must collect a delivery address when delivery is selected.
- REQ-033: Checkout must support optional customer notes.
- REQ-034: Checkout must require explicit agreement to rental terms before submission.
- REQ-035: Checkout must support payment or deposit handling before a pending request is submitted or confirmed.
- REQ-036: Checkout must not collect guarantee document details from customers online.
- REQ-037: Successful checkout must create a staff-visible pending rental request linked to the selected customer/client and selected costumes.
- REQ-038: Successful checkout must show a confirmation screen with an order reference, rental dates, selected items, pending status, and next actions.
- REQ-039: Staff users must be able to see customer-submitted pending requests from the existing rental workflow or a clearly linked staff queue.
- REQ-040: Staff users must be able to record guarantee information at pickup before fulfilling a pending request.
- REQ-041: Staff users must be able to accept, prepare, complete, return, or reject customer-submitted orders without losing existing rental history behavior.
- REQ-042: Customer order history must show each authenticated customer's own orders only.
- REQ-043: Customer order history must show rental dates, product count, status, and an expandable list of rented items.
- REQ-044: Customer order history must support a rebook action that starts a new cart with the same items but requires fresh date selection and availability validation.
- REQ-045: Existing staff catalogue CRUD behavior must continue to support multiple images, cover image selection, region/category labels, search/filter, quantity, and detail views.
- REQ-046: Existing staff rental behavior must continue to support client selection or inline client creation, date validation, quantity validation, returns, overdue status, notes, and guarantee details.
- REQ-047: Existing staff client behavior must continue to show contact information and rental history.
- REQ-048: Existing staff notifications must continue to show overdue and due-soon rental alerts.
- REQ-049: If a new pending customer-order status is added, staff notification or rental queue behavior must make new customer orders discoverable.
- REQ-050: Existing settings for app name, tagline, and logo must apply to customer-facing pages where appropriate.
- REQ-051: Public customer endpoints must expose only data required for browsing and booking, and must not leak admin-only client, rental, or settings mutation data.
- REQ-052: Protected customer endpoints must enforce ownership so customers can only see their own orders.
- REQ-053: Protected admin endpoints must remain restricted to staff/admin tokens.
- REQ-054: Customer-facing product images must lazy-load and provide accessible alt text.
- REQ-055: Customer-facing interactive controls must have touch targets large enough for reliable mobile use.
- REQ-056: Customer-facing forms must use mobile-appropriate input types for phone numbers, dates, and addresses.
- REQ-057: The customer flow must expose visible loading, empty, error, and retry states for catalogue, availability, cart validation, checkout, and order history.
- REQ-058: New customer-facing behavior must be represented in `docs/acceptance/` before implementation tickets are executed.

## User Flows
- Browse without date: Customer opens the public catalogue -> sees product grid and date prompt -> searches or filters products -> add-to-cart controls remain disabled until a date range is selected.
- Select global dates: Customer opens the date selector -> chooses start and end date -> applies range -> catalogue recalculates availability -> available products can be added to cart for that range.
- Product detail fallback: Customer taps a product before selecting dates -> detail view opens -> customer selects dates in the detail view -> add-to-cart becomes available only if the product has availability for that range.
- Cart review: Customer opens cart from mobile navigation -> reviews items, quantities, dates, and total if pricing is configured -> removes unavailable or unwanted items -> proceeds to checkout.
- Checkout with authentication: Customer proceeds to checkout -> signs in or registers with email, Google, or Microsoft when prompted -> confirms name, phone, fulfillment choice, address if delivery, payment/deposit details, notes, and terms -> submits pending request -> sees confirmation.
- Staff fulfillment: Staff signs into the existing admin app -> sees the customer-submitted pending request -> validates details -> collects guarantee information at pickup -> prepares and fulfills rental -> marks returned when completed.
- Customer history and rebook: Customer opens orders -> sees status and rental dates -> expands an order for item details -> taps rebook -> cart is prefilled with previous items but requires new dates and availability validation.

## Edge Cases
- End date before start date: Block apply or checkout and show a date validation error.
- Past date selected: Block selection or submission unless staff explicitly allows backdated rentals.
- Product becomes unavailable after being added to cart: Block checkout and identify the affected cart item.
- Product deleted or disabled after being added to cart: Remove or block the item with a clear message.
- Customer changes dates after cart creation: Prompt to sync dates, keep existing item dates, or remove incompatible items.
- Quantity exceeds availability: Prevent cart update or checkout and show the available quantity for the selected range.
- Empty catalogue result: Show a helpful empty state with options to clear filters or change dates.
- Missing product image: Show a stable placeholder without breaking card layout.
- Checkout network failure: Preserve the cart and allow retry without creating duplicate orders.
- Duplicate checkout submission: Prevent duplicate orders with submit locking and idempotent backend handling where feasible.
- Unauthenticated order-history access: Redirect or prompt login, then return to orders after successful authentication.
- Customer token attempts admin route: Deny access and redirect to an appropriate customer or login page.
- Corrupted local cart data: Clear invalid cart data safely and inform the customer.
- Mobile safe-area overlap: Bottom navigation and sticky checkout bars must not hide content behind device safe areas.

## Success Metrics
- More than 85% of customer-submitted orders originate from mobile devices after launch.
- Cart-to-order conversion rate is at least 10% for customer booking sessions.
- Customer booking flow reduces staff-handled availability inquiries compared with the pre-launch baseline.
- Date-range double-booking incidents decrease compared with the pre-launch baseline.
- Customer catalogue first contentful paint is under 1.5 seconds on representative 4G mobile conditions.
- Customer booking checkout can be completed with no more than one required authentication interruption.
- Customers can complete checkout using Google, Microsoft, or email fallback authentication.
- Customers can choose delivery or pickup during checkout.
- Customers can complete required payment or deposit handling during checkout.
- Staff can find and act on a customer-submitted pending request without leaving the existing rental management workflow.

## Dependencies And Constraints
- Current backend stack is Go, Gin, GORM, SQLite, JWT auth, local uploads, and Docker.
- Current frontend stack is React, Vite, React Router, Axios, HeroUI v3, Tailwind v4 styling, and Context API.
- Current acceptance source of truth is `docs/acceptance/*.md`; new customer booking behavior should add acceptance coverage before ticket execution.
- Current tests use Playwright against `http://localhost:5173` and API tests against `http://localhost:8080`.
- Existing admin credentials and route protection are staff-oriented and should not be reused as-is for public customer access without role separation.
- Date-range availability requires reliable overlap logic against rental dates and quantities.
- Customer order status design requires extending the current rental status model beyond `active`, `returned`, and `overdue` to include `pending`.
- If public customer traffic or concurrent writes exceed SQLite's practical limits, database migration should be handled as a separate scaling decision.
- Google or Microsoft OAuth requires provider app registration, callback URLs, and explicit security review.
- Payment or deposit handling requires provider selection, transaction state rules, refund/cancellation policy, and staff reconciliation behavior before implementation.
- Delivery requires address rules, service area decisions, delivery fee handling, and staff fulfillment workflow before implementation.
- Terms text and cancellation policy require business approval before implementation.

## Risks
- Scope creep from combining customer booking with admin redesign: Keep MVP limited to customer booking while preserving staff workflows.
- Incorrect date availability causing double bookings: Use backend overlap validation at add-to-cart preview and final checkout submission.
- Customer checkout conflicts with staff guarantee requirements: Keep customer submissions in `pending` status until staff collect guarantee details at pickup.
- Public catalogue exposes admin data accidentally: Create public DTOs and role-scoped API behavior instead of reusing admin payloads blindly.
- Mobile performance suffers from large images: Lazy-load images, serve optimized sizes, and avoid loading admin-only data in customer views.
- Social login redirect fails in in-app browsers: Keep email/password fallback and test mobile redirect behavior before making social login primary.
- Payment/deposit provider creates checkout complexity: Keep payment state explicit and block fulfillment when payment or deposit requirements are incomplete.
- SQLite may become a bottleneck for public traffic: Monitor usage and define a migration trigger before scaling assumptions change.

## Open Questions And Handoff Notes
- What exact statuses should customers see for submitted orders?
- Should customer accounts be separate from staff users, or should the existing user model support roles for both?
- Are product sizes or variants needed, or is quantity-only costume selection sufficient for the current inventory model?
- What public route names should be used for customer pages so they do not conflict with current `/catalogue`, `/rents`, `/clients`, and `/settings` admin routes?
- What terms and cancellation policy text should customers agree to during checkout?
- Which payment/deposit provider, payment states, cancellation rules, and refund rules should the MVP use?
- What delivery service area, delivery fee, and address validation rules should the MVP use?
- Which analytics events should be tracked for mobile conversion metrics?
- Handoff note for product: Approve customer-visible status labels, payment/deposit policy, delivery rules, and terms text before `/plan-to-tickets`.
- Handoff note for design: Preserve existing app branding from settings, but optimize customer pages for bottom navigation and touch-first interactions.
- Handoff note for engineering: Treat Next.js, PostgreSQL, PWA, and push notifications from the future PRD as future options, not implementation requirements for this merged MVP.
- Handoff note for QA: Create new acceptance files for customer catalogue, date availability, cart, checkout, and customer orders with one bracketed test case ID per test title.
