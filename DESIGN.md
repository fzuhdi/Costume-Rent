# Costume-Rent Design Document

This document outlines the UI/UX design tokens, component strategy, layout structures, and styling paradigms used in the Costume-Rent frontend. 

## 1. Core Styling Frameworks
- **Tailwind CSS v4:** Used as the primary utility-first CSS framework for layout, spacing, and typography.
- **HeroUI v3 (React):** Used as the primary component library. All interactive components (Modals, Buttons, Inputs, Selects, Radios) should default to their HeroUI equivalents.

## 2. Design Tokens & Theming

The application utilizes a CSS variable-based theming system managed in `frontend/src/styles/global.css`, supporting both Light and Dark modes.

### 2.1 Color Palette
- **Primary:** `#4f46e5` (Indigo-600) — Used for primary actions, active states, and highlights.
- **Success:** `#16a34a` (Green-600) — Used for completion, success messages, and "returned" statuses.
- **Warning:** `#d97706` (Amber-600) — Used for warnings, pending states, and DP (Downpayment) markers.
- **Danger:** `#dc2626` (Red-600) — Used for destructive actions, errors, and late statuses.
- **Secondary:** `#0891b2` (Cyan-600) — Accent color for informational components.

### 2.2 Typography
- **Primary Font Family:** `"Inter", ui-sans-serif, system-ui, sans-serif`
- **Typographic Hierarchy:**
  - **Page Title:** Text size `2xl`, font weight `bold`.
  - **Page Subtitle:** Text size `sm`, muted color.
  - **Section Labels:** Text size `xs`, font weight `semibold`, `uppercase`, tracking `widest`.

### 2.3 Layout & Dimensions
- **Sidebar Width (Expanded):** `250px`
- **Sidebar Width (Collapsed):** `64px`
- **Navbar Height:** `60px`
- **Main Content Padding:** Standardized to `p-4` on mobile and `p-6` on desktop.

## 3. Component Strategy

1. **HeroUI First:** Always prioritize native HeroUI components over raw HTML tags. E.g., Use `<RadioGroup>` and `<Radio>` instead of `<input type="radio">`.
2. **Icons:** Use `lucide-react` for all UI iconography to maintain consistent stroke widths and sizing.
3. **Responsive Design:** 
   - Mobile-first approach using standard Tailwind breakpoints (`sm`, `md`, `lg`).
   - The sidebar collapses into a mobile overlay menu on screens smaller than `md`.
   - Modals should scroll internally if their content exceeds the viewport height.

## 4. Custom CSS Layers
Custom component classes are defined in `@layer components` in `global.css` to keep JSX clean for repeated structural elements.
Key standardized classes:
- `.layout-root`, `.layout-content`, `.main-content`: Application shell wrappers.
- `.page-root`, `.page-header`: Page structural components.
- `.info-row`, `.info-label`, `.info-value`: Used for structured data display (e.g., receipt details).
- `.empty-state`: Centered container for null states with muted text.
