#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

function findRepoRoot(start) {
  let current = start;

  while (true) {
    if (fs.existsSync(path.join(current, 'AGENTS.md')) && fs.existsSync(path.join(current, '.git'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return start;
    current = parent;
  }
}

const root = findRepoRoot(cwd);

const rules = [
  {
    id: 'QG001',
    severity: 'error',
    description: 'Acceptance specs must not be skipped or marked fixme.',
    include: ['test/specs/**/*.js'],
    patterns: [
      /\btest\.skip\s*\(/,
      /\btest\.describe\.skip\s*\(/,
      /(?:^|[^\w.])describe\.skip\s*\(/,
      /\btest\.fixme\s*\(/,
    ],
    remediation: 'Leave product gaps as honest failures or create a product ticket; do not hide acceptance coverage.',
  },
  {
    id: 'QG002',
    severity: 'error',
    description: 'Committed tests must not contain focused .only calls.',
    include: ['test/**/*.js'],
    patterns: [/\.(?:only)\s*\(/],
    remediation: 'Remove .only so the full intended scope runs.',
  },
  {
    id: 'QG003',
    severity: 'error',
    description: 'Assertions must not use pass-through truthiness escape hatches.',
    include: ['test/**/*.js'],
    patterns: [
      /expect\s*\([^\n)]*\|\|\s*true[^\n)]*\)/,
      /expect\s*\([^\n)]*&&\s*false[^\n)]*\)/,
      /\|\|\s*true\s*\)\s*\.to(?:Be|Equal|BeTruthy|Contain|Have)/,
    ],
    remediation: 'Assert the real acceptance outcome or leave the test failing for the product gap.',
  },
  {
    id: 'QG004',
    severity: 'error',
    description: 'Tests must not pass by swallowing failures with true/null fallbacks.',
    include: ['test/**/*.js'],
    patterns: [
      /catch\s*\(\s*\(\s*\)\s*=>\s*true\s*\)/,
      /catch\s*\(\s*\(\s*\)\s*=>\s*null\s*\)/,
      /catch\s*\(\s*\(\s*\)\s*=>\s*undefined\s*\)/,
    ],
    remediation: 'Use explicit conditional behavior only when it preserves the AC; otherwise let failures surface.',
  },
  {
    id: 'QG005',
    severity: 'error',
    description: 'Test package scripts must not mask Playwright failures with || true.',
    include: ['test/package.json'],
    patterns: [/playwright test[^\n"]*\|\|\s*true/],
    remediation: 'Run Playwright as a strict command; move failure-log syncing to a separate script or chain only on failure explicitly.',
  },
  {
    id: 'QG006',
    severity: 'error',
    description: 'Console guards must not broadly ignore server/network failures.',
    include: ['test/fixtures.js'],
    patterns: [
      /includes\(['"]500['"]\)/,
      /includes\(['"]Failed to fetch['"]\)/,
      /includes\(['"]NetworkError['"]\)/,
    ],
    remediation: 'Scope expected failures to a specific test or fix the product/API behavior.',
  },
  {
    id: 'QG007',
    severity: 'error',
    description: 'Global axe suppressions must not disable semantic/name/ARIA integrity rules.',
    include: ['test/fixtures.js'],
    patterns: [
      /['"]link-name['"]/,
      /['"]button-name['"]/,
      /['"]label['"]/,
      /['"]aria-valid-attr['"]/,
      /['"]aria-required-children['"]/,
      /['"]aria-required-parent['"]/,
      /['"]aria-required-attr['"]/,
      /['"]aria-allowed-role['"]/,
      /['"]aria-prohibited-attr['"]/,
      /['"]nested-interactive['"]/,
      /['"]landmark-one-main['"]/,
      /['"]page-has-heading-one['"]/,
      /['"]region['"]/,
    ],
    remediation: 'Fix accessibility issues or scope a known product bug to a ticket; do not blind the global guard.',
  },
  {
    id: 'QG009',
    severity: 'error',
    description: 'Acceptance tests must not perform destructive global cleanup.',
    include: ['test/**/*.js'],
    patterns: [
      /\btruncate\b/i,
      /\bdrop\s+table\b/i,
      /\bdeleteAll\b/,
      /\bresetDatabase\b/,
      /\bclearDatabase\b/,
      /\/__test\/reset/,
    ],
    remediation: 'Use additive self-owned test data. Clean-state tests require explicit serial UI cleanup policy approval.',
  },
  {
    id: 'QG010',
    severity: 'error',
    description: 'Upload tests must use committed image fixtures, not fake buffers or runtime upload files.',
    include: ['test/**/*.js'],
    patterns: [
      /uploadImages\s*\([\s\S]*?Buffer\.alloc\s*\(/,
      /setInputFiles\s*\([\s\S]*?Buffer\.alloc\s*\(/,
      /backend\/uploads/,
      /backend\\uploads/,
    ],
    remediation: 'Use files from test/fixtures/images/ as upload inputs.',
  },
  {
    id: 'QG011',
    severity: 'error',
    description: 'Test-created data must use E2E_ or API_ namespace prefixes.',
    include: ['test/specs/**/*.js'],
    patterns: [
      /name:\s*['"](?!(?:E2E|API)_)[^'"]*(?:Test|Updated|Duplicate)[^'"]*['"]\s*\+\s*Date\.now\s*\(/,
      /const\s+\w+\s*=\s*['"](?!(?:E2E|API)_)[^'"]*(?:Test|Updated|Duplicate|Auto)[^'"]*['"]\s*\+\s*Date\.now\s*\(/,
    ],
    remediation: 'Name created test data as E2E_<FEATURE>_<AC>_<PURPOSE>_<TIMESTAMP> or API_<FEATURE>_<AC>_<PURPOSE>_<TIMESTAMP>.',
  },
  {
    id: 'QG012',
    severity: 'error',
    description: 'Tests must not delete arbitrary first-row/shared data.',
    include: ['test/specs/**/*.js'],
    patterns: [
      /deleteClient\s*\(\s*firstName/,
      /clickFirstCostume\s*\(\)[\s\S]{0,300}dialog\.accept\s*\(/,
      /clickFirstCostume\s*\(\)[\s\S]{0,500}deleteButtons\.first\s*\(\)\.click\s*\(/,
      /clickFirstRental\s*\(\)[\s\S]{0,300}dialog\.accept\s*\(/,
    ],
    remediation: 'Create a uniquely named E2E_ record first, locate that exact record, then delete only that record.',
  },
];

const rootDebugArtifacts = [
  /^login-page-snapshot\.md$/,
  /^settings-page-snapshot\.md$/,
  /^.*-snapshot\.md$/,
  /^.*-debug\.md$/,
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = toPosix(path.relative(root, full));

    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'test-results', 'dist', 'build'].includes(entry.name)) continue;
      files.push(...walk(full));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }

  return files;
}

function globToRegExp(glob) {
  let out = '^';

  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    const next = glob[i + 1];

    if (char === '*' && next === '*') {
      const after = glob[i + 2];
      if (after === '/') {
        out += '(?:.*/)?';
        i += 2;
      } else {
        out += '.*';
        i += 1;
      }
      continue;
    }

    if (char === '*') {
      out += '[^/]*';
      continue;
    }

    out += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }

  return new RegExp(`${out}$`);
}

const allFiles = walk(root);

function includedFiles(patterns) {
  const matchers = patterns.map(globToRegExp);
  return allFiles.filter((file) => matchers.some((matcher) => matcher.test(file)));
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const findings = [];
const seenFindings = new Set();

function addFinding(finding) {
  const key = `${finding.rule.id}\0${finding.file}\0${finding.line}`;
  if (seenFindings.has(key)) return;
  seenFindings.add(key);
  findings.push(finding);
}

for (const rule of rules) {
  for (const file of includedFiles(rule.include)) {
    const absolute = path.join(root, file);
    const content = fs.readFileSync(absolute, 'utf8');

    for (const pattern of rule.patterns) {
      const matcher = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      const matches = content.matchAll(matcher);

      for (const match of matches) {
        addFinding({
          rule,
          file,
          line: lineNumberFor(content, match.index),
          text: match[0].trim(),
        });
      }
    }
  }
}

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!rootDebugArtifacts.some((pattern) => pattern.test(entry.name))) continue;

  addFinding({
    rule: {
      id: 'QG008',
      severity: 'error',
      description: 'Generated debug snapshots must not live at the repo root.',
      remediation: 'Delete the artifact or move intentional fixtures under a tracked fixture directory with documentation.',
    },
    file: entry.name,
    line: 1,
    text: entry.name,
  });
}

if (findings.length > 0) {
  console.error(`quality-gate: failed with ${findings.length} finding(s)\n`);

  for (const finding of findings) {
    console.error(`${finding.rule.id} ${finding.file}:${finding.line}`);
    console.error(`  ${finding.rule.description}`);
    console.error(`  Matched: ${finding.text}`);
    console.error(`  Fix: ${finding.rule.remediation}\n`);
  }

  process.exit(1);
}

console.log('quality-gate: passed');
