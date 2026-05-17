# Quality Gates

The repo uses tiered checks so cheap integrity failures block work before expensive test runs.

## Commands

Run from `test/`:

```bash
npm run quality:integrity
npm run quality:e2e
npm run quality:full
```

Run from the repo root:

```bash
node scripts/quality-gate.mjs
```

## Gate Semantics

- `quality:integrity` runs `scripts/quality-gate.mjs` and fails on forbidden coverage-weakening patterns.
- `quality:integrity` also fails on unsafe test-state patterns: destructive cleanup, arbitrary first-row deletes, non-namespaced test data, and fake upload buffers.
- `quality:e2e` runs Playwright strictly. It must not mask failures with `|| true`.
- `quality:full` runs integrity first, then the full e2e suite.

## Required Checkpoints

- After any edit under `test/**`.
- Before reviewer final-review.
- Before committing TDD coverage or plan completion.
- Before treating a Playwright-green run as successful.
- Before plan-completion impacted-spec regression.

If Playwright passes but `quality:integrity` fails, the result is failed.

## Plan-Completion Regression

After all planned executable/review tickets are complete, the orchestrator must run the full impacted spec files before marking the plan complete.

- Impacted specs are derived from completed ticket `test_file` fields plus manifest/reviewer shared-impact additions.
- Regression runs full spec files, not only targeted `--grep` slices.
- Any failed mapped AC in an impacted spec blocks plan completion, including known/pre-existing failures.
- Failed mapped ACs are synced into same-plan `status: review` bug tickets with `node helpers/sync-regression-bugs.mjs --plan <plan-id>` from `test/`.
- Unmapped/setup/environment failures block without creating product bug tickets.
- The plan remains `in_progress` until impacted specs pass.
