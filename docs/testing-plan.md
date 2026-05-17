# Test Cases — Costume Rental Management

This document lists test cases for the SDET agent to implement as Playwright scripts.

## Format
Each test case ID follows the format `[LEGACY-XXX-YYY]` where:
- `XXX` = the AC number from `docs/acceptance/*.md` (zero-padded to 3 digits)
- `YYY` = the sub-test number within that AC (zero-padded to 3 digits)

Example: `[CATALOGUE-002]` = second test case for AUTH-003.

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
- `[AUTH-001]` Login with valid credentials
- `[AUTH-002]` Invalid credentials show error
- `[CATALOGUE-004]` Session persists on refresh
- `[CATALOGUE-006]` Logout clears session

**New tests to add:**

### [AUTH-005] — Login redirects to /catalogue
1. Visit `/login`
2. Fill valid credentials
3. Submit
4. Assert URL is exactly `/catalogue`

### [AUTH-006] — Auth token stored after login
1. Login with valid credentials
2. Assert `localStorage` contains an auth token key
3. Assert token value is a non-empty string

### [AUTH-007] — Wrong email shows error
1. Visit `/login`
2. Fill email `nobody@example.com`, password `admin123`
3. Submit
4. Assert error message is visible
5. Assert URL is still `/login`

### [AUTH-008] — Empty form does not submit
1. Visit `/login`
2. Click submit without filling any fields
3. Assert URL is still `/login`
4. Assert no network request to `/api/auth/login` was made (or form shows required errors)

### [CATALOGUE-001] — Unauthenticated access to /catalogue redirects to login
1. Clear localStorage (no token)
2. Visit `/catalogue`
3. Assert URL redirects to `/login`

### [CATALOGUE-002] — Unauthenticated access to /rents redirects to login
1. Clear localStorage
2. Visit `/rents`
3. Assert URL redirects to `/login`

### [CATALOGUE-003] — Unauthenticated access to /clients redirects to login
1. Clear localStorage
2. Visit `/clients`
3. Assert URL redirects to `/login`

### [CATALOGUE-021] — Unauthenticated access to /settings redirects to login
1. Clear localStorage
2. Visit `/settings`
3. Assert URL redirects to `/login`

### [CATALOGUE-007] — Token removed from localStorage after logout
1. Login
2. Logout
3. Assert localStorage no longer contains auth token

---

## `test/specs/catalogue.spec.js`

**Existing tests — do not rewrite:**
- `[CATALOGUE-001]` Display all costumes
- `[CATALOGUE-002]` Show name, thumbnail, quantity
- `[CATALOGUE-003]` Paginated list
- `[CATALOGUE-004]` Navigate to /catalogue/new
- `[CATALOGUE-005]` Submit saves and redirects
- `[CATALOGUE-006]` Navigate to /catalogue/:id
- `[CATALOGUE-007]` Display costume details
- `[CATALOGUE-008]` Display costume images
- `[CATALOGUE-009]` Show edit button
- `[CATALOGUE-010]` Navigate to /catalogue/:id/edit
- `[CATALOGUE-011]` Pre-populate form
- `[CATALOGUE-012]` Save changes updates database
- `[CATALOGUE-013]` Redirect to detail after save
- `[CATALOGUE-014]` Delete button available
- `[CATALOGUE-015]` Confirmation dialog before delete
- `[CATALOGUE-016]` Costume removed from database
- `[CATALOGUE-017]` Image upload button
- `[CATALOGUE-018]` Supports multiple images
- `[CATALOGUE-019]` Images display in detail page

**New tests to add:**

### [CATALOGUE-021] — Available quantity shown separately from total
1. Login, visit `/catalogue`
2. Assert that available quantity is visible per costume (distinct from total quantity)

### [CATALOGUE-022] — Empty state shown when no results match search
1. Login, visit `/catalogue`
2. Type a search string that matches nothing (e.g. `zzzzznotexist`)
3. Assert empty state message is visible

