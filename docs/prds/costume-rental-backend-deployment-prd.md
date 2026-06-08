# Product Requirements Document: Costume Rental Backend, Deployment, and Frontend Integration

## 1. Executive Summary

Costume Rental is a boutique costume rental platform with a completed `frontend-v2` customer and staff experience that is currently backed by local/mock state through `src/lib/data-adapter.js`. This PRD defines the backend development, API contracts, database model, deployment plan, QA scope, and integration requirements needed to turn that frontend into a production-ready application.

The frontend already implements the public customer journey at `/`, `/catalogue`, `/costumes/:productId`, `/checkout`, and `/lookup`, plus staff workflows under `/admin/*`. Backend work must now persist those flows, enforce inventory and lifecycle rules server-side, protect staff data, support file uploads, and deploy the app with reliable environments, backups, monitoring, and rollback.

MVP backend success means customers can browse live catalogue data, submit booking requests without an account, look up a booking by reference plus phone, and request changes safely. Staff can authenticate, manage incoming requests, progress rentals, manage variant stock, upload and verify payment proof, edit catalogue/client/settings data, and deploy the system with production-grade operational controls.

## 2. Source Inputs Reviewed

| Source | Key findings |
|---|---|
| `docs/prds/costume-rental-platform.md` | Full redesign requirements, lifecycle, availability, customer lookup, staff operations, payment proof, delivery, and design-system policy. |
| `design-system/MASTER.md` and `design-system/pages/*.md` | Frontend design source of truth, route-specific rules, mobile-first constraints, availability API safety rules, and staff page behavior. |
| `design-system/frontend-v2-audit.md` | Frontend is implemented with local/mock adapter contracts; live backend endpoints are not wired yet. |
| `frontend-v2/src/AppRoutes.jsx` | Route map and current frontend state boundary. |
| `frontend-v2/src/lib/data-adapter.js` | Mock/local backend contract for catalogue, availability, booking creation, lookup recovery, change requests, admin saves, and availability cache clearing. |
| `frontend-v2/src/pages/**` and `frontend-v2/src/components/**` | Implemented customer and admin behavior to preserve during backend integration. |
| `backend/**` | Existing Go/Gin/GORM/SQLite backend with basic auth, catalogue, client, rent, settings, notification, upload, and availability support. |
| `docker-compose*.yml`, `backend/Dockerfile`, `frontend-v2/Dockerfile` | Docker-based deployment direction exists but must be updated for `frontend-v2`, secure uploads, API proxying, and production operations. |

## 3. Assumptions

| ID | Assumption | Impact |
|---|---|---|
| A-001 | The product is for one boutique or a small single-branch rental business in MVP. | Allows a simple monolith backend and single database deployment. |
| A-002 | The existing `frontend-v2` UI is the target frontend and should not be redesigned in this PRD. | Backend must adapt to the frontend route and data needs. |
| A-003 | Indonesian remains the primary UI language, with English fallback labels. | Backend stores stable English enum values; frontend maps labels. |
| A-004 | Customer accounts, online payment gateway, Gosend API, magic links, and social login are not MVP. | Booking remains guest-friendly and staff-reviewed. |
| A-005 | Current backend stack should remain Go, Gin, GORM, JWT, Docker, and SQLite for local development. | Faster delivery with existing codebase patterns. |
| A-006 | Production should support either SQLite for a low-traffic single-node MVP or PostgreSQL as the recommended scalable target. | Deployment plan includes both a minimum viable option and preferred production option. |
| A-007 | Public product IDs in the frontend may be stable slugs, while backend may retain numeric internal IDs. | Backend should expose `publicId`/`slug` fields and never require customers to know internal IDs. |
| A-008 | Payment proof files are staff-only/private; product images and customer-facing logo/hero assets may be public. | Upload routes need separate authorization behavior. |

## 4. Product Overview

Costume Rental supports public self-service discovery and staff-controlled rental operations.

Customer surfaces:

| Route | Current frontend status | Backend requirement |
|---|---|---|
| `/` | Implemented customer home with hero, date search, articles, testimonials, and CTA into `/catalogue`. | Serve settings/home content and public brand data from backend. |
| `/catalogue` | Implemented URL-backed search, date range, filters, favorites, lazy product grid, and batched availability calls. | Provide public catalogue list, filters, pagination, and availability endpoints. |
| `/costumes/:productId` | Implemented gallery, favorite toggle, variant selection, month availability, and add-to-request gating. | Provide product detail by stable public ID and month availability data. |
| `/checkout` | Implemented full route and route-backed modal/sheet with contact, fulfillment, review, submit locking, and stock revalidation through adapter. | Create booking requests idempotently after server-side availability validation. |
| `/lookup` | Implemented reference plus phone lookup, safe not-found state, forgot-code recovery, and customer change requests. | Provide safe lookup, recovery, and change-request endpoints without exposing unrelated data. |

Staff surfaces:

| Route | Current frontend status | Backend requirement |
|---|---|---|
| `/admin/login` | Implemented local staff session placeholder. | Replace with JWT-backed staff/admin login and session refresh/me checks. |
| `/admin/requests` | Implemented pending queue, filters, sort, add request, accept, edit, reject, stale markers, mobile detail. | Persist requested bookings, validate edits, create activity logs, and manage holds. |
| `/admin/rentals` | Implemented lifecycle workflow, checklist, payment/delivery editing, proof upload/review, completion gate, admin override. | Persist lifecycle transitions, proof files, payment status, locks, and audit history. |
| `/admin/catalogue` | Implemented product create/edit, active state, media, variants, stock, maintenance blocks, validation, save states. | Persist product, image, variant, and maintenance data; clear availability cache after writes. |
| `/admin/clients` | Implemented client search by name/phone/normalized phone, add/edit, contact details, WhatsApp links, rental history. | Persist clients and link booking/rental history by normalized phone/client ID. |
| `/admin/settings` | Implemented brand, policy, public catalogue toggle, proof requirement toggle, and home content editor. | Persist settings and expose safe public subset. |
| Header notifications | Implemented popover with active notifications linking to staff context. | Generate operational notifications and metrics from backend events. |

## 5. Problem Statement

The frontend now models the desired customer and staff product, but the live backend is still an older staff-focused API. It lacks several core production requirements:

- No persisted public booking request endpoint matching `frontend-v2` checkout behavior.
- No backend customer lookup by reference plus phone.
- No safe forgot-reference recovery endpoint.
- No persisted customer change-request workflow.
- No variant table with per-variant stock; existing backend mostly uses costume-level `Quantity`.
- No complete lifecycle enum for requested, confirmed, preparing, ready pickup, out delivery, on rent, returned, completed, rejected, and cancelled.
- No separate payment proof status, private payment proof file storage, or completion gate.
- No activity log table for staff edits and lifecycle events.
- No completed-rental lock or admin override reason enforcement.
- No deployment plan for `frontend-v2` as the production frontend.
- No production backup, restore, observability, rollback, rate limit, or secrets plan.

## 6. Goals and Non-Goals

### Goals

