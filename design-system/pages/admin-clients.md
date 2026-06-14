# Admin Clients

- Search supports name, visible phone, and normalized phone.
- Add/edit forms mutate only on explicit save.
- Client list cards stay sparse: initials, name, WhatsApp phone link, total rentals, and active/out status when rental history provides it.
- Client detail opens as an inline side pane on desktop and a bottom sheet on mobile.
- Client detail prioritizes contact actions, contact fields, notes, last contact, recent status, edit mode, and rental history grouped by lifecycle status.
- Save success feedback should be visible without shifting the primary content.
- Client UI modules live under `components/admin/clients`; shared sheet/create chrome comes from `components/admin/common`.
- Phone actions include visible number context in accessible labels and keep WhatsApp/call destinations explicit.
- Interactive list affordances are real buttons or links; phone links do not depend on card-level click handling.
- Delete is available from secondary more actions and must go through the destructive confirmation sheet.
- Client detail uses the common Radix-backed `AdminBottomSheet` in non-modal persistent mode for desktop side-pane behavior.
