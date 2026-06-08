# Product Detail

- Show product image/name/price before controls.
- Hide thumbnail controls when only one image exists; with multiple images, selected thumbnail state must be visible and accessible.
- Favorite is a persisted local toggle with `aria-pressed` and visible undo copy.
- Calendar requests one product/month window and remains under 62 days.
- Add-to-request is disabled until a valid available variant is selected.
- Product UI modules live under `components/customer/product`: product card, availability panel, product detail, product availability calendar, and calendar utilities stay separate.
- Do not replace the feature-owned availability calendar with a third-party calendar dependency without an approved dependency migration.
