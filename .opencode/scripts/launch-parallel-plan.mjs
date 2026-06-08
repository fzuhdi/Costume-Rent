#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { loadProjectConfig as loadAdapterConfig, workflowModeEnabled } from './lib/config.mjs';
import { portsForSlot as configuredPortsForSlot, runtimeEnvForSlot } from './lib/runtime-slots.mjs';
import { normalizeLease as normalizeTicketLease } from './lib/leases.mjs';

const root = process.cwd();
const defaultParallel = 3;
const projectConfig = loadAdapterConfig(root).config;
const maxParallel = projectConfig.workflow.max_parallel || 3;
const runtimeConfig = requiredObject(projectConfig.runtime, 'runtime');
requiredNumber(runtimeConfig.slot_step, 'runtime.slot_step');
requiredNumber(runtimeConfig.base_ports?.frontend, 'runtime.base_ports.frontend');
requiredNumber(runtimeConfig.base_ports?.backend, 'runtime.base_ports.backend');
requiredNumber(runtimeConfig.base_ports?.sqlite, 'runtime.base_ports.sqlite');
const composeConfig = requiredObject(runtimeConfig.compose, 'runtime.compose');
const composeFile = requiredString(composeConfig.file, 'runtime.compose.file');
const composeServices = requiredStringArray(composeConfig.services, 'runtime.compose.services');
const composeServicesText = composeServices.join(' ');
const runtimeFileConfig = requiredObject(runtimeConfig.runtime_files, 'runtime.runtime_files');
const executableTypes = new Set(['feature', 'bug']);
const strictTddPolicy = 'strict-tdd';
const ticketIdPattern = /^TICKET-\d{8}-\d{3}$/;
const requiredRuntimeFiles = requiredStringArray(runtimeFileConfig.required, 'runtime.runtime_files.required');
const optionalRuntimeFiles = runtimeFileConfig.optional || [];
if (!Array.isArray(optionalRuntimeFiles) || optionalRuntimeFiles.some(item => typeof item !== 'string' || item.trim() === '')) {
  throw new Error('Project adapter field runtime.runtime_files.optional must be an array of strings when present.');
}
for (const relativePath of [...requiredRuntimeFiles, ...optionalRuntimeFiles]) {
  assertRuntimeFileIsSafeToCopy(relativePath);
}
const generatedEnvFiles = runtimeConfig.generated_env_files || [];
if (!Array.isArray(generatedEnvFiles)) {
  throw new Error('Project adapter field runtime.generated_env_files must be an array when present.');
}
for (const envFile of generatedEnvFiles) {
  if (!envFile?.target || typeof envFile.target !== 'string' || typeof envFile.values !== 'object' || envFile.values === null || Array.isArray(envFile.values)) {
    throw new Error('Project adapter field runtime.generated_env_files entries must include target and values object.');
  }
  assertRelativeProjectPath(envFile.target, 'runtime.generated_env_files.target');
}
const unsafeLeaseStatuses = new Set(['running', 'deadline_expired', 'interrupted']);

function ticketQualityPolicy(frontmatter) {
  if (frontmatter.quality_policy) return frontmatter.quality_policy;
  if (frontmatter.workflow_mode && projectConfig.workflow.legacy_mode_map?.[frontmatter.workflow_mode]) {
    return projectConfig.workflow.legacy_mode_map[frontmatter.workflow_mode].quality_policy;
  }
  if (frontmatter.test_case_id || frontmatter.red_expectation || frontmatter.green_expectation) return strictTddPolicy;
  return projectConfig.workflow.default_quality_policy;
}

function isParallelExecutableTicket(ticket) {
  return executableTypes.has(ticket.frontmatter.type) && ticketQualityPolicy(ticket.frontmatter) === strictTddPolicy;
}

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

function assertRelativeProjectPath(relativePath, key) {
  if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]+/).includes('..')) {
    throw new Error(`Project adapter field ${key} must be a relative path inside the project: ${relativePath}`);
  }
}

function assertRuntimeFileIsSafeToCopy(relativePath) {
  assertRelativeProjectPath(relativePath, 'runtime.runtime_files');
  const normalized = relativePath.replace(/\\/g, '/');
  const basename = path.posix.basename(normalized).toLowerCase();
  if (basename === '.env' || basename.startsWith('.env.')) {
    throw new Error(`Project adapter runtime.runtime_files must not copy env file ${relativePath}; use runtime.generated_env_files for dev-only ticket env.`);
  }
}

function runtimeEnvKey(name, fallback) {
  return runtimeConfig.env_keys?.[name] || fallback;
}

function interpolateRuntimeValue(value, env) {
  return String(value).replace(/\{([A-Z0-9_]+)\}/g, (_, key) => env[key] ?? '');
}

function usage() {
  return `Usage: node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-* [--parallel 3] [--lease-minutes 60] [--dry-run] [--json] [--workspace-root <path>] [--no-start-runtime] [--prepare-only]

Prepares up to three ready executable tickets for a plan in isolated git worktrees and runtime slots. Each ticket gets its own branch, .opencode/state, Compose project, host ports, Playwright base URL, and structured handoff for coordinator task dispatch.`;
}

function parseArgs(argv) {
  const values = {
    target: null,
    parallel: defaultParallel,
    dryRun: false,
    json: false,
    workspaceRoot: null,
    startRuntime: true,
    prepareOnly: false,
    help: false,
    leaseMinutes: 60,
    replaceLease: false,
    leaseRegistry: path.join(root, '.opencode', 'state', 'ticket-leases.json'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      values.help = true;
      continue;
    }

    if (token === '--dry-run') {
      values.dryRun = true;
      continue;
    }

    if (token === '--json') {
      values.json = true;
      continue;
    }

    if (token === '--no-start-runtime') {
      values.startRuntime = false;
      continue;
    }

    if (token === '--prepare-only') {
      values.prepareOnly = true;
      continue;
    }

    if (token === '--replace-lease') {
      values.replaceLease = true;
      continue;
    }

    if (token === '--lease-registry') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --lease-registry');
      values.leaseRegistry = path.resolve(next);
      index += 1;
      continue;
    }

    if (token.startsWith('--lease-registry=')) {
      values.leaseRegistry = path.resolve(token.slice('--lease-registry='.length));
      continue;
    }

    if (token === '--lease-minutes') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --lease-minutes');
      values.leaseMinutes = Number(next);
      index += 1;
      continue;
    }

    if (token.startsWith('--lease-minutes=')) {
      values.leaseMinutes = Number(token.slice('--lease-minutes='.length));
      continue;
    }

    if (token === '--target') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --target');
      values.target = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--target=')) {
      values.target = token.slice('--target='.length);
      continue;
    }

    if (token === '--parallel') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --parallel');
      values.parallel = Number(next);
      index += 1;
      continue;
    }

    if (token.startsWith('--parallel=')) {
      values.parallel = Number(token.slice('--parallel='.length));
      continue;
    }

    if (token === '--workspace-root') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --workspace-root');
      values.workspaceRoot = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--workspace-root=')) {
      values.workspaceRoot = token.slice('--workspace-root='.length);
      continue;
    }

    if (token.startsWith('--')) throw new Error(`Unknown option: ${token}`);

    if (values.target) throw new Error(`Unexpected extra argument: ${token}`);
    values.target = token;
  }

  return values;
}

