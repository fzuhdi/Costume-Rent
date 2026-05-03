# Acceptance Criteria - Costume Rental Management

## AC → Feature → Spec File Mapping

| Feature ID | Feature Name | AC Range | Spec File |
|---|---|---|---|
| `AUTH` | Authentication | AC-001 to AC-003 | `test/specs/auth.spec.js` |
| `CATALOGUE` | Costume Management | AC-003 to AC-008 | `test/specs/catalogue.spec.js` |
| `RENT` | Rental System | AC-009 to AC-014 | `test/specs/rental.spec.js` |
| `CLIENT` | Client Management | AC-015 to AC-017 | `test/specs/clients.spec.js` |
| `NOTIFICATION` | Notifications | AC-018 to AC-020 | `test/specs/notifications.spec.js` |
| `SETTINGS` | Settings | AC-021 to AC-024 | `test/specs/settings.spec.js` |
| `NAVIGATION` | Navigation & UI | AC-025 to AC-027 | `test/specs/navigation.spec.js` |
| `API` | API Backend | AC-028 to AC-030 | `test/api/api.spec.js` |

> New ACs added in this revision: AC-031 to AC-042. These extend existing features with behaviour confirmed from source code review.

---

## 1. Authentication [AUTH]

### AC-001: User Login
- [ ] User can login with valid credentials (email: admin@busana.com, password: admin123)
- [ ] Invalid credentials show error message on screen (not just in console)
- [ ] Wrong email shows error message
- [ ] Empty form does not submit
- [ ] Successful login redirects to `/catalogue`
- [ ] Auth token is stored in localStorage after login
- [ ] User session persists across page refresh

### AC-002: User Logout
- [ ] Logout button visible in navbar when logged in
- [ ] Logout redirects to `/login`
- [ ] Auth token is removed from localStorage after logout
- [ ] After logout, navigating to `/catalogue` redirects to `/login`

### AC-003: Route Protection
- [ ] Unauthenticated access to `/catalogue` redirects to `/login`
- [ ] Unauthenticated access to `/rents` redirects to `/login`
- [ ] Unauthenticated access to `/clients` redirects to `/login`
- [ ] Unauthenticated access to `/settings` redirects to `/login`

---

## 2. Costume Management [CATALOGUE]

### AC-003: View Costume List
- [ ] Display all costumes in catalogue page
- [ ] Show costume name, image thumbnail, total quantity, and available quantity
- [ ] Available quantity is shown separately from total quantity
- [ ] Region and category labels are shown per costume
- [ ] Paginated list with pagination controls
- [ ] Empty state shown when no costumes match filters

### AC-004: Add New Costume
- [ ] Navigate to `/catalogue/new` via "Tambah Kostum" button
- [ ] Name field is required — empty name prevents submission
- [ ] Quantity field is required — minimum value is 1 (enforced by backend)
- [ ] Select region from dropdown (populated from `/api/regions`)
- [ ] Select category from dropdown (populated from `/api/categories`)
- [ ] Enter acquisition date
- [ ] Enter price
- [ ] Enter description
- [ ] Submit saves to database
- [ ] Redirect to catalogue or detail page after save

### AC-005: View Costume Detail
- [ ] Navigate to `/catalogue/:id`
- [ ] Display costume details: name, description, region, category, quantity, available quantity
- [ ] Display acquisition date if set
- [ ] Display price if set
- [ ] Display all uploaded images
- [ ] First uploaded image is shown as cover image
- [ ] Show edit button

### AC-006: Edit Costume
- [ ] Navigate to `/catalogue/:id/edit`
- [ ] Pre-populate form with existing data including region and category selection
- [ ] Save changes updates database
- [ ] Redirect to detail page after save
- [ ] Detail page reflects updated values

### AC-007: Delete Costume
- [ ] Delete button available on list or detail page
- [ ] Confirmation dialog before delete
- [ ] Cancelling confirmation does NOT delete the costume
- [ ] Confirming removes costume from database
- [ ] After deletion, costume no longer appears in list

