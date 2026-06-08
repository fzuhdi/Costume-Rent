---
name: write-a-prd
description: Drafts and refines product requirements documents (PRDs) that turn ideas, bugs, or feature requests into clear outcomes, scope, requirements, risks, and handoff notes. Use when the user asks to write, create, draft, review, or refine a PRD, product requirements doc, requirements document, feature spec, or product brief.
---

# Write A PRD

## Quick Start

1. Identify the product idea, target users, problem, desired outcome, scope, and constraints.
2. Inspect existing context before drafting when a repo is available: `CONTEXT.md`, `docs/acceptance/*.md`, `docs/plans/`, `docs/tickets/`, and `docs/adr/` when relevant.
3. Ask only blocking questions. If assumptions are safe, draft with an `Assumptions` section instead of stopping.
4. Write to the requested path. If no path is given and no repo convention exists, use `docs/prds/{short-kebab-title}.md`.
5. After drafting, summarize the key tradeoffs and ask whether scope, requirements, or detail level should change.

## Workflow

### 1. Gather Inputs

- problem statement and why now
- target users, personas, or actors
- business and user outcomes
- goals and explicit non-goals
- in-scope and out-of-scope workflows
- functional requirements and edge cases
- success metrics or observable acceptance signals
- dependencies, constraints, risks, and open questions

If the user provides a rough idea, convert vague language into precise product language. Do not invent product decisions that change scope; mark them as assumptions or open questions.

### 2. Draft The PRD

Use this structure unless the user provides another template:

```markdown
# {Feature Or Product Title}

## Status
Draft

## Summary
{One paragraph describing the outcome and users served.}

## Problem
{Current pain, evidence, and why it matters.}

## Users
- {Primary user}: {need or situation}

## Goals
- {Measurable or observable goal}

## Non-Goals
- {Explicitly excluded behavior or scope}

## Scope
{What is included, excluded, and any release boundaries.}

## Requirements
- {REQ-001}: {Testable product requirement}

## User Flows
- {Flow name}: {Trigger -> steps -> expected result}

## Edge Cases
- {Condition}: {Expected handling}

## Success Metrics
- {Metric or acceptance signal}

## Dependencies And Constraints
- {Dependency, policy, technical constraint, or external decision}

## Risks
- {Risk}: {mitigation or owner if known}

## Open Questions And Handoff Notes
- {Question blocking or shaping implementation}
- {Notes for design, engineering, QA, support, rollout, and future ticketing}
```

### 3. Quality Bar

Before presenting the PRD, verify:

- The problem, users, and desired outcomes are clear.
- Requirements are testable and avoid implementation detail unless it is a real constraint.
- Non-goals prevent likely scope creep.
- Open questions are explicit and not hidden in prose.
- The PRD can be converted into tickets with `/create-tickets` after product approval.

## Review With User

Present the draft path and a short summary. Ask targeted review questions:

- Does this cover the intended users and use cases?
- Are any requirements missing, wrong, or too detailed?
- Should any assumptions become explicit decisions or open questions?
