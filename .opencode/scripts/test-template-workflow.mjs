#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { normalizeProjectConfig, workflowModeEnabled } from './lib/config.mjs';
import { parseFrontmatterText } from './lib/frontmatter.mjs';

const repoRoot = process.cwd();
const require = createRequire(import.meta.url);

function fail(message, details = '') {
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function copyScriptLib(fixtureRoot) {
  const libRoot = path.join(repoRoot, '.opencode', 'scripts', 'lib');
  for (const entry of fs.readdirSync(libRoot, { withFileTypes: true })) {
    if (entry.isFile()) {
      writeFile(
        path.join(fixtureRoot, '.opencode', 'scripts', 'lib', entry.name),
        fs.readFileSync(path.join(libRoot, entry.name), 'utf8'),
      );
    }
  }
}

function copyScript(fixtureRoot, scriptName) {
  writeFile(
    path.join(fixtureRoot, '.opencode', 'scripts', scriptName),
    fs.readFileSync(path.join(repoRoot, '.opencode', 'scripts', scriptName), 'utf8'),
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

function initGit(fixtureRoot) {
  run('git', ['init'], fixtureRoot);
  run('git', ['add', '.'], fixtureRoot);
  run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'], fixtureRoot);
}

function writeState(fixtureRoot, ticketId, testCaseId) {
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
}

function writeStrictDisabledFixture(fixtureRoot) {
  const ticketId = 'TICKET-20260528-001';
  const testCaseId = 'FEATURE-001';
  copyScriptLib(fixtureRoot);
  copyScript(fixtureRoot, 'workflow-runner.mjs');
  copyScript(fixtureRoot, 'build-test-case-manifest.mjs');
  copyScript(fixtureRoot, 'build-worker-task.mjs');
  writeFile(path.join(fixtureRoot, '.opencode', 'opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'project.json'), JSON.stringify({
    schema_version: 2,
    project: { name: 'Strict Disabled Fixture', adapter_path: '.opencode/project.json' },
    acceptance: { dir: 'docs/acceptance', id_pattern: '^[A-Z][A-Z0-9_]*-[0-9]{3}$', status: ['draft', 'ready', 'covered', 'retired'] },
    features: { FEATURE: { name: 'Feature', test_type: 'e2e', spec_files: ['test/specs/feature.spec.js'] } },
    code_roots: ['src'],
    test_roots: ['test'],
    test_types: ['e2e'],
    commands: {
      test_case: 'cd test && npx playwright test {test_runner_spec_files} --grep "{test_case_id}"',
      manifest: 'node .opencode/scripts/build-test-case-manifest.mjs',
      manifest_check: 'node .opencode/scripts/build-test-case-manifest.mjs --check',
    },
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, 'docs', 'acceptance', 'FEATURE.md'), `# Feature\n\n## ${testCaseId}: Fixture behavior\nStatus: ready\nTest type: e2e\nCriterion: Fixture behavior.\nExpected outcome: Fixture outcome.\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${ticketId}.md`), `---\nid: ${ticketId}\ntype: feature\nstatus: ready\ntest_case_id: ${testCaseId}\npriority: 1\nred_expectation: New test fails first.\ngreen_expectation: New test passes after implementation.\n---\n\n# Fixture Ticket\n`);
  writeFile(path.join(fixtureRoot, 'test', 'specs', 'feature.spec.js'), "import { test } from '@playwright/test';\n");
  writeState(fixtureRoot, ticketId, testCaseId);
  run(process.execPath, ['.opencode/scripts/build-test-case-manifest.mjs'], fixtureRoot);
  initGit(fixtureRoot);
  return { ticketId };
}

function writeDoctorFixture(fixtureRoot, options = {}) {
  copyScriptLib(fixtureRoot);
  for (const script of ['doctor.mjs', 'audit-opencode-portability.mjs', 'workflow-runner.mjs', 'launch-parallel-plan.mjs', 'build-test-case-manifest.mjs', 'cleanup-generated.mjs']) {
    copyScript(fixtureRoot, script);
  }
  writeFile(path.join(fixtureRoot, '.opencode', 'opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'project.example.json'), fs.readFileSync(path.join(repoRoot, '.opencode', 'project.example.json'), 'utf8'));
  writeFile(path.join(fixtureRoot, '.opencode', 'skills', 'orchestrator', 'SKILL.md'), '---\nname: orchestrator\ndescription: fixture\n---\n# Fixture\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'skills', 'orchestrator', 'REFERENCE.md'), '# Reference\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'skills', 'shared', 'constraints.md'), '# Constraints\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'skills', 'shared', 'io-contract.md'), '# Contract\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'project.json'), JSON.stringify({
    schema_version: 2,
    project: { name: 'Doctor Fixture', adapter_path: '.opencode/project.json' },
    docs: {
      root: 'docs',
      acceptance: 'docs/acceptance',
      plans: 'docs/plans',
      tickets: 'docs/tickets',
      workflow_changes: 'docs/workflow-changes',
      runbooks: 'docs/runbooks',
    },
    workflow: { enabled_modes: ['ui-tracer', 'light-implementation'], default_mode: 'ui-tracer', max_parallel: 1 },
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
    code_roots: ['src'],
    test_roots: ['test'],
  }, null, 2) + '\n');
  const ignoreLines = [
    '.artifacts/',
    '.playwright-mcp/',
    'test-results/',
    'test-results-*/',
    'playwright-report/',
    'playwright-report-*/',
    'test/test-results/',
    'test/test-results-*/',
    'test/playwright-report/',
    'test/playwright-report-*/',
  ];
  writeFile(path.join(fixtureRoot, '.gitignore'), `${ignoreLines.filter(line => line !== options.omitIgnore).join('\n')}\n`);
  initGit(fixtureRoot);
}

function testConfigNormalization() {
  const defaulted = normalizeProjectConfig({});
  if (!workflowModeEnabled(defaulted, 'ui-tracer') || workflowModeEnabled(defaulted, 'strict-tdd')) {
    fail('Default project config should enable ui-tracer but not strict-tdd.', JSON.stringify(defaulted.workflow, null, 2));
  }
  if (!defaulted.workflow.product_stages.includes('design-ui') || !defaulted.workflow.internal_stages.includes('workflow-maintenance')) {
    fail('Default project config should include product stages and internal workflow-maintenance.', JSON.stringify(defaulted.workflow, null, 2));
  }
  if (defaulted.workflow.legacy_mode_map['light-implementation']?.quality_policy !== 'light-checks') {
    fail('Legacy workflow modes should normalize to stage/policy pairs.', JSON.stringify(defaulted.workflow.legacy_mode_map, null, 2));
  }

  const project = normalizeProjectConfig(JSON.parse(fs.readFileSync(path.join(repoRoot, '.opencode', 'project.json'), 'utf8')));
  if (!workflowModeEnabled(project, 'strict-tdd') || !workflowModeEnabled(project, 'parallel-runtime')) {
    fail('This project must explicitly enable strict-tdd and parallel-runtime.', JSON.stringify(project.workflow, null, 2));
  }

  const example = normalizeProjectConfig(JSON.parse(fs.readFileSync(path.join(repoRoot, '.opencode', 'project.example.json'), 'utf8')));
  if (workflowModeEnabled(example, 'strict-tdd')) {
    fail('project.example.json should not enable strict-tdd by default.', JSON.stringify(example.workflow, null, 2));
  }
}

function testFrontmatterLists() {
  const inline = parseFrontmatterText('---\ndepends_on: [TICKET-20260528-001, TICKET-20260528-002]\n---\n', 'inline');
  if (!inline.ok || inline.data.depends_on.length !== 2) {
    fail('Expected inline depends_on frontmatter to parse as a list.', JSON.stringify(inline, null, 2));
  }

  const block = parseFrontmatterText('---\ndepends_on:\n  - TICKET-20260528-001\n  - TICKET-20260528-002\n---\n', 'block');
  if (!block.ok || block.data.depends_on.length !== 2) {
    fail('Expected block depends_on frontmatter to parse as a list.', JSON.stringify(block, null, 2));
  }
}

function testStrictTddDisabledRunner() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-disabled-'));
  try {
    const { ticketId } = writeStrictDisabledFixture(fixtureRoot);
    const { json } = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', ticketId, '--run-ticket', '--json'], fixtureRoot, { allowFailure: true });
    if (!json.blockers?.some(blocker => blocker.includes('strict-tdd'))) {
      fail('Expected strict disabled fixture to block strict TDD runner execution.', JSON.stringify(json, null, 2));
    }
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function writeStagePolicyFixture(fixtureRoot) {
  const planId = 'PLAN-20260528-stage-policy-fixture';
  const maintenanceTicket = 'TICKET-20260528-101';
  const dependentTicket = 'TICKET-20260528-102';
  const designTicket = 'TICKET-20260528-103';
  const integrateTicket = 'TICKET-20260528-104';
  const deploymentTicket = 'TICKET-20260528-105';
  const strictMissingTicket = 'TICKET-20260528-106';
  const testCaseId = 'FEATURE-001';

  copyScriptLib(fixtureRoot);
  copyScript(fixtureRoot, 'workflow-runner.mjs');
  copyScript(fixtureRoot, 'build-test-case-manifest.mjs');
  copyScript(fixtureRoot, 'build-worker-task.mjs');
  writeFile(path.join(fixtureRoot, '.opencode', 'opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'project.json'), JSON.stringify({
    schema_version: 2,
    project: { name: 'Stage Policy Fixture', adapter_path: '.opencode/project.json' },
    acceptance: { dir: 'docs/acceptance', id_pattern: '^[A-Z][A-Z0-9_]*-[0-9]{3}$', status: ['draft', 'ready', 'covered', 'retired'] },
    features: { FEATURE: { name: 'Feature', test_type: 'e2e', spec_files: ['test/specs/feature.spec.js'] } },
    code_roots: ['backend', 'frontend'],
    test_roots: ['test'],
    test_types: ['e2e'],
    workflow: {
      product_stages: ['design-ui', 'integrate-backend', 'deployment'],
      internal_stages: ['workflow-maintenance'],
      quality_policies: ['exploratory', 'light-checks', 'strict-tdd'],
      default_stage: 'design-ui',
      default_quality_policy: 'exploratory',
      enabled_modes: ['ui-tracer', 'light-implementation', 'strict-tdd'],
      default_mode: 'ui-tracer',
      max_parallel: 1,
    },
    commands: {
      test_case: 'cd test && npx playwright test {test_runner_spec_files} --grep "{test_case_id}"',
      manifest: 'node .opencode/scripts/build-test-case-manifest.mjs',
      manifest_check: 'node .opencode/scripts/build-test-case-manifest.mjs --check',
    },
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, 'docs', 'acceptance', 'FEATURE.md'), `# Feature\n\n## ${testCaseId}: Fixture behavior\nStatus: ready\nTest type: e2e\nCriterion: Fixture behavior.\nExpected outcome: Fixture outcome.\n`);
  writeFile(path.join(fixtureRoot, 'test', 'specs', 'feature.spec.js'), "import { test } from '@playwright/test';\n");
  writeFile(path.join(fixtureRoot, 'docs', 'plans', `${planId}.md`), `---\nid: ${planId}\nstatus: ready\n---\n\n# Stage Policy Fixture\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${maintenanceTicket}.md`), `---\nid: ${maintenanceTicket}\nplan_id: ${planId}\ntype: chore\nstatus: ready\nworkflow_stage: workflow-maintenance\nquality_policy: light-checks\npriority: 1\ndepends_on: []\nsource_plan: docs/plans/${planId}.md\n---\n\n# Maintenance Ticket\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${dependentTicket}.md`), `---\nid: ${dependentTicket}\nplan_id: ${planId}\ntype: chore\nstatus: ready\nworkflow_stage: workflow-maintenance\nquality_policy: light-checks\npriority: 2\ndepends_on:\n  - ${maintenanceTicket}\nsource_plan: docs/plans/${planId}.md\n---\n\n# Dependent Maintenance Ticket\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${designTicket}.md`), `---\nid: ${designTicket}\nplan_id: ${planId}\ntype: spike\nstatus: ready\nworkflow_stage: design-ui\nquality_policy: exploratory\npriority: 3\ndepends_on: []\nsource_plan: docs/plans/${planId}.md\n---\n\n# Design Ticket\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${integrateTicket}.md`), `---\nid: ${integrateTicket}\nplan_id: ${planId}\ntype: feature\nstatus: ready\nworkflow_stage: integrate-backend\nquality_policy: strict-tdd\npriority: 4\ntest_case_id: ${testCaseId}\ndepends_on: []\nsource_plan: docs/plans/${planId}.md\nred_expectation: Fixture RED fails.\ngreen_expectation: Fixture GREEN passes.\n---\n\n# Strict Ticket\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${deploymentTicket}.md`), `---\nid: ${deploymentTicket}\nplan_id: ${planId}\ntype: chore\nstatus: ready\nworkflow_stage: deployment\nquality_policy: light-checks\npriority: 5\ndepends_on: []\nsource_plan: docs/plans/${planId}.md\n---\n\n# Deployment Ticket\n`);
  writeFile(path.join(fixtureRoot, 'docs', 'tickets', `${strictMissingTicket}.md`), `---\nid: ${strictMissingTicket}\nplan_id: ${planId}\ntype: feature\nstatus: ready\nworkflow_stage: integrate-backend\nquality_policy: strict-tdd\npriority: 6\ntest_case_id: FEATURE-999\ndepends_on: []\nsource_plan: docs/plans/${planId}.md\nred_expectation: Missing RED.\ngreen_expectation: Missing GREEN.\n---\n\n# Strict Missing Ticket\n`);
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
    tickets: {
      [maintenanceTicket]: { status: 'ready' },
      [dependentTicket]: { status: 'ready' },
      [designTicket]: { status: 'ready' },
      [integrateTicket]: { status: 'ready' },
      [deploymentTicket]: { status: 'ready' },
      [strictMissingTicket]: { status: 'ready' },
    },
  }, null, 2) + '\n');
  writeFile(path.join(fixtureRoot, '.opencode', 'state', 'checkpoints.json'), JSON.stringify({ schemaVersion: 2, checkpoints: [] }, null, 2) + '\n');
  run(process.execPath, ['.opencode/scripts/build-test-case-manifest.mjs'], fixtureRoot);
  initGit(fixtureRoot);
  return { planId, maintenanceTicket, dependentTicket, designTicket, integrateTicket, deploymentTicket, strictMissingTicket };
}

