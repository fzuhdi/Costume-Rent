---
name: admin-dashboard-ui-ux-audit
description: Audit mobile-first admin dashboard UI screenshots from a provided screenshots directory. Use when Codex is asked to review, critique, assess, or audit admin dashboard screens, mobile admin flows, responsive dashboard screenshots, or screenshot folders for UX, visual hierarchy, navigation, accessibility, touch targets, spacing, feedback states, sticky CTAs, bottom navigation, or WCAG AA issues. This skill should use ui-ux-pro-max as the supporting UI/UX design intelligence source.
---

# Admin Dashboard UI UX Audit

## Workflow

1. Confirm the user provided a screenshots directory path. If not, ask for the path.
2. Inventory image files in the directory before auditing. Include common screenshot formats such as PNG, JPG, JPEG, WEBP, GIF, and BMP.
3. Use `ui-ux-pro-max` as the supporting design intelligence source. Prefer the project-local `ui-ux-pro-max` skill when inside a repository that provides one; otherwise use the user-global copy if available.
4. Inspect each screenshot directly. Treat the screenshots as the source of truth and cite affected screens by filename or visible screen name.
5. Produce the audit in chat unless the user explicitly asks for a file.

## Audit Standards

Evaluate every relevant screen against these categories:

- Information Architecture & Navigation
- Touch Targets & Interaction Patterns
- Visual Hierarchy & Typography
- Feedback & State Management
- Layout Density & Spacing
- Color & Accessibility

Apply current mobile-first admin dashboard principles:

- Touch targets should be at least 44px by 44px.
- Primary flow actions should be easy to reach; use sticky CTAs when the action should remain available while scrolling or completing a form.
- Prefer bottom navigation for primary mobile app sections when the dashboard has persistent top-level destinations.
- Meet WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and non-text UI components.
- Prioritize scanability, repeated operational use, predictable navigation, clear state feedback, and dense but readable information.

## Output Format

Start with a brief executive summary, then provide a findings table with these columns:

| Severity | Category | Screen(s) | Problem | Recommendation |
| --- | --- | --- | --- | --- |

Use only these severity labels:

- `Critical`: Blocks task completion, creates serious accessibility failure, or risks destructive/admin mistakes.
- `Major`: Meaningfully slows workflows, causes repeated confusion, or breaks common mobile-first expectations.
- `Minor`: Polish, consistency, or low-risk usability improvement.

Keep every recommendation concrete and implementation-ready. If exact dimensions, contrast ratios, or interaction states cannot be proven from screenshots alone, state that the issue is visually inferred instead of reporting false precision.