### [CATALOGUE-023] — Search filters costumes by name
1. Login, visit `/catalogue`
2. Note the name of the first costume
3. Type that name into the search field
4. Assert only costumes containing that name are shown
5. Clear search — assert full list is restored

### [CATALOGUE-024] — Filter by region
1. Login, visit `/catalogue`
2. Select a region from the region dropdown
3. Assert all visible costumes belong to that region
4. Select "Semua Wilayah"
5. Assert full list is restored

### [CATALOGUE-025] — Filter by category
1. Login, visit `/catalogue`
2. Select a category from the category dropdown
3. Assert all visible costumes belong to that category

### [CATALOGUE-026] — Toggle between table and grid view
1. Login, visit `/catalogue`
2. Click grid view toggle
3. Assert costume cards are rendered
4. Click table view toggle
5. Assert table rows are rendered

### [CATALOGUE-027] — Page resets to 1 when search changes
1. Login, navigate to page 2 of catalogue
2. Type in the search field
3. Assert pagination resets to page 1

### [CATALOGUE-028] — Required field: name shows validation error if empty
1. Login, navigate to `/catalogue/new`
2. Fill quantity only, leave name empty
3. Submit
4. Assert form does not navigate away or shows validation error

### [CATALOGUE-029] — All fields saved correctly
1. Login, navigate to `/catalogue/new`
2. Fill name, select region, select category, fill quantity, price, description, acquisition date
3. Submit
4. Navigate to the newly created costume detail
5. Assert all filled fields are visible with correct values

### [CATALOGUE-030] — Available quantity shown on detail page
1. Login, navigate to a costume detail page
2. Assert available quantity is displayed
3. Assert available quantity ≤ total quantity

### [CATALOGUE-031] — Cancel delete does not remove costume
1. Login, navigate to a costume detail or find in list
2. Click delete
3. When confirmation dialog appears, click cancel
4. Assert costume is still present in the list

### [CATALOGUE-032] — First uploaded image becomes cover image
1. Login, navigate to a costume with no images
2. Upload one image
3. Assert that image is shown as the cover image

### [CATALOGUE-033] — Delete image removes it from gallery
1. Login, navigate to a costume with at least one image
2. Delete one image
3. Assert the deleted image is no longer visible in the gallery

### [CATALOGUE-034] — Deleting cover image promotes next image
1. Login, navigate to a costume with 2+ images
2. Note which is the cover image
3. Delete the cover image
4. Assert the next image is now shown as cover

---

## `test/specs/rental.spec.js`

**Existing tests — do not rewrite:**
- `[RENT-001]` Display all rentals with status
- `[RENT-002]` Filter by status active and returned
- `[RENT-003]` Navigate to /rents/new and submit rental
- `[RENT-004]` View rental details with client info and costumes
- `[RENT-005]` Navigate to edit rental and pre-populate form
- `[RENT-006]` Mark rental as returned
- `[RENT-014]` Delete button and confirmation dialog

**New tests to add:**

### [RENT-007] — Search rental by client name
1. Login, visit `/rents` (with seeded rental data)
2. Type a known client name into search
3. Assert only rentals for that client are shown
4. Clear search — full list restored

### [RENT-008] — Filter by status: returned
1. Login, visit `/rents`
2. Select "returned" from status filter
3. Assert all visible rentals have "returned" status

### [RENT-009] — Filter by status: overdue
1. Login, visit `/rents`
2. Select "overdue" from status filter
3. Assert all visible rentals have "overdue" status

### [RENT-010] — Create rental with new inline client
1. Login, navigate to `/rents/new`
2. Choose "create new client" option in the client field
3. Fill client name, phone, address
4. Select a costume with available quantity > 0, quantity 1
5. Set rent start = today, rent end = tomorrow
6. Select guarantee type
7. Submit
8. Assert redirect to rental detail page
9. Assert the new client name is visible on the detail

