#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const generatedDirs = [
  '.opencode/logs/workflow-runs',
  '.opencode/state/worker-outputs',
  '.opencode/state/ticket-handoffs',
  '.opencode/state/exploration',
  '.opencode/state/bug-reports',
];

const activeStateFiles = [
  '.opencode/state/orchestrator-progress.json',
  '.opencode/state/ticket-progress.json',
  '.opencode/state/checkpoints.json',
  '.opencode/state/ticket-leases.json',
  '.opencode/state/runtime-slots.json',
  '.opencode/state/test-case-manifest.json',
  '.opencode/state/feature-manifest.json',
];

function parseArgs(argv) {
  const values = { apply: false, includeActiveState: false, json: false, help: false };
  for (const token of argv) {
    if (token === '--apply') values.apply = true;
    else if (token === '--include-active-state') values.includeActiveState = true;
    else if (token === '--json') values.json = true;
    else if (token === '--help' || token === '-h') values.help = true;
    else throw new Error(`Unknown option: ${token}`);
  }
  return values;
}

function usage() {
  return `Usage: node .opencode/scripts/cleanup-generated.mjs [--apply] [--include-active-state] [--json]

Dry-run by default. Removes generated workflow-run logs and worker handoff/output folders.
Active state JSON files are only removed with --include-active-state.`;
}

function rel(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function listDirectoryContents(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  return fs.readdirSync(absoluteDir).flatMap((entry) => {
    if (entry === '.gitkeep') return [];
    return [path.join(absoluteDir, entry)];
  });
}

function removeTarget(filePath) {
  fs.rmSync(filePath, { recursive: true, force: true });
}

function buildTargets(values) {
  const targets = [];

  for (const relativeDir of generatedDirs) {
    for (const filePath of listDirectoryContents(relativeDir)) {
      targets.push({ path: filePath, kind: 'generated-directory-entry' });
    }
  }

  if (values.includeActiveState) {
    for (const relativeFile of activeStateFiles) {
      const filePath = path.join(root, relativeFile);
      if (fs.existsSync(filePath)) targets.push({ path: filePath, kind: 'active-state-file' });
    }
  }

  return targets;
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    return;
  }

  const targets = buildTargets(values);
  if (values.apply) {
    for (const target of targets) removeTarget(target.path);
  }

  const report = {
    runner: 'cleanup-generated',
    mode: values.apply ? 'apply' : 'dry-run',
    includeActiveState: values.includeActiveState,
    removedCount: values.apply ? targets.length : 0,
    plannedCount: targets.length,
    targets: targets.map(target => ({ path: rel(target.path), kind: target.kind })),
    nextStep: values.apply
      ? 'Generated OpenCode files cleaned.'
      : 'Dry run only. Re-run with --apply to remove listed generated files.',
  };

  if (values.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Generated cleanup: ${report.mode}`);
    console.log(`Planned targets: ${report.plannedCount}`);
    for (const target of report.targets) console.log(`- ${target.path} (${target.kind})`);
    console.log(report.nextStep);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(2);
}
