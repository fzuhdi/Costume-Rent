#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { loadProjectConfig, KNOWN_WORKFLOW_MODES } from './lib/config.mjs';
import { gitCheckIgnored, gitTrackedPaths, runCapture } from './lib/git.mjs';
import { playwrightArtifactPaths } from './lib/playwright-artifacts.mjs';
import { isSafeRelativePath, repoRelative } from './lib/paths.mjs';

const root = process.cwd();

const requiredFiles = [
  '.opencode/project.json',
  '.opencode/project.example.json',
  '.opencode/opencode.json',
  '.opencode/scripts/workflow-runner.mjs',
  '.opencode/scripts/launch-parallel-plan.mjs',
  '.opencode/scripts/build-test-case-manifest.mjs',
  '.opencode/scripts/audit-opencode-portability.mjs',
  '.opencode/scripts/cleanup-generated.mjs',
  '.opencode/skills/orchestrator/SKILL.md',
  '.opencode/skills/orchestrator/REFERENCE.md',
  '.opencode/skills/shared/constraints.md',
  '.opencode/skills/shared/io-contract.md',
];

const ignoredArtifactPaths = [
  '.artifacts/',
  '.artifacts/playwright/test-results/',
  '.artifacts/playwright/html-report/',
  '.artifacts/playwright/screenshots/',
  '.artifacts/playwright-mcp/',
  '.artifacts/opencode/',
  '.playwright-mcp/',
  'test-results/',
  'playwright-report/',
  'test/test-results/',
  'test/playwright-report/',
  'test-results-fixture/',
  'playwright-report-fixture/',
  'test/test-results-fixture/',
  'test/playwright-report-fixture/',
];

function parseArgs(argv) {
  const values = { json: false, help: false };
  for (const token of argv) {
    if (token === '--json') values.json = true;
    else if (token === '--help' || token === '-h') values.help = true;
    else throw new Error(`Unknown option: ${token}`);
  }
  return values;
}

function usage() {
  return 'Usage: node .opencode/scripts/doctor.mjs [--json]';
}

function addCheck(report, name, status, detail = '') {
  report.checks.push({ name, status, detail });
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(root, ...relativePath.replace(/\\/g, '/').split('/')));
}

function validateRequiredFiles(report) {
  const missing = requiredFiles.filter(file => !pathExists(file));
  if (missing.length) {
    report.blockers.push(`Missing required OpenCode template files: ${missing.join(', ')}`);
    addCheck(report, 'required-files', 'failed', missing.join(', '));
  } else {
    addCheck(report, 'required-files', 'passed', `${requiredFiles.length} file(s)`);
  }
}

function validateConfig(report) {
  let loaded;
  try {
    loaded = loadProjectConfig(root);
  } catch (error) {
    report.blockers.push(`Invalid .opencode/project.json: ${error.message}`);
    addCheck(report, 'project-config', 'failed', error.message);
    return null;
  }

  const config = loaded.config;
  const modeErrors = config.workflow.enabled_modes
    .filter(mode => !KNOWN_WORKFLOW_MODES.has(mode))
    .map(mode => `unknown mode ${mode}`);

  if (modeErrors.length) {
    report.blockers.push(`Invalid workflow.enabled_modes: ${modeErrors.join(', ')}`);
    addCheck(report, 'workflow-modes', 'failed', modeErrors.join(', '));
  } else {
    addCheck(report, 'workflow-stages-policies', 'passed', `stages=${[...config.workflow.product_stages, ...config.workflow.internal_stages].join(',')}; policies=${config.workflow.quality_policies.join(',')}; legacy_modes=${config.workflow.enabled_modes.join(',')}`);
  }

  const pathFields = [
    ...Object.values(config.docs),
    ...Object.values(config.artifacts.playwright),
    config.artifacts.root,
    config.artifacts.playwright_mcp,
    config.artifacts.opencode,
    ...(config.code_roots || []),
    ...(config.test_roots || []),
  ];
  const unsafePaths = pathFields.filter(value => !isSafeRelativePath(value));
  if (unsafePaths.length) {
    report.blockers.push(`Project adapter contains unsafe relative path(s): ${unsafePaths.join(', ')}`);
    addCheck(report, 'adapter-paths', 'failed', unsafePaths.join(', '));
  } else {
    addCheck(report, 'adapter-paths', 'passed', 'relative project paths only');
  }

  const adapterDocs = Object.values(config.docs).filter(value => (
    value === '.opencode'
    || value.startsWith('.opencode/')
    || value === '.codex'
    || value.startsWith('.codex/')
  ));
  if (adapterDocs.length) {
    report.blockers.push(`Durable docs must live under the project docs root, not workflow adapters: ${adapterDocs.join(', ')}`);
    addCheck(report, 'docs-placement', 'failed', adapterDocs.join(', '));
  } else {
    addCheck(report, 'docs-placement', 'passed', `${config.docs.root}/`);
  }

  const forbiddenGeneratedDocDirs = ['.opencode/generated', '.codex/generated'];
  const presentGeneratedDocDirs = forbiddenGeneratedDocDirs.filter(pathExists);
  if (presentGeneratedDocDirs.length) {
    report.blockers.push(`Generated-doc directories are not allowed under workflow adapters: ${presentGeneratedDocDirs.join(', ')}`);
    addCheck(report, 'adapter-generated-docs', 'failed', presentGeneratedDocDirs.join(', '));
  } else {
    addCheck(report, 'adapter-generated-docs', 'passed', 'none');
  }

  const artifacts = playwrightArtifactPaths(config, root);
  report.project = {
    name: config.project?.name || null,
    schemaVersion: config.schema_version || null,
    docs: config.docs,
    workflow: config.workflow,
    artifacts: Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, repoRelative(root, value)])),
  };

  return config;
}