### AC-008: Upload Costume Image
- [ ] Image upload button available on costume form or detail page
- [ ] Supports multiple image uploads
- [ ] First uploaded image automatically becomes the cover image
- [ ] Images display in detail page gallery
- [ ] Individual images can be deleted
- [ ] Deleting the cover image promotes the next available image as cover
- [ ] Deleting all images clears the cover image

---

## 3. Rental System [RENT]

### AC-009: View Rental List
- [ ] Navigate to `/rents`
- [ ] Display all rentals with status chip/badge
- [ ] Show client name, rent start, rent end dates
- [ ] Filter by status: all, active, returned, overdue
- [ ] Search by client name
- [ ] Page resets to 1 when search or filter changes

### AC-010: Create New Rental
- [ ] Navigate to `/rents/new`
- [ ] Select client from existing clients via search/autocomplete
- [ ] OR create a new client inline (name, phone, address) when no existing client selected
- [ ] Select one or more costumes to rent via search
- [ ] Only costumes with available quantity > 0 can be selected
- [ ] Set quantity per costume (minimum 1, maximum available quantity)
- [ ] Set rent start date (required)
- [ ] Set rent end date (required)
- [ ] `rent_end` before `rent_start` returns error: "rent_end must be after rent_start"
- [ ] Quantity exceeding available returns error: "insufficient quantity for costume X"
- [ ] Invalid costume ID returns error: "costume not found: X"
- [ ] Select guarantee type: KTP, SIM, KK, Paspor, Lainnya (required)
- [ ] Enter notes (optional)
- [ ] Submit creates rental with status "active"
- [ ] Redirect to rental detail after save
- [ ] Available quantity of selected costumes decreases after rental created

### AC-011: View Rental Detail
- [ ] Navigate to `/rents/:id`
- [ ] Display client name, phone, address
- [ ] Display rent start and end dates
- [ ] Display guarantee type
- [ ] Display notes if present
- [ ] Display all rented costumes with quantity and cover image
- [ ] Show rental status

### AC-012: Edit Rental
- [ ] Navigate to `/rents/:id/edit`
- [ ] Pre-populate form with existing data
- [ ] Can update guarantee type, dates, notes
- [ ] Updating items replaces existing items entirely
- [ ] Save changes updates database
- [ ] Redirect to detail page after save

### AC-013: Mark Rental as Returned
- [ ] "Mark Returned" button visible on active and overdue rentals
- [ ] "Mark Returned" button NOT shown on already-returned rentals
- [ ] Confirmation dialog before marking
- [ ] Cancelling confirmation does NOT change status
- [ ] Confirming updates status to "returned"
- [ ] Available quantity of returned costumes increases after marking returned

### AC-014: Delete Rental
- [ ] Delete button available on list or detail
- [ ] Confirmation dialog before delete
- [ ] Cancelling does NOT delete
- [ ] Confirming removes rental from database
- [ ] After deletion, rental no longer appears in list
- [ ] Deleting a rental restores costume available quantity

---

## 4. Client Management [CLIENT]

### AC-015: View Client List
- [ ] Navigate to `/clients`
- [ ] Display all clients with name and phone
- [ ] Show total rents count per client
- [ ] Show active rents count per client
- [ ] Show last rent date if available
- [ ] Show overdue indicator for clients with overdue rentals
- [ ] Search by client name

### AC-016: View Client Detail
- [ ] Navigate to `/clients/:id`
- [ ] Display client name, phone, address
- [ ] Display rental history ordered by most recent first
- [ ] Each rental in history shows dates, status, costume names

### AC-017: Edit Client
- [ ] Edit button on client detail page
- [ ] Pre-populate form with current name, phone, address
- [ ] Update name, phone, and/or address
- [ ] Changes saved to database
- [ ] Detail page reflects updated values after save

---

## 5. Notifications [NOTIFICATION]

### AC-018: Overdue Rental Alerts
- [ ] Badge on notification bell shows count of overdue rentals
- [ ] Badge count matches `count` field from `GET /api/notifications`
- [ ] Badge hidden or shows 0 when no overdue or due-soon rentals exist
- [ ] Alert displays for rentals past end date with status still "active"

### AC-019: Due Soon Reminders
- [ ] Reminder shown for rentals with `rent_end` within 3 days (configurable via `NOTIFICATION_DUE_DAYS` env)
- [ ] Due soon items included in badge count
- [ ] Notification displayed in navbar bell

