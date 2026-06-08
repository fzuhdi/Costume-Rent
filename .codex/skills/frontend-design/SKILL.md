---
name: frontend-design
description: Primary project skill for UI design, frontend implementation, UI review, critique, polish, visual improvements, responsive fixes, and frontend UX improvements. Use when Codex designs, builds, reviews, critiques, fixes, or improves web or mobile frontend interfaces, components, pages, admin dashboards, customer and e-commerce flows, visual systems, interaction states, or responsive behavior. Leads design judgment and execution; use ui-ux-pro-max only as a supporting searchable design database.
---

# Frontend Design

This project skill is adapted from Anthropic's `frontend-design` skill and modified for Codex plus `ui-ux-pro-max` integration. The upstream terms are copied in `LICENSE.txt`.

Use this skill as the primary source of design judgment for frontend work in this repository. Use `ui-ux-pro-max` as a database for product patterns, UX rules, stack guidance, palettes, typography, accessibility, and chart recommendations when those facts would improve the decision.

## Workflow

1. Inspect the existing UI first: code, components, routes, CSS, design tokens, screenshots, and nearby behavior.
2. Identify the product context: admin workflow, rental operations, customer shopping, checkout, marketing, mobile task flow, or another concrete use case.
3. Query `ui-ux-pro-max` only when design data is useful. Prefer the project-local script path:

```bash
python .codex/skills/ui-ux-pro-max/scripts/search.py "<product/context>" --design-system
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain ux
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain typography
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain color
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --stack react
```

4. Synthesize a clear direction from the app context plus any database results. Do not paste database output as the design answer.
5. Implement with the repo's established frontend patterns, shared components, API boundaries, validation patterns, routing, and CSS conventions.
6. Verify with build/tests and screenshots when practical, especially for responsive changes, layout repairs, interaction states, and visual polish.

## Design Direction

- Make interfaces feel designed for this product, not assembled from generic AI defaults.
- Choose a deliberate visual point of view, then execute it consistently through layout, spacing, type, color, imagery, states, and motion.
- Let the surface match the job. Admin and operational screens should be restrained, dense, scannable, predictable, and fast for repeated use. Customer and e-commerce screens should be polished, visual, trustworthy, and conversion-friendly without sacrificing usability.
- Avoid one-note palettes, default purple gradients, decorative blobs, excessive glass effects, oversized cards, and familiar template compositions unless the existing app already commits to them.
- Use distinctive choices only when they serve the workflow. Minimal designs need precision; expressive designs need coherence.
- Favor real product, costume, state, or workflow imagery where visual inspection matters. Avoid purely atmospheric media when users need to evaluate an item or task.

## Implementation Guardrails

- Respect existing app structure before adding new abstractions. Reuse local components, icons, tokens, spacing, table/form patterns, and state handling where they exist.
- Use familiar controls for the job: icon buttons for tools, segmented controls for modes, toggles for binary settings, inputs/sliders for numeric settings, menus for option sets, tabs for views, and clear text buttons for commands.
- Keep text readable and contained at mobile and desktop widths. Do not let labels, counters, badges, buttons, modals, or table content overlap.
- Define stable dimensions for fixed-format UI such as boards, grids, tiles, toolbars, counters, and action buttons so hover, loading, and dynamic states do not shift layout.
- Build accessible interactions: semantic controls, labels, visible focus, keyboard reachability, sufficient contrast, non-color-only status, and reduced-motion respect for nonessential animation.
- Keep motion purposeful and brief. Use it to clarify feedback, hierarchy, and continuity rather than to decorate every element.
- For 3D or canvas-heavy UI, verify the scene is nonblank, correctly framed, responsive, and interactive before delivery.

## Review And Critique

Lead with concrete findings and fixes. Identify the user-facing problem, the screen or file affected, why it matters, and the change that would correct it. Prioritize usability, accessibility, responsive behavior, visual hierarchy, task efficiency, data density, and consistency with the current app.

For implementation reviews, call out missing verification and likely regressions. For design critiques, avoid vague taste language; tie feedback to user goals, layout mechanics, and measurable interface quality.

## Pre-Delivery Checks

- Build or run the relevant frontend checks when practical.
- Inspect at mobile, tablet, desktop, and wide desktop breakpoints for any changed screen.
- Verify empty, loading, error, success, hover, focus, disabled, and long-content states touched by the work.
- Confirm no horizontal mobile scroll, hidden fixed-position content, or incoherent overlap.
- Use screenshots or browser inspection for meaningful visual changes before calling the work complete.
