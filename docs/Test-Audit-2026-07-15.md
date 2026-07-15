# Costume Rental App - Test Report
Date: 2026-07-15

## Overall Summary
- **Total Scenarios**: 26
- **Passed**: 24
- **Failed**: 2 (Dashboard metrics mismatch, Catalogue missing schedule tab)
- **Pass Rate**: 92.3%
- **Average UI Score**: ~8.1/10
- **Average UX Score**: ~8.5/10

---

## Critical Issues (Must Fix)
1. **Costume Catalogue Availability**: The "Active Schedule" calendar is entirely missing from the Catalogue Detail page, making it impossible to see when a specific costume is booked.
2. **Dashboard Specs**: The dashboard is missing the "Total Rents", "Active Clients", and "Upcoming Rentals List" as outlined in the requirements.

## High Priority Issues
1. **POS Upgrade to Booked UX**: When clicking "Ubah Status ke Booked" from a Draft order, the modal ONLY asks for "Bukti Bayar" file upload. It lacks a payment method selector. If a customer paid in CASH, there is no way to upgrade without uploading a dummy file.
2. **Form Reset on Catalogue Edit**: Editing a costume resets the "Wilayah" and "Kategori" dropdowns to "-", risking data loss if the user forgets to re-select them.

## Low Priority Issues
1. **POS Search Filter on Rent History**: Clearing the "Cari klien" text input doesn't always automatically reset the list; sometimes requiring explicitly clearing the internal state or pressing enter multiple times.

## UX Improvement Recommendations
- **Add Search/Pagination to Clients List**: To improve scalability as the business grows.
- **Form Error Scrolling**: When clicking "Simpan" on long forms with empty fields, automatically scroll the viewport to the missing field.
- **Calendar Mobile View**: Ensure the monthly grid scales down nicely for smaller screens or switches to an agenda view.

---

## UI Design Scores by Page
| Page | UI Score (1-10) | Key Observations | Top Improvement Suggestions |
|------|----------------|------------------|-----------------------------|
| Login | 9/10 | Very clean minimal layout with good feedback on errors. | Keep it as is. |
| Dashboard | 7/10 | The layout is clean but it doesn't match the test plan specs. | Update the metrics to match business requirements (e.g., Total Rents, Active Clients) and add the upcoming rentals list. |
| Clients List | 8/10 | Clean layout, good contrast, clear action buttons for each row. | Add search/filter capabilities at the top. Implement pagination or infinite scroll for scalability. |
| Client Form/Detail | 7/10 | Functional form layout, identity file upload works. | Visually separate contact info from identity documents (e.g., use distinct cards/sections). Add drag-and-drop to file upload. |
| Calendar | 9/10 | Very clean grid view. Good color coding for different order statuses (Booked, Rented, Overdue, Returned). Search bar and month navigation are well-placed. | Mobile view might be cramped; ensure it degrades gracefully to a list view on smaller screens if not already done. |
| Settings | 8/10 | Simple and direct. Inputs are clear. | Add success toast notifications rather than just basic text below buttons when saved. |
| POS Checkout | 9/10 | Very feature-rich. Live updates for totals, great inline client creation, and clear error validations below fields. | The native date picker can be tricky for keyboard-only users; consider using a custom date picker component. Also, make the cart sticky on desktop so it's always visible. |
| Rent Details | 9/10 | Very comprehensive view. The activity log is an excellent touch for tracing history. Good visual cues for status. | When upgrading Draft to Booked, the modal lacks a payment method selector (only asks for Proof). If they pay CASH, they can't upload proof, making it confusing. |
| Rent History | 8/10 | Clean list, search bar works dynamically when pressing Enter. | Add a visual loading indicator when searching/filtering. |
| Catalogue List | 9/10 | Excellent list/grid views. The layout is clean and informative with quick actions. | None, very solid. |
| Catalogue Detail | 6/10 | Basic details are visible, but missing the "Active Schedule Calendar" mentioned in the specs. Editing wipes some dropdown fields. | Add the Calendar view for availability. Fix the state management on the Edit form so dropdowns (Wilayah, Kategori) don't reset to "-". |

---

## Test Results by Module

### Module 1: Authentication
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Invalid Login Attempt** | Pass | 9/10 | None. | Entered wrong password. Showed "Invalid email or password" and prevented login. |
| **Successful Login** | Pass | 9/10 | None. | Entered admin credentials. Redirected correctly into the app. |

### Module 2: Dashboard
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Viewing Business Metrics** | **Fail** | 5/10 | Missing required data views. | Navigated to Dashboard. It shows "Diambil Hari Ini", "Kembali Hari Ini", "Keuangan Hari Ini" and "Kostum Terpopuler". However, it completely lacks "Total Rents", "Active Clients", and the "List of upcoming/pending rentals" that were specified in the test plan. |

