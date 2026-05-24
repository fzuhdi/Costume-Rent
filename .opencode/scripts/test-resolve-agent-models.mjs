#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, '.opencode', 'scripts', 'resolve-agent-models.mjs');

function fail(message, details = '') {
  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function readAgentModel(fixtureRoot, role) {
  const text = fs.readFileSync(path.join(fixtureRoot, '.opencode', 'agents', `${role}.md`), 'utf8');
  return (text.match(/^model:\s*(\S+)/m) || [])[1] || null;
}

function runResolver(fixtureRoot, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: fixtureRoot,
    env: {
      ...process.env,
      RESOLVE_AGENT_MODELS_AVAILABLE: [
        'opencode/big-pickle',
        'openai/gpt-5.3-codex',
        'openai/gpt-5.5',
      ].join('\n'),
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  });
}

function parseJson(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail('resolver output was not JSON', `${result.stdout}\n${result.stderr}`);
  }
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-agent-models-'));

try {
  writeFile(path.join(fixtureRoot, '.opencode', 'workflow-models.json'), JSON.stringify({
    schemaVersion: 1,
    roles: {
      developer: ['opencode/big-pickle'],
      sdet: ['opencode/big-pickle'],
      orchestrator: ['opencode/big-pickle'],
      reviewer: ['opencode/big-pickle'],
    },
  }, null, 2));

  writeFile(path.join(fixtureRoot, '.opencode', 'model-capabilities.md'), [
    '# Model Capabilities',
    '',
    '| Model | Primary | Secondary | Best Roles | Notes |',
    '|---|---|---|---|---|',
    '| `opencode/big-pickle` | reasoning | general | orchestrator, reviewer | default |',
    '| `openai/gpt-5.3-codex` | coding | reasoning | developer, sdet | coding |',
    '| `openai/gpt-5.5` | general | reasoning | orchestrator, reviewer | broad |',
    '',
  ].join('\n'));

  for (const role of ['developer', 'sdet', 'orchestrator', 'reviewer']) {
    writeFile(path.join(fixtureRoot, '.opencode', 'agents', `${role}.md`), [
      '---',
      `${role === 'sdet' ? 'description: SDET' : `description: ${role}`}`,
      'mode: subagent',
      'model: opencode/big-pickle',
      '---',
      '',
      `${role} body`,
      '',
    ].join('\n'));
  }

  const dryRun = runResolver(fixtureRoot, [
    '--dry-run',
    '--json',
    '--roles', 'developer',
    '--set', 'developer=openai/gpt-5.3-codex',
  ]);
  if (dryRun.status !== 0) fail('dry-run override failed', `${dryRun.stdout}\n${dryRun.stderr}`);
  const dryRunReport = parseJson(dryRun);
  if (dryRunReport.mode !== 'dry-run') fail('dry-run mode was not reported', dryRun.stdout);
  if (dryRunReport.resolved.developer.overrideModel !== 'openai/gpt-5.3-codex') fail('override model missing from dry-run report', dryRun.stdout);
  if (dryRunReport.resolved.developer.targetModel !== 'openai/gpt-5.3-codex') fail('target model missing from dry-run report', dryRun.stdout);
  if (readAgentModel(fixtureRoot, 'developer') !== 'opencode/big-pickle') fail('dry-run modified the developer agent');

  const writeRun = runResolver(fixtureRoot, [
    '--write',
    '--json',
    '--roles', 'developer',
    '--set', 'developer=openai/gpt-5.3-codex',
  ]);
  if (writeRun.status !== 0) fail('write override failed', `${writeRun.stdout}\n${writeRun.stderr}`);
  const writeReport = parseJson(writeRun);
  if (writeReport.modified[0]?.status !== 'updated') fail('write override did not report update', writeRun.stdout);
  if (!writeReport.notes.includes('Agent frontmatter updated. OpenCode restart required.')) fail('write update did not report restart requirement', writeRun.stdout);
  if (readAgentModel(fixtureRoot, 'developer') !== 'openai/gpt-5.3-codex') fail('write override did not update the developer model');

  const noOpWrite = runResolver(fixtureRoot, [
    '--write',
    '--json',
    '--roles', 'developer',
  ]);
  if (noOpWrite.status !== 0) fail('no-op write failed', `${noOpWrite.stdout}\n${noOpWrite.stderr}`);
  const noOpReport = parseJson(noOpWrite);
  if (noOpReport.modified[0]?.status !== 'unchanged') fail('no-op write did not report unchanged', noOpWrite.stdout);
  if (noOpReport.notes.some(note => note.includes('Read-only'))) fail('write no-op was mislabeled read-only', noOpWrite.stdout);

  const invalidModel = runResolver(fixtureRoot, [
    '--dry-run',
    '--json',
    '--roles', 'developer',
    '--set', 'developer=missing/model',
  ]);
  if (invalidModel.status === 0) fail('unavailable override model should fail');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('resolve-agent-models override tests passed');
