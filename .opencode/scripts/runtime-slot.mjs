#!/usr/bin/env node

import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadProjectConfig as loadAdapterConfig } from './lib/config.mjs';
import { portsForSlot as configuredPortsForSlot, runtimeEnvForSlot } from './lib/runtime-slots.mjs';

const root = process.cwd();
const registryPath = path.join(root, '.opencode/state/runtime-slots.json');
const projectConfig = loadAdapterConfig(root).config;
const runtimeConfig = requiredObject(projectConfig.runtime, 'runtime');
requiredNumber(runtimeConfig.slot_step, 'runtime.slot_step');
requiredNumber(runtimeConfig.base_ports?.frontend, 'runtime.base_ports.frontend');
requiredNumber(runtimeConfig.base_ports?.backend, 'runtime.base_ports.backend');
requiredNumber(runtimeConfig.base_ports?.sqlite, 'runtime.base_ports.sqlite');
const composeConfig = requiredObject(runtimeConfig.compose, 'runtime.compose');
const composeFile = requiredString(composeConfig.file, 'runtime.compose.file');
const composeServices = requiredStringArray(composeConfig.services, 'runtime.compose.services');
const composeServicesText = composeServices.join(' ');

function requiredObject(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Missing required .opencode/project.json ${key} object`);
  }
  return value;
}

function requiredString(value, key) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required .opencode/project.json ${key} string`);
  }
  return value;
}

function requiredNumber(value, key) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Missing required numeric .opencode/project.json ${key}`);
  }
  return number;
}

function requiredStringArray(value, key) {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`Missing required non-empty .opencode/project.json ${key} array`);
  }
  return value;
}

function runtimeEnvKey(name, fallback) {
  return runtimeConfig.env_keys?.[name] || fallback;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { command: 'acquire', values: {} };
  let i = 0;

  if (argv[0] && !argv[0].startsWith('-')) {
    args.command = argv[0];
    i = 1;
  }

  for (; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}`);

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    if (inlineValue !== undefined) {
      args.values[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      args.values[key] = true;
      continue;
    }

    args.values[key] = next;
    i += 1;
  }

  return args;
}

function slug(value) {
  const normalized = String(value || 'runtime')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (!normalized) return 'runtime';
  if (/^[a-z0-9]/.test(normalized)) return normalized;
  return `run-${normalized}`;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function loadRegistry() {
  const registry = readJson(registryPath, { schemaVersion: 1, slots: {} });

  if (registry.schemaVersion !== 1 || typeof registry.slots !== 'object' || registry.slots === null) {
    fail(`Invalid runtime slot registry: ${path.relative(root, registryPath)}`);
  }

  return registry;
}

function saveRegistry(registry) {
  registry.updatedAt = new Date().toISOString();
  writeJson(registryPath, registry);
}

function portsForSlot(slot) {
  return configuredPortsForSlot(runtimeConfig, slot);
}

function envForSlot(slot, project) {
  return runtimeEnvForSlot(projectConfig, root, slot, project);
}

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen({ port, host: '0.0.0.0', exclusive: true });
  });
}

async function portConflicts(ports) {
  const conflicts = [];

  for (const [service, port] of Object.entries(ports)) {
    if (!(await isPortFree(port))) {
      conflicts.push({ service, port, owner: describePortOwner(port) });
    }
  }

  return conflicts;
}

function describePortOwner(port) {
  if (process.platform !== 'win32') return null;

  try {
    const command = [
      '$connection = Get-NetTCPConnection -State Listen -LocalPort',
      String(port),
      '-ErrorAction SilentlyContinue | Select-Object -First 1;',
      'if ($connection) {',
      '$process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue;',
      '[pscustomobject]@{ pid = $connection.OwningProcess; process = $process.ProcessName } | ConvertTo-Json -Compress',
      '}',
    ].join(' ');
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    return output ? JSON.parse(output) : null;
  } catch {
    return null;
  }
}

