#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

const STATE_VALUES = new Set([
  'idle',
  'selecting-ticket',
  'ticket-audit',
  'red-writing',
  'red-validating',
  'red-arbitrating',
  'already-green-audit',
  'green-building',
  'green-testing',
  'refactoring',
  'final-review',
  'ticket-complete',
  'regression-gating',
  'plan-complete',
  'blocked',
  'escalated',
]);

const TICKET_STATUSES = new Set(['draft', 'review', 'ready', 'in_progress', 'blocked', 'complete']);
const PLAN_STATUSES = new Set(['draft', 'ready', 'in_progress', 'blocked', 'complete']);
const EXECUTABLE_TYPES = new Set(['feature', 'bug']);
const SETUP_FAILURE_PATTERNS = [
  /no tests found/i,
  /cannot find module/i,
  /executable doesn't exist/i,
  /please install/i,
  /playwright.*install/i,
  /browser.*not found/i,
  /enoent/i,
];

function usage() {
  return `Usage: node .opencode/scripts/workflow-runner.mjs [--target PLAN-*|TICKET-*] [--dry-run] [--json]
       node .opencode/scripts/workflow-runner.mjs --target TICKET-* --run-ticket [--dry-run] [--json] [--output-file <path>] [--after-red-checkpoint-sha <sha>]
       node .opencode/scripts/workflow-runner.mjs --target PLAN-* --run-plan [--dry-run] [--json] [--output-file <path>]
       node .opencode/scripts/workflow-runner.mjs --target TICKET-* --run-green [--dry-run] [--json] [--recorded-test-file <path>] [--recorded-test-title <title>]
       node .opencode/scripts/workflow-runner.mjs --target TICKET-* --validate-worker-output <sdet-red|developer-green|developer-refactor|reviewer> --output-file <path> [--json]
       node .opencode/scripts/workflow-runner.mjs --reconcile [--target PLAN-*|TICKET-*] [--json]
       node .opencode/scripts/workflow-runner.mjs --target PLAN-*|TICKET-* --next-task [--json]
       node .opencode/scripts/workflow-runner.mjs --target PLAN-*|TICKET-* --ingest-worker-output <path> [--json]

Default mode is read-only preflight. --reconcile compares durable workflow state ledgers and reports drift. --next-task emits the next worker task payload without invoking subagents. --ingest-worker-output is a clearer runner-owned alias for advancing the selected ticket/plan from a captured worker output file. --run-ticket advances one happy-path ticket phase deterministically using captured worker output, git checkpoints/commits, quality gates, and runtime state. --run-plan sequences review/ready tickets for one plan and runs impacted-spec regression before completion. --run-green performs the deterministic official GREEN rerun for the recorded RED test; it invokes no subagents, edits no files, and never commits, pushes, or creates PRs. --validate-worker-output parses one worker final message from a file and validates required fields, enums, and ticket/test-case alignment.`;
}

function parseArgs(argv) {
  const values = {
    dryRun: false,
    json: false,
    target: null,
    help: false,
    runTicket: false,
    runPlan: false,
    runGreen: false,
    reconcile: false,
    nextTask: false,
    recordedTestFile: null,
    recordedTestTitle: null,
    validateWorkerOutput: null,
    outputFile: null,
    ingestWorkerOutput: null,
    afterRedCheckpointSha: null,
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

    if (token === '--run-green') {
      values.runGreen = true;
      continue;
    }

    if (token === '--reconcile') {
      values.reconcile = true;
      continue;
    }

    if (token === '--next-task') {
      values.nextTask = true;
      continue;
    }

    if (token === '--run-ticket') {
      values.runTicket = true;
      continue;
    }

    if (token === '--run-plan') {
      values.runPlan = true;
      continue;
    }

    if (token === '--validate-worker-output') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --validate-worker-output');
      values.validateWorkerOutput = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--validate-worker-output=')) {
      values.validateWorkerOutput = token.slice('--validate-worker-output='.length);
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

    if (token === '--recorded-test-file') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --recorded-test-file');
      values.recordedTestFile = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--recorded-test-file=')) {
      values.recordedTestFile = token.slice('--recorded-test-file='.length);
      continue;
    }

    if (token === '--recorded-test-title') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --recorded-test-title');
      values.recordedTestTitle = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--recorded-test-title=')) {
      values.recordedTestTitle = token.slice('--recorded-test-title='.length);
      continue;
    }

    if (token === '--output-file') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --output-file');
      values.outputFile = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--output-file=')) {
      values.outputFile = token.slice('--output-file='.length);
      continue;
    }

    if (token === '--ingest-worker-output') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --ingest-worker-output');
      values.ingestWorkerOutput = next;
      values.outputFile = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--ingest-worker-output=')) {
      values.ingestWorkerOutput = token.slice('--ingest-worker-output='.length);
      values.outputFile = values.ingestWorkerOutput;
      continue;
    }

    if (token === '--after-red-checkpoint-sha') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) throw new Error('Missing value for --after-red-checkpoint-sha');
      values.afterRedCheckpointSha = next;
      index += 1;
      continue;
    }

    if (token.startsWith('--after-red-checkpoint-sha=')) {
      values.afterRedCheckpointSha = token.slice('--after-red-checkpoint-sha='.length);
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

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  if (!exists(filePath)) {
    return { ok: false, value: null, error: `${rel(filePath)} is missing` };
  }

  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, 'utf8')), error: null };
  } catch (error) {
    return { ok: false, value: null, error: `${rel(filePath)} is invalid JSON: ${error.message}` };
  }
}

function readText(filePath) {
  if (!exists(filePath)) {
    return { ok: false, value: null, error: `${rel(filePath)} is missing` };
  }

  try {
    return { ok: true, value: fs.readFileSync(filePath, 'utf8'), error: null };
  } catch (error) {
    return { ok: false, value: null, error: `${rel(filePath)} could not be read: ${error.message}` };
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/);
  return quoted ? quoted[2] : trimmed;
}

function parseFrontmatter(filePath) {
  const text = readText(filePath);
  if (!text.ok) return { ok: false, data: null, error: text.error };

  const match = text.value.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { ok: false, data: null, error: `${rel(filePath)} has no frontmatter` };

  const data = {};
  const errors = [];
  const lines = match[1].split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const item = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!item) {
      errors.push(`Unsupported frontmatter line in ${rel(filePath)}: ${trimmed}`);
      continue;
    }

    data[item[1]] = parseScalar(item[2]);
  }

  if (errors.length) return { ok: false, data, error: errors.join('; ') };
  return { ok: true, data, error: null };
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  if (result.error) {
    return {
      ok: false,
      status: result.status,
      stdout: result.stdout || '',
      stderr: result.stderr || result.error.message,
    };
  }

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function addCheck(report, name, status, detail = '') {
  report.checks.push({ name, status, detail });
}

function shouldWriteRunTelemetry(values) {
  return Boolean(!values.dryRun && (values.runTicket || values.runPlan || values.ingestWorkerOutput));
}

function writeRunTelemetry(report, values, startedAt) {
  const endedAt = new Date().toISOString();
  const runId = `${startedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}-${process.pid}`;
  const record = {
    schemaVersion: 1,
    runId,
    startedAt,
    endedAt,
    mode: report.mode,
    target: report.target,
    targetType: report.targetType,
    runtimePhase: report.runtime?.status || null,
    outcome: report.outcome,
    exitCode: Number.isInteger(report.exitCode) ? report.exitCode : (report.blockers.length ? 1 : 0),
    blockerCount: report.blockers.length,
    warningCount: report.warnings.length,
    nextTaskRole: report.nextTask?.role || null,
    nextTaskMode: report.nextTask?.mode || null,
    workerOutputKind: report.workerOutput?.kind || null,
    greenRerunStatus: report.greenRerun?.testCaseStatus || null,
    reconciliationStatus: report.reconciliation?.status || null,
  };

  report.telemetry = { runId, written: false, path: null };
  if (!shouldWriteRunTelemetry(values)) return;

  const logDir = path.join(root, '.opencode', 'logs', 'workflow-runs');
  const logPath = path.join(logDir, `${endedAt.slice(0, 10)}.jsonl`);
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8');
    report.telemetry = { runId, written: true, path: rel(logPath) };
  } catch (error) {
    report.warnings.push(`Failed to append workflow run telemetry: ${error.message}`);
  }
}

function checkProjectRoot(report) {
  const projectPath = path.join(root, '.opencode', 'project.json');
  const configPath = path.join(root, '.opencode', 'opencode.json');

  if (!exists(projectPath) || !exists(configPath)) {
    const missing = [projectPath, configPath].filter(filePath => !exists(filePath)).map(rel).join(', ');
    report.blockers.push(`OpenCode project root check failed; missing ${missing}`);
    addCheck(report, 'project-root', 'failed', `missing ${missing}`);
    return;
  }

  addCheck(report, 'project-root', 'passed', rel(root));
}

function checkProjectConfig(report) {
  const projectPath = path.join(root, '.opencode', 'project.json');
  const parsed = readJson(projectPath);

  if (!parsed.ok) {
    report.blockers.push(parsed.error);
    addCheck(report, 'project-config', 'failed', parsed.error);
    return null;
  }

  const testRoots = parsed.value?.test_roots;
  if (!Array.isArray(testRoots) || testRoots.length === 0) {
    report.blockers.push('.opencode/project.json must declare at least one test_roots entry');
    addCheck(report, 'project-config', 'failed', 'missing test_roots');
    return parsed.value;
  }

  addCheck(report, 'project-config', 'passed', `${testRoots.length} test root(s)`);
  return parsed.value;
}

function checkWorktree(report, targetProvided, allowDirtyForGreenRerun, allowDirtyForDeferredTarget) {
  const result = runCapture('git', ['status', '--short', '--branch']);

  if (!result.ok) {
    report.blockers.push(`git status failed: ${(result.stderr || result.stdout).trim()}`);
    addCheck(report, 'worktree', 'failed', 'git status failed');
    return;
  }

  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  const branch = lines[0] || 'unknown';
  const dirty = lines.slice(1);
  report.git = { branch, dirtyCount: dirty.length, dirty };

  if (dirty.length && targetProvided && !allowDirtyForGreenRerun && !allowDirtyForDeferredTarget) {
    report.blockers.push(`Worktree is dirty (${dirty.length} changed path(s)); executable workflow must start from a clean worktree.`);
    addCheck(report, 'worktree', 'blocked', `${dirty.length} changed path(s)`);
    return;
  }

  if (dirty.length && allowDirtyForDeferredTarget) {
    report.warnings.push(`Worktree is dirty (${dirty.length} changed path(s)); target mode will apply phase-specific worktree checks before writes.`);
    addCheck(report, 'worktree', 'warning', `${dirty.length} changed path(s); deferred target worktree check`);
    return;
  }

  if (dirty.length && allowDirtyForGreenRerun) {
    report.warnings.push(`Worktree is dirty (${dirty.length} changed path(s)); GREEN rerun allows dirty implementation changes but still edits no files.`);
    addCheck(report, 'worktree', 'warning', `${dirty.length} changed path(s); GREEN rerun mode`);
    return;
  }

  if (dirty.length) {
    report.warnings.push(`Worktree is dirty (${dirty.length} changed path(s)); status reporting is read-only, but execution would block.`);
    addCheck(report, 'worktree', 'warning', `${dirty.length} changed path(s)`);
    return;
  }

  addCheck(report, 'worktree', 'passed', 'clean');
}

function checkManifest(report, targetProvided) {
  const manifestPath = path.join(root, '.opencode', 'state', 'test-case-manifest.json');
  const manifest = readJson(manifestPath);

  if (!manifest.ok) {
    report.blockers.push(manifest.error);
    addCheck(report, 'manifest-load', 'failed', manifest.error);
    return null;
  }

  report.manifest = {
    generatedAt: manifest.value?._meta?.generatedAt || null,
    caseCount: Object.keys(manifest.value?.test_cases || {}).length,
  };
  addCheck(report, 'manifest-load', 'passed', `${report.manifest.caseCount} test case(s)`);

  const scriptPath = path.join(root, '.opencode', 'scripts', 'build-test-case-manifest.mjs');
  const result = runCapture(process.execPath, [scriptPath, '--check']);

  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim() || 'manifest check failed';
    if (targetProvided) report.blockers.push(`Test-case manifest is stale or invalid: ${detail}`);
    else report.warnings.push(`Test-case manifest is stale or invalid: ${detail}`);
    addCheck(report, 'manifest-check', targetProvided ? 'blocked' : 'warning', detail);
  } else {
    addCheck(report, 'manifest-check', 'passed', result.stdout.trim() || 'fresh');
  }

  return manifest.value;
}

function validateStateSchema(name, filePath, expectedSchema, report) {
  const parsed = readJson(filePath);

  if (!parsed.ok) {
    report.blockers.push(parsed.error);
    addCheck(report, `${name}-state`, 'failed', parsed.error);
    return null;
  }

  if (parsed.value?.schemaVersion !== expectedSchema) {
    const detail = `${rel(filePath)} schemaVersion must be ${expectedSchema}; found ${parsed.value?.schemaVersion ?? 'missing'}`;
    report.blockers.push(detail);
    addCheck(report, `${name}-state`, 'failed', detail);
    return parsed.value;
  }

  addCheck(report, `${name}-state`, 'passed', `schemaVersion ${expectedSchema}`);
  return parsed.value;
}

function checkRuntimeState(report) {
  const orchestrator = validateStateSchema(
    'orchestrator',
    path.join(root, '.opencode', 'state', 'orchestrator-progress.json'),
    2,
    report,
  );
  const ticket = validateStateSchema(
    'ticket-progress',
    path.join(root, '.opencode', 'state', 'ticket-progress.json'),
    2,
    report,
  );
  const checkpoints = validateStateSchema(
    'checkpoints',
    path.join(root, '.opencode', 'state', 'checkpoints.json'),
    2,
    report,
  );

  if (orchestrator && !STATE_VALUES.has(orchestrator.status)) {
    report.blockers.push(`orchestrator-progress status is not a known FSM state: ${orchestrator.status}`);
    addCheck(report, 'runtime-status', 'failed', String(orchestrator.status));
  } else if (orchestrator) {
    addCheck(report, 'runtime-status', 'passed', orchestrator.status);
  }

  if (checkpoints && !Array.isArray(checkpoints.checkpoints)) {
    report.blockers.push('checkpoints state must contain a checkpoints array');
    addCheck(report, 'checkpoint-ledger', 'failed', 'missing checkpoints array');
  } else if (checkpoints) {
    addCheck(report, 'checkpoint-ledger', 'passed', `${checkpoints.checkpoints.length} checkpoint(s)`);
  }

  if (orchestrator && ticket) {
    const fields = ['currentPlan', 'currentTicket', 'currentFeature', 'currentTestCase', 'branch', 'baseBranch', 'status'];
    const drift = fields.filter(field => (orchestrator[field] ?? null) !== (ticket[field] ?? null));

    if (drift.length) {
      report.blockers.push(`Runtime state drift between orchestrator-progress and ticket-progress: ${drift.join(', ')}`);
      addCheck(report, 'runtime-consistency', 'failed', drift.join(', '));
    } else {
      addCheck(report, 'runtime-consistency', 'passed', 'active-run fields agree');
    }
  }

  report.runtime = orchestrator ? {
    currentPlan: orchestrator.currentPlan ?? null,
    currentTicket: orchestrator.currentTicket ?? null,
    currentFeature: orchestrator.currentFeature ?? null,
    currentTestCase: orchestrator.currentTestCase ?? null,
    status: orchestrator.status ?? null,
    iteration: orchestrator.iteration ?? null,
    maxIterations: orchestrator.maxIterations ?? null,
    branch: orchestrator.branch ?? null,
    baseBranch: orchestrator.baseBranch ?? null,
    lastCheckpointSha: orchestrator.lastCheckpointSha ?? null,
  } : null;

  return { orchestrator, ticket, checkpoints };
}