function rel(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error?.message || null,
  };
}

function runInherit(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: options.env || process.env,
    stdio: 'inherit',
    windowsHide: false,
  });

  return !result.error && result.status === 0;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function parseScalar(value) {
  const trimmed = String(value || '').trim();
  const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) return quoted[2];

  const inlineArray = trimmed.match(/^\[(.*)\]$/);
  if (inlineArray) {
    const body = inlineArray[1].trim();
    if (!body) return [];
    return body.split(',')
      .map(item => parseScalar(item))
      .filter(item => item !== '');
  }

  return trimmed;
}

function parseFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Missing frontmatter: ${filePath}`);

  const data = {};
  let currentListKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s*(.*)$/);
    if (listItem && currentListKey) {
      if (!Array.isArray(data[currentListKey])) data[currentListKey] = data[currentListKey] ? [data[currentListKey]] : [];
      data[currentListKey].push(parseScalar(listItem[1]));
      continue;
    }

    const entry = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!entry) {
      if (line.trim()) currentListKey = null;
      continue;
    }

    const key = entry[1];
    const value = entry[2].trim();
    if (value === '') {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    data[key] = parseScalar(value);
    currentListKey = null;
  }

  return data;
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeLease(lease) {
  return normalizeTicketLease(lease);
}

function loadTicketLeases(report, values) {
  try {
    const registry = readJsonIfExists(values.leaseRegistry, { schemaVersion: 1, leases: {} });
    if (registry.schemaVersion !== 1 || typeof registry.leases !== 'object' || registry.leases === null) {
      report.blockers.push(`Invalid ticket lease registry: ${rel(values.leaseRegistry)}`);
      return new Map();
    }
    return new Map(Object.entries(registry.leases).map(([ticketId, lease]) => [ticketId, normalizeLease(lease)]));
  } catch (error) {
    report.blockers.push(`Could not read ticket lease registry: ${error.message}`);
    return new Map();
  }
}

function existingUnsafeLease(ticket, leasesByTicket, values, report) {
  const lease = leasesByTicket.get(ticket.id);
  if (!lease || !unsafeLeaseStatuses.has(lease.status)) return false;
  if (values.replaceLease) {
    report.warnings.push(`Replacing existing ${lease.status} lease for ${ticket.id}; coordinator is responsible for prior task interrupt/inspection.`);
    return false;
  }

  return {
    ticketId: ticket.id,
    status: lease.status,
    deadlineAt: lease.deadlineAt || null,
    inspectCommand: `node .opencode/scripts/ticket-lease.mjs inspect --ticket ${ticket.id} --json`,
  };
}

function dependencyIds(ticket) {
  const value = ticket.frontmatter.depends_on;
  if (value === undefined || value === null || value === '' || value === '[]') return [];
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values
    .map(item => String(item).trim())
    .filter(Boolean);
}

function analyzeDependencies(ticket, ticketsById) {
  const dependsOn = dependencyIds(ticket);
  const invalid = dependsOn.filter(id => !ticketIdPattern.test(id));
  const missing = dependsOn.filter(id => ticketIdPattern.test(id) && !ticketsById.has(id));
  const unmet = dependsOn.filter((id) => {
    const dependency = ticketsById.get(id);
    return dependency && dependency.frontmatter.status !== 'complete';
  });

  return { dependsOn, invalid, missing, unmet };
}

function readPlan(planId) {
  const filePath = path.join(root, 'docs', 'plans', `${planId}.md`);
  if (!fs.existsSync(filePath)) throw new Error(`Plan not found: ${rel(filePath)}`);
  return { id: planId, file: rel(filePath), frontmatter: parseFrontmatter(filePath) };
}

function readPlanTickets(planId) {
  const ticketDir = path.join(root, 'docs', 'tickets');
  return fs.readdirSync(ticketDir)
    .filter(name => /^TICKET-\d{8}-\d{3}\.md$/.test(name))
    .map((name) => {
      const filePath = path.join(ticketDir, name);
      const frontmatter = parseFrontmatter(filePath);
      return { id: name.replace(/\.md$/, ''), file: rel(filePath), frontmatter };
    })
    .filter(ticket => ticket.frontmatter.plan_id === planId)
    .sort((left, right) => {
      const lp = Number(left.frontmatter.priority || 9999);
      const rp = Number(right.frontmatter.priority || 9999);
      return lp === rp ? left.id.localeCompare(right.id) : lp - rp;
    });
}

function gitClean(cwd = root) {
  const result = runCapture('git', ['status', '--porcelain'], { cwd });
  if (!result.ok) return { ok: false, dirty: [], error: result.stderr || result.error || 'git status failed' };
  const dirty = result.stdout.split(/\r?\n/).filter(Boolean);
  return { ok: true, dirty, error: null };
}

function branchExists(branch) {
  return runCapture('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).ok;
}

function currentBranchName() {
  const result = runCapture('git', ['branch', '--show-current']);
  return result.ok ? result.stdout.trim() || null : null;
}

function branchDivergence(baseBranch, branch) {
  if (!branchExists(baseBranch) || !branchExists(branch)) return null;
  const result = runCapture('git', ['rev-list', '--left-right', '--count', `${baseBranch}...${branch}`]);
  if (!result.ok) return null;
  const match = result.stdout.trim().match(/^(\d+)\s+(\d+)$/);
  if (!match) return null;
  return {
    baseAhead: Number(match[1]),
    branchAhead: Number(match[2]),
  };
}

function syncBranchWithBase(branch, baseBranch, currentBranch, report, values, checkName) {
  if (!baseBranch || branch === baseBranch) return true;
  if (!branchExists(baseBranch)) {
    report.blockers.push(`Base branch ${baseBranch} does not exist; cannot verify ${branch}.`);
    report.checks.push({ name: checkName, status: 'failed', detail: `${branch} missing base ${baseBranch}` });
    return false;
  }
  if (!branchExists(branch)) return true;

  const divergence = branchDivergence(baseBranch, branch);
  if (!divergence) {
    report.blockers.push(`Could not compare ${branch} against base branch ${baseBranch}.`);
    report.checks.push({ name: checkName, status: 'failed', detail: `${branch} comparison failed` });
    return false;
  }

  if (divergence.baseAhead === 0) {
    report.checks.push({ name: checkName, status: 'passed', detail: `${branch} includes ${baseBranch}` });
    return true;
  }

  if (divergence.branchAhead > 0) {
    report.blockers.push(`Branch ${branch} has diverged from base branch ${baseBranch}; rebase or integrate it manually before continuing.`);
    report.checks.push({ name: checkName, status: 'failed', detail: `${branch} diverged from ${baseBranch}` });
    return false;
  }

  if (values.dryRun) {
    report.checks.push({ name: checkName, status: 'passed', detail: `dry-run would fast-forward ${branch} to ${baseBranch}` });
    return true;
  }

  const args = currentBranch === branch
    ? ['merge', '--ff-only', baseBranch]
    : ['branch', '-f', branch, baseBranch];
  const result = runCapture('git', args);
  if (!result.ok) {
    report.blockers.push(`Failed to fast-forward ${branch} to ${baseBranch}: ${result.stderr || result.error}`);
    report.checks.push({ name: checkName, status: 'failed', detail: `${branch} fast-forward failed` });
    return false;
  }

  report.checks.push({ name: checkName, status: 'passed', detail: `${branch} fast-forwarded to ${baseBranch}` });
  return true;
}

function worktreeExists(worktreePath) {
  return fs.existsSync(path.join(worktreePath, '.git')) || fs.existsSync(worktreePath);
}

function ensureProjectRoot(report) {
  const required = ['.opencode/opencode.json', '.opencode/project.json', 'docs/plans', 'docs/tickets'];
  for (const item of required) {
    if (!fs.existsSync(path.join(root, item))) report.blockers.push(`Missing project root item: ${item}`);
  }
}

function ensurePlanBranch(planBranch, baseBranch, report, values) {
  const currentBranch = currentBranchName();

  if (branchExists(planBranch)) {
    if (currentBranch === planBranch && !baseBranch && !values.dryRun) {
      report.blockers.push(`Coordinator checkout is already on ${planBranch}; checkout the source branch first so the launcher can verify whether the plan branch is up to date.`);
      report.checks.push({ name: 'plan-branch', status: 'failed', detail: `${planBranch}: source branch unknown` });
      return false;
    }
    if (!syncBranchWithBase(planBranch, baseBranch, currentBranch, report, values, 'plan-branch-base')) return false;
    report.checks.push({ name: 'plan-branch', status: 'passed', detail: planBranch });
    return true;
  }

  if (values.dryRun) {
    report.checks.push({ name: 'plan-branch', status: 'passed', detail: `dry-run would create ${planBranch} from ${baseBranch || 'current HEAD'}` });
    return true;
  }

  if (!baseBranch) {
    report.blockers.push(`Cannot create ${planBranch} while already checked out there; checkout the source branch first.`);
    report.checks.push({ name: 'plan-branch', status: 'failed', detail: `${planBranch}: source branch unknown` });
    return false;
  }

  const result = runCapture('git', ['branch', planBranch, baseBranch]);
  if (!result.ok) {
    report.blockers.push(`Failed to create plan branch ${planBranch}: ${result.stderr || result.error}`);
    report.checks.push({ name: 'plan-branch', status: 'failed', detail: planBranch });
    return false;
  }

  report.checks.push({ name: 'plan-branch', status: 'passed', detail: `created ${planBranch} from ${baseBranch}` });
  return true;
}

function portsForSlot(slot) {
  return configuredPortsForSlot(runtimeConfig, slot);
}

function envForSlot(slot, project) {
  return runtimeEnvForSlot(projectConfig, root, slot, project);
}

function slug(value) {
  return String(value || 'runtime')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'runtime';
}

function ensureWorktree(dispatch, report, values) {
  if (worktreeExists(dispatch.worktree)) {
    const clean = gitClean(dispatch.worktree);
    if (!clean.ok) {
      report.blockers.push(`Could not inspect worktree ${dispatch.worktree}: ${clean.error}`);
      dispatch.status = 'blocked';
      return false;
    }
    if (clean.dirty.length) {
      report.blockers.push(`Worktree for ${dispatch.ticketId} is dirty: ${dispatch.worktree}`);
      dispatch.status = 'blocked';
      dispatch.dirty = clean.dirty;
      return false;
    }
    dispatch.worktreeAction = 'reused';
    report.checks.push({ name: 'worktree', status: 'passed', detail: `${dispatch.ticketId}: reused` });
    return true;
  }

  if (values.dryRun) {
    dispatch.worktreeAction = 'dry-run-create';
    report.checks.push({ name: 'worktree', status: 'passed', detail: `${dispatch.ticketId}: dry-run create` });
    return true;
  }

  fs.mkdirSync(path.dirname(dispatch.worktree), { recursive: true });
  const args = branchExists(dispatch.branch)
    ? ['worktree', 'add', dispatch.worktree, dispatch.branch]
    : ['worktree', 'add', dispatch.worktree, '-b', dispatch.branch, dispatch.planBranch];
  const result = runCapture('git', args);
  if (!result.ok) {
    report.blockers.push(`Failed to create worktree for ${dispatch.ticketId}: ${result.stderr || result.error}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'worktree', status: 'failed', detail: dispatch.ticketId });
    return false;
  }

  dispatch.worktreeAction = 'created';
  report.checks.push({ name: 'worktree', status: 'passed', detail: `${dispatch.ticketId}: created` });
  return true;
}