| ID | Goal | Success criteria |
|---|---|---|
| G-001 | Wire `frontend-v2` to live backend data. | Local/mock adapter can be replaced by HTTP adapter without losing current UI behavior. |
| G-002 | Support public customer browsing and booking requests. | Anonymous users can browse, check availability, submit requests, and receive references. |
| G-003 | Enforce variant-aware availability server-side. | Double booking is blocked by backend validation for customer submit and staff save. |
| G-004 | Support staff request review and rental lifecycle. | Staff can accept, edit, reject, prepare, release, return, and complete rentals with logs. |
| G-005 | Support offline payment proof and completion gate. | Completion is blocked until proof is verified when `requireVerifiedProof` is true. |
| G-006 | Protect public and staff data separately. | Public APIs never expose unrelated customer/staff/internal data. |
| G-007 | Deploy safely. | App has documented local, staging, production, CI/CD, backup, restore, monitoring, and rollback flows. |

### Non-Goals

| ID | Non-goal | Reason |
|---|---|---|
| NG-001 | Customer account registration/login. | MVP is guest-first by name, phone, reference. |
| NG-002 | Online payments or automatic QRIS reconciliation. | Payments are staff-recorded offline. |
| NG-003 | Gosend API integration. | Delivery remains staff-arranged/manual in MVP. |
| NG-004 | Multi-branch inventory. | Single boutique MVP keeps data model simpler. |
| NG-005 | Full AI features inside the product. | This PRD is for AI-assisted development, not app AI functionality. |
| NG-006 | Large frontend redesign. | `frontend-v2` is already the target UI. |

## 7. Target Users and Personas

| Persona | Needs | Key permissions |
|---|---|---|
| Anonymous visitor | Browse costumes, search by date, inspect details, build request. | Public catalogue, public availability, public settings. |
| Customer/contact | Submit booking, lookup by reference plus phone, request cancellation/reschedule/change. | Public booking request, safe lookup, safe recovery, change request. |
| Staff | Manage daily rental operations, contact customers, update catalogue, handle payments and returns. | Staff-authenticated CRUD and workflow actions except admin-only overrides. |
| Admin | Manage staff operations plus sensitive corrections. | All staff actions plus completed-rental override, user management, and high-risk settings. |
| DevOps/owner | Deploy, backup, monitor, restore, and rollback. | Environment, logs, health, database, storage, secrets, deployments. |

## 8. User Stories

| ID | User story | Priority | Acceptance criteria |
|---|---|---|---|
| US-001 | As a visitor, I can search costumes by date and filters so I only see relevant stock. | Must Have | Public catalogue returns active products, filters, pagination, and selected-range availability without login. |
| US-002 | As a customer, I can submit a booking request without an account. | Must Have | Name and phone are required; email optional; backend revalidates stock; response returns reference. |
| US-003 | As a customer, I can choose pickup or staff-arranged delivery. | Must Have | Pickup requires pickup and return windows; delivery requires address, delivery window, and return window. |
| US-004 | As a customer, I can look up my booking with reference plus phone. | Must Have | Matching lookup returns only that booking summary; failed lookup uses safe generic not-found behavior. |
| US-005 | As a customer who forgot my code, I can request staff help without exposing whether a booking exists. | Must Have | Public response is generic; staff notification/recovery record is created. |
| US-006 | As a customer, I can request cancellation, reschedule, item, or contact changes. | Must Have | Change request creates staff-visible record/notification and does not mutate booking directly. |
| US-007 | As staff, I can see requested bookings in a queue. | Must Have | Queue supports tab/filter/sort/deep link and highlights stale requests. |
| US-008 | As staff, I can accept, edit, or reject requested bookings. | Must Have | Accept moves to `confirmed`; reject requires reason and releases hold; edit revalidates availability. |
| US-009 | As staff, I can progress accepted rentals through lifecycle steps. | Must Have | Transitions are persisted, logged, and constrained by lifecycle rules. |
| US-010 | As staff, I can attach, verify, or reject payment proof. | Must Have | Image/PDF proof is private; size/type limits enforced; reject requires reason; actions logged. |
| US-011 | As staff, I cannot complete a rental without verified proof when required. | Must Have | Completion endpoint rejects invalid state with clear error. |
| US-012 | As admin, I can override a completed rental with a reason. | Must Have | Override requires admin role, target lifecycle, reason, and activity log. |
| US-013 | As staff, I can manage product variants and maintenance blocks. | Must Have | Variant stock and blocks affect public availability immediately after save. |
| US-014 | As staff, I can edit settings and home content. | Should Have | Public brand/home data updates after save without exposing internal settings. |
| US-015 | As DevOps, I can deploy to staging and production. | Must Have | CI/CD, env vars, health checks, backups, logs, and rollback are documented and tested. |

## 9. Core User Flows

### Public Search and Booking

1. Visitor opens `/`.
2. Visitor enters query and rental dates.
3. Frontend navigates to `/catalogue?search=1&q=...&start=...&end=...`.
4. Frontend calls public catalogue API with filters.
5. Frontend calls batched public availability API for visible products.
6. Customer opens `/costumes/:productId`.
7. Frontend loads product detail and one month availability window.
8. Customer selects available variant and adds to request cart.
9. Customer opens `/checkout`.
10. Customer enters name, phone, optional email, fulfillment, windows/address, and notes.
11. Backend validates stock, creates `requested` booking, creates or links client, holds stock by lifecycle, creates notification/activity log, and returns reference.

### Customer Lookup and Change Request

1. Customer opens `/lookup`.
2. Customer submits reference plus phone.
3. Backend normalizes phone and returns safe booking summary only if both match.
4. Customer submits change type and notes.
5. Backend creates `customer_change_request` and staff notification; booking remains unchanged.

### Forgot Reference Recovery

1. Customer submits phone plus optional name and hint.
2. Backend stores recovery request and creates staff notification.
3. Public API always returns the same generic success response.
4. Staff opens `/admin/clients?phone=...` or linked recovery context to follow up manually.

### Staff Request Review

1. Staff logs in at `/admin/login`.
2. Staff opens `/admin/requests`.
3. Backend returns only `requested` bookings with filters and stale metadata.
4. Staff accepts, edits, or rejects.
5. Backend logs action, updates lifecycle, validates stock, and clears availability cache.

### Rental Workflow

1. Accepted rental appears in `/admin/rentals`.
2. Staff edits payment/delivery planning while allowed.
3. Staff marks ready, releases to customer, marks returned, then completes.
4. `returned` releases inventory but keeps the rental open until payment proof is verified.
5. `completed` locks normal edits.

### Catalogue and Variant Management

1. Staff opens `/admin/catalogue`.
2. Staff edits product details, media, active state, variants, and maintenance blocks in local draft.
3. Staff saves explicitly.
4. Backend validates at least one variant, unique labels, stock not below active holds, image limits, and maintenance dates.
5. Backend persists changes and invalidates availability cache.

## 10. Feature Requirements