function markdownFiles(dir) {
  const fullDir = path.join(root, ...dir.split('/'));
  if (!exists(fullDir)) return [];
  return fs.readdirSync(fullDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(fullDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function loadFrontmatterCollection(dir, report, label) {
  const items = new Map();
  for (const filePath of markdownFiles(dir)) {
    const id = path.basename(filePath, '.md');
    const parsed = parseFrontmatter(filePath);
    if (!parsed.ok) {
      report.warnings.push(`${label} ${rel(filePath)} skipped during reconciliation: ${parsed.error}`);
      continue;
    }
    items.set(id, { id, file: rel(filePath), frontmatter: parsed.data });
  }
  return items;
}

function countStatuses(items, statuses) {
  const counts = Object.fromEntries([...statuses].map(status => [status, 0]));
  for (const item of items) {
    const status = item.frontmatter.status;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  }
  return counts;
}

function extractPlanTicketRows(planFile) {
  const text = readText(path.join(root, ...planFile.split('/')));
  if (!text.ok) return [];
  return [...text.value.matchAll(/^\s*-\s+(TICKET-\d{8}-\d{3})\s+-\s+([a-z_]+)\s+-\s+([a-z_]+)\s+-\s+(.+)$/gm)]
    .map(match => ({ ticketId: match[1], status: match[2], type: match[3], title: match[4].trim() }));
}

function extractPlanStatusSummary(planFile) {
  const text = readText(path.join(root, ...planFile.split('/')));
  if (!text.ok) return {};
  const summary = {};
  for (const match of text.value.matchAll(/^\s*-\s+(draft|review|ready|in_progress|blocked|complete):\s+(\d+)\s*$/gm)) {
    summary[match[1]] = Number(match[2]);
  }
  return summary;
}

function loadLeaseRegistryForReconcile(report) {
  const leasePath = path.join(root, '.opencode', 'state', 'ticket-leases.json');
  if (!exists(leasePath)) return { schemaVersion: 1, leases: {} };
  const parsed = readJson(leasePath);
  if (!parsed.ok) {
    report.warnings.push(`Ticket lease registry skipped during reconciliation: ${parsed.error}`);
    return { schemaVersion: 1, leases: {} };
  }
  if (parsed.value?.schemaVersion !== 1 || typeof parsed.value?.leases !== 'object' || parsed.value.leases === null) {
    report.warnings.push('Ticket lease registry skipped during reconciliation: invalid schema');
    return { schemaVersion: 1, leases: {} };
  }
  return parsed.value;
}

function normalizedLeaseStatus(lease) {
  if (!lease || !lease.deadlineAt || !['running', 'deadline_expired'].includes(lease.status)) return lease?.status || null;
  return Date.parse(lease.deadlineAt) <= Date.now() ? 'deadline_expired' : lease.status;
}

function addReconciliationItem(reconciliation, severity, code, message, targets = []) {
  reconciliation.items.push({ severity, code, message, targets });
}

function reconcilePlanDocuments(reconciliation, plans, tickets) {
  for (const plan of plans.values()) {
    const planTickets = [...tickets.values()].filter(ticket => ticket.frontmatter.plan_id === plan.id);
    const ticketsById = new Map(planTickets.map(ticket => [ticket.id, ticket]));
    const rows = extractPlanTicketRows(plan.file);
    const rowsById = new Map(rows.map(row => [row.ticketId, row]));

    for (const row of rows) {
      const ticket = ticketsById.get(row.ticketId);
      if (!ticket) {
        addReconciliationItem(reconciliation, 'blocker', 'plan-ticket-missing', `${plan.file} lists ${row.ticketId}, but no ticket frontmatter in this plan was found.`, [plan.id, row.ticketId]);
        continue;
      }
      if (ticket.frontmatter.status !== row.status) {
        addReconciliationItem(reconciliation, 'blocker', 'plan-ticket-status-drift', `${plan.file} lists ${row.ticketId} as ${row.status}, but ${ticket.file} frontmatter is ${ticket.frontmatter.status}.`, [plan.id, row.ticketId]);
      }
      if (ticket.frontmatter.type !== row.type) {
        addReconciliationItem(reconciliation, 'blocker', 'plan-ticket-type-drift', `${plan.file} lists ${row.ticketId} as type ${row.type}, but ${ticket.file} frontmatter is ${ticket.frontmatter.type}.`, [plan.id, row.ticketId]);
      }
    }

    for (const ticket of planTickets) {
      if (!rowsById.has(ticket.id)) {
        addReconciliationItem(reconciliation, 'warning', 'plan-ticket-row-missing', `${ticket.file} belongs to ${plan.id}, but ${plan.file} does not list it in the Tickets section.`, [plan.id, ticket.id]);
      }
    }

    const expectedCounts = countStatuses(planTickets, TICKET_STATUSES);
    const summaryCounts = extractPlanStatusSummary(plan.file);
    for (const status of TICKET_STATUSES) {
      if (summaryCounts[status] === undefined) continue;
      if (summaryCounts[status] !== expectedCounts[status]) {
        addReconciliationItem(reconciliation, 'blocker', 'plan-summary-count-drift', `${plan.file} summary says ${status}: ${summaryCounts[status]}, but ticket frontmatter count is ${expectedCounts[status]}.`, [plan.id]);
      }
    }
  }
}

function reconcileTicketProgress(reconciliation, ticketProgress, tickets) {
  const tracked = ticketProgress?.tickets || {};
  for (const [ticketId, trackedValue] of Object.entries(tracked)) {
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      addReconciliationItem(reconciliation, 'warning', 'ticket-progress-missing-ticket', `.opencode/state/ticket-progress.json tracks ${ticketId}, but docs/tickets has no matching file.`, [ticketId]);
      continue;
    }
    const trackedStatus = trackedValue?.status;
    if (trackedStatus && trackedStatus !== ticket.frontmatter.status) {
      addReconciliationItem(reconciliation, 'blocker', 'ticket-progress-status-drift', `.opencode/state/ticket-progress.json tracks ${ticketId} as ${trackedStatus}, but ${ticket.file} frontmatter is ${ticket.frontmatter.status}.`, [ticketId, ticket.frontmatter.plan_id]);
    }
  }
}

function reconcileActiveRuntime(reconciliation, orchestrator, tickets) {
  if (!orchestrator?.currentTicket) return;
  const activeTicket = tickets.get(orchestrator.currentTicket);
  if (!activeTicket) {
    addReconciliationItem(reconciliation, 'blocker', 'active-ticket-missing', `Runtime currentTicket ${orchestrator.currentTicket} has no docs/tickets file.`, [orchestrator.currentTicket, orchestrator.currentPlan]);
    return;
  }
  const activeDone = ['ticket-complete', 'plan-complete', 'idle'].includes(orchestrator.status);
  if (activeTicket.frontmatter.status === 'complete' && !activeDone) {
    addReconciliationItem(reconciliation, 'blocker', 'active-ticket-complete-drift', `Runtime is in ${orchestrator.status} for ${orchestrator.currentTicket}, but ${activeTicket.file} is already complete.`, [orchestrator.currentTicket, orchestrator.currentPlan]);
  }
}

function reconcileCheckpoints(reconciliation, orchestrator, checkpoints) {
  const recorded = new Set(checkpoints?.checkpoints || []);
  const expected = [
    ['red.preRedCheckpointSha', orchestrator?.red?.preRedCheckpointSha],
    ['red.afterRedCheckpointSha', orchestrator?.red?.afterRedCheckpointSha],
  ].filter(([, sha]) => sha);
  for (const [field, sha] of expected) {
    if (!recorded.has(sha)) {
      addReconciliationItem(reconciliation, 'blocker', 'checkpoint-ledger-drift', `Runtime ${field} ${sha} is absent from .opencode/state/checkpoints.json.`, [orchestrator?.currentTicket, orchestrator?.currentPlan].filter(Boolean));
    }
  }
}

function reconcileLeases(reconciliation, leases, tickets, orchestrator) {
  for (const [ticketId, lease] of Object.entries(leases.leases || {})) {
    const status = normalizedLeaseStatus(lease);
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      addReconciliationItem(reconciliation, 'warning', 'lease-ticket-missing', `Ticket lease registry tracks ${ticketId}, but docs/tickets has no matching file.`, [ticketId, lease.planId].filter(Boolean));
      continue;
    }
    if (status === 'deadline_expired') {
      addReconciliationItem(reconciliation, 'blocker', 'lease-expired', `Ticket lease for ${ticketId} is deadline_expired; run ticket-lease refresh/inspect before scheduling it again.`, [ticketId, lease.planId].filter(Boolean));
    }
    if (['running', 'deadline_expired', 'interrupted'].includes(status) && ticket.frontmatter.status === 'complete') {
      addReconciliationItem(reconciliation, 'blocker', 'lease-complete-ticket-drift', `Ticket lease for ${ticketId} is ${status}, but ${ticket.file} is complete.`, [ticketId, lease.planId].filter(Boolean));
    }
    if (status === 'running' && orchestrator?.currentTicket && orchestrator.currentTicket !== ticketId && ticket.frontmatter.status !== 'complete') {
      addReconciliationItem(reconciliation, 'warning', 'lease-not-active-runtime', `Ticket lease for ${ticketId} is running, while runtime currentTicket is ${orchestrator.currentTicket}.`, [ticketId, lease.planId].filter(Boolean));
    }
  }
}

function runReconciliation(report, state, values, strict = false) {
  const reconciliation = {
    status: 'passed',
    strict,
    target: values.target || null,
    items: [],
    blockerCount: 0,
    blockingItemCount: 0,
    warningCount: 0,
  };

  const plans = loadFrontmatterCollection('docs/plans', report, 'plan');
  const tickets = loadFrontmatterCollection('docs/tickets', report, 'ticket');
  const leases = loadLeaseRegistryForReconcile(report);

  reconcilePlanDocuments(reconciliation, plans, tickets);
  reconcileTicketProgress(reconciliation, state.ticket, tickets);
  reconcileActiveRuntime(reconciliation, state.orchestrator, tickets);
  reconcileCheckpoints(reconciliation, state.orchestrator, state.checkpoints);
  reconcileLeases(reconciliation, leases, tickets, state.orchestrator);

  reconciliation.blockerCount = reconciliation.items.filter(item => item.severity === 'blocker').length;
  reconciliation.warningCount = reconciliation.items.filter(item => item.severity === 'warning').length;
  const blockingItems = reconciliation.items
    .filter(item => item.severity === 'blocker')
    .filter(item => !values.target || item.targets.length === 0 || item.targets.includes(values.target));
  reconciliation.blockingItemCount = blockingItems.length;
  reconciliation.status = reconciliation.blockerCount ? 'blocked' : reconciliation.warningCount ? 'warning' : 'passed';
  report.reconciliation = reconciliation;

  if (reconciliation.blockerCount) {
    const strictStatus = strict && blockingItems.length ? 'failed' : 'warning';
    addCheck(report, 'state-reconciliation', strictStatus, `${reconciliation.blockerCount} blocker drift(s), ${reconciliation.warningCount} warning(s), ${blockingItems.length} target-blocking`);
    const messages = (strict ? blockingItems : reconciliation.items.filter(item => item.severity === 'blocker'))
      .map(item => item.message);
    if (strict && blockingItems.length) report.blockers.push(...messages);
    else report.warnings.push(...messages.map(message => `Reconciliation drift: ${message}`));
  } else if (reconciliation.warningCount) {
    addCheck(report, 'state-reconciliation', 'warning', `${reconciliation.warningCount} warning(s)`);
    report.warnings.push(...reconciliation.items.map(item => `Reconciliation warning: ${item.message}`));
  } else {
    addCheck(report, 'state-reconciliation', 'passed', 'no drift detected');
  }

  return reconciliation;
}

function targetType(target) {
  if (/^TICKET-\d{8}-\d{3}$/.test(target)) return 'ticket';
  if (/^PLAN-\d{8}-[A-Za-z0-9-]+$/.test(target)) return 'plan';
  return null;
}

function ticketPath(ticketId) {
  return path.join(root, 'docs', 'tickets', `${ticketId}.md`);
}

function planPath(planId) {
  return path.join(root, 'docs', 'plans', `${planId}.md`);
}

function priorityOf(ticket) {
  return Number.isInteger(ticket.priority) ? ticket.priority : 9999;
}

function compareTickets(left, right) {
  const priority = priorityOf(left.frontmatter) - priorityOf(right.frontmatter);
  if (priority !== 0) return priority;
  return left.id.localeCompare(right.id);
}

function loadTicket(ticketId, report) {
  const filePath = ticketPath(ticketId);
  const parsed = parseFrontmatter(filePath);

  if (!parsed.ok) {
    report.blockers.push(parsed.error);
    addCheck(report, 'ticket-load', 'failed', parsed.error);
    return null;
  }

  const ticket = { id: ticketId, file: rel(filePath), frontmatter: parsed.data };
  addCheck(report, 'ticket-load', 'passed', ticket.file);
  return ticket;
}

function validateTicket(ticket, manifest, report) {
  const fm = ticket.frontmatter;

  if (fm.id !== ticket.id) report.blockers.push(`Ticket frontmatter id ${fm.id ?? 'missing'} does not match ${ticket.id}`);
  if (!fm.plan_id) report.blockers.push(`Ticket ${ticket.id} is missing plan_id`);
  if (!EXECUTABLE_TYPES.has(fm.type)) report.blockers.push(`Ticket ${ticket.id} type ${fm.type ?? 'missing'} is not executable; only feature or bug tickets run.`);
  if (!TICKET_STATUSES.has(fm.status)) report.blockers.push(`Ticket ${ticket.id} has invalid status ${fm.status ?? 'missing'}`);
  if (!fm.test_case_id) report.blockers.push(`Ticket ${ticket.id} is missing test_case_id`);
  if (!fm.red_expectation) report.blockers.push(`Ticket ${ticket.id} is missing red_expectation`);
  if (!fm.green_expectation) report.blockers.push(`Ticket ${ticket.id} is missing green_expectation`);

  const manifestEntry = fm.test_case_id ? manifest?.test_cases?.[fm.test_case_id] : null;
  if (fm.test_case_id && !manifestEntry) report.blockers.push(`Ticket ${ticket.id} test_case_id ${fm.test_case_id} is not in the test-case manifest`);

  if (manifestEntry && manifestEntry.feature_id !== String(fm.test_case_id).split('-')[0]) {
    report.blockers.push(`Manifest feature ${manifestEntry.feature_id} does not match ${fm.test_case_id}`);
  }

  report.targetSummary = {
    type: 'ticket',
    id: ticket.id,
    file: ticket.file,
    planId: fm.plan_id ?? null,
    ticketType: fm.type ?? null,
    status: fm.status ?? null,
    testCaseId: fm.test_case_id ?? null,
    feature: manifestEntry?.feature_id ?? null,
    testType: manifestEntry?.test_type ?? null,
    testCommand: manifestEntry?.test_command ?? null,
  };

  addCheck(report, 'ticket-contract', report.blockers.length ? 'checked' : 'passed', ticket.id);
}

function normalizeSlashes(value) {
  return String(value).replace(/\\/g, '/');
}

function normalizeRepoPath(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ok: false, value: null, error: 'Recorded test file is empty' };

  let candidate = normalizeSlashes(raw);
  if (path.isAbsolute(candidate)) {
    const relative = path.relative(root, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return { ok: false, value: null, error: `Recorded test file is outside the project root: ${raw}` };
    }
    candidate = normalizeSlashes(relative);
  }

  candidate = candidate.replace(/^\.\//, '');
  const normalized = path.posix.normalize(candidate);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    return { ok: false, value: null, error: `Recorded test file must stay inside the project root: ${raw}` };
  }

  return { ok: true, value: normalized, error: null };
}

