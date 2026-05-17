---
name: brainstorm
description: Turns rough ideas into clear designs and written specs through collaborative dialogue. Use when the user wants to brainstorm, shape, scope, design, or specify an idea before implementation.
---

# Brainstorming Design

## Core Rule

Do not implement anything until the design is approved.

Do not write code, scaffold files, edit configuration, invoke implementation workflows, or take implementation action before presenting a design and receiving explicit user approval. This applies to every request, including small utilities, config changes, scripts, UI tweaks, and simple tasks.

## Quick Start

1. Explore the current project context with read-only inspection.
2. Ask clarifying questions one at a time.
3. Propose 2-3 approaches with trade-offs and a recommendation.
4. Present the design in sections and ask for approval.
5. Write the approved spec.
6. Self-review the spec and fix issues.
7. Ask the user to review the written spec.
8. Stop and wait for the next instruction.

## Required Checklist

Track these steps explicitly during the session:

1. Explore project context.
2. Assess whether the idea is too large for one spec.
3. Ask clarifying questions one at a time.
4. Propose 2-3 approaches.
5. Present the recommended design.
6. Get user approval for the design.
7. Write the design spec.
8. Self-review and revise the spec.
9. Ask the user to review the spec.
10. Stop before implementation.

## Project Context

Start with read-only exploration:

1. Inspect relevant files and folders.
2. Read existing docs, specs, ADRs, README files, or project notes.
3. Check recent commits when useful.
4. Identify existing patterns, boundaries, naming, and conventions.

If the idea touches an existing codebase, follow current structure and patterns. Include targeted improvements only when they directly support the requested design. Do not propose unrelated refactoring.

## Scope Check

Before detailed questions, decide whether the idea is too large for one spec.

If the request includes multiple independent subsystems, pause and help decompose it. Clarify the pieces, dependencies, and build order. Then continue the design process for the first focused sub-project.

## Clarifying Questions

Ask one question per message.

Prefer multiple choice questions when possible. Open-ended questions are acceptable when multiple choice would distort the answer.

Focus on purpose, users or actors, success criteria, constraints, data or state, error cases, integration points, testing expectations, and non-goals.

## Approach Options

Before settling on a design, propose 2-3 viable approaches.

For each approach, include what it is, benefits, costs or risks, and when it is the right choice.

Lead with the recommended approach and explain why.

## Design Presentation

Present the design in sections scaled to complexity. Simple changes may need only a few sentences. Larger designs may need fuller sections.

Cover relevant sections: goal, non-goals, user flow or workflow, architecture, components, data flow, state and persistence, error handling, permissions or security, testing strategy, rollout or migration, and open questions.

Ask whether each major section looks right before moving on when the design is complex.

## Design Quality

Design for isolation and clarity.

Each unit should have one clear purpose, a clear interface, and explicit dependencies. A reader should understand what the unit does without reading its internals. Internals should be changeable without breaking consumers.

Prefer smaller, well-bounded units over broad files or vague responsibilities.

Use YAGNI aggressively. Remove features that are not needed for the stated goal.

## Spec Document

After the user approves the design, write the spec to:

`docs/specs/YYYY-MM-DD-<topic>-design.md`

If the project has a different preferred spec location, use that instead.

The spec should include title, date, status, context, goals, non-goals, approved approach, detailed design, testing plan, risks, and open questions if any.

Commit the spec only when the user asks for a commit or project workflow requires committed specs.

## Spec Self-Review

After writing the spec, review it before asking the user to approve it.

Check for placeholders such as `TBD`, `TODO`, or incomplete sections; contradictions between sections; ambiguous requirements; scope creep; missing success criteria; missing error cases; and missing test expectations.

Fix issues inline before presenting the spec to the user.

## User Review Gate

After the self-review, tell the user:

`Spec written to <path>. Please review it and let me know if you want changes before we start planning implementation.`

If the user requests changes, revise the spec and repeat the self-review.

Only proceed after the user approves the written spec.

## Stop Point

This skill ends after the user approves the written spec.

Do not start implementation automatically. Do not invoke implementation workflows automatically. Ask the user what they want to do next.