function copyRuntimeFiles(dispatch, report, values) {
  const copied = [];
  const missingRequired = [];

  for (const relativePath of requiredRuntimeFiles) {
    const source = path.join(root, relativePath);
    const target = path.join(dispatch.worktree, relativePath);
    if (!fs.existsSync(source)) {
      missingRequired.push(relativePath);
      continue;
    }
    if (!values.dryRun) {
      ensureDirFor(target);
      fs.copyFileSync(source, target);
    }
    copied.push(relativePath);
  }

  for (const relativePath of optionalRuntimeFiles) {
    const source = path.join(root, relativePath);
    const target = path.join(dispatch.worktree, relativePath);
    if (!fs.existsSync(source)) continue;
    if (!values.dryRun) {
      ensureDirFor(target);
      fs.copyFileSync(source, target);
    }
    copied.push(relativePath);
  }

  for (const envFile of generatedEnvFiles) {
    if (!envFile?.target || typeof envFile.values !== 'object' || envFile.values === null) continue;
    const target = path.join(dispatch.worktree, envFile.target);
    const lines = Object.entries(envFile.values)
      .map(([key, value]) => `${key}=${interpolateRuntimeValue(value, dispatch.env)}`);
    if (!values.dryRun) {
      ensureDirFor(target);
      fs.writeFileSync(target, `${lines.join('\n')}\n`, 'utf8');
    }
    copied.push(`${envFile.target} (generated dev env)`);
  }

  dispatch.runtimeFiles = copied;
  if (missingRequired.length) {
    report.blockers.push(`Missing required runtime setup file(s) in coordinator checkout: ${missingRequired.join(', ')}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'runtime-files', status: 'failed', detail: `${dispatch.ticketId}: missing ${missingRequired.join(', ')}` });
    return false;
  }

  report.checks.push({ name: 'runtime-files', status: 'passed', detail: `${dispatch.ticketId}: ${values.dryRun ? 'dry-run ' : ''}${copied.join(', ')}` });
  return true;
}

function ensureTestDependencyLink(dispatch, report, values) {
  const sourceNodeModules = path.join(root, 'test', 'node_modules');
  const sourceBin = path.join(sourceNodeModules, '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright');
  const rootLock = path.join(root, 'test', 'package-lock.json');
  const worktreeLock = path.join(dispatch.worktree, 'test', 'package-lock.json');
  const targetNodeModules = path.join(dispatch.worktree, 'test', 'node_modules');

  if (!fs.existsSync(rootLock) || (!fs.existsSync(worktreeLock) && !values.dryRun)) {
    report.blockers.push(`Missing test/package-lock.json for ${dispatch.ticketId}; cannot prove reusable test dependencies.`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'test-dependencies', status: 'failed', detail: `${dispatch.ticketId}: missing lockfile` });
    return false;
  }

  const worktreeLockHash = fs.existsSync(worktreeLock) ? sha256File(worktreeLock) : sha256File(rootLock);
  if (sha256File(rootLock) !== worktreeLockHash) {
    report.blockers.push(`test/package-lock.json differs for ${dispatch.ticketId}; install/update dependencies once in a controlled workspace before preparation.`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'test-dependencies', status: 'failed', detail: `${dispatch.ticketId}: lock hash mismatch` });
    return false;
  }

  if (!fs.existsSync(sourceBin)) {
    report.blockers.push('Missing root test/node_modules Playwright runner. Approval required before running `cd test && npm ci`.');
    dispatch.status = 'blocked';
    report.checks.push({ name: 'test-dependencies', status: 'failed', detail: `${dispatch.ticketId}: missing root test/node_modules` });
    return false;
  }

  if (fs.existsSync(targetNodeModules)) {
    dispatch.testDependenciesAction = 'reused-existing';
    report.checks.push({ name: 'test-dependencies', status: 'passed', detail: `${dispatch.ticketId}: existing node_modules` });
    return true;
  }

  if (values.dryRun) {
    dispatch.testDependenciesAction = 'dry-run-link';
    report.checks.push({ name: 'test-dependencies', status: 'passed', detail: `${dispatch.ticketId}: dry-run link root test/node_modules` });
    return true;
  }

  ensureDirFor(targetNodeModules);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(sourceNodeModules, targetNodeModules, linkType);
  dispatch.testDependenciesAction = 'linked-root-cache';
  report.checks.push({ name: 'test-dependencies', status: 'passed', detail: `${dispatch.ticketId}: linked root test/node_modules` });
  return true;
}

function ensurePlaywrightBrowsers(dispatch, report, values) {
  if (values.dryRun) {
    dispatch.playwrightBrowsersAction = 'dry-run-check';
    report.checks.push({ name: 'playwright-browsers', status: 'passed', detail: `${dispatch.ticketId}: dry-run` });
    return true;
  }

  const env = { ...process.env, ...dispatch.env };
  const playwrightCli = path.join(dispatch.worktree, 'test', 'node_modules', '@playwright', 'test', 'cli.js');
  if (!fs.existsSync(playwrightCli)) {
    report.blockers.push(`Missing Playwright CLI for ${dispatch.ticketId}. Approval required before running \`cd test && npm ci\`.`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'playwright-browsers', status: 'failed', detail: `${dispatch.ticketId}: missing CLI` });
    return false;
  }

  const result = runCapture(process.execPath, [playwrightCli, 'install', '--dry-run', 'chromium'], { cwd: path.join(dispatch.worktree, 'test'), env });
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (!result.ok) {
    report.blockers.push(`Could not inspect Playwright browser cache for ${dispatch.ticketId}. Approval may be required for \`cd test && npx --no-install playwright install chromium\`: ${output || result.error}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'playwright-browsers', status: 'failed', detail: dispatch.ticketId });
    return false;
  }

  const installLocations = [...output.matchAll(/^\s*Install location:\s*(.+)$/gm)].map(match => match[1].trim());
  const missingLocations = installLocations.filter(location => !fs.existsSync(location));
  if (!installLocations.length || missingLocations.length) {
    const detail = missingLocations.length ? ` Missing cache path(s): ${missingLocations.join(', ')}` : '';
    report.blockers.push(`Playwright Chromium cache is incomplete for ${dispatch.ticketId}. Approval required before running \`cd test && npx --no-install playwright install chromium\` because it may consume bandwidth.${detail}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'playwright-browsers', status: 'blocked', detail: `${dispatch.ticketId}: chromium cache incomplete` });
    return false;
  }

  dispatch.playwrightBrowsersAction = 'cache-ready';
  report.checks.push({ name: 'playwright-browsers', status: 'passed', detail: `${dispatch.ticketId}: chromium cache ready` });
  return true;
}

function bootstrapState(dispatch, report, values) {
  if (values.dryRun) {
    report.checks.push({ name: 'state-bootstrap', status: 'passed', detail: `${dispatch.ticketId}: dry-run` });
    return true;
  }

  const stateDir = path.join(dispatch.worktree, '.opencode', 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  const feature = String(dispatch.testCaseId || '').split('-')[0] || null;
  const orchestrator = {
    schemaVersion: 2,
    currentPlan: dispatch.planId,
    currentTicket: dispatch.ticketId,
    currentFeature: feature,
    currentTestCase: dispatch.testCaseId,
    status: 'idle',
    iteration: 0,
    maxIterations: 4,
    branch: dispatch.branch,
    baseBranch: dispatch.planBranch,
    lastCheckpointSha: null,
    red: { status: null, testFile: null, testTitle: null, failureSummary: null, preRedCheckpointSha: null, afterRedCheckpointSha: null },
    green: { refactorNeeded: null, refactorUsed: false, greenCommitSha: null, refactorCommitSha: null },
    regression: { cycle: 0, maxRegressionCycles: 3, impactedSpecs: [], lastResultsPath: null, lastSyncSummary: null },
    completedTestCases: [],
  };
  const ticket = {
    schemaVersion: 2,
    currentPlan: dispatch.planId,
    currentTicket: dispatch.ticketId,
    currentFeature: feature,
    currentTestCase: dispatch.testCaseId,
    currentTicketType: dispatch.ticketType,
    status: 'idle',
    branch: dispatch.branch,
    baseBranch: dispatch.planBranch,
    pr: { state: 'not_applicable', url: null, blockedReason: null, rerunCommand: null },
    tickets: { [dispatch.ticketId]: { status: 'ready' } },
  };
  const checkpoints = { schemaVersion: 2, checkpoints: [] };

  fs.writeFileSync(path.join(stateDir, 'orchestrator-progress.json'), `${JSON.stringify(orchestrator, null, 2)}\n`);
  fs.writeFileSync(path.join(stateDir, 'ticket-progress.json'), `${JSON.stringify(ticket, null, 2)}\n`);
  fs.writeFileSync(path.join(stateDir, 'checkpoints.json'), `${JSON.stringify(checkpoints, null, 2)}\n`);

  const manifest = runCapture(process.execPath, ['.opencode/scripts/build-test-case-manifest.mjs'], { cwd: dispatch.worktree });
  if (!manifest.ok) {
    report.blockers.push(`Failed to build manifest in ${dispatch.ticketId} worktree: ${manifest.stderr || manifest.error}`);
    dispatch.status = 'blocked';
    return false;
  }

  report.checks.push({ name: 'state-bootstrap', status: 'passed', detail: dispatch.ticketId });
  return true;
}

function acquireSlot(dispatch, report, values) {
  if (values.dryRun) {
    dispatch.slotAction = 'dry-run-reserve';
    report.checks.push({ name: 'runtime-slot', status: 'passed', detail: `${dispatch.ticketId}: slot ${dispatch.slot} dry-run` });
    return true;
  }

  const args = ['.opencode/scripts/runtime-slot.mjs', 'acquire', '--target', dispatch.ticketId, '--project', dispatch.project, '--slot', String(dispatch.slot), '--json'];
  const result = runCapture(process.execPath, args, { cwd: dispatch.worktree });
  if (!result.ok) {
    report.blockers.push(`Failed to acquire slot ${dispatch.slot} for ${dispatch.ticketId}: ${result.stderr || result.error || result.stdout}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'runtime-slot', status: 'failed', detail: `${dispatch.ticketId}: slot ${dispatch.slot}` });
    return false;
  }

  try {
    const slotReport = JSON.parse(result.stdout);
    dispatch.env = slotReport.env || dispatch.env;
    dispatch.composeCommand = slotReport.composeCommand || dispatch.composeCommand;
    dispatch.slotAction = slotReport.action || 'reserved';
  } catch {
    dispatch.slotAction = 'reserved';
  }

  report.checks.push({ name: 'runtime-slot', status: 'passed', detail: `${dispatch.ticketId}: slot ${dispatch.slot}` });
  return true;
}

