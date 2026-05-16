---
name: ask-me
description: Use when the user wants an ask-me grilling session to stress-test a plan against the project's domain language, code, CONTEXT.md glossary, and ADRs.
---

# Ask Me

## What To Do

Interview the user relentlessly about every aspect of their plan until there is a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

Ask questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Domain Awareness

During codebase exploration, also look for existing documentation.

Most repos have a single context:

```text
/
|-- CONTEXT.md
|-- docs/
|   `-- adr/
|       |-- 0001-event-sourced-orders.md
|       `-- 0002-postgres-for-write-model.md
`-- src/
```

If `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```text
/
|-- CONTEXT-MAP.md
|-- docs/
|   `-- adr/                          <- system-wide decisions
`-- src/
    |-- ordering/
    |   |-- CONTEXT.md
    |   `-- docs/adr/                 <- context-specific decisions
    `-- billing/
        |-- CONTEXT.md
        `-- docs/adr/
```

Create files lazily. Only create documentation files when there is something concrete to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During The Session

### Challenge Against The Glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately.

Example: "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"

### Sharpen Fuzzy Language

When the user uses vague or overloaded terms, propose a precise canonical term.

Example: "You're saying 'account'. Do you mean the Customer or the User? Those are different things."

### Discuss Concrete Scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-Reference With Code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it.

Example: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"

### Update CONTEXT.md Inline

When a term is resolved, update `CONTEXT.md` immediately. Do not batch these updates. Capture terms as they happen. Use the format in `CONTEXT-FORMAT.md`.

`CONTEXT.md` must contain domain language only. It must not contain implementation details, scratch notes, project specs, or implementation decisions. It is a glossary and relationship map, not a planning document.

### Offer ADRs Sparingly

Only offer to create an ADR when all three are true:

1. The decision is hard to reverse. The cost of changing it later is meaningful.
2. The decision is surprising without context. A future reader will wonder why it was done this way.
3. The decision is the result of a real trade-off. There were genuine alternatives and one was chosen for specific reasons.

If any of the three is missing, skip the ADR. Use the format in `ADR-FORMAT.md`.