### Must Have

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-001 | Public catalogue must be available without auth. | Anonymous request to public catalogue succeeds when public catalogue setting is enabled. |
| FR-002 | Public product detail must use stable public product IDs/slugs. | `/costumes/:productId` can load product details without numeric internal IDs. |
| FR-003 | Public availability must be batched and bounded. | Range over 62 days returns `400`; per-cell requests are not required by frontend. |
| FR-004 | Checkout must create `requested` bookings. | Response includes `reference`, lifecycle `requested`, selected items, dates, and fulfillment summary. |
| FR-005 | Checkout must be idempotent. | Repeated submit with same idempotency key returns the same booking or safe duplicate response. |
| FR-006 | Booking lookup must require reference plus phone. | Reference-only or phone-only lookup is rejected. |
| FR-007 | Forgot-reference recovery must be non-enumerating. | Response does not reveal whether the phone/hints matched a booking. |
| FR-008 | Customer change requests must be staff-reviewed. | API creates a change request and notification, not a direct rental mutation. |
| FR-009 | Staff request queue must support filters and deep links. | Query params for reference, tab, fulfillment, payment, sort, and search are honored. |
| FR-010 | Staff accept/reject/edit must create activity logs. | Each action creates an activity log row visible on rental detail. |
| FR-011 | Variant stock must drive availability. | Availability uses variant totals, held/blocking bookings, and maintenance blocks. |
| FR-012 | Returned rentals must release inventory but remain financially open. | Returned rentals do not block stock and still appear in returned-open alerts if proof is not verified. |
| FR-013 | Completion must require verified proof when setting is enabled. | Completion endpoint returns `409` until `paymentProofStatus=verified`. |
| FR-014 | Completed rentals must be locked. | Normal staff edits to completed rentals return `403` or `409`; admin override requires reason. |
| FR-015 | Product images and payment proof files must be separated by access rules. | Public images can be served; payment proof requires staff/admin auth. |
| FR-016 | Settings must persist brand, policy, public catalogue toggle, proof requirement, locale, and home content. | Refreshing app retains updated settings. |

### Should Have

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-101 | Staff notifications should be generated from backend events. | New request, stale request, returned-open, rejected proof, and recovery request appear in popover. |
| FR-102 | Stale request age should be configurable. | Default is 24 hours; setting can be changed by admin. |
| FR-103 | Public catalogue should support server-side sorting. | Relevance, price asc, price desc, and availability sort are supported. |
| FR-104 | Admin metrics should be provided by backend. | Request/rental metrics match frontend metric tiles. |
| FR-105 | Backend should expose OpenAPI documentation. | Generated docs or checked-in endpoint spec exists for AI agents and QA. |

### Could Have

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-201 | Cloud object storage for uploads. | Storage adapter can switch from local volume to S3/R2 without changing API contract. |
| FR-202 | Email/WhatsApp notification hooks. | Backend can enqueue outbound messages, but no direct provider integration is required in MVP. |
| FR-203 | Feature flags. | Public catalogue and proof requirement already use settings; additional flags can follow same pattern. |

### Won't Have Yet

| ID | Requirement | Reason |
|---|---|---|
| FR-301 | Payment gateway. | Offline payments are MVP. |
| FR-302 | Customer accounts. | Reference plus phone lookup is MVP. |
| FR-303 | Delivery provider API. | Delivery remains manual/Gosend notes. |
| FR-304 | Multi-location inventory. | Single boutique MVP. |

## 11. AI Feature Requirements

Not applicable for in-product AI features.

AI-assisted development is expected. Implementation agents must follow this PRD, the existing frontend PRD, `design-system/MASTER.md`, page-specific design-system files, and acceptance docs. Generated code must preserve current frontend UX, replace mock adapter behavior with backend HTTP contracts incrementally, and add tests before marking backend work complete.

## 12. Frontend Requirements

The frontend is already implemented and must be treated as the behavioral contract unless a backend constraint requires a documented change.

### Completed Frontend Scope

| Area | Completed behavior |
|---|---|
| Routing | `/`, `/catalogue`, `/costumes/:productId`, `/checkout`, `/lookup`, `/admin/login`, `/admin/:section`. |
| Customer home | Hero, date search, catalogue CTA, article cards, testimonials, cart button, language toggle. |
| Catalogue | URL-backed search/filters/sort/date range/favorites, lazy grid, batched visible-product availability. |
| Product detail | Gallery, thumbnails, favorite toggle, variant picker, one-month calendar, add-to-request gating. |
| Cart/checkout | Persistent request cart, quantity/remove, direct checkout route, route-backed modal, contact/fulfillment/review steps, submit locking. |
| Lookup | Reference plus phone lookup, safe not-found copy, recovery form, change request form. |
| Admin shell | Sidebar/sheet navigation, mobile tab bar, notification popover, metrics, locale toggle, logout. |
| Requests | Queue tabs, filters, sort, add request, accept/edit/reject, stale markers, desktop/mobile detail. |
| Rentals | Lifecycle workflow, next action, manual transitions, checklist, payment/delivery editing, proof panel, completion lock, admin override. |
| Catalogue admin | Product create/edit, active toggle, details/media/variants/maintenance tabs, validation, save/discard. |
| Clients | Search by name/phone/normalized phone, add/edit, detail, WhatsApp/tel link, rental history. |
| Settings | Brand, taglines, policy, public catalogue toggle, require proof toggle, home content editor. |

### Frontend Integration Requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FE-001 | Replace `createLocalDataAdapter` with HTTP-backed adapter behind the same feature boundary. | Pages should not directly scatter raw `fetch` calls. |
| FE-002 | Preserve local cart and favorites. | Cart/favorites may remain in local storage; server stores only submitted bookings. |
| FE-003 | Frontend must use backend enum values exactly. | Lifecycle, payment, fulfillment, availability, and change type values match backend contract. |
| FE-004 | Frontend must map labels through existing copy dictionaries. | Raw enum strings are not displayed. |
| FE-005 | Frontend must show backend validation errors near the relevant forms. | Stock changed, invalid date, unauthorized, and upload errors are visible and actionable. |
| FE-006 | Staff login must use backend JWT. | Local placeholder session is replaced by real login/me/logout flow. |
| FE-007 | Frontend must preserve mobile-first design-system rules. | No horizontal overflow at 320px; touch targets remain at least 44px. |
| FE-008 | Public API calls must include abort/debounce behavior already implemented. | Search/filter requests cancel stale requests and do not mutate records. |

## 13. Backend Requirements

### Architecture

| Area | Requirement |
|---|---|
| Style | Single Go/Gin API service with clear services, handlers, DTOs, models, middleware, and storage modules. |
| ORM | Continue GORM. Use versioned migrations or controlled AutoMigrate with migration verification. |
| Local database | SQLite remains supported for development and demo. |
| Production database | Prefer PostgreSQL for public production; SQLite is allowed only for a low-traffic single-node MVP with backups and write-concurrency monitoring. |
| Auth | JWT access tokens for staff/admin; password hashes with bcrypt; role claims checked server-side. |
| Public APIs | Use `/api/public/*` or equivalent clear namespace for anonymous customer endpoints. |
| Staff APIs | Use `/api/admin/*` or equivalent clear namespace for protected operations. |
| Error shape | Return consistent JSON errors with `code`, `message`, and optional `fields`. |
| Logging | Structured logs for requests, auth events, uploads, workflow transitions, and errors. |
| Rate limiting | Apply stricter limits to login, lookup, recovery, booking submit, and upload routes. |

