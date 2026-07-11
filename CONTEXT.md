# Costume Rent

A system for managing costume rentals, inventory quantities, point-of-sale, and client interactions.

## Language

**Costume**:
A distinct type and size of a garment available for rent, tracked by total available quantity rather than individual physical instances.
_Avoid_: Stock Item, Physical Asset, Barcoded Item

**Rental Fee**:
A flat price charged for renting a costume set, completely independent of the rental duration.
_Avoid_: Daily Rate, Hourly Rate

**Event Date**:
The primary date the costume is used by the client. The standard Rental Period is calculated relative to this date (D).
_Avoid_: Usage Date

**Rental Period**:
The allowable time window a client can possess the costume for a single Rental Fee, standardly defined as starting up to two days before the Event Date (D-2) and ending one day after (D+1).
_Avoid_: Duration, Rent Time

**Downpayment**:
An advance payment (typically 50% of the Rental Fee) required to secure a booking when made prior to the pickup window. The remainder is paid at pickup.
_Avoid_: Deposit (overloaded term), Booking Fee

**Security Item**:
A physical item (usually an ID card) held by the shop during the Rental Period to guarantee safe and timely return of the costume.
_Avoid_: Deposit (overloaded term), Collateral

**Damage Fee**:
An additional cost billed to the client *after* the return of the costume and Security Item, relying on a trust-based system to resolve post-rental damages.
_Avoid_: Damage Deposit, Withheld Fee

**Booked (Dipesan)**:
The initial status of a rent order. Inventory is locked, and a downpayment is typically collected. Can be cancelled before pickup.

**Rented (Disewa)**:
The status of a rent order once costumes are picked up. The remaining balance must be paid in full to transition to this state.

**Overdue (Terlambat)**:
The status automatically applied when a rented order is past its expected return date.

**Returned (Dikembalikan)**:
The status of a rent order once the costumes are back in the shop, the security item is returned, and any damage fees are settled. Releases locked inventory.

**Cancelled (Dibatalkan)**:
The status of a booked order that was cancelled. Downpayment is forfeited (non-refundable), and inventory is released.