### [RENT-011] — rent_end before rent_start shows error
1. Login, navigate to `/rents/new`
2. Select a client and a costume
3. Set rent_start = tomorrow, rent_end = today
4. Submit
5. Assert error message visible containing "rent_end must be after rent_start"

### [RENT-012] — Quantity exceeding available shows error
1. Login, navigate to `/rents/new`
2. Select a costume — note its available quantity (e.g. 1)
3. Set quantity to 999
4. Fill remaining required fields
5. Submit
6. Assert error message visible containing "insufficient quantity"

### [RENT-013] — Submit with no costumes selected shows error
1. Login, navigate to `/rents/new`
2. Select a client, fill dates and guarantee type
3. Leave costumes empty
4. Submit
5. Assert error or form does not navigate away

### [RENT-014] — Available quantity decreases after rental created
1. Login, note available quantity of a specific costume on its detail page
2. Create a rental for that costume with quantity 1
3. Navigate back to the costume detail
4. Assert available quantity decreased by 1

### [RENT-015] — Rental detail shows guarantee type
1. Login, navigate to a rental detail page
2. Assert guarantee type is displayed

### [RENT-016] — Rental detail shows notes if present
1. Login, navigate to a rental that has notes
2. Assert notes are visible on the detail page

### [RENT-017] — Edit rental notes and verify save
1. Login, navigate to a rental detail, click edit
2. Change the notes field to "Updated notes auto test"
3. Submit
4. Assert detail page shows "Updated notes auto test"

### [RENT-018] — Cancel mark-returned does not change status
1. Login, find an active rental
2. Click "Mark Returned"
3. When confirmation appears, click cancel
4. Assert rental status is still "active"

### [RENT-019] — Mark returned button not shown on returned rental
1. Login, find a rental with status "returned"
2. Assert "Mark Returned" button is NOT visible

### [RENT-020] — Available quantity restores after marking returned
1. Login, find an active rental for a specific costume
2. Note the costume's available quantity
3. Mark the rental as returned
4. Navigate to the costume detail
5. Assert available quantity increased by the returned quantity

### [RENT-021] — Cancel delete does not remove rental
1. Login, navigate to a rental
2. Click delete, then click cancel on confirmation
3. Assert rental still exists in list

---

## `test/specs/clients.spec.js`

**Existing tests — do not rewrite:**
- `[CLIENT-001]` Navigate to /clients
- `[CLIENT-002]` Display all clients with name and phone
- `[CLIENT-003]` View client detail page
- `[CLIENT-004]` Display client rental history
- `[CLIENT-005]` Edit button on client detail
- `[CLIENT-006]` Update client information and save

**New tests to add:**

### [CLIENT-007] — Client list shows total rents and active rents
1. Login, visit `/clients`
2. Assert total rents count is visible per client
3. Assert active rents count is visible per client

### [CLIENT-008] — Search client by name
1. Login, visit `/clients`
2. Type a known client name into search
3. Assert only matching clients are shown
4. Clear search — full list restored

### [CLIENT-009] — Overdue indicator shown for clients with overdue rentals
1. Login (with a client who has an overdue rental)
2. Visit `/clients`
3. Assert overdue indicator is visible for that client

### [CLIENT-010] — Client detail shows correct rental history order
1. Login, navigate to a client with multiple rentals
2. Assert rentals are ordered most recent first

### [CLIENT-011] — Edit client phone number
1. Login, navigate to a client detail
2. Click edit
3. Change phone to "08123456789"
4. Submit
5. Assert detail shows "08123456789"

### [CLIENT-012] — Edit client address
1. Login, navigate to a client detail
2. Click edit
3. Change address to "Jl. Test Auto No. 1"
4. Submit
5. Assert detail shows "Jl. Test Auto No. 1"

### [CLIENT-015] — Delete client
1. Login
2. Create a test client via UI or API
3. Navigate to that client in the list or detail
4. Click delete
5. Confirm
6. Assert client is no longer in the list

---

## `test/specs/notifications.spec.js`