### Services and Modules

| Module | Responsibilities |
|---|---|
| Auth service | Login, logout/token invalidation where supported, current user, role checks, password management. |
| Public catalogue service | Active product listing, product detail DTOs, filters, public settings, public image URLs. |
| Availability service | Batched stock calculation, next availability search, cache, invalidation. |
| Booking request service | Customer/staff request creation, idempotency, client matching, stock validation, reference generation. |
| Rental workflow service | Accept/reject/edit/transition/override rules, lifecycle locks, inventory release rules. |
| Payment proof service | Private upload, proof metadata, verify/reject, completion gate. |
| Client service | Client CRUD, normalized phone matching, rental history. |
| Catalogue admin service | Product, variant, image, maintenance block CRUD and validation. |
| Settings service | Brand/settings/home-content persistence and public/private DTO split. |
| Notification service | Operational notification generation and popover list data. |
| Activity log service | Append-only event log for meaningful staff/customer/system actions. |
| Storage service | Public image storage and private proof storage with local-volume adapter first. |

### Authorization Model

| Role/scope | Allowed |
|---|---|
| Anonymous | Public settings, public catalogue, public product detail, public availability, booking submit, booking lookup, recovery submit, change-request submit. |
| Customer lookup user | Only the specific booking summary after reference plus phone match; no token or admin access. |
| Staff | Admin request/rental/catalogue/client/settings operations except admin-only override/user management if separated. |
| Admin | Staff operations plus completed-rental override, user management, high-risk configuration. |

Backend must never rely on frontend route guards as the only protection.

## 14. Data Model

### Core Entities

| Entity | Required fields |
|---|---|
| `users` | `id`, `name`, `email` or `username`, `password_hash`, `role` (`staff`, `admin`), `active`, `last_login_at`, timestamps. |
| `settings` | `key`, `value`, or a typed app settings table/JSON document for brand, taglines, policy, locale, public catalogue, proof requirement, home content, stale hours. |
| `regions` | `id`, `name`, timestamps. |
| `categories` | `id`, `name`, timestamps. |
| `costumes` | `id`, `public_id`, `name`, `meta`, `description_json`, `region_id`, `category_id`, `region_slug`, `category_slug`, `gender`, `unit_key`, `price_idr`, `active`, `cover_image_id`, timestamps. |
| `costume_images` | `id`, `costume_id`, `storage_key`, `public_url`, `alt`, `label`, `is_cover`, `mime_type`, `size_bytes`, timestamps. |
| `costume_variants` | `id`, `costume_id`, `public_id`, `label`, `total_quantity`, `notes_json`, `sort_order`, timestamps. |
| `availability_blocks` | `id`, `costume_id`, `variant_id nullable`, `start_date`, `end_date`, `reason`, `created_by`, timestamps. |
| `clients` | `id`, `name`, `phone`, `normalized_phone`, `email`, `address`, `notes`, `last_contact_at`, timestamps. |
| `rental_orders` | `id`, `reference`, `client_id`, `source`, `lifecycle_status`, `payment_method`, `payment_proof_status`, `fulfillment`, `rent_start`, `rent_end`, `pickup_window`, `return_window`, `delivery_window`, `address`, `notes`, `internal_notes`, `delivery_fee_idr`, `discount_idr`, `late_fee_idr`, `damage_fee_idr`, `total_snapshot_idr`, `created_by`, timestamps. |
| `rental_order_items` | `id`, `rental_order_id`, `costume_id`, `variant_id`, `quantity`, `price_snapshot_idr`, timestamps. |
| `payment_proofs` | `id`, `rental_order_id`, `storage_key`, `original_filename`, `mime_type`, `size_bytes`, `status`, `uploaded_by`, `verified_by`, `rejection_reason`, timestamps. |
| `preparation_checklist_items` | `id`, `rental_order_id`, `key`, `label_id`, `label_en`, `done`, timestamps. |
| `activity_logs` | `id`, `rental_order_id`, `actor_type`, `actor_id nullable`, `event_type`, `text_id`, `text_en`, `metadata_json`, `created_at`. |
| `customer_change_requests` | `id`, `rental_order_id`, `reference`, `normalized_phone`, `change_type`, `notes`, `status`, timestamps. |
| `lookup_recovery_requests` | `id`, `normalized_phone`, `name_hint`, `booking_hint`, `status`, timestamps. |
| `notifications` | `id`, `tone`, `title_id`, `title_en`, `copy_id`, `copy_en`, `target_route`, `event_type`, `resolved`, timestamps. |
| `idempotency_keys` | `id`, `key`, `scope`, `request_hash`, `response_reference`, `expires_at`, timestamps. |

### Enum Values

| Field | Values |
|---|---|
| `lifecycle_status` | `requested`, `confirmed`, `preparing`, `ready_pickup`, `out_delivery`, `on_rent`, `returned`, `completed`, `rejected`, `cancelled` |
| `payment_method` | `cash`, `bank_transfer`, `qris`, `other` |
| `payment_proof_status` | `missing`, `attached`, `verified`, `rejected` |
| `fulfillment` | `pickup`, `delivery` |
| `availability_state` | `available`, `partially_booked`, `fully_booked`, `unavailable` |
| `change_type` | `cancel`, `reschedule`, `items`, `contact` |
| `notification_tone` | `info`, `warning`, `danger`, `success` |
| `source` | `customer`, `staff` |

### Data Model Business Rules

| ID | Rule |
|---|---|
| DM-001 | `reference` must be unique, stable, and customer-safe, formatted like `CR-0146`. |
| DM-002 | `normalized_phone` must be indexed and derived consistently from phone input. |
| DM-003 | Internal numeric IDs may exist, but public DTOs must expose `publicId`/slug and references. |
| DM-004 | `rental_order_items.price_snapshot_idr` must preserve historical price after product price changes. |
| DM-005 | At least one active or inactive variant must exist per costume; deleting the last variant is blocked. |
| DM-006 | Variant `total_quantity` cannot be lowered below active blocking holds. |
| DM-007 | Activity logs are append-only for business events. |
| DM-008 | Payment proof files are not exposed through public upload routes. |

## 15. API Requirements

### API Response Standards

Success responses:

```json
{
  "data": {},
  "meta": {}
}
```

Error responses:

```json
{
  "error": {
    "code": "stock_unavailable",
    "message": "Selected item is no longer available.",
    "fields": {
      "items[0].variantId": "Insufficient stock"
    }
  }
}
```

### Public API Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/public/settings` | Public brand, locale, policy, home content, public catalogue setting. | None |
| `GET` | `/api/public/catalogue` | List active public products with search, filters, sort, pagination. | None |
| `GET` | `/api/public/costumes/:publicId` | Product detail by stable public ID. | None |
| `GET` | `/api/public/availability` | Batched day availability by product IDs, variant IDs, date range. | None |
| `GET` | `/api/public/availability/next` | Next available window, capped at 90 days. | None |
| `POST` | `/api/public/booking-requests` | Create customer booking request from checkout. | None |
| `POST` | `/api/public/bookings/lookup` | Lookup by reference plus phone. | None |
| `POST` | `/api/public/bookings/:reference/change-requests` | Customer cancellation/reschedule/item/contact request. | None plus phone verification |
| `POST` | `/api/public/lookup-recovery` | Forgot-reference recovery request. | None |