function cleanupCompletedSlotLeases(dispatch, leasesByTicket, report, values) {
  const completedSameSlot = Array.from(leasesByTicket.values())
    .filter(lease => lease?.status === 'complete')
    .filter(lease => Number(lease.slot) === Number(dispatch.slot))
    .filter(lease => lease.project && lease.project !== dispatch.project);

  if (!completedSameSlot.length) return true;

  if (values.dryRun) {
    report.checks.push({
      name: 'runtime-cleanup',
      status: 'passed',
      detail: `${dispatch.ticketId}: dry-run would stop completed slot ${dispatch.slot} stack(s): ${completedSameSlot.map(lease => lease.ticketId).join(', ')}`,
    });
    return true;
  }

  for (const lease of completedSameSlot) {
    const composeCwd = lease.worktree && fs.existsSync(path.join(lease.worktree, composeFile))
      ? lease.worktree
      : root;
    const result = runCapture('docker', ['compose', '-p', lease.project, '-f', composeFile, 'down'], { cwd: composeCwd });
    if (!result.ok) {
      report.blockers.push(`Failed to stop completed runtime ${lease.ticketId} (${lease.project}) before reusing slot ${dispatch.slot}: ${result.stderr || result.error || result.stdout}`);
      report.checks.push({ name: 'runtime-cleanup', status: 'failed', detail: `${dispatch.ticketId}: ${lease.ticketId}` });
      dispatch.status = 'blocked';
      return false;
    }
  }

  report.checks.push({
    name: 'runtime-cleanup',
    status: 'passed',
    detail: `${dispatch.ticketId}: stopped completed slot ${dispatch.slot} stack(s): ${completedSameSlot.map(lease => lease.ticketId).join(', ')}`,
  });
  return true;
}

