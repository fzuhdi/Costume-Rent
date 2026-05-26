#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const opencodeRoot = path.join(root, '.opencode');
const adapterFile = '.opencode/project.json';
const projectConfig = loadProjectConfig();
const projectName = path.basename(root);

const ignoredPrefixes = [
  '.opencode/state/',
  '.opencode/logs/',
  '.opencode/node_modules/',
  '.opencode/state.example/',
];

const ignoredFiles = new Set([
  '.opencode/package-lock.json',
  '.opencode/.gitignore',
]);

const textExtensions = new Set(['.md', '.mjs', '.js', '.json', '.jsonc', '.yml', '.yaml', '.txt']);

const globalRules = [
  {
    code: 'absolute-local-path',
    message: 'Machine-local absolute path found in reusable OpenCode file.',
    regex: /(?:[A-Za-z]:[\\/](?:Users|Documents|OneDrive)[^\s'"`)\]]*|\/Users\/[^\s'"`)\]]*|\/home\/[^\s'"`)\]]*)/,
  },
  {
    code: 'machine-workspace-root',
    message: 'Machine/project-specific workspace root found; use derived ../<project-name>-workspaces instead.',
    regex: new RegExp(`${escapeRegExp(projectName)}-workspaces`),
  },
  {
    code: 'legacy-opencode-knowledge-path',
    message: 'Project knowledge should live under docs/*, not legacy OpenCode knowledge paths.',
    regex: new RegExp(`\\.${'opencode'}[\\\\/]${'knowledge'}|\\.${'opencode'}/${'knowledge'}`),
  },
];

const reusableOnlyRules = (projectConfig.portability_audit?.forbidden_reusable_patterns || [])
  .map((pattern, index) => ({
    code: `adapter-forbidden-pattern-${index + 1}`,
    message: 'Adapter-declared project pattern found outside the adapter; move project knowledge to docs/* or adapter config.',
    regex: new RegExp(pattern),
  }));

function loadProjectConfig() {
  const file = path.join(root, adapterFile);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
  return 'Usage: node .opencode/scripts/audit-opencode-portability.mjs [--json]';
}

function normalize(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function shouldIgnore(relativePath) {
  if (ignoredFiles.has(relativePath)) return true;
  return ignoredPrefixes.some(prefix => relativePath.startsWith(prefix));
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalize(fullPath);
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && isTextFile(fullPath)) files.push(fullPath);
  }
  return files;
}

function scanFile(filePath) {
  const relativePath = normalize(filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const rules = relativePath === adapterFile
    ? globalRules
    : [...globalRules, ...reusableOnlyRules];
  const findings = [];

  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      if (rule.regex.test(line)) {
        findings.push({ file: relativePath, line: index + 1, code: rule.code, message: rule.message, text: line.trim() });
      }
    }
  }

  return findings;
}

function main() {
  const values = parseArgs(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    return;
  }

  const files = walk(opencodeRoot);
  const findings = files.flatMap(scanFile);
  const report = {
    runner: 'audit-opencode-portability',
    scannedFiles: files.length,
    findingCount: findings.length,
    findings,
    ignored: [...ignoredPrefixes, ...ignoredFiles],
  };

  if (values.json) console.log(JSON.stringify(report, null, 2));
  else if (!findings.length) {
    console.log(`OpenCode portability audit passed (${files.length} file(s) scanned).`);
  } else {
    console.error(`OpenCode portability audit failed with ${findings.length} finding(s).`);
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} [${finding.code}] ${finding.text}`);
    }
  }

  if (findings.length) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(2);
}