function configuredTestRoots(projectConfig) {
  return (projectConfig?.test_roots || []).map(normalizeSlashes).map(item => item.replace(/\/$/, ''));
}

function pathIsUnder(repoPath, rootPath) {
  return repoPath === rootPath || repoPath.startsWith(`${rootPath}/`);
}

function dirtyRepoPaths(report) {
  return (report.git?.dirty || [])
    .map((line) => {
      let value = line.length > 3 ? line.slice(3).trim() : line.trim();
      if (value.includes(' -> ')) value = value.split(' -> ').pop().trim();
      return normalizeSlashes(value.replace(/^"|"$/g, ''));
    })
    .filter(Boolean);
}

function normalizedRoots(paths) {
  return (paths || [])
    .map(normalizeSlashes)
    .map(item => item.replace(/\/$/, ''))
    .filter(Boolean);
}

function requireCleanExecutionWorktree(report, phase) {
  const dirty = dirtyRepoPaths(report);
  if (!dirty.length) {
    addCheck(report, 'execution-worktree', 'passed', `${phase}: clean`);
    return true;
  }

  report.blockers.push(`Worktree has dirty paths before ${phase}: ${dirty.join(', ')}`);
  addCheck(report, 'execution-worktree', 'blocked', `${phase}: ${dirty.length} dirty path(s)`);
  return false;
}

function requireDirtyPathsWithin(report, roots, phase) {
  const dirty = dirtyRepoPaths(report);
  const allowedRoots = normalizedRoots(roots);
  const outside = dirty.filter(repoPath => !allowedRoots.some(rootPath => pathIsUnder(repoPath, rootPath)));

  if (outside.length) {
    report.blockers.push(`Worktree has paths outside allowed ${phase} roots: ${outside.join(', ')}`);
    addCheck(report, 'execution-worktree', 'blocked', `${phase}: outside allowed roots`);
    return false;
  }

  addCheck(report, 'execution-worktree', 'passed', dirty.length ? `${phase}: dirty paths limited to ${allowedRoots.join(', ')}` : `${phase}: clean`);
  return true;
}

function blockOnExecutionWorktree(report, nextStep) {
  report.outcome = 'blocked';
  report.exitCode = 1;
  report.nextStep = nextStep;
}

function resolveRecordedTest(values, runtime, target, testCaseId, manifest, report) {
  if (values.recordedTestFile || values.recordedTestTitle) {
    if (!values.recordedTestFile || !values.recordedTestTitle) {
      report.blockers.push('Both --recorded-test-file and --recorded-test-title are required when either is provided.');
      addCheck(report, 'recorded-test', 'failed', 'incomplete CLI recorded test');
      return null;
    }

    return {
      source: 'cli',
      file: values.recordedTestFile,
      title: values.recordedTestTitle,
    };
  }

  if (runtime?.currentTicket === target && runtime?.red?.testFile && runtime?.red?.testTitle) {
    return {
      source: 'runtime-state',
      file: runtime.red.testFile,
      title: runtime.red.testTitle,
    };
  }

  const manifestTests = manifest?.test_cases?.[testCaseId]?.tests || [];
  if (manifestTests.length === 1 && manifestTests[0]?.spec_file && manifestTests[0]?.title) {
    return {
      source: 'manifest-single-test',
      file: manifestTests[0].spec_file,
      title: manifestTests[0].title,
    };
  }

  report.blockers.push('No recorded RED test file/title found. Provide --recorded-test-file and --recorded-test-title, or record red.testFile/red.testTitle in runtime state.');
  addCheck(report, 'recorded-test', 'failed', 'missing recorded test file/title');
  return null;
}

function validateRecordedTest(recorded, testCaseId, projectConfig, report) {
  const normalized = normalizeRepoPath(recorded.file);
  if (!normalized.ok) {
    report.blockers.push(normalized.error);
    addCheck(report, 'recorded-test-file', 'failed', normalized.error);
    return null;
  }

  const repoPath = normalized.value;
  const testRoots = configuredTestRoots(projectConfig);
  const owningRoot = testRoots.find(testRoot => pathIsUnder(repoPath, testRoot));
  if (!owningRoot) {
    report.blockers.push(`Recorded test file ${repoPath} is outside adapter-declared test roots: ${testRoots.join(', ')}`);
    addCheck(report, 'recorded-test-file', 'failed', 'outside test_roots');
    return null;
  }

  const fullPath = path.join(root, ...repoPath.split('/'));
  if (!exists(fullPath)) {
    report.blockers.push(`Recorded test file does not exist: ${repoPath}`);
    addCheck(report, 'recorded-test-file', 'failed', repoPath);
    return null;
  }

  const bracketedIds = [...String(recorded.title).matchAll(/\[([A-Z][A-Z0-9_]*-[0-9]{3})\]/g)].map(match => match[1]);
  if (bracketedIds.length !== 1 || bracketedIds[0] !== testCaseId) {
    report.blockers.push(`Recorded test title must contain exactly one bracketed ${testCaseId}; found ${bracketedIds.length ? bracketedIds.join(', ') : 'none'}`);
    addCheck(report, 'recorded-test-title', 'failed', String(recorded.title));
    return null;
  }

  const text = readText(fullPath);
  if (!text.ok) {
    report.blockers.push(text.error);
    addCheck(report, 'recorded-test-file', 'failed', text.error);
    return null;
  }

  if (!text.value.includes(testCaseId)) {
    report.blockers.push(`Recorded test file ${repoPath} does not contain ${testCaseId}`);
    addCheck(report, 'recorded-test-file', 'failed', `${testCaseId} not found`);
    return null;
  }

  addCheck(report, 'recorded-test-file', 'passed', repoPath);
  addCheck(report, 'recorded-test-title', 'passed', recorded.title);
  return { ...recorded, repoPath, testRoot: owningRoot };
}

function checkRecordedTestUnchanged(recorded, runtime, report) {
  const afterRed = runtime?.red?.afterRedCheckpointSha;
  if (!afterRed) {
    report.blockers.push('Runtime red.afterRedCheckpointSha is missing; cannot prove the recorded RED test stayed unchanged during GREEN.');
    addCheck(report, 'recorded-test-integrity', 'failed', 'missing after-RED checkpoint');
    return;
  }

  const result = runCapture('git', ['diff', '--name-only', afterRed, '--', recorded.repoPath]);
  if (!result.ok) {
    report.blockers.push(`Recorded test integrity check failed: ${(result.stderr || result.stdout).trim()}`);
    addCheck(report, 'recorded-test-integrity', 'failed', 'git diff failed');
    return;
  }

  const changed = result.stdout.split(/\r?\n/).filter(Boolean);
  if (changed.length) {
    report.blockers.push(`Recorded RED test changed since after-RED checkpoint ${afterRed}: ${changed.join(', ')}`);
    addCheck(report, 'recorded-test-integrity', 'failed', `changed since ${afterRed}`);
    return;
  }

  addCheck(report, 'recorded-test-integrity', 'passed', `unchanged since ${afterRed}`);
}

function quoteForDisplay(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function buildGreenRerunCommand(recorded) {
  const testCwd = path.join(root, ...recorded.testRoot.split('/'));
  const specArg = recorded.repoPath === recorded.testRoot
    ? '.'
    : recorded.repoPath.slice(recorded.testRoot.length + 1);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  return {
    command: npxCommand,
    args: ['playwright', 'test', specArg, '--grep', recorded.title],
    cwd: testCwd,
    display: `cd ${recorded.testRoot} && npx playwright test ${quoteForDisplay(specArg)} --grep ${quoteForDisplay(recorded.title)}`,
  };
}

function parsePlaywrightCounts(output) {
  const counts = { passed: 0, failed: 0, skipped: 0, flaky: 0, run: null };
  const patterns = [
    ['passed', /(\d+)\s+passed\b/gi],
    ['failed', /(\d+)\s+failed\b/gi],
    ['skipped', /(\d+)\s+skipped\b/gi],
    ['flaky', /(\d+)\s+flaky\b/gi],
  ];

  let sawCount = false;
  for (const [key, regex] of patterns) {
    for (const match of output.matchAll(regex)) {
      sawCount = true;
      counts[key] += Number(match[1]);
    }
  }

  if (sawCount) counts.run = counts.passed + counts.failed + counts.skipped + counts.flaky;
  return counts;
}

function summarizeFailure(output, status) {
  if (status === 'verified') return 'none';

  const lines = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^Running \d+ test/.test(line));

  const preferred = lines.find(line => /error|failed|expect|no tests found|timed out/i.test(line));
  return (preferred || lines[0] || 'test command failed').slice(0, 300);
}

function parseStructuredOutput(text) {
  const fields = {};
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = match[2].trim();
  }
  return fields;
}

function readWorkerOutputFile(outputFile) {
  const normalized = normalizeRepoPath(outputFile);
  if (!normalized.ok) return normalized;
  const fullPath = path.join(root, ...normalized.value.split('/'));
  const text = readText(fullPath);
  if (!text.ok) return { ok: false, value: null, error: text.error };
  return { ok: true, value: { repoPath: normalized.value, text: text.value }, error: null };
}

function validateWorkerOutputFile(report, kind, outputFile, summary) {
  const allowedKinds = new Set(['sdet-red', 'developer-green', 'developer-refactor', 'reviewer']);
  if (!allowedKinds.has(kind)) {
    report.blockers.push(`Unknown worker output validator ${kind}; expected ${[...allowedKinds].join(', ')}.`);
    return null;
  }

  const file = readWorkerOutputFile(outputFile);
  if (!file.ok) {
    report.blockers.push(file.error);
    addCheck(report, 'worker-output-file', 'failed', file.error);
    return null;
  }

  addCheck(report, 'worker-output-file', 'passed', file.value.repoPath);
  const fields = parseStructuredOutput(file.value.text);
  report.workerOutput = {
    kind,
    file: file.value.repoPath,
    parsedFields: Object.keys(fields).sort(),
  };

  validateBaseWorkerFields(fields, summary, report, kind);

  if (kind === 'sdet-red') {
    expectEnum(fields, 'RED_STATUS', new Set(['failing_expected', 'already_green', 'failing_wrong_reason', 'blocked']), report, kind);
    expectField(fields, 'TEST_FILE', report, kind);
    const title = expectField(fields, 'TEST_TITLE', report, kind);
    expectField(fields, 'TEST_COMMAND', report, kind);
    expectField(fields, 'RED_FAILURE_SUMMARY', report, kind);
    if (title && summary?.testCaseId) validateRecordedTitle(title, summary.testCaseId, report, kind);
  } else if (kind === 'developer-green') {
    expectEnum(fields, 'GREEN_STATUS', new Set(['ready_for_green_rerun', 'ticket-ambiguous', 'red-test-wrong', 'blocked']), report, kind);
    expectField(fields, 'ROOT_CAUSE', report, kind);
    expectField(fields, 'TARGETED_TEST_COMMAND', report, kind);
    expectEnum(fields, 'REFACTOR_NEEDED', new Set(['yes', 'no']), report, kind);
    expectEnum(fields, 'DEFERRED_TEST_CASE_IDS_UNTOUCHED', new Set(['true', 'false']), report, kind);
  } else if (kind === 'developer-refactor') {
    expectEnum(fields, 'GREEN_STATUS', new Set(['refactor_ready_for_green_rerun', 'blocked']), report, kind);
    expectField(fields, 'REFACTOR_SUMMARY', report, kind);
    expectEnum(fields, 'TESTS_CHANGED', new Set(['false']), report, kind);
  } else if (kind === 'reviewer') {
    expectEnum(fields, 'REVIEW_VERDICT', new Set(['ticket-ready', 'ticket-still-ambiguous', 'red-test-wrong', 'ticket-ambiguous', 'red-approved', 'coverage-approved', 'coverage-rejected', 'approved', 'rejected']), report, kind);
    expectField(fields, 'REASON', report, kind);
    expectField(fields, 'DIFF_SIZE_LINES', report, kind);
    expectField(fields, 'CHECKPOINT_SHA_REVIEWED', report, kind);
  }

  if (report.blockers.length) return null;
  addCheck(report, 'worker-output-validation', 'passed', kind);
  return fields;
}

function expectField(fields, name, report, context) {
  const value = fields[name];
  if (!value) {
    report.blockers.push(`${context} is missing required field ${name}.`);
    addCheck(report, `${context}-${name.toLowerCase()}`, 'failed', 'missing');
    return null;
  }
  addCheck(report, `${context}-${name.toLowerCase()}`, 'passed', value);
  return value;
}

function expectEnum(fields, name, allowed, report, context) {
  const value = expectField(fields, name, report, context);
  if (!value) return null;
  if (!allowed.has(value)) {
    report.blockers.push(`${context} field ${name} must be one of ${[...allowed].join(', ')}; found ${value}.`);
    addCheck(report, `${context}-${name.toLowerCase()}`, 'failed', value);
    return value;
  }
  return value;
}

function validateBaseWorkerFields(fields, summary, report, context) {
  expectEnum(fields, 'OUTCOME', new Set(['success', 'partial', 'blocked']), report, context);
  const feature = expectField(fields, 'FEATURE', report, context);
  const testCaseId = expectField(fields, 'TEST_CASE_ID', report, context);
  const ticketId = expectField(fields, 'TICKET_ID', report, context);
  expectField(fields, 'SUMMARY', report, context);

  if (summary?.feature && feature && feature !== summary.feature) {
    report.blockers.push(`${context} FEATURE ${feature} does not match target ticket feature ${summary.feature}.`);
    addCheck(report, `${context}-feature-match`, 'failed', `${feature} != ${summary.feature}`);
  } else if (summary?.feature && feature) {
    addCheck(report, `${context}-feature-match`, 'passed', feature);
  }

  if (summary?.testCaseId && testCaseId && testCaseId !== summary.testCaseId) {
    report.blockers.push(`${context} TEST_CASE_ID ${testCaseId} does not match target ticket test_case_id ${summary.testCaseId}.`);
    addCheck(report, `${context}-test-case-match`, 'failed', `${testCaseId} != ${summary.testCaseId}`);
  } else if (summary?.testCaseId && testCaseId) {
    addCheck(report, `${context}-test-case-match`, 'passed', testCaseId);
  }

  if (summary?.id && ticketId && ticketId !== summary.id) {
    report.blockers.push(`${context} TICKET_ID ${ticketId} does not match target ticket ${summary.id}.`);
    addCheck(report, `${context}-ticket-match`, 'failed', `${ticketId} != ${summary.id}`);
  } else if (summary?.id && ticketId) {
    addCheck(report, `${context}-ticket-match`, 'passed', ticketId);
  }
}