**Existing tests — do not rewrite:**
- `[NOTIFICATION-001]` Badge shows count of overdue rentals
- `[NOTIFICATION-002]` Alert displays for rentals past end date
- `[NOTIFICATION-003]` Reminder for rentals due within 3 days
- `[NOTIFICATION-004]` Notification displayed in navbar
- `[NOTIFICATION-005]` Click bell shows notification dropdown
- `[NOTIFICATION-006]` List of overdue and due soon rentals

**New tests to add:**

### [NOTIFICATION-007] — Badge count matches API count
1. Login
2. Call `GET /api/notifications` — note the `count` value
3. Assert badge number on the bell matches that count

### [NOTIFICATION-008] — Badge hidden when count is 0
1. Login (with no overdue or due-soon rentals)
2. Assert badge is not visible or shows 0

### [NOTIFICATION-009] — Notification item shows client name and rent_end date
1. Login (with at least one overdue rental)
2. Click the notification bell
3. Assert client name is visible in the dropdown
4. Assert rent end date is visible

### [NOTIFICATION-010] — Overdue items are visually distinct from due_soon
1. Login (with both overdue and due_soon rentals)
2. Open notification bell
3. Assert overdue items have a different visual style than due_soon items (color, label, or chip)

---

## `test/specs/settings.spec.js`

**Existing tests — do not rewrite:**
- `[SETTINGS-001]` Navigate to /settings via sidebar
- `[SETTINGS-002]` Form displays current settings
- `[SETTINGS-003]` Edit app name field
- `[SETTINGS-004]` App name shows in navbar
- `[SETTINGS-005]` Edit tagline field
- `[SETTINGS-006]` Tagline changes apply instantly
- `[SETTINGS-007]` Upload logo image
- `[SETTINGS-008]` Logo displays in navbar after upload
- `[SETTINGS-009]` Logo changes apply instantly

**New tests to add:**

### [SETTINGS-010] — Settings page shows current app name value
1. Login, navigate to `/settings`
2. Assert app name input is not empty (pre-populated from API)

### [SETTINGS-011] — App name persists after page reload
1. Login, navigate to `/settings`
2. Set app name to "Auto Test Name"
3. Save
4. Reload the page
5. Assert app name field still shows "Auto Test Name"

### [SETTINGS-012] — Tagline persists after page reload
1. Login, navigate to `/settings`
2. Set tagline to "Auto Test Tagline"
3. Save
4. Reload
5. Assert tagline field shows "Auto Test Tagline"

### [SETTINGS-013] — Success message appears after save
1. Login, navigate to `/settings`
2. Make any change
3. Save
4. Assert success message is visible on screen

---

## `test/specs/navigation.spec.js`

**Existing tests — do not rewrite:**
- `[NAVIGATION-001]` Katalog links to /catalogue
- `[NAVIGATION-002]` Peminjaman links to /rents
- `[NAVIGATION-003]` Klien links to /clients
- `[NAVIGATION-004]` Pengaturan links to /settings
- `[NAVIGATION-005]` All routes accessible when authenticated
- `[NAVIGATION-006]` Unauthenticated redirects to login
- `[NAVIGATION-007]` 404 page for unknown routes
- `[NAVIGATION-008]` Usable on desktop viewport
- `[NAVIGATION-009]` Usable on mobile viewport

**New tests to add:**

### [NAVIGATION-010] — Active sidebar link is highlighted
1. Login, navigate to `/rents`
2. Assert the "Peminjaman" sidebar link has active styling (different from other links)

### [NAVIGATION-011] — 404 page has link back to catalogue
1. Login, navigate to `/nonexistent-page`
2. Assert 404 page is shown
3. Assert a button or link to return to catalogue is present and works

### [NAVIGATION-012] — Dark mode toggle switches theme
1. Login
2. Click the theme toggle button in navbar
3. Assert `<html>` element has class `dark`
4. Click again
5. Assert `<html>` element no longer has class `dark`

