# Acceptance Criteria - Costume Rental Management

## 1. Authentication

### AC-001: User Login
- [ ] User can login with valid credentials (email: admin@busana.com, password: admin123)
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to catalogue page
- [ ] User session persists across page refresh

### AC-002: User Logout
- [ ] User can logout from navbar
- [ ] Logout redirects to login page
- [ ] Session is cleared

---

## 2. Costume Management

### AC-003: View Costume List
- [ ] Display all costumes in catalogue page
- [ ] Show costume name, image thumbnail, quantity
- [ ] Paginated or scrollable list

### AC-004: Add New Costume
- [ ] Navigate to /catalogue/new via UI
- [ ] Fill costume name (required)
- [ ] Select region from dropdown
- [ ] Select category from dropdown
- [ ] Select condition (Excellent/Good/Fair)
- [ ] Enter quantity (required)
- [ ] Enter acquisition date
- [ ] Enter description
- [ ] Submit saves to database
- [ ] Redirect to catalogue after save

### AC-005: View Costume Detail
- [ ] Navigate to /catalogue/:id
- [ ] Display costume details (name, description, region, category, condition, quantity)
- [ ] Display costume images
- [ ] Show edit button

### AC-006: Edit Costume
- [ ] Navigate to /catalogue/:id/edit
- [ ] Pre-populate form with existing data
- [ ] Save changes updates database
- [ ] Redirect to detail page after save

### AC-007: Delete Costume
- [ ] Delete button available on list/detail
- [ ] Confirmation dialog before delete
- [ ] Costume removed from database

### AC-008: Upload Costume Image
- [ ] Image upload button on form
- [ ] Supports multiple images
- [ ] Images display in detail page

---

## 3. Rental System

### AC-009: View Rental List
- [ ] Navigate to /rents
- [ ] Display all rentals with status
- [ ] Show client name, rental dates
- [ ] Filter by status (active/returned)
- [ ] Search functionality

### AC-010: Create New Rental
- [ ] Navigate to /rents/new
- [ ] Select client from existing or create new
- [ ] Select costume(s) to rent
- [ ] Set rent start date
- [ ] Set rent end date
- [ ] Select guarantee type (KTP, SIM, KK, Paspor, Lainnya)
- [ ] Enter guarantee number
- [ ] Submit creates rental
- [ ] Redirect to rental detail after save

### AC-011: View Rental Detail
- [ ] Navigate to /rents/:id
- [ ] Display rental details
- [ ] Display client information
- [ ] Display rented costumes
- [ ] Show rental status (active/returned)

### AC-012: Edit Rental
- [ ] Navigate to /rents/:id/edit
- [ ] Pre-populate form with existing data
- [ ] Save changes updates database

### AC-013: Mark Rental as Returned
- [ ] "Mark Returned" button on active rentals
- [ ] Confirmation before marking
- [ ] Status updates to "returned"

### AC-014: Delete Rental
- [ ] Delete button available
- [ ] Confirmation dialog before delete
- [ ] Rental removed from database

---

## 4. Client Management

### AC-015: View Client List
- [ ] Navigate to /clients
- [ ] Display all clients
- [ ] Show client name, phone

### AC-016: View Client Detail
- [ ] Navigate to /clients/:id
- [ ] Display client details
- [ ] Display client's rental history

### AC-017: Edit Client
- [ ] Edit button on client detail
- [ ] Update client information
- [ ] Changes saved to database

---

## 5. Notifications

### AC-018: Overdue Rental Alerts
- [ ] Badge shows count of overdue rentals
- [ ] Alert displays for rentals past end date

### AC-019: Due Soon Reminders
- [ ] Reminder for rentals due within 3 days
- [ ] Notification displayed in navbar

### AC-020: Notification Bell
- [ ] Click bell shows notification dropdown
- [ ] List of overdue/due soon rentals

---

## 6. Settings

### AC-021: Access Settings
- [ ] Navigate to /settings via sidebar
- [ ] Form displays current settings

### AC-022: Customize App Name
- [ ] Edit app name field
- [ ] Changes apply instantly
- [ ] App name shows in navbar

### AC-023: Customize Tagline
- [ ] Edit tagline field
- [ ] Changes apply instantly

### AC-024: Upload Logo
- [ ] Upload logo image
- [ ] Logo displays in navbar
- [ ] Changes apply instantly

---

## 7. Navigation & UI

### AC-025: Sidebar Navigation
- [ ] Katalog menu links to /catalogue
- [ ] Peminjaman menu links to /rents
- [ ] Klien menu links to /clients
- [ ] Pengaturan menu links to /settings

### AC-026: Direct URL Access
- [ ] All routes accessible via direct URL when authenticated
- [ ] Unauthenticated access redirects to login
- [ ] 404 page for unknown routes

### AC-027: Responsive Design
- [ ] Usable on desktop
- [ ] Usable on mobile

---

## 8. API Backend

### AC-028: Public Endpoints
- [ ] GET /api/settings returns app settings
- [ ] GET /api/costumes returns costume list (public catalogue)

### AC-029: Authentication Endpoints
- [ ] POST /api/auth/login validates credentials
- [ ] POST /api/auth/register creates new user
- [ ] Protected endpoints require Bearer token

### AC-030: Protected Endpoints (Authenticated)
- [ ] GET/POST /api/costumes (CRUD)
- [ ] GET/POST /api/rents (CRUD)
- [ ] GET/POST /api/clients (CRUD)
- [ ] GET /api/notifications returns alerts
- [ ] PUT /api/settings updates settings

---

## Test Coverage Status

| Feature | API Tests | Frontend Tests | Status |
|---------|-----------|---------------|--------|
| Authentication | ✓ | ✓ | Pass |
| Costume Management | Partial | Partial | In Progress |
| Rental System | - | - | Failing |
| Client Management | - | - | Not Tested |
| Notifications | ✓ | - | Pass |
| Settings | - | - | Not Tested |
| Navigation | - | ✓ | Pass |