function validateRecordedTitle(title, testCaseId, report, context) {
  const bracketedIds = [...String(title).matchAll(/\[([A-Z][A-Z0-9_]*-[0-9]{3})\]/g)].map(match => match[1]);
  if (bracketedIds.length !== 1 || bracketedIds[0] !== testCaseId) {
    report.blockers.push(`${context} TEST_TITLE must contain exactly one bracketed ${testCaseId}; found ${bracketedIds.length ? bracketedIds.join(', ') : 'none'}.`);
    addCheck(report, `${context}-test-title`, 'failed', title);
    return;
  }
  addCheck(report, `${context}-test-title`, 'passed', title);
}

function validateWorkerOutput(report, values, summary) {
  const kind = values.validateWorkerOutput;
  if (!kind) return;

  if (report.targetType !== 'ticket') {
    report.blockers.push('--validate-worker-output requires --target TICKET-YYYYMMDD-NNN.');
  }
  if (!values.outputFile) {
    report.blockers.push('--validate-worker-output requires --output-file <path>.');
  }
  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Provide a ticket target and output file before validating worker output.';
    return;
  }

  const fields = validateWorkerOutputFile(report, kind, values.outputFile, summary);

  if (!fields || report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Worker output failed deterministic contract validation. Fix the worker response or block/escalate the workflow.';
    addCheck(report, 'worker-output-validation', 'failed', kind);
    return;
  }

  report.outcome = 'success';
  report.exitCode = 0;
  report.nextStep = 'Worker output passed deterministic contract validation.';
  addCheck(report, 'worker-output-validation', 'passed', kind);
}

const WORKER_PHASES = {
  'ticket-audit': { role: 'reviewer', mode: 'ticket-audit' },
  'red-writing': { role: 'sdet', mode: 'red' },
  'red-arbitrating': { role: 'reviewer', mode: 'red-arbitrate' },
  'already-green-audit': { role: 'reviewer', mode: 'already-green-audit' },
  'green-building': { role: 'developer', mode: 'green' },
  refactoring: { role: 'developer', mode: 'refactor' },
  'final-review': { role: 'reviewer', mode: 'final-review' },
};

function buildWorkerTaskPayload(report, summary, role, mode, state) {
  const args = [
    '.opencode/scripts/build-worker-task.mjs',
    '--role', role,
    '--mode', mode,
    '--ticket-id', summary.id,
    '--test-case-id', summary.testCaseId,
    '--worktree-root', root,
    '--ticket-file', summary.file,
    '--json',
  ];

  if (summary.planId) args.push('--plan-id', summary.planId);
  if (summary.ticketType) args.push('--ticket-type', summary.ticketType);
  if (state?.orchestrator?.branch) args.push('--branch', state.orchestrator.branch);
  if (state?.orchestrator?.baseBranch) args.push('--base-branch', state.orchestrator.baseBranch);
  if (summary.testType) args.push('--test-interface', summary.testType);

  const result = runCapture(process.execPath, args);
  if (!result.ok) {
    report.blockers.push(`Failed to build ${role} ${mode} task for ${summary.id}: ${result.stderr || result.stdout}`);
    addCheck(report, 'next-task', 'failed', `${role}:${mode}`);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    report.blockers.push(`Worker task generator returned invalid JSON for ${summary.id}: ${error.message}`);
    addCheck(report, 'next-task', 'failed', 'invalid JSON');
    return null;
  }
}

function emitTicketNextTask(report, summary, state) {
  const runtime = state.orchestrator;
  const activeForTicket = runtime?.currentTicket === summary.id && runtime?.currentTestCase === summary.testCaseId;
  const phase = activeForTicket && runtime?.status && runtime.status !== 'idle' ? runtime.status : null;

  if (!phase) {
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `No worker task yet. Initialize ${summary.id} with node .opencode/scripts/workflow-runner.mjs --target ${summary.id} --run-ticket --json, then request --next-task.`;
    addCheck(report, 'next-task', 'passed', 'runner-initialization-required');
    return;
  }

  if (phase === 'green-testing') {
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `No worker task needed. Run deterministic GREEN verification: node .opencode/scripts/workflow-runner.mjs --target ${summary.id} --run-ticket --json`;
    addCheck(report, 'next-task', 'passed', 'deterministic-green-rerun-required');
    return;
  }

  if (phase === 'ticket-complete') {
    report.outcome = 'complete';
    report.exitCode = 0;
    report.nextStep = `Ticket ${summary.id} is complete; no worker task is available.`;
    addCheck(report, 'next-task', 'passed', 'ticket-complete');
    return;
  }

  const worker = WORKER_PHASES[phase];
  if (!worker) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = `Runtime phase ${phase} has no deterministic worker task mapping yet.`;
    addCheck(report, 'next-task', 'blocked', phase);
    return;
  }

  const task = buildWorkerTaskPayload(report, summary, worker.role, worker.mode, state);
  if (!task) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Fix next-task generation blockers before dispatching a worker.';
    return;
  }

  report.nextTask = {
    phase,
    role: worker.role,
    mode: worker.mode,
    task,
  };
  report.outcome = 'success';
  report.exitCode = 0;
  report.nextStep = `Dispatch ${worker.role} ${worker.mode} for ${summary.id}, capture its final message, then run --ingest-worker-output <file>.`;
  addCheck(report, 'next-task', 'passed', `${phase} -> ${worker.role}:${worker.mode}`);
}

function emitNextTask(report, values, state, manifest, planAnalysis) {
  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Resolve blockers before emitting a worker task.';
    return;
  }

  if (report.targetType === 'ticket') {
    emitTicketNextTask(report, report.targetSummary, state);
    return;
  }

  const runtime = state.orchestrator;
  const activeForPlan = runtime?.currentPlan === values.target && runtime?.currentTicket && runtime.status !== 'idle' && runtime.status !== 'plan-complete';
  if (activeForPlan) {
    const activeTicket = loadTicket(runtime.currentTicket, report);
    if (!activeTicket) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Active plan ticket ${runtime.currentTicket} could not be loaded.`;
      return;
    }
    validateTicket(activeTicket, manifest, report);
    emitTicketNextTask(report, report.targetSummary, state);
    return;
  }

  if (planAnalysis?.reviewTicket) {
    const summary = selectPlanTicketSummary(planAnalysis.reviewTicket);
    const task = buildWorkerTaskPayload(report, summary, 'reviewer', 'ticket-audit', state);
    if (!task) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Fix next-task generation blockers before dispatching reviewer ticket-audit.';
      return;
    }
    report.nextTask = { phase: 'ticket-audit', role: 'reviewer', mode: 'ticket-audit', task };
    report.outcome = 'success';
    report.exitCode = 0;
    report.nextStep = `Dispatch reviewer ticket-audit for ${summary.id}, capture its final message, then run --ingest-worker-output <file>.`;
    addCheck(report, 'next-task', 'passed', `ticket-audit -> reviewer:ticket-audit`);
    return;
  }

  if (planAnalysis?.readyTicket) {
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `No worker task yet. Initialize next plan ticket with node .opencode/scripts/workflow-runner.mjs --target ${values.target} --run-plan --json, then request --next-task.`;
    addCheck(report, 'next-task', 'passed', 'runner-initialization-required');
    return;
  }

  report.outcome = 'blocked';
  report.exitCode = 1;
  report.nextStep = `No worker task is available for ${values.target}.`;
  addCheck(report, 'next-task', 'blocked', 'no runnable item');
}

function classifyGreenResult(result, counts, output) {
  if (SETUP_FAILURE_PATTERNS.some(pattern => pattern.test(output))) return 'todo';
  if (result.ok && counts.run !== null && counts.passed > 0 && counts.failed === 0 && counts.skipped === 0 && counts.flaky === 0) return 'verified';
  if (counts.run === 0 || (result.ok && counts.run === null)) return 'todo';
  return 'open';
}

function currentBranchName(report) {
  return String(report.git?.branch || '').replace(/^##\s*/, '').trim() || null;
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function gitHeadSha(short = true) {
  const args = short ? ['rev-parse', '--short', 'HEAD'] : ['rev-parse', 'HEAD'];
  const result = runCapture('git', args);
  return result.ok ? result.stdout.trim() : null;
}

function branchExists(branch) {
  return runCapture('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0;
}

function branchMergedInto(branch, baseBranch) {
  if (!branchExists(branch) || !branchExists(baseBranch)) return null;
  const result = runCapture('git', ['merge-base', '--is-ancestor', branch, baseBranch]);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  return null;
}

function appendCheckpoint(checkpointsState, sha) {
  if (!sha) return;
  if (!Array.isArray(checkpointsState.checkpoints)) checkpointsState.checkpoints = [];
  if (!checkpointsState.checkpoints.includes(sha)) checkpointsState.checkpoints.push(sha);
}

function persistCheckpointsState(checkpoints, values, report) {
  if (values.dryRun) {
    addCheck(report, 'checkpoint-write', 'passed', 'dry-run only');
    return;
  }

  writeJson(path.join(root, '.opencode', 'state', 'checkpoints.json'), checkpoints);
  addCheck(report, 'checkpoint-write', 'passed', `${checkpoints.checkpoints.length} checkpoint(s)`);
}

function gitStage(pathsToAdd, report, detailName = 'git-stage') {
  const unique = [...new Set(pathsToAdd.filter(Boolean))];
  if (!unique.length) {
    addCheck(report, detailName, 'passed', 'nothing to stage');
    return true;
  }

  const result = runCapture('git', ['add', '--', ...unique]);
  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim() || 'git add failed';
    report.blockers.push(detail);
    addCheck(report, detailName, 'failed', detail);
    return false;
  }

  addCheck(report, detailName, 'passed', unique.join(', '));
  return true;
}

function hasStagedChanges() {
  const result = runCapture('git', ['diff', '--cached', '--quiet']);
  return result.status === 1;
}

function createGitCommit(message, report, options = {}) {
  const args = ['commit', '-m', message];
  if (options.allowEmpty) args.splice(1, 0, '--allow-empty');
  const result = runCapture('git', args);
  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim() || `git commit failed for ${message}`;
    report.blockers.push(detail);
    addCheck(report, 'git-commit', 'failed', message);
    return null;
  }

  const sha = gitHeadSha();
  addCheck(report, 'git-commit', 'passed', `${message}${sha ? ` -> ${sha}` : ''}`);
  return sha;
}

function maybeCreateCommit(message, pathsToAdd, report, values, options = {}) {
  if (values.dryRun) {
    addCheck(report, 'git-commit', 'passed', `dry-run only -> ${message}`);
    return options.allowEmpty ? 'dry-run-checkpoint' : 'dry-run-commit';
  }

  if (!gitStage(pathsToAdd, report, options.stageCheckName)) return null;
  if (!hasStagedChanges() && !options.allowEmpty) {
    addCheck(report, 'git-commit', 'passed', `no staged changes for ${message}`);
    return gitHeadSha();
  }

  return createGitCommit(message, report, { allowEmpty: Boolean(options.allowEmpty) });
}

function ensureBranch(expectedBranch, baseBranch, values, report) {
  const current = currentBranchName(report);
  if (current === expectedBranch) {
    addCheck(report, 'execution-branch', 'passed', expectedBranch);
    return true;
  }

  if (values.dryRun) {
    addCheck(report, 'execution-branch', 'passed', `dry-run only -> ${expectedBranch}`);
    return true;
  }

  const branchExists = runCapture('git', ['show-ref', '--verify', '--quiet', `refs/heads/${expectedBranch}`]);
  const args = branchExists.status === 0
    ? ['checkout', expectedBranch]
    : ['checkout', '-b', expectedBranch, baseBranch || 'HEAD'];
  const result = runCapture('git', args);
  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim() || `failed to switch to ${expectedBranch}`;
    report.blockers.push(detail);
    addCheck(report, 'execution-branch', 'failed', detail);
    return false;
  }

  addCheck(report, 'execution-branch', 'passed', expectedBranch);
  report.git.branch = `## ${expectedBranch}`;
  return true;
}

function runQualityGate(report, projectConfig, values, label) {
  const command = projectConfig?.quality_gate?.command;
  if (!command) {
    addCheck(report, 'quality-gate', 'passed', 'no configured quality gate');
    return true;
  }

  const display = label ? `${label}: ${command}` : command;
  if (values.dryRun) {
    addCheck(report, 'quality-gate', 'passed', `dry-run only -> ${display}`);
    return true;
  }

  const result = runCapture(process.platform === 'win32' ? 'cmd.exe' : 'sh', process.platform === 'win32'
    ? ['/d', '/s', '/c', command]
    : ['-lc', command]);
  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim() || `quality gate failed: ${display}`;
    report.blockers.push(detail);
    addCheck(report, 'quality-gate', 'failed', display);
    return false;
  }

  addCheck(report, 'quality-gate', 'passed', display);
  return true;
}

