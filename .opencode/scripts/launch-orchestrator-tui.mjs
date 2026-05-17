import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const values = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      values[key] = true;
      continue;
    }

    values[key] = next;
    index += 1;
  }

  return values;
}

function ensureProjectRoot(repoRoot) {
  const configPath = path.join(repoRoot, '.opencode', 'opencode.json');
  if (!fs.existsSync(configPath)) {
    fail(`OpenCode project root not found: ${repoRoot}`);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  return result;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readStatusFromFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const statusMatch = match[1].match(/^status:\s*(\S+)$/m);
  return statusMatch ? statusMatch[1] : null;
}

function readWorkflowModelConfig(repoRoot) {
  const filePath = path.join(repoRoot, '.opencode', 'workflow-models.json');
  const config = readJson(filePath);

  if (!config?.roles) {
    fail(`Workflow model config missing or invalid: ${filePath}`);
  }

  return config;
}

function listAvailableModels(repoRoot) {
  const result = runCapture('opencode', ['models'], { cwd: repoRoot });
  if (result.status !== 0) {
    fail(`Failed to list OpenCode models:\n${result.stderr || result.stdout}`);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function resolvePreferredModel(priorities, availableModels) {
  return priorities.find((model) => availableModels.includes(model)) || null;
}

function buildModelSummary(repoRoot) {
  const config = readWorkflowModelConfig(repoRoot);
  const availableModels = listAvailableModels(repoRoot);
  const resolved = {};

  for (const [role, priorities] of Object.entries(config.roles)) {
    resolved[role] = {
      priorities,
      selected: resolvePreferredModel(priorities, availableModels),
    };
  }

  return {
    availableModels,
    roles: resolved,
  };
}

function printModelSummary(repoRoot, format = 'text') {
  const summary = buildModelSummary(repoRoot);

  if (format === 'json') {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log('Available models:');
  for (const model of summary.availableModels) {
    console.log(`- ${model}`);
  }

  console.log('');
  console.log('Workflow defaults by role:');
  for (const [role, data] of Object.entries(summary.roles)) {
    const selected = data.selected || 'none available';
    console.log(`- ${role}: ${selected} (priority: ${data.priorities.join(' -> ')})`);
  }
}

function validateTarget(target) {
  if (/^PLAN-\d{8}-[A-Za-z0-9-]+$/.test(target)) return 'plan';
  if (/^TICKET-\d{8}-\d{3}$/.test(target)) return 'ticket';
  fail(`Invalid orchestrator target: ${target}`);
}

function ensureTargetExists(repoRoot, target, targetType) {
  const targetPath = targetType === 'ticket'
    ? path.join(repoRoot, 'docs', 'tickets', `${target}.md`)
    : path.join(repoRoot, 'docs', 'plans', `${target}.md`);

  if (!fs.existsSync(targetPath)) {
    fail(`Target file not found: ${targetPath}`);
  }
}

function buildTitle(target) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
  return `orchestrator-${target}-${timestamp}`;
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function resolveSelectedModel(repoRoot, explicitModel) {
  const summary = buildModelSummary(repoRoot);

  if (explicitModel) {
    if (!summary.availableModels.includes(explicitModel)) {
      fail(`Requested model is not available: ${explicitModel}`);
    }

    return {
      summary,
      selectedModel: explicitModel,
      selectedFromPriority: false,
    };
  }

  const orchestratorModel = summary.roles.orchestrator?.selected;
  if (!orchestratorModel) {
    fail('No available model matches the orchestrator priority list in .opencode/workflow-models.json');
  }

  return {
    summary,
    selectedModel: orchestratorModel,
    selectedFromPriority: true,
  };
}

function resolveSessionByTitle(repoRoot, title) {
  const result = runCapture('opencode', ['session', 'list'], { cwd: repoRoot });
  if (result.status !== 0) return null;

  const lines = result.stdout.split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    if (line.startsWith('Session ID') || /^[-\u2500]+$/.test(line.trim())) continue;
    if (!line.includes(title)) continue;

    const match = line.match(/^(\S+)\s{2,}(.*?)\s{2,}.*$/);
    if (match && match[2] === title) {
      return { id: match[1], title: match[2] };
    }
  }

  return null;
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function findSessionWithRetries(repoRoot, title, attempts = 3, delayMilliseconds = 500) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const session = resolveSessionByTitle(repoRoot, title);
    if (session) return session;
    if (attempt < attempts - 1) sleep(delayMilliseconds);
  }

  return null;
}

function deleteSession(repoRoot, sessionId) {
  const result = spawnSync('opencode', ['session', 'delete', sessionId], {
    cwd: repoRoot,
    stdio: 'inherit',
    windowsHide: false,
  });

  return !result.error && result.status === 0;
}

function targetIsComplete(repoRoot, target, targetType) {
  const orchestratorState = readJson(path.join(repoRoot, '.opencode', 'state', 'orchestrator-progress.json'));
  const ticketState = readJson(path.join(repoRoot, '.opencode', 'state', 'ticket-progress.json'));

  if (targetType === 'ticket') {
    const ticketStatus = readStatusFromFrontmatter(path.join(repoRoot, 'docs', 'tickets', `${target}.md`));
    if (ticketStatus === 'complete') return true;
    if (ticketState?.currentTicket === target && ticketState?.status === 'ticket-complete') return true;
    return false;
  }

  const planStatus = readStatusFromFrontmatter(path.join(repoRoot, 'docs', 'plans', `${target}.md`));
  if (planStatus === 'complete') return true;
  if (orchestratorState?.currentPlan === target && orchestratorState?.status === 'plan-complete') return true;
  return false;
}

function buildWorkflowModelEnv(summary) {
  return {
    OPENCODE_WORKFLOW_MODEL_DEVELOPER: summary.roles.developer?.selected || '',
    OPENCODE_WORKFLOW_MODEL_SDET: summary.roles.sdet?.selected || '',
    OPENCODE_WORKFLOW_MODEL_ORCHESTRATOR: summary.roles.orchestrator?.selected || '',
    OPENCODE_WORKFLOW_MODEL_REVIEWER: summary.roles.reviewer?.selected || '',
  };
}

function launchWindow(repoRoot, target, title, selectedModel, summary) {
  const manualCommand = `opencode run --interactive --title "${title}" --model "${selectedModel}" --command engineering/orchestrator --dir "${repoRoot}" "${target}"`;

  if (process.platform !== 'win32') {
    fail(`Coordinator TUI launching currently supports Windows only. Run this manually: ${manualCommand}`);
  }

  const wtCheck = runCapture('where.exe', ['wt.exe'], { cwd: repoRoot });
  if (wtCheck.status !== 0) {
    fail(`Windows Terminal (wt.exe) is not available. Run this manually: ${manualCommand}`);
  }

  const command = `& ${psQuote(process.execPath)} ${psQuote(scriptPath)} --mode run --repo-root ${psQuote(repoRoot)} --target ${psQuote(target)} --title ${psQuote(title)} --model ${psQuote(selectedModel)}`;
  const args = [
    '-w',
    'new',
    'new-tab',
    '--title',
    title,
    '--startingDirectory',
    repoRoot,
    'powershell.exe',
    '-NoExit',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    command,
  ];

  const child = spawn('wt.exe', args, {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
    env: {
      ...process.env,
      ...buildWorkflowModelEnv(summary),
    },
  });

  child.unref();

  console.log('Launched orchestrator TUI in a new window.');
  console.log(`TARGET: ${target}`);
  console.log(`TITLE: ${title}`);
  console.log(`MODEL: ${selectedModel}`);
  console.log(`COMMAND: ${manualCommand}`);
  console.log(`ORCHESTRATOR DEFAULT: ${summary.roles.orchestrator?.selected || 'none available'}`);
  console.log(`DEVELOPER DEFAULT: ${summary.roles.developer?.selected || 'none available'}`);
  console.log(`SDET DEFAULT: ${summary.roles.sdet?.selected || 'none available'}`);
  console.log(`REVIEWER DEFAULT: ${summary.roles.reviewer?.selected || 'none available'}`);
  console.log('The launched window will delete its OpenCode session only if the target reaches complete status.');
}

function runTui(repoRoot, target, targetType, title, selectedModel, summary) {
  console.log(`Launching orchestrator TUI for ${target}`);
  console.log(`Session title: ${title}`);
  console.log(`Model: ${selectedModel}`);

  const result = spawnSync('opencode', [
    'run',
    '--title',
    title,
    '--model',
    selectedModel,
    '--command',
    'engineering/orchestrator',
    '--dir',
    repoRoot,
    target,
  ], {
    cwd: repoRoot,
    stdio: 'inherit',
    windowsHide: false,
    env: {
      ...process.env,
      ...buildWorkflowModelEnv(summary),
    },
  });

  const completed = targetIsComplete(repoRoot, target, targetType);
  const session = findSessionWithRetries(repoRoot, title);

  if (completed && session) {
    const deleted = deleteSession(repoRoot, session.id);
    if (deleted) {
      console.log(`Complete. Deleted OpenCode session ${session.id}.`);
    } else {
      console.log(`Complete, but failed to delete OpenCode session ${session.id}.`);
    }
  } else if (completed) {
    console.log(`Complete. No matching OpenCode session was found for title ${title}.`);
  } else if (session) {
    console.log(`Run did not reach complete state. Session preserved: ${session.id}.`);
  } else {
    console.log(`Run did not reach complete state. Session preserved under title ${title}.`);
  }

  if (result.error) {
    fail(`Failed to run opencode: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
}

const values = parseArgs(process.argv.slice(2));
const mode = values.mode || 'launch';
const repoRoot = path.resolve(values['repo-root'] || process.cwd());

ensureProjectRoot(repoRoot);

if (mode === 'list-models') {
  printModelSummary(repoRoot, values.format === 'json' ? 'json' : 'text');
  process.exit(0);
}

const target = values.target;
if (!target) fail('Missing required --target <PLAN-*|TICKET-*> argument.');

const targetType = validateTarget(target);
const title = values.title || buildTitle(target);
const { summary, selectedModel } = resolveSelectedModel(repoRoot, values.model);

ensureTargetExists(repoRoot, target, targetType);

if (mode === 'launch') {
  launchWindow(repoRoot, target, title, selectedModel, summary);
} else if (mode === 'run') {
  runTui(repoRoot, target, targetType, title, selectedModel, summary);
} else {
  fail(`Unsupported mode: ${mode}`);
}
