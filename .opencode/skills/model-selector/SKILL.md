# Model Selector

## Use When

- Always invoked by the coordinator before every workflow dispatch.
- The user explicitly asks to review or change models.

## Input

Always checks all four roles: `sdet`, `developer`, `orchestrator`, `reviewer`.

## Workflow

1. Load `.opencode/model-capabilities.md` for capability categories and role weights.
2. Load `.opencode/workflow-models.json` for explicit role model priorities.
3. Run `opencode models` and parse the output as available model IDs.
4. For each role:
   a. Check if the current agent frontmatter model is available. If yes, mark it as current.
   b. Check if any model in the role's `.opencode/workflow-models.json` priority list is available.
   c. Score each available model using the role's capability weights:
      - Score = sum of primary weight + secondary weight × 0.5
      - Add a preference bonus of 10 + index bonus for models in the priority list.
      - Tie-break: prefer already-set model, then opencode-native, then cheaper/faster, then alphabetical.
   d. Sort candidates descending by score and present the top 3 as ranked options.
5. Present the full selection table to the user:

   ```
   Role           Current                  Recommended              Available
   developer      openai/gpt-5.3-codex     openai/gpt-5.3-codex     1. openai/gpt-5.3-codex (coding+reasoning)
                                                                    2. openai/gpt-5.3-codex-spark (fast-coding+coding)
                                                                    3. opencode/big-pickle (reasoning+general)
   -------------------------------------------------------------------------
   sdet           openai/gpt-5.3-codex     openai/gpt-5.3-codex     ...
   orchestrator   opencode/big-pickle      opencode/big-pickle      ...
   reviewer       opencode/big-pickle      opencode/big-pickle      ...
   ```

6. Ask the user one compound question:
   - **Keep all current models and proceed** (proceed without changes)
   - **Change a specific role's model** (opens per-role choices)
   - **Full review** (walk through each role one by one)

7. For any role the user wants to change:
   a. Show the available options with their capability tags.
   b. Let the user select from the ranked list or type a custom model.
   c. Validate the chosen model exists in `opencode models`.
   d. After each role, show the updated plan.

8. After all user choices are collected, if any model changed, run:

   ```
   node .opencode/scripts/resolve-agent-models.mjs --write --json
   ```

9. Report:
   - Models per role (kept or changed)
   - Files modified, if any
   - Restart requirement if agent frontmatter changed

## Hard Rules

- Never suggest a model absent from `opencode models`.
- Never modify non-model frontmatter fields.
- Never proceed to workflow dispatch without explicit user confirmation.
- Never commit or push; stop after writing and report restart when needed.
