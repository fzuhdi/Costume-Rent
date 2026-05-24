#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const target = 'PLAN-20260517-staff-admin-mobile-first-ui-refresh';

function fail(message, details = '') {
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

function runLaunch(extraArgs, leaseRegistry) {
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
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  if (result.status !== 0) fail('launch-parallel-plan dry-run failed', `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function runLease(command, extraArgs, leaseRegistry) {
  const result = spawnSync(process.execPath, [
    '.opencode/scripts/ticket-lease.mjs',
    command,
    '--json',
    '--lease-registry', leaseRegistry,
    ...extraArgs,
  ], {
    cwd: root,
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
      'TICKET-20260517-004': {
        ticketId: 'TICKET-20260517-004',
        status: 'running',
        deadlineAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      'TICKET-20260517-005': {
        ticketId: 'TICKET-20260517-005',
        status: 'deadline_expired',
        deadlineAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    },
  }, null, 2)}\n`);
}

function writeExpiredRunningRegistry(filePath) {
  fs.writeFileSync(filePath, `${JSON.stringify({
    schemaVersion: 1,
    leases: {
      'TICKET-20260517-004': {
        ticketId: 'TICKET-20260517-004',
        status: 'running',
        deadlineAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    },
  }, null, 2)}\n`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'costume-rent-lease-test-'));
const leaseRegistry = path.join(tempDir, 'ticket-leases.json');
const statusRegistry = path.join(tempDir, 'status-ticket-leases.json');
const startRegistry = path.join(tempDir, 'start-ticket-leases.json');

try {
  runLease('start', ['--ticket', 'TICKET-20260517-009', '--lease-minutes', '5'], startRegistry);
  const startAfterWrite = JSON.parse(fs.readFileSync(startRegistry, 'utf8'));
  if (startAfterWrite.leases['TICKET-20260517-009']?.status !== 'running') {
    fail('Expected ticket-lease start to write to the configured registry.', JSON.stringify(startAfterWrite, null, 2));
  }

  writeExpiredRunningRegistry(statusRegistry);
  const statusReport = runLease('status', [], statusRegistry);
  if (!statusReport.changed || statusReport.persisted) {
    fail('Expected status to report a pending expiry transition without persisting it.', JSON.stringify(statusReport, null, 2));
  }
  const statusAfterRead = JSON.parse(fs.readFileSync(statusRegistry, 'utf8'));
  if (statusAfterRead.leases['TICKET-20260517-004'].status !== 'running') {
    fail('Expected ticket-lease status to be read-only.', JSON.stringify(statusAfterRead, null, 2));
  }
  const refreshReport = runLease('refresh', [], statusRegistry);
  if (!refreshReport.changed || !refreshReport.persisted) {
    fail('Expected refresh to persist expiry transitions.', JSON.stringify(refreshReport, null, 2));
  }
  const statusAfterRefresh = JSON.parse(fs.readFileSync(statusRegistry, 'utf8'));
  if (statusAfterRefresh.leases['TICKET-20260517-004'].status !== 'deadline_expired') {
    fail('Expected ticket-lease refresh to persist deadline_expired.', JSON.stringify(statusAfterRefresh, null, 2));
  }

  writeLeaseRegistry(leaseRegistry);

  const refillReport = runLaunch([], leaseRegistry);
  const refillSelected = refillReport.selectedTickets.join(',');
  if (refillSelected !== 'TICKET-20260517-010') {
    fail('Expected unsafe leased tickets to be skipped and next ready ticket to refill slot.', JSON.stringify({ selectedTickets: refillReport.selectedTickets, leaseBlockedTickets: refillReport.leaseBlockedTickets }, null, 2));
  }
  if (refillReport.leaseBlockedTickets.length !== 1) {
    fail('Expected one lease-blocked ticket.', JSON.stringify(refillReport.leaseBlockedTickets, null, 2));
  }

  const replaceReport = runLaunch(['--replace-lease'], leaseRegistry);
  const replaceSelected = replaceReport.selectedTickets.join(',');
  if (replaceSelected !== 'TICKET-20260517-004') {
    fail('Expected --replace-lease to allow the first ready ticket.', JSON.stringify({ selectedTickets: replaceReport.selectedTickets, warnings: replaceReport.warnings }, null, 2));
  }
  if (!replaceReport.warnings.some(warning => warning.includes('Replacing existing running lease for TICKET-20260517-004'))) {
    fail('Expected --replace-lease warning for replacing running lease.', JSON.stringify(replaceReport.warnings, null, 2));
  }

  console.log('lease skip/refill tests passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
