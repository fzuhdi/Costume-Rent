# Admin Clients

- Search supports name, visible phone, and normalized phone.
- Add/edit forms mutate only on explicit save.
- Client detail shows contact, notes, last contact, and rental history.
- Save success feedback should be visible without shifting the primary content.
- Client UI modules live under `components/admin/clients`; shared sheet/create chrome comes from `components/admin/common`.
- Client detail uses the common Radix-backed `AdminBottomSheet` and keeps phone links from stealing the card-level detail interaction.
