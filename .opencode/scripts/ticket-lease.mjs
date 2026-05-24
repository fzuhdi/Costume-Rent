#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const defaultRegistryPath = path.join(root, '.opencode', 'state', 'ticket-leases.json');
const defaultLeaseMinutes = 60;
const ticketPattern = /^TICKET-\d{8}-\d{3}$/;

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { command: argv[0] && !argv[0].startsWith('--') ? argv[0] : 'status', values: {} };
  let index = args.command === 'status' && argv[0]?.startsWith('--') ? 0 : 1;

  for (; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}`);

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, value) => value.toUpperCase());
    if (inlineValue !== undefined) {
      args.values[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args.values[key] = true;
      continue;
    }

    args.values[key] = next;
    index += 1;
  }

  return args;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function registryPathFor(values) {
  const configured = values.leaseRegistry || values.registry || defaultRegistryPath;
  return path.resolve(configured);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadRegistry(values) {
  const registryPath = registryPathFor(values);
  const registry = readJson(registryPath, { schemaVersion: 1, leases: {} });
  if (registry.schemaVersion !== 1 || typeof registry.leases !== 'object' || registry.leases === null) {
    fail(`Invalid ticket lease registry: ${path.relative(root, registryPath)}`);
  }
  return registry;
}

function saveRegistry(registry, values) {
  const registryPath = registryPathFor(values);
  registry.updatedAt = new Date().toISOString();
  if (!values.dryRun) writeJson(registryPath, registry);
}

function requiredTicket(values) {
  const ticketId = String(values.ticket || values.target || '');
  if (!ticketPattern.test(ticketId)) fail('--ticket TICKET-YYYYMMDD-NNN is required.');
  return ticketId;
}

function isoPlusMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function gitDirty(worktree) {
  if (!worktree || !fs.existsSync(worktree)) return null;
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: worktree,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function normalizeLease(lease) {
  if (!lease || !lease.deadlineAt || !['running', 'deadline_expired'].includes(lease.status)) return lease;
  if (Date.parse(lease.deadlineAt) <= Date.now()) return { ...lease, status: 'deadline_expired' };
  return lease;
}

function start(values) {
  const ticketId = requiredTicket(values);
  const minutes = Number(values.leaseMinutes || values.minutes || defaultLeaseMinutes);
  if (!Number.isFinite(minutes) || minutes < 1) fail('--lease-minutes must be a positive number.');

  const registry = loadRegistry(values);
  const now = new Date().toISOString();
  registry.leases[ticketId] = {
    ticketId,
    planId: values.plan || null,
    testCaseId: values.testCase || null,
    worktree: values.worktree || null,
    slot: values.slot === undefined ? null : Number(values.slot),
    project: values.project || null,
    status: 'running',
    leaseMinutes: minutes,
    startedAt: now,
    deadlineAt: isoPlusMinutes(minutes),
    updatedAt: now,
  };
  saveRegistry(registry, values);
  print({ action: values.dryRun ? 'would-start' : 'started', lease: registry.leases[ticketId] }, values);
}

function transition(values, status) {
  const ticketId = requiredTicket(values);
  const registry = loadRegistry(values);
  const lease = registry.leases[ticketId];
  if (!lease) fail(`No lease found for ${ticketId}.`);
  registry.leases[ticketId] = { ...lease, status, note: values.note || lease.note || null, updatedAt: new Date().toISOString() };
  saveRegistry(registry, values);
  print({ action: status, lease: registry.leases[ticketId] }, values);
}

function inspect(values) {
  const ticketId = requiredTicket(values);
  const registry = loadRegistry(values);
  const lease = normalizeLease(registry.leases[ticketId]);
  if (!lease) fail(`No lease found for ${ticketId}.`);
  const dirty = gitDirty(lease.worktree);
  const classification = dirty === null
    ? 'inspect_failed'
    : dirty.length > 0
      ? 'orphaned_dirty'
      : lease.status === 'deadline_expired' || lease.status === 'interrupted'
        ? 'retryable'
        : 'adoptable';
  print({ action: 'inspect', classification, dirty: dirty || [], lease }, values);
}

function status(values) {
  const registry = loadRegistry(values);
  let changed = false;
  for (const [ticketId, lease] of Object.entries(registry.leases)) {
    const normalized = normalizeLease(lease);
    if (normalized?.status !== lease?.status) changed = true;
    registry.leases[ticketId] = normalized;
  }
  if (changed && values.write) saveRegistry(registry, values);
  const leases = values.ticket || values.target
    ? { [requiredTicket(values)]: registry.leases[requiredTicket(values)] || null }
    : registry.leases;
  print({ registryPath: path.relative(root, registryPathFor(values)), changed, persisted: Boolean(changed && values.write && !values.dryRun), leases }, values);
}

function print(payload, values) {
  if (values.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(JSON.stringify(payload, null, 2));
}

const { command, values } = parseArgs(process.argv.slice(2));
if (command === 'start') start(values);
else if (command === 'status') status(values);
else if (command === 'complete') transition(values, 'complete');
else if (command === 'interrupted') transition(values, 'interrupted');
else if (command === 'timed-out') transition(values, 'timed_out');
else if (command === 'failed') transition(values, 'failed');
else if (command === 'refresh') status({ ...values, write: true });
else if (command === 'inspect') inspect(values);
else fail(`Unknown command: ${command}`);
