# Admin Catalogue

- Product edits stay in local draft state until explicit save.
- Create requires name and variant. Edits support status, image URL/upload, price, variants, and maintenance blocks.
- Variant deletes are disabled when only one variant remains.
- Maintenance blocks are draft-only until saved to the product draft, then persisted by save.
- Save shows success feedback and clears availability cache through the adapter.
