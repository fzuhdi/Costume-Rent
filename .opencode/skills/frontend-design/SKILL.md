---
name: frontend-design
description: Creates distinctive, production-grade web interfaces with strong visual direction and polished frontend implementation. Use when the user asks to design, build, style, beautify, or mock up websites, landing pages, dashboards, React components, HTML/CSS layouts, web apps, posters, or UI screens.
---

# Frontend Design

## Quick Start

Use this skill when the task is frontend design or UI implementation. First understand the product, users, device priorities, and existing design system. Then choose a clear aesthetic direction and implement a working, responsive interface that feels intentionally designed rather than generic.

## Core Workflow

1. Identify the product context, primary user, platform, and device priority.
2. Inspect existing code, components, styling, and design docs before changing a real repo.
3. Preserve established design systems unless the user asks for a new visual language.
4. Choose one strong aesthetic direction before coding.
5. Implement production-grade UI with responsive layout, accessible controls, and refined visual details.
6. Verify desktop and mobile behavior when tools are available.
7. Summarize the design direction, files changed, and any verification gaps.

## Design Direction

Pick a point of view that fits the product instead of defaulting to safe averages. Examples include luxury/refined, editorial, organic/natural, playful, brutalist, art deco, industrial, soft/pastel, retro-futuristic, or sharply minimal.

Commit to the chosen direction through typography, spacing, color, motion, layout, and texture. The interface should have one memorable design idea that supports the product purpose.

## Aesthetic Guidelines

- Typography: Prefer distinctive, context-appropriate type choices. Avoid defaulting to Arial, Inter, Roboto, or system fonts unless the existing project already standardizes on them.
- Color: Use a cohesive palette with clear dominant, supporting, and accent roles. Avoid generic purple-gradient-on-white aesthetics unless specifically requested.
- Layout: Use purposeful composition, hierarchy, asymmetry, overlap, negative space, or controlled density where appropriate.
- Motion: Add animation only where it improves comprehension or delight. Prefer one polished reveal or interaction over many scattered effects.
- Detail: Add atmosphere through textures, shadows, borders, gradients, imagery, and microstates that match the concept.
- Accessibility: Maintain readable contrast, visible focus states, semantic controls, labels, and keyboard/touch usability.
- Responsiveness: Ensure layouts work on mobile and desktop. For mobile-first sites, prioritize browser compatibility on Android Chrome and iOS Safari.

## Implementation Rules

- Build real working code, not static descriptions, unless the user only asks for a prompt or mockup guidance.
- Follow the repo's frontend stack and component library.
- Keep changes minimal when improving an existing UI, but do not settle for bland output.
- Do not rewrite business logic unless required for the UI behavior.
- Use CSS variables or project theme tokens for repeated colors, spacing, and surfaces.
- Avoid hover-only interactions for mobile or touch-first designs.
- Include loading, empty, error, disabled, and active states when they are part of the user flow.

## Anti-Patterns

- Generic AI landing-page aesthetics.
- Overused purple/blue gradients without product reason.
- Cookie-cutter cards, centered hero, and three-column feature blocks when the product needs a more specific layout.
- Decorative effects that harm readability or performance.
- Ignoring the existing design system in a mature project.
- Treating mobile-first web as a native mobile app unless explicitly requested.

## Mockup Prompt Support

When the user asks for a UI mockup prompt, produce a concise prompt that specifies:

- Product and audience.
- Web, mobile-first web, desktop web, or native app target.
- Primary viewport sizes and responsive expectations.
- Core screens and use cases.
- Product rules and constraints.
- Visual direction.
- Required states and accessibility expectations.

## Review Checklist

- The design has a clear aesthetic direction.
- The result is specific to the product and audience.
- Mobile, desktop, and accessibility requirements are addressed.
- Existing project patterns are preserved where appropriate.
- The UI includes meaningful states, not just the happy path.
- The final response notes verification performed or not performed.
