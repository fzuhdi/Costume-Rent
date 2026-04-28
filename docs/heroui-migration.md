# HeroUI v3 Migration — Full Record

## Status: ✅ FULLY COMPLETED (2026-04-27)

All frontend components/pages migrated to HeroUI v3. Frontend builds successfully, Docker containers (frontend + backend) running.

---

## Goal

Full migration of frontend from HeroUI v2 to HeroUI v3. User explicitly requested: "never install heroui v3, i want full migration" (meaning complete migration in one pass, not incremental).

**Constraints:**
- Do NOT change API calls, routing logic, state management, or business logic
- Only update rendering layer to HeroUI v3 compound components
- Frontend must build and run successfully after migration

---

## Key Discoveries (HeroUI v3 Facts)

HeroUI v3 is a full rewrite with breaking changes:
1. **No `@heroui/styles` package** — all styles bundled in `@heroui/react@^3.0.3`
2. **No `HeroUIProvider`** — removed from `main.jsx`, not required in v3
3. **Navbar component removed entirely** — must use native HTML (`<nav>`, `<header>`, `<ul>`, `<li>`)
4. **Tailwind v4 + `@heroui/theme` plugin** for theming (no separate style imports)
5. **Correct Compound Component API**:
   - `Card` → `Card.Header`, `Card.Content`, `Card.Footer`
   - `Modal` → `Modal.Backdrop`, `Modal.Container`, `Modal.Dialog`, `Modal.Header`, `Modal.Heading`, `Modal.Body`, `Modal.Footer`
   - `Select` → `Select.Trigger`, `Select.Value`, `Select.Indicator`, `Select.Popover`, `ListBox`, `ListBox.Item`
   - `Popover` → `Popover.Trigger`, `Popover.Content`, `Popover.Dialog`, `Popover.Arrow`
   - `Button` → `variant` prop only (primary/secondary/tertiary/ghost/danger/danger-soft), `isPending` replaces `isLoading`
   - `TextField` replaces `Input` when label/description needed; `Input` is primitive only
   - `Chip` uses `variant` prop (e.g., `danger-soft`, `secondary`) not `color` prop
   - `Autocomplete` → replaced with `ComboBox` for inline input style
6. **Dependency Changes**:
   - Removed: `framer-motion`
   - Installed: `@heroui/react@^3.0.3`
   - Tailwind v4: `@tailwindcss/vite` plugin, no `tailwind.config.js` or `postcss.config.js`
7. **Theme Management**: `useTheme` hook built into `@heroui/react`, no custom ThemeContext needed. Persists to `localStorage` automatically.

---

## Completed Tasks

### Core Setup:
- ✅ Removed `framer-motion` from `package.json`
- ✅ Installed `@heroui/react@^3.0.3`
- ✅ Removed `HeroUIProvider` from `frontend/src/main.jsx`
- ✅ Updated `frontend/vite.config.js` with `@tailwindcss/vite` plugin
- ✅ Updated `frontend/src/styles/global.css` for Tailwind v4 + `@heroui/theme` plugin

### Shared Components (all in `frontend/src/components/`):
- ✅ `Navbar.jsx` — Rewritten with native HTML (Navbar removed in v3), added dark/light toggle with `useTheme`
- ✅ `ProtectedRoute.jsx` — Updated Spinner import
- ✅ `CostumeMultiSelect.jsx` — Updated Chip `variant` prop
- ✅ `ClientSelect.jsx` — Migrated to `ComboBox` (replaces `Autocomplete`)
- ✅ `NotificationBell.jsx` — Migrated to `Popover` v3 compound API
- ✅ Deleted all `.css` files in `components/` (Navbar.css, Sidebar.css, etc.)

### Pages (all in `frontend/src/pages/`):
- ✅ `LoginPage.jsx` — Migrated to `TextField`, `Card` compound, `Button isPending`
- ✅ `SettingsPage.jsx` — Migrated to `TextField`, `Card` compound
- ✅ `CataloguePage.jsx` — Migrated to `Select` v3 compound, `Table`, `Card`
- ✅ `CatalogueFormPage.jsx` — Migrated to `TextField`, `Select` v3, `Separator`
- ✅ `CatalogueDetailPage.jsx` — Migrated to `Modal` v3 compound
- ✅ `ClientListPage.jsx` — Migrated to `Modal` v3 compound, `Table`
- ✅ `ClientDetailPage.jsx` — Migrated to `TextField`, `Card` compound
- ✅ `RentFormPage.jsx` — Migrated to `TextField`, `Select` v3, `Separator`
- ✅ `RentDetailPage.jsx` — Migrated to `Modal` v3 compound, `Card` compound
- ✅ `RentHistoryPage.jsx` — Migrated to `Modal` v3 compound, `Select` v3
- ✅ `NotFoundPage.jsx` — Migrated to `Card` compound
- ✅ Deleted all `.css` files in `pages/`

