# Admin Rentals

- Metrics deep-link into filtered lifecycle queues such as ready/preparing and out-with-customer.
- The page reads as a lifecycle command center: queue summary, search/filter chips, rental rows, and selected lifecycle detail.
- Lifecycle filters cover all, ready/preparing, out/on rent, returned, and completed; chips expose pressed state and queue counts for assistive tech.
- New orders validate name, phone, dates, product, variant, quantity, and available stock before submit.
- Detail order is current order header, next action, proof/complete blocker, roadmap, items, payment/fulfillment plan, checklist, proof review, manual corrections, and activity.
- The mobile detail uses one sticky next-action area; the in-card primary action is desktop-only.
- Lifecycle actions stay visible, and disabled actions show a visible reason. Completion is blocked until payment proof is verified when required.
- Completed records are read-only except admin override with a required reason.
- Roadmap steps are rendered as an ordered list with textual done/current/upcoming state, not color alone.
- Payment proof upload exposes accepted type/size help, validation, and focus-safe review/reject dialogs.
- Rental UI modules live under `components/admin/rentals`; payment proof, dialogs, record components, and workflow detail stay separate.
- `useRentalsAdminController.ts` owns lifecycle filtering, query-param synchronization, selected rental state, mutation debounce, hold release, next-action metadata, and manual transitions.
- `pages/admin/RentalsAdmin.tsx` should stay composition-only: queue list, workflow detail, and override dialog wiring.
- Payment proof review remains a feature panel inside the rental workflow, not a route-level concern.