#### Public Catalogue Query

| Query param | Type | Notes |
|---|---|---|
| `q` | string | Search product name/meta/category/region. |
| `region` | string | Slug or `all`. |
| `type` | string | Category slug or `all`. |
| `gender` | enum | `women`, `men`, `unisex`, `kids`, or `all`. |
| `minPrice` | integer | IDR minimum. |
| `maxPrice` | integer | IDR maximum. |
| `sort` | enum | `relevance`, `price_asc`, `price_desc`, `availability`. |
| `start` | date | `YYYY-MM-DD`; required when sorting by availability. |
| `end` | date | `YYYY-MM-DD`; required when sorting by availability. |
| `page` | integer | Default 1. |
| `pageSize` | integer | Default 24, max 96. |

#### Public Availability Rules

| Rule | Requirement |
|---|---|
| Window cap | `start` to `end` cannot exceed 62 days. |
| Next search cap | `duration_days` and search horizon cannot exceed 90 days. |
| Cache | Public availability may cache 30-60 seconds by product IDs, variant IDs, start, end. |
| Privacy | Response exposes only `date`, `productId`, `variantId`, `total`, `booked`, `available`, `state`. |
| Blocking statuses | `requested`, `confirmed`, `preparing`, `ready_pickup`, `out_delivery`, `on_rent`. |
| Released statuses | `returned`, `completed`, `rejected`, `cancelled`. |

Availability response:

```json
{
  "data": {
    "start": "2026-06-12",
    "end": "2026-06-15",
    "cacheTtlSeconds": 45,
    "days": [
      {
        "date": "2026-06-12",
        "productId": "batik",
        "variantId": "M",
        "total": 4,
        "booked": 1,
        "available": 3,
        "state": "partially_booked"
      }
    ]
  }
}
```

#### Create Booking Request

Request:

```json
{
  "customer": {
    "name": "Maya Saputra",
    "phone": "+62 812 0000 0142",
    "email": "maya@example.com"
  },
  "fulfillment": "pickup",
  "pickupWindow": "10.00-12.00",
  "returnWindow": "16.00-18.00",
  "deliveryWindow": "",
  "address": "",
  "notes": "Butuh ukuran nyaman.",
  "items": [
    {
      "productId": "batik",
      "variantId": "M",
      "quantity": 1,
      "start": "2026-06-12",
      "end": "2026-06-15"
    }
  ]
}
```

Headers:

| Header | Requirement |
|---|---|
| `Idempotency-Key` | Recommended for checkout submit; required for robust duplicate prevention. |

Response:

```json
{
  "data": {
    "reference": "CR-0146",
    "lifecycle": "requested",
    "paymentStatus": "missing",
    "fulfillment": "pickup",
    "start": "2026-06-12",
    "end": "2026-06-15",
    "items": []
  }
}
```

### Staff/Admin API Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Staff/admin login. | None |
| `GET` | `/api/auth/me` | Current user/session. | Staff/Admin |
| `POST` | `/api/auth/logout` | Logout/token invalidation where supported. | Staff/Admin |
| `GET` | `/api/admin/requests` | Requested booking queue. | Staff/Admin |
| `POST` | `/api/admin/requests` | Create staff-entered requested booking. | Staff/Admin |
| `PATCH` | `/api/admin/requests/:reference` | Edit requested booking. | Staff/Admin |
| `POST` | `/api/admin/requests/:reference/accept` | Move requested to confirmed. | Staff/Admin |
| `POST` | `/api/admin/requests/:reference/reject` | Reject with required reason. | Staff/Admin |
| `GET` | `/api/admin/rentals` | List non-request operational rentals. | Staff/Admin |
| `GET` | `/api/admin/rentals/:reference` | Rental detail. | Staff/Admin |
| `PATCH` | `/api/admin/rentals/:reference` | Edit allowed rental planning/payment fields. | Staff/Admin |
| `POST` | `/api/admin/rentals/:reference/transition` | Lifecycle transition. | Staff/Admin |
| `POST` | `/api/admin/rentals/:reference/override` | Reopen completed rental with reason. | Admin |
| `POST` | `/api/admin/rentals/:reference/payment-proof` | Upload proof image/PDF. | Staff/Admin |
| `POST` | `/api/admin/rentals/:reference/payment-proof/verify` | Verify attached proof. | Staff/Admin |
| `POST` | `/api/admin/rentals/:reference/payment-proof/reject` | Reject attached proof with reason. | Staff/Admin |
| `GET` | `/api/admin/catalogue` | Admin product list. | Staff/Admin |
| `POST` | `/api/admin/catalogue` | Create product with first variant. | Staff/Admin |
| `PATCH` | `/api/admin/catalogue/:publicId` | Save product draft. | Staff/Admin |
| `POST` | `/api/admin/catalogue/:publicId/images` | Upload product image. | Staff/Admin |
| `DELETE` | `/api/admin/catalogue/:publicId/images/:imageId` | Delete product image. | Staff/Admin |
| `GET` | `/api/admin/clients` | List/search clients. | Staff/Admin |
| `POST` | `/api/admin/clients` | Create client. | Staff/Admin |
| `PATCH` | `/api/admin/clients/:id` | Update client. | Staff/Admin |
| `GET` | `/api/admin/clients/:id/rentals` | Rental history. | Staff/Admin |
| `GET` | `/api/admin/settings` | Full settings. | Staff/Admin |
| `PATCH` | `/api/admin/settings` | Save settings. | Staff/Admin |
| `GET` | `/api/admin/notifications` | Active operational notifications. | Staff/Admin |
| `GET` | `/api/admin/metrics` | Dashboard/request/rental metrics. | Staff/Admin |

### API Validation Rules

| ID | Rule |
|---|---|
| API-001 | Dates must use `YYYY-MM-DD`; end must be on or after start. |
| API-002 | Customer booking dates cannot be in the past relative to server date. |
| API-003 | Name must be at least 2 characters for booking submit. |
| API-004 | Phone must normalize to at least 8 digits. |
| API-005 | Email is optional but must be valid if provided. |
| API-006 | Delivery bookings require address, delivery window, and return window. |
| API-007 | Pickup bookings require pickup window and return window. |
| API-008 | Quantity must be at least 1 and no greater than available variant stock. |
| API-009 | Staff edits must revalidate availability excluding the rental being edited. |
| API-010 | Rejecting request or proof requires a non-empty reason. |
| API-011 | Admin override requires admin role, target lifecycle, and reason. |
| API-012 | Uploads must enforce file type and size limits. |

## 16. Business Rules

### Inventory and Availability

