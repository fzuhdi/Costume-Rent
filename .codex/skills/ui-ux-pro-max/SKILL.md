---
name: ui-ux-pro-max
description: Supporting searchable UI/UX database for frontend-design. Use only when Codex needs data-backed design-system, UX, stack, palette, typography, accessibility, chart, or implementation guidance to support frontend-design work in this repository. This is not the primary UI design, critique, or implementation workflow.
---

# ui-ux-pro-max

Use this skill as a project-local lookup database. `frontend-design` remains responsible for design judgment, implementation decisions, review, critique, polish, and responsive fixes.

## Role In This Project

- Query this skill only when supporting data would improve a frontend decision.
- Return or apply results through `frontend-design`; do not paste raw database output as the final design answer.
- Prefer project-local scripts and data in `.codex/skills/ui-ux-pro-max/`.
- Do not run `--persist` unless the user explicitly asks to create durable design-system docs.

## Commands

Use Python from the repo root:

```powershell
python .codex/skills/ui-ux-pro-max/scripts/search.py "<product/context>" --design-system
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain ux
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain typography
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain color
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --domain chart
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --stack react
python .codex/skills/ui-ux-pro-max/scripts/search.py "<need>" --stack html-tailwind
```

If `python` is unavailable, try `python3` before making environment changes.

## When To Query

- Broad visual direction: use `--design-system` with product, industry, audience, and tone keywords.
- Accessibility, motion, loading, forms, responsive behavior, or z-index: use `--domain ux`.
- Palette or semantic color guidance: use `--domain color`.
- Font pairing or type hierarchy: use `--domain typography`.
- Data visualization choices: use `--domain chart`.
- React or Tailwind implementation guidance: use `--stack react` or `--stack html-tailwind`.

## Available Domains

| Domain | Use for |
|---|---|
| `product` | Product type patterns |
| `style` | UI style vocabulary and anti-patterns |
| `typography` | Font pairings and type guidance |
| `color` | Palette recommendations |
| `landing` | Landing page structure |
| `chart` | Data visualization choices |
| `ux` | Accessibility, motion, feedback, layout, and interaction rules |
| `react` | React performance and state patterns |
| `web` | Web interface accessibility and behavior |
| `prompt` | Visual prompt/CSS keywords |

## Available Stacks

Use this project's actual frontend stack when known. Common choices:

- `react`
- `html-tailwind`
- `nextjs`
- `vue`
- `svelte`
- `shadcn`

Other database stacks may exist for cross-platform research, but they should not steer this repo unless the implementation target matches.

## Support Checklist

Before `frontend-design` delivers meaningful UI work, use these as supporting reminders when relevant:

- Text and interactive states meet contrast and keyboard/focus expectations.
- Touch targets are at least 44px where mobile or touch use matters.
- Hover, focus, loading, disabled, empty, error, and success states are accounted for when touched by the change.
- Responsive checks include 375px, 768px, 1024px, and a wide desktop width when practical.
- Icons come from a consistent SVG icon set rather than emoji.
- Fixed headers, sticky bars, and floating controls do not hide content.
