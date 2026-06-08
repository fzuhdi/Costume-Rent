#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gitTrackedPaths } from './lib/git.mjs';
import { toPosixPath } from './lib/paths.mjs';

const root = process.cwd();

const generatedRoots = [
  '.artifacts',
  '.playwright-mcp',
  'test-results',
  'playwright-report',
  'test/test-results',
  'test/playwright-report',
  '.opencode/logs/workflow-runs',
  '.opencode/state/worker-outputs',
  '.opencode/state/ticket-handoffs',
  '.opencode/state/exploration',
  '.opencode/state/bug-reports',
];

const generatedNamePrefixes = [
  { dir: '.', prefixes: ['test-results-', 'playwright-report-'] },
  { dir: 'test', prefixes: ['test-results-', 'playwright-report-'] },
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

Dry-run by default. Reports generated Playwright, Playwright MCP, and OpenCode workflow artifacts.
--apply deletes only untracked generated files/directories. Tracked files and source folders are never deleted.`;
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, ...toPosixPath(relativePath).split('/')));
}

function abs(relativePath) {
  return path.join(root, ...toPosixPath(relativePath).split('/'));
}

function children(relativePath) {
  const dir = abs(relativePath);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs.readdirSync(dir)
    .filter(entry => entry !== '.gitkeep')
    .map(entry => toPosixPath(path.posix.join(relativePath, entry)));
}

function discoverPrefixedRoots() {
  const roots = [];
  for (const group of generatedNamePrefixes) {
    const dir = abs(group.dir);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (group.prefixes.some(prefix => entry.startsWith(prefix))) {
        roots.push(toPosixPath(path.posix.join(group.dir, entry)).replace(/^\.\//, ''));
      }
    }
  }
  return roots;
}

function hasTrackedDescendant(relativePath, tracked) {
  const normalized = `${toPosixPath(relativePath).replace(/\/+$/, '')}/`;
  return [...tracked].some(item => item === relativePath || item.startsWith(normalized));
}

function buildGeneratedTargets(tracked) {
  const candidates = [...generatedRoots, ...discoverPrefixedRoots()].filter(exists);
  const targets = [];
  const skippedTracked = [];

  for (const candidate of candidates) {
    if (!hasTrackedDescendant(candidate, tracked)) {
      targets.push({ path: candidate, kind: 'generated-root' });
      continue;
    }

    for (const child of children(candidate)) {
      if (hasTrackedDescendant(child, tracked)) {
        skippedTracked.push({ path: child, reason: 'tracked file or tracked descendant' });
      } else {
        targets.push({ path: child, kind: 'generated-root-entry' });
      }
    }

    if (!children(candidate).length) {
      skippedTracked.push({ path: candidate, reason: 'tracked generated root' });
    }
  }

  return { targets, skippedTracked };
}

function buildActiveStateTargets(values, tracked) {
  if (!values.includeActiveState) return { targets: [], skippedTracked: [] };
  const targets = [];
  const skippedTracked = [];

  for (const relativeFile of activeStateFiles) {
    if (!exists(relativeFile)) continue;
    if (tracked.has(relativeFile)) skippedTracked.push({ path: relativeFile, reason: 'tracked active state file' });
    else targets.push({ path: relativeFile, kind: 'active-state-file' });
  }

  return { targets, skippedTracked };
}

function removeTarget(relativePath) {
  fs.rmSync(abs(relativePath), { recursive: true, force: true });
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    return;
  }

  const tracked = new Set([...gitTrackedPaths(root)].filter(file => fs.existsSync(abs(file))));
  const generated = buildGeneratedTargets(tracked);
  const activeState = buildActiveStateTargets(values, tracked);
  const targets = [...generated.targets, ...activeState.targets];
  const skippedTracked = [...generated.skippedTracked, ...activeState.skippedTracked];

  if (values.apply) {
    for (const target of targets) removeTarget(target.path);
  }

  const report = {
    runner: 'cleanup-generated',
    mode: values.apply ? 'apply' : 'dry-run',
    includeActiveState: values.includeActiveState,
    removedCount: values.apply ? targets.length : 0,
    plannedCount: targets.length,
    skippedTrackedCount: skippedTracked.length,
    targets,
    skippedTracked,
    nextStep: values.apply
      ? 'Untracked generated files cleaned; tracked files were left untouched.'
      : 'Dry run only. Re-run with --apply to remove listed untracked generated files.',
  };

  if (values.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Generated cleanup: ${report.mode}`);
    console.log(`Planned targets: ${report.plannedCount}`);
    for (const target of report.targets) console.log(`- ${target.path} (${target.kind})`);
    if (report.skippedTracked.length) {
      console.log('Tracked generated-looking paths skipped:');
      for (const skipped of report.skippedTracked) console.log(`- ${skipped.path} (${skipped.reason})`);
    }
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
