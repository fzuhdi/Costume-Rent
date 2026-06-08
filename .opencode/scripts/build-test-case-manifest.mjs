#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { loadProjectConfig } from './lib/config.mjs';

const root = process.cwd();
const projectPath = path.join(root, '.opencode/project.json');
const manifestPath = path.join(root, '.opencode/state/test-case-manifest.json');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const idRe = /^[A-Z][A-Z0-9_]*-[0-9]{3}$/;
const statusSet = new Set(['draft', 'ready', 'covered', 'retired']);

function fail(messages) {
  for (const message of messages) console.error(message);
  process.exit(1);
}
function rel(file) { return path.relative(root, file).split(path.sep).join('/'); }
function isPortableRelative(file) { return file && !path.isAbsolute(file) && !/^[A-Za-z]:\//.test(file); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(fp));
    else out.push(fp);
  }
  return out;
}
function parseAcceptanceFile(file, project) {
  const text = fs.readFileSync(file, 'utf8');
  const featureId = Object.keys(project.features).find(id => rel(file).toLowerCase().endsWith(`${id.toLowerCase()}.md`));
  const sections = [];
  const re = /^##\s+([A-Z][A-Z0-9_]*-\d{3}):\s*(.+)$/gm;
  let m;
  while ((m = re.exec(text))) sections.push({ id: m[1], title: m[2].trim(), start: m.index, headerEnd: re.lastIndex });
  return sections.map((section, i) => {
    const body = text.slice(section.headerEnd, sections[i + 1]?.start ?? text.length);
    const field = name => body.match(new RegExp(`^${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim();
    return { test_case_id: section.id, title: section.title, feature_id: section.id.split('-')[0], file: rel(file), status: field('Status'), test_type: field('Test type'), criterion: field('Criterion'), expected_outcome: field('Expected outcome'), declared_feature_file: featureId };
  });
}
function scanTestTitles(project) {
  const matches = new Map();
  for (const feature of Object.values(project.features)) {
    for (const spec of feature.spec_files ?? []) {
      const abs = path.join(root, spec);
      if (!fs.existsSync(abs)) continue;
      const text = fs.readFileSync(abs, 'utf8');
      const titleRe = /test(?:\.\w+)?\(\s*['"`]([^'"`]*\[[A-Z][A-Z0-9_]*-\d{3}\][^'"`]*)['"`]/g;
      let m;
      while ((m = titleRe.exec(text))) {
        const ids = [...m[1].matchAll(/\[([A-Z][A-Z0-9_]*-\d{3})\]/g)].map(x => x[1]);
        if (ids.length === 1) {
          const list = matches.get(ids[0]) ?? [];
          list.push({ spec_file: spec, title: m[1] });
          matches.set(ids[0], list);
        }
      }
    }
  }
  return matches;
}
function runnerSpec(spec, project) {
  const normalized = spec.replace(/\\/g, '/');
  for (const rootDir of project.test_roots ?? []) {
    const prefix = `${rootDir.replace(/\\/g, '/').replace(/\/$/, '')}/`;
    if (normalized.startsWith(prefix)) return normalized.slice(prefix.length);
  }
  return normalized;
}
function renderCommand(template, values) {
  return template.replace(/\{([a-z_]+)\}/g, (_, key) => values[key] ?? '');
}

if (!fs.existsSync(projectPath)) fail([`Missing ${rel(projectPath)}`]);
const project = loadProjectConfig(root).config;
const errors = [];
for (const id of Object.keys(project.features ?? {})) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(id)) errors.push(`Invalid feature id: ${id}`);
  if (!project.test_types.includes(project.features[id].test_type)) errors.push(`Feature ${id} uses disallowed test type ${project.features[id].test_type}`);
}
const acceptanceDir = path.join(root, project.acceptance?.dir ?? 'docs/acceptance');
const cases = walk(acceptanceDir).filter(f => f.endsWith('.md')).flatMap(f => parseAcceptanceFile(f, project));
const byId = new Map();
for (const item of cases) {
  if (!idRe.test(item.test_case_id)) errors.push(`Invalid test_case_id: ${item.test_case_id}`);
  if (!project.features[item.feature_id]) errors.push(`Unknown feature prefix: ${item.test_case_id}`);
  if (item.declared_feature_file && item.declared_feature_file !== item.feature_id) errors.push(`${item.file} contains mismatched case ${item.test_case_id}`);
  if (!statusSet.has(item.status)) errors.push(`${item.test_case_id} has invalid status ${item.status}`);
  if (!project.test_types.includes(item.test_type)) errors.push(`${item.test_case_id} has disallowed test type ${item.test_type}`);
  if (!isPortableRelative(item.file)) errors.push(`${item.test_case_id} has non-portable acceptance path ${item.file}`);
  if (byId.has(item.test_case_id)) errors.push(`Duplicate test_case_id: ${item.test_case_id}`);
  byId.set(item.test_case_id, item);
}
const testMatches = scanTestTitles(project);
for (const item of cases) {
  const matches = testMatches.get(item.test_case_id) ?? [];
  if (item.status === 'covered' && matches.length !== 1) errors.push(`${item.test_case_id} status covered requires exactly one primary test title; found ${matches.length}`);
  if ((item.status === 'ready' || item.status === 'draft') && matches.length > 1) errors.push(`${item.test_case_id} has duplicate primary tests while ${item.status}`);
}
for (const [id, matches] of testMatches) {
  if (!byId.has(id)) errors.push(`Test title references missing acceptance case ${id}`);
  if (matches.length !== 1) errors.push(`Test case ${id} appears in ${matches.length} primary titles`);
}
if (errors.length) fail(errors);
const manifestCases = Object.fromEntries(cases.map(item => {
  const feature = project.features[item.feature_id] ?? {};
  const specFiles = feature.spec_files ?? [];
  const runnerSpecFiles = specFiles.map(spec => runnerSpec(spec, project));
  const values = {
    test_case_id: item.test_case_id,
    spec_file: specFiles[0] ?? '',
    spec_files: specFiles.join(' '),
    test_runner_spec_file: runnerSpecFiles[0] ?? '',
    test_runner_spec_files: runnerSpecFiles.join(' '),
  };
  return [item.test_case_id, {
    ...item,
    spec_files: specFiles,
    test_runner_spec_files: runnerSpecFiles,
    test_command: renderCommand(project.commands?.test_case ?? '', values),
    tests: testMatches.get(item.test_case_id) ?? [],
  }];
}));
const manifest = { _meta: { generatedAt: new Date().toISOString(), projectAdapter: '.opencode/project.json', acceptanceDir: project.acceptance.dir, schema_version: 1 }, project: project.project, features: project.features, test_cases: manifestCases };
const next = `${JSON.stringify(manifest, null, 2)}\n`;
if (checkOnly) {
  if (!fs.existsSync(manifestPath)) fail([`STALE: ${rel(manifestPath)} missing`]);
  const current = fs.readFileSync(manifestPath, 'utf8');
  const comparable = JSON.parse(current); delete comparable._meta.generatedAt;
  const expected = JSON.parse(next); delete expected._meta.generatedAt;
  if (JSON.stringify(comparable) !== JSON.stringify(expected)) fail([`STALE: ${rel(manifestPath)} differs from generated content`]);
  console.log('FRESH');
} else {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, next);
  console.log(`Wrote ${rel(manifestPath)} with ${cases.length} test cases.`);
}
