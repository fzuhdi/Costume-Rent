# Test Cases — Costume Rental Management

This document lists test cases for the SDET agent to implement as Playwright scripts.

## Format
Each test case ID follows the format `[AC-XXX-YYY]` where:
- `XXX` = the AC number from `docs/ACCEPTANCE_CRITERIA.md` (zero-padded to 3 digits)
- `YYY` = the sub-test number within that AC (zero-padded to 3 digits)

Example: `[AC-003-002]` = second test case for AC-003.

## Conventions
- Base URL: `http://localhost:5173`
- API Base URL: `http://localhost:8080`
- Valid credentials: `admin@busana.com` / `admin123`
- All frontend tests use the Page Object pattern — page objects live in `test/pages/`
- A shared `login()` helper exists on `LoginPage` — use it in `beforeEach` for all authenticated tests
- API tests use Playwright `request` context — no browser needed
- A `getToken()` helper should log in via `POST /api/auth/login` and return the bearer token
- Use `Authorization: Bearer <token>` on all protected API calls

---

## `test/specs/auth.spec.js`

**Existing tests — do not rewrite, only extend if gaps found:**
- `[AC-001-001]` Login with valid credentials
- `[AC-002-001]` Invalid credentials show error
- `[AC-004-001]` Session persists on refresh
- `[AC-005-001]` Logout clears session

**New tests to add:**

### [AC-001-002] — Login redirects to /catalogue
1. Visit `/login`
2. Fill valid credentials
3. Submit
4. Assert URL is exactly `/catalogue`

### [AC-001-003] — Auth token stored after login
1. Login with valid credentials
2. Assert `localStorage` contains an auth token key
3. Assert token value is a non-empty string

### [AC-002-002] — Wrong email shows error
1. Visit `/login`
2. Fill email `nobody@example.com`, password `admin123`
3. Submit
4. Assert error message is visible
5. Assert URL is still `/login`

### [AC-002-003] — Empty form does not submit
1. Visit `/login`
2. Click submit without filling any fields
3. Assert URL is still `/login`
4. Assert no network request to `/api/auth/login` was made (or form shows required errors)

### [AC-003-001] — Unauthenticated access to /catalogue redirects to login
1. Clear localStorage (no token)
2. Visit `/catalogue`
3. Assert URL redirects to `/login`

### [AC-003-002] — Unauthenticated access to /rents redirects to login
1. Clear localStorage
2. Visit `/rents`
3. Assert URL redirects to `/login`

### [AC-003-003] — Unauthenticated access to /clients redirects to login
1. Clear localStorage
2. Visit `/clients`
3. Assert URL redirects to `/login`

### [AC-003-004] — Unauthenticated access to /settings redirects to login
1. Clear localStorage
2. Visit `/settings`
3. Assert URL redirects to `/login`

### [AC-005-002] — Token removed from localStorage after logout
1. Login
2. Logout
3. Assert localStorage no longer contains auth token

---

## `test/specs/catalogue.spec.js`

**Existing tests — do not rewrite:**
- `[AC-003-001]` Display all costumes
- `[AC-003-002]` Show name, thumbnail, quantity
- `[AC-003-003]` Paginated list
- `[AC-004-001]` Navigate to /catalogue/new
- `[AC-004-002]` Submit saves and redirects
- `[AC-005-001]` Navigate to /catalogue/:id
- `[AC-005-002]` Display costume details
- `[AC-005-003]` Display costume images
- `[AC-005-004]` Show edit button
- `[AC-006-001]` Navigate to /catalogue/:id/edit
- `[AC-006-002]` Pre-populate form
- `[AC-006-003]` Save changes updates database
- `[AC-006-004]` Redirect to detail after save
- `[AC-007-001]` Delete button available
- `[AC-007-002]` Confirmation dialog before delete
- `[AC-007-003]` Costume removed from database
- `[AC-008-001]` Image upload button
- `[AC-008-002]` Supports multiple images
- `[AC-008-003]` Images display in detail page

**New tests to add:**