| ID | Rule |
|---|---|
| BR-001 | Pending `requested` bookings hold inventory. |
| BR-002 | Blocking lifecycle statuses are `requested`, `confirmed`, `preparing`, `ready_pickup`, `out_delivery`, and `on_rent`. |
| BR-003 | Released lifecycle statuses are `returned`, `completed`, `rejected`, and `cancelled`. |
| BR-004 | Maintenance/unavailable blocks reduce availability for their overlapping date ranges. |
| BR-005 | Public availability must aggregate stock and must not expose customer or rental details. |
| BR-006 | Availability cache must be invalidated after booking submit, staff rental edit, lifecycle release, catalogue variant edit, and maintenance block edit. |

### Rental Lifecycle

| From | Allowed next states |
|---|---|
| `requested` | `confirmed`, `rejected`, `cancelled` |
| `confirmed` | `preparing`, `ready_pickup`, `cancelled` |
| `preparing` | `ready_pickup`, `cancelled` |
| `ready_pickup` | `on_rent` for pickup, `out_delivery` for delivery, `preparing` for correction |
| `out_delivery` | `on_rent`, `returned`, `ready_pickup` for correction |
| `on_rent` | `returned`, `ready_pickup` for correction |
| `returned` | `completed` only when completion gate passes |
| `completed` | No normal transitions; admin override can reopen to selected lifecycle |
| `rejected` | No normal transitions |
| `cancelled` | No normal transitions |

### Payment Proof

| ID | Rule |
|---|---|
| PAY-001 | Payment method supports `cash`, `bank_transfer`, `qris`, and `other`. |
| PAY-002 | Proof status starts as `missing`. |
| PAY-003 | Uploading proof sets status to `attached`. |
| PAY-004 | Verifying proof sets status to `verified`. |
| PAY-005 | Rejecting proof sets status to `rejected` and requires a reason. |
| PAY-006 | If `requireVerifiedProof` is true, `completed` is blocked unless proof is `verified`. |
| PAY-007 | Returned but unverified rentals remain in staff metrics/notifications. |

### Customer Safety

| ID | Rule |
|---|---|
| SAFE-001 | Booking lookup must match both reference and normalized phone. |
| SAFE-002 | Failed lookup must not reveal whether reference or phone was wrong. |
| SAFE-003 | Forgot-reference recovery must always return generic success. |
| SAFE-004 | Public endpoints must not return staff notes, internal notes, payment proof files, activity log internals, or unrelated client data. |
| SAFE-005 | Customer change requests must create staff work; they must not mutate booking details directly. |

## 17. Deployment and Infrastructure

### Environments

| Environment | Purpose | Required services |
|---|---|---|
| Local | Developer work and AI agent implementation. | `frontend-v2` Vite, Go API, local SQLite, local uploads. |
| Development | Shared smoke environment if needed. | Docker Compose, seeded data, non-production secrets. |
| Staging | Production-like validation. | Built frontend, API container, production-like DB, persistent uploads, TLS, monitoring. |
| Production | Live customer/staff app. | Built frontend, API container, DB, upload storage, reverse proxy, TLS, backups, monitoring. |

### Hosting Options

| Option | Recommendation | Notes |
|---|---|---|
| Single VPS with Docker Compose | Good MVP option. | Simple, low cost, supports Nginx/Caddy reverse proxy, volumes, backups. |
| Managed container platform | Good if deployment automation matters more. | Use managed PostgreSQL and object storage. |
| Static frontend plus separate API host | Good if API/database are managed elsewhere. | Requires correct CORS and asset/upload routing. |

### Production Architecture

Minimum viable production:

1. Reverse proxy with TLS terminates `https://domain`.
2. `frontend-v2` is built and served as static files.
3. `/api/*` proxies to Go backend.
4. Public product images are served from a public uploads route or CDN.
5. Payment proof files are served only through authenticated staff endpoints.
6. Database and uploads use persistent volumes.
7. Scheduled backups copy DB and uploads off-server.

Preferred production:

1. `frontend-v2` static build on CDN or Nginx.
2. Go API container behind reverse proxy.
3. Managed PostgreSQL.
4. Object storage for uploads, with public bucket/path for product images and private bucket/path for proof files.
5. Centralized logs and uptime/error monitoring.

### Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `APP_ENV` | Yes | `development`, `staging`, `production`. |
| `PORT` | Yes | Backend port, default `8080`. |
| `DATABASE_URL` | Preferred prod | PostgreSQL URL if using Postgres. |
| `DB_PATH` | SQLite | SQLite file path for local/single-node. |
| `JWT_SECRET` | Yes | Long random secret, not committed. |
| `JWT_EXPIRES_HOURS` | Yes | Default 24 or shorter in production. |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins. |
| `UPLOAD_DIR` | Local storage | Local upload path. |
| `PUBLIC_UPLOADS_BASE_URL` | Yes | Public product image base URL. |
| `PRIVATE_UPLOAD_DIR` | Yes | Private payment proof path if local. |
| `MAX_UPLOAD_BYTES` | Yes | Product image max size. |
| `MAX_PAYMENT_PROOF_BYTES` | Yes | Default should align with frontend current 700 KB or documented update. |
| `PUBLIC_AVAILABILITY_CACHE_TTL_SECONDS` | Yes | 30-60 seconds. |
| `STALE_REQUEST_HOURS` | Yes | Default 24. |
| `NOTIFICATION_DUE_DAYS` | Yes | Existing due-soon notification setting. |
| `VITE_API_BASE_URL` | Frontend build | Use `/api` for same-origin deployment. |
| `VITE_UPLOADS_URL` | Frontend build | Public image base path. |

### CI/CD Pipeline

| Stage | Required checks |
|---|---|
| Backend verify | `go test ./...`, `go vet ./...`, migration smoke test, API contract tests. |
| Frontend verify | `npm ci`, `npm run build` in `frontend-v2`. |
| Quality gates | `node scripts/quality-gate.mjs` and acceptance test integrity checks. |
| E2E | Playwright smoke for auth, public catalogue, booking, lookup, admin requests, rentals, payment proof. |
| Image build | Build backend and frontend images with immutable tags. |
| Staging deploy | Apply migrations, deploy, run health and smoke tests. |
| Production deploy | Deploy after staging pass, verify health, keep rollback artifact. |

### Backup and Restore

| Area | Requirement |
|---|---|
| Database backup | Daily automated backup minimum; before each production migration; retain at least 7 daily and 4 weekly copies. |
| Upload backup | Daily copy/sync of product images and private payment proof files. |
| Restore test | Monthly restore drill into staging or local environment. |
| Backup encryption | Required for backups containing payment proof or customer data. |
| SQLite note | If SQLite is used in production, backup must avoid corrupt hot copies; use SQLite backup API or stop/write-safe snapshot. |

### Observability and Alerting

| Signal | Requirement |
|---|---|
| Health | `/api/health` returns service and database status. |
| Logs | Structured logs for request ID, route, status, user ID where relevant, and error code. |
| Metrics | Request rate, latency, error rate, DB errors, upload errors, booking submit failures, availability cache hit rate. |
| Alerts | API down, DB unavailable, backup failed, high 5xx rate, disk near full, upload storage near full. |
| Audit | Staff lifecycle/payment/admin override actions must be auditable through activity logs. |

### Rollback Plan

