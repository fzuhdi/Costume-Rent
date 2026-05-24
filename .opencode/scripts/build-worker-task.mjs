#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';

const ticketPattern = /^TICKET-\d{8}-\d{3}$/;

function parseArgs(argv) {
  const values = {
    role: null,
    mode: null,
    ticketId: null,
    testCaseId: null,
    worktreeRoot: null,
    planId: null,
    ticketFile: null,
    ticketType: null,
    branch: null,
    baseBranch: null,
    testInterface: null,
    redArtifacts: null,
    explorationMemo: null,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') {
      values.json = true;
      continue;
    }
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const [key, inline] = token.split('=', 2);
    const next = inline ?? argv[i + 1];
    if (inline === undefined) i += 1;
    if (!next || next.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (key === '--role') values.role = next;
    else if (key === '--mode') values.mode = next;
    else if (key === '--ticket-id') values.ticketId = next;
    else if (key === '--test-case-id') values.testCaseId = next;
    else if (key === '--worktree-root') values.worktreeRoot = next;
    else if (key === '--plan-id') values.planId = next;
    else if (key === '--ticket-file') values.ticketFile = next;
    else if (key === '--ticket-type') values.ticketType = next;
    else if (key === '--branch') values.branch = next;
    else if (key === '--base-branch') values.baseBranch = next;
    else if (key === '--test-interface') values.testInterface = next;
    else if (key === '--red-artifacts') values.redArtifacts = next;
    else if (key === '--exploration-memo') values.explorationMemo = next;
    else throw new Error(`Unknown option: ${key}`);
  }
  return values;
}

function usage() {
  return 'Usage: node .opencode/scripts/build-worker-task.mjs --role sdet|developer|reviewer|explore --mode red|green|final-review|explore --ticket-id TICKET-* --test-case-id ID --worktree-root <path> [context options] [--json]';
}

function validate(values) {
  if (!['sdet', 'developer', 'reviewer', 'explore'].includes(values.role)) throw new Error('role must be one of sdet|developer|reviewer|explore');
  if (!values.mode) throw new Error('mode is required');
  if (!values.ticketId || !ticketPattern.test(values.ticketId)) throw new Error('ticket-id must match TICKET-YYYYMMDD-NNN');
  if (!values.testCaseId) throw new Error('test-case-id is required');
  if (!values.worktreeRoot) throw new Error('worktree-root is required');
  const modeByRole = {
    sdet: new Set(['red']),
    developer: new Set(['green', 'refactor']),
    reviewer: new Set(['ticket-audit', 'red-arbitrate', 'already-green-audit', 'final-review']),
    explore: new Set(['explore']),
  };
  if (!modeByRole[values.role]?.has(values.mode)) {
    throw new Error(`mode ${values.mode} is not valid for role ${values.role}`);
  }
}

function buildPrompt(values) {
  const agentLoad = values.role === 'explore'
    ? 'Use the built-in explore subagent contract for read-only implementation discovery.'
    : `Load .opencode/agents/${values.role}.md and follow its contract.`;
  return [
    agentLoad,
    `MODE: ${values.mode}`,
    `WORKTREE_ROOT: ${path.resolve(values.worktreeRoot)}`,
    `TICKET_ID: ${values.ticketId}`,
    `TEST_CASE_ID: ${values.testCaseId}`,
    values.planId ? `PLAN_ID: ${values.planId}` : null,
    values.ticketFile ? `TICKET_FILE: ${values.ticketFile}` : `TICKET_FILE: docs/tickets/${values.ticketId}.md`,
    values.ticketType ? `TICKET_TYPE: ${values.ticketType}` : null,
    values.branch ? `BRANCH: ${values.branch}` : null,
    values.baseBranch ? `BASE_BRANCH: ${values.baseBranch}` : null,
    values.testInterface ? `TEST_INTERFACE: ${values.testInterface}` : 'TEST_INTERFACE: manifest-resolved targeted test interface from .opencode/state/test-case-manifest.json',
    'TICKET_ACCEPTANCE_CRITERION: read from TICKET_FILE and .opencode/state/test-case-manifest.json for TEST_CASE_ID',
    'EXPECTED_OUTCOME: read from .opencode/state/test-case-manifest.json for TEST_CASE_ID',
    'RED_EXPECTATION: produce or use the recorded failing acceptance evidence for TEST_CASE_ID',
    'GREEN_EXPECTATION: minimum implementation makes only TEST_CASE_ID pass without sibling scope',
    values.redArtifacts ? `RED_ARTIFACTS_FILE: ${values.redArtifacts}` : null,
    values.explorationMemo ? `EXPLORATION_MEMO_FILE: ${values.explorationMemo}` : null,
    values.redArtifacts || values.explorationMemo ? 'Artifact paths are caller-managed inputs. Read them only if present; do not create or overwrite .opencode/state artifacts from worker roles.' : null,
    '',
    'Run all file and shell operations under WORKTREE_ROOT.',
    'Return concise role output and include exact blocker if execution cannot proceed.',
  ].filter(Boolean).join('\n');
}

function buildTask(values) {
  const prompt = buildPrompt(values);
  return {
    subagent_type: values.role,
    description: `${values.role} ${values.mode} for ${values.ticketId}`,
    command: `/engineering/orchestrator ${values.ticketId}`,
    prompt,
  };
}

try {
  const values = parseArgs(process.argv.slice(2));
  validate(values);
  const task = buildTask(values);
  if (values.json) console.log(JSON.stringify(task, null, 2));
  else console.log(task.prompt);
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(2);
}
