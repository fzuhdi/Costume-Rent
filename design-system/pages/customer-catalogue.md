# Customer Catalogue

- Route is `/catalogue`; `/` is the customer landing page.
- Product results stay hidden until `search=1` is present.
- First searched viewport is useful: nav, search, date range, filter rail, and product grid.
- Search is debounced 300ms through the data adapter and does not mutate data.
- Availability is batched for visible product IDs and the selected range only.
- Product cards show one range-level availability badge and next available range only when blocked.
- Mobile product cards use a dense 2-column grid and lazy render batches.
- Advanced filters are URL-backed: `region`, `type`, `gender`, `minPrice`, `maxPrice`, `sort`, `q`, `start`, `end`, `search`.
- No full calendar, marketing hero, or separate availability side panel on catalogue.
- Catalogue UI modules live under `components/customer/catalogue`; product cards are imported from `components/customer/product`.
- The filter panel uses Radix Dialog with existing `filter-panel-scrim` and `catalogue-filter-panel` class hooks. Do not hand-roll focus traps, Escape handling, or scrim dismissal.