| Scenario | Rollback action |
|---|---|
| Bad frontend build | Redeploy previous static artifact/image. |
| Bad backend image with no migration | Redeploy previous backend image. |
| Bad migration | Stop deploy, restore pre-migration backup, redeploy previous image. |
| Bad settings change | Admin reverts settings or restore settings backup if needed. |
| Upload/storage issue | Keep API read-only for uploads or disable upload actions until storage recovers. |

## 18. Security, Privacy, and Compliance

| ID | Requirement |
|---|---|
| SEC-001 | Passwords must be hashed with bcrypt or stronger. |
| SEC-002 | JWT secret must be required in production and never default. |
| SEC-003 | Staff/admin APIs must require valid JWT and role checks. |
| SEC-004 | Public lookup and recovery endpoints must be rate-limited. |
| SEC-005 | Login endpoint must be rate-limited and log failed attempts without exposing passwords. |
| SEC-006 | CORS must allow only configured origins in staging/production. |
| SEC-007 | Payment proof files must be private and accessible only to staff/admin. |
| SEC-008 | Product image upload must validate file type, extension, size, and generated filename. |
| SEC-009 | Payment proof upload must allow only image and PDF MIME types and enforce max size. |
| SEC-010 | Public APIs must not return internal notes, staff activity logs, user records, private upload paths, or full client data. |
| SEC-011 | Every mutation must validate input server-side, even if frontend already validates. |
| SEC-012 | Admin override, proof verification/rejection, request rejection, and lifecycle transitions must be logged. |
| SEC-013 | Backups containing customer data or proof files must be encrypted or stored in protected infrastructure. |

## 19. Analytics and Success Metrics

| Metric | Target |
|---|---|
| Public catalogue API p95 latency | Under 500 ms for common filter/search queries on MVP dataset. |
| Availability API p95 latency | Under 800 ms for 24 visible products across <= 62 days. |
| Booking submit success rate | At least 99 percent excluding intentional stock conflicts. |
| Duplicate booking incidents | Zero duplicate references from double submit. |
| Staff request resolution time | Stale request count visible; target less than 24 hours average review time. |
| Double-booking incidents | Zero known double bookings after backend validation launch. |
| Returned-open visibility | Returned but not completed rentals appear in metrics/notifications until proof verified. |
| Deployment recovery | Rollback can restore previous version within 15 minutes. |
| Backup success | Daily backup success rate 100 percent with alert on failure. |

## 20. Testing and QA

### Backend Tests

| Area | Required tests |
|---|---|
| Availability | Blocking/released statuses, variant quantities, maintenance blocks, 62-day cap, 90-day next search, cache invalidation. |
| Booking submit | Valid request, unavailable item, duplicate idempotency key, invalid dates, delivery required fields, client match/create. |
| Lookup | Match reference plus phone, failed lookup safe response, rate limiting. |
| Change/recovery | Creates staff-visible records and notifications without mutating bookings. |
| Request workflow | Accept, reject with reason, edit with revalidation, stale metadata. |
| Rental lifecycle | Allowed transitions, blocked transitions, returned releases stock, completed locks edits. |
| Payment proof | Upload size/type, private access, verify, reject with reason, completion gate. |
| Catalogue admin | Product save, variant add/delete, last variant block, stock below hold block, maintenance save. |
| Settings | Public/private DTO split, proof requirement toggle, public catalogue toggle. |
| Auth | Login, invalid login, role checks, expired/invalid JWT. |

### Frontend/Integration Tests

| Area | Required tests |
|---|---|
| Public catalogue | Search, filter, date range, product cards, availability badges, empty/loading/error states. |
| Product detail | Detail load by slug, variant selection, availability month fetch, add-to-request disabled/enabled states. |
| Checkout | Contact validation, fulfillment validation, stock changed response, submit locking, reference confirmation. |
| Lookup | Valid lookup, safe not-found, recovery success, change request success. |
| Admin requests | Queue filters, stale indicators, accept/edit/reject, staff-created request. |
| Admin rentals | Lifecycle actions, payment proof gate, returned-open metrics, completed lock, admin override. |
| Admin catalogue | Product save, image upload, variant validation, maintenance blocks. |
| Admin clients | Search normalized phone, add/edit, rental history. |
| Settings | Save settings and observe public/staff behavior changes. |
| Accessibility | Keyboard access, focus rings, labels, dialog/sheet behavior, color contrast. |
| Responsive | 320, 375, 768, 1024, and 1440 widths with no horizontal overflow. |

### Acceptance Sources to Add or Update

| File | Purpose |
|---|---|
| `docs/acceptance/CUSTOMER_CATALOGUE.md` | Public search/filter/availability behavior. |
| `docs/acceptance/CUSTOMER_BOOKING_REQUEST.md` | Checkout and booking submit. |
| `docs/acceptance/CUSTOMER_BOOKING_LOOKUP.md` | Lookup, recovery, change requests. |
| `docs/acceptance/ADMIN_BOOKING_QUEUE.md` | Request queue, stale, accept/edit/reject. |
| `docs/acceptance/ADMIN_RENTAL_LIFECYCLE.md` | Lifecycle, returned-open, completion lock. |
| `docs/acceptance/ADMIN_VARIANT_INVENTORY.md` | Variants, stock, maintenance, availability cache. |
| `docs/acceptance/ADMIN_PAYMENT_PROOF.md` | Upload, verify, reject, private files, completion gate. |
| `docs/acceptance/BACKEND_API_CONTRACT.md` | Public and admin API contracts. |
| `docs/acceptance/DEPLOYMENT.md` | Environments, CI/CD, backup, rollback, health. |

Existing regression acceptance for `AUTH`, `CATALOGUE`, `RENT`, `CLIENT`, `NOTIFICATION`, `SETTINGS`, `NAVIGATION`, and `API` must remain meaningful or be explicitly migrated to the redesigned route/API intent.

## 21. Release Plan

### Phase 1: Backend Contract and Schema

| Task | Exit criteria |
|---|---|
| Define API DTOs and error shape. | API contract doc and tests exist. |
| Add/modify database schema. | Migrations pass locally and preserve existing seed ability. |
| Add stable product public IDs and variants. | Public product detail can load by frontend `productId`/slug. |
| Add activity, notification, proof, change, recovery, and idempotency tables. | Tables exist and services can write them. |

### Phase 2: Public Customer APIs

| Task | Exit criteria |
|---|---|
| Public settings/catalogue/product APIs. | Frontend catalogue can read live data. |
| Availability API hardening. | Variant-aware, capped, cached, private-data-safe responses. |
| Booking request API. | Checkout creates persisted `requested` bookings. |
| Lookup/recovery/change APIs. | `/lookup` works with live backend safely. |

### Phase 3: Staff Workflow APIs

| Task | Exit criteria |
|---|---|
| JWT login/me/logout integration. | `/admin/login` uses backend auth. |
| Requests queue and actions. | Staff can accept/edit/reject live records. |
| Rentals workflow and payment proof. | Staff can transition, upload proof, verify/reject, complete, and override. |
| Notifications and metrics. | Header popover and metric tiles use backend data. |

### Phase 4: Admin Management APIs

