# Comprehensive Test Plan: Costume Rental POS & Rent Management

This document outlines the End-to-End (E2E) testing scenarios for all major modules in the Costume Rental application. The tests are written using Gherkin syntax (`Given`, `When`, `Then`) to ensure clear and actionable steps for automated or manual QA testing.

---

## 1. Authentication Module

### Scenario: Successful Login
```gherkin
Given the user is on the Login page
When the user enters valid credentials (username and password)
And the user clicks the "Login" button
Then the user should be redirected to the Dashboard page
And a success notification should be displayed
And the user session should be securely stored
```

### Scenario: Invalid Login Attempt
```gherkin
Given the user is on the Login page
When the user enters an incorrect password
And the user clicks the "Login" button
Then an error message "Invalid credentials" should be displayed
And the user should remain on the Login page
```

---

## 2. Dashboard Module

### Scenario: Viewing Business Metrics
```gherkin
Given the user is logged in
When the user navigates to the Dashboard page
Then the user should see accurate statistics for "Total Rents", "Revenue", and "Active Clients"
And the user should see a list of upcoming or pending rentals for the week
```

---

## 3. POS (Point of Sale) Module

### Scenario: Successful Checkout without DP (Draft Status)
```gherkin
Given the user is on the POS page
And the user selects a valid Event Date
When the inventory loads
And the user adds an available costume to the cart
And the user selects an existing client from the Client Select dropdown
And the user leaves "DP Sudah Dibayar" unchecked
And the user clicks "Simpan Transaksi"
Then a new rental order should be created with status "Draft"
And the user should be redirected to the Rent Detail page for the newly created order
```

### Scenario: Successful Checkout with DP (Booked Status)
```gherkin
Given the user is on the POS page
And the user selects a valid Event Date
When the inventory loads
And the user adds an available costume to the cart
And the user selects an existing client
And the user checks "DP Sudah Dibayar"
And the user inputs a Custom DP amount greater than or equal to 50% of the total fee
And the user selects "CASH" as the payment method
And the user clicks "Simpan Transaksi"
Then a new rental order should be created with status "Booked"
And the user should be redirected to the Rent Detail page for the newly created order
```

### Scenario: Adjusting Custom Rental Fee in Cart
```gherkin
Given the user is on the POS page with an item in the cart
When the user modifies the "Harga Sewa" input for the item in the cart
Then the Total Harga Sewa should dynamically update to reflect the new custom price
And the Minimum DP calculation (50%) should automatically adjust based on the new total
```

### Scenario: Removing Items and Changing Quantities in Cart
```gherkin
Given the user is on the POS page with multiple items in the cart
When the user changes the quantity of an item using the + or - buttons
Then the Total Harga Sewa should recalculate accurately
When the user clicks the "Trash" icon on an item
Then the item should be removed from the cart completely
```

### Scenario: Empty Form Validation
```gherkin
Given the user is on the POS page
When the user leaves the client empty and the cart empty
And the user attempts to click "Simpan Transaksi"
Then the system should block the submission
And an alert banner should appear stating "Terdapat isian yang belum lengkap atau tidak valid."
```

### Scenario: Inline Client Creation during POS Checkout
```gherkin
Given the user is on the POS page
When the user searches for a non-existent client name
Then the "Tambah Klien Baru" button should be visible
When the user clicks "Tambah Klien Baru"
And the user fills in the new client's details
And the user completes the checkout process
Then a new client record should be created in the database
And the new rental order should be associated with this new client
```

### Scenario: DP Amount Live Validation
```gherkin
Given the user is on the POS Checkout modal with "DP Sudah Dibayar" checked
When the user enters an amount less than 50% into the Nominal DP field
Then a real-time validation error should appear below the input after a short delay
And the "Simpan Transaksi" button should highlight the incomplete fields if clicked
```

### Scenario: Non-Cash Payment Proof Requirement
```gherkin
Given the user is on the POS Checkout modal with "DP Sudah Dibayar" checked
When the user selects "TRANSFER BCA" as the payment method
And the user attempts to click "Simpan Transaksi" without uploading a proof file
Then the system should block the submission
And an error message "Bukti pembayaran downpayment wajib diunggah" should be displayed
```

---

## 4. Rent Management (Order Lifecycle)

### Scenario: Searching and Filtering Rent History
```gherkin
Given the user is on the Rent History page
When the user selects the "Booked" status filter
Then only orders with the "Booked" status should be displayed
When the user types a client name into the search bar
Then the list should filter down to orders matching that client's name
```

### Scenario: Canceling an Order
```gherkin
Given the user is viewing an active rent order (Draft or Booked)
When the user clicks "Batalkan Pesanan"
And the user confirms the cancellation
Then the order status should change to "Canceled"
And the reserved costume inventory should be released back for those dates
```

### Scenario: Upgrading Draft to Booked
```gherkin
Given the user is viewing a "Draft" rent order in the Rent Detail page
When the user clicks "Terima DP"
And the user inputs a valid DP amount and selects a payment method
And the user submits the form
Then the order status should change to "Booked"
And the financial breakdown should reflect the paid DP
```

