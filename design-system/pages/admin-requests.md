# Admin Requests

Requests are an intake queue optimized for fast staff decisions: queue status, queue controls, request rows, selected request review, and decision actions.

```text
+--------------------------------------------------------------+
| Requests                                                     |
| Intake copy                                      [+ Add] [Filter] |
| + Alert: pending decisions | New 1 | Stale 1 | Delivery 0      |
+-------------------------------+------------------------------+
| [All 1] [Stale 1] [Delivery 0] | Selected CR-0142             |
| Active filter chips            | Customer: Maya Saputra       |
|                                | Items: Batik, Baju Melayu    |
| + CR-0142  Stale 26h          | Dates: 12 Jun - 15 Jun       |
| | Maya Saputra                | Fulfillment: Pickup          |
| | Pickup | Missing proof      | Payment: Missing             |
| +----------------------------+ | Queue age: stale with icon   |
|                                | [Accept] [Edit] [Reject]     |
| Empty/list scroll region       | Activity log                 |
+-------------------------------+------------------------------+

Mobile detail:
+--------------------------------------+
| <- Requests              CR-0142     |
| Customer, stale age, status badges   |
| Items and dates                      |
| Contact and notes                    |
| Activity log                         |
| [Accept] [Edit] [Reject]             |
+--------------------------------------+
```

- Queue controls include all/stale/delivery tabs with counts, one compact filter/sort trigger, reference/customer/phone search, fulfillment filter, payment filter, and sort modes.
- Applied query/fulfillment/payment/sort state is summarized as active chips after Apply and survives deep links through query params.
- Metric tiles link to relevant filtered queues.
- Stale rows must include icon, text, and warning tone, not color alone.
- Add request is the only create primary action.
- Accept/edit/reject are visible only for `requested` records. Non-requested references opened in Requests show a locked explanatory state.
- Selected review order is customer, requested items, date range, fulfillment, payment, stale age, notes/internal notes, decision actions, then activity log.
- Request UI modules live under `components/admin/requests`; shared create/view chrome and `RecordActionBar` come from `components/admin/common`.
- `useRequestsAdminController.ts` owns tab/filter query params, selected request state, staff-created request drafts, accept/reject/edit mutations, and stock availability validation.
- `pages/admin/RequestsAdmin.tsx` should stay composition-only plus table column definitions.
- Mobile filter sheets use the common Radix-backed `AdminBottomSheet` and must not reintroduce custom Escape/scrim logic.
- Mobile detail content must reserve enough bottom padding for the sticky decision bar and bottom tabbar so notes/activity remain reachable.