| Task | Exit criteria |
|---|---|
| Catalogue product/variant/media/maintenance saves. | `/admin/catalogue` persists all draft edits. |
| Client CRUD/history. | `/admin/clients` persists search/add/edit/history. |
| Settings/home content. | `/admin/settings` persists and public routes consume settings. |

### Phase 5: Deployment and QA

| Task | Exit criteria |
|---|---|
| Update Docker Compose for `frontend-v2`. | Local/staging/prod compose targets run the correct frontend. |
| Add CI/CD pipeline. | Build/test/deploy flow documented and automated. |
| Add backup/restore scripts or runbook. | Restore is tested in staging/local. |
| Run full QA. | Backend, frontend, Playwright, accessibility, and deployment acceptance pass. |

## 22. AI-Assisted Development Instructions

Implementation agents must:

1. Treat this PRD and the existing frontend PRD as product requirements.
2. Read `design-system/MASTER.md` and relevant `design-system/pages/*.md` before touching frontend UI.
3. Preserve existing `frontend-v2` workflows and route behavior unless a documented backend contract change is approved.
4. Prefer adding an HTTP adapter that matches `data-adapter.js` semantics before refactoring pages.
5. Keep backend work aligned with existing Go/Gin/GORM patterns.
6. Add focused backend tests for every business rule before or with implementation.
7. Do not expose staff/private data through public DTOs.
8. Use stable enum values and label maps rather than hard-coded UI strings from backend flags.
9. Validate availability on the backend for checkout and staff edits.
10. Clear or bypass availability cache after stock-affecting mutations.
11. Keep migrations reversible or backed by pre-migration backups.
12. Update acceptance docs and Playwright/API tests as backend contracts go live.

Suggested implementation order:

1. Schema and migrations.
2. Public DTOs and settings/catalogue/product endpoints.
3. Availability service variant support.
4. Booking request creation and idempotency.
5. Lookup, recovery, and change requests.
6. Auth integration.
7. Staff requests and rentals workflow.
8. Payment proof private storage.
9. Catalogue/client/settings admin APIs.
10. Deployment, CI/CD, backup, and monitoring.

## 23. Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | Keep Go + Gin | Existing codebase and Dockerfile already use it. |
| ORM | Keep GORM | Existing models/services use it; can support SQLite and PostgreSQL. |
| Database local | SQLite | Simple local/dev path already exists. |
| Database production | PostgreSQL preferred; SQLite acceptable for low-traffic single-node MVP | PostgreSQL handles concurrent public writes better; SQLite is simpler but needs caution. |
| Frontend | Keep React/Vite `frontend-v2` | Already developed and audited. |
| Auth | JWT for staff/admin | Existing backend already uses JWT direction. |
| Public customer identity | Reference plus phone | Matches guest-first MVP and frontend. |
| Product public identity | Stable slug/public ID | Matches frontend string IDs and hides internal numeric IDs. |
| File storage | Local volume first, storage adapter ready for S3/R2 | Fast MVP while preserving migration path. |
| Payment | Offline staff-recorded proof | Matches product decisions and non-goals. |
| Delivery | Manual/Gosend notes only | Matches MVP. |

## 24. Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Double booking from concurrent requests | High | Use DB transactions, availability validation, and row-level locks or serializable transaction strategy for stock-affecting writes. |
| SQLite write contention in production | Medium/High | Use PostgreSQL for production where possible; if SQLite, single-node only with monitoring and backups. |
| Public lookup data leak | High | Require reference plus normalized phone; return safe not-found; rate limit. |
| Payment proof exposure | High | Separate private storage and authenticated proof download endpoints. |
| Frontend contract drift | Medium | Keep adapter boundary; add contract tests; update PRD/acceptance before changing UI behavior. |
| Stale requested bookings holding stock too long | Medium | Stale metrics/notifications and configurable warning hours. |
| Upload storage loss | High | Persistent volume/object storage plus daily backups and restore drills. |
| Migration failure | High | Pre-migration backup and rollback runbook. |
| Raw enum labels in UI | Low/Medium | Keep existing label maps and test status rendering. |
| Incomplete observability | Medium | Add health, logs, metrics, and deployment acceptance before production launch. |

## 25. Open Questions

| ID | Question | Owner |
|---|---|---|
| OQ-001 | Should production use PostgreSQL immediately, or ship first with SQLite on a single VPS? | Product/engineering |
| OQ-002 | What production domain and hosting provider should be used? | Owner/DevOps |
| OQ-003 | Confirm payment proof max size: keep current frontend 700 KB or raise to a larger production limit? | Product/engineering |
| OQ-004 | Confirm accepted proof file types: images and PDF only? | Product |
| OQ-005 | Confirm stale request warning age: 24 hours? | Product |
| OQ-006 | Confirm rental terms, cancellation policy, and reschedule policy copy. | Product |
| OQ-007 | Confirm whether staff role can verify payment proof or admin only. | Product |
| OQ-008 | Confirm whether staff can create users, or user management is admin-only. | Product |
| OQ-009 | Confirm whether public product IDs should be generated slugs or manually editable. | Engineering |
| OQ-010 | Confirm backup retention period required by the business. | Owner/DevOps |

## 26. Final Acceptance Criteria

The project is ready for production backend launch when all criteria below are met:

- Public customer routes consume live backend settings, catalogue, product detail, availability, booking, lookup, recovery, and change-request APIs.
- Customer checkout creates persisted `requested` bookings with idempotency and server-side stock validation.
- Booking lookup is safe and requires reference plus phone.
- Forgot-reference recovery never reveals booking existence.
- Customer change requests create staff-visible work and do not mutate bookings directly.
- Staff login uses backend JWT and role-based authorization.
- `/admin/requests` works with live requested bookings, filters, stale indicators, accept, edit, and reject.
- `/admin/rentals` works with live lifecycle transitions, checklist, payment/delivery editing, proof upload/review, completion gate, and admin override.
- `/admin/catalogue`, `/admin/clients`, and `/admin/settings` persist all currently implemented frontend edits.
- Variant-aware availability prevents double booking for customer submit and staff save.
- Returned rentals release stock but remain visible until payment proof is verified and completed.
- Completed rentals are locked from normal staff edits.
- Payment proof files are private and staff/admin-only.
- Public APIs do not expose internal notes, staff logs, proof files, or unrelated customer data.
- CI runs backend tests, frontend build, quality gate, and Playwright/API smoke tests.
- Staging and production deployment runbooks exist and are tested.
- Backups and restore procedure are tested.
- Health checks, logs, and alerts are configured.
- Rollback procedure is documented and tested.
- Assumptions and open questions above are resolved or explicitly accepted before production launch.

## 27. PRD Quality Checklist

| Check | Status |
|---|---|
| MVP scope is clear. | Passed |
| Must-have features are separated from later features. | Passed |
| Each major feature has acceptance criteria. | Passed |
| Completed frontend is documented. | Passed |
| Backend architecture is specified. | Passed |
| Data entities and APIs are specific enough for implementation. | Passed |
| Security and privacy are addressed. | Passed |
| Deployment, backup, monitoring, and rollback are addressed. | Passed |
| Testing and launch readiness are included. | Passed |
| Assumptions and open questions are explicit. | Passed |
| AI-specific risks are addressed where applicable. | Passed |
