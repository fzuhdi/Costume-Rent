# Costume Rental System - Product Requirements Document (PRD)

## 1. Introduction & Objectives
The purpose of this document is to define the full functional and business requirements for the Costume Rental System (POS). It serves as the primary guidance for ongoing and future development. The objective is to transition from a manual, spreadsheet-based tracking system to a robust, automated digital system that prevents double-booking, accurately tracks partial returns, automates penalty calculations, and maintains a strict audit trail of all staff actions.

## 2. User Roles
*   **Staff:** Can create orders, process payments, transition states, and perform daily POS operations.
*   **Manager/Admin:** Can override system rules (e.g., waive late fees, alter prices after booking) and view comprehensive activity logs.

## 3. System States & Order Lifecycle
To manage inventory accurately, the system relies on strict state transitions. Orders exist in one of the following states:

| Status | Stock Reserved? | Payment Requirement | Description |
| :--- | :---: | :--- | :--- |
| **Draft** | No | None | Initial cart creation. Lazily deleted/ignored if past expiry time during query. |
| **Booked** | Yes | $\ge$ 50% Down Payment | Order secured. Inventory locked for the requested dates. |
| **Rented** | Yes | 100% Paid | Costumes picked up by the client. Continues to accrue late fees if past due. |
| **Inspecting** | Yes | 100% Paid | Costumes physically returned to the store but pending staff quality/damage check. |
| **Returned** | No | 100% Paid (+ Penalties) | QC passed (or penalties paid), order fully closed, and inventory released. |
| **Cancelled**| No | Varies | Order aborted before pickup. |

> **Note on "Overdue":** There is no explicit "Overdue" status. Orders remain in the `Rented` state when they pass their expected return date, and the system dynamically accrues a `LateFee`.

## 4. End-to-End Operational Workflow

### Phase 1: Inquiry & Cart Generation
*   **Availability Check:** Staff queries the inventory database for requested dates.
*   **Cart Initialization:** Staff adds available items to the POS cart. 
*   **Price Negotiation:** Staff can manually override standard catalogue prices **before** the status transitions out of `Draft`.
*   **Collateral Logging:** Staff records the physical guarantee provided by the client (Options: `KTP`, `SIM`, `DEPOSIT`, `KARTU PELAJAR`).

### Phase 2: Booking & Payment
*   **Draft Expiry & Lazy Deletion:** Draft orders that are older than a configurable threshold (e.g., 1 hour) are considered expired. Instead of a background cron job, the system will lazily filter out or delete these expired drafts when the database is queried.
*   **Race Condition Check:** When staff clicks "Checkout", a final inventory validation runs. If another user has secured the same item for overlapping dates, checkout is blocked.
*   **Payment Collection:** The client must pay a minimum of 50% of the total order value. Staff logs the `PaymentMethod` (`CASH`, `TRANSFER BCA`, `TRANSFER GOPAY`, `QRIS`) and `PaymentStatus` (`LUNAS`, `BELUM LUNAS`).
*   **Status Update:** Upon successful payment logging, the order becomes `Booked`.

### Phase 3: Pickup (Takeaway)
*   **Standard Pickup:** Client picks up the costume within the configurable `D-2` window. Balance must be settled (`PaymentStatus = LUNAS`). Order becomes `Rented`.
*   **Early Pickup:** Client requests pickup *before* the `D-2` window. The system automatically adds the **Early Takeaway Fee** to the invoice. Once settled, the status becomes `Rented`.

### Phase 4: Active Rental & Extensions
*   **Mid-Rent Extension:** A client requests to extend their rental. The system verifies inventory for the extra days.
    *   *Conflict:* Blocked if the item is already `Booked` by someone else.
    *   *Success:* Expected return date is updated, and a supplemental invoice is generated.

### Phase 5: Return & Quality Control (Item-Specific Tracking)
Because clients may return parts of an order at different times, tracking is done at the **item level**.
*   **Item Statuses:** `rented`, `inspecting`, `returned`, `lost` (hilang).
*   **Physical Drop-off:** When items are returned, staff updates those specific items to `Inspecting`. The order remains `Rented` if other items are still outstanding.
*   **Damage/Penalty (Fail QC):** If damage is found, a manual `DamageFee` is added. The item cannot be marked `Returned` until the fee is settled.
*   **Lost Items:** Items marked as `lost` trigger an immediate replacement fee (added to `DamageFee`).
*   **Partial Late Returns:** If a user returns 2 out of 3 items on time, and 1 item is late, the automated **Late Fee** is calculated and charged *only* on the 1 unreturned item.

## 5. Financial Calculations & Formulas

### Base Order Calculation
*   `Total Base Price = SUM(Negotiated Item Price * Quantity * Total Rent Days)`
*   `Minimum DP Required = Total Base Price * 0.5`

### Early Takeaway Penalty
Triggered when pickup occurs earlier than the `D-2` window.
*   `Early Days = ABS(Current Date - (Booking Start Date - 2))`
*   `Early Fee = SUM(Early Days * Daily Item Rate for all items)`

### Item-Specific Late Return Penalty
Calculated individually for items still in `rented` status when `Current Day > D+0.5`. Calculation begins from `D+1`.
*   `Late Days = ABS(Return Date - (Booking End Date + 1))`
*   `Late Fee per Item = Late Days * Daily Item Rate`
*   *Note: If an item is dropped off to `Inspecting`, the Late Days counter stops for that specific item.*

## 6. Business Rules & Exceptions
*   **Cancellation Policy:** A booking is **100% refundable** if cancelled within 24 hours of creation **AND** outside the `D-2` pickup window. Otherwise, the DP is non-refundable.
*   **Managerial Overrides:** Authorized admin staff can manually waive early fees, late fees, or modify statuses directly.
*   **Audit Logging:** Every state change, price modification, fee waiver, and manual override must be immutably recorded in an `ActivityLog` table (Timestamp, User ID, Action, Old Value, New Value).

## 7. Required Database Schema Changes
To support this PRD, the following database entities will be updated/created:

**1. RentOrder (Modifications)**
*   Add `EarlyTakeawayFee`, `LateFee`, `ExtensionFee`, `RefundAmount`.
*   Add `PaymentMethod` (string) and `PaymentStatus` (string).

**2. RentOrderItem (Modifications)**
*   Add `ReturnedQuantity` (int).
*   Add `ItemStatus` (string: `rented`, `inspecting`, `returned`, `lost`).
*   Add `CustomRentalFee` (int) to support price negotiation.

**3. ActivityLog (New Entity)**
*   `ID`, `RentOrderID`, `UserID`, `ActionType`, `OldValue`, `NewValue`, `Timestamp`.