### Verification:
- ✅ `npm run build` succeeds
- ✅ Docker images built, containers running
- ✅ Final grep: No old patterns (`form-input`, `btn btn-`, `window.confirm`, etc.) remain
- ✅ All `.css` files in `components/` and `pages/` deleted

---

## Corrected Component Mapping Reference (Actual v3 APIs Used)

All components imported from `@heroui/react`. Uses compound dot notation.

### Color Tokens (CSS Variables for Light/Dark Mode)
Defined in `frontend/src/styles/global.css` `@layer theme` block:
| Purpose | Class |
|---------|-------|
| Primary tint background | `bg-[var(--primary)]/10` |
| Primary text | `text-[var(--primary)]` |
| Default text | `text-[var(--foreground)]` |
| Muted text | `text-[var(--muted)]` |
| Subtle background | `bg-[var(--border)]` |
| Card background | Automatic via `Card` |
| Page background | `bg-[var(--background)]` |

### Buttons
```jsx
import { Button } from '@heroui/react';

// v3 API: variant only (no color prop), isPending replaces isLoading
<Button variant="primary">Save</Button> // Options: primary/secondary/tertiary/ghost/danger/danger-soft
<Button variant="bordered" size="sm">Detail</Button>
<Button isPending={loading}>Loading</Button> // Replaces isLoading
<Button asChild><Link to="/path">Link as Button</Link></Button>
```

### Text Inputs
```jsx
import { TextField, Input } from '@heroui/react';

// TextField: with label/description
<TextField label="Email" value={val} onValueChange={setVal} />
// Input: primitive (no label)
<Input type="date" value={val} onChange={(e) => setVal(e.target.value)} />
```

### Select (v3 Compound API)
```jsx
import { Select, ListBox } from '@heroui/react';

<Select value={val} onChange={(e) => setVal(e.target.value)}>
  <Select.Trigger>
    <Select.Value placeholder="Select..." />
    <Select.Indicator />
  </Select.Trigger>
  <Select.Popover>
    <ListBox>
      <ListBox.Item id="">Semua</ListBox.Item>
      {items.map(i => <ListBox.Item key={i.id} id={String(i.id)}>{i.name}</ListBox.Item>)}
    </ListBox>
  </Select.Popover>
</Select>
```

### Modal (v3 Compound API)
```jsx
import { Modal, Button } from '@heroui/react';

const [isOpen, setIsOpen] = useState(false);

<Button onPress={() => setIsOpen(true)}>Delete</Button>

<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
  <Modal.Backdrop />
  <Modal.Container>
    <Modal.Dialog>
      <Modal.Header>
        <Modal.Heading>Confirm</Modal.Heading>
      </Modal.Header>
      <Modal.Body>Are you sure?</Modal.Body>
      <Modal.Footer>
        <Button variant="bordered" onPress={() => setIsOpen(false)}>Cancel</Button>
        <Button variant="danger" onPress={handleDelete}>Delete</Button>
      </Modal.Footer>
    </Modal.Dialog>
  </Modal.Container>
</Modal>
```

### Popover (v3 Compound API)
```jsx
import { Popover, Button, Badge } from '@heroui/react';

<Popover>
  <Popover.Trigger>
    <Badge content={count} isInvisible={count === 0}>
      <Button isIconOnly variant="ghost"><Bell size={20} /></Button>
    </Badge>
  </Popover.Trigger>
  <Popover.Content>
    <Popover.Arrow />
    <Popover.Dialog>
      {/* Content here */}
    </Popover.Dialog>
  </Popover.Content>
</Popover>
```

### Card (v3 Compound API)
```jsx
import { Card } from '@heroui/react';

<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content here</Card.Content>
  <Card.Footer>Footer here</Card.Footer>
</Card>
```

