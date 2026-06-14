# Admin Catalogue

- Product edits stay in local draft state until explicit save.
- Create requires name and variant. Edits support status, image URL/upload, price, variants, and maintenance blocks.
- The page is an inventory editor: the list pane prioritizes product image, name, category/meta, active state, stock health, and unsaved state; the detail pane owns product editing.
- The editor header shows the cover image, active state, price, stock fraction, image count, and dirty/saved state before the tabs.
- Variant deletes are disabled when only one variant remains.
- Maintenance blocks are draft-only until saved to the product draft, then persisted by save.
- Save shows success feedback and clears availability cache through the adapter.
- Catalogue UI modules live under `components/admin/catalogue`; `useCatalogueAdminController.ts` owns selection, draft, save, switch, variant, media, and maintenance orchestration.
- `pages/admin/CatalogueAdmin.tsx` should stay composition-only: list window, create panel, editor shell, and switch dialog wiring.
- The editor stays split into shell, details/media/variants/maintenance tabs, save bar, switch dialog, and catalogue utilities.
- Details, variants, media, and maintenance are focused tab tools; each keeps validation near the relevant field and sends global save/error status to the sticky save bar.
- Destructive media, variant, and maintenance removals use the shared destructive confirmation dialog.
- Unsaved product switching uses the feature switch dialog; do not replace it with `window.confirm`.
