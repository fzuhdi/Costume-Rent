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

If Playwright passes but `quality:integrity` fails, the result is failed.
