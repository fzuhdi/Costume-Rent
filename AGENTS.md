# Costume-Rent AI Agent Rules

The following rules apply specifically to the Costume-Rent workspace and must be followed by Antigravity and any subagents:

## Frontend Code Quality & Linting
- **Always run ESLint**: Before finalizing any code changes in the `frontend/` directory, you MUST run ESLint to check for syntax errors and unused variables.
- **Lint Command**: Run `npx eslint src/` (or specify the exact file) from within the `frontend/` directory.
- **React Doctor Checks**: Run `npx react-doctor@latest --verbose --scope changed` inside `frontend/` after making changes. Ensure the score does not regress. If the score drops, fix the regressions before finalizing.
- **Full React Doctor Pass**: If asked to run `/doctor` or full triage, fetch the playbook via `curl --fail --silent --show-error --header 'Cache-Control: no-cache' https://www.react.doctor/prompts/react-doctor-agent.md` and follow it exactly.
- **Fix Errors**: Ensure that any linting errors caused by your modifications are resolved before presenting the work to the user.

## Backend Code Quality (Go)
- **Always Vet and Format**: Before finalizing any code changes in the `backend/` directory, you MUST run standard Go checks to verify correctness and formatting.
- **Commands**: Run `go vet ./...` and `go fmt ./...` from within the `backend/` directory.
- **Fix Issues**: Ensure that `go vet` reports no errors and the code is properly formatted before presenting work to the user.