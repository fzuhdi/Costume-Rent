#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message, details = '') {
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function copyScript(fixtureRoot, scriptName) {
  writeFile(
    path.join(fixtureRoot, '.opencode', 'scripts', scriptName),
    fs.readFileSync(path.join(root, '.opencode', 'scripts', scriptName), 'utf8'),
  );
}

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (!options.allowFailure && result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed`, `${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function runJson(command, args, cwd, options = {}) {
  const result = run(command, args, cwd, options);
  try {
    return { result, json: JSON.parse(result.stdout) };
  } catch (error) {
    fail(`Expected JSON from ${command} ${args.join(' ')}`, `${error.message}\n${result.stdout}\n${result.stderr}`);
  }
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-runner-reconcile-'));
const planId = 'PLAN-20260524-runner-fixture';
const ticketId = 'TICKET-20260524-001';
const featureId = 'FEATURE';
const testCaseId = 'FEATURE-001';

try {
  copyScript(fixtureRoot, 'workflow-runner.mjs');
  copyScript(fixtureRoot, 'build-worker-task.mjs');
  copyScript(fixtureRoot, 'build-test-case-manifest.mjs');

  writeFile(path.join(fixtureRoot, '.opencode', 'opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'project.json'), JSON.stringify({
    schema_version: 1,
    project: { name: 'Workflow Runner Fixture', adapter_path: '.opencode/project.json' },
    acceptance: { dir: 'docs/acceptance', id_pattern: '^[A-Z][A-Z0-9_]*-[0-9]{3}$', status: ['draft', 'ready', 'covered', 'retired'] },
    features: {
      [featureId]: { name: 'Feature Fixture', test_type: 'e2e', spec_files: ['test/specs/feature.spec.js'] },
    },
    code_roots: ['src'],
    test_roots: ['test'],
    test_types: ['e2e'],
    commands: {
      test_case: 'cd test && npx playwright test {test_runner_spec_files} --grep "{test_case_id}"',
      manifest: 'node .opencode/scripts/build-test-case-manifest.mjs',
      manifest_check: 'node .opencode/scripts/build-test-case-manifest.mjs --check',
    },
  }, null, 2) + '\n');

  writeFile(path.join(fixtureRoot, 'docs', 'acceptance', `${featureId}.md`), `# Feature Fixture\n\n## ${testCaseId}: Fixture acceptance\nStatus: ready\nTest type: e2e\nCriterion: A fixture behavior works.\nExpected outcome: The fixture behavior is verifiable.\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'plans', `${planId}.md`), `---\nid: ${planId}\nstatus: ready\n---\n\n# Runner Fixture Plan\n\n## Tickets\n- ${ticketId} - ready - feature - Fixture ticket\n\n## Status Summary\n- draft: 0\n- review: 0\n- ready: 1\n- in_progress: 0\n- blocked: 0\n- complete: 0\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${ticketId}.md`), `---\nid: ${ticketId}\nplan_id: ${planId}\ntype: feature\nstatus: ready\ntest_case_id: ${testCaseId}\npriority: 1\nsource_plan: docs/plans/${planId}.md\nred_expectation: The new acceptance test fails for the fixture reason.\ngreen_expectation: The same acceptance test passes after the minimal fixture implementation.\n---\n\n# Fixture Ticket\n`);
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'orchestrator-progress.json'), JSON.stringify({
    schemaVersion: 2,
    currentPlan: null,
    currentTicket: null,
    currentFeature: null,
    currentTestCase: null,
    status: 'idle',
    iteration: 0,
    maxIterations: 4,
    branch: null,
    baseBranch: null,
    lastCheckpointSha: null,
    red: { status: null, testFile: null, testTitle: null, failureSummary: null, preRedCheckpointSha: null, afterRedCheckpointSha: null },
    green: { refactorNeeded: null, refactorUsed: false, greenCommitSha: null, refactorCommitSha: null },
    regression: { cycle: 0, maxRegressionCycles: 3, impactedSpecs: [], lastResultsPath: null, lastSyncSummary: null },
    completedTestCases: [],
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'ticket-progress.json'), JSON.stringify({
    schemaVersion: 2,
    currentPlan: null,
    currentTicket: null,
    currentFeature: null,
    currentTestCase: null,
    currentTicketType: null,
    status: 'idle',
    branch: null,
    baseBranch: null,
    pr: { state: 'not_applicable', url: null, blockedReason: null, rerunCommand: null },
    tickets: { [ticketId]: { status: 'ready' } },
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'checkpoints.json'), JSON.stringify({ schemaVersion: 2, checkpoints: [] }, null, 2) + '\n');

  run(process.execPath, ['.opencode/scripts/build-test-case-manifest.mjs'], fixtureRoot);
  run('git', ['init'], fixtureRoot);
  run('git', ['add', '.'], fixtureRoot);
  run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'], fixtureRoot);
  const defaultBranch = run('git', ['branch', '--show-current'], fixtureRoot).stdout.trim() || 'master';
  run('git', ['branch', `tdd/${planId}`], fixtureRoot);
  writeFile(path.join(fixtureRoot, 'README.md'), '# branch sync fixture\n');
  run('git', ['add', 'README.md'], fixtureRoot);
  run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'advance base branch'], fixtureRoot);
  const sourceHeadBeforeRun = run('git', ['rev-parse', 'HEAD'], fixtureRoot).stdout.trim();

  const { json: initReport } = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', ticketId, '--run-ticket', '--json'], fixtureRoot);
  if (initReport.outcome !== 'partial' || initReport.runtime?.status !== 'red-writing') {
    fail('Expected run-ticket initialization to enter red-writing.', JSON.stringify(initReport, null, 2));
  }
  if (!initReport.checks?.some(check => check.name === 'execution-branch-base' && check.detail?.includes(`tdd/${planId} fast-forwarded to ${defaultBranch}`))) {
    fail('Expected run-ticket initialization to fast-forward the existing plan branch from its base branch.', JSON.stringify(initReport.checks, null, 2));
  }

  const activeBranch = run('git', ['branch', '--show-current'], fixtureRoot).stdout.trim();
  if (activeBranch !== `tdd/${planId}`) {
    fail('Expected run-ticket initialization to switch to the plan branch.', activeBranch);
  }

  const checkpointParent = run('git', ['rev-parse', 'HEAD^'], fixtureRoot).stdout.trim();
  if (checkpointParent !== sourceHeadBeforeRun) {
    fail('Expected the checkpoint commit to be based on the updated source branch head.', JSON.stringify({ checkpointParent, sourceHeadBeforeRun }, null, 2));
  }

  const checkpoints = JSON.parse(fs.readFileSync(path.join(fixtureRoot, '.opencode', 'state', 'checkpoints.json'), 'utf8'));
  const runtime = JSON.parse(fs.readFileSync(path.join(fixtureRoot, '.opencode', 'state', 'orchestrator-progress.json'), 'utf8'));
  if (!runtime.red.preRedCheckpointSha || !checkpoints.checkpoints.includes(runtime.red.preRedCheckpointSha)) {
    fail('Expected pre-RED checkpoint SHA to be recorded in checkpoints.json.', JSON.stringify({ runtime: runtime.red, checkpoints }, null, 2));
  }

  const { json: nextTaskReport } = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', ticketId, '--next-task', '--json'], fixtureRoot);
  if (nextTaskReport.blockers?.some(blocker => blocker.includes('checkpoint-ledger-drift'))) {
    fail('next-task self-blocked on checkpoint-ledger-drift after initialization.', JSON.stringify(nextTaskReport, null, 2));
  }
  if (nextTaskReport.outcome !== 'success' || nextTaskReport.nextTask?.role !== 'sdet' || nextTaskReport.nextTask?.mode !== 'red') {
    fail('Expected next-task to emit SDET RED after initialization.', JSON.stringify(nextTaskReport, null, 2));
  }

  writeFile(path.join(fixtureRoot, 'docs', 'plans', `${planId}.md`), `---\nid: ${planId}\nstatus: in_progress\n---\n\n# Runner Fixture Plan\n\n## Tickets\n- ${ticketId} - complete - feature - Fixture ticket\n\n## Status Summary\n- draft: 0\n- review: 0\n- ready: 0\n- in_progress: 0\n- blocked: 0\n- complete: 1\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${ticketId}.md`), `---\nid: ${ticketId}\nplan_id: ${planId}\ntype: feature\nstatus: complete\ntest_case_id: ${testCaseId}\npriority: 1\nsource_plan: docs/plans/${planId}.md\nred_expectation: The new acceptance test fails for the fixture reason.\ngreen_expectation: The same acceptance test passes after the minimal fixture implementation.\n---\n\n# Fixture Ticket\n`);
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'orchestrator-progress.json'), JSON.stringify({
    schemaVersion: 2,
    currentPlan: planId,
    currentTicket: ticketId,
    currentFeature: featureId,
    currentTestCase: testCaseId,
    status: 'idle',
    iteration: 0,
    maxIterations: 4,
    branch: `tdd/${planId}`,
    baseBranch: defaultBranch,
    lastCheckpointSha: runtime.red.preRedCheckpointSha,
    red: { status: null, testFile: null, testTitle: null, failureSummary: null, preRedCheckpointSha: null, afterRedCheckpointSha: null },
    green: { refactorNeeded: null, refactorUsed: false, greenCommitSha: null, refactorCommitSha: null },
    regression: { cycle: 0, maxRegressionCycles: 3, impactedSpecs: [], lastResultsPath: null, lastSyncSummary: null },
    completedTestCases: [testCaseId],
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'ticket-progress.json'), JSON.stringify({
    schemaVersion: 2,
    currentPlan: planId,
    currentTicket: ticketId,
    currentFeature: featureId,
    currentTestCase: testCaseId,
    currentTicketType: 'feature',
    status: 'idle',
    branch: `tdd/${planId}`,
    baseBranch: defaultBranch,
    pr: { state: 'not_applicable', url: null, blockedReason: null, rerunCommand: null },
    tickets: { [ticketId]: { status: 'complete' } },
  }, null, 2) + '\n');

  const { json: planReport } = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', planId, '--run-plan', '--dry-run', '--json'], fixtureRoot, { allowFailure: true });
  if (planReport.outcome !== 'blocked' || !planReport.nextStep?.includes('Integrate completed ticket branch')) {
    fail('Expected run-plan to block regression when completed ticket branch is not integrated.', JSON.stringify(planReport, null, 2));
  }
  if (!planReport.checks?.some(check => check.name === 'plan-integration' && check.status === 'blocked')) {
    fail('Expected plan-integration blocked check before regression.', JSON.stringify(planReport.checks, null, 2));
  }

  console.log('workflow-runner reconciliation smoke tests passed');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
