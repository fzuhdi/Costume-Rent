# Admin Rentals

- Metrics deep-link into filtered lifecycle queues such as ready/preparing and out-with-customer.
- New orders validate name, phone, dates, product, variant, quantity, and available stock before submit.
- Lifecycle actions stay visible and completion is blocked until payment proof is verified when required.
- Completed records are locked except admin override with a reason.
- Rental UI modules live under `components/admin/rentals`; payment proof, dialogs, record components, and workflow detail stay separate.
- `useRentalsAdminController.ts` owns lifecycle filtering, query-param synchronization, selected rental state, mutation debounce, hold release, next-action metadata, and manual transitions.
- `pages/admin/RentalsAdmin.tsx` should stay composition-only: queue list, workflow detail, and override dialog wiring.
- Payment proof review remains a feature panel inside the rental workflow, not a route-level concern.
