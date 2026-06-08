# Admin Requests

- Queue controls include tabs, reference/customer/phone search, fulfillment filter, payment filter, and sort modes.
- Filter and sort state should survive deep links through query params.
- Metric tiles link to relevant filtered queues.
- Stale rows must include text or icon, not color alone.
- Accept/edit/reject are available only for `requested` records.
- Request UI modules live under `components/admin/requests`; shared create/view chrome comes from `components/admin/common`.
- `useRequestsAdminController.ts` owns tab/filter query params, selected request state, staff-created request drafts, accept/reject/edit mutations, and stock availability validation.
- `pages/admin/RequestsAdmin.tsx` should stay composition-only plus table column definitions.
- Mobile filter sheets use the common Radix-backed `AdminBottomSheet` and must not reintroduce custom Escape/scrim logic.
