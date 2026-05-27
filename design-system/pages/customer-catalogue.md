# Customer Catalogue

- First viewport is useful: nav, search, date range, filters, and product grid.
- Search is debounced 300ms through the data adapter and does not mutate data.
- Availability is batched for visible product IDs and the selected range only.
- Product cards show one range-level availability badge and next available range only when blocked.
- No full calendar, marketing hero, or separate availability side panel on catalogue.