### Chip
```jsx
import { Chip } from '@heroui/react';

// v3: variant prop (not color)
<Chip variant="danger-soft" size="sm">Error</Chip>
<Chip variant="secondary" size="sm">Info</Chip>
```

### ComboBox (Replaces Autocomplete)
```jsx
import { ComboBox, ListBox } from '@heroui/react';

<ComboBox inputValue={search} onInputChange={setSearch} selectedKey={val} onSelectionChange={setVal}>
  <ComboBox.Input placeholder="Search clients..." />
  <ComboBox.Popover>
    <ListBox>
      {items.map(i => <ListBox.Item key={i.id} id={String(i.id)}>{i.name}</ListBox.Item>)}
    </ListBox>
  </ComboBox.Popover>
</ComboBox>
```

### Separator (Replaces Divider)
```jsx
import { Separator } from '@heroui/react';
<Separator />
```

---

## Original Plan (Deprecated — See Corrections Above)

### Key differences from HeroUI v2 (Original Notes):
- ~~**No `framer-motion` dependency**~~ ✅ Applied
- ~~**No Tailwind plugin**~~ → **CORRECTED**: Use `@heroui/theme` Tailwind plugin
- ~~**Two packages, not one**~~ → **CORRECTED**: Only `@heroui/react@^3.0.3` needed
- ~~**Compound component API**~~ ✅ Applied (with corrected APIs above)
- ~~**`useTheme` is built-in**~~ ✅ Applied
- ~~**No `HeroUIProvider` theming props**~~ → **CORRECTED**: `HeroUIProvider` not needed at all, removed
- ~~**Tailwind v4 is required**~~ ✅ Applied

### Session 1 — Setup (✅ Completed)
- Installed `@heroui/react@^3.0.3`, removed `framer-motion`
- Updated `vite.config.js` with `@tailwindcss/vite` plugin
- Updated `global.css` with Tailwind v4 + `@heroui/theme` plugin
- Removed `HeroUIProvider` from `main.jsx`

### Session 2 — Shared Components (✅ Completed)
1. `Navbar.jsx` — Rewritten with native HTML (Navbar removed in v3)
2. `Sidebar.jsx` — Kept structural HTML, applied Tailwind classes
3. `NotificationBell.jsx` — Migrated to `Popover` v3 compound
4. `ClientSelect.jsx` — Migrated to `ComboBox`
5. `CostumeMultiSelect.jsx` — Updated Chip variant, Input, Button

### Session 3 — Pages (✅ Completed)
All 11 pages migrated in order, all paired `.css` files deleted, grep checks passed.

---

## Relevant Files Modified

### Core Files:
- `frontend/src/main.jsx` — Removed HeroUIProvider
- `frontend/src/App.jsx` — Updated Spinner import
- `frontend/src/styles/global.css` — Tailwind v4 + @heroui/theme plugin

### Pages (`frontend/src/pages/`):
`LoginPage.jsx`, `SettingsPage.jsx`, `CataloguePage.jsx`, `CatalogueFormPage.jsx`, `CatalogueDetailPage.jsx`, `ClientListPage.jsx`, `ClientDetailPage.jsx`, `RentFormPage.jsx`, `RentDetailPage.jsx`, `RentHistoryPage.jsx`, `NotFoundPage.jsx`

### Components (`frontend/src/components/`):
`Navbar.jsx`, `ProtectedRoute.jsx`, `CostumeMultiSelect.jsx`, `ClientSelect.jsx`, `NotificationBell.jsx`

### Config Files:
- `frontend/package.json` — Updated dependencies
- `frontend/vite.config.js` — @vitejs/plugin-react + @tailwindcss/vite plugins

---

## What NOT to Change (Original Constraints)
- Do not modify anything in `src/api/`
- Do not modify `src/context/AuthContext.jsx`, `NotificationContext.jsx`, or `SettingsContext.jsx`
- Do not create a `ThemeContext.jsx` — `useTheme` is built into `@heroui/react`
- Do not modify `src/App.jsx` routing
- Do not change state variable names, `useEffect` logic, or API call patterns
- Do not change the backend, docker config, tests, or any files outside `frontend/src/`
- Do not install `framer-motion` — not used in HeroUI v3
- Do not create `tailwind.config.js` — Tailwind v4 with Vite plugin does not need it
