# Multi-Page UI Redesign Plan Template

Use this exact section order when generating a plan. Replace bracketed placeholders with project-specific content discovered during exploration.

````md
# Multi-Page UI Redesign Plan

## Outcome

[Describe the intended cross-page redesign outcome. Emphasize reduced duplication, stronger hierarchy, simpler controls, clearer primary task flow, and a coherent layout direction.]

## Target Inventory

| Target | Route/Component | Likely Files | Current Issues |
| --- | --- | --- | --- |
| [Page/component] | [Route or component name] | [Files] | [Brief issues] |

## Shared Redesign Principles

- [Principle that applies to all phases.]
- [Principle that applies to all phases.]
- [Principle that applies to all phases.]

Each phase below is backed by its own `$ui-refactor` redesign pass. The `ASCII Frame` content comes from that target-specific `$ui-refactor` wireframe.

## Phase 1 - [Page/Component Name]

### Target

[Route/component/files affected.]

### Redesign Direction

[Describe the intended layout, hierarchy, grouping, primary task flow, and visual emphasis after redesign.]

### Information And Controls

[Decide what remains visible, what becomes secondary, what is consolidated, what labels are hidden/removed, and which controls become icon-only with accessible names.]

### ASCII Frame

```text
[ASCII frame from the per-target `$ui-refactor` pass for this page/component]
```

### Accessibility And Responsive Notes

[ARIA labels, focus states, touch targets, mobile/desktop behavior, sticky/fixed surfaces, and overflow risks.]

### Acceptance Checks

- [Focused check for this phase.]
- [Focused check for this phase.]
- [Focused check for this phase.]

## Phase 2 - [Page/Component Name]

### Target

[Route/component/files affected.]

### Redesign Direction

[Describe the intended layout, hierarchy, grouping, primary task flow, and visual emphasis after redesign.]

### Information And Controls

[Decide what remains visible, what becomes secondary, what is consolidated, what labels are hidden/removed, and which controls become icon-only with accessible names.]

### ASCII Frame

```text
[ASCII frame from the per-target `$ui-refactor` pass for this page/component]
```

### Accessibility And Responsive Notes

[ARIA labels, focus states, touch targets, mobile/desktop behavior, sticky/fixed surfaces, and overflow risks.]

### Acceptance Checks

- [Focused check for this phase.]
- [Focused check for this phase.]
- [Focused check for this phase.]

## Cross-Page Test Plan

- [Visual/responsive checks across all redesigned targets.]
- [Keyboard, focus, and screen reader checks.]
- [Regression checks for primary actions and critical flows.]
- [Snapshot or screenshot checks if this repository uses them.]

## Design-System Update Instructions

- Update `design-system/MASTER.md` with shared component patterns, shared controls, tokens, repeated layout rules, and any reusable interaction guidance introduced by this redesign.
- Update relevant `design-system/pages/*.md` files with route-specific frames, page/component behavior, and implementation notes.
- Copy or adapt every phase's ASCII frame into the matching design-system page/component documentation.
- Keep shared component patterns in `MASTER.md`; keep route-specific frames in `design-system/pages/*.md`.
````

Add or remove phase sections so there is exactly one phase per target page/component. Do not combine multiple targets into one phase, and do not create extra phases for shared cleanup work.
