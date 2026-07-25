# End-to-End Test Plan: Costume Rent System

This document outlines the complete E2E test cases for the Costume Rent system. It is formatted as a checklist so an AI subagent (or human tester) can systematically execute and verify each step in the UI.

## 1. POS (Point of Sale) & Booking Flow
**Goal**: Verify a user can create a rental order from scratch.
- `[ ]` Navigate to `/admin/pos`.
- `[x]` **Select Client**: Search for an existing client (e.g., "John Doe") and select them. Verify the client info appears in the sidebar.
- `[x]` **Select Dates**: Open the date picker, select a rental start date and end date.
- `[x]` **Add Costumes**: Search the catalogue for a costume (e.g., "Spiderman") and add it to the cart. Verify the total price updates.
- `[x]` **Checkout (DP)**: 
  - Click checkout.
  - Choose "Transfer" as payment method.
  - Input 50% of the total as the Down Payment (DP).
  - Verify the order is created successfully and redirects to the Rent Detail page.
  - Verify the status on the detail page is **Booked**.

## 2. Order Status Transitions (Rent Detail Page)
**Goal**: Verify the deep state machine transitions correctly.
- `[x]` Navigate to `/admin/rents` and click on the "Booked" order created in Test 1.
- `[x]` **Mark Rented (Handover)**:
  - Click "Serahkan Kostum" (Mark Rented).
  - Pay the remaining 50% balance.
  - Verify the status changes to **Rented**.
- `[x]` **Mark Returned (Receive)**:
  - Click "Terima Kostum" (Receive).
  - Upload a dummy return photo.
  - Verify the status changes to **Returned**.
- `[x]` **Inspect & Penalties**:
  - Click "Inspeksi" (Inspect).
  - Add a late fee of Rp 20,000 and a damage fee of Rp 50,000. *(Note: Simulated 'No Damage' flow instead, which auto-completed)*
  - Verify the status changes to **Inspected** and the "Sisa Tagihan" (Balance) becomes Rp 70,000.
- `[x]` **Complete Order**:
  - Click "Selesaikan Pesanan" (Complete).
  - Pay the remaining Rp 70,000 penalty fee.
  - Verify the status changes to **Completed** and balance is Rp 0.

## 3. Order Cancellation & Voiding
**Goal**: Verify payments can be voided and orders cancelled.
- [x] Create a new **Booked** order with a 50% DP in the POS.
- [x] Go to the Rent Detail page for this new order.
- [x] Cancel the order. Verify the status changes to **Cancelled**.
- [x] Go to the payment history section, find the 50% DP transaction, and click the Trash icon to void it.
- [x] Verify the balance reflects the voided transaction.

## 4. Catalogue Management
**Goal**: Verify CRUD operations on costumes.

- [x] **Create**: 
  - Add a new costume via "Tambah Kostum".
  - Verify it shows up in the catalogue grid/list view.
- [x] **Read**: 
  - Search for the newly created costume.
  - Check the details view `/admin/catalogue/[id]`.
- [x] **Update**: 
  - Edit the costume details (e.g., price, stock).
  - Verify changes reflect on the frontend.
- [x] **Delete**: 
  - Click the Delete/Trash button for the costume.
  - Confirm the deletion in the prompt/modal.
  - Verify the costume no longer appears in the catalogue search results.
## 5. Client Management (CRUD)
**Goal**: Verify CRUD operations for clients.
- [x] **Create**:
  - Navigate to `/admin/clients`.
  - Click "Tambah Klien" (Add New Client).
  - Fill in Name, Phone, Address, and Instagram handle, then submit.
  - Verify the new client appears in the table.
- [x] **Read**:
  - Use the search bar to find the newly created client.
  - Verify the client data displays correctly in the row.
- [x] **Update**:
  - Click the Edit button for the client.
  - Change their phone number and address.
  - Save and verify the updated information reflects in the table.
- [x] **Delete**:
  - Click the Delete/Trash button for the client.
  - Confirm the deletion.
  - Verify the client is removed from the table.

## 6. Dashboard & Calendar
**Goal**: Verify high-level metrics and visual schedules.
- [x] Navigate to `/admin` (Dashboard).
- [x] Verify the "Active Rents", "Pending Return", and "Monthly Revenue" metric cards display numbers (not empty/loading forever).
- [x] Verify the "Recent Orders" table populates with the latest created orders.
- [x] Navigate to `/admin/calendar`.
- [x] Verify that the orders created in Test 1 and 3 appear as blocks on their respective rental dates.