### Scenario: Processing Order Pickup (Booked to Rented)
```gherkin
Given the user is viewing a "Booked" rent order
When the user clicks "Serahkan Kostum"
And the user confirms the security item (Jaminan) is received
And the user pays the remaining balance (Sisa Tagihan)
Then the order status should change to "Rented"
```

### Scenario: Early Takeaway Detection
```gherkin
Given the user is processing a pickup for an order
When the current date is earlier than the scheduled `pickup_date`
Then the system should automatically calculate and display an "Early Takeaway Fee"
And this fee should be added to the Total Sisa Tagihan before checkout
```

### Scenario: Marking Order as Inspecting
```gherkin
Given the user is viewing a "Rented" rent order
When the user clicks "Mulai Inspeksi" (or equivalent button to mark inspecting)
Then the order status should transition to "Inspecting"
And the system should allow the staff to check the costumes for damages
```

### Scenario: Processing Order Return
```gherkin
Given the user is viewing an "Inspecting" or "Rented" rent order
When the user clicks "Selesaikan Pengembalian"
And the user inputs any applicable Damage Fees or Late Fees
And the user submits the return form
Then the order status should change to "Returned"
And the system should prompt to return the client's security item (Jaminan)
```

### Scenario: Extending a Rental
```gherkin
Given the user is viewing a "Rented" rent order
When the user clicks "Perpanjang Sewa"
And the user inputs "2" extra days
Then the UI should dynamically preview the "Biaya Tambahan" (Total Daily Rent × 2)
When the user confirms the extension
Then the Expected Return Date should be pushed back by 2 days
And the extension fee should be added to the order's balance
```

### Scenario: Editing Order Details
```gherkin
Given the user is viewing any active rent order
When the user clicks "Edit Data"
And the user changes the "Tanggal Acara" to a new date
And the user clicks "Simpan Perubahan"
Then the order's Event Date should be updated successfully without altering the status
```

---

## 5. Costume Catalogue Management

### Scenario: Creating a New Costume
```gherkin
Given the user is on the Catalogue Form page
When the user inputs the Costume Name, Category, Size, Rental Fee, and Quantity
And the user uploads a cover image
And the user clicks "Simpan"
Then the costume should be added to the inventory
And the user should be redirected to the Catalogue list page
```

### Scenario: Editing an Existing Costume
```gherkin
Given the user is on the Catalogue Detail page
When the user clicks the "Edit" button
And the user updates the Costume Name or Rental Fee
And the user clicks "Simpan Perubahan"
Then the costume details should be successfully updated in the database
And the user should see the updated information on the Catalogue Detail page
```

### Scenario: Deleting a Costume
```gherkin
Given the user is on the Catalogue Detail page
When the user clicks the "Hapus" (Delete) button
And the user confirms the deletion in the warning modal
Then the costume should be removed from the inventory
And the deleted costume should no longer appear in search results
```

### Scenario: Checking Costume Availability
```gherkin
Given the user is viewing the Catalogue Detail page for a specific costume
When the user looks at the active schedule tab
Then the calendar should accurately block out dates where the costume is "Booked" or "Rented"
And the available stock should reflect total quantity minus rented quantity for those dates
```

---

## 6. Client Management

### Scenario: Creating a New Client
```gherkin
Given the user is on the Client Form page
When the user fills in the client's Name, Phone, and Address
And the user submits the form
Then the client should be created
And the user should be redirected to the Client List page
```

### Scenario: Editing an Existing Client
```gherkin
Given the user is on the Client Detail page
When the user clicks the "Edit" button
And the user updates the client's Phone Number or Address
And the user clicks "Simpan Perubahan"
Then the client's contact information should be successfully updated in the database
```

### Scenario: Deleting a Client
```gherkin
Given the user is on the Client Detail page
When the user clicks the "Hapus" (Delete) button
And the user confirms the deletion
Then the client record should be removed from the system
And the deleted client should no longer appear in the POS autocomplete suggestions
```

### Scenario: Viewing Client Rental History
```gherkin
Given the user is on the Client List page
When the user clicks on a specific client
Then the user should be redirected to the Client Detail page
And a history of all past and current rent orders associated with this client should be listed
```

---

## 7. Calendar Module

### Scenario: Viewing Monthly Schedules
```gherkin
Given the user navigates to the Calendar page
When the user views the monthly grid
Then the user should see indicators for upcoming pickups (Ambil) and returns (Kembali)
And clicking on a specific day should reveal the list of corresponding rent orders
```

---

## 8. Settings & Configuration

### Scenario: Updating Store Policies
```gherkin
Given the user is on the Settings page
When the user updates the "Pickup Days Before Event" setting from 2 to 3
And the user saves the changes
Then the POS Event Date logic should now automatically calculate the Pickup Date as H-3 from the selected Event Date
```
