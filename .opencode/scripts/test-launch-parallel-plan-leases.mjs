#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const target = 'PLAN-20260524-lease-fixture';
const firstTicketId = 'TICKET-20260524-001';
const secondTicketId = 'TICKET-20260524-002';
const thirdTicketId = 'TICKET-20260524-003';

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
  const libRoot = path.join(root, '.opencode', 'scripts', 'lib');
  for (const entry of fs.readdirSync(libRoot, { withFileTypes: true })) {
    if (entry.isFile()) {
      writeFile(
        path.join(fixtureRoot, '.opencode', 'scripts', 'lib', entry.name),
        fs.readFileSync(path.join(libRoot, entry.name), 'utf8'),
      );
    }
  }
}

function runGit(fixtureRoot, args) {
  const result = spawnSync('git', args, {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (result.status !== 0) fail(`fixture git ${args.join(' ')} failed`, `${result.stdout}\n${result.stderr}`);
}

function runLaunch(fixtureRoot, extraArgs, leaseRegistry) {
  const result = spawnSync(process.execPath, [
    '.opencode/scripts/launch-parallel-plan.mjs',
    '--target', target,
    '--parallel', '1',
    '--lease-minutes', '45',
      '--dry-run',
      '--json',
      '--lease-registry', leaseRegistry,
      '--workspace-root', path.join(path.dirname(leaseRegistry), 'workspaces'),
      ...extraArgs,
  ], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  if (result.status !== 0) fail('launch-parallel-plan dry-run failed', `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function runLease(fixtureRoot, command, extraArgs, leaseRegistry) {
  const result = spawnSync(process.execPath, [
    '.opencode/scripts/ticket-lease.mjs',
    command,
    '--json',
    '--lease-registry', leaseRegistry,
    ...extraArgs,
  ], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  if (result.status !== 0) fail(`ticket-lease ${command} failed`, `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function writeLeaseRegistry(filePath) {
  fs.writeFileSync(filePath, `${JSON.stringify({
    schemaVersion: 1,
    leases: {
      [firstTicketId]: {
        ticketId: firstTicketId,
        status: 'running',
        deadlineAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    },
  }, null, 2)}\n`);
}

function writeExpiredRunningRegistry(filePath) {
  fs.writeFileSync(filePath, `${JSON.stringify({
    schemaVersion: 1,
    leases: {
      [firstTicketId]: {
        ticketId: firstTicketId,
        status: 'running',
        deadlineAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    },
  }, null, 2)}\n`);
}

function prepareFixture(fixtureRoot) {
  copyScriptLib(fixtureRoot);
  writeFile(path.join(fixtureRoot, '.opencode/scripts/launch-parallel-plan.mjs'), fs.readFileSync(path.join(root, '.opencode/scripts/launch-parallel-plan.mjs'), 'utf8'));
  writeFile(path.join(fixtureRoot, '.opencode/scripts/ticket-lease.mjs'), fs.readFileSync(path.join(root, '.opencode/scripts/ticket-lease.mjs'), 'utf8'));
  writeFile(path.join(fixtureRoot, '.opencode/opencode.json'), '{}\n');
  writeFile(path.join(fixtureRoot, '.opencode/project.json'), JSON.stringify({
    schema_version: 1,
    project: { name: 'Lease Fixture', adapter_path: '.opencode/project.json' },
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
  writeFile(path.join(fixtureRoot, 'docs/plans', `${target}.md`), `---\nid: ${target}\nstatus: ready\n---\n\n# Lease Fixture Plan\n`);
  for (const [ticketId, priority] of [[firstTicketId, 1], [secondTicketId, 2], [thirdTicketId, 3]]) {
    writeFile(path.join(fixtureRoot, 'docs/tickets', `${ticketId}.md`), `---\nid: ${ticketId}\nplan_id: ${target}\nstatus: ready\ntype: feature\npriority: ${priority}\ntest_case_id: FEATURE-${String(priority).padStart(3, '0')}\n---\n\n# Fixture Ticket\n`);
  }
  runGit(fixtureRoot, ['init']);
  runGit(fixtureRoot, ['add', '.']);
  runGit(fixtureRoot, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture']);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-lease-test-'));
const fixtureRoot = path.join(tempDir, 'repo');
const leaseRegistry = path.join(tempDir, 'ticket-leases.json');
const statusRegistry = path.join(tempDir, 'status-ticket-leases.json');
const startRegistry = path.join(tempDir, 'start-ticket-leases.json');

try {
  prepareFixture(fixtureRoot);

  runLease(fixtureRoot, 'start', ['--ticket', thirdTicketId, '--lease-minutes', '5'], startRegistry);
  const startAfterWrite = JSON.parse(fs.readFileSync(startRegistry, 'utf8'));
  if (startAfterWrite.leases[thirdTicketId]?.status !== 'running') {
    fail('Expected ticket-lease start to write to the configured registry.', JSON.stringify(startAfterWrite, null, 2));
  }

  writeExpiredRunningRegistry(statusRegistry);
  const statusReport = runLease(fixtureRoot, 'status', [], statusRegistry);
  if (!statusReport.changed || statusReport.persisted) {
    fail('Expected status to report a pending expiry transition without persisting it.', JSON.stringify(statusReport, null, 2));
  }
  const statusAfterRead = JSON.parse(fs.readFileSync(statusRegistry, 'utf8'));
  if (statusAfterRead.leases[firstTicketId].status !== 'running') {
    fail('Expected ticket-lease status to be read-only.', JSON.stringify(statusAfterRead, null, 2));
  }
  const refreshReport = runLease(fixtureRoot, 'refresh', [], statusRegistry);
  if (!refreshReport.changed || !refreshReport.persisted) {
    fail('Expected refresh to persist expiry transitions.', JSON.stringify(refreshReport, null, 2));
  }
  const statusAfterRefresh = JSON.parse(fs.readFileSync(statusRegistry, 'utf8'));
  if (statusAfterRefresh.leases[firstTicketId].status !== 'deadline_expired') {
    fail('Expected ticket-lease refresh to persist deadline_expired.', JSON.stringify(statusAfterRefresh, null, 2));
  }

  writeLeaseRegistry(leaseRegistry);

  const refillReport = runLaunch(fixtureRoot, [], leaseRegistry);
  const refillSelected = refillReport.selectedTickets.join(',');
  if (refillSelected !== secondTicketId) {
    fail('Expected unsafe leased tickets to be skipped and next ready ticket to refill slot.', JSON.stringify({ selectedTickets: refillReport.selectedTickets, leaseBlockedTickets: refillReport.leaseBlockedTickets }, null, 2));
  }
  if (refillReport.leaseBlockedTickets.length !== 1) {
    fail('Expected one lease-blocked ticket.', JSON.stringify(refillReport.leaseBlockedTickets, null, 2));
  }

  const replaceReport = runLaunch(fixtureRoot, ['--replace-lease'], leaseRegistry);
  const replaceSelected = replaceReport.selectedTickets.join(',');
  if (replaceSelected !== firstTicketId) {
    fail('Expected --replace-lease to allow the first ready ticket.', JSON.stringify({ selectedTickets: replaceReport.selectedTickets, warnings: replaceReport.warnings }, null, 2));
  }
  if (!replaceReport.warnings.some(warning => warning.includes(`Replacing existing running lease for ${firstTicketId}`))) {
    fail('Expected --replace-lease warning for replacing running lease.', JSON.stringify(replaceReport.warnings, null, 2));
  }

  console.log('lease skip/refill tests passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