### [NAVIGATION-013] — Dark mode preference persists on reload
1. Login
2. Enable dark mode via toggle
3. Reload the page
4. Assert `<html>` still has class `dark`
5. Assert localStorage key `heroui-theme` equals `"dark"`

---

## `test/api/api.spec.js`

All tests use Playwright `request` context. Implement a `getToken()` helper at the top of the file that calls `POST /api/auth/login` and returns the token string. Use it in all authenticated tests.

### [API-001] — GET /health returns 200
- Request: `GET /health`
- Assert: status 200, body `{"status":"ok"}`

### [API-002] — GET /api/settings returns 200 without auth
- Request: `GET /api/settings`
- Assert: status 200, body has `app_name` and `app_tagline` fields

### [API-009] — POST /api/auth/login with valid credentials
- Request: `POST /api/auth/login` with `{"email":"admin@busana.com","password":"admin123"}`
- Assert: status 200, body has `token` field, token is non-empty string

### [API-010] — POST /api/auth/login with wrong password
- Request: `POST /api/auth/login` with wrong password
- Assert: status 401

### [API-011] — POST /api/auth/login with unknown email
- Request: `POST /api/auth/login` with unknown email
- Assert: status 401

### [API-012] — GET /api/auth/me with token
- Request: `GET /api/auth/me` with valid bearer token
- Assert: status 200, body has user info (email or name)

### [API-013] — GET /api/auth/me without token
- Request: `GET /api/auth/me` with no auth header
- Assert: status 401

### [API-014] — POST /api/auth/logout with token
- Request: `POST /api/auth/logout` with valid token
- Assert: status 200

### [API-015] — POST /api/auth/logout without token
- Request: `POST /api/auth/logout` with no auth header
- Assert: status 401

### [API-003] — GET /api/regions returns array
- Request: `GET /api/regions` (no auth)
- Assert: status 200, body is array, each item has `id` and `name`

### [API-004] — POST /api/regions without auth returns 401
- Request: `POST /api/regions` with no token
- Assert: status 401

### [API-005] — POST /api/regions with auth creates region
- Request: `POST /api/regions` with token and `{"name":"API Test Region"}`
- Assert: status 200 or 201, body has `id` and `name`

### [API-006] — POST /api/regions duplicate name returns error
- Request: `POST /api/regions` with token and an existing region name
- Assert: status 4xx, error message mentions duplicate or already exists

### [API-007] — GET /api/categories returns array
- Request: `GET /api/categories` (no auth)
- Assert: status 200, array with `id` and `name`

### [API-008] — POST /api/categories without auth returns 401
- Request: `POST /api/categories` no token → 401

### [API-016] — GET /api/costumes returns paginated list
- Request: `GET /api/costumes`
- Assert: status 200, body has `data`, `total`, `page`, `limit`, `total_pages`
- Assert: each item in `data` has `available_quantity`

### [API-017] — GET /api/costumes with search param
- Request: `GET /api/costumes?search=test`
- Assert: status 200, results filtered by name

### [API-018] — GET /api/costumes pagination
- Request: `GET /api/costumes?page=1&limit=2`
- Assert: `data` array has at most 2 items

### [API-019] — GET /api/costumes limit capped at 100
- Request: `GET /api/costumes?limit=999`
- Assert: `data` array has at most 100 items

### [API-020] — GET /api/costumes/search
- Request: `GET /api/costumes/search?q=a`
- Assert: status 200, array with `available_quantity` on each item

### [API-021] — GET /api/costumes/:id returns detail
- Request: `GET /api/costumes/:validId`
- Assert: status 200, has `images` array, `available_quantity`

### [API-022] — GET /api/costumes/:id not found
- Request: `GET /api/costumes/99999999`
- Assert: status 404

### [API-023] — GET /api/costumes/abc invalid ID
- Request: `GET /api/costumes/abc`
- Assert: status 400

### [API-024] — POST /api/costumes without auth
- Request: `POST /api/costumes` no token → 401