### Module 3: POS (Point of Sale)
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Successful Checkout with DP** | Pass | 9/10 | None. | Checked "DP Sudah Dibayar", entered custom valid DP, used CASH. Redirected smoothly to rent details page (`/rents/14`). |
| **Adjusting Custom Rental Fee in Cart** | Pass | 9/10 | None. | Changed the costume price from 40k to 50k. The totals and the 50% min DP dynamically adjusted correctly to 25k. |
| **Empty Form Validation** | Pass | 8/10 | General error at the top is good, but scrolling to the invalid field would be better. | Leaving client empty blocked submission and showed "Terdapat isian yang belum lengkap". |
| **Inline Client Creation** | Pass | 10/10 | Very intuitive flow. | Typed non-existent "Zorro", clicked the inline "+ Buat klien baru" button, filled the inline form. Successfully created the client alongside the order! |
| **DP Amount Live Validation** | Pass | 9/10 | Excellent real-time feedback. | Tried entering DP < 50% (got "Minimal DP adalah Rp 25.000"). Tried DP > 100% (got "Maksimal DP adalah Rp 50.000"). |
| **Non-Cash Payment Proof** | Pass | 9/10 | None. | Selected TRANSFER BCA, tried to submit. Blocked with "Bukti pembayaran downpayment wajib diunggah". |

### Module 4: Rent Management (Order Lifecycle)
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Searching and Filtering** | Pass | 8/10 | Requires pressing Enter, but doesn't have a clear "Search" button. | Searched for "Zorro". The list correctly filtered down to just the Zorro order. Clearing search brought back the full list. |
| **Upgrading Draft to Booked** | Pass | 7/10 | Modal asks for "Bukti Bayar" but doesn't let you select "CASH". | Successfully uploaded a dummy file for the proof and the order was upgraded to Booked. |
| **Canceling an Order** | Pass | 10/10 | Good warning about DP forfeiture. | Clicked "Batalkan", confirmed in dialog. Status changed to "Canceled" and logged correctly. |
| **Early Takeaway Detection** | Pass | 9/10 | None. | Detected an early pickup (H-6) and dynamically calculated and recommended a Rp 200.000 fee! |
| **Processing Order Pickup** | Pass | 9/10 | None. | Successfully charged the early fee, confirmed pickup, and status changed to "Rented". |
| **Extending a Rental** | Pass | 10/10 | Instant preview of extension fee is fantastic. | Added 2 extra days, UI previewed +Rp 100.000 fee. Confirmed, and balance updated perfectly. |
| **Processing Order Return** | Pass | 9/10 | Clicking the label didn't check the checkbox in React natively (a technical detail), but the UI logic correctly blocks submission if ID is not marked as returned. | Checked "Kartu Identitas Dikembalikan" and clicked return. Status changed to "Returned". |
| **Editing Order Details** | Pass | 8/10 | Canceled orders might incorrectly still show an "Edit Order" button, but disables saving. | Clicked Edit, changed date, but since the order was Canceled, it correctly disabled saving to prevent invalid state changes. |

### Module 5: Costume Catalogue Management
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Creating a New Costume** | Pass | 8/10 | Redirects to the detail page instead of the list page. | Created "Baju Adat Jawa", uploaded a dummy image, filled price/stock/desc. Successfully saved. |
| **Editing an Existing Costume** | Pass | 5/10 | The dropdown fields (Wilayah, Kategori) reset when opening edit mode, which can cause accidental data loss if not re-selected. | Changed the name to "Baju Adat Jawa Tengah". Saved successfully. |
| **Deleting a Costume** | Pass | 10/10 | Good confirmation dialog. | Clicked delete on the newly created costume. Redirected to the list, and it was successfully removed from the inventory. |
| **Checking Costume Availability** | **Fail** | 0/10 | Missing feature. | Looked for the "active schedule tab" on the catalogue detail page, but there is no calendar or availability grid shown. |

### Module 6: Client Management
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Add New Client** | Pass | 8/10 | Identity file upload UI lacks drag-and-drop. | Successfully filled out the form (name, phone, address) and uploaded a KTP identity file. The new client appeared in the list. |
| **Edit Existing Client** | Pass | 8/10 | Missing explicit loading indicator while saving the update. | Edited 'John Doe's phone number and address. Changes were saved and reflected immediately. |
| **Delete Client** | Pass | 9/10 | Good use of a confirmation dialog. | Clicked delete on 'Alice Bob' and confirmed in the modal. The client was successfully removed from the list. |

### Module 7: Calendar Module
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Viewing Monthly Schedules** | Pass | 9/10 | The popover/dialog to view order details from an event requires clicking again; maybe make the hover state show brief info. | Able to see the grid with clear indicators for pickups/returns. Clicking an event successfully popped up the order detail dialog and allowed navigating to the full order page. The search bar successfully filtered the events in real-time (e.g., searching "Budi" hid other clients). |

### Module 8: Settings & Configuration
| Scenario | Status | UX Score | UX Issues | Observations |
|----------|--------|-----------|-----------|--------------|
| **Updating Store Policies** | Pass | 9/10 | None. | Updated the "Hari Persiapan Ambil" to 4 days. When testing POS, the UI accurately reflected "H-4" for the preparation date based on the chosen Event Date. |