function validateIgnoredArtifacts(report) {
  const missingIgnores = [];
  for (const artifactPath of ignoredArtifactPaths) {
    if (!gitCheckIgnored(root, artifactPath)) missingIgnores.push(artifactPath);
  }

  if (missingIgnores.length) {
    report.blockers.push(`Generated artifact paths are not ignored: ${missingIgnores.join(', ')}`);
    addCheck(report, 'artifact-ignores', 'failed', missingIgnores.join(', '));
  } else {
    addCheck(report, 'artifact-ignores', 'passed', `${ignoredArtifactPaths.length} path(s)`);
  }

  const tracked = new Set([...gitTrackedPaths(root)].filter(file => pathExists(file)));
  const trackedGenerated = [...tracked].filter(file => (
    file.startsWith('.artifacts/')
    || file.startsWith('.playwright-mcp/')
    || file.startsWith('test/test-results/')
    || file.startsWith('test/playwright-report/')
    || file.startsWith('test-results/')
    || file.startsWith('playwright-report/')
  ));

  if (trackedGenerated.length) {
    report.warnings.push(`Generated-looking paths are tracked and will be skipped by cleanup-generated: ${trackedGenerated.join(', ')}`);
    addCheck(report, 'tracked-generated-artifacts', 'warning', `${trackedGenerated.length} tracked path(s)`);
  } else {
    addCheck(report, 'tracked-generated-artifacts', 'passed', 'none');
  }
}

function validatePortability(report) {
  const result = runCapture(process.execPath, ['.opencode/scripts/audit-opencode-portability.mjs', '--json'], { cwd: root });
  if (!result.ok) {
    report.blockers.push(`Portability audit failed: ${(result.stderr || result.stdout).trim()}`);
    addCheck(report, 'portability-audit', 'failed', `exit ${result.status}`);
    return;
  }

  try {
    const audit = JSON.parse(result.stdout);
    if (audit.findingCount) {
      report.blockers.push(`Portability audit reported ${audit.findingCount} finding(s).`);
      addCheck(report, 'portability-audit', 'failed', `${audit.findingCount} finding(s)`);
    } else {
      addCheck(report, 'portability-audit', 'passed', `${audit.scannedFiles} file(s)`);
    }
  } catch (error) {
    report.blockers.push(`Portability audit returned invalid JSON: ${error.message}`);
    addCheck(report, 'portability-audit', 'failed', 'invalid JSON');
  }
}

function buildReport() {
  const report = {
    runner: 'doctor',
    outcome: 'success',
    blockers: [],
    warnings: [],
    checks: [],
    project: null,
    nextStep: null,
  };

  validateRequiredFiles(report);
  validateConfig(report);
  validateIgnoredArtifacts(report);
  validatePortability(report);

  if (report.blockers.length) {
    report.outcome = 'blocked';
    report.nextStep = 'Fix doctor blockers before copying this .opencode template to another project.';
  } else {
    report.nextStep = 'Template checks passed. Copy .opencode with project.example.json as the starting adapter for new projects.';
  }

  return report;
}

function printText(report) {
  console.log('OpenCode Template Doctor');
  console.log(`OUTCOME: ${report.outcome}`);
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
}

try {
  const values = parseArgs(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    process.exit(0);
  }

  const report = buildReport();
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else printText(report);
  process.exit(report.blockers.length ? 1 : 0);
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(2);
}
