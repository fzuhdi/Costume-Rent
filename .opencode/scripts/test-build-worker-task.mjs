#!/usr/bin/env node

import process from 'node:process';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const cwd = process.cwd();
const fixturePlanId = 'PLAN-20260524-worker-task-fixture';
const fixtureTicketId = 'TICKET-20260524-001';
const fixtureTestCaseId = 'FEATURE-001';

function fail(message, details = '') {
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, ['.opencode/scripts/build-worker-task.mjs', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (result.status !== 0) fail('build-worker-task failed', `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function runRaw(args) {
  return spawnSync(process.execPath, ['.opencode/scripts/build-worker-task.mjs', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
}

const task = run([
  '--role', 'sdet',
  '--mode', 'red',
  '--ticket-id', fixtureTicketId,
  '--test-case-id', fixtureTestCaseId,
  '--worktree-root', '.\\tmp-worktree',
  '--plan-id', fixturePlanId,
  '--json',
]);

for (const key of ['subagent_type', 'description', 'prompt']) {
  if (!task[key]) fail(`missing required key: ${key}`, JSON.stringify(task, null, 2));
}
for (const marker of ['WORKTREE_ROOT', 'TICKET_ID', 'TEST_CASE_ID', 'MODE: red', 'TICKET_FILE', 'TICKET_ACCEPTANCE_CRITERION', 'EXPECTED_OUTCOME', 'GREEN_EXPECTATION']) {
  if (!task.prompt.includes(marker)) fail(`prompt missing marker: ${marker}`, task.prompt);
}

const finalReviewTask = run([
  '--role', 'reviewer',
  '--mode', 'final-review',
  '--ticket-id', fixtureTicketId,
  '--test-case-id', fixtureTestCaseId,
  '--worktree-root', '.\\tmp-worktree',
  '--json',
]);
if (!finalReviewTask.prompt.includes('MODE: final-review')) fail('final-review mode was not preserved', finalReviewTask.prompt);

const exploreTask = run([
  '--role', 'explore',
  '--mode', 'explore',
  '--ticket-id', fixtureTicketId,
  '--test-case-id', fixtureTestCaseId,
  '--worktree-root', '.\\tmp-worktree',
  '--json',
]);
if (exploreTask.prompt.includes('.opencode/agents/explore.md')) fail('explore prompt should not reference a project agent file', exploreTask.prompt);
if (!exploreTask.prompt.includes('built-in explore subagent')) fail('explore prompt should identify the built-in subagent contract', exploreTask.prompt);

const workflowTask = run([
  '--role', 'workflow-engineer',
  '--mode', 'workflow-maintenance',
  '--ticket-id', fixtureTicketId,
  '--worktree-root', '.\\tmp-worktree',
  '--plan-id', fixturePlanId,
  '--workflow-stage', 'workflow-maintenance',
  '--quality-policy', 'light-checks',
  '--json',
]);
if (workflowTask.subagent_type !== 'workflow-engineer') fail('workflow-maintenance task should dispatch workflow-engineer', JSON.stringify(workflowTask, null, 2));
for (const marker of ['MODE: workflow-maintenance', 'WORKFLOW_STAGE: workflow-maintenance', 'QUALITY_POLICY: light-checks', 'do not edit backend/** or frontend/**']) {
  if (!workflowTask.prompt.includes(marker)) fail(`workflow-maintenance prompt missing marker: ${marker}`, workflowTask.prompt);
}
if (workflowTask.prompt.includes('TEST_CASE_ID')) fail('workflow-maintenance prompt should not require TEST_CASE_ID', workflowTask.prompt);

const invalidMode = runRaw([
  '--role', 'reviewer',
  '--mode', 'green',
  '--ticket-id', fixtureTicketId,
  '--test-case-id', fixtureTestCaseId,
  '--worktree-root', '.\\tmp-worktree',
  '--json',
]);
if (invalidMode.status === 0) fail('invalid reviewer mode should fail');

const unsupportedReviewerMode = runRaw([
  '--role', 'reviewer',
  '--mode', 'review',
  '--ticket-id', fixtureTicketId,
  '--test-case-id', fixtureTestCaseId,
  '--worktree-root', '.\\tmp-worktree',
  '--json',
]);
if (unsupportedReviewerMode.status === 0) fail('unsupported reviewer review mode should fail');

console.log('build-worker-task schema tests passed');

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function copyScriptLib(fixtureRoot) {
  const libRoot = path.join(cwd, '.opencode', 'scripts', 'lib');
  for (const entry of fs.readdirSync(libRoot, { withFileTypes: true })) {
    if (entry.isFile()) {
      writeFile(
        path.join(fixtureRoot, '.opencode', 'scripts', 'lib', entry.name),
        fs.readFileSync(path.join(libRoot, entry.name), 'utf8'),
      );
    }
  }
}

function runFixtureGit(fixtureRoot, args) {
  const result = spawnSync('git', args, {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (result.status !== 0) fail(`fixture git ${args.join(' ')} failed`, `${result.stdout}\n${result.stderr}`);
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-task-launch-fixture-'));
try {
  copyScriptLib(fixtureRoot);
  writeFile(path.join(fixtureRoot, '.opencode/scripts/launch-parallel-plan.mjs'), fs.readFileSync(path.join(cwd, '.opencode/scripts/launch-parallel-plan.mjs'), 'utf8'));
  writeFile(path.join(fixtureRoot, '.opencode/opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode/project.json'), JSON.stringify({
    schema_version: 1,
    project: { name: 'Worker Task Fixture', adapter_path: '.opencode/project.json' },
    workflow: { enabled_modes: ['ui-tracer', 'light-implementation', 'strict-tdd', 'parallel-runtime'], default_mode: 'ui-tracer', max_parallel: 3 },
    artifacts: {
      root: '.artifacts',
      playwright: {
        output_dir: '.artifacts/playwright/test-results',
        html_report: '.artifacts/playwright/html-report',
        screenshots: '.artifacts/playwright/screenshots',
      },
      playwright_mcp: '.artifacts/playwright-mcp',
      opencode: '.artifacts/opencode',
    },
    runtime: {
      slot_step: 100,
      base_ports: { frontend: 5173, backend: 8081, sqlite: 8080 },
      compose: { file: 'compose.fixture.yml', services: ['app', 'web'] },
      runtime_files: { required: ['app/package-lock.json', 'test/package-lock.json'], optional: [] },
      generated_env_files: [],
    },
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, 'app/package-lock.json'), '{}\n');
  writeFile(path.join(fixtureRoot, 'test/package-lock.json'), '{}\n');
  writeFile(path.join(fixtureRoot, 'test/node_modules/.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright'), 'fixture\n');
  writeFile(path.join(fixtureRoot, 'docs/plans', `${fixturePlanId}.md`), '---\nstatus: ready\n---\n\n# Fixture Plan\n');
  writeFile(path.join(fixtureRoot, 'docs/tickets', `${fixtureTicketId}.md`), `---\nplan_id: ${fixturePlanId}\nstatus: ready\ntype: feature\npriority: 1\ntest_case_id: ${fixtureTestCaseId}\n---\n\n# Fixture Ticket\n`);
  runFixtureGit(fixtureRoot, ['init']);
  runFixtureGit(fixtureRoot, ['add', '.']);
  runFixtureGit(fixtureRoot, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture']);

  const launch = spawnSync(process.execPath, [
    '.opencode/scripts/launch-parallel-plan.mjs',
    '--target', fixturePlanId,
    '--parallel', '1',
    '--dry-run',
    '--json',
    '--workspace-root', path.join(fixtureRoot, 'workspaces'),
    '--lease-registry', path.join(fixtureRoot, '.opencode', 'tmp-worker-task-test-leases.json'),
  ], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (launch.status !== 0) fail('launch-parallel-plan fixture dry-run failed', `${launch.stdout}\n${launch.stderr}`);
  const launchReport = JSON.parse(launch.stdout);
  const dispatchTask = launchReport.dispatches?.[0]?.task;
  if (!dispatchTask?.prompt?.includes('RUNNER: node .opencode/scripts/workflow-runner.mjs')) {
    fail('dispatch task prompt is missing runner instruction', JSON.stringify(dispatchTask, null, 2));
  }
  if (!dispatchTask.prompt.includes('--next-task') || !dispatchTask.prompt.includes('--ingest-worker-output')) {
    fail('dispatch task prompt is missing runner handoff loop instructions', dispatchTask.prompt);
  }
  if (!dispatchTask.workerTaskGenerator?.examples?.review?.includes('--mode final-review')) {
    fail('dispatch worker examples must include final-review reviewer mode', JSON.stringify(dispatchTask.workerTaskGenerator, null, 2));
  }
  const examples = Object.values(dispatchTask.workerTaskGenerator?.examples || {}).join('\n');
  if (!dispatchTask.prompt.includes('.opencode/state/worker-outputs/')) {
    fail('dispatch task prompt must tell orchestrator where to save worker outputs', dispatchTask.prompt);
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('launch prompt integration checks passed');
