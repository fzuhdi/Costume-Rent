# Model Capabilities

Source: `opencode models` (2026-05-24). Capabilities are human-assigned categories for role-model matching.

## Available Models

| Model | Primary | Secondary | Best Roles | Notes |
|---|---|---|---|---|
| `opencode/big-pickle` | reasoning | general | orchestrator, reviewer | Default for FSM judgment and audits |
| `opencode/deepseek-v4-flash-free` | general | fast-general | developer, reviewer | Fast mid-weight general |
| `opencode/nemotron-3-super-free` | general | reasoning | reviewer, developer | Mid-weight reasoning alternative |
| `openai/gpt-5.2` | general | light | routing, status | Older, weakest; avoid for TDD work |
| `openai/gpt-5.3-codex` | coding | reasoning | developer, sdet | Strong coding and test authoring |
| `openai/gpt-5.3-codex-spark` | fast-coding | coding | developer, sdet | Faster/cheaper coding fallback |
| `openai/gpt-5.4` | general | reasoning | orchestrator, reviewer, developer | High general capability |
| `openai/gpt-5.4-fast` | fast-general | general | reviewer, developer | Speed-biased general |
| `openai/gpt-5.4-mini` | light | fast-general | routing, status | Cheap light model |
| `openai/gpt-5.4-mini-fast` | light | fast-general | routing, status | Fastest light model |
| `openai/gpt-5.5` | general | reasoning | orchestrator, reviewer, developer, sdet | Strong broad fallback |
| `openai/gpt-5.5-fast` | fast-general | general | developer, reviewer | Fast high general |
| `openai/gpt-5.5-pro` | reasoning | general | orchestrator, reviewer | Strongest reasoning/confidence |

## Role Capability Weights

| Role | reasoning | coding | fast-coding | general | fast-general | light |
|---|---|---|---|---|---|---|
| orchestrator | 5 | 0 | 0 | 3 | 1 | 0 |
| reviewer | 5 | 0 | 0 | 3 | 2 | 0 |
| developer | 2 | 5 | 4 | 2 | 1 | 0 |
| sdet | 2 | 5 | 4 | 2 | 1 | 0 |

## Model Preference Priority

From `.opencode/workflow-models.json`:

- **developer**: `opencode/minimax-m2.5-free` → `opencode/gpt-5.3-codex` → `opencode/big-pickle`
- **sdet**: `opencode/minimax-m2.5-free` → `opencode/gpt-5.3-codex` → `opencode/big-pickle`
- **orchestrator**: `opencode/big-pickle` → `opencode/minimax-m2.5-free`
- **reviewer**: `opencode/big-pickle` → `opencode/minimax-m2.5-free`