### [API-025] — POST /api/costumes with auth and valid body
- Request: `POST /api/costumes` with token, `{"name":"API Test Costume","quantity":3}`
- Assert: status 201 or 200, body has `id`

### [API-026] — POST /api/costumes missing name returns 400
- Request: `POST /api/costumes` with token, no name field
- Assert: status 400

### [API-027] — PUT /api/costumes/:id without auth returns 401
- Assert: status 401

### [API-028] — PUT /api/costumes/:id updates fields
- Request: `PUT /api/costumes/:id` with token and `{"name":"Updated Name"}`
- Assert: status 200, response name is "Updated Name"

### [API-029] — DELETE /api/costumes/:id without auth returns 401
- Assert: status 401

### [API-030] — DELETE /api/costumes/:id with auth
- Create a costume, then delete it
- Assert: status 200

### [API-031] — GET /api/clients without auth returns 401
- Assert: status 401

### [API-032] — GET /api/clients with auth
- Assert: status 200, paginated, each item has `total_rents`, `active_rents`, `has_overdue`

### [API-033] — GET /api/clients/search with auth
- Request: `GET /api/clients/search?q=test` with token
- Assert: status 200, array

### [API-034] — GET /api/clients/:id with auth
- Assert: status 200, has rental history

### [API-035] — GET /api/clients/99999999 returns 404
- Assert: status 404

### [API-036] — POST /api/clients with auth
- Request: `POST /api/clients` with token and `{"name":"API Test Client"}`
- Assert: status 200 or 201, body has `id`

### [API-037] — GET /api/clients/:id/rents with auth
- Assert: status 200, array of rent orders for that client

### [API-039] — GET /api/rents without auth returns 401
- Assert: status 401

### [API-040] — GET /api/rents with auth
- Assert: status 200, paginated, each item has `client_name`, `status`, `items`

### [API-041] — GET /api/rents?status=active
- Assert: all returned items have `status: "active"`

### [API-042] — POST /api/rents — valid payload with existing client
- Request body: `{ client_id, guarantee_type, rent_start, rent_end, items: [{costume_id, quantity:1}] }`
- Assert: status 201, body has `id`, `status: "active"`, `items` array

### [API-043] — POST /api/rents — missing guarantee_type returns 400
- Assert: status 400

### [API-044] — POST /api/rents — missing rent_start returns 400
- Assert: status 400

### [API-045] — POST /api/rents — empty items array returns 400
- Assert: status 400

### [API-046] — POST /api/rents — rent_end before rent_start
- Assert: status 400, error message "rent_end must be after rent_start"

### [API-047] — POST /api/rents — quantity exceeds available
- Assert: status 400, error message contains "insufficient quantity"

### [API-048] — POST /api/rents — invalid costume_id
- Assert: status 400, error message contains "costume not found"

### [API-049] — PUT /api/rents/:id/return with auth
- Create an active rental, then call return endpoint
- Assert: status 200, `status` is "returned"

### [API-050] — DELETE /api/rents/:id with auth
- Create a rental, then delete it
- Assert: status 200, message "Rent order deleted successfully"

### [API-052] — GET /api/notifications without auth returns 401
- Assert: status 401

### [API-053] — GET /api/notifications with auth
- Assert: status 200, body has `count` (integer) and `items` (array)
- Each item has `rent_order_id`, `client_name`, `rent_end`, `type`
- `type` is either "overdue" or "due_soon"

### [API-054] — PUT /api/settings without auth returns 401
- Assert: status 401

### [API-055] — PUT /api/settings with auth updates app_name
- Request: `PUT /api/settings` with token and `{"app_name":"API Updated Name"}`
- Assert: status 200
- Verify with `GET /api/settings` that `app_name` is "API Updated Name"

### [API-051] — GET /api/rents/abc invalid ID returns 400
- Assert: status 400

### [API-030] — GET /api/clients/abc invalid ID returns 400
- Assert: status 400