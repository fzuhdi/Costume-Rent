# Common Bugs & Fixes — Costume Rental

## Quick Reference for `/engineer` Bug Reports

When the user reports "X doesn't work" or "Y is not defined", check this file first.

---

## Bug #1: HeroUI v3 Chip Variant Syntax Error#

**Error:** Chips not rendering with correct colors  
**Symptom:** Using v2 compound variant strings that don't exist in v3  

**Root Cause:** HeroUI v3 uses **separate props**: `variant="soft"` + `color="danger"` (not combined strings)

**Wrong (v2 syntax):**
```jsx
<Chip variant="danger-soft" />
```

**Correct (v3 syntax):**
```jsx
<Chip variant="soft" color="danger" />
```

**Variants:** `primary`, `secondary`, `tertiary`, `soft`  
**Colors:** `default`, `accent`, `success`, `warning`, `danger`

**Files commonly affected:**
- `frontend/src/components/CostumeListView.jsx`
- `frontend/src/pages/RentHistoryPage.jsx`
- `frontend/src/pages/RentDetailPage.jsx`
- `frontend/src/pages/SettingsPage.jsx`
- `frontend/src/pages/ClientDetailPage.jsx`
- `frontend/src/pages/ClientListPage.jsx`

**Prevention:** Always check HeroUI v3 docs at `https://heroui.com/docs/react/components/chip` — v3 uses compound props, not compound strings.

---

## Bug #2: `useEffect` / `useCallback` / `useMemo` Not Imported#

**Error:** `Uncaught ReferenceError: useEffect is not defined`  

**Root Cause:** Using hook in component but only importing `useState` from `'react'`

**Wrong:**
```jsx
import { useState } from 'react';  // useEffect missing!
// ...
useEffect(() => { ... }, []);  // Runtime error!
```

**Correct:**
```jsx
import { useState, useEffect } from 'react';
```

**Prevention:** Check that every hook used is imported from `'react'`. Run `npm run build` after adding hooks.

---

## Bug #3: `useNavigate` Imported from Wrong Package#

**Error:** `Uncaught TypeError: useNavigate is not a function`  

**Root Cause:** Importing `useNavigate` from `'react'` instead of `'react-router-dom'`

**Wrong:**
```jsx
import { useState, useEffect, useNavigate } from 'react';  // useNavigate doesn't exist in react!
```

**Correct:**
```jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
```

**Prevention Checklist:**
- `useNavigate`, `Link`, `useParams` → import from `'react-router-dom'`
- `useState`, `useEffect`, `useCallback` → import from `'react'`

---

## Bug #4: Duplicate Variable Declarations#

**Error:** Potential runtime confusion from redeclaration  

**Symptom:** Two `const navigate = useNavigate();` in same component scope.

**Wrong:**
```jsx
const MyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigate = useNavigate();  // DUPLICATE!
  // ...
};
```

**Correct:**
```jsx
const MyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();  // Only once
  // ...
};
```

**Prevention:** Search for duplicate declarations after editing: `grep -n "const navigate" file.jsx`

---

## Bug #5: `Link` Import Removed but Still Used in JSX#

**Error:** `Uncaught ReferenceError: Link is not defined`  

**Root Cause:** Removed `Link` from imports when switching to `useNavigate()`, but `<Link>` JSX still used.

**Wrong:**
```jsx
import { useNavigate } from 'react-router-dom';  // Link missing!
// ...
<Link to={`/clients/${client.id}`}>Text</Link>  // Runtime error!
```

**Correct:**
```jsx
import { Link, useNavigate } from 'react-router-dom';  // Keep Link!
// ...
<Link to={`/clients/${client.id}`}>Text</Link>  // Works!
```

**Prevention:** When removing imports, check if the component still uses that import in JSX.

---

## Bug #6: `as={Link}` Pattern Not Supported in HeroUI v3#

**Error:** Button navigation not working when using `as={Link}` prop  

**Root Cause:** HeroUI v3 `Button` doesn't support `as` prop for rendering as React Router `Link`