### [AC-003-004] — Available quantity shown separately from total
1. Login, visit `/catalogue`
2. Assert that available quantity is visible per costume (distinct from total quantity)

### [AC-003-005] — Empty state shown when no results match search
1. Login, visit `/catalogue`
2. Type a search string that matches nothing (e.g. `zzzzznotexist`)
3. Assert empty state message is visible

### [AC-003-006] — Search filters costumes by name
1. Login, visit `/catalogue`
2. Note the name of the first costume
3. Type that name into the search field
4. Assert only costumes containing that name are shown
5. Clear search — assert full list is restored

### [AC-003-007] — Filter by region
1. Login, visit `/catalogue`
2. Select a region from the region dropdown
3. Assert all visible costumes belong to that region
4. Select "Semua Wilayah"
5. Assert full list is restored

### [AC-003-008] — Filter by category
1. Login, visit `/catalogue`
2. Select a category from the category dropdown
3. Assert all visible costumes belong to that category

### [AC-003-009] — Toggle between table and grid view
1. Login, visit `/catalogue`
2. Click grid view toggle
3. Assert costume cards are rendered
4. Click table view toggle
5. Assert table rows are rendered

### [AC-003-010] — Page resets to 1 when search changes
1. Login, navigate to page 2 of catalogue
2. Type in the search field
3. Assert pagination resets to page 1

### [AC-004-003] — Required field: name shows validation error if empty
1. Login, navigate to `/catalogue/new`
2. Fill quantity only, leave name empty
3. Submit
4. Assert form does not navigate away or shows validation error

### [AC-004-004] — All fields saved correctly
1. Login, navigate to `/catalogue/new`
2. Fill name, select region, select category, fill quantity, price, description, acquisition date
3. Submit
4. Navigate to the newly created costume detail
5. Assert all filled fields are visible with correct values

### [AC-005-005] — Available quantity shown on detail page
1. Login, navigate to a costume detail page
2. Assert available quantity is displayed
3. Assert available quantity ≤ total quantity

### [AC-007-004] — Cancel delete does not remove costume
1. Login, navigate to a costume detail or find in list
2. Click delete
3. When confirmation dialog appears, click cancel
4. Assert costume is still present in the list

### [AC-008-004] — First uploaded image becomes cover image
1. Login, navigate to a costume with no images
2. Upload one image
3. Assert that image is shown as the cover image

### [AC-008-005] — Delete image removes it from gallery
1. Login, navigate to a costume with at least one image
2. Delete one image
3. Assert the deleted image is no longer visible in the gallery

### [AC-008-006] — Deleting cover image promotes next image
1. Login, navigate to a costume with 2+ images
2. Note which is the cover image
3. Delete the cover image
4. Assert the next image is now shown as cover

---

## `test/specs/rental.spec.js`

**Existing tests — do not rewrite:**
- `[AC-009-001]` Display all rentals with status
- `[AC-009-002]` Filter by status active and returned
- `[AC-010-001]` Navigate to /rents/new and submit rental
- `[AC-011-001]` View rental details with client info and costumes
- `[AC-012-001]` Navigate to edit rental and pre-populate form
- `[AC-013-001]` Mark rental as returned
- `[AC-014-001]` Delete button and confirmation dialog

**New tests to add:**

### [AC-009-003] — Search rental by client name
1. Login, visit `/rents` (with seeded rental data)
2. Type a known client name into search
3. Assert only rentals for that client are shown
4. Clear search — full list restored

### [AC-009-004] — Filter by status: returned
1. Login, visit `/rents`
2. Select "returned" from status filter
3. Assert all visible rentals have "returned" status

### [AC-009-005] — Filter by status: overdue
1. Login, visit `/rents`
2. Select "overdue" from status filter
3. Assert all visible rentals have "overdue" status

### [AC-010-002] — Create rental with new inline client
1. Login, navigate to `/rents/new`
2. Choose "create new client" option in the client field
3. Fill client name, phone, address
4. Select a costume with available quantity > 0, quantity 1
5. Set rent start = today, rent end = tomorrow
6. Select guarantee type
7. Submit
8. Assert redirect to rental detail page
9. Assert the new client name is visible on the detail