function isFrontendHealthy(baseUrl) {
  return new Promise(resolve => {
    const request = http.get(baseUrl, { timeout: 3000 }, response => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.once('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.once('error', () => resolve(false));
  });
}

function composeDown(project) {
  const result = spawnSync('docker', ['compose', '-p', project, '-f', composeFile, 'down'], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) fail(`Failed to clean known Compose project: ${project}`);
}

function pickSlots(values) {
  if (values.slot !== undefined) return [Number(values.slot)];

  const startSlot = values.includeDefault ? 0 : Number(values.startSlot ?? 1);
  const maxSlots = Number(values.maxSlots ?? values.max ?? 8);
  const slots = [];

  for (let slot = startSlot; slot <= maxSlots; slot += 1) slots.push(slot);
  return slots;
}

function validateSlots(slots) {
  for (const slot of slots) {
    if (!Number.isInteger(slot) || slot < 0) fail(`Invalid runtime slot: ${slot}`);
  }
}

function printResult(result, values) {
  const frontendUrlKey = runtimeEnvKey('playwright_base_url', 'PW_BASE_URL');
  const backendPortKey = runtimeEnvKey('backend_host_port', 'BACKEND_HOST_PORT');
  const sqlitePortKey = runtimeEnvKey('sqlite_web_host_port', 'SQLITE_WEB_HOST_PORT');

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Runtime slot ${result.slot} ${result.action} for ${result.project}`);
  console.log(`Frontend: ${result.env[frontendUrlKey]}`);
  console.log(`Backend host port: ${result.env[backendPortKey]}`);
  console.log(`SQLite web host port: ${result.env[sqlitePortKey]}`);
  console.log(`Compose command: ${result.composeCommand}`);
  console.log('PowerShell environment:');

  for (const [key, value] of Object.entries(result.env)) {
    console.log(`$env:${key} = "${value}"`);
  }

  if (result.notes?.length) {
    console.log('Notes:');
    for (const note of result.notes) console.log(`- ${note}`);
  }
}

function makeSlotRecord(slot, target, project, worktree, action) {
  const env = envForSlot(slot, project);
  const ports = portsForSlot(slot);

  return {
    slot,
    target,
    project,
    worktree,
    ports,
    env,
    action,
    composeCommand: `docker compose -p ${project} -f ${composeFile} up -d ${composeServicesText}`,
  };
}

async function acquire(values) {
  const registry = loadRegistry();
  const target = String(values.target || values.project || path.basename(root));
  const project = slug(values.project || target);
  const worktree = fs.realpathSync(root);
  const slots = pickSlots(values);
  const attempts = [];

  validateSlots(slots);

  for (const slot of slots) {
    const record = makeSlotRecord(slot, target, project, worktree, 'reserved');
    const existing = registry.slots[String(slot)];
    const conflicts = await portConflicts(record.ports);

    if (conflicts.length === 0) {
      if (!values.dryRun) {
        registry.slots[String(slot)] = {
          ...record,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'reserved',
        };
        saveRegistry(registry);
      }

      printResult({ ...record, notes: values.dryRun ? ['dry run: registry not updated'] : [] }, values);
      return;
    }

    if (existing?.project === project) {
      const healthy = await isFrontendHealthy(record.env[runtimeEnvKey('playwright_base_url', 'PW_BASE_URL')]);

      if (healthy) {
        if (!values.dryRun) {
          registry.slots[String(slot)] = {
            ...existing,
            ...record,
            updatedAt: new Date().toISOString(),
            status: 'reused',
          };
          saveRegistry(registry);
        }

        printResult({ ...record, action: 'reused', notes: ['ports are occupied by the registered project and frontend responded healthy'] }, values);
        return;
      }

      if (values.cleanupKnownStale) {
        if (!values.dryRun) composeDown(project);

        const afterCleanup = values.dryRun ? conflicts : await portConflicts(record.ports);

        if (afterCleanup.length === 0 || values.dryRun) {
          if (!values.dryRun) {
            registry.slots[String(slot)] = {
              ...record,
              createdAt: existing.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'reserved',
            };
            saveRegistry(registry);
          }

          printResult({
            ...record,
            action: values.dryRun ? 'would clean known stale project' : 'cleaned known stale project and reserved',
            notes: values.dryRun ? ['dry run: no containers stopped and registry not updated'] : [],
          }, values);
          return;
        }

        attempts.push({ slot, reason: 'known project cleanup did not free all ports', conflicts: afterCleanup });
        continue;
      }

      attempts.push({ slot, reason: 'registered project is not healthy; rerun with --cleanup-known-stale to recreate it', conflicts });
      if (values.slot !== undefined) break;
      continue;
    }

    if (existing) {
      attempts.push({ slot, reason: `slot is registered to ${existing.project}`, conflicts });
    } else {
      attempts.push({ slot, reason: 'ports occupied by unknown process; not safe to kill automatically', conflicts });
    }

    if (values.slot !== undefined) break;
  }

  const payload = { status: 'blocked', project, target, attempts };

  if (values.json) console.error(JSON.stringify(payload, null, 2));
  else {
    console.error('No runtime slot could be acquired safely.');
    for (const attempt of attempts) {
      console.error(`- slot ${attempt.slot}: ${attempt.reason}`);
      for (const conflict of attempt.conflicts) {
        const owner = conflict.owner ? ` owner=${JSON.stringify(conflict.owner)}` : '';
        console.error(`  ${conflict.service} port ${conflict.port} occupied${owner}`);
      }
    }
    console.error('If a conflict is a known stale workflow stack, rerun with --cleanup-known-stale. Unknown port owners require user approval or a different slot.');
  }

  process.exit(2);
}

function status(values) {
  const registry = loadRegistry();
  const payload = { registryPath: path.relative(root, registryPath), ...registry };

  if (values.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log(`Runtime slot registry: ${payload.registryPath}`);
    const entries = Object.values(registry.slots);
    if (entries.length === 0) console.log('No registered runtime slots.');
    for (const entry of entries) {
      console.log(`- slot ${entry.slot}: ${entry.project} ${entry.env?.[runtimeEnvKey('playwright_base_url', 'PW_BASE_URL')] ?? ''} ${entry.status ?? ''}`);
    }
  }
}

function release(values) {
  const registry = loadRegistry();
  const key = values.slot !== undefined
    ? String(Number(values.slot))
    : Object.keys(registry.slots).find(slot => registry.slots[slot].project === values.project);

  if (!key || !registry.slots[key]) fail('No matching runtime slot registration found.');

  const released = registry.slots[key];
  delete registry.slots[key];

  if (!values.dryRun) saveRegistry(registry);

  console.log(`Released runtime slot ${released.slot} for ${released.project}${values.dryRun ? ' (dry run)' : ''}.`);
}

function cleanup(values) {
  if (!values.yes) fail('Cleanup requires --yes. This only stops a registered Compose project; unknown port owners are never killed.');

  const registry = loadRegistry();
  const key = values.slot !== undefined
    ? String(Number(values.slot))
    : Object.keys(registry.slots).find(slot => registry.slots[slot].project === values.project);

  if (!key || !registry.slots[key]) fail('No matching runtime slot registration found.');

  const entry = registry.slots[key];
  composeDown(entry.project);
  delete registry.slots[key];
  saveRegistry(registry);
  console.log(`Cleaned Compose project ${entry.project} and released slot ${entry.slot}.`);
}

async function main() {
  const { command, values } = parseArgs(process.argv.slice(2));

  if (command === 'acquire') return acquire(values);
  if (command === 'status') return status(values);
  if (command === 'release') return release(values);
  if (command === 'cleanup') return cleanup(values);

  fail(`Unknown command: ${command}`);
}

main().catch(error => fail(error.stack || error.message));