function startRuntime(dispatch, report, values) {
  if (!values.startRuntime) {
    dispatch.runtimeAction = 'skipped';
    report.checks.push({ name: 'runtime-start', status: 'passed', detail: `${dispatch.ticketId}: skipped` });
    return true;
  }

  if (values.dryRun) {
    dispatch.runtimeAction = 'dry-run-start';
    report.checks.push({ name: 'runtime-start', status: 'passed', detail: `${dispatch.ticketId}: dry-run` });
    return true;
  }

  const env = { ...process.env, ...dispatch.env };
  const ok = runInherit('docker', ['compose', '-p', dispatch.project, '-f', composeFile, 'up', '-d', ...composeServices], { cwd: dispatch.worktree, env });
  if (!ok) {
    report.blockers.push(`Failed to start Compose runtime for ${dispatch.ticketId}.`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'runtime-start', status: 'failed', detail: dispatch.ticketId });
    return false;
  }

  dispatch.runtimeAction = 'started';
  report.checks.push({ name: 'runtime-start', status: 'passed', detail: dispatch.ticketId });
  return true;
}

function buildOrchestratorPrompt(dispatch) {
  const envLines = Object.keys(dispatch.env)
    .sort()
    .map(key => `${key}=${dispatch.env[key]}`)
    .join('\n');

  return `Load .opencode/skills/orchestrator/SKILL.md and run the runner-dispatched workflow for the assigned ticket.\n\nWORKTREE_ROOT: ${dispatch.worktree}\nPLAN_ID: ${dispatch.planId}\nTICKET_ID: ${dispatch.ticketId}\nTICKET_FILE: ${dispatch.ticketFile}\nTICKET_TYPE: ${dispatch.ticketType}\nTEST_CASE_ID: ${dispatch.testCaseId}\nBRANCH: ${dispatch.branch}\nBASE_BRANCH: ${dispatch.planBranch}\nRUNTIME_SLOT: ${dispatch.slot}\nCOMPOSE_PROJECT: ${dispatch.project}\nCOMPOSE_COMMAND: ${dispatch.composeCommand}\nLEASE_MINUTES: ${dispatch.leaseMinutes}\nLEASE_DEADLINE_AT: ${dispatch.leaseDeadlineAt}\nRUNTIME_ENV_KEYS:\n${envLines}\n\nRUNNER: node .opencode/scripts/workflow-runner.mjs\nRULE: The runner is the canonical state-transition engine. Use RUNNER --reconcile, RUNNER --target ${dispatch.ticketId} --run-ticket, RUNNER --target ${dispatch.ticketId} --next-task, and RUNNER --target ${dispatch.ticketId} --ingest-worker-output <saved-output-file> as appropriate. Dispatch exactly the task returned by --next-task; do not hand-write worker task payloads.\n\nRun every file and shell operation under WORKTREE_ROOT. When dispatching nested worker subagents, include this same WORKTREE_ROOT and instruct them to run all file and shell operations there. Save worker final messages under .opencode/state/worker-outputs/ before ingestion. Use only the runtime env keys and values above; do not inspect or include secret env file contents in prompts or summaries. If WORKTREE_ROOT is dirty before starting, block and report it. If the lease deadline is exceeded, stop at the next safe boundary and return OUTCOME: blocked with the timeout reason. Return per .opencode/skills/shared/io-contract.md.`;
}