### [AC-010-003] — rent_end before rent_start shows error
1. Login, navigate to `/rents/new`
2. Select a client and a costume
3. Set rent_start = tomorrow, rent_end = today
4. Submit
5. Assert error message visible containing "rent_end must be after rent_start"

### [AC-010-004] — Quantity exceeding available shows error
1. Login, navigate to `/rents/new`
2. Select a costume — note its available quantity (e.g. 1)
3. Set quantity to 999
4. Fill remaining required fields
5. Submit
6. Assert error message visible containing "insufficient quantity"

### [AC-010-005] — Submit with no costumes selected shows error
1. Login, navigate to `/rents/new`
2. Select a client, fill dates and guarantee type
3. Leave costumes empty
4. Submit
5. Assert error or form does not navigate away

### [AC-010-006] — Available quantity decreases after rental created
1. Login, note available quantity of a specific costume on its detail page
2. Create a rental for that costume with quantity 1
3. Navigate back to the costume detail
4. Assert available quantity decreased by 1

### [AC-011-002] — Rental detail shows guarantee type
1. Login, navigate to a rental detail page
2. Assert guarantee type is displayed

### [AC-011-003] — Rental detail shows notes if present
1. Login, navigate to a rental that has notes
2. Assert notes are visible on the detail page

### [AC-012-002] — Edit rental notes and verify save
1. Login, navigate to a rental detail, click edit
2. Change the notes field to "Updated notes auto test"
3. Submit
4. Assert detail page shows "Updated notes auto test"

### [AC-013-002] — Cancel mark-returned does not change status
1. Login, find an active rental
2. Click "Mark Returned"
3. When confirmation appears, click cancel
4. Assert rental status is still "active"

### [AC-013-003] — Mark returned button not shown on returned rental
1. Login, find a rental with status "returned"
2. Assert "Mark Returned" button is NOT visible

### [AC-013-004] — Available quantity restores after marking returned
1. Login, find an active rental for a specific costume
2. Note the costume's available quantity
3. Mark the rental as returned
4. Navigate to the costume detail
5. Assert available quantity increased by the returned quantity

### [AC-014-002] — Cancel delete does not remove rental
1. Login, navigate to a rental
2. Click delete, then click cancel on confirmation
3. Assert rental still exists in list

---

## `test/specs/clients.spec.js`

**Existing tests — do not rewrite:**
- `[AC-015-001]` Navigate to /clients
- `[AC-015-002]` Display all clients with name and phone
- `[AC-016-001]` View client detail page
- `[AC-016-002]` Display client rental history
- `[AC-017-001]` Edit button on client detail
- `[AC-017-002]` Update client information and save

**New tests to add:**

### [AC-015-003] — Client list shows total rents and active rents
1. Login, visit `/clients`
2. Assert total rents count is visible per client
3. Assert active rents count is visible per client

### [AC-015-004] — Search client by name
1. Login, visit `/clients`
2. Type a known client name into search
3. Assert only matching clients are shown
4. Clear search — full list restored

### [AC-015-005] — Overdue indicator shown for clients with overdue rentals
1. Login (with a client who has an overdue rental)
2. Visit `/clients`
3. Assert overdue indicator is visible for that client

### [AC-016-003] — Client detail shows correct rental history order
1. Login, navigate to a client with multiple rentals
2. Assert rentals are ordered most recent first

### [AC-017-003] — Edit client phone number
1. Login, navigate to a client detail
2. Click edit
3. Change phone to "08123456789"
4. Submit
5. Assert detail shows "08123456789"

### [AC-017-004] — Edit client address
1. Login, navigate to a client detail
2. Click edit
3. Change address to "Jl. Test Auto No. 1"
4. Submit
5. Assert detail shows "Jl. Test Auto No. 1"

### [AC-015-006] — Delete client
1. Login
2. Create a test client via UI or API
3. Navigate to that client in the list or detail
4. Click delete
5. Confirm
6. Assert client is no longer in the list