function testStagePolicyRunner() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-policy-'));
  try {
    const fixture = writeStagePolicyFixture(fixtureRoot);

    for (const ticketId of [fixture.designTicket, fixture.deploymentTicket]) {
      const { json } = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', ticketId, '--json'], fixtureRoot);
      if (json.blockers?.some(blocker => blocker.includes('test_case_id'))) {
        fail(`${ticketId} should not require test_case_id for non-strict policy.`, JSON.stringify(json, null, 2));
      }
    }

    const missingStrict = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', fixture.strictMissingTicket, '--json'], fixtureRoot, { allowFailure: true });
    if (!missingStrict.json.blockers?.some(blocker => blocker.includes('not in the test-case manifest'))) {
      fail('Strict-TDD ticket should still require manifest mapping.', JSON.stringify(missingStrict.json, null, 2));
    }

    const plan = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', fixture.planId, '--json'], fixtureRoot, { allowFailure: true });
    if (plan.json.targetSummary?.nextReadyTicket !== fixture.maintenanceTicket) {
      fail('Plan should select the prerequisite maintenance ticket first.', JSON.stringify(plan.json.targetSummary, null, 2));
    }
    if (!plan.json.targetSummary?.deferredReadyTickets?.some(item => item.ticketId === fixture.dependentTicket)) {
      fail('Plan should defer ready tickets with unmet depends_on.', JSON.stringify(plan.json.targetSummary, null, 2));
    }

    const start = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', fixture.maintenanceTicket, '--run-ticket', '--json'], fixtureRoot);
    if (start.json.runtime?.status !== 'workflow-maintenance') {
      fail('Workflow-maintenance run-ticket should initialize workflow-maintenance phase.', JSON.stringify(start.json, null, 2));
    }

    const next = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', fixture.maintenanceTicket, '--next-task', '--json'], fixtureRoot);
    if (next.json.nextTask?.role !== 'workflow-engineer' || next.json.nextTask?.mode !== 'workflow-maintenance') {
      fail('Workflow-maintenance next-task should dispatch workflow-engineer only.', JSON.stringify(next.json.nextTask, null, 2));
    }

    writeFile(path.join(fixtureRoot, 'backend', 'touched.txt'), 'product-root edit\n');
    const outputPath = path.join(fixtureRoot, '.opencode', 'state', 'worker-outputs', 'maintenance.txt');
    writeFile(outputPath, `OUTCOME: success\nTICKET_ID: ${fixture.maintenanceTicket}\nCHANGE_ID: WF-20260528-fixture\nSUMMARY: fixture maintenance\nVALIDATION: fixture validation passed\nFILES_MODIFIED: backend/touched.txt - fixture edit\nRESTART_REQUIRED: no\nNOTES: none\n`);
    const blocked = runJson(process.execPath, ['.opencode/scripts/workflow-runner.mjs', '--target', fixture.maintenanceTicket, '--run-ticket', '--output-file', '.opencode/state/worker-outputs/maintenance.txt', '--json'], fixtureRoot, { allowFailure: true });
    if (!blocked.json.blockers?.some(blocker => blocker.includes('cannot modify product roots'))) {
      fail('Workflow-maintenance completion should reject product-root edits.', JSON.stringify(blocked.json, null, 2));
    }
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function testDoctor() {
  const successRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-success-'));
  const failureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-failure-'));
  const generatedDocsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-generated-docs-'));
  try {
    writeDoctorFixture(successRoot);
    const success = runJson(process.execPath, ['.opencode/scripts/doctor.mjs', '--json'], successRoot);
    if (success.json.outcome !== 'success') fail('Expected doctor fixture to pass.', JSON.stringify(success.json, null, 2));

    writeDoctorFixture(failureRoot, { omitIgnore: '.artifacts/' });
    const failure = runJson(process.execPath, ['.opencode/scripts/doctor.mjs', '--json'], failureRoot, { allowFailure: true });
    if (failure.result.status === 0 || !failure.json.blockers?.some(blocker => blocker.includes('not ignored'))) {
      fail('Expected doctor to fail when artifact ignores are missing.', JSON.stringify(failure.json, null, 2));
    }

    writeDoctorFixture(generatedDocsRoot);
    writeFile(path.join(generatedDocsRoot, '.opencode', 'generated', 'ticket.md'), '# Wrong place\n');
    const generatedDocs = runJson(process.execPath, ['.opencode/scripts/doctor.mjs', '--json'], generatedDocsRoot, { allowFailure: true });
    if (generatedDocs.result.status === 0 || !generatedDocs.json.blockers?.some(blocker => blocker.includes('Generated-doc directories'))) {
      fail('Expected doctor to reject adapter-local generated-doc directories.', JSON.stringify(generatedDocs.json, null, 2));
    }
  } finally {
    fs.rmSync(successRoot, { recursive: true, force: true });
    fs.rmSync(failureRoot, { recursive: true, force: true });
    fs.rmSync(generatedDocsRoot, { recursive: true, force: true });
  }
}

function testPlaywrightArtifacts() {
  const configPath = path.join(repoRoot, 'test', 'playwright.config.js');
  const fromRoot = require(configPath);
  const fromTest = runJson(process.execPath, ['-e', `const c = require(${JSON.stringify(configPath)}); console.log(JSON.stringify({ outputDir: c.outputDir, html: c.reporter[1][1].outputFolder, json: c.reporter[2][1].outputFile, snapshot: c.snapshotPathTemplate }));`], path.join(repoRoot, 'test'));
  const expectedOutput = path.join(repoRoot, '.artifacts', 'playwright', 'test-results');
  if (fromRoot.outputDir !== expectedOutput || fromTest.json.outputDir !== expectedOutput) {
    fail('Playwright outputDir should be anchored to repo .artifacts from any cwd.', JSON.stringify({ root: fromRoot.outputDir, test: fromTest.json.outputDir, expectedOutput }, null, 2));
  }
  if (fromRoot.use.video !== 'off' || fromRoot.use.screenshot !== 'only-on-failure' || fromRoot.use.trace !== 'retain-on-failure') {
    fail('Playwright default media settings should be agent-efficient.', JSON.stringify(fromRoot.use, null, 2));
  }
}

function testCleanupDryRunSafety() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-generated-'));
  try {
    copyScriptLib(fixtureRoot);
    copyScript(fixtureRoot, 'cleanup-generated.mjs');
    writeFile(path.join(fixtureRoot, '.gitignore'), '.artifacts/\ntest-results/\ntest/test-results/\n');
    writeFile(path.join(fixtureRoot, 'test-results', 'tracked.txt'), 'tracked\n');
    writeFile(path.join(fixtureRoot, 'test', 'test-results', 'untracked.txt'), 'untracked\n');
    writeFile(path.join(fixtureRoot, '.artifacts', 'playwright', 'test-results', 'result.txt'), 'artifact\n');
    run('git', ['init'], fixtureRoot);
    run('git', ['add', '.'], fixtureRoot);
    run('git', ['add', '-f', 'test-results/tracked.txt'], fixtureRoot);
    run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'], fixtureRoot);
    writeFile(path.join(fixtureRoot, 'test', 'test-results', 'untracked.txt'), 'untracked changed\n');
    const { json } = runJson(process.execPath, ['.opencode/scripts/cleanup-generated.mjs', '--json'], fixtureRoot);
    if (!json.targets?.some(target => target.path.startsWith('.artifacts')) || !json.targets?.some(target => target.path === 'test/test-results')) {
      fail('cleanup-generated dry-run should report untracked artifact roots.', JSON.stringify(json, null, 2));
    }
    if (!json.skippedTracked?.some(target => target.path === 'test-results/tracked.txt')) {
      fail('cleanup-generated dry-run should skip tracked generated-looking files.', JSON.stringify(json, null, 2));
    }
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

testConfigNormalization();
testFrontmatterLists();
testStrictTddDisabledRunner();
testStagePolicyRunner();
testDoctor();
testPlaywrightArtifacts();
testCleanupDryRunSafety();

console.log('template workflow tests passed');
