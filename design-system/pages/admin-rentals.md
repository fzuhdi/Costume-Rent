# Admin Rentals

- Metrics deep-link into filtered lifecycle queues such as ready/preparing and out-with-customer.
- New orders validate name, phone, dates, product, variant, quantity, and available stock before submit.
- Lifecycle actions stay visible and completion is blocked until payment proof is verified when required.
- Completed records are locked except admin override with a reason.
- Rental UI modules live under `components/admin/rentals`; payment proof, dialogs, record components, and workflow detail stay separate.
- Payment proof review remains a feature panel inside the rental workflow, not a route-level concern.
