# HeroUI v3 — Known Patterns & Fixes

## ComboBox — Async Data

**Problem:** `useState` for async results causes popover to be one step behind
on first keystroke. `defaultFilter`, `menuTrigger`, `allowsEmptyCollection` do not fix this.

**Root cause:** Known React Aria bug — external state is not synced with
ComboBox's internal popover state on first render.

**Required pattern:**
- Install `@react-stately/data`
- Use `useAsyncList` — pass `list.filterText` / `list.setFilterText`
- Use `<Collection items={list.items}>` inside `ListBox`
- Set `allowsEmptyCollection` dynamically — false when input is empty
- Put "create new" option inside `renderEmptyState` on `ListBox`
- After create: swap ComboBox with confirm pill via `isCreating` state —
  never try to close popover programmatically.

**Reference:** `frontend/src/components/ClientSelect.jsx`