---

## `test/specs/notifications.spec.js`

**Existing tests — do not rewrite:**
- `[AC-018-001]` Badge shows count of overdue rentals
- `[AC-018-002]` Alert displays for rentals past end date
- `[AC-019-001]` Reminder for rentals due within 3 days
- `[AC-019-002]` Notification displayed in navbar
- `[AC-020-001]` Click bell shows notification dropdown
- `[AC-020-002]` List of overdue and due soon rentals

**New tests to add:**

### [AC-018-003] — Badge count matches API count
1. Login
2. Call `GET /api/notifications` — note the `count` value
3. Assert badge number on the bell matches that count

### [AC-018-004] — Badge hidden when count is 0
1. Login (with no overdue or due-soon rentals)
2. Assert badge is not visible or shows 0

### [AC-020-003] — Notification item shows client name and rent_end date
1. Login (with at least one overdue rental)
2. Click the notification bell
3. Assert client name is visible in the dropdown
4. Assert rent end date is visible

### [AC-020-004] — Overdue items are visually distinct from due_soon
1. Login (with both overdue and due_soon rentals)
2. Open notification bell
3. Assert overdue items have a different visual style than due_soon items (color, label, or chip)

---

## `test/specs/settings.spec.js`

**Existing tests — do not rewrite:**
- `[AC-021-001]` Navigate to /settings via sidebar
- `[AC-021-002]` Form displays current settings
- `[AC-022-001]` Edit app name field
- `[AC-022-002]` App name shows in navbar
- `[AC-023-001]` Edit tagline field
- `[AC-023-002]` Tagline changes apply instantly
- `[AC-024-001]` Upload logo image
- `[AC-024-002]` Logo displays in navbar after upload
- `[AC-024-003]` Logo changes apply instantly

**New tests to add:**

### [AC-021-003] — Settings page shows current app name value
1. Login, navigate to `/settings`
2. Assert app name input is not empty (pre-populated from API)

### [AC-022-003] — App name persists after page reload
1. Login, navigate to `/settings`
2. Set app name to "Auto Test Name"
3. Save
4. Reload the page
5. Assert app name field still shows "Auto Test Name"

### [AC-023-003] — Tagline persists after page reload
1. Login, navigate to `/settings`
2. Set tagline to "Auto Test Tagline"
3. Save
4. Reload
5. Assert tagline field shows "Auto Test Tagline"

### [AC-022-004] — Success message appears after save
1. Login, navigate to `/settings`
2. Make any change
3. Save
4. Assert success message is visible on screen

---

## `test/specs/navigation.spec.js`

**Existing tests — do not rewrite:**
- `[AC-025-001]` Katalog links to /catalogue
- `[AC-025-002]` Peminjaman links to /rents
- `[AC-025-003]` Klien links to /clients
- `[AC-025-004]` Pengaturan links to /settings
- `[AC-026-001]` All routes accessible when authenticated
- `[AC-026-002]` Unauthenticated redirects to login
- `[AC-026-003]` 404 page for unknown routes
- `[AC-027-001]` Usable on desktop viewport
- `[AC-027-002]` Usable on mobile viewport

**New tests to add:**

### [AC-025-005] — Active sidebar link is highlighted
1. Login, navigate to `/rents`
2. Assert the "Peminjaman" sidebar link has active styling (different from other links)

### [AC-026-004] — 404 page has link back to catalogue
1. Login, navigate to `/nonexistent-page`
2. Assert 404 page is shown
3. Assert a button or link to return to catalogue is present and works

### [AC-027-003] — Dark mode toggle switches theme
1. Login
2. Click the theme toggle button in navbar
3. Assert `<html>` element has class `dark`
4. Click again
5. Assert `<html>` element no longer has class `dark`

### [AC-027-004] — Dark mode preference persists on reload
1. Login
2. Enable dark mode via toggle
3. Reload the page
4. Assert `<html>` still has class `dark`
5. Assert localStorage key `heroui-theme` equals `"dark"`

---

