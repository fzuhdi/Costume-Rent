---
name: multi-page-ui-redesign-plan
description: Planning-only skill for creating multi-page or multi-component UI redesign plans in this project. Use when the user asks to plan, redesign, clean up, reshape, simplify, or improve multiple pages/components using principles like reducing duplication, improving hierarchy, simplifying controls, consolidating repeated UI, or applying the same product detail cleanup approach across several screens. Requires a per-page/component `$ui-refactor` redesign pass and uses its ASCII wireframe for each phase; creates a markdown plan with exactly one phase per page/component and does not edit product code.
---

# Multi-Page UI Redesign Plan

Use this skill to create a durable redesign plan for multiple UI pages or components. The output is a planning document only; do not edit `frontend-v2/**`, `frontend/**`, `backend/**`, tests, CSS, routes, components, or `design-system/**` while using this skill unless the user gives a separate execution request.

## Required Output

Create exactly one plan file:

```text
docs/plans/PLAN-YYYYMMDD-multi-page-ui-redesign.md
```

Use the current date for `YYYYMMDD`. If a same-day file already exists, preserve existing content unless the user asked to replace it; otherwise append a short suffix such as `-2` before `.md`.

Read `references/plan-template.md` before writing the plan and follow its section order.

## Exploration First

Before writing the plan, do non-mutating exploration only:

1. Inspect routes, pages, components, CSS/modules, shared UI primitives, and relevant tests.
2. Inspect existing screenshots or capture new screenshots when a local app is already available and doing so is practical.
3. Inspect `design-system/MASTER.md` and relevant `design-system/pages/*.md` if they exist.
4. Identify every requested page/component target and its likely source files.
5. Note repeated content, duplicate controls, weak hierarchy, over-labeled buttons, competing primary actions, layout crowding, responsive risks, and accessibility gaps.

Do not make exploratory edits. Do not run mutating workflow commands. Prefer read-only searches and file reads.

## UI Refactor Pass Per Target

Before drafting plan phases, use `$ui-refactor` separately for each target page/component:

1. Load and follow the `ui-refactor` skill if it is not already active.
2. Give `$ui-refactor` the target-specific route/component/files, available screenshots, relevant CSS/design-system notes, and the primary user task for that page/component.
3. Ask for a redesign/layout-planning output with an improved ASCII wireframe for that single target.
4. Use the resulting wireframe as the source for that target's phase `ASCII Frame`. You may adapt labels to match the final plan, but do not invent the frame without a target-specific `$ui-refactor` pass.
5. Summarize useful `$ui-refactor` findings into the phase direction, information/control decisions, accessibility notes, and acceptance checks.

Run this pass once per target. Do not combine multiple pages/components into one `$ui-refactor` prompt when they will become separate phases.

## Planning Rules

- Produce exactly one phase per page/component target.
- Each phase must describe a redesigned end state, not a cleanup checklist.
- Each phase must include a specific ASCII frame sourced from that page/component's `$ui-refactor` redesign pass.
- Frames must show structure, grouping, hierarchy, primary actions, secondary actions, and responsive/sticky surfaces where relevant.
- Keep shared redesign principles consistent across phases: reduce duplication, improve hierarchy, simplify controls, consolidate repeated surfaces, and reshape layout around the primary task.
- Make page-specific decisions instead of repeating generic guidance in every phase.
- Include accessibility and responsive notes in each phase, including ARIA labels for icon-only controls, focus states, touch targets, overflow risks, and mobile/desktop behavior.
- Include acceptance checks that can be verified after implementation.
- Keep implementation out of scope. The plan may name files likely to change, but it must not patch them.

## Design-System Instructions

The final section of every generated plan must instruct the implementer to update:

- `design-system/MASTER.md` for shared component patterns, shared controls, tokens, and repeated layout rules.
- Relevant `design-system/pages/*.md` files for route-specific frames and page/component behavior.

State that every phase's ASCII frame must be copied or adapted into the matching design-system page/component documentation. Shared component patterns belong in `MASTER.md`; route-specific frames belong in `design-system/pages/*.md`.

## Final Response

Report the created plan path, target count, and confirm that no product code was edited.