### AC-020: Notification Bell
- [ ] Click bell opens notification dropdown/popover
- [ ] Each item shows client name, rent end date, and type (overdue / due_soon)
- [ ] Overdue and due_soon items are visually distinct
- [ ] Notifications ordered by rent_end ascending (most urgent first)
- [ ] Count decreases when an overdue/due-soon rental is marked returned

---

## 6. Settings [SETTINGS]

### AC-021: Access Settings
- [ ] Navigate to `/settings` via sidebar
- [ ] Form displays current saved values (loaded from `/api/settings`)
- [ ] Settings persist across page refresh

### AC-022: Customize App Name
- [ ] Edit app name field
- [ ] Save success message is shown after saving
- [ ] Updated app name is reflected in navbar and login page
- [ ] Change persists after page reload

### AC-023: Customize Tagline
- [ ] Edit tagline field
- [ ] Updated tagline is reflected on login page
- [ ] Change persists after page reload

### AC-024: Upload Logo
- [ ] Upload logo image via file picker
- [ ] Logo displays in navbar and login page after upload
- [ ] Only image files are accepted

---

## 7. Navigation & UI [NAVIGATION]

### AC-025: Sidebar Navigation
- [ ] Katalog menu links to `/catalogue`
- [ ] Peminjaman menu links to `/rents`
- [ ] Klien menu links to `/clients`
- [ ] Pengaturan menu links to `/settings`
- [ ] Active link is visually highlighted

### AC-026: Direct URL Access
- [ ] All routes accessible via direct URL when authenticated
- [ ] Unauthenticated access to any route redirects to `/login`
- [ ] 404 page shown for unknown routes
- [ ] 404 page has a link or button to return to catalogue

### AC-027: Responsive Design
- [ ] Usable on desktop viewport
- [ ] Usable on mobile viewport (filters stack vertically, inputs are tap-friendly)

---

## 8. API Backend [API]

### AC-028: Public Endpoints
- [ ] `GET /health` returns `{"status":"ok"}` with HTTP 200
- [ ] `GET /api/settings` returns app settings without auth (HTTP 200)
- [ ] `GET /api/costumes` returns paginated costume list without auth
- [ ] `GET /api/costumes/search` returns matching costumes without auth
- [ ] `GET /api/costumes/:id` returns costume detail without auth
- [ ] `GET /api/regions` returns all regions without auth
- [ ] `GET /api/categories` returns all categories without auth

### AC-029: Authentication Endpoints
- [ ] `POST /api/auth/login` with valid credentials returns token (HTTP 200)
- [ ] `POST /api/auth/login` with invalid credentials returns HTTP 401
- [ ] `POST /api/auth/register` creates new user (HTTP 201)
- [ ] `GET /api/auth/me` with valid token returns current user (HTTP 200)
- [ ] `GET /api/auth/me` without token returns HTTP 401
- [ ] `POST /api/auth/logout` with valid token returns HTTP 200
- [ ] `POST /api/auth/logout` without token returns HTTP 401
- [ ] All protected endpoints return HTTP 401 when no bearer token provided

### AC-030: Protected Endpoints (Authenticated)
- [ ] `GET/POST/PUT/DELETE /api/costumes` — full CRUD with auth
- [ ] `POST /api/costumes/:id/images` — upload image with auth
- [ ] `DELETE /api/costumes/:id/images/:imgId` — delete image with auth
- [ ] `GET/POST/PUT/DELETE /api/rents` — full CRUD with auth
- [ ] `PUT /api/rents/:id/return` — mark returned with auth
- [ ] `GET/POST/PUT/DELETE /api/clients` — full CRUD with auth
- [ ] `GET /api/clients/:id/rents` — client rent history with auth
- [ ] `GET /api/notifications` — notification list with auth
- [ ] `PUT /api/settings` — update settings with auth
- [ ] `POST /api/regions` — create region with auth
- [ ] `POST /api/categories` — create category with auth

---

## New ACs — Extended Coverage