## `test/api/api.spec.js`

All tests use Playwright `request` context. Implement a `getToken()` helper at the top of the file that calls `POST /api/auth/login` and returns the token string. Use it in all authenticated tests.

### [AC-028-001] — GET /health returns 200
- Request: `GET /health`
- Assert: status 200, body `{"status":"ok"}`

### [AC-028-002] — GET /api/settings returns 200 without auth
- Request: `GET /api/settings`
- Assert: status 200, body has `app_name` and `app_tagline` fields

### [AC-029-001] — POST /api/auth/login with valid credentials
- Request: `POST /api/auth/login` with `{"email":"admin@busana.com","password":"admin123"}`
- Assert: status 200, body has `token` field, token is non-empty string

### [AC-029-002] — POST /api/auth/login with wrong password
- Request: `POST /api/auth/login` with wrong password
- Assert: status 401

### [AC-029-003] — POST /api/auth/login with unknown email
- Request: `POST /api/auth/login` with unknown email
- Assert: status 401

### [AC-029-004] — GET /api/auth/me with token
- Request: `GET /api/auth/me` with valid bearer token
- Assert: status 200, body has user info (email or name)

### [AC-029-005] — GET /api/auth/me without token
- Request: `GET /api/auth/me` with no auth header
- Assert: status 401

### [AC-029-006] — POST /api/auth/logout with token
- Request: `POST /api/auth/logout` with valid token
- Assert: status 200

### [AC-029-007] — POST /api/auth/logout without token
- Request: `POST /api/auth/logout` with no auth header
- Assert: status 401

### [AC-028-003] — GET /api/regions returns array
- Request: `GET /api/regions` (no auth)
- Assert: status 200, body is array, each item has `id` and `name`

### [AC-028-004] — POST /api/regions without auth returns 401
- Request: `POST /api/regions` with no token
- Assert: status 401

### [AC-028-005] — POST /api/regions with auth creates region
- Request: `POST /api/regions` with token and `{"name":"API Test Region"}`
- Assert: status 200 or 201, body has `id` and `name`

### [AC-028-006] — POST /api/regions duplicate name returns error
- Request: `POST /api/regions` with token and an existing region name
- Assert: status 4xx, error message mentions duplicate or already exists

### [AC-028-007] — GET /api/categories returns array
- Request: `GET /api/categories` (no auth)
- Assert: status 200, array with `id` and `name`

### [AC-028-008] — POST /api/categories without auth returns 401
- Request: `POST /api/categories` no token → 401

### [AC-030-001] — GET /api/costumes returns paginated list
- Request: `GET /api/costumes`
- Assert: status 200, body has `data`, `total`, `page`, `limit`, `total_pages`
- Assert: each item in `data` has `available_quantity`

### [AC-030-002] — GET /api/costumes with search param
- Request: `GET /api/costumes?search=test`
- Assert: status 200, results filtered by name

### [AC-030-003] — GET /api/costumes pagination
- Request: `GET /api/costumes?page=1&limit=2`
- Assert: `data` array has at most 2 items

### [AC-030-004] — GET /api/costumes limit capped at 100
- Request: `GET /api/costumes?limit=999`
- Assert: `data` array has at most 100 items

### [AC-030-005] — GET /api/costumes/search
- Request: `GET /api/costumes/search?q=a`
- Assert: status 200, array with `available_quantity` on each item

### [AC-030-006] — GET /api/costumes/:id returns detail
- Request: `GET /api/costumes/:validId`
- Assert: status 200, has `images` array, `available_quantity`

### [AC-030-007] — GET /api/costumes/:id not found
- Request: `GET /api/costumes/99999999`
- Assert: status 404

### [AC-030-008] — GET /api/costumes/abc invalid ID
- Request: `GET /api/costumes/abc`
- Assert: status 400

### [AC-030-009] — POST /api/costumes without auth
- Request: `POST /api/costumes` no token → 401

### [AC-030-010] — POST /api/costumes with auth and valid body
- Request: `POST /api/costumes` with token, `{"name":"API Test Costume","quantity":3}`
- Assert: status 201 or 200, body has `id`