function trackedPlanTicketEntries(planId) {
  return fs.readdirSync(path.join(root, 'docs', 'tickets'), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => {
      const filePath = path.join(root, 'docs', 'tickets', entry.name);
      const parsed = parseFrontmatter(filePath);
      if (!parsed.ok || parsed.data.plan_id !== planId) return null;
      return {
        id: entry.name.replace(/\.md$/, ''),
        filePath,
        content: readText(filePath).value,
        frontmatter: parsed.data,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function ticketLine(ticket) {
  const title = ticket.content.match(/^#\s+(.+)$/m)?.[1] ?? ticket.id;
  return `- ${ticket.id} - ${ticket.frontmatter.status} - ${ticket.frontmatter.type} - ${title}`;
}

function updatePlanTicketBlock(planContent, planTickets) {
  const lines = planTickets.map(ticketLine);
  const block = `## Tickets\n${lines.join('\n')}`;
  if (/## Tickets\r?\n[\s\S]*?(?=\r?\n## |$)/.test(planContent)) {
    return planContent.replace(/## Tickets\r?\n[\s\S]*?(?=\r?\n## |$)/, block);
  }
  return `${planContent.trimEnd()}\n\n${block}\n`;
}

function updatePlanStatusSummary(planContent, planTickets) {
  const counts = { draft: 0, review: 0, ready: 0, in_progress: 0, blocked: 0, complete: 0 };
  for (const ticket of planTickets) {
    const status = ticket.frontmatter.status;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  }

  const block = [
    '## Status Summary',
    `- draft: ${counts.draft}`,
    `- review: ${counts.review}`,
    `- ready: ${counts.ready}`,
    `- in_progress: ${counts.in_progress}`,
    `- blocked: ${counts.blocked}`,
    `- complete: ${counts.complete}`,
  ].join('\n');

  if (/## Status Summary\r?\n[\s\S]*?(?=\r?\n## |$)/.test(planContent)) {
    return planContent.replace(/## Status Summary\r?\n[\s\S]*?(?=\r?\n## |$)/, block);
  }
  return `${planContent.trimEnd()}\n\n${block}\n`;
}

function persistPlanFile(planId, mutate, values, report) {
  const filePath = planPath(planId);
  const text = readText(filePath);
  if (!text.ok) {
    report.blockers.push(text.error);
    addCheck(report, 'plan-write', 'failed', text.error);
    return;
  }
  const updated = mutate(text.value);
  if (values.dryRun) {
    addCheck(report, 'plan-write', 'passed', `dry-run only -> ${rel(filePath)}`);
    return;
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  addCheck(report, 'plan-write', 'passed', rel(filePath));
}

function refreshPlanDocument(planId, values, report, statusOverride = null) {
  const planTickets = trackedPlanTicketEntries(planId);
  persistPlanFile(planId, (content) => {
    let next = content;
    if (statusOverride) next = replaceFrontmatterValue(next, 'status', statusOverride);
    next = updatePlanTicketBlock(next, planTickets);
    next = updatePlanStatusSummary(next, planTickets);
    return next;
  }, values, report);
}

function diffPathsSince(baseSha, pathsToCheck) {
  const args = ['diff', '--name-only', baseSha, '--', ...pathsToCheck];
  const result = runCapture('git', args);
  if (!result.ok) return null;
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function skipReviewerEligible(runtime, projectConfig, report, values) {
  const afterRed = runtime?.red?.afterRedCheckpointSha;
  if (!afterRed) {
    addCheck(report, 'reviewer-skip', 'failed', 'missing after-RED checkpoint');
    return false;
  }

  const codeRoots = projectConfig?.code_roots || [];
  const testRoots = projectConfig?.test_roots || [];
  const codeChanges = diffPathsSince(afterRed, codeRoots);
  const testChanges = diffPathsSince(afterRed, testRoots);
  if (!codeChanges || !testChanges) {
    addCheck(report, 'reviewer-skip', 'failed', 'git diff failed');
    return false;
  }
  if (testChanges.length) {
    addCheck(report, 'reviewer-skip', 'blocked', `test changes since ${afterRed}`);
    return false;
  }
  if (!codeChanges.length) {
    addCheck(report, 'reviewer-skip', 'blocked', 'no code-root changes to review');
    return false;
  }
  if (!runQualityGate(report, projectConfig, values, 'final-review gate')) {
    addCheck(report, 'reviewer-skip', 'blocked', 'quality gate failed');
    return false;
  }
  addCheck(report, 'reviewer-skip', 'passed', `code roots only since ${afterRed}`);
  return true;
}

function recordPlanRuntime(state, planId, status) {
  state.orchestrator.currentPlan = planId;
  state.ticket.currentPlan = planId;
  state.orchestrator.status = status;
  state.ticket.status = status;
}

function selectPlanTicketSummary(ticket) {
  return {
    type: 'ticket',
    id: ticket.id,
    file: ticket.file,
    planId: ticket.frontmatter.plan_id ?? null,
    ticketType: ticket.frontmatter.type ?? null,
    status: ticket.frontmatter.status ?? null,
    testCaseId: ticket.frontmatter.test_case_id ?? null,
    feature: String(ticket.frontmatter.test_case_id || '').split('-')[0] || null,
    testType: null,
    testCommand: null,
  };
}

function withTicketSummary(report, summary, values, fn) {
  const previousType = report.targetType;
  const previousSummary = report.targetSummary;
  const previousTarget = report.target;
  const previousValueTarget = values.target;
  report.targetType = 'ticket';
  report.targetSummary = summary;
  report.target = summary.id;
  values.target = summary.id;
  try {
    fn();
  } finally {
    report.targetType = previousType;
    report.targetSummary = previousSummary;
    report.target = previousTarget;
    values.target = previousValueTarget;
  }
}

function runPlanRegression(report, values, planAnalysis, manifest, projectConfig, state) {
  const completeTickets = planAnalysis.tickets.filter(ticket => ticket.frontmatter.status === 'complete' && EXECUTABLE_TYPES.has(ticket.frontmatter.type));
  const impactedSpecs = [...new Set(completeTickets
    .map(ticket => manifest?.test_cases?.[ticket.frontmatter.test_case_id]?.tests || [])
    .flat()
    .map(test => test.spec_file)
    .filter(Boolean))];

  if (!impactedSpecs.length) {
    report.blockers.push(`Plan ${planAnalysis.frontmatter.id} has no impacted spec files for regression-gating.`);
    addCheck(report, 'plan-regression', 'failed', 'no impacted specs');
    return;
  }

  if (!runQualityGate(report, projectConfig, values, 'plan regression gate')) return;

  if (!state.orchestrator.regression) {
    state.orchestrator.regression = { cycle: 0, maxRegressionCycles: 3, impactedSpecs: [], lastResultsPath: null, lastSyncSummary: null };
  }

  const nextCycle = Number(state.orchestrator.regression.cycle || 0) + 1;
  const maxCycles = Number(state.orchestrator.regression.maxRegressionCycles || 3);
  state.orchestrator.regression.cycle = nextCycle;
  state.orchestrator.regression.impactedSpecs = impactedSpecs;
  if (nextCycle > maxCycles) {
    report.blockers.push(`Regression cycle budget exceeded for ${planAnalysis.frontmatter.id}: ${nextCycle} > ${maxCycles}`);
    addCheck(report, 'plan-regression', 'blocked', `cycle ${nextCycle}`);
    persistRuntimeState(state, report, values);
    return;
  }

  const testRoot = configuredTestRoots(projectConfig)[0];
  const cwd = path.join(root, ...testRoot.split('/'));
  const specArgs = impactedSpecs.map(spec => spec.replace(/^test\//, ''));
  const outputPath = path.join(root, '.opencode', 'state', 'plan-regression-results.json');
  const display = `cd ${testRoot} && npx playwright test ${specArgs.map(quoteForDisplay).join(' ')} --reporter=json > .opencode/state/plan-regression-results.json`;

  if (values.dryRun) {
    addCheck(report, 'plan-regression', 'passed', `dry-run only -> ${display}`);
    report.nextStep = `Dry run only. Would run impacted-spec regression for ${planAnalysis.frontmatter.id}: ${display}`;
    report.outcome = 'partial';
    report.exitCode = 0;
    return;
  }

  persistRuntimeState(state, report, values);
  if (report.blockers.length) return;

  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'test', ...specArgs, '--reporter=json'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
  const jsonOutput = result.stdout || '';
  fs.writeFileSync(outputPath, jsonOutput, 'utf8');
  state.orchestrator.regression.lastResultsPath = rel(outputPath);
  persistRuntimeState(state, report, values);
  if (report.blockers.length) return;

  if (result.status === 0) {
    addCheck(report, 'plan-regression', 'passed', impactedSpecs.join(', '));
    return;
  }

  const syncEnabled = planAnalysis.frontmatter.regression_bug_sync === true;
  addCheck(report, 'plan-regression', 'failed', impactedSpecs.join(', '));
  if (!syncEnabled) {
    report.blockers.push(`Impacted-spec regression failed for ${planAnalysis.frontmatter.id}. Rerun: ${display}`);
    return;
  }

  const helperPath = path.join(root, 'test', 'helpers', 'sync-regression-bugs.mjs');
  const helper = runCapture(process.execPath, [helperPath, '--plan', planAnalysis.frontmatter.id, '--results', outputPath, '--run-command', `npx playwright test ${specArgs.join(' ')}`], { cwd: root });
  state.orchestrator.regression.lastSyncSummary = (helper.stdout || helper.stderr || '').trim() || null;
  persistRuntimeState(state, report, values);
  if (report.blockers.length) return;
  if (!helper.ok) {
    report.blockers.push(`Regression bug sync failed: ${(helper.stderr || helper.stdout).trim()}`);
    addCheck(report, 'plan-regression-sync', 'failed', planAnalysis.frontmatter.id);
    return;
  }
  addCheck(report, 'plan-regression-sync', 'passed', planAnalysis.frontmatter.id);
  report.outcome = 'partial';
  report.exitCode = 1;
  report.nextStep = `Regression created or updated review bug tickets for ${planAnalysis.frontmatter.id}. Re-run --run-plan after reviewer audit.`;
}

function completePlan(report, values, state, planAnalysis) {
  refreshPlanDocument(planAnalysis.frontmatter.id, values, report, 'complete');
  if (report.blockers.length) return;
  const sha = maybeCreateCommit(`docs(tdd): complete ${planAnalysis.frontmatter.id}`, [planPath(planAnalysis.frontmatter.id)], report, values);
  if (!sha) return;
  state.orchestrator.status = 'plan-complete';
  state.ticket.status = 'plan-complete';
  state.orchestrator.lastCheckpointSha = sha;
  persistRuntimeState(state, report, values);
  report.outcome = 'success';
  report.exitCode = 0;
  report.nextStep = values.dryRun
    ? `Dry run only. Plan ${planAnalysis.frontmatter.id} would be marked complete after regression passes.`
    : `Plan ${planAnalysis.frontmatter.id} completed deterministically through regression-gating.`;
}

function runPlan(report, values, state, manifest, projectConfig, planAnalysis) {
  if (report.targetType !== 'plan') {
    report.blockers.push('--run-plan requires --target PLAN-YYYYMMDD-name.');
  }
  if (!planAnalysis) {
    report.blockers.push(`Plan ${values.target} could not be loaded for deterministic execution.`);
  }
  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Resolve run-plan blockers before deterministic plan execution.';
    return;
  }

  const runtime = state.orchestrator;
  const activeForPlan = runtime?.currentPlan === values.target && runtime?.currentTicket && runtime.status !== 'idle' && runtime.status !== 'plan-complete';
  if (activeForPlan && runtime.status !== 'ticket-complete' && runtime.status !== 'regression-gating') {
    const activeTicket = loadTicket(runtime.currentTicket, report);
    if (!activeTicket) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Active plan ticket ${runtime.currentTicket} could not be loaded.`;
      return;
    }
    const planSummary = report.targetSummary;
    validateTicket(activeTicket, manifest, report);
    const ticketSummary = report.targetSummary;
    report.targetSummary = planSummary;
    withTicketSummary(report, ticketSummary, values, () => runTicket(report, values, state, manifest, projectConfig));
    return;
  }

  if (planAnalysis.reviewTicket) {
    const reviewTicket = planAnalysis.reviewTicket;
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture reviewer ticket-audit output for ${reviewTicket.id}, then rerun with --run-plan --output-file <path>.`;
      return;
    }
    if (!values.dryRun && !requireCleanExecutionWorktree(report, 'plan review-ticket status update')) {
      blockOnExecutionWorktree(report, 'Clean the worktree before applying review-ticket status updates.');
      return;
    }
    const reviewSummary = selectPlanTicketSummary(reviewTicket);
    const fields = validateWorkerOutputFile(report, 'reviewer', values.outputFile, reviewSummary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Reviewer output for review ticket ${reviewTicket.id} failed deterministic validation.`;
      return;
    }
    if (!new Set(['ticket-ready', 'ticket-still-ambiguous']).has(fields.REVIEW_VERDICT)) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Reviewer verdict ${fields.REVIEW_VERDICT} is not supported by deterministic plan audit yet.`;
      return;
    }
    const nextStatus = fields.REVIEW_VERDICT === 'ticket-ready' ? 'ready' : 'blocked';
    persistTicketStatus(reviewTicket.id, nextStatus, values, report);
    if (report.blockers.length) return;
    refreshPlanDocument(values.target, values, report, 'in_progress');
    report.outcome = nextStatus === 'ready' ? 'partial' : 'blocked';
    report.exitCode = nextStatus === 'ready' ? 0 : 1;
    report.nextStep = nextStatus === 'ready'
      ? `Review ticket ${reviewTicket.id} is now ready. Re-run --run-plan to start executable tickets.`
      : `Review ticket ${reviewTicket.id} remains blocked after reviewer audit.`;
    addCheck(report, 'plan-review-ticket', nextStatus === 'ready' ? 'passed' : 'blocked', `${reviewTicket.id} -> ${nextStatus}`);
    return;
  }

  if (planAnalysis.readyTicket) {
    const nextTicket = loadTicket(planAnalysis.readyTicket.id, report);
    if (!nextTicket) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      return;
    }
    const planSummary = report.targetSummary;
    validateTicket(nextTicket, manifest, report);
    const ticketSummary = report.targetSummary;
    report.targetSummary = planSummary;
    withTicketSummary(report, ticketSummary, values, () => runTicket(report, values, state, manifest, projectConfig));
    if (report.blockers.length) return;
    refreshPlanDocument(values.target, values, report, 'in_progress');
    report.nextStep = `Plan ${values.target} selected ${ticketSummary.id}. Capture the SDET RED final message and continue with --run-plan --output-file <path>.`;
    addCheck(report, 'plan-select-ticket', 'passed', ticketSummary.id);
    return;
  }

  if (planAnalysis.tickets.length > 0 && planAnalysis.tickets.every(ticket => !EXECUTABLE_TYPES.has(ticket.frontmatter.type) || ticket.frontmatter.status === 'complete')) {
    const pendingIntegration = report.targetSummary?.pendingIntegrationTickets || [];
    if (pendingIntegration.length) {
      const details = pendingIntegration
        .map(item => `${item.ticketId} (${item.branch}: ${item.mergedIntoPlan === null ? 'missing-or-unknown' : 'not-integrated'})`)
        .join(', ');
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Integrate completed ticket branch(es) into ${report.targetSummary.planBranch} before plan regression: ${details}.`;
      addCheck(report, 'plan-integration', 'blocked', details);
      return;
    }

    if (!values.dryRun && !requireCleanExecutionWorktree(report, 'plan regression-gating')) {
      blockOnExecutionWorktree(report, 'Clean the worktree before entering plan regression-gating.');
      return;
    }
    state.orchestrator.status = 'regression-gating';
    state.ticket.status = 'regression-gating';
    persistRuntimeState(state, report, values);
    if (report.blockers.length) return;
    runPlanRegression(report, values, planAnalysis, manifest, projectConfig, state);
    if (report.blockers.length || report.outcome === 'partial') return;
    completePlan(report, values, state, planAnalysis);
    return;
  }

  report.outcome = 'blocked';
  report.exitCode = 1;
  report.nextStep = `No deterministic plan action is available for ${values.target}.`;
}

function syncReportRuntime(report, orchestrator) {
  report.runtime = {
    currentPlan: orchestrator.currentPlan ?? null,
    currentTicket: orchestrator.currentTicket ?? null,
    currentFeature: orchestrator.currentFeature ?? null,
    currentTestCase: orchestrator.currentTestCase ?? null,
    status: orchestrator.status ?? null,
    iteration: orchestrator.iteration ?? null,
    maxIterations: orchestrator.maxIterations ?? null,
    branch: orchestrator.branch ?? null,
    baseBranch: orchestrator.baseBranch ?? null,
    lastCheckpointSha: orchestrator.lastCheckpointSha ?? null,
  };
}

function persistRuntimeState(state, report, values) {
  syncReportRuntime(report, state.orchestrator);
  if (values.dryRun) {
    addCheck(report, 'runtime-write', 'passed', 'dry-run only');
    return;
  }

  writeJson(path.join(root, '.opencode', 'state', 'orchestrator-progress.json'), state.orchestrator);
  writeJson(path.join(root, '.opencode', 'state', 'ticket-progress.json'), state.ticket);
  addCheck(report, 'runtime-write', 'passed', 'orchestrator-progress.json, ticket-progress.json');
}

function replaceFrontmatterValue(text, key, value) {
  const pattern = new RegExp(`(^${key}:\\s*)(.*)$`, 'm');
  if (!pattern.test(text)) return text;
  return text.replace(pattern, `$1${value}`);
}

function persistTicketStatus(ticketId, status, values, report) {
  const filePath = ticketPath(ticketId);
  const text = readText(filePath);
  if (!text.ok) {
    report.blockers.push(text.error);
    addCheck(report, 'ticket-status-write', 'failed', text.error);
    return;
  }

  const updated = replaceFrontmatterValue(text.value, 'status', status);
  if (values.dryRun) {
    addCheck(report, 'ticket-status-write', 'passed', `dry-run only -> ${status}`);
    return;
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  addCheck(report, 'ticket-status-write', 'passed', `${rel(filePath)} -> ${status}`);
}

function initTicketRunState(state, report, summary, values) {
  const orchestrator = cloneState(state.orchestrator);
  const ticket = cloneState(state.ticket);
  const branch = orchestrator.branch || ticket.branch || currentBranchName(report);
  const baseBranch = orchestrator.baseBranch || ticket.baseBranch || null;

  orchestrator.currentPlan = summary.planId;
  orchestrator.currentTicket = summary.id;
  orchestrator.currentFeature = summary.feature;
  orchestrator.currentTestCase = summary.testCaseId;
  orchestrator.status = 'red-writing';
  orchestrator.iteration = 0;
  orchestrator.branch = branch;
  orchestrator.baseBranch = baseBranch;
  orchestrator.red = {
    status: null,
    testFile: null,
    testTitle: null,
    failureSummary: null,
    preRedCheckpointSha: orchestrator.lastCheckpointSha ?? null,
    afterRedCheckpointSha: null,
  };
  orchestrator.green = {
    refactorNeeded: null,
    refactorUsed: false,
    greenCommitSha: null,
    refactorCommitSha: null,
  };

  ticket.currentPlan = summary.planId;
  ticket.currentTicket = summary.id;
  ticket.currentFeature = summary.feature;
  ticket.currentTestCase = summary.testCaseId;
  ticket.currentTicketType = summary.ticketType;
  ticket.status = 'red-writing';
  ticket.branch = branch;
  ticket.baseBranch = baseBranch;

  state.orchestrator = orchestrator;
  state.ticket = ticket;
  persistRuntimeState(state, report, values);
  report.outcome = 'partial';
  report.exitCode = 0;
  report.nextStep = `Ticket ${summary.id} entered red-writing. Capture the SDET RED final message to a file, then rerun with --run-ticket --output-file <path>${values.dryRun ? '' : ' to advance deterministically'}.`;
}

function runTicketGreenPhase(report, values, state, manifest, projectConfig) {
  const greenValues = { ...values, runGreen: true };
  runGreenRerun(report, greenValues, state, manifest, projectConfig);
}

function finalizeTicketComplete(state, summary, report, values) {
  const orchestrator = cloneState(state.orchestrator);
  const ticket = cloneState(state.ticket);

  orchestrator.status = 'ticket-complete';
  if (!Array.isArray(orchestrator.completedTestCases)) orchestrator.completedTestCases = [];
  if (!orchestrator.completedTestCases.includes(summary.testCaseId)) orchestrator.completedTestCases.push(summary.testCaseId);

  ticket.status = 'ticket-complete';
  if (ticket.tickets?.[summary.id]) ticket.tickets[summary.id].status = 'complete';

  persistTicketStatus(summary.id, 'complete', values, report);
  if (report.blockers.length) return;

  state.orchestrator = orchestrator;
  state.ticket = ticket;
  persistRuntimeState(state, report, values);
  report.outcome = 'success';
  report.exitCode = 0;
  report.nextStep = values.dryRun
    ? `Dry run only. Ticket ${summary.id} would be marked complete after reviewer approval.`
    : `Ticket ${summary.id} was marked complete in runtime state and ticket frontmatter.`;
}

function runTicket(report, values, state, manifest, projectConfig) {
  const runtime = state.orchestrator;
  const summary = report.targetSummary;

  if (report.targetType !== 'ticket') {
    report.blockers.push('--run-ticket requires --target TICKET-YYYYMMDD-NNN.');
  }

  if (!summary?.testCaseId) {
    report.blockers.push('Cannot run a deterministic ticket phase without a ticket test_case_id.');
  }

  if (summary?.status === 'complete') {
    report.outcome = 'complete';
    report.exitCode = 0;
    report.nextStep = `Ticket ${summary.id} is already complete; no runner-owned phase execution needed.`;
    return;
  }

  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Resolve run-ticket blockers before advancing the ticket FSM.';
    return;
  }

  const activeForTarget = runtime?.currentTicket === summary.id && runtime?.currentTestCase === summary.testCaseId;
  const phase = activeForTarget && runtime?.status && runtime.status !== 'idle' && runtime.status !== 'ticket-complete'
    ? runtime.status
    : null;

  if (!phase) {
    if (!values.dryRun && !requireCleanExecutionWorktree(report, 'ticket start')) {
      blockOnExecutionWorktree(report, 'Clean the worktree before starting deterministic ticket execution.');
      return;
    }
    const branchName = `tdd/${summary.planId || summary.id}`;
    const baseBranch = state.orchestrator.baseBranch || state.ticket.baseBranch || currentBranchName(report);
    ensureBranch(branchName, baseBranch, values, report);
    if (report.blockers.length) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Could not prepare execution branch ${branchName}.`;
      return;
    }
    initTicketRunState(state, report, summary, values);
    const preRedSha = maybeCreateCommit(`checkpoint(tdd): pre-red ${summary.id}`, [ticketPath(summary.id)], report, values, { allowEmpty: true });
    if (!preRedSha) return;
    state.orchestrator.red.preRedCheckpointSha = preRedSha;
    state.orchestrator.lastCheckpointSha = preRedSha;
    appendCheckpoint(state.checkpoints, preRedSha);
    persistRuntimeState(state, report, values);
    persistCheckpointsState(state.checkpoints, values, report);
    return;
  }

  if (phase === 'red-writing') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture the SDET RED final message for ${summary.id} to a file, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    if (!values.dryRun && !requireDirtyPathsWithin(report, configuredTestRoots(projectConfig), 'red-writing')) {
      blockOnExecutionWorktree(report, 'Only test-root changes are allowed before committing RED.');
      return;
    }

    const fields = validateWorkerOutputFile(report, 'sdet-red', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'SDET RED output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    const orchestrator = cloneState(state.orchestrator);
    const ticket = cloneState(state.ticket);

    if (fields.RED_STATUS === 'blocked') {
      orchestrator.status = 'blocked';
      orchestrator.red = {
        ...orchestrator.red,
        status: fields.RED_STATUS,
        testFile: fields.TEST_FILE,
        testTitle: fields.TEST_TITLE,
        failureSummary: fields.RED_FAILURE_SUMMARY,
      };
      ticket.status = 'blocked';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `SDET RED blocked ${summary.id}: ${fields.RED_FAILURE_SUMMARY}`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:blocked`);
      return;
    }

    if (fields.RED_STATUS === 'already_green' || fields.RED_STATUS === 'failing_wrong_reason') {
      orchestrator.status = fields.RED_STATUS === 'already_green' ? 'already-green-audit' : 'red-arbitrating';
      orchestrator.red = {
        ...orchestrator.red,
        status: fields.RED_STATUS,
        testFile: fields.TEST_FILE,
        testTitle: fields.TEST_TITLE,
        failureSummary: fields.RED_FAILURE_SUMMARY,
      };
      ticket.status = orchestrator.status;
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = fields.RED_STATUS === 'already_green'
        ? `SDET reported already-green coverage. Dispatch reviewer already-green-audit via --next-task, then ingest reviewer output.`
        : `SDET reported wrong-reason RED. Dispatch reviewer red-arbitrate via --next-task, then ingest reviewer output.`;
      addCheck(report, 'run-ticket-phase', 'passed', `${phase} -> ${orchestrator.status}`);
      return;
    }

    if (fields.RED_STATUS !== 'failing_expected') {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `SDET RED returned unsupported status ${fields.RED_STATUS}.`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.RED_STATUS}`);
      return;
    }

    if (!runQualityGate(report, projectConfig, values, 'post-red gate')) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Quality gate failed after RED changes; fix the test integrity issue before GREEN.';
      return;
    }
    const redCommitSha = maybeCreateCommit(`test(tdd): red ${summary.id}`, configuredTestRoots(projectConfig), report, values);
    if (!redCommitSha) return;
    orchestrator.status = 'green-building';
    orchestrator.red = {
      ...orchestrator.red,
      status: fields.RED_STATUS,
      testFile: fields.TEST_FILE,
      testTitle: fields.TEST_TITLE,
      failureSummary: fields.RED_FAILURE_SUMMARY,
      afterRedCheckpointSha: values.afterRedCheckpointSha || redCommitSha,
    };
    orchestrator.lastCheckpointSha = values.afterRedCheckpointSha || redCommitSha;
    ticket.status = 'green-building';

    state.orchestrator = orchestrator;
    state.ticket = ticket;
    appendCheckpoint(state.checkpoints, values.afterRedCheckpointSha || redCommitSha);
    persistRuntimeState(state, report, values);
    persistCheckpointsState(state.checkpoints, values, report);
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `Validated SDET RED for ${summary.id}. Next capture developer GREEN output and rerun with --run-ticket --output-file <path>.`;
    addCheck(report, 'run-ticket-phase', 'passed', 'red-writing -> green-building');
    return;
  }

  if (phase === 'already-green-audit') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture reviewer already-green-audit output for ${summary.id}, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    const fields = validateWorkerOutputFile(report, 'reviewer', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Reviewer already-green output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    if (fields.REVIEW_VERDICT === 'coverage-approved') {
      if (!values.dryRun && !requireDirtyPathsWithin(report, configuredTestRoots(projectConfig), 'already-green-audit')) {
        blockOnExecutionWorktree(report, 'Only test-root changes are allowed before committing already-green coverage.');
        return;
      }
      if (!runQualityGate(report, projectConfig, values, 'already-green coverage gate')) {
        report.outcome = 'blocked';
        report.exitCode = 1;
        report.nextStep = 'Quality gate failed before already-green coverage completion.';
        return;
      }
      const coverageSha = maybeCreateCommit(`test(tdd): coverage ${summary.id}`, configuredTestRoots(projectConfig), report, values);
      if (!coverageSha) return;
      state.orchestrator.lastCheckpointSha = coverageSha;
      finalizeTicketComplete(state, summary, report, values);
      addCheck(report, 'run-ticket-phase', report.blockers.length ? 'failed' : 'passed', 'already-green-audit -> ticket-complete');
      return;
    }

    if (fields.REVIEW_VERDICT === 'coverage-rejected') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      orchestrator.status = 'red-arbitrating';
      ticket.status = 'red-arbitrating';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Reviewer rejected already-green coverage. Dispatch reviewer red-arbitrate or SDET repair via --next-task.`;
      addCheck(report, 'run-ticket-phase', 'passed', 'already-green-audit -> red-arbitrating');
      return;
    }

    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = `Reviewer verdict ${fields.REVIEW_VERDICT} is not valid for already-green-audit.`;
    addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.REVIEW_VERDICT}`);
    return;
  }

  if (phase === 'red-arbitrating') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture reviewer red-arbitrate output for ${summary.id}, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    const fields = validateWorkerOutputFile(report, 'reviewer', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Reviewer RED arbitration output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    const orchestrator = cloneState(state.orchestrator);
    const ticket = cloneState(state.ticket);
    if (fields.REVIEW_VERDICT === 'red-test-wrong') {
      orchestrator.status = 'red-writing';
      ticket.status = 'red-writing';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Reviewer found RED test wrong. Dispatch SDET RED repair via --next-task.`;
      addCheck(report, 'run-ticket-phase', 'passed', 'red-arbitrating -> red-writing');
      return;
    }

    if (fields.REVIEW_VERDICT === 'ticket-ambiguous') {
      orchestrator.status = 'blocked';
      ticket.status = 'blocked';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Reviewer found ticket ambiguity: ${fields.REASON}`;
      addCheck(report, 'run-ticket-phase', 'blocked', 'red-arbitrating -> blocked');
      return;
    }

    if (fields.REVIEW_VERDICT === 'red-approved') {
      if (!values.dryRun && !requireDirtyPathsWithin(report, configuredTestRoots(projectConfig), 'red-arbitrating')) {
        blockOnExecutionWorktree(report, 'Only test-root changes are allowed before committing reviewer-approved RED.');
        return;
      }
      if (!runQualityGate(report, projectConfig, values, 'reviewer-approved RED gate')) {
        report.outcome = 'blocked';
        report.exitCode = 1;
        report.nextStep = 'Quality gate failed after reviewer-approved RED changes; fix before GREEN.';
        return;
      }
      const redCommitSha = maybeCreateCommit(`test(tdd): red ${summary.id}`, configuredTestRoots(projectConfig), report, values);
      if (!redCommitSha) return;
      orchestrator.status = 'green-building';
      orchestrator.red = {
        ...orchestrator.red,
        afterRedCheckpointSha: redCommitSha,
      };
      orchestrator.lastCheckpointSha = redCommitSha;
      ticket.status = 'green-building';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      appendCheckpoint(state.checkpoints, redCommitSha);
      persistRuntimeState(state, report, values);
      persistCheckpointsState(state.checkpoints, values, report);
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Reviewer approved RED for ${summary.id}. Dispatch developer GREEN via --next-task.`;
      addCheck(report, 'run-ticket-phase', 'passed', 'red-arbitrating -> green-building');
      return;
    }

    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = `Reviewer verdict ${fields.REVIEW_VERDICT} is not valid for red-arbitrating.`;
    addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.REVIEW_VERDICT}`);
    return;
  }

  if (phase === 'green-building') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture the developer GREEN final message for ${summary.id} to a file, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    if (!values.dryRun && !requireDirtyPathsWithin(report, projectConfig.code_roots, 'green-building')) {
      blockOnExecutionWorktree(report, 'Only code-root changes are allowed before deterministic GREEN rerun.');
      return;
    }

    const fields = validateWorkerOutputFile(report, 'developer-green', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Developer GREEN output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    if (fields.GREEN_STATUS !== 'ready_for_green_rerun') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      if (fields.GREEN_STATUS === 'ticket-ambiguous' || fields.GREEN_STATUS === 'red-test-wrong') {
        orchestrator.status = 'red-arbitrating';
        ticket.status = 'red-arbitrating';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.outcome = 'partial';
        report.exitCode = 0;
        report.nextStep = `Developer returned ${fields.GREEN_STATUS}. Dispatch reviewer red-arbitrate via --next-task.`;
        addCheck(report, 'run-ticket-phase', 'passed', `green-building -> red-arbitrating`);
        return;
      }

      if (fields.GREEN_STATUS === 'blocked') {
        orchestrator.status = 'blocked';
        ticket.status = 'blocked';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.outcome = 'blocked';
        report.exitCode = 1;
        report.nextStep = `Developer GREEN blocked ${summary.id}: ${fields.ROOT_CAUSE}`;
        addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:blocked`);
        return;
      }

      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Developer GREEN returned unsupported status ${fields.GREEN_STATUS}.`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.GREEN_STATUS}`);
      return;
    }

    const orchestrator = cloneState(state.orchestrator);
    const ticket = cloneState(state.ticket);
    orchestrator.status = 'green-testing';
    orchestrator.green = {
      ...orchestrator.green,
      refactorNeeded: fields.REFACTOR_NEEDED === 'yes',
    };
    ticket.status = 'green-testing';

    state.orchestrator = orchestrator;
    state.ticket = ticket;
    persistRuntimeState(state, report, values);
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `Developer GREEN output validated. Next rerun the recorded test with node .opencode/scripts/workflow-runner.mjs --target ${summary.id} --run-ticket${values.dryRun ? ' --dry-run' : ''} --json.`;
    addCheck(report, 'run-ticket-phase', 'passed', 'green-building -> green-testing');
    return;
  }

  if (phase === 'green-testing') {
    if (!values.dryRun && !requireDirtyPathsWithin(report, projectConfig.code_roots, 'green-testing')) {
      blockOnExecutionWorktree(report, 'Only code-root changes are allowed while verifying and committing GREEN.');
      return;
    }
    runTicketGreenPhase(report, values, state, manifest, projectConfig);
    if (report.outcome === 'success') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      const greenCommitMessage = summary.ticketType === 'bug'
        ? `fix(tdd): green ${summary.id}`
        : `feat(tdd): green ${summary.id}`;
      const greenCommitSha = maybeCreateCommit(greenCommitMessage, projectConfig.code_roots, report, values);
      if (!greenCommitSha) return;
      orchestrator.green.greenCommitSha = greenCommitSha;
      orchestrator.lastCheckpointSha = greenCommitSha;

      if (orchestrator.green?.refactorNeeded && !orchestrator.green?.refactorUsed) {
        orchestrator.status = 'refactoring';
        ticket.status = 'refactoring';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.outcome = 'partial';
        report.exitCode = 0;
        report.nextStep = `GREEN rerun verified ${summary.id}. Capture developer refactor output and rerun with --run-ticket --output-file <path>.`;
        addCheck(report, 'run-ticket-phase', 'passed', 'green-testing -> refactoring');
        return;
      }

      state.orchestrator = orchestrator;
      state.ticket = ticket;
      if (skipReviewerEligible(orchestrator, projectConfig, report, values)) {
        finalizeTicketComplete(state, summary, report, values);
        addCheck(report, 'run-ticket-phase', report.blockers.length ? 'failed' : 'passed', 'green-testing -> ticket-complete');
      } else {
        if (!runQualityGate(report, projectConfig, values, 'final-review gate')) {
          report.outcome = 'blocked';
          report.exitCode = 1;
          report.nextStep = 'Quality gate failed before final-review; fix the integrity issue before reviewer audit.';
          addCheck(report, 'run-ticket-phase', 'blocked', 'green-testing -> final-review gate failed');
          return;
        }
        orchestrator.status = 'final-review';
        ticket.status = 'final-review';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.outcome = 'partial';
        report.exitCode = 0;
        report.nextStep = `GREEN rerun verified ${summary.id}. Next capture reviewer final output and rerun with --run-ticket --output-file <path>.`;
        addCheck(report, 'run-ticket-phase', 'passed', 'green-testing -> final-review');
      }
    } else if (report.outcome === 'partial') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      const nextIteration = Number(orchestrator.iteration || 0) + 1;
      if (nextIteration >= Number(orchestrator.maxIterations || 4)) {
        orchestrator.iteration = nextIteration;
        orchestrator.status = 'escalated';
        ticket.status = 'escalated';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.outcome = 'blocked';
        report.exitCode = 1;
        report.nextStep = `GREEN rerun is still open after ${nextIteration} iteration(s). Escalate the ticket; maxIterations reached.`;
        addCheck(report, 'run-ticket-phase', 'blocked', 'green-testing -> escalated');
      } else {
        orchestrator.iteration = nextIteration;
        orchestrator.status = 'green-building';
        ticket.status = 'green-building';
        state.orchestrator = orchestrator;
        state.ticket = ticket;
        persistRuntimeState(state, report, values);
        report.nextStep = `GREEN rerun is still open. Ticket ${summary.id} returned to green-building for iteration ${nextIteration}; capture fresh developer GREEN output and rerun with --run-ticket --output-file <path>.`;
        addCheck(report, 'run-ticket-phase', 'passed', 'green-testing -> green-building');
      }
    } else {
      addCheck(report, 'run-ticket-phase', 'blocked', phase);
    }
    return;
  }

  if (phase === 'refactoring') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture the developer refactor final message for ${summary.id} to a file, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    if (!values.dryRun && !requireDirtyPathsWithin(report, projectConfig.code_roots, 'refactoring')) {
      blockOnExecutionWorktree(report, 'Only code-root changes are allowed before committing refactor work.');
      return;
    }

    const fields = validateWorkerOutputFile(report, 'developer-refactor', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Developer refactor output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    if (fields.GREEN_STATUS !== 'refactor_ready_for_green_rerun') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      orchestrator.status = 'blocked';
      ticket.status = 'blocked';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Developer refactor returned ${fields.GREEN_STATUS}; runner blocked the ticket.`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.GREEN_STATUS}`);
      return;
    }

    const orchestrator = cloneState(state.orchestrator);
    const ticket = cloneState(state.ticket);
    const refactorCommitSha = maybeCreateCommit(`refactor(tdd): ${summary.id}`, projectConfig.code_roots, report, values);
    if (!refactorCommitSha) return;
    orchestrator.status = 'green-testing';
    orchestrator.green = {
      ...orchestrator.green,
      refactorUsed: true,
      refactorCommitSha,
    };
    orchestrator.lastCheckpointSha = refactorCommitSha;
    ticket.status = 'green-testing';

    state.orchestrator = orchestrator;
    state.ticket = ticket;
    persistRuntimeState(state, report, values);
    report.outcome = 'partial';
    report.exitCode = 0;
    report.nextStep = `Developer refactor output validated. Next rerun the recorded test with node .opencode/scripts/workflow-runner.mjs --target ${summary.id} --run-ticket${values.dryRun ? ' --dry-run' : ''} --json.`;
    addCheck(report, 'run-ticket-phase', 'passed', 'refactoring -> green-testing');
    return;
  }

  if (phase === 'final-review') {
    if (!values.outputFile) {
      report.outcome = 'partial';
      report.exitCode = 0;
      report.nextStep = `Capture the reviewer final message for ${summary.id} to a file, then rerun with --run-ticket --output-file <path>.`;
      return;
    }

    if (!values.dryRun && !requireCleanExecutionWorktree(report, 'final-review completion')) {
      blockOnExecutionWorktree(report, 'Clean the worktree before applying final-review completion.');
      return;
    }

    const fields = validateWorkerOutputFile(report, 'reviewer', values.outputFile, summary);
    if (!fields) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = 'Reviewer output failed deterministic validation.';
      addCheck(report, 'run-ticket-phase', 'failed', phase);
      return;
    }

    if (!new Set(['approved', 'rejected']).has(fields.REVIEW_VERDICT)) {
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Reviewer verdict ${fields.REVIEW_VERDICT} is outside deterministic final-review handling.`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.REVIEW_VERDICT}`);
      return;
    }

    if (fields.REVIEW_VERDICT !== 'approved') {
      const orchestrator = cloneState(state.orchestrator);
      const ticket = cloneState(state.ticket);
      orchestrator.status = 'blocked';
      ticket.status = 'blocked';
      state.orchestrator = orchestrator;
      state.ticket = ticket;
      persistRuntimeState(state, report, values);
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = `Reviewer returned ${fields.REVIEW_VERDICT}; runner blocked the ticket for explicit repair.`;
      addCheck(report, 'run-ticket-phase', 'blocked', `${phase}:${fields.REVIEW_VERDICT}`);
      return;
    }

    finalizeTicketComplete(state, summary, report, values);
    addCheck(report, 'run-ticket-phase', report.blockers.length ? 'failed' : 'passed', 'final-review -> ticket-complete');
    return;
  }

  report.outcome = 'blocked';
  report.exitCode = 1;
  report.nextStep = `Runtime phase ${phase} is not part of the deterministic runner path yet. Block and extend the runner before dispatching more worker tasks.`;
  addCheck(report, 'run-ticket-phase', 'blocked', phase);
}

function readPlanTickets(planId, report) {
  const ticketsDir = path.join(root, 'docs', 'tickets');

  if (!exists(ticketsDir)) {
    report.blockers.push('docs/tickets is missing');
    return [];
  }

  const tickets = [];
  for (const entry of fs.readdirSync(ticketsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const id = entry.name.replace(/\.md$/, '');
    const parsed = parseFrontmatter(path.join(ticketsDir, entry.name));
    if (!parsed.ok) {
      report.warnings.push(parsed.error);
      continue;
    }
    if (parsed.data.plan_id === planId) {
      tickets.push({ id, file: `docs/tickets/${entry.name}`, frontmatter: parsed.data });
    }
  }

  return tickets.sort(compareTickets);
}

function validatePlan(planId, manifest, report) {
  const filePath = planPath(planId);
  const parsed = parseFrontmatter(filePath);

  if (!parsed.ok) {
    report.blockers.push(parsed.error);
    addCheck(report, 'plan-load', 'failed', parsed.error);
    return null;
  }

  const fm = parsed.data;
  if (fm.id !== planId) report.blockers.push(`Plan frontmatter id ${fm.id ?? 'missing'} does not match ${planId}`);
  if (!PLAN_STATUSES.has(fm.status)) report.blockers.push(`Plan ${planId} has invalid status ${fm.status ?? 'missing'}`);

  const tickets = readPlanTickets(planId, report);
  const counts = Object.fromEntries([...TICKET_STATUSES].map(status => [status, 0]));
  for (const ticket of tickets) {
    const status = ticket.frontmatter.status;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  }

  const missingManifest = tickets
    .filter(ticket => EXECUTABLE_TYPES.has(ticket.frontmatter.type))
    .filter(ticket => !manifest?.test_cases?.[ticket.frontmatter.test_case_id])
    .map(ticket => `${ticket.id}:${ticket.frontmatter.test_case_id}`);

  if (missingManifest.length) {
    report.blockers.push(`Plan ${planId} has executable tickets missing manifest entries: ${missingManifest.join(', ')}`);
  }

  const reviewTicket = tickets.find(ticket => ticket.frontmatter.status === 'review');
  const readyTicket = tickets.find(ticket => ticket.frontmatter.status === 'ready' && EXECUTABLE_TYPES.has(ticket.frontmatter.type));
  const inProgressTicket = tickets.find(ticket => ticket.frontmatter.status === 'in_progress' && EXECUTABLE_TYPES.has(ticket.frontmatter.type));
  const planBranch = `tdd/${planId}`;
  const completedExecutableTickets = tickets.filter(ticket => ticket.frontmatter.status === 'complete' && EXECUTABLE_TYPES.has(ticket.frontmatter.type));
  const pendingIntegrationTickets = completedExecutableTickets
    .map(ticket => {
      const branch = `tdd/${ticket.id}`;
      const merged = branchMergedInto(branch, planBranch);
      return { ticketId: ticket.id, branch, mergedIntoPlan: merged };
    })
    .filter(item => item.mergedIntoPlan !== true);

  report.targetSummary = {
    type: 'plan',
    id: planId,
    file: rel(filePath),
    status: fm.status ?? null,
    ticketCounts: counts,
    ticketTotal: tickets.length,
    nextReviewTicket: reviewTicket?.id ?? null,
    nextReadyTicket: readyTicket?.id ?? null,
    inProgressTicket: inProgressTicket?.id ?? null,
    planBranch,
    pendingIntegrationTickets,
  };

  addCheck(report, 'plan-load', 'passed', rel(filePath));
  addCheck(report, 'plan-contract', report.blockers.length ? 'checked' : 'passed', `${tickets.length} ticket(s)`);
  if (pendingIntegrationTickets.length) {
    addCheck(report, 'plan-integration', 'warning', `${pendingIntegrationTickets.length} completed ticket branch(es) not confirmed integrated`);
  } else {
    addCheck(report, 'plan-integration', 'passed', 'no pending completed ticket branches detected');
  }
  return { frontmatter: fm, tickets, reviewTicket, readyTicket, inProgressTicket };
}

function activeRunBlocksTarget(target, type, runtime, report) {
  if (!runtime || runtime.status === 'idle' || runtime.status === 'ticket-complete' || runtime.status === 'plan-complete') return;

  if (type === 'ticket' && runtime.currentTicket && runtime.currentTicket !== target) {
    report.blockers.push(`Runtime state has active ticket ${runtime.currentTicket} in phase ${runtime.status}; do not start ${target} until the active run is reconciled.`);
  }

  if (type === 'plan' && runtime.currentPlan && runtime.currentPlan !== target) {
    report.blockers.push(`Runtime state has active plan ${runtime.currentPlan} in phase ${runtime.status}; do not start ${target} until the active run is reconciled.`);
  }
}

function runGreenRerun(report, values, state, manifest, projectConfig) {
  const runtime = state.orchestrator;
  const summary = report.targetSummary;

  if (report.targetType !== 'ticket') {
    report.blockers.push('--run-green requires --target TICKET-YYYYMMDD-NNN.');
  }

  if (!summary?.testCaseId) {
    report.blockers.push('Cannot run GREEN rerun without a ticket test_case_id.');
  }

  if (!runtime || runtime.currentTicket !== values.target || runtime.currentTestCase !== summary?.testCaseId) {
    report.blockers.push(`Runtime state must point at active ticket ${values.target} and test case ${summary?.testCaseId || 'unknown'} before GREEN rerun.`);
  }

  if (runtime?.status !== 'green-testing') {
    report.blockers.push(`Deterministic GREEN rerun is allowed only in green-testing; runtime status is ${runtime?.status || 'unknown'}.`);
  }

  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Blocked. Resolve GREEN rerun blockers before returning to developer GREEN, refactor, or final review.';
    return;
  }

  const recorded = summary?.testCaseId
    ? resolveRecordedTest(values, runtime, values.target, summary.testCaseId, manifest, report)
    : null;
  const validated = recorded && projectConfig
    ? validateRecordedTest(recorded, summary.testCaseId, projectConfig, report)
    : null;

  if (validated) checkRecordedTestUnchanged(validated, runtime, report);

  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.exitCode = 1;
    report.nextStep = 'Blocked. Resolve GREEN rerun blockers before returning to developer GREEN, refactor, or final review.';
    return;
  }

  const command = buildGreenRerunCommand(validated);
  report.greenRerun = {
    testCaseStatus: values.dryRun ? 'not_run' : null,
    testFile: validated.repoPath,
    testTitle: validated.title,
    testCommand: command.display,
    recordedTestSource: validated.source,
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    failureSummary: values.dryRun ? 'not run - dry-run' : null,
    exitCode: null,
  };

  if (values.dryRun) {
    report.outcome = 'ready';
    report.exitCode = 0;
    report.nextStep = `Dry run only. Would execute recorded GREEN rerun: ${command.display}`;
    return;
  }

  const result = runCapture(command.command, command.args, { cwd: command.cwd });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const counts = parsePlaywrightCounts(output);
  const status = classifyGreenResult(result, counts, output);
  const testsRun = counts.run ?? 0;
  const testsPassed = counts.run === null ? 0 : counts.passed;
  const testsFailed = status === 'verified' ? 0 : Math.max(counts.failed + counts.flaky, result.ok ? 0 : 1);

  report.greenRerun = {
    ...report.greenRerun,
    testCaseStatus: status,
    testsRun,
    testsPassed,
    testsFailed,
    failureSummary: summarizeFailure(output, status),
    exitCode: result.status,
  };

  if (status === 'verified') {
    report.outcome = 'success';
    report.exitCode = 0;
    report.nextStep = 'Recorded RED test verified. Ensure GREEN/refactor changes are committed before final-review.';
    addCheck(report, 'green-rerun', 'passed', command.display);
    return;
  }

  if (status === 'open') {
    report.outcome = 'partial';
    report.exitCode = 1;
    report.nextStep = 'Recorded RED test is still open. Increment iteration and return to developer GREEN if below maxIterations.';
    addCheck(report, 'green-rerun', 'failed', command.display);
    return;
  }

  report.outcome = 'blocked';
  report.exitCode = 1;
  report.nextStep = 'GREEN rerun could not execute the recorded test reliably. Treat as setup/test-runner block, not product GREEN failure.';
  addCheck(report, 'green-rerun', 'blocked', command.display);
}

function chooseNextStep(report, type, target, planAnalysis = null) {
  const runtime = report.runtime;

  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.nextStep = 'Blocked. Resolve blockers before invoking SDET, developer, reviewer, or runner execution.';
    return;
  }

  if (type === 'ticket') {
    const summary = report.targetSummary;

    if (summary.status === 'complete') {
      report.outcome = 'complete';
      report.nextStep = `Ticket ${target} is already complete; no execution needed.`;
      return;
    }

    if (runtime?.currentTicket === target && runtime.status !== 'idle') {
      report.outcome = 'ready';
      if (runtime.status === 'green-testing') {
        report.nextStep = `Resume ${target} at green-testing with deterministic GREEN rerun: node .opencode/scripts/workflow-runner.mjs --target ${target} --run-green --json`;
      } else {
        report.nextStep = `Resume ${target} at deterministic phase ${runtime.status}. Use --next-task when a worker is needed or --run-ticket for no-worker phases.`;
      }
      return;
    }

    if (summary.status === 'review') {
      report.outcome = 'ready';
      report.nextStep = `Would run ticket-audit for ${target}; reviewer remains required for review-status ticket ambiguity in this preview slice.`;
      return;
    }

    if (summary.status === 'ready' || summary.status === 'in_progress') {
      report.outcome = 'ready';
      report.nextStep = `Would start strict TDD for ${target}: run --run-ticket to create the pre-red checkpoint, then use --next-task for SDET RED.`;
      return;
    }

    report.outcome = 'blocked';
    report.nextStep = `Ticket ${target} status ${summary.status} is not runnable.`;
    return;
  }

  const summary = report.targetSummary;

  if (summary.status === 'complete') {
    report.outcome = 'complete';
    report.nextStep = `Plan ${target} is already complete; no execution needed.`;
    return;
  }

  if (runtime?.currentPlan === target && runtime.currentTicket && runtime.status !== 'idle') {
    report.outcome = 'ready';
    if (runtime.status === 'green-testing') {
      report.nextStep = `Resume plan ${target} at active ticket ${runtime.currentTicket} with deterministic GREEN rerun: node .opencode/scripts/workflow-runner.mjs --target ${runtime.currentTicket} --run-green --json`;
    } else {
      report.nextStep = `Resume plan ${target} at active ticket ${runtime.currentTicket}, phase ${runtime.status}. Use --next-task when a worker is needed or --run-plan for no-worker phases.`;
    }
    return;
  }

  if (planAnalysis?.reviewTicket) {
    report.outcome = 'ready';
    report.nextStep = `Would audit review ticket ${planAnalysis.reviewTicket.id} before executable tickets.`;
    return;
  }

  if (planAnalysis?.readyTicket) {
    report.outcome = 'ready';
    report.nextStep = `Would select ready executable ticket ${planAnalysis.readyTicket.id} for strict TDD.`;
    return;
  }

  if (summary.ticketTotal > 0 && summary.ticketCounts.complete === summary.ticketTotal) {
    if (summary.pendingIntegrationTickets?.length) {
      report.outcome = 'blocked';
      report.nextStep = `Completed ticket branches must be explicitly integrated into ${summary.planBranch} before deterministic regression-gating: ${summary.pendingIntegrationTickets.map(item => item.ticketId).join(', ')}.`;
      return;
    }

    report.outcome = 'ready';
    report.nextStep = `All plan tickets are complete; would enter deterministic regression-gating for ${target}.`;
    return;
  }

  report.outcome = 'blocked';
  report.nextStep = `No runnable review or ready executable tickets found for ${target}.`;
}

function buildReport(values) {
  const report = {
    runner: 'workflow-runner',
    mode: values.ingestWorkerOutput
      ? 'ingest-worker-output'
      : values.nextTask
        ? 'next-task'
      : values.reconcile
        ? 'reconcile'
      : values.validateWorkerOutput
      ? 'worker-output-validation'
      : values.runTicket
        ? (values.dryRun ? 'run-ticket-dry-run' : 'run-ticket')
      : values.runPlan
        ? (values.dryRun ? 'run-plan-dry-run' : 'run-plan')
      : values.runGreen
        ? (values.dryRun ? 'green-rerun-dry-run' : 'green-rerun')
        : (values.dryRun ? 'dry-run' : 'preflight'),
    target: values.target,
    targetType: null,
    outcome: 'status',
    exitCode: null,
    blockers: [],
    warnings: [],
    checks: [],
    git: null,
    manifest: null,
    runtime: null,
    targetSummary: null,
    greenRerun: null,
    workerOutput: null,
    nextTask: null,
    planExecution: null,
    reconciliation: null,
    telemetry: null,
    nextStep: null,
    notes: values.ingestWorkerOutput
      ? [
          'Runner-owned worker-output ingestion: validates one captured worker final message and advances the selected ticket or plan phase when the deterministic path supports it.',
          'This is an alias for the target-appropriate run-ticket or run-plan phase advancement path.',
        ]
      : values.nextTask ? [
          'Runner-owned task emission: returns exactly one next worker task payload and invokes no subagents.',
          'Dispatch remains external; the emitted payload is the handoff contract.',
        ]
      : values.reconcile ? [
          'Deterministic state reconciliation: compares durable plan, ticket, runtime, checkpoint, and lease ledgers without invoking subagents.',
        ]
      : values.validateWorkerOutput
      ? [
          'Deterministic worker-output validation: parses one worker final message and validates its contract without invoking subagents.',
          'This slice validates contract shape and ticket/test-case alignment only; it does not yet execute ticket FSM phases.',
        ]
      : values.runTicket ? [
          'Deterministic run-ticket mode: advances one ticket phase at a time using runtime state, captured worker output, git checkpoints/commits, quality gates, and deterministic GREEN reruns.',
          'Worker dispatch remains external; --next-task emits payloads and captured worker outputs are ingested by the runner.',
        ]
      : values.runPlan ? [
          'Deterministic run-plan mode: sequences review/ready tickets for one plan, reuses the deterministic ticket runner, and gates completion on impacted-spec regression.',
          'Worker dispatch still remains external to the runner; captured worker outputs are the contract boundary for review and ticket execution.',
        ]
      : values.runGreen ? [
          'Deterministic GREEN rerun: no SDET subagent invoked and no files modified.',
          'Dirty implementation changes are allowed only for this targeted verification mode.',
        ] : [
          'Read-only preview: no subagents invoked and no files modified.',
          'Use --next-task when a worker handoff is needed and --ingest-worker-output after capturing the worker final message.',
        ],
  };

  checkProjectRoot(report);
  const projectConfig = checkProjectConfig(report);
  const executionTarget = Boolean(values.target && (values.runGreen || values.runTicket || values.runPlan || values.ingestWorkerOutput));
  checkWorktree(report, executionTarget, values.runGreen, Boolean(values.runTicket || values.runPlan || values.ingestWorkerOutput));
  const manifest = checkManifest(report, Boolean(values.target));
  const state = checkRuntimeState(report);
  if (state?.checkpoints) state.checkpoints = state.checkpoints;
  const strictReconciliation = Boolean(values.reconcile || values.runTicket || values.runPlan || values.runGreen || values.nextTask || values.ingestWorkerOutput);
  runReconciliation(report, state, values, strictReconciliation);

  if (values.reconcile && !values.target) {
    const blockingCount = report.reconciliation?.blockingItemCount ?? report.reconciliation?.blockerCount ?? 0;
    report.outcome = blockingCount ? 'blocked' : 'success';
    report.exitCode = blockingCount ? 1 : 0;
    report.nextStep = report.reconciliation?.blockerCount
      ? 'Resolve reconciliation blockers before executable workflow dispatch.'
      : 'State reconciliation passed. Provide --target PLAN-* or --target TICKET-* for item-specific preflight.';
    return report;
  }

  if (!values.target) {
    if (values.runGreen || values.validateWorkerOutput || values.runTicket || values.runPlan || values.nextTask || values.ingestWorkerOutput) {
      const missingTargetMode = values.runGreen
        ? '--run-green'
        : values.validateWorkerOutput
          ? '--validate-worker-output'
          : values.nextTask
            ? '--next-task'
            : values.ingestWorkerOutput
              ? '--ingest-worker-output'
              : values.runTicket
                ? '--run-ticket'
                : '--run-plan';
      report.blockers.push(`${missingTargetMode} requires --target ${values.runPlan ? 'PLAN-YYYYMMDD-name' : 'TICKET-YYYYMMDD-NNN'}.`);
      report.outcome = 'blocked';
      report.exitCode = 1;
      report.nextStep = values.runGreen
        ? 'Provide --target TICKET-* to run deterministic GREEN rerun.'
        : values.validateWorkerOutput
          ? 'Provide --target TICKET-* to validate worker output.'
          : values.nextTask
            ? 'Provide --target PLAN-* or TICKET-* to emit the next worker task.'
            : values.ingestWorkerOutput
              ? 'Provide --target PLAN-* or TICKET-* to ingest worker output.'
              : values.runTicket
                ? 'Provide --target TICKET-* to run one deterministic ticket phase.'
                : 'Provide --target PLAN-* to run deterministic plan execution.';
      return report;
    }

    report.nextStep = 'Provide --target PLAN-* or --target TICKET-* to run deterministic preflight for a workflow item.';
    if (report.blockers.length) report.outcome = 'blocked';
    return report;
  }

  const type = targetType(values.target);
  report.targetType = type;

  if (!type) {
    report.blockers.push(`Invalid target ${values.target}; expected PLAN-YYYYMMDD-name or TICKET-YYYYMMDD-NNN.`);
    report.outcome = 'blocked';
    report.nextStep = 'Blocked. Use a valid plan or ticket id.';
    return report;
  }

  activeRunBlocksTarget(values.target, type, state.orchestrator, report);

  let planAnalysis = null;
  if (type === 'ticket') {
    const ticket = loadTicket(values.target, report);
    if (ticket) validateTicket(ticket, manifest, report);
  } else {
    planAnalysis = validatePlan(values.target, manifest, report);
  }

  if (values.reconcile) {
    const blockingCount = report.reconciliation?.blockingItemCount ?? report.reconciliation?.blockerCount ?? 0;
    report.outcome = blockingCount ? 'blocked' : 'success';
    report.exitCode = blockingCount ? 1 : 0;
    report.nextStep = blockingCount
      ? `Resolve reconciliation blockers before running ${values.target}.`
      : `State reconciliation passed for ${values.target}.`;
    return report;
  }

  if (values.nextTask) {
    emitNextTask(report, values, state, manifest, planAnalysis);
    return report;
  }

  if (values.ingestWorkerOutput) {
    state.checkpoints = readJson(path.join(root, '.opencode', 'state', 'checkpoints.json')).value || { schemaVersion: 2, checkpoints: [] };
    if (type === 'ticket') runTicket(report, values, state, manifest, projectConfig);
    else runPlan(report, values, state, manifest, projectConfig, planAnalysis);
    return report;
  }

  if (values.runGreen) {
    runGreenRerun(report, values, state, manifest, projectConfig);
    return report;
  }

  if (values.runTicket) {
    state.checkpoints = readJson(path.join(root, '.opencode', 'state', 'checkpoints.json')).value || { schemaVersion: 2, checkpoints: [] };
    runTicket(report, values, state, manifest, projectConfig);
    return report;
  }

  if (values.runPlan) {
    state.checkpoints = readJson(path.join(root, '.opencode', 'state', 'checkpoints.json')).value || { schemaVersion: 2, checkpoints: [] };
    runPlan(report, values, state, manifest, projectConfig, planAnalysis);
    return report;
  }

  if (values.validateWorkerOutput) {
    validateWorkerOutput(report, values, report.targetSummary);
    return report;
  }

  chooseNextStep(report, type, values.target, planAnalysis);
  return report;
}

function printText(report) {
  console.log('Workflow Runner Preview');
  console.log(`MODE: ${report.mode}`);
  console.log(`OUTCOME: ${report.outcome}`);
  console.log(`TARGET: ${report.target || 'none'}`);
  console.log(`TARGET_TYPE: ${report.targetType || 'none'}`);

  if (report.runtime) {
    console.log(`RUNTIME: ${report.runtime.status} plan=${report.runtime.currentPlan || 'none'} ticket=${report.runtime.currentTicket || 'none'}`);
  }

  if (report.targetSummary) {
    console.log(`TARGET_STATUS: ${report.targetSummary.status || 'unknown'}`);
    if (report.targetSummary.testCaseId) console.log(`TEST_CASE_ID: ${report.targetSummary.testCaseId}`);
    if (report.targetSummary.nextReadyTicket) console.log(`NEXT_READY_TICKET: ${report.targetSummary.nextReadyTicket}`);
    if (report.targetSummary.nextReviewTicket) console.log(`NEXT_REVIEW_TICKET: ${report.targetSummary.nextReviewTicket}`);
    if (report.targetSummary.pendingIntegrationTickets?.length) console.log(`PENDING_INTEGRATION: ${report.targetSummary.pendingIntegrationTickets.map(item => item.ticketId).join(', ')}`);
  }

  if (report.greenRerun) {
    console.log(`TEST_CASE_STATUS: ${report.greenRerun.testCaseStatus}`);
    console.log(`TEST_FILE: ${report.greenRerun.testFile}`);
    console.log(`TEST_TITLE: ${report.greenRerun.testTitle}`);
    console.log(`TEST_COMMAND: ${report.greenRerun.testCommand}`);
    console.log(`TESTS_RUN: ${report.greenRerun.testsRun}`);
    console.log(`TESTS_PASSED: ${report.greenRerun.testsPassed}`);
    console.log(`TESTS_FAILED: ${report.greenRerun.testsFailed}`);
    console.log(`FAILURE_SUMMARY: ${report.greenRerun.failureSummary}`);
  }

  if (report.workerOutput) {
    console.log(`WORKER_OUTPUT_KIND: ${report.workerOutput.kind}`);
    console.log(`WORKER_OUTPUT_FILE: ${report.workerOutput.file}`);
    console.log(`WORKER_OUTPUT_FIELDS: ${report.workerOutput.parsedFields.join(', ') || 'none'}`);
  }

  if (report.nextTask) {
    console.log(`NEXT_TASK_ROLE: ${report.nextTask.role}`);
    console.log(`NEXT_TASK_MODE: ${report.nextTask.mode}`);
    console.log(`NEXT_TASK_DESCRIPTION: ${report.nextTask.task.description}`);
  }

  if (report.reconciliation) {
    console.log(`RECONCILIATION: ${report.reconciliation.status} blockers=${report.reconciliation.blockerCount} target_blocking=${report.reconciliation.blockingItemCount} warnings=${report.reconciliation.warningCount}`);
  }

  if (report.telemetry) {
    console.log(`TELEMETRY: ${report.telemetry.written ? report.telemetry.path : 'not-written'}`);
  }

  console.log('');
  console.log('CHECKS:');
  for (const check of report.checks) {
    console.log(`- ${check.name}: ${check.status}${check.detail ? ` - ${check.detail}` : ''}`);
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

  if (report.notes.length) {
    console.log('');
    console.log('NOTES:');
    for (const note of report.notes) console.log(`- ${note}`);
  }
}

try {
  const startedAt = new Date().toISOString();
  const values = parseArgs(process.argv.slice(2));

  if (values.help) {
    console.log(usage());
    process.exit(0);
  }

  const report = buildReport(values);
  writeRunTelemetry(report, values, startedAt);

  if (values.json) console.log(JSON.stringify(report, null, 2));
  else printText(report);

  process.exit(Number.isInteger(report.exitCode) ? report.exitCode : (report.blockers.length ? 1 : 0));
} catch (error) {
  console.error(error.message);
  console.error('');
  console.error(usage());
  process.exit(2);
}