### AC-031: Costume Search and Filter
- [ ] Search filters costumes by name (case-insensitive)
- [ ] Clearing search restores full list
- [ ] Region filter shows only costumes from selected region
- [ ] Category filter shows only costumes from selected category
- [ ] Combining search + region + category filters all work together
- [ ] Page resets to 1 when any filter changes

### AC-032: Costume Available Quantity
- [ ] Available quantity = total quantity minus quantity in active rentals
- [ ] Available quantity shown correctly on list and detail pages
- [ ] Available quantity decreases when an active rental is created
- [ ] Available quantity increases when a rental is marked returned or deleted

### AC-033: Rental — Create with New Inline Client
- [ ] When no existing client is selected, filling client name/phone/address creates a new client
- [ ] New client is saved to the database and linked to the rental
- [ ] New client appears in `/clients` list after rental creation

### AC-034: Rental — Overdue Status
- [ ] Rentals with `rent_end` in the past and status still "active" are considered overdue
- [ ] Overdue rentals appear under the "overdue" status filter
- [ ] Overdue rentals appear in the notification system

### AC-035: API — Pagination Behaviour
- [ ] All list endpoints support `?page=X&limit=Y` query params
- [ ] `limit` defaults to 10 if not provided
- [ ] `limit` is capped at 100 — values above 100 return at most 100 results
- [ ] `page` defaults to 1 if not provided or invalid
- [ ] Response always includes `total`, `page`, `limit`, `total_pages`

### AC-036: API — Invalid ID Format
- [ ] `GET /api/costumes/abc` returns HTTP 400 with "Invalid ID"
- [ ] `GET /api/rents/abc` returns HTTP 400 with "Invalid ID"
- [ ] `GET /api/clients/abc` returns HTTP 400 with "Invalid ID"

### AC-037: API — Not Found
- [ ] `GET /api/costumes/99999999` returns HTTP 404
- [ ] `GET /api/rents/99999999` returns HTTP 404
- [ ] `GET /api/clients/99999999` returns HTTP 404

### AC-038: API — Costume Create Validation
- [ ] Missing `name` returns HTTP 400
- [ ] `quantity` below 1 is automatically set to 1 by the backend
- [ ] `acquired_at` must be in `YYYY-MM-DD` format if provided

### AC-039: API — Rental Create Validation
- [ ] Missing `guarantee_type` returns HTTP 400
- [ ] Missing `rent_start` returns HTTP 400
- [ ] Missing `rent_end` returns HTTP 400
- [ ] Empty `items` array returns HTTP 400
- [ ] `rent_end` before `rent_start` returns HTTP 400: "rent_end must be after rent_start"
- [ ] Quantity exceeding available returns HTTP 400: "insufficient quantity for costume X: requested Y, available Z"
- [ ] Non-existent `costume_id` returns HTTP 400: "costume not found: X"

### AC-040: API — Duplicate Region/Category
- [ ] `POST /api/regions` with existing name returns error (duplicate key)
- [ ] `POST /api/categories` with existing name returns error (duplicate key)

### AC-041: Dark / Light Theme Toggle
- [ ] Theme toggle button present in navbar
- [ ] Clicking toggles between light and dark mode
- [ ] Dark mode applies to all pages and components via `dark` class on `<html>`
- [ ] Theme preference saved to `localStorage` under key `heroui-theme`
- [ ] Theme persists after page refresh

### AC-042: Client — Delete
- [ ] Delete button available on client list or detail
- [ ] Confirmation dialog before delete
- [ ] Cancelling does NOT delete
- [ ] Confirming removes client from database
- [ ] After deletion, client no longer appears in list

---

## Test Coverage Status

| Feature ID | Feature Name | API Tests | Frontend Tests | Status |
|---|---|---|---|---|
| `AUTH` | Authentication | — | Partial | Partial |
| `CATALOGUE` | Costume Management | — | Partial | Partial |
| `RENT` | Rental System | — | Partial | Partial |
| `CLIENT` | Client Management | — | Partial | Partial |
| `NOTIFICATION` | Notifications | — | Partial | Partial |
| `SETTINGS` | Settings | — | Partial | Partial |
| `NAVIGATION` | Navigation & UI | — | Partial | Partial |
| `API` | Backend API | — | — | Not Tested |