function cleanupRuntimeAfterFailure(dispatch, report) {
  const cleanupResult = runCapture(process.execPath, [
    '.opencode/scripts/runtime-slot.mjs',
    'cleanup',
    '--project', dispatch.project,
    '--yes',
  ], { cwd: dispatch.worktree });
  if (!cleanupResult.ok) {
    report.warnings.push(`Failed to cleanup runtime for ${dispatch.ticketId}: ${cleanupResult.stderr || cleanupResult.error || cleanupResult.stdout}`);
  }
}

function attachTaskHandoff(dispatch) {
  if (!dispatch.leaseMinutes || !dispatch.leaseDeadlineAt) {
    throw new Error(`Cannot build orchestrator handoff without ticket lease fields for ${dispatch.ticketId}`);
  }

  dispatch.status = 'prepared';
  dispatch.dispatchStatus = 'prepared';
  dispatch.task = {
    subagentType: 'orchestrator',
    subagent_type: 'orchestrator',
    description: `Run orchestrator FSM for ${dispatch.ticketId} in prepared worktree`,
    taskDescription: `Run orchestrator FSM for ${dispatch.ticketId} in prepared worktree`,
    command: `/coordinator ${dispatch.planId}`,
    commandContext: {
      worktreeRoot: dispatch.worktree,
      planId: dispatch.planId,
      ticketId: dispatch.ticketId,
      ticketFile: dispatch.ticketFile,
      branch: dispatch.branch,
      baseBranch: dispatch.planBranch,
      runtimeSlot: dispatch.slot,
      composeProject: dispatch.project,
      composeCommand: dispatch.composeCommand,
      runtimeEnvKeys: dispatch.env,
    },
  };
  dispatch.task.command_context = dispatch.task.commandContext;
  dispatch.task.prompt = buildOrchestratorPrompt(dispatch);
  dispatch.task.orchestratorPrompt = dispatch.task.prompt;
  dispatch.task.orchestrator_prompt = dispatch.task.prompt;
  dispatch.task.workerTaskGenerator = {
    script: '.opencode/scripts/build-worker-task.mjs',
    requiredFields: ['subagent_type', 'description', 'prompt'],
    requiredPromptFields: ['WORKTREE_ROOT', 'TICKET_ID', 'TEST_CASE_ID'],
    examples: {
      red: `node .opencode/scripts/build-worker-task.mjs --role sdet --mode red --ticket-id ${dispatch.ticketId} --test-case-id ${dispatch.testCaseId} --worktree-root "${dispatch.worktree}" --plan-id ${dispatch.planId} --ticket-file ${dispatch.ticketFile} --ticket-type ${dispatch.ticketType} --branch ${dispatch.branch} --base-branch ${dispatch.planBranch} --json`,
      green: `node .opencode/scripts/build-worker-task.mjs --role developer --mode green --ticket-id ${dispatch.ticketId} --test-case-id ${dispatch.testCaseId} --worktree-root "${dispatch.worktree}" --plan-id ${dispatch.planId} --ticket-file ${dispatch.ticketFile} --ticket-type ${dispatch.ticketType} --branch ${dispatch.branch} --base-branch ${dispatch.planBranch} --json`,
      review: `node .opencode/scripts/build-worker-task.mjs --role reviewer --mode final-review --ticket-id ${dispatch.ticketId} --test-case-id ${dispatch.testCaseId} --worktree-root "${dispatch.worktree}" --plan-id ${dispatch.planId} --ticket-file ${dispatch.ticketFile} --ticket-type ${dispatch.ticketType} --branch ${dispatch.branch} --base-branch ${dispatch.planBranch} --json`,
      explore: `node .opencode/scripts/build-worker-task.mjs --role explore --mode explore --ticket-id ${dispatch.ticketId} --test-case-id ${dispatch.testCaseId} --worktree-root "${dispatch.worktree}" --plan-id ${dispatch.planId} --ticket-file ${dispatch.ticketFile} --ticket-type ${dispatch.ticketType} --branch ${dispatch.branch} --base-branch ${dispatch.planBranch} --json`,
    },
  };
}

function writeTicketHandoff(dispatch, report, values) {
  const handoffPath = path.join(root, '.opencode', 'state', 'ticket-handoffs', `${dispatch.ticketId}.json`);
  const payload = {
    schemaVersion: 1,
    ticketId: dispatch.ticketId,
    planId: dispatch.planId,
    testCaseId: dispatch.testCaseId,
    branch: dispatch.branch,
    baseBranch: dispatch.planBranch,
    worktree: dispatch.worktree,
    runtimeSlot: dispatch.slot,
    composeProject: dispatch.project,
    composeCommand: dispatch.composeCommand,
    lease: dispatch.lease || null,
    phase: 'prepared',
    workerTaskIds: {},
    workerOutputs: {},
    explorationMemoPath: path.join('.opencode', 'state', 'exploration', `${dispatch.ticketId}.md`),
    dirtyWorktree: null,
    nextSafeAction: 'Dispatch orchestrator task from dispatch.task payload.',
    task: dispatch.task,
    updatedAt: new Date().toISOString(),
  };

  dispatch.handoffFile = handoffPath;
  if (values.dryRun) return true;
  try {
    ensureDirFor(handoffPath);
    fs.writeFileSync(handoffPath, `${JSON.stringify(payload, null, 2)}\n`);
    return true;
  } catch (error) {
    report.blockers.push(`Failed to write ticket handoff for ${dispatch.ticketId}: ${error.message}`);
    transitionLease(dispatch, 'failed', report, values, 'ticket handoff write failed');
    cleanupRuntimeAfterFailure(dispatch, report);
    dispatch.status = 'blocked';
    return false;
  }
}

function applyLease(dispatch, lease) {
  dispatch.lease = lease;
  dispatch.leaseMinutes = lease.leaseMinutes;
  dispatch.leaseDeadlineAt = lease.deadlineAt;
}

function buildLeaseRecord(dispatch, values, status = 'running') {
  const now = new Date();
  return {
    ticketId: dispatch.ticketId,
    planId: dispatch.planId,
    testCaseId: dispatch.testCaseId,
    worktree: dispatch.worktree,
    slot: dispatch.slot,
    project: dispatch.project,
    status,
    leaseMinutes: values.leaseMinutes,
    startedAt: now.toISOString(),
    deadlineAt: new Date(now.getTime() + values.leaseMinutes * 60 * 1000).toISOString(),
  };
}