**Wrong:**
```jsx
<Button as={Link} to="/path">Text</Button>  // Doesn't work in v3!
```

**Correct:**
```jsx
const navigate = useNavigate();
// ...
<Button onPress={() => navigate('/path')}>Text</Button>
```

**Prevention:** Never use `as={Link}` on HeroUI v3 components. Use `useNavigate()` hook instead.

**Files commonly affected (7 files, 10+ occurrences):**
- `ClientListPage.jsx`
- `RentFormPage.jsx`
- `RentDetailPage.jsx`
- `RentHistoryPage.jsx`
- `ClientDetailPage.jsx`
- `CatalogueDetailPage.jsx`
- `CostumeTableView.jsx`

---

## Bug #7: Missing `aria-label` on Interactive Elements#

**Error:** Accessibility violations - interactive elements without accessible labels  

**Root Cause:** Not consistently adding `aria-label` to `Button`, `Link`, `Input`, `Select` components.

**Fix:** Add `aria-label` to all interactive elements:
```jsx
<Button onPress={...} aria-label="Descriptive action">Text</Button>
<Link to="..." aria-label="Descriptive destination">Text</Link>
<Input aria-label="Purpose of input" ... />
<Select aria-label="Purpose of select" ... >
```

**Prevention Checklist:**
- [ ] All `<Button>` components have `aria-label`
- [ ] All `<Link>` components have `aria-label`
- [ ] All `<Input>` components have `aria-label`
- [ ] All `<Select>` components have `aria-label`

---

## Bug #8: ISO Date Format Not Human-Readable#

**Error:** Dates displaying as `2026-05-03T08:15:34.148929089Z`  

**Root Cause:** No date formatting - displaying raw ISO string from API.

**Fix:** Create helper functions:
```jsx
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};
```

**Usage:**
- "Dibuat"/"Diperbarui": `formatDateTime(rent.created_at)` → `03-05-2026 08:15:34`
- "Tanggal Pinjam": `formatDate(rent.rent_start)` → `03-05-2026`

---

## Bug #9: Variable Not Declared Before Access#

**Error:** `Uncaught ReferenceError: X is not defined`  

**Example:** Accessing `costume.available_quantity` without declaring `const [costume, setCostume] = useState(null);`

**Fix:**
```jsx
const CatalogueFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [costume, setCostume] = useState(null);  // ← Declare it!
  
  // In fetchData() for edit mode:
  const costumeRes = await getCostumeById(id);
  const costumeData = costumeRes.data;
  setCostume(costumeData);  // ← Populate it!
};
```

---

## Prevention Checklist for Future Features#

| Check | Description |
|-------|-------------|
| □ | Verify all hooks used are imported from correct package (`react` vs `react-router-dom`) |
| □ | Run `npm run build` after every significant change |
| □ | Check browser console for runtime errors during dev |
| □ | Use HeroUI v3 docs (not v2) for component API |
| □ | Add `aria-label` to all interactive elements |
| □ | Avoid `as={Link}` pattern - use `useNavigate()` instead |
| □ | Test edit mode forms fetch and populate data correctly |
| □ | Format dates for display, don't show raw ISO strings |
| □ | Check for duplicate variable declarations after editing |
| □ | Don't remove imports that are still used in JSX |

---

## HeroUI v3 Quick Reference#

### Chip (Correct API)
```jsx
// Variants: primary, secondary, tertiary, soft
// Colors: default, accent, success, warning, danger

<Chip variant="soft" color="danger">Error</Chip>
<Chip variant="soft" color="success">Success</Chip>
<Chip variant="secondary">Neutral</Chip>
```

### Button Navigation (Correct Pattern)
```jsx
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
  const navigate = useNavigate();
  return (
    <Button onPress={() => navigate('/path')} aria-label="Action">
      Text
    </Button>
  );
};
```

### NEVER USE:
- `as={Link}` on any HeroUI component
- `variant="danger-soft"` (v2 syntax)
- `variant="success-soft"` (v2 syntax)
