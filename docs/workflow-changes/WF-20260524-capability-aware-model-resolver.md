# WF-20260524-capability-aware-model-resolver

## Status
implemented-reviewed

## Intent
Add a model-selector skill and resolver script so the coordinator can detect unavailable agent models, recommend capability-ranked alternatives, let the user choose, and apply the resolved model to agent frontmatter deterministically.

## Scope
- `.opencode/model-capabilities.md` — human-editable model table with capability categories, role weights, and preference priority.
- `.opencode/skills/model-selector/SKILL.md` — skill that ranks available models by role capability, presents options, asks user confirmation, and calls the resolver script.
- `.opencode/scripts/resolve-agent-models.mjs` — deterministic script that scores available models per role by capability weight, reports in JSON/text, and updates agent frontmatter on `--write`.
- `.opencode/scripts/test-resolve-agent-models.mjs` — targeted regression tests for explicit overrides and write-mode reporting.
- Update `.opencode/skills/coordinator/SKILL.md` to reference model-availability checks before dispatch.
- Update `docs/runbooks/project-runbook.md` for the new resolver script.
- Update `.opencode/README.md` for the new skill and config.

## Source Of Truth
- Model capability categories: `.opencode/model-capabilities.md`.
- Role model priorities: `.opencode/workflow-models.json`.
- Model selection procedure: `.opencode/skills/model-selector/SKILL.md`.
- Deterministic resolution and agent update: `.opencode/scripts/resolve-agent-models.mjs`.

## Validation Plan
- `node --check .opencode/scripts/resolve-agent-models.mjs`
- `node --check .opencode/scripts/test-resolve-agent-models.mjs`
- `node .opencode/scripts/test-resolve-agent-models.mjs` — verify explicit `--set role=model` overrides update available current models, dry-run does not write, and `--write` no-op reports are not labeled read-only.
- `node .opencode/scripts/resolve-agent-models.mjs --dry-run --json` — verify it lists available models, scores per role, and recommends capability-appropriate models.
- Parse `.opencode/model-capabilities.md` as reference documentation (visual review).

## Rollback Plan
Revert the change record and all listed files. Also revert `.opencode/agents/*.md` model lines if the resolver wrote unavailable models.

## Restart Requirement
Yes. OpenCode must reload updated agent definitions after `resolve-agent-models.mjs --write` modifies agent frontmatter. The new skill and config files also require restart.

## Reviewer Notes
- The resolver only modifies the `model:` line in agent frontmatter; all other frontmatter fields are preserved.
- `model-capabilities.md` is human-maintained and should be regenerated or reviewed when the available model set changes significantly.
- Capability weights in the script mirror the table and can be tuned per role.
- The coordinator should trigger `model-selector` before dispatch when `resolve-agent-models.mjs --dry-run --json` reports a role whose configured model is not available.
- Explicit user selections should be passed to the resolver with repeatable `--set <role>=<model>` flags so available current models do not block intentional changes.
- Full model reviews should collect all role choices in one batched prompt when possible, then run one resolver write command with all changed role overrides.
