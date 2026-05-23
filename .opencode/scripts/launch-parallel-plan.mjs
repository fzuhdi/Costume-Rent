#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const defaultParallel = 3;
const maxParallel = 3;
const slotStep = 100;
const basePorts = { frontend: 5173, backend: 8081, sqlite: 8080 };
const executableTypes = new Set(['feature', 'bug']);
const ticketIdPattern = /^TICKET-\d{8}-\d{3}$/;
const requiredRuntimeFiles = ['.env', 'frontend/package-lock.json', 'test/package-lock.json'];
const optionalRuntimeFiles = ['backend/.env', 'frontend/.env'];
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function usage() {
  return `Usage: node .opencode/scripts/launch-parallel-plan.mjs --target PLAN-* [--parallel 3] [--dry-run] [--json] [--workspace-root <path>] [--no-start-runtime] [--no-launch]

Launches up to three ready executable tickets for a plan in isolated git worktrees and runtime slots. Each ticket gets its own branch, .opencode/state, Compose project, host ports, Playwright base URL, and orchestrator TUI.`;
}

function parseArgs(argv) {
  const values = {
    target: null,
    parallel: defaultParallel,
    dryRun: false,
    json: false,
    workspaceRoot: null,
    startRuntime: true,
    launch: true,
    help: false,
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

    if (token === '--no-launch') {
      values.launch = false;
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

function worktreeExists(worktreePath) {
  return fs.existsSync(path.join(worktreePath, '.git')) || fs.existsSync(worktreePath);
}

function ensureProjectRoot(report) {
  const required = ['.opencode/opencode.json', '.opencode/project.json', 'docs/plans', 'docs/tickets'];
  for (const item of required) {
    if (!fs.existsSync(path.join(root, item))) report.blockers.push(`Missing project root item: ${item}`);
  }
}

function ensurePlanBranch(planBranch, report, values) {
  if (branchExists(planBranch)) {
    report.checks.push({ name: 'plan-branch', status: 'passed', detail: planBranch });
    return true;
  }

  if (values.dryRun) {
    report.checks.push({ name: 'plan-branch', status: 'passed', detail: `dry-run would create ${planBranch} from current HEAD` });
    return true;
  }

  const result = runCapture('git', ['branch', planBranch]);
  if (!result.ok) {
    report.blockers.push(`Failed to create plan branch ${planBranch}: ${result.stderr || result.error}`);
    report.checks.push({ name: 'plan-branch', status: 'failed', detail: planBranch });
    return false;
  }

  report.checks.push({ name: 'plan-branch', status: 'passed', detail: `created ${planBranch}` });
  return true;
}

function portsForSlot(slot) {
  return {
    frontend: basePorts.frontend + slotStep * slot,
    backend: basePorts.backend + slotStep * slot,
    sqlite: basePorts.sqlite + slotStep * slot,
  };
}

function envForSlot(slot, project) {
  const ports = portsForSlot(slot);
  return {
    BUSANA_CONTAINER_PREFIX: project,
    FRONTEND_HOST_PORT: String(ports.frontend),
    BACKEND_HOST_PORT: String(ports.backend),
    SQLITE_WEB_HOST_PORT: String(ports.sqlite),
    BUSANA_DB_VOLUME: `busana_db_${project}`,
    BUSANA_FRONTEND_NODE_MODULES_VOLUME: `busana_frontend_node_modules_${project}`,
    VITE_DEV_PORT: '5173',
    PW_BASE_URL: `http://localhost:${ports.frontend}`,
    PW_OUTPUT_DIR: `test-results-${project}`,
    PW_JSON_OUTPUT: `test-results-${project}/results.json`,
    PW_HTML_REPORT: `playwright-report-${project}`,
  };
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

  const composePath = path.join(dispatch.worktree, 'docker-compose.dev.yml');
  if (fs.existsSync(composePath) && fs.readFileSync(composePath, 'utf8').includes('env_file: .env.production')) {
    const source = path.join(root, '.env');
    const target = path.join(dispatch.worktree, '.env.production');
    if (fs.existsSync(source)) {
      if (!values.dryRun) fs.copyFileSync(source, target);
      copied.push('.env.production (compat alias from .env)');
    }
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
    report.blockers.push(`test/package-lock.json differs for ${dispatch.ticketId}; install/update dependencies once in a controlled workspace before launch.`);
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
  const result = runCapture(npxCommand, ['--no-install', 'playwright', 'install', '--dry-run', 'chromium'], { cwd: path.join(dispatch.worktree, 'test'), env });
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
  const ok = runInherit('docker', ['compose', '-p', dispatch.project, '-f', 'docker-compose.dev.yml', 'up', '-d', 'backend', 'frontend'], { cwd: dispatch.worktree, env });
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

function launchTicket(dispatch, report, values) {
  const launcher = path.join(dispatch.worktree, '.opencode', 'scripts', 'launch-orchestrator-tui.mjs');
  dispatch.launchCommand = `node .opencode/scripts/launch-orchestrator-tui.mjs --target ${dispatch.ticketId}`;

  if (!values.launch) {
    dispatch.launchAction = 'skipped';
    report.checks.push({ name: 'orchestrator-launch', status: 'passed', detail: `${dispatch.ticketId}: skipped` });
    return true;
  }

  if (values.dryRun) {
    dispatch.launchAction = 'dry-run-launch';
    report.checks.push({ name: 'orchestrator-launch', status: 'passed', detail: `${dispatch.ticketId}: dry-run` });
    return true;
  }

  const env = { ...process.env, ...dispatch.env };
  const result = runCapture(process.execPath, [launcher, '--repo-root', dispatch.worktree, '--target', dispatch.ticketId], { cwd: dispatch.worktree, env });
  if (!result.ok) {
    report.blockers.push(`Failed to launch orchestrator for ${dispatch.ticketId}: ${result.stderr || result.error || result.stdout}`);
    dispatch.status = 'blocked';
    report.checks.push({ name: 'orchestrator-launch', status: 'failed', detail: dispatch.ticketId });
    return false;
  }

  dispatch.launchAction = 'launched';
  dispatch.launchOutput = result.stdout.trim();
  report.checks.push({ name: 'orchestrator-launch', status: 'passed', detail: dispatch.ticketId });
  return true;
}

function makeDispatch(planId, planBranch, ticket, index, workspaceRoot) {
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
    composeCommand: `docker compose -p ${project} -f docker-compose.dev.yml up -d backend frontend`,
    launchCommand: null,
    status: 'planned',
  };
}

function buildReport(values) {
  const report = {
    runner: 'parallel-plan-launcher',
    mode: values.dryRun ? 'parallel-plan-dry-run' : 'parallel-plan-launch',
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
    dispatches: [],
    nextStep: null,
  };

  ensureProjectRoot(report);

  if (!values.target || !/^PLAN-\d{8}-[A-Za-z0-9-]+$/.test(values.target)) {
    report.blockers.push('Parallel launcher requires --target PLAN-YYYYMMDD-name.');
  }

  if (!Number.isInteger(values.parallel) || values.parallel < 1 || values.parallel > maxParallel) {
    report.blockers.push(`--parallel must be an integer between 1 and ${maxParallel}.`);
  }

  const clean = gitClean(root);
  if (!clean.ok) report.blockers.push(clean.error);
  else if (clean.dirty.length && !values.dryRun) report.blockers.push(`Coordinator checkout must be clean before parallel launch: ${clean.dirty.join(', ')}`);
  else if (clean.dirty.length) report.warnings.push(`Coordinator checkout is dirty (${clean.dirty.length} path(s)); dry-run only.`);
  report.checks.push({ name: 'coordinator-worktree', status: clean.ok && !clean.dirty.length ? 'passed' : values.dryRun ? 'warning' : 'blocked', detail: clean.ok ? `${clean.dirty.length} dirty path(s)` : clean.error });

  if (report.blockers.length) return finishReport(report);

  const plan = readPlan(values.target);
  const tickets = readPlanTickets(values.target);
  const ticketsById = new Map(tickets.map(ticket => [ticket.id, ticket]));
  const reviewTickets = tickets.filter(ticket => ticket.frontmatter.status === 'review');
  const readyTickets = tickets.filter(ticket => ticket.frontmatter.status === 'ready' && executableTypes.has(ticket.frontmatter.type));
  const dependencyBlockedTickets = [];
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
  };
  report.dependencyBlockedTickets = dependencyBlockedTickets;

  if (reviewTickets.length) {
    report.blockers.push(`Plan has review tickets that must be audited before parallel executable launch: ${reviewTickets.map(ticket => ticket.id).join(', ')}`);
  }

  if (!readyTickets.length) {
    report.blockers.push(`Plan ${values.target} has no ready executable tickets to launch.`);
  } else if (!independentReadyTickets.length && dependencyBlockedTickets.length) {
    const details = dependencyBlockedTickets
      .map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`)
      .join('; ');
    report.blockers.push(`Plan ${values.target} has no independent ready executable tickets. Dependency blockers: ${details}`);
  } else if (dependencyBlockedTickets.length) {
    report.warnings.push(`Excluded dependency-blocked ready ticket(s): ${dependencyBlockedTickets.map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`).join('; ')}`);
  }

  const planBranch = `tdd/${values.target}`;
  const workspaceRoot = path.resolve(values.workspaceRoot || path.join(root, '..', `${path.basename(root)}-workspaces`, values.target));
  report.workspaceRoot = workspaceRoot;
  report.selectedTickets = independentReadyTickets.slice(0, values.parallel).map(ticket => ticket.id);
  report.skippedReadyTickets = independentReadyTickets.slice(values.parallel).map(ticket => ticket.id);
  report.dispatches = independentReadyTickets.slice(0, values.parallel).map((ticket, index) => makeDispatch(values.target, planBranch, ticket, index, workspaceRoot));

  if (report.blockers.length) return finishReport(report);

  if (!ensurePlanBranch(planBranch, report, values)) return finishReport(report);

  for (const dispatch of report.dispatches) {
    if (!ensureWorktree(dispatch, report, values)) continue;
    if (!copyRuntimeFiles(dispatch, report, values)) continue;
    if (!ensureTestDependencyLink(dispatch, report, values)) continue;
    if (!ensurePlaywrightBrowsers(dispatch, report, values)) continue;
    if (!bootstrapState(dispatch, report, values)) continue;
    if (!acquireSlot(dispatch, report, values)) continue;
    if (!startRuntime(dispatch, report, values)) continue;
    if (!launchTicket(dispatch, report, values)) continue;
    dispatch.status = values.dryRun ? 'ready-dry-run' : 'launched';
  }

  return finishReport(report);
}

function finishReport(report) {
  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Resolve blockers before launching parallel tracer tickets.';
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
    ? `Dry run only. Re-run without --dry-run to launch ${report.dispatches.length} isolated ticket workflow(s).`
    : `Launched ${report.dispatches.length} isolated ticket workflow(s). Monitor each orchestrator TUI and merge completed ticket branches back into the plan branch sequentially.`;
  return report;
}

function printText(report) {
  console.log(`Parallel Plan Launcher: ${report.outcome}`);
  console.log(`TARGET: ${report.target}`);
  console.log(`PARALLEL_LIMIT: ${report.parallelLimit}`);
  console.log(`WORKSPACE_ROOT: ${report.workspaceRoot || 'none'}`);
  if (report.plan) console.log(`READY_TICKETS: ${report.plan.readyExecutableTickets.join(', ') || 'none'}`);
  if (report.plan) console.log(`INDEPENDENT_READY_TICKETS: ${report.plan.independentReadyTickets.join(', ') || 'none'}`);
  if (report.dependencyBlockedTickets.length) {
    console.log(`DEPENDENCY_BLOCKED_TICKETS: ${report.dependencyBlockedTickets.map(item => `${item.ticketId} waits for ${item.unmet.join(', ')}`).join('; ')}`);
  }
  console.log('');
  console.log('DISPATCHES:');
  for (const dispatch of report.dispatches) {
    console.log(`- ${dispatch.ticketId}: slot=${dispatch.slot} branch=${dispatch.branch} url=${dispatch.env.PW_BASE_URL} status=${dispatch.status}`);
    console.log(`  worktree=${dispatch.worktree}`);
    console.log(`  compose=${dispatch.composeCommand}`);
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
