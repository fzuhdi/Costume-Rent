# Model Selector

## Use When

- The configured model for a workflow role is unavailable according to `node .opencode/scripts/resolve-agent-models.mjs --dry-run --json`.
- The user explicitly asks to review or change models.
- A previous workflow dispatch failed because a configured model was unavailable or unsuitable.

## Input

Default check covers all four roles: `sdet`, `developer`, `orchestrator`, `reviewer`. Role-limited checks are allowed when the failure or user request names specific roles.

## Workflow

1. Run `node .opencode/scripts/resolve-agent-models.mjs --dry-run --json` first. If every configured model is available and the user did not ask to review models, return that no change is needed.
2. Load `.opencode/model-capabilities.md` for capability categories and role weights.
3. Load `.opencode/workflow-models.json` for explicit role model priorities.
4. Use the resolver output or run `opencode models` when a fresh available-model list is needed.
5. For each affected role:
   a. Check if the current agent frontmatter model is available. If yes, mark it as current.
   b. Check if any model in the role's `.opencode/workflow-models.json` priority list is available.
   c. Score each available model using the role's capability weights:
      - Score = sum of primary weight + secondary weight × 0.5
      - Add a preference bonus of 10 + index bonus for models in the priority list.
      - Tie-break: prefer already-set model, then opencode-native, then cheaper/faster, then alphabetical.
   d. Sort candidates descending by score and present the top 3 as ranked options.
6. Present the selection table to the user:

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

7. Ask the user one compound question:
    - **Keep all current models and proceed** (proceed without changes)
    - **Change a specific role's model** (opens per-role choices)
    - **Full review** (collect per-role choices for all roles in one batched prompt when the question UI supports it; fall back to one role at a time only when custom input or tool limits require it)

8. For any role the user wants to change:
    a. Show the available options with their capability tags.
    b. Let the user select from the ranked list or type a custom model. In full-review mode, batch all four role choices into one question when possible to avoid serial prompts.
    c. Validate the chosen model exists in `opencode models`.
    d. After each role, show the updated plan.

9. After all user choices are collected, if any model changed, run:

    ```
    node .opencode/scripts/resolve-agent-models.mjs --write --json --set <role>=<model> [--set <role>=<model> ...]
    ```

   Use one repeatable `--set` argument per changed role so explicit user selections override available current models deterministically. If no role changed, do not run the writer.

10. Report:
   - Models per role (kept or changed)
   - Files modified, if any
   - Restart requirement if agent frontmatter changed

## Hard Rules

- Never suggest a model absent from `opencode models`.
- Never modify non-model frontmatter fields.
- When model selection was triggered because a configured model is unavailable, never proceed to workflow dispatch until the user confirms a valid model choice or cancels the run.
- Do not interrupt normal coordinator dispatch for model review when the configured models are available and the user did not request changes.
- Never commit or push; stop after writing and report restart when needed.
