# Admin Catalogue

- Product edits stay in local draft state until explicit save.
- Create requires name and variant. Edits support status, image URL/upload, price, variants, and maintenance blocks.
- Variant deletes are disabled when only one variant remains.
- Maintenance blocks are draft-only until saved to the product draft, then persisted by save.
- Save shows success feedback and clears availability cache through the adapter.
- Catalogue UI modules live under `components/admin/catalogue`; `useCatalogueAdminController.ts` owns selection, draft, save, switch, variant, media, and maintenance orchestration.
- `pages/admin/CatalogueAdmin.tsx` should stay composition-only: list window, create panel, editor shell, and switch dialog wiring.
- The editor stays split into shell, details/media/variants/maintenance tabs, save bar, switch dialog, and catalogue utilities.
- Unsaved product switching uses the feature switch dialog; do not replace it with `window.confirm`.