### [AC-030-011] — POST /api/costumes missing name returns 400
- Request: `POST /api/costumes` with token, no name field
- Assert: status 400

### [AC-030-012] — PUT /api/costumes/:id without auth returns 401
- Assert: status 401

### [AC-030-013] — PUT /api/costumes/:id updates fields
- Request: `PUT /api/costumes/:id` with token and `{"name":"Updated Name"}`
- Assert: status 200, response name is "Updated Name"

### [AC-030-014] — DELETE /api/costumes/:id without auth returns 401
- Assert: status 401

### [AC-030-015] — DELETE /api/costumes/:id with auth
- Create a costume, then delete it
- Assert: status 200

### [AC-030-016] — GET /api/clients without auth returns 401
- Assert: status 401

### [AC-030-017] — GET /api/clients with auth
- Assert: status 200, paginated, each item has `total_rents`, `active_rents`, `has_overdue`

### [AC-030-018] — GET /api/clients/search with auth
- Request: `GET /api/clients/search?q=test` with token
- Assert: status 200, array

### [AC-030-019] — GET /api/clients/:id with auth
- Assert: status 200, has rental history

### [AC-030-020] — GET /api/clients/99999999 returns 404
- Assert: status 404

### [AC-030-021] — POST /api/clients with auth
- Request: `POST /api/clients` with token and `{"name":"API Test Client"}`
- Assert: status 200 or 201, body has `id`

### [AC-030-022] — GET /api/clients/:id/rents with auth
- Assert: status 200, array of rent orders for that client

### [AC-030-023] — GET /api/rents without auth returns 401
- Assert: status 401

### [AC-030-024] — GET /api/rents with auth
- Assert: status 200, paginated, each item has `client_name`, `status`, `items`

### [AC-030-025] — GET /api/rents?status=active
- Assert: all returned items have `status: "active"`

### [AC-030-026] — POST /api/rents — valid payload with existing client
- Request body: `{ client_id, guarantee_type, rent_start, rent_end, items: [{costume_id, quantity:1}] }`
- Assert: status 201, body has `id`, `status: "active"`, `items` array

### [AC-030-027] — POST /api/rents — missing guarantee_type returns 400
- Assert: status 400

### [AC-030-028] — POST /api/rents — missing rent_start returns 400
- Assert: status 400

### [AC-030-029] — POST /api/rents — empty items array returns 400
- Assert: status 400

### [AC-030-030] — POST /api/rents — rent_end before rent_start
- Assert: status 400, error message "rent_end must be after rent_start"

### [AC-030-031] — POST /api/rents — quantity exceeds available
- Assert: status 400, error message contains "insufficient quantity"

### [AC-030-032] — POST /api/rents — invalid costume_id
- Assert: status 400, error message contains "costume not found"

### [AC-030-033] — PUT /api/rents/:id/return with auth
- Create an active rental, then call return endpoint
- Assert: status 200, `status` is "returned"

### [AC-030-034] — DELETE /api/rents/:id with auth
- Create a rental, then delete it
- Assert: status 200, message "Rent order deleted successfully"

### [AC-030-035] — GET /api/notifications without auth returns 401
- Assert: status 401

### [AC-030-036] — GET /api/notifications with auth
- Assert: status 200, body has `count` (integer) and `items` (array)
- Each item has `rent_order_id`, `client_name`, `rent_end`, `type`
- `type` is either "overdue" or "due_soon"

### [AC-030-037] — PUT /api/settings without auth returns 401
- Assert: status 401

### [AC-030-038] — PUT /api/settings with auth updates app_name
- Request: `PUT /api/settings` with token and `{"app_name":"API Updated Name"}`
- Assert: status 200
- Verify with `GET /api/settings` that `app_name` is "API Updated Name"

### [AC-030-039] — GET /api/rents/abc invalid ID returns 400
- Assert: status 400

### [AC-030-040] — GET /api/clients/abc invalid ID returns 400
- Assert: status 400