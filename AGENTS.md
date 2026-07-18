# Costume-Rent AI Agent Rules

The following rules apply specifically to the Costume-Rent workspace and must be followed by Antigravity and any subagents:

## Code Quality & Assurance
- **Always Run QA**: Before finalizing any code changes in either the `frontend/` or `backend/` directory, you MUST trigger the `qa` skill to perform a comprehensive quality check.
- **Workflow**: Do not present your work to the user as "complete" until the `qa` skill has been successfully executed and any reported issues are fixed.
- **Linter Fixes**: Do NOT use inline disable comments (e.g., `// eslint-disable-next-line` or `nolint`) to bypass linter problems. Always prioritize properly refactoring the code to natively resolve the underlying issue.