function startLease(dispatch, report, values) {
  if (values.dryRun) {
    applyLease(dispatch, buildLeaseRecord(dispatch, values, 'dry-run'));
    report.checks.push({ name: 'ticket-lease', status: 'passed', detail: `${dispatch.ticketId}: dry-run deadline ${dispatch.leaseDeadlineAt}` });
    return true;
  }
  const args = [
    '.opencode/scripts/ticket-lease.mjs', 'start',
    '--ticket', dispatch.ticketId,
    '--plan', dispatch.planId,
    '--test-case', dispatch.testCaseId,
    '--worktree', dispatch.worktree,
    '--slot', String(dispatch.slot),
    '--project', dispatch.project,
    '--lease-minutes', String(values.leaseMinutes),
    '--lease-registry', values.leaseRegistry,
    '--json',
  ];
  const result = runCapture(process.execPath, args);
  if (!result.ok) {
    report.blockers.push(`Failed to start ticket lease for ${dispatch.ticketId}: ${result.stderr || result.error || result.stdout}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'ticket-lease', status: 'failed', detail: dispatch.ticketId });
    return false;
  }
  applyLease(dispatch, JSON.parse(result.stdout).lease);
  report.checks.push({ name: 'ticket-lease', status: 'passed', detail: `${dispatch.ticketId}: deadline ${dispatch.leaseDeadlineAt}` });
  return true;
}

function transitionLease(dispatch, status, report, values, note) {
  if (values.dryRun || !dispatch.lease) return;
  const args = [
    '.opencode/scripts/ticket-lease.mjs', status,
    '--ticket', dispatch.ticketId,
    '--lease-registry', values.leaseRegistry,
    '--json',
  ];
  if (note) args.push('--note', note);
  const result = runCapture(process.execPath, args);
  if (!result.ok) {
    report.warnings.push(`Failed to mark lease ${status} for ${dispatch.ticketId}: ${result.stderr || result.error || result.stdout}`);
  }
}

function makeDispatch(planId, planBranch, ticket, index, workspaceRoot, leaseMinutes) {
  const slot = index + 1;
  const project = slug(ticket.id);
  const worktree = path.join(workspaceRoot, ticket.id);
  const env = envForSlot(slot, project);
  return {
    ticketId: ticket.id,
    planId,
    ticketFile: ticket.file,
    ticketType: ticket.frontmatter.type,
    testCaseId: ticket.frontmatter.test_case_id,
    slot,
    project,
    branch: `tdd/${ticket.id}`,
    planBranch,
    worktree,
    env,
    composeCommand: `docker compose -p ${project} -f ${composeFile} up -d ${composeServicesText}`,
    leaseMinutes,
    leaseDeadlineAt: null,
    status: 'planned',
  };
}

function buildReport(values) {
  const report = {
    runner: 'parallel-plan-prepare-handoff',
    mode: values.dryRun ? 'parallel-plan-dry-run' : 'parallel-plan-prepare',
    target: values.target,
    outcome: 'status',
    exitCode: null,
    parallelLimit: values.parallel,
    workspaceRoot: null,
    blockers: [],
    warnings: [],
    checks: [],
    plan: null,
    selectedTickets: [],
    skippedReadyTickets: [],
    dependencyBlockedTickets: [],
    leaseBlockedTickets: [],
    dispatches: [],
    nextStep: null,
  };

  ensureProjectRoot(report);
  report.workflow = {
    defaultMode: projectConfig.workflow.default_mode,
    enabledModes: projectConfig.workflow.enabled_modes,
  };
  if (!workflowModeEnabled(projectConfig, 'parallel-runtime')) {
    report.blockers.push('Parallel plan preparation requires workflow.enabled_modes to include "parallel-runtime" in .opencode/project.json.');
  }
  if (!workflowModeEnabled(projectConfig, 'strict-tdd')) {
    report.blockers.push('Parallel plan preparation dispatches strict TDD tickets; workflow.enabled_modes must include "strict-tdd".');
  }

  if (!values.target || !/^PLAN-\d{8}-[A-Za-z0-9-]+$/.test(values.target)) {
    report.blockers.push('Parallel prepare/handoff requires --target PLAN-YYYYMMDD-name.');
  }

  if (!Number.isInteger(values.parallel) || values.parallel < 1 || values.parallel > maxParallel) {
    report.blockers.push(`--parallel must be an integer between 1 and ${maxParallel}.`);
  }

  if (!Number.isFinite(values.leaseMinutes) || values.leaseMinutes < 1) {
    report.blockers.push('--lease-minutes must be a positive number.');
  }

  const clean = gitClean(root);
  if (!clean.ok) report.blockers.push(clean.error);
  else if (clean.dirty.length && !values.dryRun) report.blockers.push(`Coordinator checkout must be clean before parallel prepare/handoff: ${clean.dirty.join(', ')}`);
  else if (clean.dirty.length) report.warnings.push(`Coordinator checkout is dirty (${clean.dirty.length} path(s)); dry-run only.`);
  report.checks.push({ name: 'coordinator-worktree', status: clean.ok && !clean.dirty.length ? 'passed' : values.dryRun ? 'warning' : 'blocked', detail: clean.ok ? `${clean.dirty.length} dirty path(s)` : clean.error });

  if (report.blockers.length) return finishReport(report);

  const plan = readPlan(values.target);
  const tickets = readPlanTickets(values.target);
  const leasesByTicket = loadTicketLeases(report, values);
  const ticketsById = new Map(tickets.map(ticket => [ticket.id, ticket]));
  const reviewTickets = tickets.filter(ticket => ticket.frontmatter.status === 'review');
  const readyTickets = tickets.filter(ticket => ticket.frontmatter.status === 'ready' && isParallelExecutableTicket(ticket));
  const dependencyBlockedTickets = [];
  const leaseBlockedTickets = [];
  const independentReadyTickets = [];

  for (const ticket of readyTickets) {
    const dependencies = analyzeDependencies(ticket, ticketsById);
    ticket.dependencies = dependencies;

    if (dependencies.invalid.length) {
      report.blockers.push(`${ticket.id} has invalid depends_on ticket id(s): ${dependencies.invalid.join(', ')}`);
      continue;
    }

    if (dependencies.missing.length) {
      report.blockers.push(`${ticket.id} depends_on ticket(s) outside this plan or missing from docs/tickets: ${dependencies.missing.join(', ')}`);
      continue;
    }

    if (dependencies.unmet.length) {
      dependencyBlockedTickets.push({
        ticketId: ticket.id,
        dependsOn: dependencies.dependsOn,
        unmet: dependencies.unmet,
      });
      continue;
    }

    const unsafeLease = existingUnsafeLease(ticket, leasesByTicket, values, report);
    if (unsafeLease) {
      leaseBlockedTickets.push(unsafeLease);
      continue;
    }

    independentReadyTickets.push(ticket);
  }

  report.plan = {
    id: plan.id,
    file: plan.file,
    status: plan.frontmatter.status,
    totalTickets: tickets.length,
    reviewTickets: reviewTickets.map(ticket => ticket.id),
    readyExecutableTickets: readyTickets.map(ticket => ticket.id),
    independentReadyTickets: independentReadyTickets.map(ticket => ticket.id),
    dependencyBlockedTickets,
    leaseBlockedTickets,
  };
  report.dependencyBlockedTickets = dependencyBlockedTickets;
  report.leaseBlockedTickets = leaseBlockedTickets;

  if (reviewTickets.length) {
    report.blockers.push(`Plan has review tickets that must be audited before parallel executable prepare/handoff: ${reviewTickets.map(ticket => ticket.id).join(', ')}`);
  }

  if (!readyTickets.length) {
    report.blockers.push(`Plan ${values.target} has no ready executable tickets to prepare.`);
  } else if (!independentReadyTickets.length && (dependencyBlockedTickets.length || leaseBlockedTickets.length)) {
    const dependencyDetails = dependencyBlockedTickets
      .map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`);
    const leaseDetails = leaseBlockedTickets
      .map(item => `${item.ticketId} has ${item.status} lease`);
    const details = [...dependencyDetails, ...leaseDetails]
      .join('; ');
    report.blockers.push(`Plan ${values.target} has no independent ready executable tickets. Blockers: ${details}`);
  } else if (dependencyBlockedTickets.length) {
    report.warnings.push(`Excluded dependency-blocked ready ticket(s): ${dependencyBlockedTickets.map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`).join('; ')}`);
  }

  if (leaseBlockedTickets.length) {
    report.warnings.push(`Skipped unsafe leased ticket(s): ${leaseBlockedTickets.map(item => `${item.ticketId} ${item.status}`).join('; ')}`);
  }

  const planBranch = `tdd/${values.target}`;
  const baseBranch = currentBranchName() === planBranch ? null : currentBranchName();
  const workspaceRoot = path.resolve(values.workspaceRoot || path.join(root, '..', `${path.basename(root)}-workspaces`, values.target));
  report.workspaceRoot = workspaceRoot;
  report.selectedTickets = independentReadyTickets.slice(0, values.parallel).map(ticket => ticket.id);
  report.skippedReadyTickets = independentReadyTickets.slice(values.parallel).map(ticket => ticket.id);
  report.dispatches = independentReadyTickets.slice(0, values.parallel).map((ticket, index) => makeDispatch(values.target, planBranch, ticket, index, workspaceRoot, values.leaseMinutes));

  if (report.blockers.length) return finishReport(report);

  if (!ensurePlanBranch(planBranch, baseBranch, report, values)) return finishReport(report);

  for (const dispatch of report.dispatches) {
    if (!ensureWorktree(dispatch, report, values)) continue;
    if (!copyRuntimeFiles(dispatch, report, values)) continue;
    if (!ensureTestDependencyLink(dispatch, report, values)) continue;
    if (!ensurePlaywrightBrowsers(dispatch, report, values)) continue;
    if (!cleanupCompletedSlotLeases(dispatch, leasesByTicket, report, values)) continue;
    if (!startLease(dispatch, report, values)) continue;
    if (!bootstrapState(dispatch, report, values)) {
      transitionLease(dispatch, 'failed', report, values, 'state bootstrap failed');
      continue;
    }
    if (!acquireSlot(dispatch, report, values)) {
      transitionLease(dispatch, 'failed', report, values, 'runtime slot acquisition failed');
      continue;
    }
    if (!startRuntime(dispatch, report, values)) {
      transitionLease(dispatch, 'failed', report, values, 'runtime start failed');
      continue;
    }
    attachTaskHandoff(dispatch);
    if (!writeTicketHandoff(dispatch, report, values)) continue;
    if (values.dryRun) dispatch.status = 'ready-dry-run';
  }

  return finishReport(report);
}

function finishReport(report) {
  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Resolve blockers before preparing parallel tracer-ticket task handoffs.';
    return report;
  }

  if (report.dispatches.some(dispatch => dispatch.status === 'blocked')) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'One or more ticket dispatches blocked. Inspect dispatch details before retrying.';
    return report;
  }

  report.outcome = report.mode.endsWith('dry-run') ? 'ready' : 'success';
  report.exitCode = 0;
  report.nextStep = report.mode.endsWith('dry-run')
    ? `Dry run only. Re-run without --dry-run to prepare ${report.dispatches.length} isolated ticket task handoff(s).`
    : `Prepared ${report.dispatches.length} isolated ticket workflow(s). Coordinator must dispatch each dispatch.task with subagent_type=orchestrator, then merge completed ticket branches back into the plan branch sequentially.`;
  return report;
}

function printText(report) {
  console.log(`Parallel Plan Prepare/Handoff: ${report.outcome}`);
  console.log(`TARGET: ${report.target}`);
  console.log(`PARALLEL_LIMIT: ${report.parallelLimit}`);
  console.log(`WORKSPACE_ROOT: ${report.workspaceRoot || 'none'}`);
  if (report.plan) console.log(`READY_TICKETS: ${report.plan.readyExecutableTickets.join(', ') || 'none'}`);
  if (report.plan) console.log(`INDEPENDENT_READY_TICKETS: ${report.plan.independentReadyTickets.join(', ') || 'none'}`);
  if (report.dependencyBlockedTickets.length) {
    console.log(`DEPENDENCY_BLOCKED_TICKETS: ${report.dependencyBlockedTickets.map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`).join('; ')}`);
  }
  if (report.leaseBlockedTickets.length) {
    console.log(`LEASE_BLOCKED_TICKETS: ${report.leaseBlockedTickets.map(item => `${item.ticketId} ${item.status}`).join('; ')}`);
  }
  console.log('');
  console.log('DISPATCHES:');
  for (const dispatch of report.dispatches) {
    console.log(`- ${dispatch.ticketId}: slot=${dispatch.slot} branch=${dispatch.branch} url=${dispatch.env[runtimeEnvKey('playwright_base_url', 'PW_BASE_URL')]} status=${dispatch.status}`);
    console.log(`  worktree=${dispatch.worktree}`);
    console.log(`  compose=${dispatch.composeCommand}`);
    if (dispatch.task) console.log(`  task=${dispatch.task.subagentType}: ${dispatch.task.description}`);
  }
  if (report.blockers.length) {
    console.log('');
    console.log('BLOCKERS:');
    for (const blocker of report.blockers) console.log(`- ${blocker}`);
  }
  if (report.warnings.length) {
    console.log('');
    console.log('WARNINGS:');
    for (const warning of report.warnings) console.log(`- ${warning}`);
  }
  console.log('');
  console.log(`NEXT_STEP: ${report.nextStep}`);
}

try {
  const values = parseArgs(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    process.exit(0);
  }
  const report = buildReport(values);
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else printText(report);
  process.exit(report.exitCode ?? 0);
} catch (error) {
  console.error(error.message);
  console.error('');
  console.error(usage());
  process.exit(2);
}
